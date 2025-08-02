# backend/app/models.py

from pydantic import BaseModel
from typing import Dict, Any

class PredictionRequest(BaseModel):
    fighter1: Dict[str, Any]
    fighter2: Dict[str, Any]
