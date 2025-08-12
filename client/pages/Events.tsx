import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  Target,
  ExternalLink,
  Swords,
  Users,
  Trophy,
  Star,
  History,
  ChevronRight,
  Activity
} from "lucide-react";
import { Hero } from "@/components/ui/hero";
import { isEventPast, sortEventsByDate, formatEventDate } from "@/lib/dateUtils";

interface Fight {
  fighter_red: string;
  fighter_red_url: string;
  fighter_blue: string;
  fighter_blue_url: string;
  weight_class: string;
  bout_order: number;
  is_title_fight?: boolean;
}

interface EventData {
  event_name: string;
  event_url: string;
  date: string;
  time: string;
  venue: string;
  fights: Fight[];
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:8000/upcoming");
        const data: EventData[] = await res.json();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const { upcoming: upcomingEvents, past: pastEvents } = sortEventsByDate(events);
  const displayEvents = showPastEvents ? pastEvents : upcomingEvents;

  const EventCard = ({ event, index }: { event: EventData; index: number }) => {
    const mainEvent = event.fights[0];
    const isNextEvent = index === 0 && !showPastEvents;
    const isPast = isEventPast(event.date);
    
    return (
      <Card
        className={`group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer animate-in fade-in slide-in-from-bottom-4 ${
          isNextEvent
            ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30 shadow-primary/20 ring-1 ring-primary/20'
            : isPast
            ? 'bg-gradient-to-br from-muted/20 to-muted/10 border-muted/30'
            : 'bg-gradient-to-br from-card to-card/80 border-muted/20 hover:border-primary/30'
        }`}
        style={{ animationDelay: `${index * 100}ms` }}
        onClick={() => navigate(`/event/${index}`)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            {isNextEvent && !isPast && (
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold animate-pulse">
                <Flame className="h-3 w-3 mr-1" />
                NEXT EVENT
              </Badge>
            )}
            {isPast && (
              <Badge variant="outline" className="border-muted/50 text-muted-foreground">
                <History className="h-3 w-3 mr-1" />
                Past Event
              </Badge>
            )}
            {!isNextEvent && !isPast && (
              <Badge variant="outline" className="text-xs border-primary/30">
                <Trophy className="h-3 w-3 mr-1" />
                Upcoming
              </Badge>
            )}
            
            <Badge variant="secondary" className="font-medium">
              {formatEventDate(event.date)}
            </Badge>
          </div>

          <CardTitle className="text-xl text-center mb-4">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                {event.event_name}
              </h3>
              
              {mainEvent && (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-foreground font-semibold transition-all duration-300 group-hover:scale-105">
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
                  <span className="text-foreground font-semibold transition-all duration-300 group-hover:scale-105">
                    {mainEvent.fighter_blue}
                  </span>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm bg-background/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">{event.time || "TBD"}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium truncate max-w-32">
                {event.venue?.replace('Location: ', '') || "TBD"}
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{event.fights.length}</span> scheduled fights
            </div>
            
            {mainEvent?.is_title_fight && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold mb-3">
                <Trophy className="h-3 w-3 mr-1" />
                TITLE FIGHT
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              className="group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                if (mainEvent) {
                  navigate('/');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('setFighters', {
                      detail: { fighter1: mainEvent.fighter_red, fighter2: mainEvent.fighter_blue }
                    }));
                  }, 100);
                }
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
                navigate(`/event/${index}`);
              }}
            >
              <ExternalLink className="h-3 w-3" />
              Full Card
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
          </div>
          <h2 className="text-xl font-semibold">Loading Events...</h2>
          <p className="text-muted-foreground">Fetching upcoming fight cards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero
        title="COMBAT EVENTS"
        subtitle="Comprehensive schedule of upcoming and past combat events with detailed fight cards"
        icon={Calendar}
        variant="events"
        stats={[
          {
            icon: Activity,
            label: "Upcoming Events",
            value: upcomingEvents.length,
            color: "green-500",
          },
          {
            icon: History,
            label: "Past Events",
            value: pastEvents.length,
            color: "muted-foreground",
          },
          {
            icon: Swords,
            label: "Total Fights",
            value: events.reduce((acc, event) => acc + event.fights.length, 0),
            color: "primary",
          },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Event Navigation */}
        <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-card/40 via-muted/20 to-card/40 rounded-xl border border-border/50 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                  {showPastEvents ? 'Past Events' : 'Upcoming Events'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {displayEvents.length} event{displayEvents.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-background/60 rounded-lg border border-border/40">
            <Button
              variant={!showPastEvents ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPastEvents(false)}
              className={`gap-2 transition-all duration-300 ${!showPastEvents ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-primary/10'}`}
            >
              <Calendar className="h-4 w-4" />
              Upcoming
              <Badge variant="secondary" className="ml-1 text-xs">{upcomingEvents.length}</Badge>
            </Button>
            <Button
              variant={showPastEvents ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPastEvents(true)}
              className={`gap-2 transition-all duration-300 ${showPastEvents ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-primary/10'}`}
            >
              <History className="h-4 w-4" />
              Past Events
              <Badge variant="secondary" className="ml-1 text-xs">{pastEvents.length}</Badge>
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        {displayEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event, index) => (
              <EventCard key={`${event.event_name}-${index}`} event={event} index={index} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 bg-gradient-to-br from-card to-muted/20">
            <CardContent>
              <div className="relative mb-6">
                <Calendar className="h-20 w-20 text-muted-foreground mx-auto" />
                <div className="absolute -inset-4 bg-muted-foreground/10 rounded-full blur-xl" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No Events Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {showPastEvents 
                  ? "No past events are currently available in our database."
                  : "No upcoming events are currently scheduled. Check back soon for new fight announcements."
                }
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="gap-2"
              >
                <ChevronRight className="h-4 w-4" />
                {showPastEvents ? 'View Upcoming Events' : 'View Past Events'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
