// New endpoint for individual fighter details
import { RequestHandler } from "express";

export const handleFighterDetails: RequestHandler = async (req, res) => {
  try {
    const fighterName = decodeURIComponent(req.params.name);
    
    // Make request to Python backend
    const response = await fetch(`http://localhost:8000/fighter/${encodeURIComponent(fighterName)}`);
    
    if (!response.ok) {
      return res.status(404).json({ error: "Fighter not found" });
    }
    
    const fighterData = await response.json();
    res.json(fighterData);
  } catch (error) {
    console.error("Error fetching fighter details:", error);
    res.status(500).json({ error: "Failed to fetch fighter details" });
  }
};
