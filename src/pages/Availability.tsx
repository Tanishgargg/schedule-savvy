import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAvailability, updateAvailability } from '@/services/api';
import { AvailabilitySchedule, DayAvailability, DateOverride } from '@/types';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
  'Pacific/Auckland', 'UTC',
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

function formatTime12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideDate, setOverrideDate] = useState<Date>();
  const [overrideType, setOverrideType] = useState<'blocked' | 'custom'>('blocked');
  const [overrideStart, setOverrideStart] = useState('09:00');
  const [overrideEnd, setOverrideEnd] = useState('17:00');

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: getAvailability,
  });

  const schedule = schedules[0];

  const updateMutation = useMutation({
    mutationFn: updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success('Availability updated');
    },
  });

  const handleDayToggle = (dayIndex: number, enabled: boolean) => {
    if (!schedule) return;
    const updated = {
      ...schedule,
      rules: schedule.rules.map(r => r.day === dayIndex ? { ...r, enabled } : r),
    };
    updateMutation.mutate(updated);
  };

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    if (!schedule) return;
    const updated = {
      ...schedule,
      rules: schedule.rules.map(r => r.day === dayIndex ? { ...r, [field]: value } : r),
    };
    updateMutation.mutate(updated);
  };

  const handleTimezoneChange = (tz: string) => {
    if (!schedule) return;
    updateMutation.mutate({ ...schedule, timezone: tz });
  };

  const addDateOverride = () => {
    if (!schedule || !overrideDate) return;
    const dateStr = format(overrideDate, 'yyyy-MM-dd');
    const override: DateOverride = {
      id: crypto.randomUUID(),
      date: dateStr,
      type: overrideType,
      ...(overrideType === 'custom' ? { startTime: overrideStart, endTime: overrideEnd } : {}),
    };
    updateMutation.mutate({
      ...schedule,
      dateOverrides: [...schedule.dateOverrides, override],
    });
    setOverrideDialogOpen(false);
    setOverrideDate(undefined);
  };

  const removeOverride = (id: string) => {
    if (!schedule) return;
    updateMutation.mutate({
      ...schedule,
      dateOverrides: schedule.dateOverrides.filter(o => o.id !== id),
    });
  };

  if (isLoading || !schedule) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Availability</h1>
            <p className="text-muted-foreground mt-1">Configure times when you are available for bookings.</p>
          </div>
        </div>

        {/* Timezone */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Timezone</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={schedule.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.rules.map((rule) => (
              <div key={rule.day} className="flex items-center gap-4 py-2">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => handleDayToggle(rule.day, checked)}
                />
                <span className={cn(
                  "w-24 text-sm font-medium",
                  !rule.enabled && "text-muted-foreground"
                )}>
                  {DAY_NAMES[rule.day]}
                </span>
                {rule.enabled ? (
                  <div className="flex items-center gap-2">
                    <Select value={rule.startTime} onValueChange={(v) => handleTimeChange(rule.day, 'startTime', v)}>
                      <SelectTrigger className="w-28 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {TIME_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">–</span>
                    <Select value={rule.endTime} onValueChange={(v) => handleTimeChange(rule.day, 'endTime', v)}>
                      <SelectTrigger className="w-28 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {TIME_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unavailable</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Date Overrides */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Date Overrides</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setOverrideDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Override
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schedule.dateOverrides.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No date overrides. Add one to block specific dates or set custom hours.
              </p>
            ) : (
              <div className="space-y-2">
                {schedule.dateOverrides.map((override) => (
                  <div key={override.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <span className="text-sm font-medium">{format(new Date(override.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {override.type === 'blocked' ? '— Blocked' : `— ${formatTime12(override.startTime!)} – ${formatTime12(override.endTime!)}`}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeOverride(override.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Date Override</DialogTitle>
            <DialogDescription>Block a date or set custom hours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !overrideDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {overrideDate ? format(overrideDate, 'PPP') : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={overrideDate}
                    onSelect={setOverrideDate}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={overrideType} onValueChange={(v: 'blocked' | 'custom') => setOverrideType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocked">Block entire day</SelectItem>
                  <SelectItem value="custom">Custom hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {overrideType === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label>From</Label>
                  <Select value={overrideStart} onValueChange={setOverrideStart}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>To</Label>
                  <Select value={overrideEnd} onValueChange={setOverrideEnd}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
            <Button onClick={addDateOverride} disabled={!overrideDate}>Add Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
