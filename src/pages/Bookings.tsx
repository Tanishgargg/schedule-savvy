import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, cancelBooking } from '@/services/api';
import { Booking } from '@/types';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Mail, X, Video } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

function formatTime12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: (id: string) => void }) {
  return (
    <div className="flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground">{booking.eventTitle}</h3>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {booking.eventDuration}m
          </Badge>
          {booking.status === 'cancelled' && (
            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(booking.date + 'T12:00:00'), 'EEE, MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTime12(booking.startTime)} – {formatTime12(booking.endTime)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {booking.bookerName}
          </span>
          <span className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {booking.bookerEmail}
          </span>
        </div>
      </div>
      {booking.status === 'upcoming' && onCancel && (
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onCancel(booking.id)}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled');
      setCancelId(null);
    },
  });

  const upcoming = allBookings.filter(b => b.status === 'upcoming');
  const past = allBookings.filter(b => b.status === 'past');
  const cancelled = allBookings.filter(b => b.status === 'cancelled');

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Video className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">See upcoming and past events booked through your event type links.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming
              {upcoming.length > 0 && (
                <span className="ml-1.5 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <div className="bg-card rounded-lg border">
            <TabsContent value="upcoming" className="m-0">
              {isLoading ? (
                <div className="space-y-0 divide-y">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 animate-pulse" />)}</div>
              ) : upcoming.length === 0 ? (
                <EmptyState message="No upcoming bookings" />
              ) : (
                upcoming.map(b => <BookingCard key={b.id} booking={b} onCancel={setCancelId} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="m-0">
              {past.length === 0 ? (
                <EmptyState message="No past bookings" />
              ) : (
                past.map(b => <BookingCard key={b.id} booking={b} />)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="m-0">
              {cancelled.length === 0 ? (
                <EmptyState message="No cancelled bookings" />
              ) : (
                cancelled.map(b => <BookingCard key={b.id} booking={b} />)
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the booking and notify the attendee. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
