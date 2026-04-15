"""
Google Drive Sync — fetches all documents from your Drive,
extracts text, and stores them in ChromaDB vector memory
so Aegis can answer questions about them.

Setup:
1. Go to https://console.cloud.google.com
2. Enable Google Drive API
3. Create OAuth2 credentials (Desktop app) → download as credentials.json
4. Place credentials.json in backend/
5. Run: python drive_sync.py  (first run opens browser for auth)
"""
import os
import io
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import chromadb
from chromadb.utils import embedding_functions

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDS_FILE = os.path.join(os.path.dirname(__file__), 'credentials.json')
TOKEN_FILE  = os.path.join(os.path.dirname(__file__), 'token.json')
CHROMA_DIR  = os.getenv('CHROMA_PERSIST_DIR', './chroma_db')

# Supported MIME types and how to export them
EXPORT_MAP = {
    'application/vnd.google-apps.document':     ('text/plain', '.txt'),
    'application/vnd.google-apps.spreadsheet':  ('text/csv',   '.csv'),
    'application/vnd.google-apps.presentation': ('text/plain', '.txt'),
    'application/pdf':                           (None,         '.pdf'),
    'text/plain':                                (None,         '.txt'),
    'text/csv':                                  (None,         '.csv'),
}

def get_drive_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as f:
            f.write(creds.to_json())
    return build('drive', 'v3', credentials=creds)

def list_all_files(service):
    files = []
    page_token = None
    query = " or ".join([f"mimeType='{m}'" for m in EXPORT_MAP.keys()])
    while True:
        resp = service.files().list(
            q=query,
            spaces='drive',
            fields='nextPageToken, files(id, name, mimeType, modifiedTime)',
            pageToken=page_token,
            pageSize=100,
        ).execute()
        files.extend(resp.get('files', []))
        page_token = resp.get('nextPageToken')
        if not page_token:
            break
    return files

def extract_text(service, file) -> str:
    mime = file['mimeType']
    fid  = file['id']

    try:
        if mime.startswith('application/vnd.google-apps'):
            export_mime, _ = EXPORT_MAP[mime]
            req = service.files().export_media(fileId=fid, mimeType=export_mime)
        else:
            req = service.files().get_media(fileId=fid)

        buf = io.BytesIO()
        downloader = MediaIoBaseDownload(buf, req, chunksize=512*1024)
        done = False
        size = 0
        while not done:
            _, done = downloader.next_chunk()
            size = buf.tell()
            if size > 5 * 1024 * 1024:  # stop at 5MB
                print("   (truncated at 5MB)")
                break
        return buf.getvalue().decode('utf-8', errors='ignore')
    except KeyboardInterrupt:
        raise
    except Exception as e:
        print(f"  ⚠️  Could not extract {file['name']}: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Split text into overlapping chunks for better retrieval."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c for c in chunks if len(c.strip()) > 50]

def get_collection():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    ef = embedding_functions.DefaultEmbeddingFunction()
    return client.get_or_create_collection(
        name="drive_docs",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )

def sync_drive():
    print("🔗 Connecting to Google Drive...")
    service = get_drive_service()
    files = list_all_files(service)
    print(f"📁 Found {len(files)} files\n")

    col = get_collection()
    total_chunks = 0

    # Track already-processed file IDs to allow resume
    processed_ids = set()
    try:
        existing = col.get(include=[])
        for meta in existing.get('metadatas') or []:
            if meta and 'file_id' in meta:
                processed_ids.add(meta['file_id'])
    except Exception:
        pass

    for i, file in enumerate(files):
        if file['id'] in processed_ids:
            print(f"⏭️  Skipping (already synced): {file['name']}")
            continue

        print(f"[{i+1}/{len(files)}] 📄 {file['name']}")
        try:
            text = extract_text(service, file)
        except KeyboardInterrupt:
            print(f"\n⚠️  Interrupted at file {i+1}/{len(files)}. Progress saved — rerun to continue.")
            break

        if not text.strip():
            print("   (empty, skipping)")
            continue

        chunks = chunk_text(text)
        chunks = chunks[:30]  # max 30 chunks per file (~24KB of text)
        ids, docs, metas = [], [], []
        for j, chunk in enumerate(chunks):
            ids.append(f"{file['id']}_chunk_{j}")
            docs.append(chunk)
            metas.append({
                "file_id":   file['id'],
                "file_name": file['name'],
                "mime_type": file['mimeType'],
                "chunk_idx": j,
            })

        col.upsert(ids=ids, documents=docs, metadatas=metas)
        total_chunks += len(chunks)
        print(f"   ✅ {len(chunks)} chunks stored")

    print(f"\n🎉 Done! {total_chunks} new chunks stored. Total in memory: {col.count()}")

def search_drive(query: str, n_results: int = 5) -> list[dict]:
    """Search Drive docs by semantic similarity."""
    col = get_collection()
    if col.count() == 0:
        return []
    results = col.query(query_texts=[query], n_results=min(n_results, col.count()))
    out = []
    for i, doc in enumerate(results['documents'][0]):
        out.append({
            "text":      doc,
            "file_name": results['metadatas'][0][i]['file_name'],
            "score":     1 - results['distances'][0][i],
        })
    return out

if __name__ == "__main__":
    sync_drive()
