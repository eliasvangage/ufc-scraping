import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Info,
  Brain,
  TrendingUp,
  TrendingDown,
  Eye,
  BarChart3,
  Zap,
  Target,
  Shield,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  explainable: boolean;
  topContributors: { feature: string; value: number }[];
  reason?: string;
  shap_values?: number[];
  features?: string[];
  expected_value?: number;
  model_proba?: number | null;
};

export default function ExplainPanel({
  explainable,
  topContributors,
  reason,
  shap_values = [],
  features = [],
  expected_value = 0.5,
  model_proba = null,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasContribs =
    Array.isArray(topContributors) && topContributors.length > 0;
  const hasShapData = shap_values.length > 0 && features.length > 0;

  // Combine SHAP values with feature names for visualization
  const shapFeatures = features
    .map((feature, index) => ({
      name: feature,
      value: shap_values[index] || 0,
      impact: Math.abs(shap_values[index] || 0),
    }))
    .sort((a, b) => b.impact - a.impact);

  const maxImpact = Math.max(...shapFeatures.map((f) => f.impact), 0.1);

  const getImpactColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  const getImpactBg = (value: number) => {
    if (value > 0) return "bg-green-500/20 border-green-500/30";
    if (value < 0) return "bg-red-500/20 border-red-500/30";
    return "bg-muted/20 border-muted/30";
  };

  const formatFeatureName = (feature: string) => {
    return feature
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-bold">
                AI Model Explainability
              </span>
              <Badge
                variant={explainable ? "default" : "secondary"}
                className={cn(
                  "ml-3",
                  explainable
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                )}
              >
                <Zap className="h-3 w-3 mr-1" />
                {explainable ? "High Confidence" : "Limited Data"}
              </Badge>
            </div>
          </div>
          {(hasContribs || hasShapData) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {!explainable && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-400">
                  Limited Explainability
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Prediction confidence is limited due to insufficient UFC data
                  or fighter debut status. The model defaults to a 50/50
                  prediction in these cases.
                </p>
              </div>
            </div>
          </div>
        )}

        {reason && (
          <div className="bg-background/30 rounded-xl p-4 border border-muted/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="font-medium text-blue-400 mb-1">
                  Analysis Summary
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {explainable && model_proba !== null && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-400">
                    Model Confidence
                  </span>
                </div>
                <span className="text-xl font-bold text-purple-400">
                  {((model_proba || 0.5) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress
                value={(model_proba || 0.5) * 100}
                className="h-3 bg-background/50"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Uncertain (50%)</span>
                <span>Very Confident (100%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Top Contributors Overview */}
        {hasContribs && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <h5 className="font-semibold text-purple-400">
                Key Contributing Factors
              </h5>
            </div>
            <div className="grid gap-3">
              {topContributors
                .slice(0, isExpanded ? topContributors.length : 3)
                .map((contrib, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02]",
                      getImpactBg(contrib.value),
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          contrib.value > 0
                            ? "bg-green-500/30"
                            : "bg-red-500/30",
                        )}
                      >
                        {contrib.value > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium">
                          {formatFeatureName(contrib.feature)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {contrib.value > 0
                            ? "Positive Impact"
                            : "Negative Impact"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "font-bold text-lg",
                          getImpactColor(contrib.value),
                        )}
                      >
                        {contrib.value > 0 ? "+" : ""}
                        {contrib.value.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Detailed SHAP Visualization */}
        {isExpanded && hasShapData && (
          <div className="space-y-4">
            <Separator className="bg-purple-500/20" />
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-400" />
              <h5 className="font-semibold text-purple-400">
                Detailed Feature Analysis
              </h5>
            </div>

            <div className="space-y-3">
              {shapFeatures.slice(0, 8).map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {formatFeatureName(feature.name)}
                    </span>
                    <span
                      className={cn("font-bold", getImpactColor(feature.value))}
                    >
                      {feature.value > 0 ? "+" : ""}
                      {feature.value.toFixed(4)}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          feature.value > 0
                            ? "bg-gradient-to-r from-green-500/60 to-green-400"
                            : "bg-gradient-to-r from-red-500/60 to-red-400",
                        )}
                        style={{
                          width: `${(feature.impact / maxImpact) * 100}%`,
                          marginLeft:
                            feature.value < 0
                              ? `${100 - (feature.impact / maxImpact) * 100}%`
                              : "0",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {expected_value !== undefined && (
              <div className="bg-background/30 rounded-lg p-4 border border-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-blue-400">
                    Model Baseline
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Expected baseline probability:{" "}
                  <span className="font-bold">
                    {(expected_value * 100).toFixed(1)}%
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  SHAP values show how each feature pushes the prediction above
                  or below this baseline.
                </p>
              </div>
            )}
          </div>
        )}

        {!hasContribs && !hasShapData && explainable && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center">
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">
                Analysis Complete
              </h4>
              <p className="text-sm text-muted-foreground">
                Model analysis available but no detailed feature contributions
                to display.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
