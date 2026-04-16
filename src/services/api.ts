import { EventType, Schedule, Booking, TimeSlot, PublicEventInfo, BookingFormData, User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper to attach the active user ID to all requests
function getHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const activeUserId = localStorage.getItem('cal_active_user_id');
  if (activeUserId) {
    headers['x-user-id'] = activeUserId;
  }
  return headers;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ==========================================
// MAPPERS: Backend DB -> Frontend Models
// ==========================================
function mapEventType(e: any): EventType {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description || '',
    duration: e.duration,
    isHidden: e.is_hidden,          // Map snake_case to camelCase
    scheduleId: e.schedule_id,      // Map snake_case to camelCase
    customQuestions: e.custom_questions || [],
    createdAt: e.created_at || '',
  };
}

function mapBookingData(b: any): Booking {
  let mappedStatus = b.status?.toLowerCase() || 'upcoming';
  if (mappedStatus === 'accepted' || mappedStatus === 'pending') mappedStatus = 'upcoming';

  let dateStr = b.date;
  let startStr = b.start_time || b.startTime;
  let endStr = b.end_time || b.endTime;

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
// 1. EVENT TYPES
// ==========================================
export async function getEventTypes(): Promise<EventType[]> {
  const res = await fetch(`${API_BASE_URL}/api/event-types/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch event types');
  const data = await res.json();
  return data.map(mapEventType);
}

export async function createEventType(data: Partial<EventType>): Promise<EventType> {
  const payload = { ...data, is_hidden: data.isHidden, schedule_id: data.scheduleId };
  const res = await fetch(`${API_BASE_URL}/api/event-types/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create event type');
  const responseData = await res.json();
  return mapEventType(responseData);
}

export async function updateEventType(id: string, data: Partial<EventType>): Promise<EventType> {
  const payload: any = { ...data };
  if (data.isHidden !== undefined) payload.is_hidden = data.isHidden;
  if (data.scheduleId !== undefined) payload.schedule_id = data.scheduleId;

  const res = await fetch(`${API_BASE_URL}/api/event-types/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update event type');
  const responseData = await res.json();
  return mapEventType(responseData);
}

export async function deleteEventType(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/event-types/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete event type');
}

// ==========================================
// 2. SCHEDULES (Live DB)
// ==========================================
export async function getSchedules(): Promise<Schedule[]> {
  const res = await fetch(`${API_BASE_URL}/api/schedules/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
}

export async function createSchedule(data: Partial<Schedule>): Promise<Schedule> {
  const res = await fetch(`${API_BASE_URL}/api/schedules/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create schedule');
  return res.json();
}

export async function updateSchedule(id: string, data: Partial<Schedule>): Promise<Schedule> {
  const res = await fetch(`${API_BASE_URL}/api/schedules/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update schedule');
  return res.json();
}

// ==========================================
// 3. BOOKINGS
// ==========================================
export async function getBookings(status?: string): Promise<Booking[]> {
  const url = status ? `${API_BASE_URL}/api/bookings?status=${status}` : `${API_BASE_URL}/api/bookings`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  return data.map(mapBookingData);
}

export async function cancelBooking(id: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/cancel`, {
    method: 'PUT',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to cancel booking');
  const data = await res.json();
  return mapBookingData(data);
}

export async function rescheduleBooking(id: string, newDate: string, newStartTime: string, newEndTime: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/reschedule`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ date: newDate, startTime: newStartTime, endTime: newEndTime })
  });
  if (!res.ok) throw new Error('Failed to reschedule booking');
  const data = await res.json();
  return mapBookingData(data);
}

// ==========================================
// 4. PUBLIC BOOKING
// ==========================================
export async function getPublicEventInfo(username: string, slug: string): Promise<PublicEventInfo> {
  const res = await fetch(`${API_BASE_URL}/api/public/${username}/${slug}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch public event info');
  return res.json();
}

export async function getAvailableSlots(username: string, slug: string, date: string, timezone: string): Promise<TimeSlot[]> {
  const res = await fetch(`${API_BASE_URL}/api/public/${username}/${slug}/slots?date=${date}&timezone=${timezone}`, { headers: getHeaders() });
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
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create booking');
  const responseData = await res.json();
  return mapBookingData(responseData);
}

export async function getCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function getPublicProfile(username: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/public/users/${username}`, { headers: getHeaders() });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'User not found');
  }
  return res.json();
}

// ==========================================
// 5. USERS
// ==========================================
export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/users/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/users/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}