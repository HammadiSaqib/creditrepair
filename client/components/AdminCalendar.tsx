import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '../lib/utils';

interface CalendarEvent {
  id: string;
  type: 'client_reminder' | 'meeting' | 'webinar' | 'workshop' | 'office_hours' | 'exam' | 'meetup' | 'deadline' | 'physical_event' | 'report_pull' | 'other';
  title: string;
  description: string;
  date: string;
  time: string | null;
  duration?: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  meeting_link?: string;
  instructor?: string;
  is_virtual?: boolean;
  is_physical?: boolean;
  location?: string;
  visible_to_admins?: boolean;
}

interface CalendarData {
  events: CalendarEvent[];
  month: number;
  year: number;
  total_events: number;
  client_reminders: number;
  meetings: number;
}

interface UpcomingData {
  upcoming_events: CalendarEvent[];
  total_upcoming: number;
  client_reminders: number;
  meetings: number;
}

const AdminCalendar: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [upcomingData, setUpcomingData] = useState<UpcomingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');

  // Derive upcoming events from calendar events if API returns none
  const computeUpcomingFallback = () => {
    if (!calendarData || !calendarData.events || calendarData.events.length === 0) return null;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const withinRange = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    };

    const upcomingEvents = calendarData.events
      .filter((e) => withinRange(e.date))
      .sort((a, b) => {
        const ta = new Date(`${a.date} ${a.time || '23:59:59'}`).getTime();
        const tb = new Date(`${b.date} ${b.time || '23:59:59'}`).getTime();
        return ta - tb;
      });

    if (upcomingEvents.length === 0) return null;

    return {
      upcoming_events: upcomingEvents,
      total_upcoming: upcomingEvents.length,
      client_reminders: upcomingEvents.filter((e) => e.type === 'client_reminder').length,
      meetings: upcomingEvents.filter((e) => e.type === 'meeting').length,
    } as UpcomingData;
  };

  // Fetch calendar events for the selected month
  const fetchCalendarEvents = async (month?: number, year?: number) => {
    try {
      const currentDate = new Date();
      const targetMonth = month || currentDate.getMonth() + 1;
      const targetYear = year || currentDate.getFullYear();
      
      const response = await fetch(
        `/api/calendar/admin/events?month=${targetMonth}&year=${targetYear}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      if (data.success) {
        setCalendarData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch calendar events');
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    }
  };

  // Fetch upcoming events (next 7 days)
  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/calendar/admin/upcoming', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming events');
      }

      const data = await response.json();
      if (data.success) {
        setUpcomingData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch upcoming events');
      }
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming events');
    }
  };

  // Mark a client reminder as completed
  const markReminderCompleted = async (event: CalendarEvent) => {
    if (event.type !== 'client_reminder' || !event.client_id) return;

    try {
      const response = await fetch('/api/calendar/admin/mark-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          client_id: event.client_id,
          reminder_date: event.date,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark reminder as completed');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh the calendar data
        await fetchCalendarEvents(calendarData?.month, calendarData?.year);
        await fetchUpcomingEvents();
      } else {
        throw new Error(data.error || 'Failed to mark reminder as completed');
      }
    } catch (err) {
      console.error('Error marking reminder as completed:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark reminder as completed');
    }
  };

  // Navigate to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
    fetchCalendarEvents(newDate.getMonth() + 1, newDate.getFullYear());
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    if (!calendarData) return [];

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const dayEvents = calendarData.events.filter(event => event.date === dateStr);
      
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        isPrevMonth: current.getFullYear() < year || (current.getFullYear() === year && current.getMonth() < month),
        isNextMonth: current.getFullYear() > year || (current.getFullYear() === year && current.getMonth() > month),
        events: dayEvents,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'No time set';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchCalendarEvents(),
          fetchUpcomingEvents(),
        ]);
      } catch (err) {
        console.error('Error loading calendar data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // If upcoming API returns empty, fallback to next 7 days from calendar events
  useEffect(() => {
    if (!loading && calendarData && (!upcomingData || upcomingData.upcoming_events.length === 0)) {
      const fallback = computeUpcomingFallback();
      if (fallback) {
        setUpcomingData(fallback);
      }
    }
  }, [loading, calendarData, upcomingData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calendarDays = generateCalendarGrid();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(new Date());
                      fetchCalendarEvents();
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    →
                  </Button>
                </div>
              </div>
              {calendarData && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    {calendarData.client_reminders} Client Reminders
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    {calendarData.meetings} Meetings
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[80px] p-1 border rounded relative overflow-hidden",
                      "border-gray-200",
                      !day.isCurrentMonth && day.isPrevMonth && "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 dark:text-white dark:border-slate-700",
                      !day.isCurrentMonth && day.isNextMonth && "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 dark:text-white dark:border-slate-700",
                      day.isToday && "bg-blue-50 border-blue-300 dark:text-white dark:border-slate-700"
                    )}
                  >
                    {(!day.isCurrentMonth || day.isToday) && (
                      <div className="absolute inset-0 gradient-primary opacity-0 dark:opacity-100" />
                    )}
                    <div className="relative z-10">
                      <div className="text-sm font-medium mb-1">
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs p-1 rounded truncate",
                              event.type === 'client_reminder' 
                                ? "bg-red-100 text-red-800" 
                                : "bg-teal-100 text-teal-800",
                              (!day.isCurrentMonth || day.isToday) && "dark:bg-white/10 dark:text-white"
                            )}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className={cn("text-xs text-gray-500", (!day.isCurrentMonth || day.isToday) && "dark:text-white/80")}> 
                            +{day.events.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Events (Next 7 Days)
              </CardTitle>
              {upcomingData && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{upcomingData.total_upcoming} Total Events</span>
                  <span>{upcomingData.client_reminders} Reminders</span>
                  <span>{upcomingData.meetings} Meetings</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {upcomingData && upcomingData.upcoming_events.length > 0 ? (
                <div className="space-y-4">
                  {upcomingData.upcoming_events.map(event => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full mt-1"
                        style={{ backgroundColor: event.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{formatDate(event.date)}</span>
                              <span>{formatTime(event.time)}</span>
                              {event.duration && <span>{event.duration}</span>}
                            </div>
                            {event.client_name && (
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {event.client_name}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={event.priority === 'high' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {event.priority}
                            </Badge>
                            {event.type === 'client_reminder' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markReminderCompleted(event)}
                                className="text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mark Done
                              </Button>
                            )}
                            {event.meeting_link && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(event.meeting_link, '_blank')}
                                className="text-xs"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Join
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events in the next 7 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCalendar;