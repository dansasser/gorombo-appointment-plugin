# Gorombo Appointments Plugin

A full-featured appointments, scheduling, and booking plugin for [PayloadCMS 3.x](https://payloadcms.com).

[![CI](https://github.com/dansasser/gorombo-appointment-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/dansasser/gorombo-appointment-plugin/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/gorombo-payload-appointments.svg)](https://www.npmjs.com/package/gorombo-payload-appointments)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Admin Calendar Dashboard** - Week/Day view calendar integrated into Payload admin
- **Services Management** - Define bookable services with duration, pricing, and colors
- **Team Members** - Assign appointments to team members with availability settings
- **Guest Customers** - Support for non-registered customers booking appointments
- **Automatic Scheduling** - Auto-calculates end times based on service duration
- **Business Hours** - Configure opening times, breaks, and scheduling rules
- **Email Notifications** - Automatic confirmation and update emails
- **REST API** - Full headless API for custom frontend booking flows
- **Available Slots Endpoint** - Query available booking times

## Installation

```bash
npm install gorombo-payload-appointments
# or
pnpm add gorombo-payload-appointments
# or
yarn add gorombo-payload-appointments
```

## Quick Start

Add the plugin to your Payload config:

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { goromboAppointmentsPlugin } from 'gorombo-payload-appointments'

export default buildConfig({
  // ... your config
  plugins: [
    goromboAppointmentsPlugin({
      // Optional configuration
    }),
  ],
})
```

Regenerate types and import map:

```bash
npm run generate:types
npm run generate:importmap
```

## Configuration Options

```typescript
goromboAppointmentsPlugin({
  // Slug for your media collection (default: 'media')
  mediaCollectionSlug: 'media',

  // Slug for your users collection (default: 'users')
  usersCollectionSlug: 'users',
})
```

## What Gets Added

### Collections

| Collection | Slug | Description |
|------------|------|-------------|
| Services | `services` | Bookable services with duration, price, and color |
| Team Members | `team-members` | Staff who can be assigned to appointments |
| Guest Customers | `guest-customers` | Non-registered booking customers |
| Appointments | `appointments` | The bookings themselves |

### Globals

| Global | Slug | Description |
|--------|------|-------------|
| Opening Times | `opening-times` | Business hours and scheduling settings |

## API Reference

PayloadCMS automatically generates REST API endpoints for all collections. Here's the complete API reference:

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| GET | `/api/services/:id` | Get a single service |
| POST | `/api/services` | Create a service |
| PATCH | `/api/services/:id` | Update a service |
| DELETE | `/api/services/:id` | Delete a service |

**Query examples:**
```bash
# Get all active services
GET /api/services?where[isActive][equals]=true

# Get services sorted by price
GET /api/services?sort=price
```

### Team Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/team-members` | List all team members |
| GET | `/api/team-members/:id` | Get a single team member |
| POST | `/api/team-members` | Create a team member |
| PATCH | `/api/team-members/:id` | Update a team member |
| DELETE | `/api/team-members/:id` | Delete a team member |

**Query examples:**
```bash
# Get team members taking appointments
GET /api/team-members?where[takingAppointments][equals]=true
```

### Guest Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/guest-customers` | List all guest customers |
| GET | `/api/guest-customers/:id` | Get a single guest customer |
| POST | `/api/guest-customers` | Create a guest customer |
| PATCH | `/api/guest-customers/:id` | Update a guest customer |
| DELETE | `/api/guest-customers/:id` | Delete a guest customer |

**Query examples:**
```bash
# Find guest by email
GET /api/guest-customers?where[email][equals]=john@example.com
```

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List all appointments |
| GET | `/api/appointments/:id` | Get a single appointment |
| POST | `/api/appointments` | Create an appointment |
| PATCH | `/api/appointments/:id` | Update an appointment |
| DELETE | `/api/appointments/:id` | Delete an appointment |

**Query examples:**
```bash
# Get appointments for a specific date range
GET /api/appointments?where[startDateTime][greater_than_equal]=2024-01-01&where[startDateTime][less_than]=2024-01-31

# Get appointments by status
GET /api/appointments?where[status][equals]=scheduled

# Get appointments with related data
GET /api/appointments?depth=1
```

### Available Slots (Custom Endpoint)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments/available-slots` | Query available booking times |

**Query parameters:**
- `date` (required) - ISO date string (YYYY-MM-DD)
- `serviceId` (required) - ID of the service
- `teamMemberId` (optional) - Filter by specific team member

**Example:**
```bash
GET /api/appointments/available-slots?date=2024-01-15&serviceId=abc123
```

**Response:**
```json
{
  "date": "2024-01-15",
  "serviceId": "abc123",
  "slots": [
    { "start": "2024-01-15T09:00:00Z", "end": "2024-01-15T09:30:00Z", "available": true },
    { "start": "2024-01-15T09:30:00Z", "end": "2024-01-15T10:00:00Z", "available": true }
  ]
}
```

### Opening Times (Global)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/globals/opening-times` | Get business hours settings |
| POST | `/api/globals/opening-times` | Update business hours settings |

## Booking Flow Example

### 1. Get Available Services

```bash
GET /api/services?where[isActive][equals]=true
```

### 2. Get Available Time Slots

```bash
GET /api/appointments/available-slots?date=2024-01-15&serviceId=SERVICE_ID
```

### 3. Create Guest Customer (if not registered)

```bash
POST /api/guest-customers
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "source": "website"
}
```

### 4. Create Appointment

```bash
POST /api/appointments
Content-Type: application/json

{
  "type": "appointment",
  "service": "SERVICE_ID",
  "guest": "GUEST_ID",
  "startDateTime": "2024-01-15T09:00:00Z",
  "status": "scheduled"
}
```

## Frontend Integration

See the [examples/BookingWidget.tsx](./examples/BookingWidget.tsx) for a complete React booking component with:
- 3-step booking flow (service -> date/time -> details)
- Available slots display
- Guest customer creation
- Booking confirmation

## Admin Calendar

The plugin automatically adds a calendar dashboard to your Payload admin panel showing:
- Week and day views
- Color-coded events by service
- Click to view appointment details
- Quick navigation between dates

## Development

```bash
# Install dependencies
npm install

# Run dev environment
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## Requirements

- PayloadCMS 3.37.0 or higher
- Node.js 18.20.2+ or 20.9.0+
- React 19.x

## Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md) and submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Author

Created by [Daniel T Sasser II](https://github.com/Gorombo)

## Links

- [PayloadCMS](https://payloadcms.com)
- [Plugin Documentation](https://payloadcms.com/docs/plugins/overview)
- [Report Issues](https://github.com/dansasser/gorombo-appointment-plugin/issues)
