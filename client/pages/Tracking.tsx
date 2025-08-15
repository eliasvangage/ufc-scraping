import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  TrendingUp,
  Target,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  Activity,
  Percent,
  Users,
  ChevronLeft,
  ChevronRight,
  History,
  AlertTriangle,
  Brain,
  Flame,
  Eye,
  Lightbulb,
} from "lucide-react";
import {
  isEventPast,
  sortEventsByDate,
  formatEventDate,
} from "@/lib/dateUtils";
import { Hero } from "@/components/ui/hero";
import { cn } from "@/lib/utils";

interface Fight {
  fighter1: string;
  fighter2: string;
  predictedWinner: string;
  confidenceScore: number;
  winnerOddsAtPrediction: string; // ✅ single odds field
  pickReason: string;
  actualResult: string | null;
  correct: boolean | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "completed";
  fights: Fight[];
}

interface FightCard {
  events: Event[];
}

// Enhanced prediction details component with professional design
const PredictionDetailsCard = ({ fight }: { fight: Fight }) => {
  const isCorrect = fight.correct === true;
  const isPending = fight.actualResult === null;
  const isTossUp =
    fight.predictedWinner === "Toss Up" || fight.confidenceScore === 50;

  return (
    <div className="bg-gradient-to-br from-card/80 via-muted/10 to-background/50 rounded-2xl p-8 border border-border/40 space-y-8 shadow-2xl backdrop-blur-sm">
      {/* Enhanced Fight Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-6">
          <div className="group">
            <div className="text-2xl font-bold text-red-300 mb-2 group-hover:scale-105 transition-transform">
              {fight.fighter1}
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/40 to-red-600/20 flex items-center justify-center ring-4 ring-red-500/30 shadow-xl hover:shadow-red-500/40 transition-all">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Flame className="h-10 w-10 text-primary animate-pulse drop-shadow-lg" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
            <div className="text-xs font-semibold text-muted-foreground tracking-wider">
              VERSUS
            </div>
          </div>

          <div className="group">
            <div className="text-2xl font-bold text-blue-300 mb-2 group-hover:scale-105 transition-transform">
              {fight.fighter2}
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/40 to-blue-600/20 flex items-center justify-center ring-4 ring-blue-500/30 shadow-xl hover:shadow-blue-500/40 transition-all">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Prediction Section */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 rounded-2xl p-8 space-y-6 border border-primary/30 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-3xl font-bold text-center bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
            Oracle's Prophecy
          </h4>
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
            <Eye className="h-8 w-8 text-primary" />
          </div>
        </div>

        {isTossUp ? (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="text-4xl font-bold text-yellow-400 mb-4 animate-pulse">
                TOO CLOSE TO CALL
              </div>
              <div className="absolute inset-0 bg-yellow-400/10 rounded-xl blur-2xl" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-lg whitespace-nowrap"
              >
                <Target className="h-5 w-5 mr-2" />
                50/50 Split
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Insufficient Data
              </Badge>
            </div>
            <div className="bg-background/30 rounded-xl p-4 border border-yellow-400/20">
              <p className="text-muted-foreground leading-relaxed">
                Limited UFC experience or missing fighter data made this a
                toss-up prediction. Both fighters have equal chances of victory
                according to the AI model.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="text-5xl font-bold text-primary mb-3 drop-shadow-lg">
                {fight.predictedWinner}
              </div>
              <div className="absolute inset-0 bg-primary/10 rounded-xl blur-2xl" />
              <div className="text-lg font-semibold text-muted-foreground tracking-wider">
                PREDICTED WINNER
              </div>
            </div>

            {/* Enhanced Confidence Visualization */}
            <div className="space-y-6">
              <div className="bg-background/40 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center justify-between text-lg mb-4">
                  <span className="text-muted-foreground font-medium">
                    AI Confidence Level
                  </span>
                  <span className="font-bold text-primary text-2xl drop-shadow-lg">
                    {fight.confidenceScore}%
                  </span>
                </div>

                {/* Advanced progress bar */}
                <div className="relative mb-4">
                  <div className="w-full bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 rounded-full h-6 overflow-hidden border border-muted/20">
                    <div
                      className="h-full bg-gradient-to-r from-primary/60 via-primary to-yellow-400/80 rounded-full transition-all duration-2000 shadow-lg relative overflow-hidden"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((fight.confidenceScore - 50) / 50) * 100))}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  </div>

                  {/* Enhanced confidence markers */}
                  <div className="flex justify-between text-sm font-medium mt-3 px-1">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mb-1" />
                      <span className="text-yellow-400">50%</span>
                      <span className="text-xs text-muted-foreground">
                        Uncertain
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mb-1" />
                      <span className="text-orange-400">65%</span>
                      <span className="text-xs text-muted-foreground">
                        Likely
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mb-1" />
                      <span className="text-primary">80%</span>
                      <span className="text-xs text-muted-foreground">
                        Confident
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mb-1" />
                      <span className="text-green-400">100%</span>
                      <span className="text-xs text-muted-foreground">
                        Certain
                      </span>
                    </div>
                  </div>

                  {/* Enhanced pointer indicator */}
                  <div
                    className="absolute top-0 flex flex-col items-center transition-all duration-1000"
                    style={{
                      left: `${Math.max(0, Math.min(100, ((fight.confidenceScore - 50) / 50) * 100))}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="w-1 h-6 bg-white rounded-full shadow-lg border border-primary/30" />
                    <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white shadow-lg" />
                  </div>
                </div>
              </div>

              {/* Enhanced Betting Odds */}
              <div className="flex items-center justify-center gap-4">
                <Badge
                  variant="outline"
                  className="font-mono text-lg px-4 py-2 bg-background/50 border-primary/30"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Odds: {fight.winnerOddsAtPrediction}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Reasoning Section */}
      {fight.pickReason && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue-400" />
            </div>
            <h5 className="font-bold text-lg text-blue-400">
              Key Analysis Points
            </h5>
          </div>
          <div className="bg-background/30 rounded-lg p-4 border border-blue-500/10">
            <p className="text-muted-foreground leading-relaxed text-sm">
              {fight.pickReason}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Result Section */}
      {!isPending && (
        <div
          className={cn(
            "rounded-xl p-6 border",
            isCorrect
              ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
              : "bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isCorrect ? "bg-green-500/20" : "bg-red-500/20",
                )}
              >
                <Trophy
                  className={cn(
                    "h-5 w-5",
                    isCorrect ? "text-green-400" : "text-red-400",
                  )}
                />
              </div>
              <h5 className="font-bold text-lg">Actual Result</h5>
            </div>

            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400" />
              )}
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className={cn(
                  "text-lg px-4 py-2 font-bold",
                  isCorrect
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30",
                )}
              >
                {isCorrect ? "✓ Prediction Correct" : "✗ Prediction Incorrect"}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Index() {
  const [fightData, setFightData] = useState<FightCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(
    new Set(["current"]),
  );
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [expandedFights, setExpandedFights] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    fetchFightData(isMounted);

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchFightData = async (isMounted = true) => {
    if (!isMounted) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("http://localhost:8000/tracked", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Failed to fetch logs");

      const data = await response.json();

      if (!isMounted) return;

      // Defensive check
      if (!Array.isArray(data)) {
        console.error("Unexpected format:", data);
        setFightData({ events: [] }); // fallback to empty list
        return;
      }

      // Transform raw logs into expected FightCard format
      const groupedByEvent = data.reduce((acc: any, fight: any) => {
        const eventId = fight.event || "Unknown Event";
        const eventDate = fight.date || new Date().toISOString();
        if (!acc[eventId]) {
          acc[eventId] = {
            id: eventId,
            title: eventId,
            date: eventDate,
            status: isEventPast(eventDate) ? "completed" : "upcoming",
            fights: [],
          };
        }

        const winnerOdds =
          (fight.winner === fight.fighter1 ? fight.odds1 : fight.odds2) ??
          "N/A";

        acc[eventId].fights.push({
          fighter1: fight.fighter1,
          fighter2: fight.fighter2,
          predictedWinner: fight.winner,
          confidenceScore: fight.confidence,
          winnerOddsAtPrediction: winnerOdds, // ✅ only one odds value
          actualResult: fight.actual_result,
          correct: fight.correct,
          pickReason: (fight.top_3_contributors || [])
            .map((c: any) => `${c.stat} favors ${c.favors}`)
            .slice(0, 3)
            .join(", "),
        });

        return acc;
      }, {});

      setFightData({ events: Object.values(groupedByEvent) });
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("Request was aborted");
        return;
      }
      console.warn("Error fetching fight data:", error);
      if (isMounted) {
        setFightData({ events: [] }); // prevent crashing UI
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const toggleFightDetails = (fightId: string) => {
    const newExpanded = new Set(expandedFights);
    if (newExpanded.has(fightId)) {
      newExpanded.delete(fightId);
    } else {
      newExpanded.add(fightId);
    }
    setExpandedFights(newExpanded);
  };

  const formatOdds = (odds: string) => {
    return odds.startsWith("+") ? odds : odds;
  };

  // Calculate overall accuracy and total predictions
  const calculateStats = () => {
    if (!fightData)
      return { accuracy: 0, totalPredictions: 0, correctPredictions: 0 };

    let totalPredictions = 0;
    let correctPredictions = 0;

    fightData.events.forEach((event) => {
      event.fights.forEach((fight) => {
        if (fight.actualResult !== null) {
          totalPredictions++;
          if (fight.correct === true) {
            correctPredictions++;
          }
        }
      });
    });

    const accuracy =
      totalPredictions > 0
        ? Math.round((correctPredictions / totalPredictions) * 100)
        : 0;

    return { accuracy, totalPredictions, correctPredictions };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading fight predictions...</p>
        </div>
      </div>
    );
  }

  if (!fightData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No fight data available</p>
      </div>
    );
  }

  const stats = calculateStats();
  const allFights = fightData.events.flatMap((event) => event.fights);
  const { upcoming: upcomingEvents, past: pastEvents } = sortEventsByDate(
    fightData.events,
  );
  const displayEvents = showPastEvents ? pastEvents : upcomingEvents;

  return (
    <div className="min-h-screen bg-background">
      <Hero
        title="ORYEN COMBAT ENGINE"
        subtitle={
          <>
            Advanced{" "}
            <span className="text-primary font-semibold">machine learning</span>{" "}
            combat outcome predictions with real-time tracking
          </>
        }
        icon={Shield}
        variant="tracking"
        stats={[
          {
            icon: Target,
            label: "Accuracy",
            value: `${stats.accuracy}%`,
            color: "green-500",
          },
          {
            icon: BarChart3,
            label: "Predictions",
            value: allFights.length,
            color: "blue-500",
          },
          {
            icon: Activity,
            label: "Avg Confidence",
            value: `${Math.round(allFights.reduce((acc, fight) => acc + fight.confidenceScore, 0) / allFights.length)}%`,
            color: "purple-500",
          },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
                <div className="text-4xl font-bold text-orange-400">
                  {stats.accuracy}%
                </div>
              </div>
              <div className="text-slate-200 font-semibold text-lg">
                Accuracy
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {stats.correctPredictions}/{stats.totalPredictions} correct
                predictions
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-4xl font-bold text-blue-400">
                  {allFights.length}
                </div>
              </div>
              <div className="text-slate-200 font-semibold text-lg">
                Total Predictions
              </div>
              <div className="text-sm text-slate-400 mt-1">
                Across all events
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-4xl font-bold text-green-400">
                  {
                    allFights.filter((fight) => fight.confidenceScore >= 65)
                      .length
                  }
                </div>
              </div>
              <div className="text-slate-200 font-semibold text-lg">
                High Confidence
              </div>
              <div className="text-sm text-slate-400 mt-1">
                65%+ confidence picks
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
                <div className="text-4xl font-bold text-purple-400">
                  {Math.round(
                    allFights.reduce(
                      (acc, fight) => acc + fight.confidenceScore,
                      0,
                    ) / allFights.length,
                  )}
                  %
                </div>
              </div>
              <div className="text-slate-200 font-semibold text-lg">
                Avg Confidence
              </div>
              <div className="text-sm text-slate-400 mt-1">All predictions</div>
            </CardContent>
          </Card>
        </div>

        {/* Events */}
        <div className="space-y-6">
          {/* Event Navigation */}
          <div className="flex items-center justify-between bg-gradient-to-r from-card/40 via-muted/20 to-card/40 rounded-xl p-6 border border-border/50 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                    {showPastEvents ? "Past Events" : "Upcoming Events"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {displayEvents.length} event
                    {displayEvents.length !== 1 ? "s" : ""} tracked
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1 bg-background/60 rounded-lg border border-border/40">
              {upcomingEvents.length > 0 && (
                <Button
                  variant={!showPastEvents ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowPastEvents(false)}
                  className={`gap-2 transition-all duration-300 ${!showPastEvents ? "bg-primary shadow-lg shadow-primary/20" : "hover:bg-primary/10"}`}
                >
                  <Calendar className="h-4 w-4" />
                  Upcoming
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {upcomingEvents.length}
                  </Badge>
                </Button>
              )}
              {pastEvents.length > 0 && (
                <Button
                  variant={showPastEvents ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowPastEvents(true)}
                  className={`gap-2 transition-all duration-300 ${showPastEvents ? "bg-primary shadow-lg shadow-primary/20" : "hover:bg-primary/10"}`}
                >
                  <History className="h-4 w-4" />
                  Past Events
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pastEvents.length}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          {displayEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            const eventAccuracy =
              event.fights.filter((f) => f.actualResult !== null).length > 0
                ? Math.round(
                    (event.fights.filter((f) => f.correct === true).length /
                      event.fights.filter((f) => f.actualResult !== null)
                        .length) *
                      100,
                  )
                : 0;

            return (
              <Card
                key={event.id}
                className="bg-gradient-to-br from-card to-muted/30 border-border shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.01] animate-fadeInUpOnce"
              >
                <CardHeader
                  className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-400" />
                        <CardTitle className="text-2xl font-bold text-white">
                          {event.title}
                        </CardTitle>
                      </div>
                      <Badge
                        variant={
                          event.status === "upcoming" ? "default" : "secondary"
                        }
                        className={
                          event.status === "upcoming"
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/30"
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {event.status === "upcoming" ? "Upcoming" : "Completed"}
                      </Badge>
                      {event.status === "completed" &&
                        event.fights.filter((f) => f.actualResult !== null)
                          .length > 0 && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Percent className="h-3 w-3 mr-1" />
                            {eventAccuracy}% Accuracy
                          </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold tracking-wide ${
                          event.status === "upcoming"
                            ? "bg-orange-500/10 border border-orange-500/30 text-orange-300"
                            : "bg-slate-500/10 border border-slate-500/30 text-slate-300"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        {formatEventDate(event.date)}
                      </span>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-slate-300">
                          {event.fights.length} fights
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                              Fight
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                              Predicted Winner
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                              Confidence
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                              Odds at Prediction
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                              Result
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                              Pick Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.fights.map((fight, index) => {
                            const fightId = `${event.id}-${index}`;
                            const isExpanded = expandedFights.has(fightId);
                            const isTossUp =
                              fight.predictedWinner === "Toss Up" ||
                              fight.confidenceScore === 50;

                            return (
                              <React.Fragment key={fightId}>
                                <tr
                                  className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                                  onClick={() => toggleFightDetails(fightId)}
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="font-medium text-foreground">
                                        {fight.fighter1}{" "}
                                        <span className="text-primary font-bold">
                                          vs
                                        </span>{" "}
                                        {fight.fighter2}
                                      </div>
                                      {isTossUp && (
                                        <Badge
                                          variant="outline"
                                          className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 text-xs whitespace-nowrap"
                                        >
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Toss-Up
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      {isTossUp ? (
                                        <>
                                          <Target className="h-4 w-4 text-yellow-400" />
                                          <span className="font-medium text-yellow-400">
                                            Too Close to Call
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Target className="h-4 w-4 text-primary" />
                                          <span className="font-medium text-primary">
                                            {fight.predictedWinner}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <Badge
                                      variant="outline"
                                      className={`font-medium ${
                                        isTossUp
                                          ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                                          : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                                      }`}
                                    >
                                      {fight.confidenceScore}%
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="font-mono text-sm bg-muted/50 text-foreground px-2 py-1 rounded">
                                      {fight.winnerOddsAtPrediction}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 text-center">
                                    {fight.actualResult ? (
                                      <div className="flex items-center justify-center gap-2">
                                        {fight.correct === true ? (
                                          <CheckCircle className="h-5 w-5 text-green-400" />
                                        ) : (
                                          <XCircle className="h-5 w-5 text-red-400" />
                                        )}
                                        <span
                                          className={`text-sm font-medium ${
                                            fight.correct === true
                                              ? "text-green-400"
                                              : "text-red-400"
                                          }`}
                                        >
                                          {fight.correct === true
                                            ? "Correct"
                                            : "Incorrect"}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-muted-foreground border-border"
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                                        {fight.pickReason ||
                                          "No details available"}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-2"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-6 py-4 bg-muted/5"
                                    >
                                      <PredictionDetailsCard fight={fight} />
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-center gap-4">
          <Link to="/fighters">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground"
            >
              <Users className="h-5 w-5" />
              Browse Fighters Database
            </Button>
          </Link>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-full">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              Powered by advanced machine learning algorithms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
