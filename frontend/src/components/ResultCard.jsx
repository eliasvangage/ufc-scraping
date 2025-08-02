import React from "react";
import "./ResultCard.css";

function ResultCard({ result }) {
  if (!result) return null;

  const {
    predicted_winner,
    confidence,
    fighter1_last5,
    fighter2_last5,
    feature_differences = {},
    fighter1,
    fighter2,
    rematch,
    is_champion,
  } = result;

  const statLabels = {
    SLpM_diff: "Strikes Landed/Min",
    SApM_diff: "Strikes Absorbed/Min",
    TD_Avg_diff: "Takedowns/15min",
    TD_Def_diff: "Takedown Defense",
    Str_Acc_diff: "Striking Accuracy",
    Str_Def_diff: "Striking Defense",
    Reach_diff: "Reach",
  };

  const flippedStats = ["SApM_diff"]; // lower is better

  const determineFavored = (key, diff) => {
    const num = parseFloat(diff);
    if (isNaN(num)) return "N/A";
    if (flippedStats.includes(key)) {
      return num < 0 ? fighter1 : num > 0 ? fighter2 : "Equal";
    }
    return num > 0 ? fighter1 : num < 0 ? fighter2 : "Equal";
  };

  const getClassName = (name) => `favored-name ${name === fighter1 ? 'highlight-f1' : 'highlight-f2'}`;

  return (
    <div className="result-card">
      <h2 className="result-heading">🧠 Model Prediction</h2>

      <div className="winner-banner">
        <span className="winner-name">{predicted_winner}</span>
        {is_champion && (
          <img
            src="/assets/ufc-belt.png"
            alt="Champion Belt"
            className="champion-belt"
          />
        )}
      </div>

      <p className="confidence-text">
        <strong>Confidence:</strong> {confidence.toFixed(2)}%
      </p>

      {rematch && (
        <div className="rematch-banner">
          ⚔️ This is a rematch!
        </div>
      )}

      <h3 className="sub-heading">📄 Last 5 Results</h3>
      <p><strong>{fighter1}:</strong> {fighter1_last5?.join(" ")}</p>
      <p><strong>{fighter2}:</strong> {fighter2_last5?.join(" ")}</p>

      <h3 className="sub-heading">📊 Stat Comparison</h3>
      <table className="feature-table">
        <thead>
          <tr>
            <th>Stat</th>
            <th>Favors</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(statLabels).map(([key, label]) => {
            const raw = feature_differences[key];
            const diff = typeof raw === "number" ? raw : parseFloat(raw);
            if (isNaN(diff)) return null;

            const favored = determineFavored(key, diff);
            return (
              <tr key={key}>
                <td>{label}</td>
                <td className={getClassName(favored)}>
                  {favored !== "Equal" && favored !== "N/A" ? `${favored} 🔥` : favored}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ResultCard;
