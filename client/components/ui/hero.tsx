import React from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "./badge";

interface HeroProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "oracle" | "combat" | "fighters" | "events" | "tracking";
  stats?: Array<{
    icon: LucideIcon;
    label: string;
    value: string | number;
    color?: string;
  }>;
  badges?: Array<{
    icon?: LucideIcon;
    label: string;
    value?: string | number;
    color?: string;
  }>;
}

export function Hero({ 
  title, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  stats = [],
  badges = []
}: HeroProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "oracle":
        return {
          bg: "bg-gradient-to-br from-background via-muted/5 to-background",
          overlay: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,103,0,0.1),transparent)]",
          accent: "bg-[linear-gradient(45deg,transparent_25%,rgba(255,103,0,0.05)_50%,transparent_75%)]",
          titleGradient: "from-foreground via-primary to-primary/70",
          iconColors: "text-primary"
        };
      case "combat":
        return {
          bg: "bg-gradient-to-br from-background via-red-500/5 to-background",
          overlay: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.1),transparent)]",
          accent: "bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.05)_50%,transparent_75%)]",
          titleGradient: "from-foreground via-red-500 to-red-400",
          iconColors: "text-red-500"
        };
      case "fighters":
        return {
          bg: "bg-gradient-to-br from-background via-blue-500/5 to-background",
          overlay: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),transparent)]",
          accent: "bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.05)_50%,transparent_75%)]",
          titleGradient: "from-foreground via-blue-500 to-blue-400",
          iconColors: "text-blue-500"
        };
      case "events":
        return {
          bg: "bg-gradient-to-br from-background via-purple-500/5 to-background",
          overlay: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(147,51,234,0.1),transparent)]",
          accent: "bg-[linear-gradient(45deg,transparent_25%,rgba(147,51,234,0.05)_50%,transparent_75%)]",
          titleGradient: "from-foreground via-purple-500 to-purple-400",
          iconColors: "text-purple-500"
        };
      case "tracking":
        return {
          bg: "bg-gradient-to-br from-background via-green-500/5 to-background",
          overlay: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.1),transparent)]",
          accent: "bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.05)_50%,transparent_75%)]",
          titleGradient: "from-foreground via-green-500 to-green-400",
          iconColors: "text-green-500"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-background via-muted/5 to-background",
          overlay: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,103,0,0.1),transparent)]",
          accent: "",
          titleGradient: "from-foreground via-primary to-primary/70",
          iconColors: "text-primary"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`relative ${styles.bg} border-b border-border overflow-hidden`}>
      {/* Enhanced Background Effects */}
      <div className={`absolute inset-0 ${styles.overlay}`} />
      {styles.accent && <div className={`absolute inset-0 ${styles.accent} animate-pulse`} />}

      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse" style={{animationDelay: '0s'}} />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-primary/30 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-primary/25 rounded-full animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-primary/20 rounded-full animate-pulse" style={{animationDelay: '1.5s'}} />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title and Icon */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-6 mb-8">
              {Icon && (
                <>
                  <div className="relative group">
                    <div className={`absolute -inset-4 ${styles.iconColors.replace('text-', 'bg-')}/10 rounded-full blur-2xl animate-pulse`} />
                    <Icon className={`h-14 w-14 ${styles.iconColors} transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} />
                    <div className={`absolute inset-0 h-14 w-14 ${styles.iconColors}/20 animate-ping`} />
                  </div>
                </>
              )}

              <div className="relative">
                <h1 className={`text-5xl md:text-7xl font-bold bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000`}>
                  {title}
                </h1>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 blur-3xl -z-10 animate-pulse" />
              </div>

              {Icon && (
                <div className="relative group">
                  <div className={`absolute -inset-4 ${styles.iconColors.replace('text-', 'bg-')}/10 rounded-full blur-2xl animate-pulse scale-x-[-1]`} />
                  <Icon className={`h-14 w-14 ${styles.iconColors} scale-x-[-1] transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12`} />
                  <div className={`absolute inset-0 h-14 w-14 ${styles.iconColors}/20 animate-ping scale-x-[-1]`} />
                </div>
              )}
            </div>
            
            {subtitle && (
              <div className="relative">
                <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
                  {subtitle}
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-xl -z-10" />
              </div>
            )}
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex items-center justify-center gap-6 pt-8 flex-wrap animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                const colorClass = stat.color || 'primary';
                const bgClass = colorClass === 'primary' ? 'bg-primary/10 border-primary/20' :
                               colorClass === 'green-500' ? 'bg-green-500/10 border-green-500/20' :
                               colorClass === 'blue-500' ? 'bg-blue-500/10 border-blue-500/20' :
                               colorClass === 'purple-500' ? 'bg-purple-500/10 border-purple-500/20' :
                               colorClass === 'red-500' ? 'bg-red-500/10 border-red-500/20' :
                               colorClass === 'yellow-500' ? 'bg-yellow-500/10 border-yellow-500/20' :
                               'bg-muted/10 border-muted/20';
                const textClass = colorClass === 'primary' ? 'text-primary' :
                                 colorClass === 'green-500' ? 'text-green-500' :
                                 colorClass === 'blue-500' ? 'text-blue-500' :
                                 colorClass === 'purple-500' ? 'text-purple-500' :
                                 colorClass === 'red-500' ? 'text-red-500' :
                                 colorClass === 'yellow-500' ? 'text-yellow-500' :
                                 'text-muted-foreground';
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-4 py-3 ${bgClass} rounded-full backdrop-blur-sm`}
                  >
                    <StatIcon className={`h-4 w-4 ${textClass}`} />
                    <span className={`text-sm font-medium ${textClass}`}>
                      {stat.value} {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
              {badges.map((badge, index) => {
                const BadgeIcon = badge.icon;
                const colorClass = badge.color || 'primary';
                const borderTextClass = colorClass === 'primary' ? 'border-primary/30 text-primary' :
                                       colorClass === 'green-500' ? 'border-green-500/30 text-green-500' :
                                       colorClass === 'blue-500' ? 'border-blue-500/30 text-blue-500' :
                                       colorClass === 'purple-500' ? 'border-purple-500/30 text-purple-500' :
                                       colorClass === 'red-500' ? 'border-red-500/30 text-red-500' :
                                       colorClass === 'yellow-500' ? 'border-yellow-500/30 text-yellow-500' :
                                       'border-muted/30 text-muted-foreground';
                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`${borderTextClass} text-sm px-4 py-2 backdrop-blur-sm`}
                  >
                    {BadgeIcon && <BadgeIcon className="h-4 w-4 mr-2" />}
                    {badge.label}
                    {badge.value && (
                      <span className="ml-2 font-bold">{badge.value}</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
