import { EventType, AvailabilitySchedule, Booking, TimeSlot, PublicEventInfo, BookingFormData } from '@/types';
import { mockAvailability, mockBookings } from '@/data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// In-memory mock state for features without a backend yet
let availability = [...mockAvailability];
// let bookings = [...mockBookings];

// ==========================================
// 1. EVENT TYPES (Connected to Real FastAPI Backend)
// ==========================================

export async function getEventTypes(): Promise<EventType[]> {
  const res = await fetch(`${API_BASE_URL}/event-types/`);
  if (!res.ok) throw new Error('Failed to fetch event types');
  return res.json();
}

export async function createEventType(data: Partial<EventType>): Promise<EventType> {
  const res = await fetch(`${API_BASE_URL}/event-types/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create event type');
  return res.json();
}

export async function updateEventType(id: string, data: Partial<EventType>): Promise<EventType> {
  const res = await fetch(`${API_BASE_URL}/event-types/${id}`, {
    method: 'PATCH', // Changed to PATCH to match our FastAPI route
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update event type');
  return res.json();
}

export async function deleteEventType(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/event-types/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete event type');
}

// ==========================================
// 2. AVAILABILITY (Mocked with strict types)
// ==========================================

export async function getAvailability(): Promise<AvailabilitySchedule[]> {
  await delay(300);
  return [...availability];
}

export async function updateAvailability(schedule: AvailabilitySchedule): Promise<AvailabilitySchedule> {
  await delay(300);
  availability = availability.map(a => a.id === schedule.id ? schedule : a);
  return schedule;
}

// ==========================================
// 3. BOOKINGS (Mocked with strict types)
// ==========================================

export async function getBookings(status?: string): Promise<Booking[]> {
  const url = status ? `${API_BASE_URL}/api/bookings?status=${status}` : `${API_BASE_URL}/api/bookings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function cancelBooking(id: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/cancel`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to cancel booking');
  return res.json();
}

export async function rescheduleBooking(id: string, newDate: string, newStartTime: string, newEndTime: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/reschedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: newDate, startTime: newStartTime, endTime: newEndTime })
  });
  if (!res.ok) throw new Error('Failed to reschedule booking');
  return res.json();
}

// ==========================================
// 4. PUBLIC BOOKING (Hybrid Mock/Real)
// ==========================================

export async function getPublicEventInfo(username: string, slug: string): Promise<PublicEventInfo> {
  const res = await fetch(`${API_BASE_URL}/api/public/${username}/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch public event info');
  return res.json();
}

export async function getAvailableSlots(username: string, slug: string, date: string, timezone: string): Promise<TimeSlot[]> {
  const res = await fetch(`${API_BASE_URL}/api/public/${username}/${slug}/slots?date=${date}&timezone=${timezone}`);
  if (!res.ok) throw new Error('Failed to fetch available slots');
  return res.json();
}

export async function createBooking(data: {
  eventTypeId: string;
  date: string;
  startTime: string;
  timezone: string;
  formData: BookingFormData;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/public/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create booking');
  return res.json();
}

