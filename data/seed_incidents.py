"""
Run this once to seed the vector memory with past incidents
so Aegis can recognize patterns from day one.

Usage: python data/seed_incidents.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load .env from backend/ before importing anything
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from memory import store_incident

PAST_INCIDENTS = [
    {
        "id": "seed-001",
        "title": "High CPU Usage on prod-server-1",
        "description": "CPU sustained above 90% for 15 minutes causing request timeouts",
        "resolution": "Restarted the auth-service pod. Root cause was a runaway goroutine. Applied patch v2.1.3."
    },
    {
        "id": "seed-002",
        "title": "PostgreSQL Connection Pool Exhausted",
        "description": "DB connection pool hit max limit, new connections refused",
        "resolution": "Increased pool size from 20 to 50 in config. Restarted API service. Added connection timeout of 30s."
    },
    {
        "id": "seed-003",
        "title": "Memory Leak in auth-service",
        "description": "Heap memory growing unbounded, OOM kill after 2 hours",
        "resolution": "Rolled back to v1.8.2. Memory leak was in JWT token cache — fixed in v1.8.4."
    },
    {
        "id": "seed-004",
        "title": "Disk Usage Critical on worker-node-3",
        "description": "/var/log partition at 95%, services failing to write logs",
        "resolution": "Cleared old log files with logrotate. Added disk usage alert at 80% threshold."
    },
    {
        "id": "seed-005",
        "title": "API Gateway Timeout Spike",
        "description": "P99 latency jumped to 8s, 504 errors increasing",
        "resolution": "Scaled API gateway replicas from 2 to 5. Downstream service was slow due to cold cache."
    },
    {
        "id": "seed-006",
        "title": "Pod CrashLoopBackOff in payment-service",
        "description": "payment-service pod restarting every 30 seconds",
        "resolution": "Missing environment variable STRIPE_KEY in deployment config. Added secret and redeployed."
    },
]

if __name__ == "__main__":
    print("Seeding incident memory...")
    for inc in PAST_INCIDENTS:
        store_incident(inc["id"], inc["title"], inc["description"], inc["resolution"])
        print(f"  ✅ Stored: {inc['title']}")
    print(f"\nDone! {len(PAST_INCIDENTS)} incidents loaded into vector memory.")
