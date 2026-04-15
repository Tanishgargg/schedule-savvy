import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, cancelBooking } from '@/services/api';
import { Booking } from '@/types';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, Video, MoreHorizontal, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function formatTime12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
}

// Generates a simple initials fallback for the avatar
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: (id: string) => void }) {
  const bookingDate = new Date(booking.date + 'T12:00:00');
  const isPast = booking.status === 'past';
  const isCancelled = booking.status === 'cancelled';

  return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 transition-colors hover:bg-muted/30 group">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">
              {getInitials(booking.bookerName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-semibold ${isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {booking.eventTitle} between {booking.bookerName} and you
              </h3>
              {isCancelled && (
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive border-transparent text-[10px] h-5 px-1.5 rounded-sm font-medium">
                    Cancelled
                  </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground/70">
              <Calendar className="h-3.5 w-3.5" />
              {format(bookingDate, 'EEEE, MMMM d, yyyy')}
            </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
                {formatTime12(booking.startTime)} - {formatTime12(booking.endTime)}
            </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" />
              Web conferencing details to follow
            </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 sm:mt-0 pl-14 sm:pl-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {booking.status === 'upcoming' && onCancel && (
              <>
                <Button variant="outline" size="sm" className="h-8 rounded-md text-xs font-medium">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Reschedule
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-md">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-lg">
                    <DropdownMenuItem
                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                        onClick={() => onCancel(booking.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel booking
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
          )}
        </div>
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
      toast.success('Booking cancelled successfully');
      setCancelId(null);
    },
  });

  const upcoming = allBookings.filter(b => b.status === 'upcoming');
  const past = allBookings.filter(b => b.status === 'past');
  const cancelled = allBookings.filter(b => b.status === 'cancelled');

  const EmptyState = ({ title, description }: { title: string, description: string }) => (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-muted h-12 w-12 rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
  );

  return (
      <AdminLayout>
        <div className="max-w-[1000px] w-full mx-auto pb-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Bookings</h1>
            <p className="text-sm text-muted-foreground mt-1">See upcoming and past events booked through your event type links.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 h-9 p-1 bg-muted/50 w-full sm:w-auto inline-flex rounded-lg">
              <TabsTrigger value="upcoming" className="rounded-md text-sm font-medium px-4">
                Upcoming
                {upcoming.length > 0 && (
                    <span className="ml-2 bg-background shadow-sm text-foreground rounded px-1.5 py-0.5 text-[10px] leading-none">
                  {upcoming.length}
                </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-md text-sm font-medium px-4">Past</TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-md text-sm font-medium px-4">Cancelled</TabsTrigger>
            </TabsList>

            <div className="bg-background rounded-[10px] border shadow-sm overflow-hidden">
              <TabsContent value="upcoming" className="m-0 focus-visible:outline-none">
                {isLoading ? (
                    <div className="divide-y border-t-0">
                      {[1, 2, 3].map(i => <div key={i} className="h-[88px] bg-muted/20 animate-pulse" />)}
                    </div>
                ) : upcoming.length === 0 ? (
                    <EmptyState
                        title="No upcoming bookings"
                        description="You have no upcoming bookings. Share your event links to start scheduling meetings."
                    />
                ) : (
                    <div className="divide-y">
                      {upcoming.map(b => <BookingCard key={b.id} booking={b} onCancel={setCancelId} />)}
                    </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="m-0 focus-visible:outline-none">
                {past.length === 0 ? (
                    <EmptyState
                        title="No past bookings"
                        description="You don't have any past bookings yet."
                    />
                ) : (
                    <div className="divide-y">
                      {past.map(b => <BookingCard key={b.id} booking={b} />)}
                    </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="m-0 focus-visible:outline-none">
                {cancelled.length === 0 ? (
                    <EmptyState
                        title="No cancelled bookings"
                        description="You don't have any cancelled bookings."
                    />
                ) : (
                    <div className="divide-y">
                      {cancelled.map(b => <BookingCard key={b.id} booking={b} />)}
                    </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
          <AlertDialogContent className="rounded-[10px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this booking? We'll send an email notification to the attendee.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-md h-9">Keep booking</AlertDialogCancel>
              <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md h-9"
                  onClick={() => cancelId && cancelMutation.mutate(cancelId)}
              >
                Cancel event
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
  );
}