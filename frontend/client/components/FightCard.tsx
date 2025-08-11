import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type PredictionResponse } from "@/services/api";
import {
  Shield,
  Target,
  Activity,
  Crown,
  Award,
  Eye,
} from "lucide-react";

interface FightCardProps {
  prediction: PredictionResponse | null;
  isAnalyzing: boolean;
  odds1?: string;
  odds2?: string;
}


export function FightCard({ prediction, isAnalyzing }: FightCardProps) {
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
      <div className="grid grid-cols-3 gap-4 items-center py-2">
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

  if (!prediction) {
    return (
      <Card className="bg-gradient-to-br from-muted/10 to-muted/5 border-muted/20">
        <CardContent className="p-8 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Select Two Fighters</h3>
          <p className="text-sm text-muted-foreground">
            Choose fighters from both corners to see their detailed matchup analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const f1 = prediction.fighter1_data;
  const f2 = prediction.fighter2_data;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center pb-4">
  <CardTitle className="text-3xl font-bold flex items-center justify-center gap-4">
    <Shield className="h-8 w-8 text-primary" />
    MAIN EVENT
    <Shield className="h-8 w-8 text-primary" />
  </CardTitle>

  {/* 🧠 Fighter names and odds */}
  <div className="text-2xl font-semibold flex items-center justify-center gap-2 flex-wrap">
    <span className="text-primary">{f1.name}</span>
    {f1.odds && (
      <span className="text-muted-foreground text-lg">({f1.odds})</span>
    )}

    <span className="mx-2 text-muted-foreground">VS</span>

    <span className="text-primary">{f2.name}</span>
    {f2.odds && (
      <span className="text-muted-foreground text-lg">({f2.odds})</span>
    )}
  </div>
</CardHeader>

      </Card>

      <Card className="bg-gradient-to-br from-muted/10 to-muted/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Statistical Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-muted/20">
              <div className="text-right font-semibold text-primary">{f1.name}</div>
              <div className="text-center text-sm font-medium">STAT</div>
              <div className="text-left font-semibold text-primary">{f2.name}</div>
            </div>
            <StatComparison label="Strikes Landed/Min" fighter1Value={f1.slpm} fighter2Value={f2.slpm} />
            <StatComparison label="Strikes Absorbed/Min" fighter1Value={f1.sapm} fighter2Value={f2.sapm} higher="worse" />
            <StatComparison label="Striking Accuracy" fighter1Value={f1.strAcc} fighter2Value={f2.strAcc} format="percentage" />
            <StatComparison label="Striking Defense" fighter1Value={f1.strDef} fighter2Value={f2.strDef} format="percentage" />
            <StatComparison label="Takedown Average" fighter1Value={f1.tdAvg} fighter2Value={f2.tdAvg} />
            <StatComparison label="Takedown Defense" fighter1Value={f1.tdDef} fighter2Value={f2.tdDef} format="percentage" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <Award className="h-6 w-6 text-yellow-400" />
            ORACLE'S PROPHECY
            <Award className="h-6 w-6 text-yellow-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-primary mb-4">{prediction.predicted_winner} VICTORIOUS</h3>
            <div className="flex justify-center gap-4 mb-6">
              <Badge variant="default" className="text-lg py-2 px-4 bg-gradient-to-r from-primary to-primary/80">
                {prediction.confidence.toFixed(1)}% Certainty
              </Badge>
              {prediction.rematch && (
                <Badge variant="secondary" className="text-lg py-2 px-4">
                  REMATCH
                </Badge>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Fighter 1 - Red Corner */}
            <div className="bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 border border-red-500/30 p-6 rounded-xl shadow-lg">
              <h4 className="font-bold mb-4 text-center text-xl">{prediction.fighter1}</h4>
              <div className="space-y-4">
                {/* Record */}
                <div className="text-center">
                  <Badge variant="outline" className="border-red-500/30 text-red-400 text-lg px-3 py-1">
                    {f1.record}
                    <span className="text-muted-foreground text-sm ml-1">
                      (UFC: {f1.ufc_wins}-{f1.ufc_losses}-{f1.ufc_draws})
                    </span>
                  </Badge>


                </div>

                {/* Recent Form */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-center text-muted-foreground">RECENT FORM</h5>
                  <div className="flex justify-center gap-2">
                    {prediction.fighter1_last5.map((result, index) => (
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
              </div>
            </div>

            {/* Fighter 2 - Blue Corner */}
            <div className="bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-blue-500/5 border border-blue-500/30 p-6 rounded-xl shadow-lg">
              <h4 className="font-bold mb-4 text-center text-xl">{prediction.fighter2}</h4>
              <div className="space-y-4">
                {/* Record */}
                <div className="text-center">
                  <Badge variant="outline" className="border-red-500/30 text-red-400 text-lg px-3 py-1">
                    {f2.record}
                    <span className="text-muted-foreground text-sm ml-1">
                      (UFC: {f2.ufc_wins}-{f2.ufc_losses}-{f2.ufc_draws})
                    </span>
                  </Badge>

                </div>

                {/* Recent Form */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-center text-muted-foreground">RECENT FORM</h5>
                  <div className="flex justify-center gap-2">
                    {prediction.fighter2_last5.map((result, index) => (
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
              </div>
            </div>
          </div>
          <div className="bg-background/30 p-6 rounded-xl border border-muted/20">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Key Advantages
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {prediction.stat_favors.map((stat, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-muted/20">
                  <div className="h-3 w-3 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                  <span className="text-sm"><strong>{stat.stat}:</strong> {stat.favors}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
