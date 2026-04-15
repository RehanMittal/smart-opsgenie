"""
Seed dummy incidents for dashboard demo.
Run: python data/seed_dummy_incidents.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from database import SessionLocal, Incident, Base, engine
from datetime import datetime, timedelta
import random, uuid

Base.metadata.create_all(bind=engine)

# Run migrations
from sqlalchemy import text
with engine.connect() as conn:
    for col in ["team VARCHAR", "service VARCHAR"]:
        try:
            conn.execute(text(f"ALTER TABLE incidents ADD COLUMN {col}"))
            conn.commit()
        except Exception:
            pass

DUMMY = [
    # Platform team
    {"title": "High CPU Usage on prod-server-1", "description": "CPU sustained above 90% for 15 minutes", "severity": "critical", "source": "prometheus", "team": "Platform", "service": "api-gateway", "status": "resolved", "resolution": "Restarted auth-service pod. Root cause: runaway goroutine.", "auto_healed": True, "days_ago": 1},
    {"title": "API Gateway Timeout Spike", "description": "P99 latency jumped to 8s, 504 errors increasing", "severity": "high", "source": "datadog", "team": "Platform", "service": "api-gateway", "status": "resolved", "resolution": "Scaled API gateway replicas from 2 to 5.", "auto_healed": False, "days_ago": 2},
    {"title": "Pod CrashLoopBackOff in platform-service", "description": "platform-service pod restarting every 30 seconds", "severity": "critical", "source": "opsgenie", "team": "Platform", "service": "api-gateway", "status": "resolved", "resolution": "Missing env variable PLATFORM_KEY. Added secret and redeployed.", "auto_healed": False, "days_ago": 3},
    {"title": "Memory Leak in platform-worker", "description": "Heap memory growing unbounded", "severity": "high", "source": "prometheus", "team": "Platform", "service": "api-gateway", "status": "open", "resolution": None, "auto_healed": False, "days_ago": 0},

    # Backend team
    {"title": "DB Connection Pool Exhausted", "description": "PostgreSQL connection pool at max capacity, new connections refused", "severity": "critical", "source": "datadog", "team": "Backend", "service": "db-cluster", "status": "resolved", "resolution": "Increased pool size from 20 to 50. Restarted API service.", "auto_healed": True, "days_ago": 1},
    {"title": "Payment API 500 Errors", "description": "Payment service returning 500 for 12% of requests", "severity": "critical", "source": "opsgenie", "team": "Backend", "service": "payment-api", "status": "resolved", "resolution": "Rolled back to v2.1.1. Bug in payment validation logic.", "auto_healed": False, "days_ago": 4},
    {"title": "Auth Service Token Expiry Bug", "description": "JWT tokens expiring 1 hour early due to timezone issue", "severity": "high", "source": "webhook", "team": "Backend", "service": "auth-service", "status": "resolved", "resolution": "Fixed timezone handling in token generation.", "auto_healed": False, "days_ago": 5},
    {"title": "Slow Query on Orders Table", "description": "SELECT on orders table taking 45s due to missing index", "severity": "medium", "source": "datadog", "team": "Backend", "service": "db-cluster", "status": "resolved", "resolution": "Added composite index on (user_id, created_at).", "auto_healed": False, "days_ago": 6},
    {"title": "Rate Limiter Not Working", "description": "Rate limiter bypassed, causing 10x normal traffic", "severity": "high", "source": "prometheus", "team": "Backend", "service": "api-gateway", "status": "open", "resolution": None, "auto_healed": False, "days_ago": 0},

    # Data team
    {"title": "Data Pipeline Failure", "description": "ETL pipeline failed at transformation step, 6 hours of data lost", "severity": "critical", "source": "opsgenie", "team": "Data", "service": "data-pipeline", "status": "resolved", "resolution": "Fixed schema mismatch in transformer. Reprocessed missing data.", "auto_healed": False, "days_ago": 2},
    {"title": "Kafka Consumer Lag Spike", "description": "Consumer group lag reached 2M messages", "severity": "high", "source": "datadog", "team": "Data", "service": "data-pipeline", "status": "resolved", "resolution": "Scaled consumers from 3 to 8 instances.", "auto_healed": True, "days_ago": 3},
    {"title": "Redshift Query Timeout", "description": "Analytics queries timing out after 30 minutes", "severity": "medium", "source": "webhook", "team": "Data", "service": "db-cluster", "status": "resolved", "resolution": "Optimized query with materialized view.", "auto_healed": False, "days_ago": 7},
    {"title": "ML Model Serving Latency", "description": "Model inference latency increased from 50ms to 800ms", "severity": "high", "source": "prometheus", "team": "Data", "service": "data-pipeline", "status": "open", "resolution": None, "auto_healed": False, "days_ago": 0},

    # Infrastructure team
    {"title": "Disk Usage Critical on worker-node-3", "description": "/var/log partition at 95%, services failing to write logs", "severity": "critical", "source": "prometheus", "team": "Infrastructure", "service": "monitoring", "status": "resolved", "resolution": "Cleared old logs with logrotate. Added disk alert at 80%.", "auto_healed": True, "days_ago": 1},
    {"title": "Kubernetes Node NotReady", "description": "3 worker nodes in NotReady state after kernel update", "severity": "critical", "source": "opsgenie", "team": "Infrastructure", "service": "monitoring", "status": "resolved", "resolution": "Rolled back kernel update. Nodes recovered after reboot.", "auto_healed": False, "days_ago": 5},
    {"title": "Load Balancer Health Check Failing", "description": "ALB health checks failing for 2 of 5 instances", "severity": "high", "source": "datadog", "team": "Infrastructure", "service": "api-gateway", "status": "resolved", "resolution": "Fixed health check endpoint returning 503 due to startup probe.", "auto_healed": False, "days_ago": 8},
    {"title": "SSL Certificate Expiring in 7 Days", "description": "prod.example.com SSL cert expires in 7 days", "severity": "medium", "source": "webhook", "team": "Infrastructure", "service": "web-app", "status": "open", "resolution": None, "auto_healed": False, "days_ago": 0},
    {"title": "Network Packet Loss 15%", "description": "Intermittent packet loss between AZ-1 and AZ-2", "severity": "high", "source": "prometheus", "team": "Infrastructure", "service": "monitoring", "status": "resolved", "resolution": "Replaced faulty network interface on core switch.", "auto_healed": False, "days_ago": 10},

    # Security team
    {"title": "Unusual Login Attempts Detected", "description": "500+ failed login attempts from single IP in 10 minutes", "severity": "critical", "source": "opsgenie", "team": "Security", "service": "auth-service", "status": "resolved", "resolution": "Blocked IP range. Added CAPTCHA for repeated failures.", "auto_healed": False, "days_ago": 3},
    {"title": "Dependency Vulnerability CVE-2024-1234", "description": "Critical vulnerability in log4j dependency", "severity": "critical", "source": "webhook", "team": "Security", "service": "web-app", "status": "resolved", "resolution": "Updated log4j to 2.17.1 across all services.", "auto_healed": False, "days_ago": 6},
    {"title": "API Key Exposed in Logs", "description": "Production API key found in application logs", "severity": "high", "source": "webhook", "team": "Security", "service": "auth-service", "status": "resolved", "resolution": "Rotated API key. Added log scrubbing for sensitive data.", "auto_healed": False, "days_ago": 9},

    # DevOps team
    {"title": "CI/CD Pipeline Stuck", "description": "Deployment pipeline stuck at integration test stage for 2 hours", "severity": "medium", "source": "webhook", "team": "DevOps", "service": "monitoring", "status": "resolved", "resolution": "Killed stuck test container. Fixed flaky test causing deadlock.", "auto_healed": False, "days_ago": 2},
    {"title": "Docker Registry Out of Space", "description": "Container registry at 98% capacity, pushes failing", "severity": "high", "source": "prometheus", "team": "DevOps", "service": "monitoring", "status": "resolved", "resolution": "Cleaned up old image tags. Added retention policy.", "auto_healed": True, "days_ago": 4},
    {"title": "Terraform State Lock", "description": "Terraform state locked by failed apply, blocking all infra changes", "severity": "high", "source": "webhook", "team": "DevOps", "service": "monitoring", "status": "resolved", "resolution": "Force-unlocked state after confirming no active apply.", "auto_healed": False, "days_ago": 7},
    {"title": "Staging Environment Down", "description": "Entire staging environment unreachable after config change", "severity": "medium", "source": "opsgenie", "team": "DevOps", "service": "web-app", "status": "open", "resolution": None, "auto_healed": False, "days_ago": 0},

    # Frontend team
    {"title": "Web App 404 on /checkout", "description": "Checkout page returning 404 after deploy", "severity": "critical", "source": "datadog", "team": "Frontend", "service": "web-app", "status": "resolved", "resolution": "Missing route in React Router config. Hotfix deployed.", "auto_healed": False, "days_ago": 1},
    {"title": "CDN Cache Poisoning", "description": "Stale JS bundle being served to 30% of users", "severity": "high", "source": "webhook", "team": "Frontend", "service": "web-app", "status": "resolved", "resolution": "Invalidated CDN cache. Added cache-busting headers.", "auto_healed": False, "days_ago": 5},
    {"title": "Mobile App Crash on iOS 17", "description": "App crashing on launch for iOS 17 users", "severity": "critical", "source": "opsgenie", "team": "Frontend", "service": "web-app", "status": "open", "resolution": None, "auto_healed": False, "days_ago": 0},
]

def seed():
    db = SessionLocal()
    # Clear existing dummy data
    db.query(Incident).delete()
    db.commit()

    now = datetime.utcnow()
    for d in DUMMY:
        days = d.pop("days_ago")
        created = now - timedelta(days=days, hours=random.randint(0, 8), minutes=random.randint(0, 59))
        resolved_at = None
        if d["status"] in ("resolved", "auto_resolved"):
            resolve_mins = random.randint(5, 120)
            resolved_at = created + timedelta(minutes=resolve_mins)

        inc = Incident(
            id=str(uuid.uuid4()),
            created_at=created,
            resolved_at=resolved_at,
            **d
        )
        db.add(inc)

    db.commit()
    db.close()
    print(f"✅ Seeded {len(DUMMY)} dummy incidents across 7 teams")

if __name__ == "__main__":
    seed()
