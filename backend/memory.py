"""
Incident Memory using ChromaDB for vector similarity search.
Allows Aegis to find past similar incidents and their resolutions.
"""

_collection = None

def get_collection():
    global _collection
    if _collection is None:
        import chromadb
        from chromadb.utils import embedding_functions
        import os
        from dotenv import load_dotenv
        load_dotenv()
        chroma_dir = os.getenv('CHROMA_PERSIST_DIR', './chroma_db')
        client = chromadb.PersistentClient(path=chroma_dir)
        ef = embedding_functions.DefaultEmbeddingFunction()
        _collection = client.get_or_create_collection(
            name="incidents",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection

def store_incident(incident_id: str, title: str, description: str, resolution: str):
    """Store a resolved incident in vector memory."""
    col = get_collection()  
    text = f"{title}. {description}. Resolution: {resolution}"
    col.upsert(
        ids=[incident_id],
        documents=[text],
        metadatas=[{"title": title, "resolution": resolution, "incident_id": incident_id}]
    )

def find_similar(query: str, n_results: int = 3) -> list[dict]:
    """Find past incidents similar to the current alert."""
    col = get_collection()
    if col.count() == 0:
        return []
    results = col.query(query_texts=[query], n_results=min(n_results, col.count()))
    similar = []
    for i, doc in enumerate(results["documents"][0]):
        similar.append({
            "incident_id": results["metadatas"][0][i]["incident_id"],
            "title": results["metadatas"][0][i]["title"],
            "resolution": results["metadatas"][0][i]["resolution"],
            "similarity_score": 1 - results["distances"][0][i],  # cosine → similarity
        })
    return similar
