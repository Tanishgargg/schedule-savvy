import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedules, createSchedule, updateSchedule } from '@/services/api';
import { Schedule, AvailabilitySlot } from '@/types';
import { AdminLayout } from '@/components/AdminLayout';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Globe, Clock, Copy, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'UTC',
];

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const defaultTimezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [localSlots, setLocalSlots] = useState<AvailabilitySlot[]>([]);
  const [localTimezone, setLocalTimezone] = useState(defaultTimezone);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch Schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: (newSchedule) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setActiveScheduleId(newSchedule.id);
      toast.success('Schedule created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Schedule> }) => updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setHasUnsavedChanges(false);
      toast.success('Availability saved successfully');
    },
  });

  // Set active schedule on load
  useEffect(() => {
    if (schedules.length > 0 && !activeScheduleId) {
      setActiveScheduleId(schedules[0].id);
    }
  }, [schedules, activeScheduleId]);

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);

  // Sync local state when active schedule changes
  useEffect(() => {
    if (activeSchedule) {
      setLocalSlots(activeSchedule.availabilities || []);
      setLocalTimezone(activeSchedule.timezone || defaultTimezone);
      setHasUnsavedChanges(false);
    }
  }, [activeSchedule, defaultTimezone]);

  // Handle Slot Changes
  const handleDayToggle = (dayId: number, checked: boolean) => {
    setHasUnsavedChanges(true);
    if (checked) {
      setLocalSlots([...localSlots, { dayOfWeek: dayId, startTime: '09:00', endTime: '17:00' }]);
    } else {
      setLocalSlots(localSlots.filter(s => s.dayOfWeek !== dayId));
    }
  };

  const handleTimeChange = (slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setHasUnsavedChanges(true);
    const newSlots = [...localSlots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
    setLocalSlots(newSlots);
  };

  const handleAddSlot = (dayId: number) => {
    setHasUnsavedChanges(true);
    setLocalSlots([...localSlots, { dayOfWeek: dayId, startTime: '09:00', endTime: '17:00' }]);
  };

  const handleRemoveSlot = (slotIndex: number) => {
    setHasUnsavedChanges(true);
    const newSlots = [...localSlots];
    newSlots.splice(slotIndex, 1);
    setLocalSlots(newSlots);
  };

  const handleSave = () => {
    if (!activeScheduleId) return;
    updateMutation.mutate({
      id: activeScheduleId,
      data: {
        timezone: localTimezone,
        availabilities: localSlots,
      }
    });
  };

  const createDefaultSchedule = () => {
    createMutation.mutate({
      name: 'Working Hours',
      timezone: defaultTimezone,
      availabilities: [1, 2, 3, 4, 5].map(day => ({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00'
      }))
    });
  };

  if (isLoading) {
    return (
        <AdminLayout>
          <div className="max-w-5xl mx-auto py-6 animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-100 rounded-[12px]"></div>
          </div>
        </AdminLayout>
    );
  }

  // If user has zero schedules, prompt them to create the first one
  if (schedules.length === 0) {
    return (
        <AdminLayout>
          <div className="max-w-3xl mx-auto py-16 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Set up your availability</h2>
            <p className="mt-2 text-sm text-gray-500 mb-6">Create a schedule to define when you are open for meetings.</p>
            <Button onClick={createDefaultSchedule} disabled={createMutation.isPending} className="bg-black text-white rounded-[8px]">
              <Plus className="mr-2 h-4 w-4" /> Generate "Working Hours"
            </Button>
          </div>
        </AdminLayout>
    );
  }

  return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto py-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Availability</h1>
              <p className="text-sm text-gray-500 mt-1">Configure times when you are available for bookings.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* LEFT PANE: Schedule List */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Schedules</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={createDefaultSchedule}>
                  <Plus className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
              <div className="space-y-1">
                {schedules.map(schedule => (
                    <button
                        key={schedule.id}
                        onClick={() => setActiveScheduleId(schedule.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-[8px] transition-colors ${
                            activeScheduleId === schedule.id
                                ? 'bg-gray-100 font-medium text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {schedule.name}
                      {activeScheduleId === schedule.id && <div className="h-2 w-2 rounded-full bg-black"></div>}
                    </button>
                ))}
              </div>
            </div>

            {/* RIGHT PANE: Schedule Editor */}
            {activeSchedule && (
                <div className="flex-1">
                  <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{activeSchedule.name}</h2>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Globe className="h-4 w-4 mr-1.5" />
                          <Select
                              value={localTimezone}
                              onValueChange={(val) => { setLocalTimezone(val); setHasUnsavedChanges(true); }}
                          >
                            <SelectTrigger className="h-auto p-0 border-0 bg-transparent shadow-none text-gray-500 hover:text-gray-900 focus:ring-0">
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
                      <Button
                          onClick={handleSave}
                          disabled={!hasUnsavedChanges || updateMutation.isPending}
                          className="bg-black text-white rounded-[8px] px-6"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                      </Button>
                    </div>

                    {/* Days Editor */}
                    <div className="p-6 space-y-6">
                      {DAYS_OF_WEEK.map(({ id: dayId, label }) => {
                        // Find all time slots for this specific day
                        const daySlots = localSlots.map((slot, idx) => ({ ...slot, originalIndex: idx })).filter(s => s.dayOfWeek === dayId);
                        const isEnabled = daySlots.length > 0;

                        return (
                            <div key={dayId} className="flex flex-col sm:flex-row gap-4 py-2 border-b border-gray-100 last:border-0">
                              {/* Day Toggle */}
                              <div className="flex items-center w-32 flex-shrink-0">
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(c) => handleDayToggle(dayId, c)}
                                    className="data-[state=checked]:bg-black shadow-sm mr-3"
                                />
                                <span className={`text-sm font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                            {label}
                          </span>
                              </div>

                              {/* Time Slots */}
                              <div className="flex-1 space-y-3">
                                {!isEnabled ? (
                                    <p className="text-sm text-gray-400 py-2">Unavailable</p>
                                ) : (
                                    daySlots.map((slot, i) => (
                                        <div key={slot.originalIndex} className="flex items-center gap-3">
                                          <input
                                              type="time"
                                              value={slot.startTime}
                                              onChange={(e) => handleTimeChange(slot.originalIndex, 'startTime', e.target.value)}
                                              className="w-[120px] rounded-[8px] border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                                          />
                                          <span className="text-gray-400">-</span>
                                          <input
                                              type="time"
                                              value={slot.endTime}
                                              onChange={(e) => handleTimeChange(slot.originalIndex, 'endTime', e.target.value)}
                                              className="w-[120px] rounded-[8px] border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                                          />

                                          {/* Delete Slot Button */}
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                              onClick={() => handleRemoveSlot(slot.originalIndex)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>

                                          {/* Add Slot Button (only show on the last slot of the day) */}
                                          {i === daySlots.length - 1 && (
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-gray-400 hover:text-gray-900"
                                                  onClick={() => handleAddSlot(dayId)}
                                                  title="Add another time block"
                                              >
                                                <Plus className="h-4 w-4" />
                                              </Button>
                                          )}
                                        </div>
                                    ))
                                )}
                              </div>
                            </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
            )}
          </div>
        </div>
      </AdminLayout>
  );
}