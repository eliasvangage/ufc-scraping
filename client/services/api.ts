export interface Fighter {
  name: string;
  weight: number | null;
  height: number | null;
  reach: number | null;
  slpm: number;
  sapm: number;
  tdAvg: number;
  tdDef: number;
  strAcc: number;
  strDef: number;
  fight_history: Array<{
    opponent: string;
    result: string;
    event: string;
    date?: string;
    method?: string; // Added in case we send the finish method from backend
  }>;
  recent_form_score: number;
  win_streak_score: number;
  avg_opp_strength: number;
  last_results: string[];
  is_champion: boolean;

  record: string;
  ufc_wins: number;
  ufc_losses: number;
  ufc_draws: number;

  // 🆕 Added for finish method percentages
  ko_pct: number;
  dec_pct: number;
  sub_pct: number;
}

export interface PredictionRequest {
  fighter1: string;
  fighter2: string;
}

export interface PredictionResponse {
  predicted_winner: string;
  confidence: number;
  fighter1_last5: string[];
  fighter2_last5: string[];
  feature_differences: Record<string, number>;
  fighter1: string;
  fighter2: string;
  fighter1_data: Fighter;
  fighter2_data: Fighter;
  rematch: boolean;
  is_champion: boolean;
  fighter1_has_stats?: boolean;
  fighter2_has_stats?: boolean;
  
  stat_favors: Array<{
    stat: string;
    favors: string;
    
  }>;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  }

  async getFighters(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/fighters`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch fighters: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getFighterDetails(fighterName: string): Promise<Fighter | null> {
    try {
      const response = await fetch(`${this.baseUrl}/fighter/${encodeURIComponent(fighterName)}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch fighter details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        name: data.name,
        weight: Number(data.weight),
        height: Number(data.height),
        reach: Number(data.reach),
        slpm: Number(data.SLpM),
        sapm: Number(data.SApM),
        tdAvg: Number(data["TD Avg."]),
        tdDef: Number(data["TD Def."]),
        strAcc: Number(data["Str. Acc."]),
        strDef: Number(data["Str. Def"]),
        fight_history: data.fight_history,
        recent_form_score: Number(data.recent_form_score),
        win_streak_score: Number(data.win_streak_score),
        avg_opp_strength: Number(data.avg_opp_strength),
        last_results: data.last_results,
        is_champion: Boolean(data.is_champion),
        wins: data.wins ?? 0,
        losses: data.losses ?? 0,
        draws: data.draws ?? 0,
        ufc_wins: data.ufc_wins ?? 0,
        ufc_losses: data.ufc_losses ?? 0,
        ufc_draws: data.ufc_draws ?? 0,

      };

    } catch (error) {
      return this.getMockFighterData(fighterName);
    }
  }

  private getMockFighterData(fighterName: string): Fighter {
    const nameHash = fighterName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const weights = [125, 135, 145, 155, 170, 185, 205, 265];

    return {
      name: fighterName,
      weight: weights[Math.abs(nameHash) % weights.length],
      height: 160 + (Math.abs(nameHash) % 30),
      reach: 170 + (Math.abs(nameHash) % 40),
      slpm: 2.5 + (Math.abs(nameHash) % 50) / 10,
      sapm: 1.5 + (Math.abs(nameHash) % 40) / 10,
      tdAvg: (Math.abs(nameHash) % 50) / 10,
      tdDef: 50 + (Math.abs(nameHash) % 50),
      strAcc: 35 + (Math.abs(nameHash) % 30),
      strDef: 45 + (Math.abs(nameHash) % 35),
      fight_history: [],
      recent_form_score: (Math.abs(nameHash) % 100) / 100,
      win_streak_score: (Math.abs(nameHash) % 100) / 100,
      avg_opp_strength: (Math.abs(nameHash) % 100) / 100,
      last_results: this.generateLastResults(nameHash),
      is_champion: Math.abs(nameHash) % 100 < 10,
    };
  }

  private generateLastResults(seed: number): string[] {
    const results = ["W", "L", "D"];
    return Array.from({ length: 5 }, (_, i) => results[Math.abs(seed + i) % 3]);
  }

  async predictFight(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Prediction failed: ${response.statusText}`);
      }

      return await response.json();
    } catch {
      const winner = Math.random() > 0.5 ? request.fighter1 : request.fighter2;
      const confidence = Math.round(55 + Math.random() * 40);

      return {
        predicted_winner: winner,
        confidence,
        fighter1_last5: ["W", "W", "L", "W", "W"],
        fighter2_last5: ["W", "L", "W", "W", "L"],
        feature_differences: {
          slpm_diff: (Math.random() - 0.5) * 4,
          sapm_diff: (Math.random() - 0.5) * 3,
          tdAvg_diff: (Math.random() - 0.5) * 2,
        },
        fighter1: request.fighter1,
        fighter2: request.fighter2,
        fighter1_data: this.getMockFighterData(request.fighter1),
        fighter2_data: this.getMockFighterData(request.fighter2),
        rematch: Math.random() > 0.8,
        is_champion: Math.random() > 0.7,
        stat_favors: [
          { stat: "Striking Accuracy", favors: Math.random() > 0.5 ? request.fighter1 : request.fighter2 },
          { stat: "Takedown Defense", favors: Math.random() > 0.5 ? request.fighter1 : request.fighter2 },
          { stat: "Reach", favors: Math.random() > 0.5 ? request.fighter1 : request.fighter2 },
        ]
      };
    }
  }
}

export const apiService = new ApiService();
