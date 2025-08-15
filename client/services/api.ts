export interface Fighter {
  name: string;
  nickname?: string;
  height?: string | number;
  weight?: string | number;
  reach?: string | number;
  stance?: string;
  record: string;
  profile_url?: string;
  stats: {
    "SLpM": string;
    "Str. Acc.": string;
    "SApM": string;
    "Str. Def": string;
    "TD Avg.": string;
    "TD Acc.": string;
    "TD Def.": string;
    "Sub. Avg.": string;
  };
  fight_history: Array<{
    result: "win" | "loss" | "draw";
    opponent: string;
    KD: string;
    STR: string;
    TD: string;
    SUB: string;
    event: string;
    method: string;
    round: string;
    time: string;
  }>;
  dob?: string;
  age?: number;
  division?: string;
  is_champion?: boolean;
  ufc_record?: string;
  ufc_wins?: number;
  ufc_losses?: number;
  ufc_draws?: number;

  // Internal computed fields
  slpm?: number;
  sapm?: number;
  tdAvg?: number;
  tdDef?: number;
  strAcc?: number;
  strDef?: number;
  recent_form_score?: number;
  win_streak_score?: number;
  avg_opp_strength?: number;
  last_results?: string[];
  ko_pct?: number;
  dec_pct?: number;
  sub_pct?: number;
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

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  

  async getFighters(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/full_fighters`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch fighters: ${response.status} ${response.statusText}`);
      }

      const fighters = await response.json();
      // Extract just the names for the fighter list
      return fighters.map((fighter: any) => fighter.name);
    } catch (error) {
      console.warn('Fighter data unavailable, using offline data');
      throw error;
    }
  }

  async getFullFighters(): Promise<any[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/full_fighters`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        console.warn(`Full fighters API returned ${response.status}: ${response.statusText}`);
        throw new Error(`Failed to fetch full fighters: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Full fighters data received, count:', data.length);
      return data;
    } catch (error) {
      console.warn('Full fighter data unavailable, error:', error);
      throw error;
    }
  }

  async getFighterDetails(fighterName: string): Promise<Fighter | null> {
    try {
      console.log('Fetching fighter details for:', fighterName);

      // Get all fighters from full_fighters endpoint
      const allFighters = await this.getFullFighters();

      // Find the specific fighter by name
      const fighterData = allFighters.find(f => f.name.toLowerCase() === fighterName.toLowerCase());

      if (!fighterData) {
        console.warn(`Fighter "${fighterName}" not found in full_fighters data`);
        throw new Error(`Fighter not found: ${fighterName}`);
      }

      console.log('Fighter data found:', fighterData);

      // Return the fighter data in the expected format
      const ufcFights = this.getUFCFights(fighterData.fight_history || []);

      return {
        name: fighterData.name,
        nickname: fighterData.nickname || "",
        height: fighterData.height || "",
        weight: this.cleanWeight(fighterData.weight || ""),
        reach: this.cleanReach(fighterData.reach || ""),
        stance: fighterData.stance || "Orthodox",
        record: fighterData.record || "0-0-0",
        profile_url: fighterData.profile_url || "",
        stats: fighterData.stats || {
          "SLpM": "0.00",
          "Str. Acc.": "0%",
          "SApM": "0.00",
          "Str. Def": "0%",
          "TD Avg.": "0.00",
          "TD Acc.": "0%",
          "TD Def.": "0%",
          "Sub. Avg.": "0.0"
        },
        fight_history: fighterData.fight_history || [],
        dob: fighterData.dob || "",
        age: fighterData.age || this.calculateAgeFromDob(fighterData.dob),
        division: this.getDivisionFromWeight(this.cleanWeight(fighterData.weight || "")),
        is_champion: fighterData.is_champion || false,
        ufc_record: this.calculateUFCRecord(ufcFights),
        ufc_wins: this.countWins(ufcFights),
        ufc_losses: this.countLosses(ufcFights),
        ufc_draws: this.countDraws(ufcFights),

        // Computed fields for internal use
        slpm: parseFloat(fighterData.stats?.SLpM || '0') || 0,
        sapm: parseFloat(fighterData.stats?.SApM || '0') || 0,
        tdAvg: parseFloat(fighterData.stats?.["TD Avg."] || '0') || 0,
        tdDef: parseFloat(fighterData.stats?.["TD Def."]?.replace('%', '') || '0') || 0,
        strAcc: parseFloat(fighterData.stats?.["Str. Acc."]?.replace('%', '') || '0') || 0,
        strDef: parseFloat(fighterData.stats?.["Str. Def"]?.replace('%', '') || '0') || 0,
        recent_form_score: 0,
        win_streak_score: 0,
        avg_opp_strength: 0,
        last_results: this.getLastResults(fighterData.fight_history || []),
        ko_pct: this.calculateFinishPercentage(fighterData.fight_history || [], ['KO', 'TKO']),
        dec_pct: this.calculateFinishPercentage(fighterData.fight_history || [], ['DEC', 'U-DEC']),
        sub_pct: this.calculateFinishPercentage(fighterData.fight_history || [], ['SUB']),
      };

    } catch (error) {
      console.warn('Using mock data for fighter:', fighterName, 'Error:', error);
      return this.getMockFighterData(fighterName);
    }
  }

  private calculateAgeFromDob(dob?: string): number {
    if (!dob) return 30; // Default age
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? age : 30;
    } catch {
      return 30;
    }
  }

  private cleanWeight(weight: string): string {
    if (!weight || weight === "--") return "Unknown";
    // Remove duplicate "lbs." if present
    return weight.replace(/(\s*lbs\.?\s*){2,}/g, ' lbs').trim();
  }

  private cleanReach(reach: string): string {
    if (!reach || reach === "--") return "Unknown";
    // Remove duplicate quotes if present
    return reach.replace(/("{2,})/g, '"').trim();
  }

  private getUFCFights(fightHistory: any[]): any[] {
    return fightHistory.filter(fight =>
      fight.event && fight.event.toLowerCase().includes('ufc')
    );
  }

  private calculateUFCRecord(ufcFights: any[]): string {
    const wins = this.countWins(ufcFights);
    const losses = this.countLosses(ufcFights);
    const draws = this.countDraws(ufcFights);
    return `${wins}-${losses}-${draws}`;
  }

  private getDivisionFromWeight(weight?: string): string {
    if (!weight) return "Unknown";
    const weightNum = parseFloat(weight.replace(/[^\d.]/g, '') || '0');
    if (weightNum <= 115) return "Strawweight";
    if (weightNum <= 125) return "Flyweight";
    if (weightNum <= 135) return "Bantamweight";
    if (weightNum <= 145) return "Featherweight";
    if (weightNum <= 155) return "Lightweight";
    if (weightNum <= 170) return "Welterweight";
    if (weightNum <= 185) return "Middleweight";
    if (weightNum <= 205) return "Light Heavyweight";
    return "Heavyweight";
  }

  private getLastResults(fightHistory: any[]): string[] {
    return fightHistory.slice(0, 5).map(fight => {
      switch(fight.result) {
        case 'win': return 'W';
        case 'loss': return 'L';
        case 'draw': return 'D';
        default: return 'L';
      }
    });
  }

  private countWins(fightHistory: any[]): number {
    return fightHistory.filter(fight => fight.result === 'win').length;
  }

  private countLosses(fightHistory: any[]): number {
    return fightHistory.filter(fight => fight.result === 'loss').length;
  }

  private countDraws(fightHistory: any[]): number {
    return fightHistory.filter(fight => fight.result === 'draw').length;
  }

  private calculateFinishPercentage(fightHistory: any[], methods: string[]): number {
    if (fightHistory.length === 0) return 0;
    const finishes = fightHistory.filter(fight =>
      methods.some(method => fight.method?.toUpperCase().includes(method))
    ).length;
    return Math.round((finishes / fightHistory.length) * 100);
  }

  private getMockFighterData(fighterName: string): Fighter {
    const nameHash = fighterName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const weights = [125, 135, 145, 155, 170, 185, 205, 265];
    const wins = 10 + (Math.abs(nameHash) % 15);
    const losses = Math.abs(nameHash) % 5;
    const draws = Math.abs(nameHash) % 2;

    return {
      name: fighterName,
      weight: weights[Math.abs(nameHash) % weights.length],
      height: 65 + (Math.abs(nameHash) % 15), // Height in inches
      reach: 70 + (Math.abs(nameHash) % 10),
      slpm: 2.5 + (Math.abs(nameHash) % 50) / 10,
      sapm: 1.5 + (Math.abs(nameHash) % 40) / 10,
      tdAvg: (Math.abs(nameHash) % 50) / 10,
      tdDef: 50 + (Math.abs(nameHash) % 50),
      strAcc: 35 + (Math.abs(nameHash) % 30),
      strDef: 45 + (Math.abs(nameHash) % 35),
      fight_history: this.generateMockFightHistory(nameHash, wins + losses),
      recent_form_score: (Math.abs(nameHash) % 100) / 100,
      win_streak_score: (Math.abs(nameHash) % 100) / 100,
      avg_opp_strength: (Math.abs(nameHash) % 100) / 100,
      last_results: this.generateLastResults(nameHash),
      is_champion: Math.abs(nameHash) % 100 < 10,
      record: `${wins}-${losses}-${draws}`,
      ufc_wins: wins,
      ufc_losses: losses,
      ufc_draws: draws,
      ko_pct: Math.abs(nameHash) % 40,
      dec_pct: 60 + (Math.abs(nameHash) % 30),
      sub_pct: Math.abs(nameHash) % 20,
    };
  }

  private generateLastResults(seed: number): string[] {
    const results = ["W", "L", "D"];
    return Array.from({ length: 5 }, (_, i) => results[Math.abs(seed + i) % 3]);
  }

  private generateMockFightHistory(seed: number, totalFights: number): Array<{
    opponent: string;
    result: string;
    event: string;
    date?: string;
    method?: string;
  }> {
    const opponents = [
      "Alex Smith", "Mike Johnson", "Carlos Rodriguez", "Tony Ferguson",
      "Daniel Williams", "Ryan Miller", "Jake Anderson", "Matt Brown"
    ];
    const methods = ["Decision", "TKO", "Submission", "KO"];
    const events = ["UFC 300", "UFC 295", "UFC 290", "UFC 285", "UFC 280"];

    return Array.from({ length: Math.min(totalFights, 8) }, (_, i) => {
      const opponentIndex = Math.abs(seed + i) % opponents.length;
      const methodIndex = Math.abs(seed + i * 2) % methods.length;
      const eventIndex = Math.abs(seed + i * 3) % events.length;
      const isWin = Math.abs(seed + i) % 3 !== 0; // 2/3 chance of win

      return {
        opponent: opponents[opponentIndex],
        result: isWin ? "win" : "loss",
        event: events[eventIndex],
        method: methods[methodIndex],
        date: new Date(2024 - i, Math.abs(seed + i) % 12, 1).toISOString(),
      };
    });
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

  async explainFight(body: { fighter1: string; fighter2: string }) {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to explain");
      }
      return res.json() as Promise<{
        explainable: boolean;
        reason?: string;
        features: string[];
        shap_values: number[];
        expected_value: number;
        model_proba_canonical_f1: number | null;
        top_contributors: { feature: string; value: number }[];
      }>;
    } catch (error) {
      console.warn('Explanation service unavailable');
      throw error;
    }
  }
}

export const apiService = new ApiService();
