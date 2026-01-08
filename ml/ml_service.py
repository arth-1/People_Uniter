"""
Continuously running ML recommendation service.

This Flask service:
1. Runs in the background
2. Automatically regenerates recommendations every hour
3. Provides API endpoints for manual triggers and health checks
4. Pushes results directly to Supabase recommendations_metadata table
"""
import os
import threading
import time
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client

from recommender import RecommendationEngine

# Load environment variables
load_dotenv(dotenv_path="../.env.local")

app = Flask(__name__)
CORS(app)

# Global state
engine = None
last_run = None
last_run_status = "never"
is_running = False


def initialize_engine():
    """Initialize the recommendation engine."""
    global engine
    print(f"[{datetime.now().isoformat()}] Initializing recommendation engine...")
    engine = RecommendationEngine(model_path="dqn_recommender.pth")
    print(f"[{datetime.now().isoformat()}] Engine initialized successfully")


def fetch_data_from_supabase():
    """Fetch users, groups, memberships, and events from Supabase."""
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase credentials in environment")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Fetch all required data
    users = supabase.table("users").select("id, auth_user_id").execute().data
    groups = supabase.table("groups").select("id, name, type").execute().data
    memberships = supabase.table("group_members").select("user_id, group_id").execute().data
    events = supabase.table("events").select("id, group_id, time, title").execute().data

    return users, groups, memberships, events


def run_recommendation_job():
    """Run the recommendation generation job."""
    global last_run, last_run_status, is_running
    
    if is_running:
        print(f"[{datetime.now().isoformat()}] Job already running, skipping...")
        return
    
    is_running = True
    start_time = datetime.now()
    
    try:
        print(f"\n{'='*60}")
        print(f"[{start_time.isoformat()}] Starting recommendation generation job")
        print(f"{'='*60}\n")
        
        # Fetch data from Supabase
        users, groups, memberships, events = fetch_data_from_supabase()
        
        # Generate group recommendations
        recommendations = engine.generate_recommendations(
            user_data=users,
            groups_data=groups,
            memberships_data=memberships,
            top_k=8
        )
        
        # Synthesize event recommendations from group recs + upcoming events
        event_recommendations = synthesize_event_recommendations(recommendations, events)
        combined = recommendations + event_recommendations

        # Push to Supabase
        engine.push_to_supabase(combined)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        last_run = end_time.isoformat()
        last_run_status = f"success (took {duration:.2f}s)"
        
        print(f"\n{'='*60}")
        print(f"[{end_time.isoformat()}] Job completed successfully in {duration:.2f}s")
        print(f"{'='*60}\n")
        
    except Exception as e:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        last_run = end_time.isoformat()
        last_run_status = f"failed: {str(e)}"
        
        print(f"\n{'='*60}")
        print(f"[{end_time.isoformat()}] Job failed after {duration:.2f}s")
        print(f"Error: {e}")
        print(f"{'='*60}\n")
    
    finally:
        is_running = False


def synthesize_event_recommendations(group_recs, events):
    """Create event recommendations from group recommendations and upcoming events using a simple heuristic.

    For each user, take top group recs and recommend upcoming events from those groups.
    Score = group_score * time_decay, where time_decay favors sooner events.
    """
    from collections import defaultdict
    from datetime import timezone
    import math

    # Group group-recs by user
    by_user = defaultdict(list)
    for r in group_recs or []:
        if r.get("entity_type") == "group":
            by_user[r["user_id"]].append(r)

    # Group events by group_id
    events_by_group = defaultdict(list)
    for e in events or []:
        events_by_group[e.get("group_id")].append(e)

    now = datetime.now(timezone.utc)
    out = []

    for user_id, recs in by_user.items():
        # Consider top 5 groups per user
        top_groups = sorted(recs, key=lambda x: x.get("score", 0), reverse=True)[:5]
        for gr in top_groups:
            group_id = gr.get("entity_id")
            try:
                gid = int(group_id)
            except Exception:
                continue
            for ev in events_by_group.get(gid, []):
                ev_time = ev.get("time")
                if not ev_time:
                    continue
                try:
                    ev_dt = datetime.fromisoformat(str(ev_time).replace("Z", "+00:00"))
                except Exception:
                    continue
                if ev_dt < now:
                    continue
                days = (ev_dt - now).total_seconds() / 86400.0
                time_decay = math.exp(-days / 30.0)
                score = float(gr.get("score", 0.0)) * float(time_decay)
                out.append({
                    "user_id": gr["user_id"],
                    "entity_type": "event",
                    "entity_id": ev.get("id"),
                    "score": score,
                })

    # Deduplicate by (user, event) keeping max score
    best = {}
    for r in out:
        key = (r["user_id"], r["entity_id"]) 
        if key not in best or r["score"] > best[key]["score"]:
            best[key] = r
    return list(best.values())


def scheduler_loop():
    """Background thread that runs recommendations every hour."""
    print(f"[{datetime.now().isoformat()}] Scheduler started (runs every 3600 seconds)")
    
    # Run immediately on startup
    run_recommendation_job()
    
    # Then run every hour
    while True:
        time.sleep(3600)  # 1 hour
        run_recommendation_job()


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "ml-recommendation-service",
        "model_loaded": engine is not None,
        "last_run": last_run,
        "last_run_status": last_run_status,
        "is_running": is_running,
        "timestamp": datetime.now().isoformat()
    })


@app.route("/trigger", methods=["POST"])
def trigger_job():
    """Manually trigger recommendation generation."""
    if is_running:
        return jsonify({
            "status": "already_running",
            "message": "Recommendation job is already in progress"
        }), 409
    
    # Run in background thread
    thread = threading.Thread(target=run_recommendation_job)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "status": "triggered",
        "message": "Recommendation generation started",
        "timestamp": datetime.now().isoformat()
    })


@app.route("/status", methods=["GET"])
def status():
    """Get detailed service status."""
    return jsonify({
        "service": "ml-recommendation-service",
        "model": {
            "loaded": engine is not None,
            "path": "dqn_recommender.pth"
        },
        "scheduler": {
            "interval_seconds": 3600,
            "last_run": last_run,
            "last_run_status": last_run_status,
            "is_running": is_running
        },
        "environment": {
            "supabase_url": os.getenv("NEXT_PUBLIC_SUPABASE_URL") is not None,
            "service_key": os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None
        },
        "timestamp": datetime.now().isoformat()
    })


if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║     ML RECOMMENDATION SERVICE                              ║
    ║     Continuously generates group recommendations           ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # Initialize engine
    initialize_engine()
    
    # Start scheduler in background thread
    scheduler_thread = threading.Thread(target=scheduler_loop)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    # Start Flask server
    port = int(os.getenv("ML_SERVICE_PORT", 5000))
    print(f"\n[{datetime.now().isoformat()}] Starting Flask server on port {port}...")
    print(f"[{datetime.now().isoformat()}] API endpoints:")
    print(f"  - GET  http://localhost:{port}/health")
    print(f"  - GET  http://localhost:{port}/status")
    print(f"  - POST http://localhost:{port}/trigger")
    print()
    
    app.run(host="0.0.0.0", port=port, debug=False)
