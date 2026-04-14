

# Cal.com Clone — Full Implementation Plan

## Overview
Build a scheduling application replicating Cal.com's UI and core functionality. The frontend uses React + Tailwind (already set up), and all API calls target a FastAPI backend (mocked with sample data for now).

## Pages & Routes

### 1. Admin Dashboard Shell
- Sidebar navigation matching Cal.com's style: **Event Types**, **Bookings**, **Availability** sections
- Clean white/light gray design with dark sidebar, Cal.com-style typography
- Default user assumed logged in (no auth)

### 2. Event Types Page (`/event-types`)
- List all event types as cards (title, duration badge, slug/link, toggle active/inactive)
- "New Event Type" button → modal/dialog to create
- Edit/Delete actions per event type
- Copy public booking link button
- **API:** `GET /api/event-types`, `POST /api/event-types`, `PUT /api/event-types/{id}`, `DELETE /api/event-types/{id}`

### 3. Availability Page (`/availability`)
- Weekly schedule grid (Mon–Sun) with toggleable days
- Time range pickers per day (start/end time)
- Timezone selector dropdown
- Support for multiple schedules (bonus)
- Date overrides section (block specific dates or set custom hours)
- Buffer time setting between meetings
- **API:** `GET /api/availability`, `PUT /api/availability`

### 4. Bookings Dashboard (`/bookings`)
- Tabs: **Upcoming** / **Past** / **Cancelled**
- Booking cards showing: event title, booker name/email, date/time, status
- Cancel booking action with confirmation dialog
- Reschedule option (bonus)
- **API:** `GET /api/bookings?status=upcoming|past|cancelled`, `PUT /api/bookings/{id}/cancel`

### 5. Public Booking Page (`/{username}/{event-slug}`)
- Left panel: event info (title, description, duration, host name/avatar)
- Right panel: calendar month view for date selection
- After date selection → show available time slots
- After slot selection → booking form (name, email, optional custom questions)
- Confirmation page with event details + "Add to calendar" option
- Prevents double-booking (validated via API)
- Timezone selector for the booker
- **API:** `GET /api/public/{username}/{slug}`, `GET /api/public/{username}/{slug}/slots?date=YYYY-MM-DD&timezone=X`, `POST /api/public/book`

## API Integration Layer
- Create an API service module with all endpoint functions
- Use React Query for data fetching/caching
- Mock data seeded locally for development (sample event types + bookings)
- All API URLs configurable via environment variable

## UI/Design Details
- Match Cal.com's clean, minimal white design
- Sidebar: dark/neutral with icons (Lucide icons)
- Cards with subtle borders, rounded corners
- Duration badges (15m, 30m, 45m, 1h) as pill selectors
- Calendar component matching Cal.com's month view style
- Time slot buttons in a scrollable list
- Fully responsive (mobile, tablet, desktop)

## Bonus Features Included
- Multiple availability schedules
- Date overrides
- Rescheduling flow
- Buffer time between meetings
- Custom booking questions per event type
- Responsive design throughout

## Sample/Seed Data
- 3 event types: "Quick Chat" (15min), "Consultation" (30min), "Strategy Session" (60min)
- 5-6 sample bookings across upcoming/past/cancelled states

