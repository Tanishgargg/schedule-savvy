export interface EventType {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: number; // minutes
  isHidden: boolean; // Replaced isActive
  scheduleId: string | null; // Replaced color and buffers
  customQuestions: CustomQuestion[];
  createdAt: string;
}

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'phone' | 'checkbox';
  required: boolean;
  options?: string[]; // for select type
}

// --- NEW SCHEDULE TYPES ---
export interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface Schedule {
  id: string;
  name: string;
  timezone: string;
  availabilities: AvailabilitySlot[];
}

export interface Booking {
  id: string;
  eventTypeId: string;
  eventTitle: string;
  eventDuration: number;
  bookerName: string;
  bookerEmail: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  timezone: string;
  status: 'upcoming' | 'past' | 'cancelled';
  customResponses?: Record<string, string>;
  createdAt: string;
  cancelledAt?: string;
}

export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

export interface BookingFormData {
  name: string;
  email: string;
  customResponses?: Record<string, string>;
}

export interface PublicEventInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  slug: string;
  hostName: string;
  hostAvatar?: string;
  customQuestions: CustomQuestion[];
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  timezone: string;
  avatarUrl?: string;
}