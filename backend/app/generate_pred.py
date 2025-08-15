import sys
import os
import json
from pathlib import Path
from datetime import datetime

# Add backend root to import app.*
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.utils import get_fighter_stats, predict_match
import requests

# Save to: backend/logs/tracked_predictions.json
TRACKING_LOG = Path(__file__).resolve().parent.parent / "data" / "tracked_predictions.json"


def fetch_upcoming_events():
    url = "http://localhost:8000/upcoming"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def make_json_safe(obj):
    if hasattr(obj, "to_dict"):
        obj = obj.to_dict()
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    elif isinstance(obj, (int, float, str, bool)) or obj is None:
        return obj
    else:
        return str(obj)  # fallback

def build_tracking_log():
    events = fetch_upcoming_events()
    logs = []

    for event in events:
        event_name = event.get("event_name") or event.get("event") or "Unknown Event"
        event_date = event.get("date") or "Unknown Date"  # ✅ Pull date from upcoming data
        print(f"🧪 Processing event: {event_name} ({event_date}) with {len(event.get('fights', []))} fights")

        for fight in event.get("fights", []):
            f1_name = fight.get("fighter_red")
            f2_name = fight.get("fighter_blue")

            if not f1_name or not f2_name:
                print(f"⚠️ Skipping: Missing fighter names")
                continue

            f1 = get_fighter_stats(f1_name)
            f2 = get_fighter_stats(f2_name)

            if not f1 or not f2:
                print(f"⚠️ Skipping: Stats missing for {f1_name} or {f2_name}")
                continue

            try:
                (
                    winner,
                    confidence,
                    raw_diffs,
                    last5_f1,
                    last5_f2,
                    rematch,
                    top_contributors,
                    _,
                    __
                ) = predict_match(f1, f2)

                log = {
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "event": event_name,
                    "date": event_date,  # ✅ Added date field
                    "fighter1": f1_name,
                    "fighter2": f2_name,
                    "winner": winner,
                    "confidence": round(confidence, 2),
                    "rematch": rematch,
                    "last_5_results_f1": last5_f1,
                    "last_5_results_f2": last5_f2,
                    "raw_feature_diffs": make_json_safe(raw_diffs),
                    "shap_weights": {},
                    "weighted_feature_diffs": {},
                    "top_3_contributors": make_json_safe(top_contributors),
                    "odds1": fight.get("odds1", "N/A"),
                    "odds2": fight.get("odds2", "N/A"),
                    "actual_result": None,
                    "correct": None,
                    "is_tossup": winner == "Toss Up"  # Add flag for toss-up
                }

            except Exception as e:
                print(f"⚠️ Exception during prediction: {e}")
                log = {
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "event": event_name,
                    "date": event_date,  # ✅ Added date field
                    "fighter1": f1_name,
                    "fighter2": f2_name,
                    "winner": "Toss Up",
                    "confidence": 50.0,
                    "rematch": False,
                    "last_5_results_f1": f1.get("last_results", []) if f1 else [],
                    "last_5_results_f2": f2.get("last_results", []) if f2 else [],
                    "raw_feature_diffs": {},
                    "shap_weights": {},
                    "weighted_feature_diffs": {},
                    "top_3_contributors": [],
                    "odds1": fight.get("odds1", "N/A"),
                    "odds2": fight.get("odds2", "N/A"),
                    "actual_result": None,
                    "correct": None,
                    "is_tossup": True  # Add flag for toss-up
                }

            logs.append(log)

    return logs


if __name__ == "__main__":
    logs = build_tracking_log()

    TRACKING_LOG.parent.mkdir(parents=True, exist_ok=True)

    with TRACKING_LOG.open("w", encoding="utf-8") as f:
        json.dump(make_json_safe(logs), f, indent=2)

    print(f"\n📦 Saved {len(logs)} predictions to {TRACKING_LOG}")
