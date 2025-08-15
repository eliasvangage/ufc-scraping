// client/components/ExplainPanel.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";

type Props = {
  explainable: boolean;
  topContributors: { feature: string; value: number }[];
  reason?: string;
};

export default function ExplainPanel({ explainable, topContributors, reason }: Props) {
  const hasContribs = Array.isArray(topContributors) && topContributors.length > 0;

  return (
    <Card className="bg-gradient-to-br from-muted/20 to-background border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Model Explainability
          <Badge variant={explainable ? "default" : "secondary"} className="ml-2">
            {explainable ? "Available" : "Limited"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!explainable && (
          <div className="flex items-start gap-2 text-amber-500">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm">
              Explanation is limited (likely a debut / missing stats). Showing 50/50 by design.
            </p>
          </div>
        )}

        {reason && (
          <div className="text-sm text-muted-foreground">
            {reason}
          </div>
        )}

        {hasContribs ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {topContributors.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-background/60 border border-border/40">
                <span className="text-sm font-medium">{t.feature}</span>
                <span className="text-sm font-mono">{t.value >= 0 ? `+${t.value}` : t.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No feature contributions to display.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
