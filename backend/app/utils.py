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

def parse_height(height_str):
    match = re.match(r"(\d+)'[ ]?(\d+)?", height_str)
    if not match:
        return None
    feet = int(match.group(1))
    inches = int(match.group(2)) if match.group(2) else 0
    return round(feet + inches / 12, 3)  # height in feet

def parse_reach(reach_str):
    try:
        return float(reach_str.replace('"', '').strip())  # inches
    except:
        return None

fighters_df = pd.DataFrame([
    {
        "name": f["name"],
        "nickname": f.get("nickname", ""),
        "dob": f.get("dob", None),    
        "weight": float(f["weight"].replace(" lbs.", "")) if "lbs" in f["weight"] else None,
        "height": parse_height(f["height"]),
        "reach": parse_reach(f["reach"]),
        "SLpM": float(f["stats"].get("SLpM", "0")),
        "SApM": float(f["stats"].get("SApM", "0")),
        "TD Avg.": float(f["stats"].get("TD Avg.", "0")),
        "TD Def.": float(f["stats"].get("TD Def.", "0%").replace("%", "")),
        "Str. Acc.": float(f["stats"].get("Str. Acc.", "0%").replace("%", "")),
        "Str. Def": float(f["stats"].get("Str. Def", "0%").replace("%", "")),
        "fight_history": f.get("fight_history", []),
        "is_champion": f.get("is_champion", False),
        "record": f.get("record", "0-0-0")
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
        return 0.5  # Neutral if no data
    
    row = opp.iloc[0]
    
    # Defensive skill score (existing metric)
    def_score = (row["TD Def."] + row["Str. Def"]) / 200
    
    # UFC record score
    wins = row.get("ufc_wins", 0)
    losses = row.get("ufc_losses", 0)
    draws = row.get("ufc_draws", 0)
    total_fights = wins + losses + draws
    record_score = wins / total_fights if total_fights > 0 else 0.5
    
    # Weighted combination
    # Adjust weights if you want record to have more/less influence
    return round(0.6 * def_score + 0.4 * record_score, 4)

def fight_recency_weight(fight):
    date_str = fight.get("date")
    if not date_str:
        return 0.25
    fight_date = datetime.strptime(date_str, "%Y-%m-%d")
    months_ago = (datetime.now() - fight_date).days / 30.0
    return max(0.0, 1 - months_ago / 24.0)

def is_debut(fighter: dict) -> bool:
    return (
        len(fighter.get("fight_history", [])) == 0 or
        all(stat in ["0", "0%", "0.0", None, "--"] for stat in [
            fighter.get("stats", {}).get("SLpM"),
            fighter.get("stats", {}).get("Str. Acc."),
            fighter.get("stats", {}).get("SApM"),
            fighter.get("stats", {}).get("Str. Def"),
            fighter.get("stats", {}).get("TD Avg."),
            fighter.get("stats", {}).get("TD Def.")
        ])
    )

def recent_form_score(fights, limit=5):
    """
    Returns a recency-weighted form score between -1 and +1.
    Win always improves score, loss always decreases score.
    Does not normalize in a way that erases head-to-head results.
    """
    if not fights:
        return 0.0

    score = 0.0
    total_weight = 0.0

    for f in fights[:limit]:
        r = safe_result(f)
        weight = fight_recency_weight(f)

        if r == "win":
            score += 1.0 * weight
        elif r == "loss":
            score -= 1.0 * weight
        # draws and NC count as 0, but still add to total weight to prevent bias
        total_weight += weight

    if total_weight == 0:
        return 0.0

    # scale to roughly -1 to +1 range
    return round(score / total_weight, 4)


def win_streak_score(fights, limit=5):
    """
    Measures strength of current win streak with recency weighting.
    Breaks streak on first loss.
    """
    if not fights:
        return 0.0

    score = 0.0
    total_weight = 0.0

    for f in fights[:limit]:
        r = safe_result(f)
        if r == "win":
            weight = fight_recency_weight(f)
            score += opponent_strength(f.get("opponent", "")) * weight
            total_weight += weight
        elif r in {"nc", "draw"}:
            continue
        else:
            break  # streak broken

    if total_weight == 0:
        return 0.0

    # normalize by limit so 5 recent wins = ~1.0 max
    return round(score / limit, 4)


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

def safe_result(fight):
    result = fight.get("result", "")
    return result.lower() if isinstance(result, str) else ""

def get_finish_percentages(fights):
    if not fights:
        return {"ko_pct": 0.0, "dec_pct": 0.0, "sub_pct": 0.0}

    wins = [f for f in fights if f.get("result", "").lower() == "win"]
    total_wins = len(wins)
    if total_wins == 0:
        return {"ko_pct": 0.0, "dec_pct": 0.0, "sub_pct": 0.0}

    ko_wins = sum(1 for f in wins if "ko" in f.get("method", "").lower() or "tko" in f.get("method", "").lower())
    sub_wins = sum(1 for f in wins if "sub" in f.get("method", "").lower())
    dec_wins = sum(1 for f in wins if "dec" in f.get("method", "").lower())

    return {
        "ko_pct": round((ko_wins / total_wins) * 100, 1),
        "dec_pct": round((dec_wins / total_wins) * 100, 1),
        "sub_pct": round((sub_wins / total_wins) * 100, 1)
    }

def calculate_age(dob_str):
    """Calculate age in years from DOB string like 'Jun 27, 1984'."""
    if not dob_str:
        return None
    try:
        dob = datetime.strptime(dob_str, "%b %d, %Y")
        today = datetime.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age
    except Exception:
        return None
    
def build_placeholder_fighter(name: str) -> dict:
    """Return a minimal fighter dict when the athlete isn't in the DB yet."""
    return {
        "name": name,
        "nickname": "",
        "weight": None,
        "height": None,
        "reach": None,
        "SLpM": 0.0,
        "SApM": 0.0,
        "TD Avg.": 0.0,
        "TD Def.": 0.0,
        "Str. Acc.": 0.0,
        "Str. Def": 0.0,
        "fight_history": [],
        "recent_form_score": 0.0,
        "win_streak_score": 0.0,
        "avg_opp_strength": 0.5,
        "last_results": [],
        "is_champion": False,
        "record": "0-0-0",
        "ufc_wins": 0,
        "ufc_losses": 0,
        "ufc_draws": 0,
        "ko_pct": 0.0,
        "sub_pct": 0.0,
        "dec_pct": 0.0,
        "age": None,
    }


def get_fighter_stats(name):
    row = fighters_df[fighters_df["name_clean"] == name.lower().strip()]
    if row.empty:
        return None
    row = row.iloc[0]
    all_fights = row["fight_history"] or []
    ufc_fights = [f for f in all_fights if "UFC" in f.get("event", "")]

    # UFC-only record
    ufc_wins = sum(1 for f in ufc_fights if f.get("result", "").lower() == "win")
    ufc_losses = sum(1 for f in ufc_fights if f.get("result", "").lower() == "loss")
    ufc_draws = sum(1 for f in ufc_fights if f.get("result", "").lower() in {"draw", "nc"})

    finish_pcts = get_finish_percentages(ufc_fights)

    return {
        "name": row["name"],
        "nickname": row.get("nickname", ""),  # ← adds nickname
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
        "record": row.get("record", "0-0-0"), 
        "ufc_wins": ufc_wins,
        "ufc_losses": ufc_losses,
        "ufc_draws": ufc_draws,
        "ko_pct": finish_pcts["ko_pct"],
        "sub_pct": finish_pcts["sub_pct"],
        "dec_pct": finish_pcts["dec_pct"],
         "age": calculate_age(row.get("dob"))               # ← adds age
    }


def safe_log(x, base=10):
    return np.log1p(x) / np.log(base)

def build_feature_vector(f1, f2):
    # Use safe TD_Def if fighter has < 4 UFC fights
    td_def_1 = f1["TD Def."] if len(f1["fight_history"]) >= 4 else 50.0
    td_def_2 = f2["TD Def."] if len(f2["fight_history"]) >= 4 else 50.0

    # Compute TD_SApM_combo safely
    td_sapm_combo = (f2["SApM"] - f1["SApM"]) * (td_def_1 - td_def_2) / 100

    return pd.DataFrame([{k: v for k, v in {
        "SLpM_diff": 0.5 * (f1["SLpM"] - f2["SLpM"]),
        "SApM_diff": f1["SApM"] - f2["SApM"],
        "TD_Avg_diff": f1["TD Avg."] - f2["TD Avg."],
        "TD_Def_diff": 0.3 * (f1["TD Def."] - f2["TD Def."]),
        "Str_Acc_diff": f1["Str. Acc."] - f2["Str. Acc."],
        "Str_Def_diff": 0.5 * (f1["Str. Def"] - f2["Str. Def"]),
        "Height_diff": 0.25 * (f1["height"] - f2["height"]),
        "Reach_diff": 0.25 * (f1["reach"] - f2["reach"]),
        "Recent_form_score_diff": f1["recent_form_score"] - f2["recent_form_score"],
        "Win_streak_score_diff": 0.4 * (f1["win_streak_score"] - f2["win_streak_score"]),
        "Avg_opp_strength_diff": f1["avg_opp_strength"] - f2["avg_opp_strength"],
        "TD_SApM_combo": td_sapm_combo,
    }.items() if k in feature_names}])[feature_names]

def get_opponent_ufc_record(opp_name):
    """Return opponent's UFC record as (wins, losses, draws)."""
    if not opp_name:
        return (0, 0, 0)

    opp_clean = opp_name.lower().strip()

    # Try to match in fighters_df
    opp_row = fighters_df[fighters_df["name_clean"] == opp_clean]
    if not opp_row.empty:
        row = opp_row.iloc[0]
        wins = int(row.get("ufc_wins", 0) or 0)
        losses = int(row.get("ufc_losses", 0) or 0)
        draws = int(row.get("ufc_draws", 0) or 0)
        # If those values are already populated, return them
        if wins + losses + draws > 0:
            return (wins, losses, draws)

        # Otherwise, reconstruct from fight history
        fights = row.get("fight_history", [])
        ufc_fights = [f for f in fights if "UFC" in f.get("event", "")]
        wins = sum(1 for f in ufc_fights if f.get("result", "").lower() == "win")
        losses = sum(1 for f in ufc_fights if f.get("result", "").lower() == "loss")
        draws = sum(1 for f in ufc_fights if f.get("result", "").lower() in {"draw", "nc"})
        return (wins, losses, draws)

    # Opponent not in DB — no info
    return (0, 0, 0)


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

def recent_rematch_winner(f1, f2, max_fights_ago=2):
    """
    Returns winner name if f1 or f2 won clearly in last 1-2 fights against each other.
    """
    f1_name = f1["name"].lower()
    f2_name = f2["name"].lower()

    for i, fight in enumerate(f1.get("fight_history", [])[:max_fights_ago]):
        opp = fight.get("opponent", "").lower()
        if opp == f2_name and fight.get("result", "").lower() == "win":
            method = fight.get("method", "").lower()
            if any(m in method for m in ["ko", "tko", "submission", "unanimous"]):
                return f1["name"]

    for i, fight in enumerate(f2.get("fight_history", [])[:max_fights_ago]):
        opp = fight.get("opponent", "").lower()
        if opp == f1_name and fight.get("result", "").lower() == "win":
            method = fight.get("method", "").lower()
            if any(m in method for m in ["ko", "tko", "submission", "unanimous"]):
                return f2["name"]

    return None


def predict_match(f1_input, f2_input):
    # --- Canonical order (alphabetical by fighter name) ---
    original_pair = (f1_input["name"], f2_input["name"])
    pair = sorted([f1_input, f2_input], key=lambda d: d["name"].strip().lower())
    f1_input, f2_input = pair[0], pair[1]  # canonical F1, F2

    print(f"ALPHA ORDER (canonical): {f1_input['name']} (f1) vs {f2_input['name']} (f2)")

    # === Debug: Show fighter stats before feature calculation ===
    print(f"\n🔴 RED CORNER: {f1_input['name']}")
    for k, v in f1_input.items():
        if isinstance(v, (int, float)) and k in ["SLpM", "SApM", "TD Avg.", "TD Def.", "Str. Acc.", "Str. Def"]:
            print(f"  {k}: {v}")

    print(f"\n🔵 BLUE CORNER: {f2_input['name']}")
    for k, v in f2_input.items():
        if isinstance(v, (int, float)) and k in ["SLpM", "SApM", "TD Avg.", "TD Def.", "Str. Acc.", "Str. Def"]:
            print(f"  {k}: {v}")

    sa_diff = f1_input["SApM"] - f2_input["SApM"]
    print(f"[SApM] {f1_input['name']}: {f1_input['SApM']} | {f2_input['name']}: {f2_input['SApM']} → Diff: {sa_diff:.3f}")

    # === Build features as (f1 - f2) in canonical order ===
    X = build_feature_vector(f1_input, f2_input)
    X_scaled = scaler.transform(X)

    # Prob canonical f1 wins
    raw_proba = model.predict_proba(X_scaled)[0][1]

    # === Confidence normalization helper (hard cap @ 70) ===
    def normalize_confidence(p: float, low=50.0, high=70.0) -> float:
        p = max(0.01, min(p, 0.99))              # gentle clamp
        scaled = low + abs(p - 0.5) * 2 * (high - low)
        return round(min(scaled, high), 2)       # enforce cap

    base_confidence = normalize_confidence(raw_proba)
    boosted_proba = raw_proba

    # === Stat Favors ===
    stat_favors = get_stat_favors(f1_input, f2_input)
    if APPLY_STAT_DOMINANCE_BONUS:
        initial_winner = f1_input["name"] if boosted_proba >= 0.5 else f2_input["name"]
        winner_count = sum(1 for s in stat_favors if s["favors"] == initial_winner)
        loser_count  = sum(1 for s in stat_favors if s["favors"] not in [initial_winner, "Even"])
        net_advantage = winner_count - loser_count
        stat_boost = net_advantage * 0.5
    else:
        stat_boost = 0.0

    # === Form & Streak Boosts (canonical) ===
    recent_diff = f1_input["recent_form_score"] - f2_input["recent_form_score"]
    streak_diff = f1_input["win_streak_score"] - f2_input["win_streak_score"]

    form_boost = 0.0
    if APPLY_FORM_BOOST:
        form_boost = abs(recent_diff) * 6
        if (boosted_proba >= 0.5 and recent_diff < 0) or (boosted_proba < 0.5 and recent_diff > 0):
            form_boost *= -1

    streak_boost = 0.0
    if APPLY_STREAK_BOOST:
        streak_boost = abs(streak_diff) * 13
        if (boosted_proba >= 0.5 and streak_diff < 0) or (boosted_proba < 0.5 and streak_diff > 0):
            streak_boost *= -1

    # === Convert boosts from confidence points → probability space
    #     Use same bounds as normalize_confidence (low=50, high=70)
    def conf_boost_to_prob(boost_pts, low=50.0, high=75.0):
        return boost_pts * (0.5 / (high - low))

    # Disable boosts for small samples
    if len(f1_input["fight_history"]) < 4 or len(f2_input["fight_history"]) < 4:
        stat_boost = form_boost = streak_boost = 0.0

    boosted_proba += conf_boost_to_prob(stat_boost)
    boosted_proba += conf_boost_to_prob(form_boost)
    boosted_proba += conf_boost_to_prob(streak_boost)

    # Clamp probability
    boosted_proba = min(max(boosted_proba, 0.0), 1.0)

    # === Final Winner & Confidence in canonical space ===
    winner = f1_input["name"] if boosted_proba >= 0.5 else f2_input["name"]
    confidence = normalize_confidence(max(boosted_proba, 1 - boosted_proba))  # capped inside

    # === Rematch Info ===
    rematch = is_rematch(f1_input, f2_input)

    # === Optional: Opponent-strength adjustment (kept canonical) ===
    if DEBUG_LOGGING:
        def combined_ufc_record(fighter):
            total_wins = total_losses = total_draws = 0
            for fight in fighter["fight_history"]:
                opp_w, opp_l, opp_d = get_opponent_ufc_record(fight.get("opponent"))
                total_wins += opp_w
                total_losses += opp_l
                total_draws += opp_d
            return total_wins, total_losses, total_draws

        f1_opp_w, f1_opp_l, f1_opp_d = combined_ufc_record(f1_input)
        f2_opp_w, f2_opp_l, f2_opp_d = combined_ufc_record(f2_input)

        def win_pct(w, l, d):
            total = w + l
            return (w / total) if total > 0 else 0.5

        f1_opp_winpct = win_pct(f1_opp_w, f1_opp_l, f1_opp_d)
        f2_opp_winpct = win_pct(f2_opp_w, f2_opp_l, f2_opp_d)
        winpct_diff = f1_opp_winpct - f2_opp_winpct
        opp_strength_boost = round(abs(winpct_diff) * 10, 2)

                # If f1's opposition was stronger (winpct_diff > 0), move probability toward f1.
        # If f2's was stronger (winpct_diff < 0), move probability toward f2.
        boosted_proba += conf_boost_to_prob(opp_strength_boost) * (1 if winpct_diff > 0 else -1)


        boosted_proba = min(max(boosted_proba, 0.0), 1.0)
        winner = f1_input["name"] if boosted_proba >= 0.5 else f2_input["name"]
        confidence = normalize_confidence(max(boosted_proba, 1 - boosted_proba))  # still capped

        print("📊 Opponent UFC Records:")
        print(f"   {f1_input['name']}: {f1_opp_w}-{f1_opp_l}-{f1_opp_d} (Win%: {f1_opp_winpct:.3f})")
        print(f"   {f2_input['name']}: {f2_opp_w}-{f2_opp_l}-{f2_opp_d} (Win%: {f2_opp_winpct:.3f})")
        print(f"   Win% Diff: {winpct_diff:+.3f} → Potential Confidence Change: {opp_strength_boost:+.2f} pts")
        print(f"🔍 Normalized Order: {f1_input['name']} vs {f2_input['name']}")
        print(f"  -> Winner: {winner} | Confidence: {confidence:.1f}%")
        print(f"🧠 Raw model probability (f1 wins): {raw_proba:.4f}")
        print(f"🧮 Boosted probability (f1 wins): {boosted_proba:.4f}")
        print(f"🔧 Normalized base confidence: {base_confidence:.2f}")
        print(f"📊 Final Prediction: {winner} | Confidence: {confidence:.1f}%")
        print(f"    ↪ Stat boost: {stat_boost:.2f}")
        print(f"    ↪ Form boost: {form_boost:.2f}")
        print(f"    ↪ Streak boost: {streak_boost:.2f}")
        print("[RAW Features] (display order):")
        X_debug = build_feature_vector(f1_input, f2_input)
        X_scaled_debug = scaler.transform(X_debug)
        for k, v in X_debug.iloc[0].items():
            print(f"{k}: {v:.3f}")
        print("[SCALED Features] (display order):")
        for i, k in enumerate(X_debug.columns):
            print(f"{k}: {X_scaled_debug[0][i]:.3f}")
        print(f"Rematch Detected: {rematch}")

    # === Feature “contributor” display (unchanged) ===
    shap_weights = {f: 1.0 for f in X.columns}
    shap_weights["TD_Def_diff"] = 0.25  # reduce this weight

    weighted_feature_diffs = {
        f: round(X.iloc[0][f] * shap_weights[f], 4)
        for f in X.columns
    }

    top_contributors = sorted(
        weighted_feature_diffs.items(),
        key=lambda kv: abs(kv[1]),
        reverse=True
    )[:3]

    # === Recent rematch override (still capped) ===
    recent_rematch = recent_rematch_winner(f1_input, f2_input)
    if recent_rematch:
        print(f"⚠️ Overriding prediction due to recent dominant rematch result: {recent_rematch} won last time.")
        winner = recent_rematch
        confidence = 70.0  # obey the global cap

    # === Log entry ===
    log_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "fighter1": f1_input["name"],
        "fighter2": f2_input["name"],
        "winner": winner,
        "confidence": confidence,
        "rematch": rematch,
        "raw_feature_diffs": X.iloc[0].to_dict(),
        "shap_weights": shap_weights,
        "weighted_feature_diffs": weighted_feature_diffs,
        "top_3_contributors": [f"{k} ({v:+.3f})" for k, v in top_contributors],
    }

    with open("predictions.log", "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

    # === Return (order-independent; canonical names last) ===
    return (
        winner,
        confidence,
        X.iloc[0],
        f1_input["last_results"],
        f2_input["last_results"],
        rematch,
        stat_favors,
        f1_input["name"],
        f2_input["name"],
    )
