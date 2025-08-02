import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UpcomingCardList.css";

function UpcomingCardList() {
  const [fights, setFights] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/upcoming").then((res) => {
      setFights(res.data);
    });
  }, []);

  return (
    <div className="upcoming-list">
      {fights.map((fight, index) => (
        <div className="upcoming-card" key={index}>
          <h3>{fight.fighter1} vs {fight.fighter2}</h3>
          <p>🧠 Predicted: <strong>{fight.predicted_winner}</strong></p>
          <p>Confidence: {fight.confidence}%</p>
        </div>
      ))}
    </div>
  );
}

export default UpcomingCardList;
