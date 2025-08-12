/**
 * Date utility functions for handling past vs upcoming events
 */

export const isEventPast = (eventDate: string): boolean => {
  if (!eventDate) return false;

  try {
    const eventDateTime = new Date(eventDate);
    const now = new Date();

    // Add a buffer of 12 hours to account for different timezones and event duration
    const bufferTime = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

    return eventDateTime.getTime() + bufferTime < now.getTime();
  } catch (error) {
    console.error("Error parsing date:", eventDate, error);
    return false;
  }
};

export const sortEventsByDate = <T extends { date: string }>(
  events: T[],
): { upcoming: T[]; past: T[] } => {
  const upcoming: T[] = [];
  const past: T[] = [];

  events.forEach((event) => {
    if (isEventPast(event.date)) {
      past.push(event);
    } else {
      upcoming.push(event);
    }
  });

  // Sort upcoming events by date (earliest first)
  upcoming.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Sort past events by date (most recent first)
  past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { upcoming, past };
};

export const formatEventDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};
