import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  Award,
  Star,
  Flame,
  Eye,
  TrendingDown,
  CheckCircle,
  XCircle,
  Medal,
  Timer,
  MapPin,
  Brain,
  Lightbulb,
  Hash
} from "lucide-react";
import { Hero } from "@/components/ui/hero";
import { cn } from "@/lib/utils";

interface FightHistory {
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

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = "primary", 
  description,
  progress
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  color?: string;
  description?: string;
  progress?: number;
}) => (
  <div className={cn(
    "bg-gradient-to-br rounded-xl p-6 border transition-all duration-500 hover:scale-105 hover:shadow-2xl group cursor-pointer",
    color === "blue" && "from-blue-500/15 to-blue-500/5 border-blue-500/30 hover:shadow-blue-500/20",
    color === "green" && "from-green-500/15 to-green-500/5 border-green-500/30 hover:shadow-green-500/20",
    color === "purple" && "from-purple-500/15 to-purple-500/5 border-purple-500/30 hover:shadow-purple-500/20",
    color === "red" && "from-red-500/15 to-red-500/5 border-red-500/30 hover:shadow-red-500/20",
    color === "primary" && "from-primary/15 to-primary/5 border-primary/30 hover:shadow-primary/20"
  )}>
    <div className="text-center space-y-4">
      <div className={cn(
        "p-3 mx-auto w-fit rounded-full transition-all duration-300 group-hover:scale-110",
        color === "blue" && "bg-blue-500/20",
        color === "green" && "bg-green-500/20",
        color === "purple" && "bg-purple-500/20", 
        color === "red" && "bg-red-500/20",
        color === "primary" && "bg-primary/20"
      )}>
        <Icon className={cn(
          "h-8 w-8",
          color === "blue" && "text-blue-400",
          color === "green" && "text-green-400",
          color === "purple" && "text-purple-400",
          color === "red" && "text-red-400",
          color === "primary" && "text-primary"
        )} />
      </div>
      <div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  </div>
);

