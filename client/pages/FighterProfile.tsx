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
  Hash,
  Zap,
  Gauge,
  Footprints,
  Radar
} from "lucide-react";
import { Hero } from "@/components/ui/hero";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";

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
  is_champion: boolean;
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
  progress,
  subtitle
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  color?: string;
  description?: string;
  progress?: number;
  subtitle?: string;
}) => (
  <div className={cn(
    "bg-gradient-to-br rounded-xl p-6 border transition-all duration-500 hover:scale-105 hover:shadow-2xl group cursor-pointer animate-fadeInUpOnce",
    color === "blue" && "from-blue-500/15 to-blue-500/5 border-blue-500/30 hover:shadow-blue-500/20",
    color === "green" && "from-green-500/15 to-green-500/5 border-green-500/30 hover:shadow-green-500/20",
    color === "purple" && "from-purple-500/15 to-purple-500/5 border-purple-500/30 hover:shadow-purple-500/20",
    color === "red" && "from-red-500/15 to-red-500/5 border-red-500/30 hover:shadow-red-500/20",
    color === "orange" && "from-orange-500/15 to-orange-500/5 border-orange-500/30 hover:shadow-orange-500/20",
    color === "primary" && "from-primary/15 to-primary/5 border-primary/30 hover:shadow-primary/20"
  )}>
    <div className="text-center space-y-4">
      <div className={cn(
        "p-3 mx-auto w-fit rounded-full transition-all duration-300 group-hover:scale-110",
        color === "blue" && "bg-blue-500/20",
        color === "green" && "bg-green-500/20",
        color === "purple" && "bg-purple-500/20", 
        color === "red" && "bg-red-500/20",
        color === "orange" && "bg-orange-500/20",
        color === "primary" && "bg-primary/20"
      )}>
        <Icon className={cn(
          "h-8 w-8",
          color === "blue" && "text-blue-400",
          color === "green" && "text-green-400",
          color === "purple" && "text-purple-400",
          color === "red" && "text-red-400",
          color === "orange" && "text-orange-400",
          color === "primary" && "text-primary"
        )} />
      </div>
      <div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        )}
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
      <div className="space-y-4">
        {/* Fight Result Header */}
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
              <div className="font-semibold text-xl">{fight.opponent}</div>
              <div className="text-sm text-muted-foreground font-medium">
                {fight.event}
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Badge 
              variant="outline" 
              className={cn(
                "font-bold text-lg px-4 py-2",
                isWin && "border-green-500/30 text-green-400 bg-green-500/10",
                !isWin && !isDraw && "border-red-500/30 text-red-400 bg-red-500/10",
                isDraw && "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
              )}
            >
              {fight.method}
            </Badge>
            <div className="text-xs text-muted-foreground">
              R{fight.round} {fight.time}
            </div>
          </div>
        </div>

        {/* Fight Statistics */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/50">
          <div className="text-center p-3 bg-background/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Knockdowns</div>
            <div className="text-xl font-bold text-red-400">{fight.KD}</div>
          </div>
          <div className="text-center p-3 bg-background/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Strikes</div>
            <div className="text-xl font-bold text-blue-400">{fight.STR}</div>
          </div>
          <div className="text-center p-3 bg-background/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Takedowns</div>
            <div className="text-xl font-bold text-purple-400">{fight.TD}</div>
          </div>
          <div className="text-center p-3 bg-background/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Submissions</div>
            <div className="text-xl font-bold text-orange-400">{fight.SUB}</div>
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
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFighter = async () => {
      if (!fighterName) {
        setError("No fighter specified");
        setLoading(false);
        return;
      }

      try {
        const decodedName = decodeURIComponent(fighterName);
        console.log('Loading fighter:', decodedName);
        
        const fighterData = await apiService.getFighterDetails(decodedName);
        
        if (isMounted && fighterData) {
          // Fighter data is already transformed by the API service
          const transformedFighter: Fighter = {
            name: fighterData.name,
            nickname: fighterData.nickname || "",
            height: fighterData.height || "",
            weight: fighterData.weight || "",
            reach: fighterData.reach || "",
            stance: fighterData.stance || "Orthodox",
            record: fighterData.record,
            profile_url: fighterData.profile_url || "",
            stats: fighterData.stats,
            fight_history: fighterData.fight_history?.map(fight => ({
              result: fight.result as "win" | "loss" | "draw",
              opponent: fight.opponent,
              KD: fight.KD || "--",
              STR: fight.STR || "--", 
              TD: fight.TD || "--",
              SUB: fight.SUB || "--",
              event: fight.event,
              method: fight.method || "Decision",
              round: fight.round || "1",
              time: fight.time || "5:00"
            })) || [],
            dob: fighterData.dob || "",
            age: fighterData.age || 30,
            division: fighterData.division || "Unknown",
            is_champion: fighterData.is_champion || false,
            ufc_record: fighterData.ufc_record,
            ufc_wins: fighterData.ufc_wins || 0,
            ufc_losses: fighterData.ufc_losses || 0,
            ufc_draws: fighterData.ufc_draws || 0,
          };
          
          setFighter(transformedFighter);
          setError(null);
          setUsingFallbackData(false);
        }
      } catch (err) {
        console.warn("API fighter data unavailable, using fallback data for:", fighterName, err);
        
        if (isMounted) {
          // Create fallback fighter data when API fails
          const decodedName = decodeURIComponent(fighterName);
          console.log('Creating fallback data for:', decodedName);
          const fallbackFighter: Fighter = {
            name: decodedName,
            nickname: "",
            height: "6'0\"",
            weight: "185 lbs",
            reach: "74\"",
            stance: "Orthodox",
            record: "15-3-0",
            profile_url: "",
            stats: {
              "SLpM": "4.2",
              "Str. Acc.": "45%",
              "SApM": "3.1",
              "Str. Def": "55%",
              "TD Avg.": "2.1",
              "TD Acc.": "42%",
              "TD Def.": "75%",
              "Sub. Avg.": "0.5",
            },
            fight_history: [
              {
                result: "win",
                opponent: "TBD Opponent",
                KD: "1",
                STR: "95",
                TD: "2",
                SUB: "0",
                event: "UFC Event",
                method: "Decision",
                round: "3",
                time: "5:00"
              }
            ],
            dob: "1990-01-01",
            age: 34,
            division: "Middleweight",
            is_champion: false,
            ufc_record: "12-2-0",
            ufc_wins: 12,
            ufc_losses: 2,
            ufc_draws: 0,
          };
          
          setFighter(fallbackFighter);
          setError(null);
          setUsingFallbackData(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFighter();
    
    return () => {
      isMounted = false;
    };
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
              <h3 className="text-2xl font-bold">Fighter Profile Unavailable</h3>
              <p className="text-muted-foreground">
                Fighter data is temporarily unavailable. This may be due to:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Fighter not in our database yet</li>
                <li>Backend service temporarily offline</li>
                <li>Network connectivity issues</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Error details: {error || "Unknown error"}
              </p>
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
  const ufcWinPercentage = getWinPercentage(fighter.ufc_record);
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

      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8 animate-fadeInUpOnce">
            {/* Champion Badge */}
            {fighter.is_champion && (
              <div className="flex justify-center">
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-lg px-6 py-3 animate-pulse">
                  <Crown className="h-5 w-5 mr-2" />
                  UFC CHAMPION
                </Badge>
              </div>
            )}

            {/* Fighter Name */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {fighter.name}
              </h1>
              {fighter.nickname && (
                <p className="text-2xl text-muted-foreground">
                  "{fighter.nickname}"
                </p>
              )}
              <p className="text-xl text-primary font-semibold">
                {fighter.division} Division Fighter
              </p>
            </div>

            {/* Key Stats Row */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{fighter.record}</div>
                <div className="text-sm text-muted-foreground">Overall Record</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">{fighter.ufc_record}</div>
                <div className="text-sm text-muted-foreground">UFC Record</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{fighter.age}</div>
                <div className="text-sm text-muted-foreground">Years Old</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge variant="outline" className="border-primary/30 text-primary px-4 py-2">
                <Award className="h-4 w-4 mr-2" />
                {fighter.division}
              </Badge>
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground px-4 py-2">
                <Activity className="h-4 w-4 mr-2" />
                {fighter.stance}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Fallback Data Notification */}
        {usingFallbackData && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-4 animate-fadeInUpOnce">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-yellow-400">Demo Data</h4>
                <p className="text-sm text-muted-foreground">
                  Fighter data not available from live database. Showing demo information for preview purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Physical Attributes */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Physical Attributes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              icon={Ruler}
              label="Height"
              value={fighter.height}
              color="blue"
              description="Physical Measurement"
            />
            <StatCard
              icon={Weight}
              label="Weight"
              value={fighter.weight}
              color="green"
              description="Fighting Weight"
            />
            <StatCard
              icon={Target}
              label="Reach"
              value={fighter.reach}
              color="purple"
              description="Arm Reach"
            />
            <StatCard
              icon={Footprints}
              label="Stance"
              value={fighter.stance}
              color="orange"
              description="Fighting Stance"
            />
          </div>
        </section>

        {/* Fighting Record & Performance */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Record Overview */}
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
                <div className="text-sm text-muted-foreground font-medium">Overall Record</div>
                
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
                  <span className="text-muted-foreground font-medium">Overall Win Rate</span>
                  <span className="font-bold text-primary text-xl">{winPercentage}%</span>
                </div>
                <Progress value={winPercentage} className="h-3" />
                
                {fighter.ufc_record && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">UFC Win Rate</span>
                      <span className="font-bold text-orange-400 text-xl">{ufcWinPercentage}%</span>
                    </div>
                    <Progress value={ufcWinPercentage} className="h-3" />
                  </>
                )}
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

          {/* Enhanced Key Insights */}
          <Card className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-purple-500/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-purple-400" />
                Fighter Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-background/30 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Radar className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400">Fighting Style Analysis</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fighter.stance} stance fighter with {winPercentage >= 70 ? "excellent" : winPercentage >= 50 ? "solid" : "developing"} record. 
                    Shows {finishPercentage >= 50 ? "aggressive finishing ability" : "technical decision-focused approach"}.
                  </p>
                </div>

                <div className="bg-background/30 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400">Experience & Competition Level</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(fighter.fight_history?.length || 0) >= 15 ? "Seasoned veteran" : (fighter.fight_history?.length || 0) >= 8 ? "Experienced fighter" : "Rising prospect"} with {fighter.fight_history?.length || 0} professional fights. 
                    UFC record of {fighter.ufc_record} demonstrates {ufcWinPercentage >= 70 ? "elite" : ufcWinPercentage >= 50 ? "competitive" : "developing"} level performance.
                  </p>
                </div>

                <div className="bg-background/30 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400">Finishing Ability</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {finishPercentage}% finish rate indicates {finishPercentage >= 60 ? "excellent finishing instincts" : finishPercentage >= 40 ? "solid finishing ability" : "decision-oriented fighting style"}. 
                    Prefers {finishPercentage >= 50 ? "to end fights early" : "to control pace and win on points"}.
                  </p>
                </div>

                {fighter.is_champion && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium text-yellow-400">Championship Status</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current {fighter.division} Division Champion, representing the pinnacle of skill in the weight class.
                    </p>
                  </div>
                )}

                <div className="bg-background/30 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400">Performance Metrics</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>Striking Accuracy: {fighter.stats["Str. Acc."]}</div>
                    <div>Takedown Accuracy: {fighter.stats["TD Acc."]}</div>
                    <div>Striking Defense: {fighter.stats["Str. Def"]}</div>
                    <div>Takedown Defense: {fighter.stats["TD Def."]}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Detailed Statistics */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Performance Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Strikes Landed/Min", value: fighter.stats["SLpM"], icon: Zap, color: "blue" },
              { label: "Striking Accuracy", value: fighter.stats["Str. Acc."], icon: Target, color: "green", progress: parseFloat(fighter.stats["Str. Acc."]?.replace('%', '') || '0') },
              { label: "Strikes Absorbed/Min", value: fighter.stats["SApM"], icon: Shield, color: "red" },
              { label: "Striking Defense", value: fighter.stats["Str. Def"], icon: Shield, color: "purple", progress: parseFloat(fighter.stats["Str. Def"]?.replace('%', '') || '0') },
              { label: "Takedown Average", value: fighter.stats["TD Avg."], icon: Target, color: "orange" },
              { label: "Takedown Accuracy", value: fighter.stats["TD Acc."], icon: Target, color: "green", progress: parseFloat(fighter.stats["TD Acc."]?.replace('%', '') || '0') },
              { label: "Takedown Defense", value: fighter.stats["TD Def."], icon: Shield, color: "blue", progress: parseFloat(fighter.stats["TD Def."]?.replace('%', '') || '0') },
              { label: "Submission Average", value: fighter.stats["Sub. Avg."], icon: Activity, color: "red" },
            ].map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                label={stat.label}
                value={stat.value || "N/A"}
                color={stat.color}
                progress={stat.progress}
              />
            ))}
          </div>
        </section>

        {/* Complete Fight History */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Complete Fight History</h2>
            <p className="text-muted-foreground">Detailed breakdown of all professional fights with performance metrics</p>
          </div>
          
          <Card className="bg-gradient-to-br from-card to-muted/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Swords className="h-6 w-6 text-primary" />
                Professional Record ({fighter.fight_history?.length || 0} fights)
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
        </section>

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
