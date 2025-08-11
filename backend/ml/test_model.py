# test_model_load.py

import joblib
import os

MODEL_PATH = "mlp_model.joblib"  # 🔁 Adjust if it's in a subfolder like "ml/mlp_model.joblib"

def test_model_load():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model file not found at: {MODEL_PATH}")
        return

    try:
        model = joblib.load(MODEL_PATH)
        print("✅ Model loaded successfully.")
        print(f"Model type: {type(model)}")
        if hasattr(model, "predict"):
            print("🔍 Sample predict method exists.")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        

if __name__ == "__main__":
    test_model_load()
