import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  Ruler,
  Weight,
  Target,
  Activity,
  Crown,
  Shield,
  Trophy,
  TrendingUp,
  BarChart3,
  Users,
  Swords,
  Zap,
  Clock,
  Award
} from "lucide-react";
import { Hero } from "@/components/ui/hero";

interface FightHistory {
  result: "win" | "loss";
  opponent: string;
  KD: string;
  STR: string;
  TD: string;
  SUB: string;
  event: string;
  method: string;
  round: string;
  time: string;
}

interface FighterStats {
  "SLpM": string;
  "Str. Acc.": string;
  "SApM": string;
  "Str. Def": string;
  "TD Avg.": string;
  "TD Acc.": string;
  "TD Def.": string;
  "Sub. Avg.": string;
}

interface Fighter {
  name: string;
  nickname: string;
  height: string;
  weight: string;
  reach: string;
  stance: string;
  record: string;
  profile_url: string;
  stats: FighterStats;
  fight_history: FightHistory[];
  dob: string;
  age: number;
  division: string;
  champion: boolean;
  ufc_record?: string;
  ufc_wins?: number;
  ufc_losses?: number;
  ufc_draws?: number;
}

export default function FighterProfile() {
  const { fighterName } = useParams<{ fighterName: string }>();
  const navigate = useNavigate();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFighter = async () => {
      if (!fighterName) {
        setError("No fighter specified");
        setLoading(false);
        return;
      }

      try {
        const decodedName = decodeURIComponent(fighterName);
        const response = await fetch(`http://localhost:8000/fighter/${encodeURIComponent(decodedName)}`);
        
        if (!response.ok) {
          throw new Error(`Fighter not found: ${response.statusText}`);
        }

        const data = await response.json();
        setFighter(data);
      } catch (err) {
        console.error("Error loading fighter:", err);
        setError(err instanceof Error ? err.message : "Failed to load fighter");
      } finally {
        setLoading(false);
      }
    };

    loadFighter();
  }, [fighterName]);

  const getWinPercentage = (record: string | undefined) => {
    if (!record || typeof record !== "string" || !record.includes("-")) return 0;
    const [wins, losses] = record.split("-").map(n => parseInt(n));
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const getRecordBadgeColor = (record: string) => {
    const winPercentage = getWinPercentage(record);
    if (winPercentage >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (winPercentage >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const formatHeight = (height: string): string => {
    // Handle different height formats
    if (height.includes("'")) return height;
    const inches = parseInt(height);
    if (isNaN(inches)) return height;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
          </div>
          <h2 className="text-xl font-semibold">Loading Fighter Profile...</h2>
          <p className="text-muted-foreground">Fetching detailed fighter information</p>
        </div>
      </div>
    );
  }

  if (error || !fighter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3">Fighter Not Found</h3>
            <p className="text-muted-foreground mb-6">{error || "The requested fighter could not be found."}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => navigate("/fighters")}>
                <Users className="h-4 w-4 mr-2" />
                Browse Fighters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winPercentage = getWinPercentage(fighter.record);
  const recentWins = fighter.fight_history?.slice(0, 10).filter(f => f.result === "win").length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Hero
        title={fighter.name}
        subtitle={
          fighter.nickname ? 
            <>"{fighter.nickname}" - {fighter.division} Division Fighter</> : 
            `${fighter.division} Division Fighter`
        }
        icon={Shield}
        variant="fighters"
        stats={[
          {
            icon: Trophy,
            label: "Record",
            value: fighter.record,
            color: "primary",
          },
          {
            icon: Calendar,
            label: "Age",
            value: fighter.age,
            color: "primary",
          },
          {
            icon: Target,
            label: "Win Rate",
            value: `${winPercentage}%`,
            color: winPercentage >= 70 ? "green-500" : winPercentage >= 50 ? "yellow-500" : "red-500",
          },
        ]}
        badges={[
          {
            icon: Award,
            label: fighter.division,
            color: "primary"
          },
          ...(fighter.champion ? [{
            icon: Crown,
            label: "Champion",
            color: "yellow-500"
          }] : []),
          {
            icon: Activity,
            label: fighter.stance,
            color: "muted-foreground"
          }
        ]}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Fighter Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Physical Stats */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-blue-500" />
                Physical Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 p-4 rounded-lg text-center">
                  <Ruler className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <div className="text-xs text-muted-foreground">HEIGHT</div>
                  <div className="font-bold text-lg">{formatHeight(fighter.height)}</div>
                </div>
                <div className="bg-background/50 p-4 rounded-lg text-center">
                  <Weight className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <div className="text-xs text-muted-foreground">WEIGHT</div>
                  <div className="font-bold text-lg">{fighter.weight} lbs</div>
                </div>
                <div className="bg-background/50 p-4 rounded-lg text-center">
                  <Target className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <div className="text-xs text-muted-foreground">REACH</div>
                  <div className="font-bold text-lg">{fighter.reach}"</div>
                </div>
                <div className="bg-background/50 p-4 rounded-lg text-center">
                  <Activity className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <div className="text-xs text-muted-foreground">STANCE</div>
                  <div className="font-bold text-lg">{fighter.stance}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fight Record */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
                Fight Record
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <Badge variant="outline" className={`${getRecordBadgeColor(fighter.record)} text-xl px-4 py-2 font-bold`}>
                  {fighter.record}
                </Badge>
                {fighter.ufc_record && (
                  <div>
                    <div className="text-sm text-muted-foreground">UFC Record</div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {fighter.ufc_record}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Percentage</span>
                  <span className="font-bold text-green-500">{winPercentage}%</span>
                </div>
                <Progress value={winPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-500">{recentWins}</div>
                  <div className="text-xs text-muted-foreground">Wins (Last 10)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{fighter.fight_history?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Fights</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Performance Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Striking Accuracy", value: fighter.stats["Str. Acc."], icon: Target },
                { label: "Striking Defense", value: fighter.stats["Str. Def"], icon: Shield },
                { label: "Takedown Accuracy", value: fighter.stats["TD Acc."], icon: TrendingUp },
                { label: "Takedown Defense", value: fighter.stats["TD Def."], icon: Activity },
              ].map((stat, index) => {
                const StatIcon = stat.icon;
                const percentage = parseFloat(stat.value?.replace('%', '') || '0');
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <StatIcon className="h-4 w-4 text-purple-500" />
                        <span className="text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="font-bold text-purple-500">{stat.value}</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Fight History */}
        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Fight History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fighter.fight_history && fighter.fight_history.length > 0 ? (
              <div className="space-y-3">
                {fighter.fight_history.slice(0, 10).map((fight, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        fight.result === 'win'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {fight.result === 'win' ? 'W' : 'L'}
                      </div>
                      <div>
                        <div className="font-semibold">{fight.opponent}</div>
                        <div className="text-sm text-muted-foreground">{fight.event}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{fight.method}</div>
                      <div className="text-sm text-muted-foreground">
                        {fight.round && fight.time && `R${fight.round} ${fight.time}`}
                      </div>
                    </div>
                  </div>
                ))}
                {fighter.fight_history.length > 10 && (
                  <div className="text-center pt-4">
                    <Badge variant="outline">
                      Showing 10 of {fighter.fight_history.length} fights
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No fight history available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Link to="/fighters">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Browse Fighters
            </Button>
          </Link>
          <Link to="/">
            <Button className="gap-2">
              <Zap className="h-4 w-4" />
              Create Prediction
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
