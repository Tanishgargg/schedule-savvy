import { EventType, AvailabilitySchedule, Booking, TimeSlot, PublicEventInfo, BookingFormData } from '@/types';
import { mockEventTypes, mockAvailability, mockBookings } from '@/data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// In-memory mock state (simulates backend)
let eventTypes = [...mockEventTypes];
let availability = [...mockAvailability];
let bookings = [...mockBookings];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Event Types ──────────────────────────────────
export async function getEventTypes(): Promise<EventType[]> {
  if (!API_BASE) { await delay(300); return [...eventTypes]; }
  const res = await fetch(`${API_BASE}/api/event-types`);
  return res.json();
}

export async function createEventType(data: Omit<EventType, 'id' | 'createdAt'>): Promise<EventType> {
  if (!API_BASE) {
    await delay(300);
    const newEvent: EventType = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    eventTypes.push(newEvent);
    return newEvent;
  }
  const res = await fetch(`${API_BASE}/api/event-types`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}

export async function updateEventType(id: string, data: Partial<EventType>): Promise<EventType> {
  if (!API_BASE) {
    await delay(300);
    eventTypes = eventTypes.map(e => e.id === id ? { ...e, ...data } : e);
    return eventTypes.find(e => e.id === id)!;
  }
  const res = await fetch(`${API_BASE}/api/event-types/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}

export async function deleteEventType(id: string): Promise<void> {
  if (!API_BASE) {
    await delay(300);
    eventTypes = eventTypes.filter(e => e.id !== id);
    return;
  }
  await fetch(`${API_BASE}/api/event-types/${id}`, { method: 'DELETE' });
}

// ─── Availability ──────────────────────────────────
export async function getAvailability(): Promise<AvailabilitySchedule[]> {
  if (!API_BASE) { await delay(300); return [...availability]; }
  const res = await fetch(`${API_BASE}/api/availability`);
  return res.json();
}

export async function updateAvailability(schedule: AvailabilitySchedule): Promise<AvailabilitySchedule> {
  if (!API_BASE) {
    await delay(300);
    availability = availability.map(a => a.id === schedule.id ? schedule : a);
    return schedule;
  }
  const res = await fetch(`${API_BASE}/api/availability`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(schedule) });
  return res.json();
}

// ─── Bookings ──────────────────────────────────
export async function getBookings(status?: string): Promise<Booking[]> {
  if (!API_BASE) {
    await delay(300);
    if (status) return bookings.filter(b => b.status === status);
    return [...bookings];
  }
  const url = status ? `${API_BASE}/api/bookings?status=${status}` : `${API_BASE}/api/bookings`;
  const res = await fetch(url);
  return res.json();
}

export async function cancelBooking(id: string): Promise<Booking> {
  if (!API_BASE) {
    await delay(300);
    bookings = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const, cancelledAt: new Date().toISOString() } : b);
    return bookings.find(b => b.id === id)!;
  }
  const res = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, { method: 'PUT' });
  return res.json();
}

export async function rescheduleBooking(id: string, newDate: string, newStartTime: string, newEndTime: string): Promise<Booking> {
  if (!API_BASE) {
    await delay(300);
    bookings = bookings.map(b => b.id === id ? { ...b, date: newDate, startTime: newStartTime, endTime: newEndTime } : b);
    return bookings.find(b => b.id === id)!;
  }
  const res = await fetch(`${API_BASE}/api/bookings/${id}/reschedule`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: newDate, startTime: newStartTime, endTime: newEndTime }) });
  return res.json();
}

// ─── Public Booking ──────────────────────────────────
export async function getPublicEventInfo(username: string, slug: string): Promise<PublicEventInfo> {
  if (!API_BASE) {
    await delay(300);
    const event = eventTypes.find(e => e.slug === slug);
    if (!event) throw new Error('Event not found');
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      duration: event.duration,
      slug: event.slug,
      color: event.color,
      hostName: 'John Doe',
      customQuestions: event.customQuestions,
    };
  }
  const res = await fetch(`${API_BASE}/api/public/${username}/${slug}`);
  return res.json();
}

export async function getAvailableSlots(username: string, slug: string, date: string, timezone: string): Promise<TimeSlot[]> {
  if (!API_BASE) {
    await delay(400);
    const event = eventTypes.find(e => e.slug === slug);
    if (!event) return [];

    const schedule = availability[0];
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const dayRule = schedule.rules.find(r => r.day === dayOfWeek);

    if (!dayRule?.enabled) return [];

    // Check for date overrides
    const override = schedule.dateOverrides.find(o => o.date === date);
    if (override?.type === 'blocked') return [];

    const startHour = override?.startTime ? parseInt(override.startTime.split(':')[0]) : parseInt(dayRule.startTime.split(':')[0]);
    const endHour = override?.endTime ? parseInt(override.endTime.split(':')[0]) : parseInt(dayRule.endTime.split(':')[0]);
    const startMin = override?.startTime ? parseInt(override.startTime.split(':')[1]) : parseInt(dayRule.startTime.split(':')[1]);
    const endMin = override?.endTime ? parseInt(override.endTime.split(':')[1]) : parseInt(dayRule.endTime.split(':')[1]);

    const slots: TimeSlot[] = [];
    const durationWithBuffer = event.duration + event.bufferTimeAfter;
    let currentMin = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    while (currentMin + event.duration <= endTotal) {
      const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
      const m = (currentMin % 60).toString().padStart(2, '0');
      const time = `${h}:${m}`;

      // Check if slot is already booked
      const isBooked = bookings.some(
        b => b.date === date && b.startTime === time && b.status !== 'cancelled' && b.eventTypeId === event.id
      );

      slots.push({ time, available: !isBooked });
      currentMin += durationWithBuffer;
    }

    return slots;
  }
  const res = await fetch(`${API_BASE}/api/public/${username}/${slug}/slots?date=${date}&timezone=${timezone}`);
  return res.json();
}

export async function createBooking(data: {
  eventTypeId: string;
  date: string;
  startTime: string;
  timezone: string;
  formData: BookingFormData;
}): Promise<Booking> {
  if (!API_BASE) {
    await delay(500);
    const event = eventTypes.find(e => e.id === data.eventTypeId);
    if (!event) throw new Error('Event not found');

    // Check double booking
    const isBooked = bookings.some(
      b => b.date === data.date && b.startTime === data.startTime && b.status !== 'cancelled' && b.eventTypeId === data.eventTypeId
    );
    if (isBooked) throw new Error('This time slot is no longer available.');

    const startMinutes = parseInt(data.startTime.split(':')[0]) * 60 + parseInt(data.startTime.split(':')[1]);
    const endMinutes = startMinutes + event.duration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    const booking: Booking = {
      id: crypto.randomUUID(),
      eventTypeId: data.eventTypeId,
      eventTitle: event.title,
      eventDuration: event.duration,
      bookerName: data.formData.name,
      bookerEmail: data.formData.email,
      date: data.date,
      startTime: data.startTime,
      endTime,
      timezone: data.timezone,
      status: 'upcoming',
      customResponses: data.formData.customResponses,
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);
    return booking;
  }
  const res = await fetch(`${API_BASE}/api/public/book`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return res.json();
}
