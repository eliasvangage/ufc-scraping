# log_analyze.py

import json
import pandas as pd
from pathlib import Path

log_path = Path(__file__).resolve().parent.parent / "logs" / "predictions.log"

if not log_path.exists():
    raise FileNotFoundError(f"Prediction log not found at: {log_path}")

with log_path.open("r", encoding="utf-8") as f:
    rows = [json.loads(line.strip()) for line in f if line.strip()]

records = []

for row in rows:
    base = {
        "timestamp": row["timestamp"],
        "fighter1": row["fighter1"],
        "fighter2": row["fighter2"],
        "winner": row["winner"],
        "confidence": row["confidence"],
        "rematch": row["rematch"]
    }
    for feat, val in row["weighted_feature_diffs"].items():
        base[f"feat_{feat}"] = val
    records.append(base)

df = pd.DataFrame(records)
# Ensure export folder exists
Path("logs").mkdir(parents=True, exist_ok=True)

# Export the DataFrame to CSV
df.to_csv("logs/predictions_export.csv", index=False)
print("✅ Exported to logs/predictions_export.csv")