from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from app.utils import get_fighter_stats, predict_match, fighters_df

router = APIRouter()

MODEL_VERSION = "v1.2.3"

class PredictRequest(BaseModel):
    fighter1: str
    fighter2: str

@router.post("/predict")
def predict_fight(request: PredictRequest):
    try:
        f1 = get_fighter_stats(request.fighter1)
        f2 = get_fighter_stats(request.fighter2)

        if not f1 or not f2:
            raise HTTPException(
                status_code=404,
                detail="One or both fighters not found in the database."
            )

        w1 = f1.get("weight")
        w2 = f2.get("weight")

        if w1 is None or w2 is None:
            raise HTTPException(
                status_code=400,
                detail="Missing weight data for one or both fighters."
            )

        if 207 <= w1 <= 266 and 207 <= w2 <= 266:
            pass  # Both heavyweights
        elif abs(w1 - w2) > 5:
            raise HTTPException(
                status_code=400,
                detail="Fighters must be in the same weight class (within 5 lbs) unless both are heavyweights."
            )

        winner, confidence, feature_diffs, last5_1, last5_2, rematch, stat_favors, red_name, blue_name = predict_match(f1, f2)


        response = {
            "model_version": MODEL_VERSION,
            "predicted_winner": winner,
            "confidence": round(confidence, 2),
            "fighter1_last5": last5_1,
            "fighter2_last5": last5_2,
            "feature_differences": {k: float(v) for k, v in feature_diffs.items()},
            "fighter1": red_name,
            "fighter2": blue_name,
            "rematch": rematch,
            "is_champion": bool(f1["is_champion"]) if winner == f1["name"] else bool(f2["is_champion"]),
            "stat_favors": stat_favors
        }

        return response

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"[Prediction Error] {e}")
        raise HTTPException(status_code=500, detail="Prediction failed due to an unexpected error.")

@router.get("/fighters")
def get_all_fighters():
    return fighters_df["name"].dropna().unique().tolist()
