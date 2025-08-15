import sys
import os
import json
from pathlib import Path
from datetime import datetime

# Add backend root to import app.*
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.utils import get_fighter_stats, predict_match
import requests

# Save to: backend/data/tracked_predictions.json
TRACKING_LOG = Path(__file__).resolve().parent.parent / "data" / "tracked_predictions.json"

# ---------- helpers ----------
def normalize_name(name: str) -> str:
    return " ".join((name or "").strip().lower().split())

def fighter_id_from(url_or_name: str) -> str | None:
    """If UFCStats URL, return trailing id; else None (we'll use name variant)."""
    s = (url_or_name or "").strip().rstrip("/")
    if s.startswith("http"):
        parts = s.split("/")
        return parts[-1] if parts else None
    return None

def canonical_pair(a: str, b: str) -> tuple[str, str]:
    return tuple(sorted([a, b]))

def build_key_variants(event: str, date: str,
                       f1_name: str, f2_name: str,
                       f1_url: str | None, f2_url: str | None) -> set[str]:
    event = (event or "").strip()
    date  = (date or "").strip()

    # Name-based key
    na, nb = canonical_pair(normalize_name(f1_name), normalize_name(f2_name))
    name_key = f"{event}|{date}|{na}|{nb}"

    keys = {name_key}

    # URL-ID-based key (only if we have BOTH ids)
    id1 = fighter_id_from(f1_url or "")
    id2 = fighter_id_from(f2_url or "")
    if id1 and id2:
        ia, ib = canonical_pair(id1, id2)
        url_key = f"{event}|{date}|{ia}|{ib}"
        keys.add(url_key)

    return keys

def canonical_key_for_row(row: dict) -> str:
    """
    Preferred dedupe key:
      - if both fighter*_url are present → URL-ID key
      - else → name-based key
    """
    event = (row.get("event") or "").strip()
    date  = (row.get("date") or "").strip()

    f1_name = row.get("fighter1", "")
    f2_name = row.get("fighter2", "")
    f1_url  = row.get("fighter1_url", "")
    f2_url  = row.get("fighter2_url", "")

    id1 = fighter_id_from(f1_url)
    id2 = fighter_id_from(f2_url)

    if id1 and id2:
        ia, ib = canonical_pair(id1, id2)
        return f"{event}|{date}|{ia}|{ib}"

    na, nb = canonical_pair(normalize_name(f1_name), normalize_name(f2_name))
    return f"{event}|{date}|{na}|{nb}"

def load_existing(path: Path):
    if not path.exists():
        return []
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []

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

def fetch_upcoming_events():
    url = "http://localhost:8000/upcoming"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# ---------- UPDATED: always log fights, even if stats are missing ----------
def build_tracking_log():
    events = fetch_upcoming_events()
    logs = []

    for event in events:
        event_name = event.get("event_name") or event.get("event") or "Unknown Event"
        event_date = event.get("date") or "Unknown Date"
        print(f"🧪 Processing event: {event_name} ({event_date}) with {len(event.get('fights', []))} fights")

        for fight in event.get("fights", []):
            f1_name = fight.get("fighter_red")
            f2_name = fight.get("fighter_blue")
            f1_url  = fight.get("fighter_red_url", "")
            f2_url  = fight.get("fighter_blue_url", "")

            if not f1_name or not f2_name:
                print("⚠️ Skipping: Missing fighter names")
                continue

            # Try to load stats; but DO NOT skip if missing
            f1_stats = get_fighter_stats(f1_name)
            f2_stats = get_fighter_stats(f2_name)
            f1_has_stats = bool(f1_stats)
            f2_has_stats = bool(f2_stats)

            # Default placeholders for debut/missing fighters
            winner = "Toss Up"
            confidence = 50.0
            raw_diffs = {}
            last5_f1 = (f1_stats or {}).get("last_results", [])
            last5_f2 = (f2_stats or {}).get("last_results", [])
            rematch = False
            top_contributors = []

            # If BOTH fighters have stats, run the model
            if f1_has_stats and f2_has_stats:
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
                    ) = predict_match(f1_stats, f2_stats)
                except Exception as e:
                    print(f"⚠️ Model error for {f1_name} vs {f2_name}: {e}. Falling back to 50/50.")

            log = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "event": event_name,
                "date": event_date,
                "fighter1": f1_name,
                "fighter2": f2_name,
                "fighter1_url": f1_url,   # keep URLs for robust future matching
                "fighter2_url": f2_url,
                "winner": winner,
                "confidence": round(float(confidence), 2),
                "rematch": rematch,
                "last_5_results_f1": last5_f1,
                "last_5_results_f2": last5_f2,
                "raw_feature_diffs": make_json_safe(raw_diffs),
                "shap_weights": {},                 # (optional in your current logging)
                "weighted_feature_diffs": {},       # (optional)
                "top_3_contributors": make_json_safe(top_contributors),
                "odds1": fight.get("odds1", "N/A"),
                "odds2": fight.get("odds2", "N/A"),
                "actual_result": None,
                "correct": None,
                # NEW: flags for frontend badges / logic
                "fighter1_has_stats": f1_has_stats,
                "fighter2_has_stats": f2_has_stats,
            }

            logs.append(log)

    return logs

# ---------- main ----------
if __name__ == "__main__":
    # New predictions from scraper/model
    new_logs = build_tracking_log()

    # Current file
    existing = load_existing(TRACKING_LOG)

    # Build a set of keys for existing rows (both name- and url-id-based)
    existing_keys: set[str] = set()
    for row in existing:
        keys = build_key_variants(
            row.get("event",""),
            row.get("date",""),
            row.get("fighter1",""),
            row.get("fighter2",""),
            row.get("fighter1_url",""),
            row.get("fighter2_url",""),
        )
        existing_keys.update(keys)

    # Only add rows that don't match ANY existing key variant
    to_add = []
    for row in new_logs:
        variants = build_key_variants(
            row.get("event",""),
            row.get("date",""),
            row.get("fighter1",""),
            row.get("fighter2",""),
            row.get("fighter1_url",""),
            row.get("fighter2_url",""),
        )
        if variants.isdisjoint(existing_keys):
            to_add.append(row)

    # Merge (keep existing first so dedupe prefers them)
    merged = existing + to_add

    # Final dedupe (prefer the FIRST occurrence → existing row wins)
    dedup: dict[str, dict] = {}
    for r in merged:
        k = canonical_key_for_row(r)
        if k not in dedup:
            dedup[k] = r
    merged = list(dedup.values())

    TRACKING_LOG.parent.mkdir(parents=True, exist_ok=True)
    with TRACKING_LOG.open("w", encoding="utf-8") as f:
        json.dump(make_json_safe(merged), f, indent=2, ensure_ascii=False)

    print(f"\n➕ Added: {len(to_add)}   🧮 Total now: {len(merged)}")
    print(f"✅ Saved merged predictions to {TRACKING_LOG}")
