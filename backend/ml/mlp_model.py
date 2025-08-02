import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.utils import compute_sample_weight
import joblib

# === Load data
df = pd.read_csv("data.csv")
df["Winner"] = df["Winner"].map({"Red": 0, "Blue": 1})
df.dropna(subset=["Winner"], inplace=True)

with open("ufc_fighters.json", "r", encoding="utf-8") as f:
    fighter_data = json.load(f)

# === Build fight history lookup
fight_lookup = {}
for f in fighter_data:
    name = f["name"].lower().strip()
    fight_lookup[name] = [
        {
            "opponent": h.get("opponent", "").lower().strip(),
            "result": h.get("result", "").lower(),
            "event": h.get("event", "")
        }
        for h in f.get("fight_history", []) if "UFC" in h.get("event", "")
    ]

# === Feature builders
def opponent_strength_score(name, df):
    opp = df[df["name_clean"] == name.lower().strip()]
    if opp.empty:
        return 0.5
    return (opp["TD Def."].values[0] + opp["Str. Def"].values[0]) / 200

def recent_form_score(fights):
    if not fights:
        return 0.0
    weights = np.linspace(1.0, 0.2, len(fights[:5]))
    scores = np.array([1 if f["result"] == "win" else -1 for f in fights[:5]])
    return np.dot(weights, scores) / sum(weights)

def win_streak_score(fights, df):
    score = 0
    for f in fights[:5]:
        if f["result"] == "win":
            score += opponent_strength_score(f["opponent"], df)
        else:
            break
    return score / 5

def avg_opp_strength(fights, df):
    if not fights:
        return 0.5
    return np.mean([opponent_strength_score(f["opponent"], df) for f in fights[:5]])

# === Normalize fighter stats
fighter_rows = []
for f in fighter_data:
    try:
        stats = f["stats"]
        fighter_rows.append({
            "name": f["name"],
            "stance": f.get("stance", "Unknown"),
            "weight": float(f["weight"].replace(" lbs.", "")) if "lbs" in f["weight"] else None,
            "height": float(f["height"].replace("\"", "").replace("' ", ".")) * 2.54 if "'" in f["height"] else None,
            "reach": float(f["reach"].replace("\"", "")) * 2.54 if f["reach"] else None,
            "SLpM": float(stats.get("SLpM", "0")),
            "SApM": float(stats.get("SApM", "0")),
            "TD Avg.": float(stats.get("TD Avg.", "0")),
            "TD Def.": float(stats.get("TD Def.", "0%").replace("%", "")),
            "Str. Acc.": float(stats.get("Str. Acc.", "0%").replace("%", "")),
            "Str. Def": float(stats.get("Str. Def", "0%").replace("%", ""))
        })
    except:
        continue

fighters_df = pd.DataFrame(fighter_rows)
fighters_df["name_clean"] = fighters_df["name"].str.lower().str.strip()

fighters_df["recent_form_score"] = fighters_df["name_clean"].apply(lambda n: recent_form_score(fight_lookup.get(n, [])))
fighters_df["win_streak_score"] = fighters_df["name_clean"].apply(lambda n: win_streak_score(fight_lookup.get(n, []), fighters_df))
fighters_df["avg_opp_strength"] = fighters_df["name_clean"].apply(lambda n: avg_opp_strength(fight_lookup.get(n, []), fighters_df))

# === Merge fighter stats into fight dataframe
df["R_fighter_clean"] = df["R_fighter"].str.lower().str.strip()
df["B_fighter_clean"] = df["B_fighter"].str.lower().str.strip()

r_stats = fighters_df.add_prefix("R_")
b_stats = fighters_df.add_prefix("B_")
df = df.merge(r_stats, left_on="R_fighter_clean", right_on="R_name_clean", how="left")
df = df.merge(b_stats, left_on="B_fighter_clean", right_on="B_name_clean", how="left")

# === Encode stance
for col in ["R_stance", "B_stance"]:
    df[col] = df[col].fillna("Unknown")
    df[col] = LabelEncoder().fit_transform(df[col])

# === Drop unneeded columns
drop_cols = [c for c in df.columns if "fighter" in c or "name" in c or c in ["Referee", "date", "location", "weight_class", "title_bout"]]
df.drop(columns=drop_cols, inplace=True)
df.dropna(inplace=True)

# === Feature diffs
features = [
    "SLpM_diff", "SApM_diff", "TD_Avg_diff", "TD_Def_diff",
    "Str_Acc_diff", "Str_Def_diff", "Height_diff", "Reach_diff",
    "Recent_form_score_diff", "Win_streak_score_diff", "Avg_opp_strength_diff"
]

df["SLpM_diff"] = df["R_SLpM"] - df["B_SLpM"]
df["SApM_diff"] = df["B_SApM"] - df["R_SApM"]
df["TD_Avg_diff"] = df["R_TD Avg."] - df["B_TD Avg."]
df["TD_Def_diff"] = 0.6 * (df["R_TD Def."] - df["B_TD Def."])
df["Str_Acc_diff"] = df["R_Str. Acc."] - df["B_Str. Acc."]
df["Str_Def_diff"] = 0.5 * (df["R_Str. Def"] - df["B_Str. Def"])
df["Height_diff"] = 0.25 * (df["R_height"] - df["B_height"])
df["Reach_diff"] = 0.25 * (df["R_reach"] - df["B_reach"])
df["Recent_form_score_diff"] = df["R_recent_form_score"] - df["B_recent_form_score"]
df["Win_streak_score_diff"] = 0.4 * (df["R_win_streak_score"] - df["B_win_streak_score"])
df["Avg_opp_strength_diff"] = df["R_avg_opp_strength"] - df["B_avg_opp_strength"]

# === Symmetrize features and label
df["f1_won"] = (df["Winner"] == 0).astype(int)  # Red (f1) win → 1
X = df[features]
y = df["f1_won"]  # <- ✅ Use symmetric label


# === Train model
X = df[features]
y = df["f1_won"]  # ✅ This is the true label for order-invariant training

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, stratify=y, test_size=0.2, random_state=42)
sample_weights = compute_sample_weight("balanced", y_train)

# SHAP fallback (weights = 1)
shap_weights = np.ones(X_train.shape[1])
for i, feat in enumerate(features):
    if feat in ["Recent_form_score_diff", "Win_streak_score_diff", "Avg_opp_strength_diff"]:
        shap_weights[i] = max(shap_weights[i], 0.15)

X_train_weighted = X_train * shap_weights
X_test_weighted = X_test * shap_weights

clf = GradientBoostingClassifier(n_estimators=500, learning_rate=0.03, max_depth=4, subsample=0.9, random_state=42)
clf.fit(X_train_weighted, y_train, sample_weight=sample_weights)

# Save
joblib.dump(clf, "mlp_model.joblib")
joblib.dump(scaler, "scaler.joblib")
np.save("shap_feature_weights.npy", shap_weights)
pd.DataFrame({"feature": features}).to_csv("feature_list.csv", index=False)

print("✅ Model retrained successfully. Order invariant. Recency-aware. Defense-weighted.")
