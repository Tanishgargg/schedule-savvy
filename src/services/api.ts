import { EventType, AvailabilitySchedule, Booking, TimeSlot, PublicEventInfo, BookingFormData } from '@/types';
import { mockAvailability } from '@/data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// In-memory mock state for features without a backend yet (Availability)
let availability = [...mockAvailability];

// ==========================================
// HELPER: Map Backend DB fields to Frontend fields
// ==========================================
function mapBookingData(b: any): Booking {
  // Map backend Enum statuses to frontend tab statuses
  let mappedStatus = b.status?.toLowerCase() || 'upcoming';
  if (mappedStatus === 'accepted' || mappedStatus === 'pending') {
    mappedStatus = 'upcoming';
  }

  // Handle both flat JSON format and strict SQLAlchemy Datetime formats
  let dateStr = b.date;
  let startStr = b.start_time || b.startTime;
  let endStr = b.end_time || b.endTime;

  // If start_time is a full ISO timestamp from the DB, split it into date & time
  if (startStr && startStr.includes('T')) {
    const startDt = new Date(startStr);
    dateStr = startDt.toISOString().split('T')[0];
    startStr = `${startDt.getHours().toString().padStart(2, '0')}:${startDt.getMinutes().toString().padStart(2, '0')}`;
  }
  if (endStr && endStr.includes('T')) {
    const endDt = new Date(endStr);
    endStr = `${endDt.getHours().toString().padStart(2, '0')}:${endDt.getMinutes().toString().padStart(2, '0')}`;
  }

  return {
    id: b.id,
    eventTypeId: b.event_type_id || b.eventTypeId,
    eventTitle: b.event_title || b.eventTitle,
    eventDuration: b.event_duration || b.eventDuration,
    bookerName: b.booker_name || b.bookerName,
    bookerEmail: b.booker_email || b.bookerEmail,
    date: dateStr || '',
    startTime: startStr || '',
    endTime: endStr || '',
    timezone: b.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    status: mappedStatus as 'upcoming' | 'past' | 'cancelled',
    customResponses: b.custom_answers || b.custom_responses || b.customResponses || {},
    createdAt: b.created_at || b.createdAt,
    cancelledAt: b.cancelled_at || b.cancelledAt,
  };
}

// ==========================================
// 1. EVENT TYPES (Live)
// ==========================================
export async function getEventTypes(): Promise<EventType[]> {
  const res = await fetch(`${API_BASE_URL}/api/event-types/`);
  if (!res.ok) throw new Error('Failed to fetch event types');
  return res.json();
}

export async function createEventType(data: Partial<EventType>): Promise<EventType> {
  const res = await fetch(`${API_BASE_URL}/api/event-types/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create event type');
  return res.json();
}

export async function updateEventType(id: string, data: Partial<EventType>): Promise<EventType> {
  const res = await fetch(`${API_BASE_URL}/api/event-types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update event type');
  return res.json();
}

export async function deleteEventType(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/event-types/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete event type');
}

// ==========================================
// 2. AVAILABILITY (Mocked for now)
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
// 3. BOOKINGS (Live)
// ==========================================
export async function getBookings(status?: string): Promise<Booking[]> {
  const url = status ? `${API_BASE_URL}/api/bookings?status=${status}` : `${API_BASE_URL}/api/bookings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  return data.map(mapBookingData);
}

export async function cancelBooking(id: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/cancel`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to cancel booking');
  const data = await res.json();
  return mapBookingData(data);
}

export async function rescheduleBooking(id: string, newDate: string, newStartTime: string, newEndTime: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/reschedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: newDate, startTime: newStartTime, endTime: newEndTime })
  });
  if (!res.ok) throw new Error('Failed to reschedule booking');
  const data = await res.json();
  return mapBookingData(data);
}

// ==========================================
// 4. PUBLIC BOOKING (Live)
// ==========================================
export async function getPublicEventInfo(username: string, slug: string): Promise<PublicEventInfo> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/${username}/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch public event info');
    return await res.json();
  } catch (error) {
    // Fallback block for local dev without backend
    return {
      id: 'mock-id',
      title: 'Mock Event',
      slug,
      duration: 30,
      description: 'Mock description',
      color: '#4f46e5',
      hostName: username.replace('-', ' '),
      customQuestions: []
    };
  }
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
  const responseData = await res.json();
  return mapBookingData(responseData);
}

import { User } from '@/types'; // add this import at top

// Add this function anywhere below your event API calls
export async function getCurrentUser(): Promise<User> {
  if (!API_BASE_URL) {
    await delay(300);
    return {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'john-doe',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
  const res = await fetch(`${API_BASE_URL}/api/users/me`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}