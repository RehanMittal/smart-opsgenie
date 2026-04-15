from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()

@router.post("/sync")
async def sync_drive(background_tasks: BackgroundTasks):
    """Trigger a full Google Drive sync in the background."""
    def run_sync():
        from drive_sync import sync_drive
        sync_drive()
    background_tasks.add_task(run_sync)
    return {"message": "Drive sync started in background. Check server logs for progress."}

@router.get("/search")
def search_drive(q: str, n: int = 5):
    """Search synced Drive documents."""
    from drive_sync import search_drive
    results = search_drive(q, n_results=n)
    return {"results": results, "count": len(results)}

@router.get("/status")
def drive_status():
    """Check how many Drive chunks are in memory."""
    try:
        from drive_sync import get_collection
        col = get_collection()
        return {"chunks_in_memory": col.count(), "ready": col.count() > 0}
    except Exception as e:
        return {"chunks_in_memory": 0, "ready": False, "error": str(e)}
