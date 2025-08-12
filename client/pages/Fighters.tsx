import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Trophy,
  Flame,
  Crown,
  Target,
  Activity,
  TrendingUp,
  Calendar,
  Ruler,
  Weight,
  BarChart3,
  Shield,
  Zap,
  Eye,
  Award,
  Swords,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Hash
} from "lucide-react";
import { Hero } from "@/components/ui/hero";

function inferDivisionFromWeight(weight: string): string | undefined {
  if (!weight) return undefined;
  const num = parseFloat(weight);
  if (isNaN(num)) return undefined;

  if (num <= 115) return "Strawweight";
  if (num <= 125) return "Flyweight";
  if (num <= 135) return "Bantamweight";
  if (num <= 145) return "Featherweight";
  if (num <= 155) return "Lightweight";
  if (num <= 170) return "Welterweight";
  if (num <= 185) return "Middleweight";
  if (num <= 205) return "Light Heavyweight";
  return "Heavyweight";
}

const isUFCFighter = (fighter: Fighter): boolean => {
  return fighter.fight_history?.some(fight =>
    fight.event && /^ufc\b/i.test(fight.event.trim().toLowerCase())
  );
};

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
  is_champion: boolean;
  // UFC-specific fields
  ufc_record?: string;
  ufc_wins?: number;
  ufc_losses?: number;
  ufc_draws?: number;
}

