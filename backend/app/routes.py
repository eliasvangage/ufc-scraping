from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from app.utils import get_all_fighters, get_fighter_stats, predict_match, fighters_df, build_placeholder_fighter
from app import config
import numpy as np
import pandas as pd
import json
import time
from pathlib import Path
import math
from pydantic import BaseModel
from typing import List, Optional

class TrackedFight(BaseModel):
    fighter1: str
    fighter2: str
    predictedWinner: str
    confidenceScore: float
    oddsAtPrediction: str
    currentOdds: Optional[str]
    actualResult: Optional[str]
    correct: Optional[bool]

router = APIRouter()
MODEL_VERSION = "v1.2.3"
TRACKING_FILE = Path("data/prediction_logs.json")

shap_weights = np.load("ml/model/shap_feature_weights.npy")
feature_list = pd.read_csv("ml/model/feature_list.csv")["feature"].tolist()

class PredictionRequest(BaseModel):
    fighter1: str
    fighter2: str

def convert_to_builtin_type(val):
    if isinstance(val, (np.integer, np.floating)):
        return val.item()
    if isinstance(val, np.bool_):
        return bool(val)
    return val

def safe_json(val):
    if isinstance(val, (np.integer, np.floating)):
        val = float(val)
        return 0.0 if (math.isnan(val) or math.isinf(val)) else val
    if isinstance(val, float):
        return 0.0 if (math.isnan(val) or math.isinf(val)) else val
    if isinstance(val, np.bool_):
        return bool(val)
    if isinstance(val, dict):
        return {str(k): safe_json(v) for k, v in val.items()}
    if isinstance(val, list):
        return [safe_json(v) for v in val]
    return val


def normalize_keys(fighter: dict) -> dict:
    key_map = {
        "SLpM": "slpm",
        "SApM": "sapm",
        "TD Avg.": "tdAvg",
        "TD Def.": "tdDef",
        "Str. Acc.": "strAcc",
        "Str. Def": "strDef",
        "height": "height",
        "reach": "reach",
        "weight": "weight",
        "name": "name",
        "nickname": "nickname",
        "age": "age",
        "is_champion": "is_champion",
        "wins": "wins",
        "losses": "losses",
        "draws": "draws",
        "ufc_wins": "ufc_wins",
        "ufc_losses": "ufc_losses",
        "ufc_draws": "ufc_draws",
        "record": "record",
        "ko_pct": "ko_pct",
        "dec_pct": "dec_pct",
        "sub_pct": "sub_pct",
        "odds1": "odds1",   # 🆕 add this
        "odds2": "odds2"    # 🆕 and this
    }

    return {
        key_map.get(k, k): convert_to_builtin_type(v)
        for k, v in fighter.items()
        if k in key_map
    }


@router.get("/fighters")
def fetch_fighters():
    print("GET /fighters called")
    return get_all_fighters()

@router.get("/fighters_legacy")
def get_all_fighters_legacy():
    return fighters_df["name"].dropna().unique().tolist()

