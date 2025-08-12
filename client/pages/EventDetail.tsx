import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Flame,
  Shield,
  Crown,
  Target,
  TrendingUp,
  Loader2,
  Trophy,
  Zap,
  Star,
  Swords,
  Award,
  Users,
  Activity,
  BarChart3,
} from "lucide-react";
import { apiService, type PredictionResponse } from "@/services/api";
import { Hero } from "@/components/ui/hero";
import "../components/animations.css";

function formatHeight(feetDecimal: number): string {
  const totalInches = Math.round(feetDecimal * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}



interface Fight {
  fighter_red: string;
  fighter_red_url: string;
  fighter_blue: string;
  fighter_blue_url: string;
  weight_class: string;
  bout_order: number;

  odds1?: string;      // Betting odds for red corner
  odds2?: string;      // Betting odds for blue corner
  datetime?: string;   // Optional: Event time from odds dataset
  is_title_fight?: boolean; // Optional: Needed for tag rendering
}

interface TrackedFight {
  fighter1: string;
  fighter2: string;
  predictedWinner: string;
  confidenceScore: number;
  oddsAtPrediction: string;
  currentOdds: string | null;
  actualResult: string | null;
  correct: boolean | null;
}


interface TrackedEvent {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "past";
  fights: TrackedFight[];
}



interface FightStats {
  isMainEvent: boolean;
  isCoMain: boolean;
  isMainCard: boolean;
  isPrelims: boolean;
  isEarlyPrelims: boolean;
  isRematch: boolean;
  hasUndefeatedFighter: boolean;
  hasTitleImplications: boolean;
  hasFinisher: boolean; // ✅ New field
}

interface EventData {
  event_name: string;
  event_url: string;
  date: string;
  time: string;
  venue: string;
  fights: Fight[];
}

// Mock data based on the provided format
export default function EventDetail() {
  const [trackingJson, setTrackingJson] = useState<any>(null);
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [expandedFights, setExpandedFights] = useState<Set<number>>(new Set());
  const [predictions, setPredictions] = useState<Map<number, PredictionResponse>>(new Map());
  const [analyzingFights, setAnalyzingFights] = useState<Set<number>>(new Set());

  useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);


  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch("http://localhost:8000/upcoming");
        const allEvents: EventData[] = await res.json();

        const found = allEvents.find((event, index) =>
          index.toString() === eventId ||
          event.event_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === eventId
        );

        if (found) {
          setEventData(found);
        } else {
          console.warn("Event not found");
        }
      } catch (err) {
        console.error("Failed to fetch event data:", err);
      }
    };

    fetchEvent();
  }, [eventId]);

  const toggleFightExpansion = async (boutOrder: number) => {
    const newExpanded = new Set(expandedFights);
    if (newExpanded.has(boutOrder)) {
      newExpanded.delete(boutOrder);
    } else {
      newExpanded.add(boutOrder);

      // Fetch real fighter data when expanding details if we don't have it yet
      if (!predictions.has(boutOrder)) {
        const fight = eventData?.fights.find(f => f.bout_order === boutOrder);
        if (fight) {
          try {
            setAnalyzingFights(prev => new Set(prev).add(boutOrder));
            const prediction = await apiService.predictFight({
              fighter1: fight.fighter_red,
              fighter2: fight.fighter_blue
            });
            setPredictions(prev => new Map(prev).set(boutOrder, prediction));
          } catch (error) {
            console.error('Failed to fetch fighter data:', error);
          } finally {
            setAnalyzingFights(prev => {
              const newSet = new Set(prev);
              newSet.delete(boutOrder);
              return newSet;
            });
          }
        }
      }
    }
    setExpandedFights(newExpanded);
  };


  const getFightClassification = (fight: Fight, totalFights: number): FightStats => {
  const isMainEvent = fight.bout_order === 1;
  const isCoMain = fight.bout_order === 2;
  const isMainCard = fight.bout_order <= Math.min(5, totalFights);
  const isPrelims = fight.bout_order > 5 && fight.bout_order <= Math.min(9, totalFights);
  const isEarlyPrelims = fight.bout_order > 9;
  const hasUndefeatedFighter = false; // until backend sends this  
  const hasTitleImplications = fight.is_title_fight;

  const prediction = predictions.get(fight.bout_order);
  const fighter1 = prediction?.fighter1_data;
  const fighter2 = prediction?.fighter2_data;

  const hasFinisher =
    (fighter1?.ko_pct >= 80 && fighter1?.fight_history?.length > 4) ||
    (fighter2?.ko_pct >= 80 && fighter2?.fight_history?.length > 4);

  return {
    isMainEvent,
    isCoMain,
    isMainCard,
    isPrelims,
    isEarlyPrelims,
    isRematch: false, 
    hasUndefeatedFighter,
    hasTitleImplications,
    hasFinisher,
  };
};

  const [predictionLogs, setPredictionLogs] = useState<TrackedFight[]>([]);

  const generatePrediction = async (fight: Fight) => {
  setAnalyzingFights(prev => new Set(prev).add(fight.bout_order));

  try {
    const prediction = await apiService.predictFight({
      fighter1: fight.fighter_red,
      fighter2: fight.fighter_blue
    });

    setPredictions(prev => new Map(prev).set(fight.bout_order, prediction));

    const predictedFight: TrackedFight = {
      fighter1: fight.fighter_red,
      fighter2: fight.fighter_blue,
      predictedWinner: prediction.predicted_winner,
      confidenceScore: prediction.confidence,
      oddsAtPrediction: fight.odds1 || "N/A", // use proper mapping if needed
      currentOdds: fight.odds1 || null,
      actualResult: null,
      correct: null
    };

    setPredictionLogs(prev => [...prev, predictedFight]);

  } catch (error) {
    console.error('Prediction failed:', error);
  } finally {
    setAnalyzingFights(prev => {
      const newSet = new Set(prev);
      newSet.delete(fight.bout_order);
      return newSet;
    });
  }
};


  const FighterStatsCard = ({
    fighter,
    corner,
    prediction
  }: {
    fighter: string;
    corner: 'red' | 'blue';
    prediction: PredictionResponse | null;
  }) => {
    const fighterData = prediction?.[corner === 'red' ? 'fighter1_data' : 'fighter2_data'];
    const lastResults = prediction?.[corner === 'red' ? 'fighter1_last5' : 'fighter2_last5'] || [];

    // Use real data if available, otherwise generate consistent mock data
    const seed = fighter.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const wins = fighterData?.wins ?? Math.floor((seed % 15) + 10);
    const losses = fighterData?.losses ?? Math.floor((seed % 8) + 1);
    const draws = fighterData?.draws ?? ((seed % 20) === 0 ? 1 : 0);


    // Use real recent form if available, otherwise generate consistent mock data
    const recentForm = lastResults.length > 0 ? lastResults : Array.from({length: 5}, (_, i) => {
      const formSeed = seed + i;
      return formSeed % 4 === 0 ? 'L' : 'W'; // Mostly wins with some losses
    });

    const cornerColors = {
      red: {
        bg: 'from-red-500/20 via-red-500/10 to-red-500/5',
        border: 'border-red-500/30',
        accent: 'text-red-400',
        glow: 'shadow-red-500/20'
      },
      blue: {
        bg: 'from-blue-500/20 via-blue-500/10 to-blue-500/5',
        border: 'border-blue-500/30',
        accent: 'text-blue-400',
        glow: 'shadow-blue-500/20'
      }
    };

    return (
      <Card className={`bg-gradient-to-br ${cornerColors[corner].bg} ${cornerColors[corner].border} ${cornerColors[corner].glow} shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]`}>
        <CardContent className="p-6 space-y-4">
          {/* Fighter Name & Record */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{fighter}</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
  {/* Overall MMA record */}
  <Badge
    variant="outline"
    className={`${cornerColors[corner].border} ${cornerColors[corner].accent} text-lg px-3 py-1`}
  >
    {fighterData?.record ?? `${wins}-${losses}${draws > 0 ? `-${draws}` : ''}`}
  </Badge>

  {/* UFC-specific record */}
 {fighterData && (
  <Badge variant="secondary" className="text-sm px-3 py-1">
    {(!fighterData.ufc_wins && !fighterData.ufc_losses && !fighterData.ufc_draws)
      ? "UFC: 0-0-0"
      : `UFC: ${fighterData.ufc_wins}-${fighterData.ufc_losses}-${fighterData.ufc_draws}`}
  </Badge>
)}

  {/* Debut badge */}
  {fighterData && (!fighterData.ufc_wins && !fighterData.ufc_losses && !fighterData.ufc_draws) && (
    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
      <Star className="h-3 w-3 mr-1" />
      UFC DEBUT
    </Badge>
  )}

  {/* Champion badge */}
  {fighterData?.is_champion && (
    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold animate-pulse">
      <Crown className="h-4 w-4 mr-1" />
      CHAMPION
    </Badge>
  )}

   {/* Knockout Artist badge */}
  {fighterData?.ko_pct >= 80 && (fighterData.ufc_wins + fighterData.ufc_losses + fighterData.ufc_draws) >= 5 && (
    <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold">
      <Zap className="h-3 w-3 mr-1" />
      KNOCKOUT ARTIST
    </Badge>
  )}

</div>

          {fighterData && (
  <div className="flex justify-center gap-2 mt-2">
    <Badge variant="secondary" className="bg-red-500/20 text-red-400 font-semibold">
      {fighterData.ko_pct}% KO/TKO
    </Badge>
    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 font-semibold">
      {fighterData.dec_pct}% DEC
    </Badge>
    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 font-semibold">
      {fighterData.sub_pct}% SUB
    </Badge>
  </div>
)}

          </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {/* Height */}
              <div className="bg-background/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">HEIGHT</div>
                <div className="font-semibold">
                  {fighterData?.height !== null
                    ? formatHeight(fighterData.height)
                    : 'N/A'}
                </div>
              </div>

              {/* Reach */}
              <div className="bg-background/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">REACH</div>
                <div className="font-semibold">
                  {fighterData?.reach !== null
                    ? `${Math.round(fighterData.reach)}"`
                    : 'N/A'}
                </div>
              </div>

              {/* Weight */}
              <div className="bg-background/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">WEIGHT</div>
                <div className="font-semibold">
                  {fighterData?.weight !== null
                    ? `${fighterData.weight}lbs`
                    : 'N/A'}
                </div>
              </div>
            </div>

          {/* Recent Form - Animated Results */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-center text-muted-foreground">RECENT FORM</h4>
            <div className="flex justify-center gap-2">
              {recentForm.map((result, index) => (
                <div
                  key={index}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-300 hover:scale-110 cursor-pointer
                    animate-[fadeInUp_0.5s_ease-out_${index * 0.1}s_both]
                    ${result === 'W'
                      ? 'bg-green-500/80 text-white shadow-green-500/50'
                      : result === 'L'
                      ? 'bg-red-500/80 text-white shadow-red-500/50'
                      : 'bg-yellow-500/80 text-black shadow-yellow-500/50'
                    }
                    shadow-lg
                  `}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>




          {/* UFC Performance Stats */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-center text-muted-foreground tracking-wider">OCTAGON METRICS</h4>

            

            {/* Key Performance Indicators with Visual Bars */}
            <div className="space-y-3">
              {/* Striking Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Striking Accuracy
                  </span>
                  <span className={`font-bold ${corner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    {fighterData?.strAcc ? `${fighterData.strAcc}%` : 'N/A'}
                  </span>
                </div>
                {fighterData?.strAcc && (
                  <div className="w-full bg-background/40 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${corner === 'red' ? 'from-red-500 to-red-400' : 'from-blue-500 to-blue-400'} transition-all duration-1000 ease-out`}
                      style={{ width: `${fighterData.strAcc}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Takedown Defense */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Takedown Defense
                  </span>
                  <span className={`font-bold ${corner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    {fighterData?.tdDef ? `${fighterData.tdDef}%` : 'N/A'}
                  </span>
                </div>
                {fighterData?.tdDef && (
                  <div className="w-full bg-background/40 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${corner === 'red' ? 'from-red-500 to-red-400' : 'from-blue-500 to-blue-400'} transition-all duration-1000 ease-out`}
                      style={{ width: `${fighterData.tdDef}%`, animationDelay: '0.2s' }}
                    />
                  </div>
                )}
              </div>

              {/* Additional Real Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center space-y-1">
                  <div className="text-xs text-muted-foreground">SIG. STRIKES/MIN</div>
                  <div className={`font-bold text-sm ${corner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    {fighterData?.slpm ? fighterData.slpm : 'N/A'}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-xs text-muted-foreground">TD AVG</div>
                  <div className={`font-bold text-sm ${corner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    {fighterData?.tdAvg ? `${fighterData.tdAvg}` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Advantages */}
            <div className="border-t border-border/30 pt-3">
              <div className="text-xs text-muted-foreground text-center mb-2 tracking-wider">PHYSICAL EDGE</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-r from-background/60 to-background/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-muted-foreground">AGE</div>
                  <div className={`font-bold ${corner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    {fighterData?.age || `${Math.floor((seed % 10) + 25)}`}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-background/60 to-background/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-muted-foreground">EXPERIENCE</div>
                  <div className={`font-bold ${corner === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                    {wins + losses + draws} fights
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!eventData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading Event...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero
        title={eventData.event_name}
        subtitle="Complete fight card with detailed analysis and AI predictions"
        icon={Calendar}
        variant="events"
        stats={[
          {
            icon: Calendar,
            label: eventData.date,
            value: "",
            color: "primary",
          },
          {
            icon: Clock,
            label: eventData.time || "TBD",
            value: "",
            color: "primary",
          },
          {
            icon: MapPin,
            label: eventData.venue?.replace('Location: ', '') || "TBD",
            value: "",
            color: "primary",
          },
          {
            icon: Swords,
            label: "Fights",
            value: eventData.fights.length,
            color: "primary",
          },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Enhanced Fight Card Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <Swords className="h-8 w-8 text-primary animate-pulse" />
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              FIGHT CARD
            </h2>
            <p className="text-muted-foreground text-lg">
              {eventData.fights.length} scheduled battles in the arena
            </p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <Badge variant="outline" className="border-primary/30 text-primary px-4 py-2">
                <Trophy className="h-4 w-4 mr-2" />
                {eventData.fights.filter(f => f.is_title_fight).length || 0} Title Fights
              </Badge>
              <Badge variant="outline" className="border-muted/30 text-muted-foreground px-4 py-2">
                <Activity className="h-4 w-4 mr-2" />
                Main Card: {Math.min(5, eventData.fights.length)} Fights
              </Badge>
            </div>
          </div>

        {eventData.fights.length > 0 && (
  <div className="text-center mb-12">
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20 mb-8 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-3 text-primary">AI Analysis Center</h3>
      <p className="text-muted-foreground mb-4">Generate comprehensive predictions for all fights using advanced machine learning</p>
      <Button
        size="lg"
        className="gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-3 shadow-lg shadow-primary/20"
        onClick={async () => {
          console.log("🟡 Predict All Fights clicked");

          for (const fight of eventData.fights) {
            console.log(`🔄 Predicting: ${fight.fighter_red} vs ${fight.fighter_blue}`);
            setAnalyzingFights(prev => new Set(prev).add(fight.bout_order));

            try {
              const prediction = await apiService.predictFight({
                fighter1: fight.fighter_red,
                fighter2: fight.fighter_blue,
              });

              console.log("✅ Prediction result:", prediction);

              setPredictions(prev => new Map(prev).set(fight.bout_order, prediction));

              // ✅ Create and store tracking entry
              const log: TrackedFight = {
                fighter1: fight.fighter_red,
                fighter2: fight.fighter_blue,
                predictedWinner: prediction.predicted_winner,
                confidenceScore: prediction.confidence,
                oddsAtPrediction: fight.odds1 || "N/A",
                currentOdds: fight.odds1 || null,
                actualResult: null,
                correct: null,
              };

              setPredictionLogs(prev => [...prev, log]);
              console.log("📦 Log added to tracking list:", log);
            } catch (err) {
              console.error("❌ Prediction failed:", fight.fighter_red, "vs", fight.fighter_blue, err);
            } finally {
              setAnalyzingFights(prev => {
                const newSet = new Set(prev);
                newSet.delete(fight.bout_order);
                return newSet;
              });
            }
          }

          console.log("📤 Submitting all logs to backend:", predictionLogs);

          // Send logs to backend
          try {
            const res = await fetch("http://localhost:8000/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(predictionLogs),
            });
            const result = await res.json();
            console.log("✅ Logs sent to backend:", result);
          } catch (e) {
            console.error("❌ Failed to POST logs:", e);
          }
        }}
      >
        <Zap className="h-5 w-5" />
        Predict All Fights
      </Button>
    </div>
  </div>
)}


          {/* Fight Cards */}
          {eventData.fights.map((fight, index) => {
            const isExpanded = expandedFights.has(fight.bout_order);
            const prediction = predictions.get(fight.bout_order);
            const isAnalyzing = analyzingFights.has(fight.bout_order);
            const fightStats = getFightClassification(fight, eventData.fights.length);

            // Check if this is the first prelims fight to add divider
            const isFirstPrelimsFight = fightStats.isPrelims &&
              (index === 0 || !getFightClassification(eventData.fights[index - 1], eventData.fights.length).isPrelims);

            // Check if this is the first early prelims fight to add divider
            const isFirstEarlyPrelimsFight = fightStats.isEarlyPrelims &&
              (index === 0 || !getFightClassification(eventData.fights[index - 1], eventData.fights.length).isEarlyPrelims);

            return (
              <React.Fragment key={fight.bout_order}>
                {/* Prelims Divider */}
                {isFirstPrelimsFight && (
                  <div className="relative py-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient-to-r from-transparent via-border to-transparent" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-6 py-2 text-muted-foreground font-bold tracking-widest border border-border/50 rounded-full">
                        <Users className="h-4 w-4 inline mr-2" />
                        Preliminary Card
                      </span>
                    </div>
                  </div>
                )}

                {/* Early Prelims Divider */}
                {isFirstEarlyPrelimsFight && (
                  <div className="relative py-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient-to-r from-transparent via-border to-transparent" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-6 py-2 text-muted-foreground font-bold tracking-widest border border-border/50 rounded-full">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Early Preliminary Card
                      </span>
                    </div>
                  </div>
                )}

                <Card
                  className={`group transition-all duration-700 hover:scale-[1.02] ${
                    fightStats.isMainEvent
                      ? 'bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 border-primary/40 shadow-2xl shadow-primary/20 hover:shadow-primary/30'
                      : fightStats.isCoMain
                      ? 'bg-gradient-to-br from-purple-500/25 via-purple-500/15 to-purple-500/5 border-purple-500/40 shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20'
                      : 'bg-gradient-to-br from-card via-card/95 to-muted/30 border-border hover:border-primary/30 shadow-lg hover:shadow-xl'
                  } ${isExpanded ? 'shadow-3xl scale-[1.01] ring-2 ring-primary/20' : ''} animate-in fade-in slide-in-from-bottom-4`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="space-y-4 relative overflow-hidden">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Tag System */}
                    <div className="relative flex flex-wrap items-center justify-center gap-3">
                      {fightStats.isMainEvent && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold shadow-lg">
                          <Crown className="h-4 w-4 mr-1" />
                          MAIN EVENT
                        </Badge>
                      )}
                      {fightStats.isCoMain && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold shadow-lg">
                          <Star className="h-4 w-4 mr-1" />
                          CO-MAIN EVENT
                        </Badge>
                      )}
                
                      <Badge variant="secondary" className="font-medium bg-gradient-to-r from-muted/80 to-muted/60 border-muted/40 text-foreground">
                        <Award className="h-4 w-4 mr-1 text-primary" />
                        {fight.weight_class}
                      </Badge>
                      {fightStats.hasTitleImplications && (
                        <Badge className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold shadow-lg">
                          <Trophy className="h-4 w-4 mr-1" />
                          TITLE FIGHT
                        </Badge>
                      )}
                      {prediction?.rematch && (
                      <Badge variant="secondary" className="font-medium">
                        REMATCH
                      </Badge>
                         )}

                      {fightStats.hasFinisher && (
                        <Badge className="bg-red-600 text-white font-bold">
                          <Zap className="h-4 w-4 mr-1" />
                          FINISHER
                        </Badge>
                  


                    )}
                    

                    </div>

<CardTitle className="text-2xl relative">
  <div className="flex flex-col items-center justify-center gap-4">
    {/* Fighter names with VS in center */}
    <div className="flex items-center justify-center gap-6">
      <div className="text-center">
        <span className="text-primary font-bold text-xl transition-all duration-300 hover:scale-105 cursor-pointer">
          {fight.fighter_red}
        </span>
      </div>
      <div className="flex items-center gap-3 relative">
        <div className="font-bold text-muted-foreground text-lg animate-pulse">VS</div>
      </div>
      <div className="text-center">
        <span className="text-primary font-bold text-xl transition-all duration-300 hover:scale-105 cursor-pointer">
          {fight.fighter_blue}
        </span>
      </div>
    </div>

    {/* Enhanced odds display */}
    {(fight.odds1 || fight.odds2) && (
      <div className="flex justify-center gap-8 mt-2">
        {fight.odds1 && (
          <div className="bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="text-xs text-red-300 font-medium">RED CORNER</div>
            <div className="text-red-400 font-bold text-xl tracking-wide">
              {fight.odds1}
            </div>
          </div>
        )}
        {fight.odds2 && (
          <div className="bg-gradient-to-r from-blue-500/20 to-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-300 font-medium">BLUE CORNER</div>
            <div className="text-blue-400 font-bold text-xl tracking-wide">
              {fight.odds2}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
</CardTitle>


                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Enhanced Quick Actions */}
                  <div className="flex flex-wrap justify-center gap-4 p-4 bg-gradient-to-r from-background/50 via-muted/20 to-background/50 rounded-lg border border-border/30">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate('/');
                        // Use a timeout to allow navigation then set fighters
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('setFighters', {
                            detail: { fighter1: fight.fighter_red, fighter2: fight.fighter_blue }
                          }));
                        }, 100);
                      }}
                      className="gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:from-primary hover:to-primary/90 hover:text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-primary/20"
                    >
                      <Target className="h-4 w-4" />
                      Predict Outcome
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => toggleFightExpansion(fight.bout_order)}
                      className={`gap-2 transition-all duration-500 shadow-lg hover:shadow-xl ${
                        isExpanded
                          ? 'bg-gradient-to-r from-primary to-primary/80 shadow-primary/30 scale-105'
                          : 'bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/80'
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Collapse Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Expand Details
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Enhanced Expanded Content */}
                  <div className={`transition-all duration-1000 ease-in-out ${
                    isExpanded
                      ? 'max-h-[4000px] opacity-100 mt-6'
                      : 'max-h-0 opacity-0 overflow-hidden mt-0'
                  }`}>
                    {isExpanded && (
                      <div className="space-y-8 pt-6">
                        <Separator className="opacity-30" />

                        {/* Enhanced Fighter Comparison with animations */}
                        <div className="space-y-8">
                          <div className="text-center relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg -m-4" />
                            <div className="relative p-6">
                              <h3 className="text-3xl font-bold flex items-center justify-center gap-4 mb-3">
                                <div className="relative">
                                  <BarChart3 className="h-7 w-7 text-primary animate-pulse" />
                                  <div className="absolute inset-0 h-7 w-7 text-primary/30 animate-ping" />
                                </div>
                                <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                                  FIGHTER BREAKDOWN
                                </span>
                                <div className="relative">
                                  <BarChart3 className="h-7 w-7 text-primary animate-pulse" />
                                  <div className="absolute inset-0 h-7 w-7 text-primary/30 animate-ping" />
                                </div>
                              </h3>
                              <p className="text-muted-foreground text-lg">Complete statistical analysis and recent form</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8">
                            <FighterStatsCard
                              fighter={fight.fighter_red}
                              corner="red"
                              prediction={prediction}
                            />
                            <FighterStatsCard
                              fighter={fight.fighter_blue}
                              corner="blue"
                              prediction={prediction}
                            />
                          </div>
                        </div>

                        {/* Enhanced AI Prediction Section */}
                        <Card className="bg-gradient-to-br from-primary/15 via-primary/8 to-primary/15 border-primary/30 shadow-2xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
                          <CardHeader className="relative">
                            <CardTitle className="flex items-center justify-center gap-3 text-xl">
                              <div className="relative">
                                <Flame className="h-6 w-6 text-primary animate-pulse" />
                                <div className="absolute inset-0 h-6 w-6 text-primary/40 animate-ping" />
                              </div>
                              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                AI FIGHT ANALYSIS
                              </span>
                              <div className="relative">
                                <Flame className="h-6 w-6 text-primary animate-pulse" />
                                <div className="absolute inset-0 h-6 w-6 text-primary/40 animate-ping" />
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {!prediction && !isAnalyzing && (
                              <div className="text-center py-4">
                                <Button
                                  onClick={() => generatePrediction(fight)}
                                  className="gap-2"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                  Generate AI Prediction
                                </Button>
                              </div>
                            )}

                            {isAnalyzing && (
                              <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                  Analyzing fighter data and generating prediction...
                                </p>
                              </div>
                            )}

                            {prediction && (
                              <div className="space-y-6 relative">
                                <div className="text-center bg-gradient-to-r from-background/50 via-muted/20 to-background/50 p-6 rounded-xl border border-border/30">
                                  <div className="mb-4">
                                    <div className="text-sm text-muted-foreground mb-2">ORACLE PREDICTION</div>
                                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-3">
                                      {prediction.predicted_winner} VICTORIOUS
                                    </h3>
                                  </div>
                                  <div className="flex justify-center gap-4">
                                    <Badge variant="default" className="text-xl py-3 px-6 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20">
                                      <Zap className="h-5 w-5 mr-2" />
                                      {prediction.confidence}% Confidence
                                    </Badge>
                                    {prediction.rematch && (
                                      <Badge variant="secondary" className="text-xl py-3 px-6 shadow-lg">
                                        <Activity className="h-4 w-4 mr-2" />
                                        REMATCH
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                              

                                <div>
                                  <h4 className="font-semibold mb-3">Key Advantages:</h4>
                                  <div className="grid sm:grid-cols-2 gap-2">
                                    {prediction.stat_favors.map((stat, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 bg-background/50 rounded-lg"
                                      >
                                        <div className="h-2 w-2 bg-primary rounded-full" />
                                        <span className="text-sm">
                                          <strong>{stat.stat}:</strong> {stat.favors}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
