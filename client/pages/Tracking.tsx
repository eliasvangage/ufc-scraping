import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  History
} from "lucide-react";
import { isEventPast, sortEventsByDate, formatEventDate } from "@/lib/dateUtils";

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

export default function Index() {
  const [fightData, setFightData] = useState<FightCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set(["current"]));
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    fetchFightData();
  }, []);

  const fetchFightData = async () => {
  try {
    const response = await fetch("http://localhost:8000/tracked");
    if (!response.ok) throw new Error("Failed to fetch logs");

    const data = await response.json();

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
  (fight.winner === fight.fighter1 ? fight.odds1 : fight.odds2) ?? "N/A";

acc[eventId].fights.push({
  fighter1: fight.fighter1,
  fighter2: fight.fighter2,
  predictedWinner: fight.winner,
  confidenceScore: fight.confidence,
  winnerOddsAtPrediction: winnerOdds,           // ✅ only one odds value
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
    console.error("Error fetching fight data:", error);
    setFightData({ events: [] }); // prevent crashing UI
  } finally {
    setLoading(false);
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


  const formatOdds = (odds: string) => {
    return odds.startsWith("+") ? odds : odds;
  };

  // Calculate overall accuracy and total predictions
  const calculateStats = () => {
    if (!fightData) return { accuracy: 0, totalPredictions: 0, correctPredictions: 0 };
    
    let totalPredictions = 0;
    let correctPredictions = 0;
    
    fightData.events.forEach(event => {
      event.fights.forEach(fight => {
        if (fight.actualResult !== null) {
          totalPredictions++;
          if (fight.correct === true) {
            correctPredictions++;
          }
        }
      });
    });
    
    const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
    
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
  const allFights = fightData.events.flatMap(event => event.fights);
  const { upcoming: upcomingEvents, past: pastEvents } = sortEventsByDate(fightData.events);
  const displayEvents = showPastEvents ? pastEvents : upcomingEvents;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              ORYEN COMBAT ENGINE
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">Advanced machine learning combat outcome predictions</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-6 w-6 text-orange-400" />
                <div className="text-3xl font-bold text-orange-400">
                  {stats.accuracy}%
                </div>
              </div>
              <div className="text-slate-300 font-medium">Accuracy</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.correctPredictions}/{stats.totalPredictions} correct
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-muted/20 border-border shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="h-6 w-6 text-blue-400" />
                <div className="text-3xl font-bold text-blue-400">
                  {allFights.length}
                </div>
              </div>
              <div className="text-slate-300 font-medium">Total Predictions</div>
              <div className="text-xs text-slate-500 mt-1">
                Across all events
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div className="text-3xl font-bold text-green-400">
                  {allFights.filter(fight => fight.confidenceScore >= 75).length}
                </div>
              </div>
              <div className="text-slate-300 font-medium">High Confidence</div>
              <div className="text-xs text-slate-500 mt-1">
                75%+ confidence picks
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-6 w-6 text-purple-400" />
                <div className="text-3xl font-bold text-purple-400">
                  {Math.round(allFights.reduce((acc, fight) => acc + fight.confidenceScore, 0) / allFights.length)}%
                </div>
              </div>
              <div className="text-slate-300 font-medium">Avg Confidence</div>
              <div className="text-xs text-slate-500 mt-1">
                All predictions
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events */}
        <div className="space-y-6">
          {/* Event Navigation */}
          <div className="flex items-center justify-between bg-gradient-to-r from-card/50 to-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">
                  {showPastEvents ? 'Past Events' : 'Upcoming Events'}
                </h2>
                <Badge variant="secondary" className="ml-2">
                  {displayEvents.length}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pastEvents.length > 0 && (
                <Button
                  variant={showPastEvents ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPastEvents(true)}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  Past Events
                  <Badge variant="secondary" className="ml-1">{pastEvents.length}</Badge>
                </Button>
              )}
              {upcomingEvents.length > 0 && (
                <Button
                  variant={!showPastEvents ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPastEvents(false)}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Upcoming Events
                  <Badge variant="secondary" className="ml-1">{upcomingEvents.length}</Badge>
                </Button>
              )}
            </div>
          </div>

          {displayEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            const eventAccuracy = event.fights.filter(f => f.actualResult !== null).length > 0 
              ? Math.round((event.fights.filter(f => f.correct === true).length / event.fights.filter(f => f.actualResult !== null).length) * 100)
              : 0;
            
            return (
              <Card key={event.id} className="bg-gradient-to-br from-card to-muted/30 border-border shadow-xl">
                <CardHeader 
                  className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-400" />
                        <CardTitle className="text-2xl font-bold text-white">{event.title}</CardTitle>
                      </div>
                      <Badge 
                        variant={event.status === "upcoming" ? "default" : "secondary"}
                        className={event.status === "upcoming" 
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30" 
                          : "bg-green-500/20 text-green-400 border-green-500/30"
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {event.status === "upcoming" ? "Upcoming" : "Completed"}
                      </Badge>
                      {event.status === "completed" && event.fights.filter(f => f.actualResult !== null).length > 0 && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          <Percent className="h-3 w-3 mr-1" />
                          {eventAccuracy}% Accuracy
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold tracking-wide ${
                        event.status === "upcoming"
                          ? "bg-orange-500/10 border border-orange-500/30 text-orange-300"
                          : "bg-slate-500/10 border border-slate-500/30 text-slate-300"
                      }`}>
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
                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Fight</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Predicted Winner</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Confidence</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Odds at Prediction</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Result</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Pick Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.fights.map((fight, index) => (
                            <tr key={index} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-foreground">
                                  {fight.fighter1} <span className="text-primary font-bold">vs</span> {fight.fighter2}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">{fight.predictedWinner}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge 
                                  variant="outline" 
                                  className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 font-medium"

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
                                    <span className={`text-sm font-medium ${
                                      fight.correct === true ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {fight.correct === true ? 'Correct' : 'Incorrect'}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground border-border">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-muted-foreground">{fight.pickReason}</span>
                              </td>
                            </tr>
                          ))}
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
            <span className="text-muted-foreground">Powered by advanced machine learning algorithms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
