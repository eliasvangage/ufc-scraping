from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from app.utils import get_all_fighters, get_fighter_stats, predict_match, fighters_df
from app import config
import numpy as np
import pandas as pd
import json
import time
from pathlib import Path

router = APIRouter()
MODEL_VERSION = "v1.2.3"

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
        "is_champion": "is_champion",
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
def predict_fight(request: PredictionRequest):
    print(f"\n🔮 Predicting: {request.fighter1} vs {request.fighter2}")

    try:
        f1 = get_fighter_stats(request.fighter1)
        f2 = get_fighter_stats(request.fighter2)

        if not f1 or not f2:
            raise HTTPException(status_code=404, detail="One or both fighters not found in the database.")

        def in_same_weight_class(w1: int, w2: int) -> bool:
            if w1 is None or w2 is None:
                return False
            weight_classes = [
                (115, 116), (125, 126), (135, 136),
                (145, 146), (155, 156), (170, 171),
                (185, 186), (205, 206), (206, 266)
            ]
            return any(low <= w1 <= high and low <= w2 <= high for low, high in weight_classes)

        def normalize_weight(w):
            if isinstance(w, str):
                w = w.split()[0]
            try:
                return round(float(w))
            except (ValueError, TypeError):
                return None

        w1 = normalize_weight(f1.get("weight"))
        w2 = normalize_weight(f2.get("weight"))

        print(f"DEBUG: {f1['name']} weight: {w1} | {f2['name']} weight: {w2}")

        if not in_same_weight_class(w1, w2):
            raise HTTPException(
                status_code=400,
                detail="Fighters are not in the same weight class"
            )

        winner, confidence, feature_diffs, f1_last5, f2_last5, rematch, stat_favors, red_name, blue_name = predict_match(f1, f2)

        shap_weights_arr = shap_weights.tolist()
        feature_list_local = list(feature_diffs.keys())

        raw_feature_diffs = {k: float(v) for k, v in feature_diffs.items()}
        shap_weight_map = {feature: round(shap_weights_arr[i], 4) for i, feature in enumerate(feature_list_local)}
        weighted_feature_diffs = {
            feature: round(raw_feature_diffs[feature] * shap_weights_arr[i], 4)
            for i, feature in enumerate(feature_list_local)
        }

        top_3 = sorted(weighted_feature_diffs.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        top_3_contributors = [f"{k} ({v:+.3f})" for k, v in top_3]

        normalized_f1 = normalize_keys(f1)
        normalized_f2 = normalize_keys(f2)

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

        return {
            "model_version": MODEL_VERSION,
            "predicted_winner": str(winner),
            "confidence": float(confidence),
            "feature_differences": raw_feature_diffs,
            "fighter1_last5": list(map(str, f1_last5)),
            "fighter2_last5": list(map(str, f2_last5)),
            "fighter1": str(f1["name"]),
            "fighter2": str(f2["name"]),
            "fighter1_data": normalized_f1,
            "fighter2_data": normalized_f2,
            "rematch": bool(rematch),
            "stat_favors": [{"stat": str(sf["stat"]), "favors": str(sf["favors"])} for sf in stat_favors],
            "is_champion": bool(f1["is_champion"]) if winner == f1["name"] else bool(f2["is_champion"])
        }

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"[Prediction Error] {e}")
        raise HTTPException(status_code=500, detail="Prediction failed due to an unexpected error.")

@router.get("/upcoming")
def get_upcoming_cards():
    path = Path("data/upcoming_cards.json")
    if not path.exists():
        raise HTTPException(status_code=404, detail="upcoming_cards.json not found")
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(content=data)
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
