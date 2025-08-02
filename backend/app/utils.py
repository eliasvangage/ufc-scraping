import joblib
import json
import numpy as np
import pandas as pd
import os
import re
from datetime import datetime
from app.config import (
    APPLY_FORM_BOOST,
    APPLY_STREAK_BOOST,
    APPLY_STAT_DOMINANCE_BONUS,
    DEBUG_LOGGING,
    MAX_BOOST,
)

# === Load Model & Scaler ===
model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "model")
model = joblib.load(os.path.join(model_path, "mlp_model.joblib"))
scaler = joblib.load(os.path.join(model_path, "scaler.joblib"))
feature_names = pd.read_csv(os.path.join(model_path, "feature_list.csv"))['feature'].tolist()

# === Load Fighter Data ===
fighter_data = json.load(open(os.path.join(os.path.dirname(__file__), "..", "data", "ufc_fighters.json"), encoding="utf-8"))

fighters_df = pd.DataFrame([
    {
        "name": f["name"],
        "weight": float(f["weight"].replace(" lbs.", "")) if "lbs" in f["weight"] else None,
        "height": float(f["height"].replace("\"", "").replace("' ", ".")) * 2.54 if "'" in f["height"] else None,
        "reach": float(f["reach"].replace("\"", "")) * 2.54 if f["reach"] and "\"" in f["reach"] else None,
        "SLpM": float(f["stats"].get("SLpM", "0")),
        "SApM": float(f["stats"].get("SApM", "0")),
        "TD Avg.": float(f["stats"].get("TD Avg.", "0")),
        "TD Def.": float(f["stats"].get("TD Def.", "0%").replace("%", "")),
        "Str. Acc.": float(f["stats"].get("Str. Acc.", "0%").replace("%", "")),
        "Str. Def": float(f["stats"].get("Str. Def", "0%").replace("%", "")),
        "fight_history": f.get("fight_history", []),
        "is_champion": f.get("is_champion", False)
    }
    for f in fighter_data
])

fighters_df["name_clean"] = fighters_df["name"].str.lower().str.replace(r"\s+", " ", regex=True).str.strip()

# === Feature Helpers ===
def get_all_fighters():
    return sorted(fighters_df["name"].tolist())

def opponent_strength(opp_name):
    opp = fighters_df[fighters_df["name_clean"] == opp_name.lower().strip()]
    if opp.empty:
        return 0.5
    row = opp.iloc[0]
    return (row["TD Def."] + row["Str. Def"]) / 200

def fight_recency_weight(fight):
    date_str = fight.get("date")
    if not date_str:
        return 0.25
    fight_date = datetime.strptime(date_str, "%Y-%m-%d")
    months_ago = (datetime.now() - fight_date).days / 30.0
    return max(0.0, 1 - months_ago / 24.0)

def recent_form_score(fights, limit=5):
    results = []
    weights = []
    for f in fights:
        r = f.get("result", "").lower()
        if r in {"nc", "draw"}:
            continue
        result_val = 1 if r == "win" else -1
        weight = fight_recency_weight(f)
        results.append(result_val * weight)
        weights.append(weight)
        if len(results) == limit:
            break
    return round(sum(results) / sum(weights), 4) if weights else 0.0

def win_streak_score(fights, limit=5):
    score = 0.0
    count = 0
    for f in fights:
        r = f.get("result", "").lower()
        if r == "win":
            weight = fight_recency_weight(f)
            score += opponent_strength(f.get("opponent", "")) * weight
            count += weight
        elif r in {"nc", "draw"}:
            continue
        else:
            break
        if count >= limit:
            break
    return score / limit if limit else 0.0

def avg_opponent_strength(fights, limit=5):
    if not fights:
        return 0.5
    scores = [opponent_strength(fh.get("opponent", "")) for fh in fights[:limit]]
    return np.mean(scores)

def get_last_results(fights, limit=5):
    results = []
    for fh in fights:
        result = fh.get("result", "").lower()
        if result == "win":
            results.append("W")
        elif result == "loss":
            results.append("L")
        elif result == "draw":
            results.append("D")
        elif result == "nc":
            results.append("NC")
        if len(results) == limit:
            break
    return results

def get_stat_favors(f1, f2):
    stat_map = {
        "SLpM": "Strikes Landed/Min",
        "SApM": "Strikes Absorbed/Min",
        "TD Avg.": "Takedowns/15min",
        "TD Def.": "Takedown Defense",
        "Str. Acc.": "Striking Accuracy",
        "Str. Def": "Striking Defense",
        "reach": "Reach",
    }
    result = []
    for key, label in stat_map.items():
        val1 = f1.get(key, 0)
        val2 = f2.get(key, 0)
        if key == "SApM":
            favored = f1["name"] if val1 < val2 else f2["name"] if val2 < val1 else "Even"
        else:
            favored = f1["name"] if val1 > val2 else f2["name"] if val2 > val1 else "Even"
        result.append({"stat": label, "favors": favored})
    return result

def get_fighter_stats(name):
    row = fighters_df[fighters_df["name_clean"] == name.lower().strip()]
    if row.empty:
        return None
    row = row.iloc[0]
    ufc_fights = [f for f in row["fight_history"] if "UFC" in f.get("event", "")]
    return {
        "name": row["name"],
        "weight": row["weight"],
        "height": row["height"],
        "reach": row["reach"],
        "SLpM": row["SLpM"],
        "SApM": row["SApM"],
        "TD Avg.": row["TD Avg."],
        "TD Def.": row["TD Def."],
        "Str. Acc.": row["Str. Acc."],
        "Str. Def": row["Str. Def"],
        "fight_history": ufc_fights,
        "recent_form_score": recent_form_score(ufc_fights),
        "win_streak_score": win_streak_score(ufc_fights),
        "avg_opp_strength": avg_opponent_strength(ufc_fights),
        "last_results": get_last_results(ufc_fights),
        "is_champion": row.get("is_champion", False),
    }