export default function Fighters() {
  const navigate = useNavigate();
  const [allFighters, setAllFighters] = useState<Fighter[]>([]);
  const [ufcFighters, setUfcFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const fightersPerPage = 16;
  const [ufcOnly, setUfcOnly] = useState(false);

  useEffect(() => {
    const loadFighters = async () => {
      try {
        // Load full fighter data from the API (all fighters including non-UFC)
        const fullFightersRes = await fetch("http://localhost:8000/full_fighters");
        const fullFightersData = await fullFightersRes.json();

        // Load UFC-only fighters with UFC-specific data
        const ufcFightersRes = await fetch("http://localhost:8000/ufc_only_fighters");
        const ufcFightersData = await ufcFightersRes.json();

        // Use ALL fighters from the full fighters endpoint
        const enrichedAllFighters = fullFightersData.map((fighter: Fighter) => ({
          ...fighter,
          division: fighter.division || inferDivisionFromWeight(fighter.weight),
        }));

        // Enrich UFC fighters with division info and ensure UFC records are formatted properly
        const enrichedUfcFighters = ufcFightersData.map((fighter: Fighter) => {
          // Create UFC-specific record if we have UFC wins/losses/draws
          let ufcRecord = fighter.ufc_record;
          if (!ufcRecord &&
              typeof fighter.ufc_wins === "number" &&
              typeof fighter.ufc_losses === "number") {
            ufcRecord = `${fighter.ufc_wins}-${fighter.ufc_losses}${fighter.ufc_draws ? `-${fighter.ufc_draws}` : ''}`;
          }

          // Filter fight history to only UFC events
          const ufcFightHistory = fighter.fight_history?.filter(fight =>
            fight.event && /^ufc\b/i.test(fight.event.trim().toLowerCase())
          ) || [];

          return {
            ...fighter,
            division: fighter.division || inferDivisionFromWeight(fighter.weight),
            ufc_record: ufcRecord,
            fight_history: ufcFightHistory
          };
        });

        console.log("✅ Loaded all fighters from API:", enrichedAllFighters.length);
        console.log("✅ Loaded UFC fighters from API:", enrichedUfcFighters.length);

        setAllFighters(enrichedAllFighters);
        setUfcFighters(enrichedUfcFighters);
      } catch (error) {
        console.error("❌ Error loading fighters from API:", error);
        setAllFighters([]);
        setUfcFighters([]);
      } finally {
        setLoading(false);
      }
    };

    loadFighters();
  }, []);

  // Get current fighters based on UFC filter
  const currentFighters = ufcOnly ? ufcFighters : allFighters;

  const divisions = useMemo(() => {
    const unique = new Set<string>();
    currentFighters.forEach(f => {
      if (f.division && typeof f.division === "string") {
        unique.add(f.division);
      }
    });

    // Sort divisions by weight (heaviest to lightest)
    const weightOrder = [
      "Heavyweight",
      "Light Heavyweight",
      "Middleweight",
      "Welterweight",
      "Lightweight",
      "Featherweight",
      "Bantamweight",
      "Flyweight",
      "Strawweight"
    ];

    return Array.from(unique).sort((a, b) => {
      const aIndex = weightOrder.indexOf(a);
      const bIndex = weightOrder.indexOf(b);

      // If both divisions are in our order, sort by order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in our order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // If neither is in our order, sort alphabetically
      return a.localeCompare(b);
    });
  }, [currentFighters]);

  const { filteredFighters, totalPages, paginatedFighters } = useMemo(() => {
    const filtered = currentFighters.filter((fighter) => {
      if (!fighter || !fighter.name) return false;

      const matchesSearch =
        fighter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.division?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDivision =
        divisionFilter === "all" ||
        (fighter.division &&
          fighter.division.toLowerCase() === divisionFilter.toLowerCase());

      return matchesSearch && matchesDivision;
    });

    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case "age":
          return a.age - b.age;
        case "record": {
          // Use UFC record if in UFC mode, otherwise use overall record
          const recordToUse = (fighter: Fighter) => ufcOnly && fighter.ufc_record ? fighter.ufc_record : fighter.record;
          const [aWins] = recordToUse(a)?.split("-").map(Number) || [0];
          const [bWins] = recordToUse(b)?.split("-").map(Number) || [0];
          return bWins - aWins;
        }
        case "champion":
          return (b.is_champion ? 1 : 0) - (a.is_champion ? 1 : 0);
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

    const totalPages = Math.ceil(sorted.length / fightersPerPage);
    const paginated = sorted.slice(
      (currentPage - 1) * fightersPerPage,
      currentPage * fightersPerPage
    );

    return {
      filteredFighters: sorted,
      totalPages,
      paginatedFighters: paginated
    };
  }, [currentFighters, searchTerm, divisionFilter, sortBy, currentPage, fightersPerPage, ufcOnly]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, divisionFilter, ufcOnly, sortBy]);

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

  const getStatValue = (stat: string) => {
    return parseFloat(stat.replace('%', '')) || 0;
  };

  const generatePageNumbers = () => {
    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = generatePageNumbers();

    return (
      <Card className="mt-8 bg-gradient-to-r from-card via-card/90 to-muted/10 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * fightersPerPage) + 1} to {Math.min(currentPage * fightersPerPage, filteredFighters.length)} of {filteredFighters.length} fighters
                {ufcOnly && <span className="text-red-400 font-medium ml-1">(UFC Only)</span>}
              </div>
              <Badge variant="outline" className="gap-1">
                <Hash className="h-3 w-3" />
                Page {currentPage} of {totalPages}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 p-0 transition-all duration-200 ${
                      currentPage === page 
                        ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                        : "hover:bg-primary/10"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FighterCard = ({ fighter }: { fighter: Fighter }) => {
    // Use UFC record when in UFC mode, otherwise use overall record
    const recordToShow = ufcOnly && fighter.ufc_record ? fighter.ufc_record : fighter.record;
    const winPercentage = getWinPercentage(recordToShow);
    const strikeAccuracy = getStatValue(fighter.stats["Str. Acc."]);
    const tdDefense = getStatValue(fighter.stats["TD Def."]);

    // Use the appropriate fight history (UFC fights are already filtered in UFC mode)
    const fightHistoryToShow = fighter.fight_history || [];
    const recentWins = fightHistoryToShow.slice(0, 5).filter(f => f.result === "win").length;
    const isUFCVeteran = isUFCFighter(fighter);

    return (
      <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/90 to-muted/30 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] w-full">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top Badges Row - No Overlap */}
        <div className="absolute top-2 left-0 right-0 flex justify-between items-start px-2 z-20">
          {/* UFC Badge */}
          {isUFCVeteran && (
            <Badge className={`text-xs font-bold ${
              ufcOnly
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 animate-pulse"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white"
            } px-2 py-1`}>
              UFC
            </Badge>
          )}

          {/* Champion crown */}
          {fighter.is_champion && (
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Crown className="h-4 w-4 text-yellow-900" />
            </div>
          )}
        </div>

        {/* Header with proper spacing */}
        <CardHeader className="pt-12 pb-3 px-4">
          {/* Fighter Name */}
          <div className="space-y-2 mb-4">
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors duration-300">
              {fighter.name}
            </CardTitle>
            {fighter.nickname && (
              <p className="text-sm text-muted-foreground italic">"{fighter.nickname}"</p>
            )}
          </div>

          {/* Division, Stance, and Record Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 border-primary/30 text-primary font-medium"
              >
                {fighter.division}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {fighter.stance}
              </Badge>
            </div>
            <div className="flex flex-col items-end">
              <Badge
                variant="outline"
                className={`${getRecordBadgeColor(recordToShow)} font-bold text-xs px-2 py-1`}
              >
                {recordToShow}
              </Badge>
              {ufcOnly && fighter.ufc_record && (
                <div className="text-xs text-red-400 font-medium mt-1">UFC Record</div>
              )}
            </div>
          </div>

          {/* Age and Win Rate */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{fighter.age} years</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <div>{winPercentage}% win rate</div>
            {ufcOnly && (
              <>
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <div className="text-red-400 font-medium">UFC Stats</div>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          {/* Physical Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-muted/30">
              <Ruler className="h-3 w-3 mx-auto mb-1 text-primary" />
              <div className="text-xs text-muted-foreground mb-1">HEIGHT</div>
              <div className="font-bold text-xs">{fighter.height}</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-muted/30">
              <Weight className="h-3 w-3 mx-auto mb-1 text-primary" />
              <div className="text-xs text-muted-foreground mb-1">WEIGHT</div>
              <div className="font-bold text-xs">{fighter.weight}</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-muted/30">
              <Target className="h-3 w-3 mx-auto mb-1 text-primary" />
              <div className="text-xs text-muted-foreground mb-1">REACH</div>
              <div className="font-bold text-xs">{fighter.reach}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {ufcOnly ? "UFC PERFORMANCE" : "PERFORMANCE"}
            </h4>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Strike Acc.</span>
                  <span className="font-medium text-primary">{fighter.stats["Str. Acc."]}</span>
                </div>
                <Progress value={strikeAccuracy} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">TD Defense</span>
                  <span className="font-medium text-primary">{fighter.stats["TD Def."]}</span>
                </div>
                <Progress value={tdDefense} className="h-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Str/Min:</span>
                  <span className="font-medium">{fighter.stats["SLpM"]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TD Avg:</span>
                  <span className="font-medium">{fighter.stats["TD Avg."]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Form */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {ufcOnly ? "UFC FORM" : "FORM"}
              </h4>
              <div className="text-xs text-muted-foreground">
                {recentWins}/{Math.min(5, fightHistoryToShow.length)}
              </div>
            </div>
            <div className="flex gap-1 justify-center">
              {fightHistoryToShow.slice(0, 5).map((fight, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 hover:scale-110 cursor-pointer ${
                    fight.result === "win"
                      ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30"
                      : "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30"
                  } ${ufcOnly ? 'ring-1 ring-red-400/30' : ''}`}
                  title={`${fight.result.toUpperCase()} vs ${fight.opponent}`}
                >
                  {fight.result.charAt(0).toUpperCase()}
                </div>
              ))}
              {fightHistoryToShow.length === 0 && (
                <div className="text-xs text-muted-foreground italic">No fights</div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 font-medium text-xs h-8"
            onClick={() => navigate(`/fighter/${encodeURIComponent(fighter.name)}`)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Profile
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
          </div>
          <p className="text-muted-foreground text-lg">Loading fighters database...</p>
          <p className="text-xs text-muted-foreground mt-2">Fetching fighter profiles and UFC data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero
        title={ufcOnly ? "UFC FIGHTERS" : "FIGHTER DATABASE"}
        subtitle={ufcOnly
          ? "Exclusive UFC fighter profiles with official Octagon records and statistics"
          : "Complete profiles, stats, and records of elite fighters"
        }
        icon={Users}
        variant="fighters"
        badges={[
          {
            icon: Star,
            label: `${currentFighters.length} ${ufcOnly ? "UFC" : "Total"} Fighters`,
            color: "primary"
          },
          ...(!ufcOnly ? [{
            icon: Zap,
            label: `${ufcFighters.length} UFC Veterans`,
            color: "red-500"
          }] : []),
          {
            icon: Crown,
            label: `${currentFighters.filter(f => f.is_champion).length} Champions`,
            color: "yellow-500"
          }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Controls */}
        <Card className="mb-8 bg-gradient-to-r from-card via-card/90 to-muted/10 border-border shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${ufcOnly ? 'UFC ' : ''}fighters by name, nickname, or division...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-11 bg-background/50"
                  />
                </div>
                
                <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                  <SelectTrigger className="w-56 h-11">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-56 h-11">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="age">Age (Youngest)</SelectItem>
                    <SelectItem value="record">{ufcOnly ? 'UFC Wins' : 'Most Wins'}</SelectItem>
                    <SelectItem value="champion">Champions First</SelectItem>
                  </SelectContent>
                </Select>

                {/* Enhanced UFC Only Button */}
                <Button
                  variant={ufcOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUfcOnly(!ufcOnly)}
                  className={`h-11 px-6 font-medium transition-all duration-300 ${
                    ufcOnly 
                      ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg scale-105 ring-2 ring-red-500/30" 
                      : "hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                  }`}
                >
                  <Zap className={`h-4 w-4 mr-2 ${ufcOnly ? 'animate-pulse' : ''}`} />
                  UFC Only
                  <Badge className={`ml-2 text-xs ${
                    ufcOnly
                      ? "bg-white/20 text-white"
                      : "bg-red-500/10 text-red-600 border-red-500/20"
                  }`}>
                    {ufcFighters.length}
                  </Badge>
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-11 px-4"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-11 px-4"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Results Summary */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-lg font-medium">
              {filteredFighters.length > 0 ? (
                <>Showing {((currentPage - 1) * fightersPerPage) + 1}-{Math.min(currentPage * fightersPerPage, filteredFighters.length)} of {filteredFighters.length} fighters</>
              ) : (
                "No fighters found"
              )}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {divisionFilter !== "all" && (
                <Badge variant="outline" className="text-xs">
                  {divisionFilter}
                </Badge>
              )}
              {ufcOnly && (
                <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400">
                  <Zap className="h-3 w-3 mr-1" />
                  UFC Only Mode
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="outline" className="text-xs">
                  "{searchTerm}"
                </Badge>
              )}
            </div>
          </div>
          
          {filteredFighters.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Crown className="h-4 w-4 text-yellow-400" />
                {filteredFighters.filter(f => f.is_champion).length} Champions
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-primary" />
                Avg age: {Math.round(filteredFighters.reduce((acc, f) => acc + f.age, 0) / filteredFighters.length)}
              </div>
            </div>
          )}
        </div>

        {/* Fighters Display */}
        {paginatedFighters.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedFighters.map((fighter, index) => (
                  <div
                    key={fighter.profile_url || fighter.name || index}
                    className="opacity-0 animate-fadeInUp"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <FighterCard fighter={fighter} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedFighters.map((fighter, index) => {
                  const recordToShow = ufcOnly && fighter.ufc_record ? fighter.ufc_record : fighter.record;
                  const winPercentage = getWinPercentage(recordToShow);
                  const isUFCVeteran = isUFCFighter(fighter);

                  return (
                    <Card
                      key={fighter.profile_url || fighter.name || index}
                      className="hover:shadow-lg transition-all duration-300 hover:border-primary/30 cursor-pointer"
                      onClick={() => navigate(`/fighter/${encodeURIComponent(fighter.name)}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                                <Shield className="h-8 w-8 text-primary" />
                              </div>
                              {fighter.is_champion && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Crown className="h-3 w-3 text-yellow-900" />
                </div>
              )}
                            </div>

                            <div>
                              <h3 className="text-xl font-bold">{fighter.name}</h3>
                              {fighter.nickname && (
                                <p className="text-sm text-muted-foreground italic">"{fighter.nickname}"</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {fighter.division}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {fighter.stance}
                                </Badge>
                                {isUFCVeteran && (
                                  <Badge className="text-xs bg-red-600 text-white">
                                    UFC
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-center">
                            <div>
                              <div className="text-sm text-muted-foreground">Record</div>
                              <Badge
                                variant="outline"
                                className={`${getRecordBadgeColor(recordToShow)} font-bold`}
                              >
                                {recordToShow}
                              </Badge>
                            </div>

                            <div>
                              <div className="text-sm text-muted-foreground">Win Rate</div>
                              <div className="font-bold text-primary">{winPercentage}%</div>
                            </div>

                            <div>
                              <div className="text-sm text-muted-foreground">Age</div>
                              <div className="font-bold">{fighter.age}</div>
                            </div>

                            <div className="hidden md:block">
                              <div className="text-sm text-muted-foreground">Height</div>
                              <div className="font-bold">{fighter.height}</div>
                            </div>

                            <div className="hidden lg:block">
                              <div className="text-sm text-muted-foreground">Weight</div>
                              <div className="font-bold">{fighter.weight}</div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/fighter/${encodeURIComponent(fighter.name)}`);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            <PaginationControls />
          </>
        ) : (
          /* Enhanced Empty State */
          <Card className="text-center py-16 bg-gradient-to-br from-card to-muted/20">
            <CardContent>
              <div className="relative mb-6">
                <Shield className="h-20 w-20 text-muted-foreground mx-auto" />
                <div className="absolute -inset-4 bg-muted-foreground/10 rounded-full blur-xl" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No fighters found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {ufcOnly 
                  ? "No UFC fighters match your current filters. Try adjusting your search criteria or division filter."
                  : "Try adjusting your search terms or filters to find the fighters you're looking for"
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setDivisionFilter("all");
                  }}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Clear Filters
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => setUfcOnly(false)}
                  className="gap-2"
                >
                  <Swords className="h-4 w-4" />
                  Show All Fighters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
