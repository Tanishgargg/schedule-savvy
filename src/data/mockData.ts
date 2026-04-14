import { EventType, AvailabilitySchedule, Booking } from '@/types';

export const mockEventTypes: EventType[] = [
  {
    id: '1',
    title: 'Quick Chat',
    slug: 'quick-chat',
    description: 'A brief 15-minute introductory call to discuss your needs.',
    duration: 15,
    color: '#4f46e5',
    isActive: true,
    bufferTimeBefore: 0,
    bufferTimeAfter: 5,
    customQuestions: [],
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Consultation',
    slug: 'consultation',
    description: 'A 30-minute consultation to dive deeper into your project requirements.',
    duration: 30,
    color: '#0891b2',
    isActive: true,
    bufferTimeBefore: 5,
    bufferTimeAfter: 10,
    customQuestions: [
      { id: 'q1', label: 'What would you like to discuss?', type: 'textarea', required: true },
    ],
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '3',
    title: 'Strategy Session',
    slug: 'strategy-session',
    description: 'A comprehensive 60-minute strategy session for in-depth planning.',
    duration: 60,
    color: '#dc2626',
    isActive: false,
    bufferTimeBefore: 10,
    bufferTimeAfter: 15,
    customQuestions: [
      { id: 'q2', label: 'What are your main goals?', type: 'textarea', required: true },
      { id: 'q3', label: 'Company size', type: 'select', required: false, options: ['1-10', '11-50', '51-200', '200+'] },
    ],
    createdAt: '2024-02-01T10:00:00Z',
  },
];

export const mockAvailability: AvailabilitySchedule[] = [
  {
    id: 'default',
    name: 'Working Hours',
    timezone: 'America/New_York',
    isDefault: true,
    rules: [
      { day: 0, enabled: false, startTime: '09:00', endTime: '17:00' },
      { day: 1, enabled: true, startTime: '09:00', endTime: '17:00' },
      { day: 2, enabled: true, startTime: '09:00', endTime: '17:00' },
      { day: 3, enabled: true, startTime: '09:00', endTime: '17:00' },
      { day: 4, enabled: true, startTime: '09:00', endTime: '17:00' },
      { day: 5, enabled: true, startTime: '09:00', endTime: '17:00' },
      { day: 6, enabled: false, startTime: '09:00', endTime: '17:00' },
    ],
    dateOverrides: [],
  },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const lastWeek = new Date(today);
lastWeek.setDate(today.getDate() - 7);
const lastMonth = new Date(today);
lastMonth.setDate(today.getDate() - 30);

const fmt = (d: Date) => d.toISOString().split('T')[0];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    eventTypeId: '1',
    eventTitle: 'Quick Chat',
    eventDuration: 15,
    bookerName: 'Alice Johnson',
    bookerEmail: 'alice@example.com',
    date: fmt(tomorrow),
    startTime: '10:00',
    endTime: '10:15',
    timezone: 'America/New_York',
    status: 'upcoming',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'b2',
    eventTypeId: '2',
    eventTitle: 'Consultation',
    eventDuration: 30,
    bookerName: 'Bob Smith',
    bookerEmail: 'bob@example.com',
    date: fmt(nextWeek),
    startTime: '14:00',
    endTime: '14:30',
    timezone: 'America/New_York',
    status: 'upcoming',
    customResponses: { 'What would you like to discuss?': 'Product roadmap planning' },
    createdAt: '2024-03-02T10:00:00Z',
  },
  {
    id: 'b3',
    eventTypeId: '1',
    eventTitle: 'Quick Chat',
    eventDuration: 15,
    bookerName: 'Carol Davis',
    bookerEmail: 'carol@example.com',
    date: fmt(lastWeek),
    startTime: '11:00',
    endTime: '11:15',
    timezone: 'America/New_York',
    status: 'past',
    createdAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'b4',
    eventTypeId: '3',
    eventTitle: 'Strategy Session',
    eventDuration: 60,
    bookerName: 'David Wilson',
    bookerEmail: 'david@example.com',
    date: fmt(lastMonth),
    startTime: '09:00',
    endTime: '10:00',
    timezone: 'America/New_York',
    status: 'past',
    customResponses: { 'What are your main goals?': 'Scale the team', 'Company size': '51-200' },
    createdAt: '2024-02-10T10:00:00Z',
  },
  {
    id: 'b5',
    eventTypeId: '2',
    eventTitle: 'Consultation',
    eventDuration: 30,
    bookerName: 'Eve Martinez',
    bookerEmail: 'eve@example.com',
    date: fmt(tomorrow),
    startTime: '15:00',
    endTime: '15:30',
    timezone: 'America/New_York',
    status: 'cancelled',
    cancelledAt: '2024-03-05T10:00:00Z',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'b6',
    eventTypeId: '1',
    eventTitle: 'Quick Chat',
    eventDuration: 15,
    bookerName: 'Frank Lee',
    bookerEmail: 'frank@example.com',
    date: fmt(nextWeek),
    startTime: '16:00',
    endTime: '16:15',
    timezone: 'America/New_York',
    status: 'upcoming',
    createdAt: '2024-03-06T10:00:00Z',
  },
];
