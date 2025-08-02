import joblib
import json
import numpy as np
import pandas as pd
import os
from datetime import datetime

#load model and scaler
model = joblib.load("mlp_model.joblib")
scaler = joblib.load("scaler.joblib")
features_df = pd.read_csv("feature_list.csv")
feature_names = features_df["feature"].tolist()

#load fighter data
with open("ufc_fighters.json", "r", encoding="utf-8") as f:
    fighter_data = json.load(f)

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
        "fight_history": f.get("fight_history", [])
    }
    for f in fighter_data
])
fighters_df["name_clean"] = fighters_df["name"].str.lower().str.strip()

def recent_form_score(ufc_fights, limit=5):
    recent = ufc_fights[:limit]
    if not recent:
        return 0.0
    weights = np.linspace(1.0, 0.2, len(recent))
    scores = np.array([1 if fh.get("result", "").lower() == "win" else -1 for fh in recent])
    return np.dot(weights, scores) / sum(weights) * 0.25

def win_streak_score(ufc_fights, limit=5):
    streak = 0
    for fh in ufc_fights[:limit]:
        if fh.get("result", "").lower() == "win":
            streak += 1
        else:
            break
    return streak / limit  # Normalize 0 to 1

def get_last_results(fights, limit=5):
    return [("W" if fh.get("result", "").lower() == "win" else "L") for fh in fights[:limit]]

def get_fighter_stats(name):
    f = fighters_df[fighters_df["name_clean"] == name.lower().strip()]
    if f.empty:
        return None
    row = f.iloc[0]
    ufc_fights = [fh for fh in row["fight_history"] if "UFC" in fh.get("event", "")]
    form_score = recent_form_score(ufc_fights)
    streak_score = win_streak_score(ufc_fights)
    results = get_last_results(ufc_fights)

    return {
        "name": name,
        "SLpM": row["SLpM"],
        "SApM": row["SApM"],
        "TD Avg.": row["TD Avg."],
        "TD Def.": row["TD Def."],
        "Str. Acc.": row["Str. Acc."],
        "Str. Def": row["Str. Def"],
        "weight": row["weight"],
        "height": row["height"],
        "reach": row["reach"],
        "recent_form_score": form_score,
        "win_streak_score": streak_score,
        "last_results": results
    }

def build_feature_vector(f1, f2):
    vec = {
        "SLpM_diff": f1["SLpM"] - f2["SLpM"],
        "SApM_diff": f1["SApM"] - f2["SApM"],
        "TD_Avg_diff": f1["TD Avg."] - f2["TD Avg."],
        "TD_Def_diff": f1["TD Def."] - f2["TD Def."],
        "Str_Acc_diff": f1["Str. Acc."] - f2["Str. Acc."],
        "Str_Def_diff": f1["Str. Def"] - f2["Str. Def"],
        "Height_diff": f1["height"] - f2["height"],
        "Reach_diff": f1["reach"] - f2["reach"],
        "Recent_form_score_diff": f1["recent_form_score"] - f2["recent_form_score"],
        "Win_streak_score_diff": f1["win_streak_score"] - f2["win_streak_score"],
        "Avg_opp_strength_diff": 0.0  # ← TEMPORARY fallback value
    }
    df = pd.DataFrame([vec])[feature_names]
    return df


def predict_match(f1, f2):
    X1 = build_feature_vector(f1, f2)
    X2 = build_feature_vector(f2, f1)

    print("\n🔍 RAW Features (f1 vs f2):\n", X1.to_dict(orient="records")[0])
    print("\n🔍 RAW Features (f2 vs f1):\n", X2.to_dict(orient="records")[0])

    X1_scaled = scaler.transform(X1)
    X2_scaled = scaler.transform(X2)

    print("\n🧪 SCALED Features (X1):", X1_scaled)
    print("🧪 SCALED Features (X2):", X2_scaled)

    proba1 = model.predict_proba(X1_scaled)[0][1]      # P(f1 wins)
    proba2 = model.predict_proba(X2_scaled)[0][1]      # P(f2 wins)
    inv_proba2 = 1 - proba2                            # Should match proba1

    # Symmetry check
    delta = abs(proba1 - inv_proba2)
    print(f"\n🔁 Symmetry Check: |P(f1 wins) - (1 - P(f2 wins))| = {delta:.6f}")
    if delta > 1e-5:
        print("⚠️ WARNING: Model is not symmetric!")

    # Final prediction
    avg_proba = (proba1 + inv_proba2) / 2
    winner = f1["name"] if avg_proba >= 0.5 else f2["name"]
    confidence = round((avg_proba if winner == f1["name"] else 1 - avg_proba) * 100, 2)

    return winner, confidence, X1.iloc[0]


def log_prediction(fighter1, fighter2, winner, confidence, features):
    log_file = "prediction_log.csv"
    row = {
        "timestamp": datetime.now().isoformat(),
        "fighter_1": fighter1,
        "fighter_2": fighter2,
        "predicted_winner": winner,
        "confidence": confidence,
        **features.to_dict()
    }
    if not os.path.exists(log_file):
        pd.DataFrame([row]).to_csv(log_file, index=False)
    else:
        pd.DataFrame([row]).to_csv(log_file, mode="a", header=False, index=False)

print("\U0001F4CD UFC Winner Predictor")
name1 = input("Enter Fighter 1 name: ").strip()
name2 = input("Enter Fighter 2 name: ").strip()

f1 = get_fighter_stats(name1)
f2 = get_fighter_stats(name2)

if not f1 or not f2:
    print("\u274C One or both fighter names not found.")
    exit()

print(f"\n📈 Last 5 Results:")
print(f"{f1['name']}: {' '.join(f1['last_results'])}")
print(f"{f2['name']}: {' '.join(f2['last_results'])}")

if abs(f1["weight"] - f2["weight"]) > 2:
    print(f"\n\u26A0\uFE0F Prediction blocked: Fighters are not in the same weight class.")
    print(f"{f1['name']} weight: {f1['weight']} lbs | {f2['name']} weight: {f2['weight']} lbs")
    exit()

winner, confidence, features = predict_match(f1, f2)

#output
print(f"\n\U0001F52E Prediction ({name1} vs {name2})\n")
print("\U0001F4CA Feature Differences (Fighter 1 - Fighter 2):")
for feat, val in features.items():
    print(f" - {feat}: {round(val, 2)}")

print(f"\n\u2705 Predicted Winner: **{winner}**")
print(f"   Confidence Score: {confidence}%")
log_prediction(name1, name2, winner, confidence, features)
