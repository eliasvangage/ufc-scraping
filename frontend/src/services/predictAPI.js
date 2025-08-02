// src/services/predictAPI.js
import axios from "axios";

const API_BASE = "http://localhost:8000";

// 🧠 Predict Fight
export const predictFight = async (fighter1, fighter2) => {
  const res = await axios.post(`${API_BASE}/predict`, {
    fighter1,
    fighter2,
  });

  return {
    predicted_winner: res.data.predicted_winner,
    confidence: res.data.confidence,
    fighter1_last5: res.data.fighter1_last5,
    fighter2_last5: res.data.fighter2_last5,
    feature_differences: res.data.feature_differences,
    fighter1: res.data.fighter1,
    fighter2: res.data.fighter2,
    rematch: res.data.rematch,
    is_champion: res.data.is_champion, // ✅ Include if winner is champ
  };
};

// 📥 Fetch Fighter List
export const fetchFighters = async () => {
  const res = await axios.get(`${API_BASE}/fighters`);
  return res.data;
};
