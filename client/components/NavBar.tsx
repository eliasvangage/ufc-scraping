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
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="lg"
                  onClick={() => navigate(item.path)}
                  className={`
                    relative gap-3 px-6 py-3 h-auto
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary/10 hover:text-primary'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Status Badge */}
          <div className="hidden lg:block">
            <Badge variant="outline" className="border-green-500/30 text-green-400 px-3 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
