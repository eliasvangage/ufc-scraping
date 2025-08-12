import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { type PredictionResponse } from "@/services/api";
import {
  Shield,
  Target,
  Activity,
  Crown,
  Award,
  Eye,
  Calendar,
  Ruler,
  Weight,
  Flame,
  BarChart3,
  Zap
} from "lucide-react";

interface FightCardProps {
  prediction: PredictionResponse | null;
  isAnalyzing: boolean;
  fighter1?: string;
  fighter2?: string;
  odds1?: string;
  odds2?: string;
}

export function FightCard({ prediction, isAnalyzing, fighter1, fighter2 }: FightCardProps) {
  const formatHeight = (feetDecimal: number): string => {
    const totalInches = Math.round(feetDecimal * 12);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  };

  const StatComparison = ({
    label,
    fighter1Value,
    fighter2Value,
    unit = "",
    format = "number",
    higher = "better",
  }: {
    label: string;
    fighter1Value: number;
    fighter2Value: number;
    unit?: string;
    format?: "number" | "percentage" | "time";
    higher?: "better" | "worse";
  }) => {
    const formatValue = (value: number | undefined) => {
      if (value === undefined || value === null || isNaN(value)) return "N/A";
      switch (format) {
        case "percentage":
          return `${value}%`;
        case "time":
          return value.toString();
        default:
          return value.toString();
      }
    };

    const f1Better = higher === "better" ? fighter1Value > fighter2Value : fighter1Value < fighter2Value;
    const f2Better = higher === "better" ? fighter2Value > fighter1Value : fighter2Value < fighter1Value;

    return (
      <div className="grid grid-cols-3 gap-4 items-center py-3">
        <div className={`text-right ${f1Better ? "text-green-400 font-semibold" : "text-muted-foreground"}`}>
          {formatValue(fighter1Value)}{unit}
        </div>
        <div className="text-center text-sm text-muted-foreground font-medium">{label}</div>
        <div className={`text-left ${f2Better ? "text-green-400 font-semibold" : "text-muted-foreground"}`}>
          {formatValue(fighter2Value)}{unit}
        </div>
      </div>
    );
  };

  const FighterStatsCard = ({ 
    fighter, 
    corner, 
    fighterData,
    recentForm 
  }: { 
    fighter: string; 
    corner: 'red' | 'blue';
    fighterData: any;
    recentForm: string[];
  }) => {
    const cornerColors = {
      red: {
        bg: 'from-red-500/20 via-red-500/10 to-red-500/5',
        border: 'border-red-500/30',
        accent: 'text-red-400',
        icon: 'text-red-400'
      },
      blue: {
        bg: 'from-blue-500/20 via-blue-500/10 to-blue-500/5',
        border: 'border-blue-500/30',
        accent: 'text-blue-400',
        icon: 'text-blue-400'
      }
    };

    return (
      <Card className={`bg-gradient-to-br ${cornerColors[corner].bg} ${cornerColors[corner].border} shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]`}>
        <CardContent className="p-6 space-y-4">
          {/* Fighter Name & Record */}
          <div className="text-center space-y-3">
            <h3 className={`text-2xl font-bold ${cornerColors[corner].accent}`}>{fighter}</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="outline" className={`${cornerColors[corner].border} ${cornerColors[corner].accent} text-lg px-3 py-1`}>
                {fighterData?.record || "N/A"}
              </Badge>
              {fighterData && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  UFC: {fighterData.ufc_wins || 0}-{fighterData.ufc_losses || 0}-{fighterData.ufc_draws || 0}
                </Badge>
              )}
              {fighterData?.is_champion && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold animate-pulse">
                  <Crown className="h-4 w-4 mr-1" />
                  CHAMPION
                </Badge>
              )}
              {/* Debut badge */}
              {fighterData && (!fighterData.ufc_wins && !fighterData.ufc_losses && !fighterData.ufc_draws) && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
                  <Activity className="h-3 w-3 mr-1" />
                  UFC DEBUT
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
          </div>

          {/* Physical Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background/30 rounded-lg p-3 backdrop-blur-sm">
              <Ruler className={`h-4 w-4 mx-auto mb-1 ${cornerColors[corner].icon}`} />
              <div className="text-xs text-muted-foreground">HEIGHT</div>
              <div className="font-semibold">
                {fighterData?.height !== null && fighterData?.height !== undefined
                  ? formatHeight(fighterData.height)
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-background/30 rounded-lg p-3 backdrop-blur-sm">
              <Weight className={`h-4 w-4 mx-auto mb-1 ${cornerColors[corner].icon}`} />
              <div className="text-xs text-muted-foreground">WEIGHT</div>
              <div className="font-semibold">
                {fighterData?.weight !== null && fighterData?.weight !== undefined
                  ? `${fighterData.weight}lbs`
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-background/30 rounded-lg p-3 backdrop-blur-sm">
              <Target className={`h-4 w-4 mx-auto mb-1 ${cornerColors[corner].icon}`} />
              <div className="text-xs text-muted-foreground">REACH</div>
              <div className="font-semibold">
                {fighterData?.reach !== null && fighterData?.reach !== undefined
                  ? `${Math.round(fighterData.reach)}"`
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Age and Experience */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/30 rounded-lg p-3 text-center backdrop-blur-sm">
              <Calendar className={`h-4 w-4 mx-auto mb-1 ${cornerColors[corner].icon}`} />
              <div className="text-xs text-muted-foreground">AGE</div>
              <div className={`font-bold ${cornerColors[corner].accent}`}>
                {fighterData?.age || 'N/A'}
              </div>
            </div>
            <div className="bg-background/30 rounded-lg p-3 text-center backdrop-blur-sm">
              <BarChart3 className={`h-4 w-4 mx-auto mb-1 ${cornerColors[corner].icon}`} />
              <div className="text-xs text-muted-foreground">UFC FIGHTS</div>
              <div className={`font-bold ${cornerColors[corner].accent}`}>
                {fighterData ? (fighterData.ufc_wins + fighterData.ufc_losses + fighterData.ufc_draws) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              PERFORMANCE METRICS
            </h4>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Striking Accuracy</span>
                  <span className={`font-medium ${cornerColors[corner].accent}`}>
                    {fighterData?.strAcc ? `${fighterData.strAcc}%` : 'N/A'}
                  </span>
                </div>
                {fighterData?.strAcc && (
                  <Progress value={fighterData.strAcc} className="h-1.5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Takedown Defense</span>
                  <span className={`font-medium ${cornerColors[corner].accent}`}>
                    {fighterData?.tdDef ? `${fighterData.tdDef}%` : 'N/A'}
                  </span>
                </div>
                {fighterData?.tdDef && (
                  <Progress value={fighterData.tdDef} className="h-1.5" />
                )}
              </div>
            </div>
          </div>

          {/* Recent Form */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-center text-muted-foreground">RECENT FORM</h4>
            <div className="flex justify-center gap-2">
              {recentForm.map((result, index) => (
                <div
                  key={index}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg
                    ${result === 'W'
                      ? 'bg-green-500/80 text-white shadow-green-500/50'
                      : result === 'L'
                      ? 'bg-red-500/80 text-white shadow-red-500/50'
                      : 'bg-yellow-500/80 text-black shadow-yellow-500/50'
                    }
                  `}
                  title={`Fight ${index + 1}: ${result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isAnalyzing) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-12 text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
          </div>
          <h3 className="text-2xl font-bold mb-3">Consulting the Oracle...</h3>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Analyzing fighter data and generating AI prediction
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="bg-gradient-to-br from-muted/10 to-muted/5 border-muted/20">
        <CardContent className="p-12 text-center">
          <div className="relative mb-6">
            <Shield className="h-20 w-20 text-muted-foreground mx-auto" />
            <div className="absolute -inset-4 bg-muted-foreground/10 rounded-full blur-xl" />
          </div>
          <h3 className="text-2xl font-bold text-muted-foreground mb-3">Select Two Fighters</h3>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Choose fighters from both corners to see their detailed matchup analysis with complete stats, records, and AI prediction
          </p>
        </CardContent>
      </Card>
    );
  }

  const f1 = prediction.fighter1_data;
  const f2 = prediction.fighter2_data;

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-br from-primary/15 via-primary/8 to-primary/15 border-primary/30 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold animate-pulse px-4 py-2">
              <Crown className="h-4 w-4 mr-1" />
              MAIN EVENT
            </Badge>
          </div>
          
          <CardTitle className="text-3xl md:text-4xl font-bold mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-400" />
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                ORYEN ORACLE PREDICTION
              </span>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-400" />
                <Shield className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardTitle>

          <div className="text-2xl font-bold flex items-center justify-center gap-4 flex-wrap">
            <span className="text-red-400 font-bold">{f1.name}</span>
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-red-500" />
              </div>
              <Flame className="h-6 w-6 text-primary" />
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
              </div>
            </div>
            <span className="text-blue-400 font-bold">{f2.name}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Fighter Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        <FighterStatsCard
          fighter={f1.name}
          corner="red"
          fighterData={f1}
          recentForm={prediction.fighter1_last5}
        />
        <FighterStatsCard
          fighter={f2.name}
          corner="blue"
          fighterData={f2}
          recentForm={prediction.fighter2_last5}
        />
      </div>

      {/* AI Prediction Section */}
      <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
            <Flame className="h-8 w-8 text-primary animate-pulse" />
            <span className="bg-gradient-to-r from-yellow-400 via-primary to-yellow-400 bg-clip-text text-transparent">
              ORACLE'S PROPHECY
            </span>
            <Flame className="h-8 w-8 text-primary animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-4xl font-bold text-primary mb-4 tracking-wide">
                {prediction.predicted_winner} VICTORIOUS
              </h3>
              <div className="flex justify-center gap-4 mb-4">
                <Badge variant="default" className="text-xl py-3 px-6 bg-gradient-to-r from-primary to-primary/80 shadow-lg">
                  <Zap className="h-5 w-5 mr-2" />
                  {prediction.confidence.toFixed(1)}% Certainty
                </Badge>
                {prediction.rematch && (
                  <Badge variant="secondary" className="text-xl py-3 px-6 shadow-lg">
                    REMATCH
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Statistical Comparison */}
          <div className="bg-background/30 p-6 rounded-xl border border-muted/20">
            <h4 className="text-xl font-semibold mb-6 flex items-center gap-2 justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
              Statistical Comparison
            </h4>
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-muted/20">
                <div className="text-right font-bold text-red-400">{f1.name}</div>
                <div className="text-center text-sm font-medium text-muted-foreground">STAT</div>
                <div className="text-left font-bold text-blue-400">{f2.name}</div>
              </div>
              <StatComparison label="Strikes Landed/Min" fighter1Value={f1.slpm} fighter2Value={f2.slpm} />
              <StatComparison label="Strikes Absorbed/Min" fighter1Value={f1.sapm} fighter2Value={f2.sapm} higher="worse" />
              <StatComparison label="Striking Accuracy" fighter1Value={f1.strAcc} fighter2Value={f2.strAcc} format="percentage" />
              <StatComparison label="Striking Defense" fighter1Value={f1.strDef} fighter2Value={f2.strDef} format="percentage" />
              <StatComparison label="Takedown Average" fighter1Value={f1.tdAvg} fighter2Value={f2.tdAvg} />
              <StatComparison label="Takedown Defense" fighter1Value={f1.tdDef} fighter2Value={f2.tdDef} format="percentage" />
            </div>
          </div>

          {/* Key Advantages */}
          <div className="bg-background/30 p-6 rounded-xl border border-muted/20">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Key Advantages
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {prediction.stat_favors.map((stat, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-muted/20 hover:bg-background/70 transition-colors">
                  <div className="h-3 w-3 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                  <span className="text-sm font-medium">
                    <strong className="text-primary">{stat.stat}:</strong> {stat.favors}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
