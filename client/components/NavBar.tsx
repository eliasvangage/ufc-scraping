import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Swords,
  Home,
  Users,
  Calendar,
  Menu,
  Flame
} from "lucide-react";

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
  {
    path: "/",
    label: "Oracle",
    icon: Flame,
    description: "Predict fights"
  },
  {
    path: "/fighters",
    label: "Fighters",
    icon: Users,
    description: "Database"
  },
  {
    path: "/events",
    label: "Events",
    icon: Calendar,
    description: "Upcoming"
  },
  {
    path: "/tracking",
    label: "Tracking",
    icon: Swords, // You can change this to something like `BarChart3` or `LineChart`
    description: "AI Accuracy"
  }
];


  return (
    <nav className="border-b border-border/30 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 shadow-lg shadow-background/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-4 cursor-pointer group transition-all duration-300"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Swords className="h-11 w-11 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 relative" />
              <div className="absolute inset-0 h-11 w-11 text-primary/20 animate-pulse scale-110">
                <Swords className="h-11 w-11" />
              </div>
            </div>
            <div className="transition-all duration-300 group-hover:translate-x-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent tracking-tight">
                ORYEN COMBAT ENGINE
              </h1>
              <p className="text-sm text-muted-foreground -mt-1 font-medium group-hover:text-primary/80 transition-colors duration-300">Advanced Combat Analytics</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate(item.path)}
                  className={`
                    relative gap-3 px-5 py-3 h-auto transition-all duration-300 group
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                        : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary hover:scale-105'
                    }
                    rounded-xl border border-transparent
                    ${
                      isActive
                        ? 'border-primary/30'
                        : 'hover:border-primary/20'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur-lg" />
                  )}

                  <Icon className={`h-5 w-5 transition-all duration-300 ${
                    isActive ? 'animate-pulse' : 'group-hover:scale-110'
                  }`} />
                  <div className="text-left relative">
                    <div className={`font-semibold transition-all duration-300 ${
                      isActive ? 'text-primary-foreground' : ''
                    }`}>{item.label}</div>
                    <div className={`text-xs transition-all duration-300 ${
                      isActive ? 'text-primary-foreground/80' : 'text-muted-foreground group-hover:text-primary/70'
                    }`}>{item.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Enhanced Status Badge */}
          <div className="hidden lg:block">
            <div className="relative">
              <Badge variant="outline" className="border-green-500/40 text-green-400 px-4 py-2 bg-gradient-to-r from-green-500/10 to-green-500/5 shadow-lg shadow-green-500/10 transition-all duration-300 hover:shadow-green-500/20 hover:scale-105">
                <div className="relative flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute w-2 h-2 bg-green-500/30 rounded-full animate-ping" />
                  <span className="font-medium">Live</span>
                </div>
              </Badge>
            </div>
          </div>

          {/* Enhanced Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
