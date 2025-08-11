import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Swords,
  Flame,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  ExternalLink,
  AlertCircle,
  Target,
  Users,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { apiService, type PredictionResponse } from "@/services/api";
import { FighterSearch } from "./FighterSearch";
import { FightCard } from "./FightCard";
import { isEventPast, sortEventsByDate, formatEventDate } from "@/lib/dateUtils";

interface UpcomingFight {
  fighter_red: string;
  fighter_red_url: string;
  fighter_blue: string;
  fighter_blue_url: string;
}

interface UpcomingCard {
  event_name: string;
  event_url: string;
  date: string;     // ✅ ADD
  time: string;     // ✅ ADD
  venue: string;    // ✅ ADD
  fights: UpcomingFight[];
}


export function FightPredictor() {
  const navigate = useNavigate();
  const [availableFighters, setAvailableFighters] = useState<string[]>([]);
  const [fighter1, setFighter1] = useState<string>("");
  const [fighter2, setFighter2] = useState<string>("");
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingFighters, setIsLoadingFighters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [upcomingCards, setUpcomingCards] = useState<UpcomingCard[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    const loadFighters = async () => {
      setIsLoadingFighters(true);
      setError(null);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        );
        const fightersPromise = apiService.getFighters();
        const fighters = (await Promise.race([fightersPromise, timeoutPromise])) as string[];
        setAvailableFighters(fighters);
        setUsingMockData(false);
      } catch (err) {
        const mockFighters = [
          "Jon Jones", "Stipe Miocic", "Alexander Volkanovski", "Islam Makhachev",
          "Sean O'Malley", "Israel Adesanya", "Alex Pereira", "Belal Muhammad",
          "Dricus du Plessis", "Ilia Topuria", "Max Holloway", "Arman Tsarukyan",
          "Magomed Ankalaev", "Shavkat Rakhmonov", "Sean Strickland", "Tom Aspinall",
          "Leon Edwards", "Kamaru Usman", "Colby Covington", "Gilbert Burns",
          "Francis Ngannou", "Ciryl Gane", "Curtis Blaydes", "Derrick Lewis",
          "Jailton Almeida", "Sergei Pavlovich", "Alexander Volkov", "Tai Tuivasa"
        ];
        setAvailableFighters(mockFighters);
        setUsingMockData(true);
      }
      setIsLoadingFighters(false);
    };

    const loadUpcoming = async () => {
      try {
        const res = await fetch("http://localhost:8000/upcoming");
        const data = await res.json();
        setUpcomingCards(data);
      } catch (err) {
        console.error("Failed to load upcoming fights:", err);
      }
    };

    loadFighters();
    loadUpcoming();
  }, []);

  // Listen for fighter selection events from event detail pages
  useEffect(() => {
    const handleSetFighters = (event: CustomEvent) => {
      const { fighter1: f1, fighter2: f2 } = event.detail;
      setFighter1(f1);
      setFighter2(f2);
      setPrediction(null);
    };

    window.addEventListener('setFighters', handleSetFighters as EventListener);
    return () => {
      window.removeEventListener('setFighters', handleSetFighters as EventListener);
    };
  }, []);

  const handleFighterSelect = (
    fighterName: string,
    position: "fighter1" | "fighter2"
  ) => {
    if (position === "fighter1") setFighter1(fighterName);
    else setFighter2(fighterName);
    setPrediction(null);
  };

  const runPrediction = async () => {
    if (!fighter1 || !fighter2) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await apiService.predictFight({ fighter1, fighter2 });
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoadingFighters) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Loading Gladiators...</h2>
          <p className="text-muted-foreground">Fetching fighters from the arena</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-br from-background via-muted/5 to-background border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,103,0,0.1),transparent)]" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Flame className="h-12 w-12 text-primary animate-pulse" />
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-primary/70 bg-clip-text text-transparent">
                  ORYEN ORACLE
                </h1>
                <Flame className="h-12 w-12 text-primary animate-pulse scale-x-[-1]" />
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Harness the power of machine learning to predict combat fight outcomes
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  {usingMockData ? 'Demo Mode' : 'Live Predictions'}
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {availableFighters.length} Fighters
                </span>
              </div>
            </div>

            {usingMockData && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 max-w-md mx-auto">
                <p className="text-xs text-yellow-600/90">Backend unavailable - using demo predictions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <Card className="bg-gradient-to-br from-muted/10 via-muted/5 to-muted/10 border-muted/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">SELECT YOUR FIGHTERS</CardTitle>
            <CardDescription>Search for any two fighters to create an epic matchup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <FighterSearch availableFighters={availableFighters} selectedFighter={fighter1} onFighterSelect={(f) => handleFighterSelect(f, "fighter1")} placeholder="Search for red corner fighter..." label="🔴 RED CORNER" />
              <FighterSearch availableFighters={availableFighters} selectedFighter={fighter2} onFighterSelect={(f) => handleFighterSelect(f, "fighter2")} placeholder="Search for blue corner fighter..." label="🔵 BLUE CORNER" />
            </div>
            {fighter1 && fighter2 && (
              <div className="flex justify-center mt-8">
                <Button onClick={runPrediction} disabled={isAnalyzing} size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-6">
                  {isAnalyzing ? <><Loader2 className="h-5 w-5 animate-spin" />Consulting the Oracle...</> : <><Flame className="h-5 w-5" />MAKE PREDICTION</>}
                </Button>
              </div>
            )}
            {error && (
              <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20 mt-4">
                <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <FightCard fighter1={null} fighter2={null} prediction={prediction} isAnalyzing={isAnalyzing} />

        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              OCTAGON SCHEDULE
            </h2>
            <p className="text-muted-foreground text-lg">Upcoming combat events in the arena</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <Flame className="h-4 w-4 text-primary animate-pulse" />
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
          </div>

          {/* Event Navigation Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold">
                {showPastEvents ? 'Past Events' : 'Upcoming Events'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {upcomingCards.filter(event => !isEventPast(event.date)).length > 0 && (
                <Button
                  variant={!showPastEvents ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPastEvents(false)}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Upcoming
                </Button>
              )}
              {upcomingCards.filter(event => isEventPast(event.date)).length > 0 && (
                <Button
                  variant={showPastEvents ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPastEvents(true)}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Past Events
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced Event Cards Grid */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="overflow-x-auto custom-scrollbar">
              <div className="flex gap-6 pb-6 px-2 min-w-max">
                {upcomingCards
                  .filter(event => showPastEvents ? isEventPast(event.date) : !isEventPast(event.date))
                  .map((event, idx) => {
                  const mainEvent = event.fights[0];
                  const isNextEvent = idx === 0 && !showPastEvents;

                  return (
                    <Card
                      key={idx}
                      className={`
                        w-96 transition-all duration-500 group cursor-pointer
                        hover:scale-[1.02] hover:shadow-2xl
                        animate-[fadeInUp_0.6s_ease-out_${idx * 0.1}s_both]
                        ${isNextEvent
                          ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30 shadow-primary/20 ring-1 ring-primary/20'
                          : 'bg-gradient-to-br from-card to-card/80 border-muted/20 hover:border-primary/30'
                        }
                      `}
                      onClick={() => navigate(`/event/${idx}`)}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-3">
                          {isNextEvent && (
                            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold animate-pulse">
                              <Flame className="h-3 w-3 mr-1" />
                              NEXT EVENT
                            </Badge>
                          )}
                          {!isNextEvent && (
                            <Badge variant="outline" className="text-xs border-primary/30">
                              🔥 Main Event
                            </Badge>
                          )}
                          <Badge variant="secondary" className="font-medium">
                            {event.date ?? "TBD"}
                          </Badge>
                        </div>

                        <CardTitle className="text-xl text-center mb-2">
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-primary font-bold transition-all duration-300 group-hover:scale-105">
                              {mainEvent.fighter_red}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                              </div>
                              <Swords className="h-5 w-5 text-muted-foreground animate-pulse" />
                              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                              </div>
                            </div>
                            <span className="text-primary font-bold transition-all duration-300 group-hover:scale-105">
                              {mainEvent.fighter_blue}
                            </span>
                          </div>
                        </CardTitle>

                        <CardDescription className="text-center font-bold text-primary/90 text-lg">
                          {event.event_name}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-sm bg-background/30 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">{event.time ?? "TBD"}</span>
                          </div>
                          <div className="w-px h-4 bg-border" />
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium truncate">{(event.venue ?? "TBD").replace('Location: ', '')}</span>
                          </div>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                          <span className="font-semibold">{event.fights.length}</span> scheduled fights
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFighter1(mainEvent.fighter_red);
                              setFighter2(mainEvent.fighter_blue);
                              setPrediction(null);
                            }}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            Predict
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/event/${idx}`);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Full Card
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Load More Card */}
                <Card className="w-96 bg-gradient-to-br from-muted/10 to-muted/5 border-dashed border-muted/30 hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">More Events</h3>
                    <p className="text-sm text-muted-foreground mb-4">Discover additional upcoming fights</p>
                    <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                      View All Events
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
