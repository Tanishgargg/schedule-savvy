import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPublicEventInfo, getAvailableSlots, createBooking } from '@/services/api';
import { TimeSlot, BookingFormData, PublicEventInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Clock, Globe, ArrowLeft, CheckCircle2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Booking } from '@/types';

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'UTC',
];

type Step = 'calendar' | 'form' | 'confirmation';

function formatTime12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function PublicBookingPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<string>();
  const [step, setStep] = useState<Step>('calendar');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
  const [formData, setFormData] = useState<BookingFormData>({ name: '', email: '' });
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [month, setMonth] = useState(new Date());

  const { data: eventInfo, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['publicEvent', username, slug],
    queryFn: () => getPublicEventInfo(username!, slug!),
    enabled: !!username && !!slug,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', username, slug, selectedDate, timezone],
    queryFn: () => getAvailableSlots(username!, slug!, format(selectedDate!, 'yyyy-MM-dd'), timezone),
    enabled: !!selectedDate && !!username && !!slug,
  });

  const bookMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      setConfirmedBooking(booking);
      setStep('confirmation');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to book. Please try again.');
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
  };

  const handleSlotSelect = (time: string) => {
    setSelectedSlot(time);
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventInfo || !selectedDate || !selectedSlot) return;
    bookMutation.mutate({
      eventTypeId: eventInfo.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedSlot,
      timezone,
      formData,
    });
  };

  const backToCalendar = () => {
    setStep('calendar');
    setSelectedSlot(undefined);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-3xl p-8">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (eventError || !eventInfo) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-muted-foreground">This event type doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (step === 'confirmation' && confirmedBooking) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border shadow-sm max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed</h1>
          <p className="text-muted-foreground mb-6">You are scheduled with {eventInfo.hostName}.</p>
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{eventInfo.title}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(confirmedBooking.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime12(confirmedBooking.startTime)} – {formatTime12(confirmedBooking.endTime)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {timezone.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border shadow-sm max-w-4xl w-full overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left panel - event info */}
          <div className="w-full md:w-72 p-6 border-b md:border-b-0 md:border-r flex-shrink-0">
            {step === 'form' && (
              <button onClick={backToCalendar} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">{eventInfo.hostName}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">{eventInfo.title}</h1>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{eventInfo.duration} min</span>
              </div>
              {selectedDate && selectedSlot && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {format(selectedDate, 'EEE, MMM d')}, {formatTime12(selectedSlot)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-auto p-0 border-0 bg-transparent shadow-none text-sm text-muted-foreground hover:text-foreground w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {eventInfo.description && (
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                {eventInfo.description}
              </p>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 p-6">
            {step === 'calendar' && (
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <h2 className="text-base font-medium mb-4">Select a Date</h2>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    month={month}
                    onMonthChange={setMonth}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className="pointer-events-auto"
                  />
                </div>

                {selectedDate && (
                  <div className="w-full sm:w-56">
                    <h2 className="text-base font-medium mb-4">
                      {format(selectedDate, 'EEE, MMM d')}
                    </h2>
                    {slotsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No available times for this date.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant="outline"
                            className="w-full justify-center font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleSlotSelect(slot.time)}
                          >
                            {formatTime12(slot.time)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
                <h2 className="text-base font-medium mb-4">Your Details</h2>
                <div>
                  <Label>Your Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                {eventInfo.customQuestions.map((q) => (
                  <div key={q.id}>
                    <Label>{q.label} {q.required && '*'}</Label>
                    {q.type === 'textarea' ? (
                      <Textarea
                        required={q.required}
                        value={formData.customResponses?.[q.label] || ''}
                        onChange={(e) => setFormData(f => ({
                          ...f,
                          customResponses: { ...f.customResponses, [q.label]: e.target.value },
                        }))}
                        rows={3}
                      />
                    ) : q.type === 'select' ? (
                      <Select
                        value={formData.customResponses?.[q.label] || ''}
                        onValueChange={(v) => setFormData(f => ({
                          ...f,
                          customResponses: { ...f.customResponses, [q.label]: v },
                        }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {q.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        required={q.required}
                        value={formData.customResponses?.[q.label] || ''}
                        onChange={(e) => setFormData(f => ({
                          ...f,
                          customResponses: { ...f.customResponses, [q.label]: e.target.value },
                        }))}
                      />
                    )}
                  </div>
                ))}
                <Button type="submit" className="w-full" disabled={bookMutation.isPending}>
                  {bookMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