@router.post("/predict")
@router.post("/predict")
def predict_fight(request: PredictionRequest):
    print(f"\n🔮 Predicting: {request.fighter1} vs {request.fighter2}")

    try:
        # 1) Load fighters; allow missing by using placeholders
        f1_raw = get_fighter_stats(request.fighter1)
        f2_raw = get_fighter_stats(request.fighter2)
        fighter1_has_stats = bool(f1_raw)
        fighter2_has_stats = bool(f2_raw)

        f1 = f1_raw or build_placeholder_fighter(request.fighter1)
        f2 = f2_raw or build_placeholder_fighter(request.fighter2)

        # 2) Weight class check: allow if either weight is unknown (typical for debutants)
        def normalize_weight(w):
            if isinstance(w, str):
                w = w.split()[0]
            try:
                return round(float(w))
            except (ValueError, TypeError):
                return None

        def in_same_weight_class(w1: int | None, w2: int | None) -> bool:
            if w1 is None or w2 is None:
                # Skip strict validation when a fighter has no recorded weight (e.g., debut)
                return True
            weight_classes = [
                (115, 116), (125, 126), (135, 136),
                (145, 146), (155, 156), (170, 171),
                (185, 186), (205, 206), (206, 266)
            ]
            return any(low <= w1 <= high and low <= w2 <= high for low, high in weight_classes)

        w1 = normalize_weight(f1.get("weight"))
        w2 = normalize_weight(f2.get("weight"))
        print(f"DEBUG: {f1['name']} weight: {w1} | {f2['name']} weight: {w2}")

        if not in_same_weight_class(w1, w2):
            raise HTTPException(status_code=400, detail="Fighters are not in the same weight class")

        # 3) If either fighter is debut/missing stats -> force 50/50 Toss Up, no diffs
        def is_debut_like(fr: dict, has_stats: bool) -> bool:
            if not has_stats:
                return True
            return (fr.get("ufc_wins", 0) + fr.get("ufc_losses", 0) + fr.get("ufc_draws", 0)) == 0

        is_f1_debut = is_debut_like(f1, fighter1_has_stats)
        is_f2_debut = is_debut_like(f2, fighter2_has_stats)

        if is_f1_debut or is_f2_debut:
            print("⚠️ Debut/missing stats detected — defaulting to 50/50 prediction")
            winner = f1["name"]  # arbitrary; UI shows 50/50
            confidence = 50.0
            feature_diffs = {str(feature): 0.0 for feature in feature_list if feature}
            f1_last5, f2_last5 = [], []
            rematch = False
            stat_favors = []
            top_3_contributors = []
            shap_weight_map = {}
            weighted_feature_diffs = {}
            debut_prediction = True
        else:
            # 4) Normal prediction path
            (winner, confidence, feature_diffs, f1_last5, f2_last5,
             rematch, stat_favors, red_name, blue_name) = predict_match(f1, f2)

            shap_weights_arr = shap_weights.tolist()
            feature_list_local = list(feature_diffs.keys())
            raw_feature_diffs = {k: float(v) for k, v in feature_diffs.items()}
            shap_weight_map = {feature: round(shap_weights_arr[i], 4)
                               for i, feature in enumerate(feature_list_local)}
            weighted_feature_diffs = {
                feature: round(raw_feature_diffs[feature] * shap_weights_arr[i], 4)
                for i, feature in enumerate(feature_list_local)
            }
            top_3 = sorted(weighted_feature_diffs.items(),
                           key=lambda x: abs(x[1]), reverse=True)[:3]
            top_3_contributors = [f"{k} ({v:+.3f})" for k, v in top_3]
            debut_prediction = False

        # 5) Normalize fighter objects for UI
        normalized_f1 = normalize_keys(f1)
        normalized_f2 = normalize_keys(f2)

        # 6) Optional logging (only when we had a real model prediction)
        if not debut_prediction:
            log_path = Path("logs/predictions.log")
            log_path.parent.mkdir(parents=True, exist_ok=True)
            log_data = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "fighter1": request.fighter1,
                "fighter2": request.fighter2,
                "winner": winner,
                "confidence": float(confidence),
                "rematch": rematch,
                "raw_feature_diffs": raw_feature_diffs,
                "shap_weights": shap_weight_map,
                "weighted_feature_diffs": weighted_feature_diffs,
                "top_3_contributors": top_3_contributors
            }
            with log_path.open("a", encoding="utf-8") as log_file:
                log_file.write(json.dumps(log_data) + "\n")

        # 7) Response — include flags so UI can show “Debut / No stats” icon
        return safe_json({
            "model_version": MODEL_VERSION,
            "predicted_winner": str(winner),
            "confidence": float(confidence),
            "feature_differences": feature_diffs,
            "fighter1_last5": list(map(str, f1_last5)),
            "fighter2_last5": list(map(str, f2_last5)),
            "fighter1": str(f1["name"]),
            "fighter2": str(f2["name"]),
            "fighter1_data": normalized_f1,
            "fighter2_data": normalized_f2,
            "rematch": bool(rematch),
            "stat_favors": [{"stat": str(sf["stat"]), "favors": str(sf["favors"])} for sf in stat_favors],
            "is_champion": bool(f1["is_champion"]) if winner == f1["name"] else bool(f2["is_champion"]),
            "debut_prediction": debut_prediction,
            "fighter1_has_stats": bool(fighter1_has_stats),
            "fighter2_has_stats": bool(fighter2_has_stats),
        })

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"[Prediction Error] {e}")
        raise HTTPException(status_code=500, detail="Prediction failed due to an unexpected error.")

@router.get("/upcoming")
def get_upcoming_cards():
    upcoming_path = Path("data/upcoming_cards.json")
    odds_path = Path("data/ufc_odds.json")

    if not upcoming_path.exists():
        raise HTTPException(status_code=404, detail="upcoming_cards.json not found")

    try:
        with upcoming_path.open("r", encoding="utf-8") as f:
            cards = json.load(f)

        odds_data = []
        if odds_path.exists():
            with odds_path.open("r", encoding="utf-8") as f:
                odds_data = json.load(f)

        def normalize(name: str) -> str:
            return name.lower().strip()

        for event in cards:
            for fight in event.get("fights", []):
                red = normalize(fight.get("fighter_red", ""))
                blue = normalize(fight.get("fighter_blue", ""))

                match_found = False
                
                if isinstance(odds_data, dict):
                    for event in cards:
                        for fight in event.get("fights", []):
                            red = normalize(fight.get("fighter_red", ""))
                            blue = normalize(fight.get("fighter_blue", ""))
                            key = "|".join(sorted([red, blue]))
                            odds = odds_data.get(key)

                            if odds:
                                fight["odds1"] = odds.get(red, "N/A")
                                fight["odds2"] = odds.get(blue, "N/A")
                else:
                    print("⚠️ odds_data is not a dict — check the JSON format.")


        return JSONResponse(content=cards)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load upcoming cards: {e}")

@router.get("/config")
def get_config():
    return {
        "APPLY_FORM_BOOST": config.APPLY_FORM_BOOST,
        "APPLY_STREAK_BOOST": config.APPLY_STREAK_BOOST,
        "APPLY_STAT_DOMINANCE_BONUS": config.APPLY_STAT_DOMINANCE_BONUS,
        "DISPLAY_CHAMPION_BADGE": config.DISPLAY_CHAMPION_BADGE,
        "DEBUG_LOGGING": config.DEBUG_LOGGING,
        "MAX_BOOST": config.MAX_BOOST,
        "MODEL_VERSION": config.MODEL_VERSION
    }

@router.get("/full_fighters")
def get_full_fighters():
    path = Path("data/ufc_fighters.json")
    if not path.exists():
        return JSONResponse(status_code=404, content={"error": "File not found"})

    with open(path, "r", encoding="utf-8") as f:
        fighters = json.load(f)
    return JSONResponse(content=fighters)

@router.get("/ufc_only_fighters")
def get_ufc_only_fighters():
    path = Path("data/ufc_fighters.json")
    if not path.exists():
        raise HTTPException(status_code=404, detail="ufc_fighters.json not found")

    with open(path, "r", encoding="utf-8") as f:
        fighters = json.load(f)

    ufc_fighter_stats = []
    for fighter in fighters:
        fight_history = fighter.get("fight_history", [])
        ufc_fights = [f for f in fight_history if "UFC" in f.get("event", "")]

        ufc_wins = sum(1 for f in ufc_fights if f.get("result", "").lower() == "win")
        ufc_losses = sum(1 for f in ufc_fights if f.get("result", "").lower() == "loss")
        ufc_draws = sum(1 for f in ufc_fights if f.get("result", "").lower() in {"draw", "nc"})

        total_ufc = ufc_wins + ufc_losses + ufc_draws
        if total_ufc > 0:
            fighter_copy = dict(fighter)
            fighter_copy["record"] = f"{ufc_wins}-{ufc_losses}-{ufc_draws}"
            fighter_copy["ufc_wins"] = ufc_wins
            fighter_copy["ufc_losses"] = ufc_losses
            fighter_copy["ufc_draws"] = ufc_draws
            ufc_fighter_stats.append(fighter_copy)

    return JSONResponse(content=ufc_fighter_stats)

@router.get("/tracked")
def get_tracked_predictions():
    path = Path("data/tracked_predictions.json")

    if not path.exists():
        raise HTTPException(status_code=404, detail="Tracked predictions file not found.")

    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON in tracked_predictions.json.")