import React, { useState, useRef, useEffect } from "react";
import { Search, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FighterSearchProps {
  availableFighters: string[];
  selectedFighter: string | null;
  onFighterSelect: (fighterName: string) => void;
  placeholder: string;
  label: string;
}

export function FighterSearch({ 
  availableFighters, 
  selectedFighter, 
  onFighterSelect, 
  placeholder,
  label 
}: FighterSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredFighters, setFilteredFighters] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter fighters based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = availableFighters
        .filter(fighter => 
          fighter.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 results for performance
      setFilteredFighters(filtered);
      setHighlightedIndex(-1);
    } else {
      setFilteredFighters([]);
    }
  }, [searchTerm, availableFighters]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredFighters.length === 0) {
      if (e.key === "Enter" && filteredFighters.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredFighters.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredFighters.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredFighters.length) {
          selectFighter(filteredFighters[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const selectFighter = (fighterName: string) => {
    onFighterSelect(fighterName);
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const clearSelection = () => {
    onFighterSelect("");
    setSearchTerm("");
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary">{label}</label>
        
        {selectedFighter ? (
          // Selected fighter display
          <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedFighter}</h3>
                    <Badge variant="default" className="text-xs">
                      SELECTED
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-8 w-8 p-0 hover:bg-destructive/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Search input
          <>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => {
                  if (filteredFighters.length > 0) {
                    setIsOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-background/50 border-muted/40 focus:border-primary/50"
              />
            </div>

            {/* Search results dropdown */}
            {isOpen && filteredFighters.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto bg-card/95 backdrop-blur-sm border-primary/20">
                <CardContent className="p-2">
                  {filteredFighters.map((fighter, index) => (
                    <button
                      key={fighter}
                      onClick={() => selectFighter(fighter)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        index === highlightedIndex
                          ? "bg-primary/20 text-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary/60" />
                        <span className="font-medium">{fighter}</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* No results message */}
            {isOpen && searchTerm.length > 0 && filteredFighters.length === 0 && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-card/95 backdrop-blur-sm border-muted/20">
                <CardContent className="p-4 text-center text-muted-foreground">
                  No fighters found matching "{searchTerm}"
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