const FightHistoryCard = ({ fight, index }: { fight: FightHistory; index: number }) => {
  const isWin = fight.result === "win";
  const isDraw = fight.result === "draw";
  
  return (
    <div 
      className={cn(
        "group transition-all duration-500 hover:scale-[1.02] hover:shadow-xl rounded-xl border p-6 animate-fadeInUpOnce",
        isWin && "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 hover:shadow-green-500/20",
        !isWin && !isDraw && "bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/20 hover:shadow-red-500/20",
        isDraw && "bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20 hover:shadow-yellow-500/20"
      )}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 group-hover:scale-110",
            isWin && "bg-green-500/20 text-green-400",
            !isWin && !isDraw && "bg-red-500/20 text-red-400",
            isDraw && "bg-yellow-500/20 text-yellow-400"
          )}>
            {isWin ? (
              <CheckCircle className="h-6 w-6" />
            ) : isDraw ? (
              <Medal className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-lg">{fight.opponent}</div>
            <div className="text-sm text-muted-foreground font-medium">
              {fight.event}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>UFC Event</span>
              {fight.round && fight.time && (
                <>
                  <span>•</span>
                  <Timer className="h-3 w-3" />
                  <span>R{fight.round} {fight.time}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right space-y-2">
          <Badge 
            variant="outline" 
            className={cn(
              "font-bold text-lg px-3 py-1",
              isWin && "border-green-500/30 text-green-400 bg-green-500/10",
              !isWin && !isDraw && "border-red-500/30 text-red-400 bg-red-500/10",
              isDraw && "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
            )}
          >
            {fight.method}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {isWin ? "Victory" : isDraw ? "Draw" : "Defeat"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FighterProfile() {
  const { fighterName } = useParams<{ fighterName: string }>();
  const navigate = useNavigate();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<"overview" | "stats" | "history">("overview");

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
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-4 bg-primary/10 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Loading Fighter Profile...</h2>
            <p className="text-muted-foreground">Fetching detailed fighter information and statistics</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fighter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <Shield className="h-20 w-20 text-muted-foreground mx-auto" />
              <div className="absolute -inset-4 bg-muted-foreground/10 rounded-full blur-xl"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Fighter Not Found</h3>
              <p className="text-muted-foreground">{error || "The requested fighter could not be found."}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => navigate("/fighters")} className="gap-2">
                <Users className="h-4 w-4" />
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
  const finishRate = fighter.fight_history?.filter(f => f.method && !f.method.toLowerCase().includes("decision")).length || 0;
  const finishPercentage = fighter.fight_history?.length ? Math.round((finishRate / fighter.fight_history.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Hero
        title={fighter.name}
        subtitle={
          fighter.nickname ? 
            <>"{fighter.nickname}" - <span className="text-primary font-semibold">{fighter.division}</span> Division Fighter</> : 
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
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-1 bg-background/60 rounded-xl border border-border/40 backdrop-blur-sm">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              { id: "stats", label: "Statistics", icon: BarChart3 },
              { id: "history", label: "Fight History", icon: Swords }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={selectedView === tab.id ? "default" : "ghost"}
                  onClick={() => setSelectedView(tab.id as any)}
                  className={cn(
                    "gap-2 transition-all duration-300 px-6 py-3",
                    selectedView === tab.id ? "bg-primary shadow-lg shadow-primary/20" : "hover:bg-primary/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedView === "overview" && (
          <div className="space-y-8 animate-fadeInUpOnce">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                icon={Ruler}
                label="Height"
                value={formatHeight(fighter.height)}
                color="blue"
                description="Physical Attribute"
              />
              <StatCard
                icon={Weight}
                label="Weight"
                value={`${fighter.weight} lbs`}
                color="green"
                description="Fighting Weight"
              />
              <StatCard
                icon={Target}
                label="Reach"
                value={`${fighter.reach}"`}
                color="purple"
                description="Arm Reach"
              />
              <StatCard
                icon={Flame}
                label="Finish Rate"
                value={`${finishPercentage}%`}
                color="red"
                description="Non-Decision Wins"
                progress={finishPercentage}
              />
            </div>

            {/* Record and Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-primary" />
                    Fighting Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-4">
                    <Badge 
                      variant="outline" 
                      className={cn(getRecordBadgeColor(fighter.record), "text-2xl px-6 py-3 font-bold")}
                    >
                      {fighter.record}
                    </Badge>
                    {fighter.ufc_record && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground font-medium">UFC Record</div>
                        <Badge variant="secondary" className="text-xl px-4 py-2">
                          {fighter.ufc_record}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Win Percentage</span>
                      <span className="font-bold text-primary text-xl">{winPercentage}%</span>
                    </div>
                    <Progress value={winPercentage} className="h-3" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-400">{recentWins}</div>
                      <div className="text-xs text-muted-foreground">Wins (Last 10)</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">{fighter.fight_history?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Fights</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-red-400">{finishRate}</div>
                      <div className="text-xs text-muted-foreground">Finishes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-purple-500/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-purple-400" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-background/30 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-purple-400" />
                        <span className="font-medium text-purple-400">Fighting Style</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fighter.stance} stance fighter with {winPercentage >= 70 ? "excellent" : winPercentage >= 50 ? "solid" : "developing"} record
                      </p>
                    </div>

                    <div className="bg-background/30 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-purple-400" />
                        <span className="font-medium text-purple-400">Experience Level</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(fighter.fight_history?.length || 0) >= 10 ? "Veteran fighter" : "Rising prospect"} with {fighter.fight_history?.length || 0} professional fights
                      </p>
                    </div>

                    {fighter.champion && (
                      <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-yellow-400" />
                          <span className="font-medium text-yellow-400">Championship Status</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Current {fighter.division} Division Champion
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {selectedView === "stats" && (
          <div className="space-y-8 animate-fadeInUpOnce">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Striking Accuracy", value: fighter.stats["Str. Acc."], icon: Target, color: "blue" },
                { label: "Striking Defense", value: fighter.stats["Str. Def"], icon: Shield, color: "green" },
                { label: "Takedown Accuracy", value: fighter.stats["TD Acc."], icon: TrendingUp, color: "purple" },
                { label: "Takedown Defense", value: fighter.stats["TD Def."], icon: Activity, color: "red" },
                { label: "Strikes Landed/Min", value: fighter.stats["SLpM"], icon: BarChart3, color: "primary" },
                { label: "Strikes Absorbed/Min", value: fighter.stats["SApM"], icon: TrendingDown, color: "primary" },
                { label: "Takedown Average", value: fighter.stats["TD Avg."], icon: Hash, color: "primary" },
                { label: "Submission Average", value: fighter.stats["Sub. Avg."], icon: Swords, color: "primary" },
              ].map((stat, index) => {
                const percentage = parseFloat(stat.value?.replace('%', '') || '0');
                return (
                  <StatCard
                    key={index}
                    icon={stat.icon}
                    label={stat.label}
                    value={stat.value || "N/A"}
                    color={stat.color}
                    progress={stat.value?.includes('%') ? percentage : undefined}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Fight History Tab */}
        {selectedView === "history" && (
          <div className="space-y-8 animate-fadeInUpOnce">
            <Card className="bg-gradient-to-br from-card to-muted/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Swords className="h-6 w-6 text-primary" />
                  Complete Fight History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fighter.fight_history && fighter.fight_history.length > 0 ? (
                  <div className="space-y-4">
                    {fighter.fight_history.map((fight, index) => (
                      <FightHistoryCard key={index} fight={fight} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
                      <Swords className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-semibold text-muted-foreground">No Fight History Available</h4>
                      <p className="text-muted-foreground">Fighter data not yet available in our database</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-8">
          <Link to="/fighters">
            <Button variant="outline" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105">
              <Users className="h-4 w-4" />
              Browse Fighters
            </Button>
          </Link>
          <Link to="/">
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105">
              <Zap className="h-4 w-4" />
              Create Prediction
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