def safe_log(x, base=10):
    return np.log1p(x) / np.log(base)

def build_feature_vector(f1, f2):
    return pd.DataFrame([{k: v for k, v in {
        "SLpM_diff": 0.5 * (f1["SLpM"] - f2["SLpM"]),
        "SApM_diff": f2["SApM"] - f1["SApM"],
        "TD_Avg_diff": f1["TD Avg."] - f2["TD Avg."],
        "TD_Def_diff": 0.6 * (f1["TD Def."] - f2["TD Def."]),
        "Str_Acc_diff": f1["Str. Acc."] - f2["Str. Acc."],
        "Str_Def_diff": 0.5 * (f1["Str. Def"] - f2["Str. Def"]),
        "Height_diff": 0.25 * (f1["height"] - f2["height"]),
        "Reach_diff": 0.25 * (f1["reach"] - f2["reach"]),
        "Recent_form_score_diff": f1["recent_form_score"] - f2["recent_form_score"],
        "Win_streak_score_diff": 0.4 * (f1["win_streak_score"] - f2["win_streak_score"]),
        "Avg_opp_strength_diff": f1["avg_opp_strength"] - f2["avg_opp_strength"]
    }.items() if k in feature_names}])[feature_names]

def is_rematch(f1, f2):
    f1_name = f1["name"].lower().strip()
    f2_name = f2["name"].lower().strip()
    for h in f1["fight_history"]:
        if h.get("opponent", "").lower().strip() == f2_name:
            return True
    for h in f2["fight_history"]:
        if h.get("opponent", "").lower().strip() == f1_name:
            return True
    return False

def predict_match(f1_input, f2_input):
    # === Enforce deterministic order: alphabetical by name ===
    f1_name = f1_input["name"].strip().lower()
    f2_name = f2_input["name"].strip().lower()

    reverse = False
    if f1_name > f2_name:
        f1_input, f2_input = f2_input, f1_input
        reverse = True

    # === Build features as f1 - f2 ===
    X = build_feature_vector(f1_input, f2_input)
    X_scaled = scaler.transform(X)

    raw_proba = model.predict_proba(X_scaled)[0][1]  # prob f1 wins

    # If inputs were reversed, invert probability
    if reverse:
        raw_proba = 1 - raw_proba
        f1_input, f2_input = f2_input, f1_input

    pred_f1 = raw_proba >= 0.5
    true_predicted = "f1" if pred_f1 else "f2"
    winner = f1_input["name"] if pred_f1 else f2_input["name"]

    # === Confidence Normalization ===
    def normalize_confidence(p, low=50.0, high=85.0):
        scaled = low + (p - 0.5) * (high - low) / 0.5
        return round(min(max(scaled, low), high), 2)

    base_confidence = normalize_confidence(max(raw_proba, 1 - raw_proba))

    # === Stat Favors ===
    stat_favors = get_stat_favors(f1_input, f2_input)
    stat_boost = 0.5 * sum(1 for s in stat_favors if s["favors"] == winner) if APPLY_STAT_DOMINANCE_BONUS else 0.0

    # === Form & Streak Boosts ===
    recent_diff = f1_input["recent_form_score"] - f2_input["recent_form_score"]
    streak_diff = f1_input["win_streak_score"] - f2_input["win_streak_score"]

    form_boost = 0.0
    if APPLY_FORM_BOOST:
        if winner == f1_input["name"] and recent_diff > 0:
            form_boost = abs(recent_diff) * 5
        elif winner == f2_input["name"] and recent_diff < 0:
            form_boost = abs(recent_diff) * 5

    streak_boost = 0.0
    if APPLY_STREAK_BOOST:
        if winner == f1_input["name"] and streak_diff > 0:
            streak_boost = abs(streak_diff) * 3
        elif winner == f2_input["name"] and streak_diff < 0:
            streak_boost = abs(streak_diff) * 3

    # === Final Confidence ===
    confidence = base_confidence + stat_boost + form_boost + streak_boost
    confidence = round(min(confidence, 50.0 + MAX_BOOST, 85.0), 2)

    # === Rematch Info ===
    rematch = is_rematch(f1_input, f2_input)

    # === Debug Logging ===
    if DEBUG_LOGGING:
        print(f"🔍 Normalized Order: {f1_input['name']} vs {f2_input['name']}")
        print(f"  -> Winner: {winner} | Confidence: {confidence}%")
        print(f"🧠 Raw model probability (f1 wins): {raw_proba:.4f}")
        print(f"🔧 Normalized base confidence: {base_confidence:.2f}")
        print(f"📊 Final Prediction: {winner} | Confidence: {confidence}%")
        print(f"    ↪ Raw prob: {raw_proba:.4f}")
        print(f"    ↪ Stat boost: {stat_boost:.2f}")
        print(f"    ↪ Form boost: {form_boost:.2f}")
        print(f"    ↪ Streak boost: {streak_boost:.2f}")
        print("[RAW Features]:")
        for k, v in X.iloc[0].items():
            print(f"{k}: {v:.3f}")
        print("[SCALED Features]:")
        for i, k in enumerate(X.columns):
            print(f"{k}: {X_scaled[0][i]:.3f}")
        print(f"Rematch Detected: {rematch}")

    return (
        winner,
        confidence,
        X.iloc[0],
        f1_input["last_results"],
        f2_input["last_results"],
        rematch,
        stat_favors,
        f1_input["name"],  # red
        f2_input["name"]   # blue
    )
