import type { GlobalConfig } from 'payload'

export const OpeningTimes: GlobalConfig = {
  slug: 'opening-times',
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  admin: {
    description: 'Configure business hours and scheduling defaults',
    group: 'Scheduling',
  },
  fields: [
    {
      name: 'timezone',
      type: 'text',
      admin: {
        description: 'Business timezone (IANA format, e.g., "America/New_York")',
      },
      defaultValue: 'America/New_York',
      required: true,
    },
    {
      name: 'schedule',
      type: 'array',
      admin: {
        description: 'Weekly schedule - one entry per day',
      },
      fields: [
        {
          name: 'day',
          type: 'select',
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' },
          ],
          required: true,
        },
        {
          name: 'isOpen',
          type: 'checkbox',
          admin: {
            description: 'Business is open on this day',
          },
          defaultValue: true,
        },
        {
          name: 'openTime',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isOpen === true,
            description: 'Opening time (HH:MM format)',
          },
          defaultValue: '09:00',
        },
        {
          name: 'closeTime',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isOpen === true,
            description: 'Closing time (HH:MM format)',
          },
          defaultValue: '17:00',
        },
        {
          name: 'breakStart',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isOpen === true,
            description: 'Break start time (optional, HH:MM format)',
          },
        },
        {
          name: 'breakEnd',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isOpen === true,
            description: 'Break end time (optional, HH:MM format)',
          },
        },
      ],
      maxRows: 7,
      minRows: 7,
      required: true,
    },
    {
      name: 'slotDuration',
      type: 'number',
      admin: {
        description: 'Default time slot duration in minutes',
        step: 5,
      },
      defaultValue: 30,
      max: 120,
      min: 5,
      required: true,
    },
    {
      name: 'bufferBetweenAppointments',
      type: 'number',
      admin: {
        description: 'Default buffer time between appointments (minutes)',
        step: 5,
      },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'maxAdvanceBookingDays',
      type: 'number',
      admin: {
        description: 'Maximum days in advance a customer can book',
      },
      defaultValue: 30,
      min: 1,
    },
    {
      name: 'minAdvanceBookingHours',
      type: 'number',
      admin: {
        description: 'Minimum hours notice required for booking',
      },
      defaultValue: 1,
      min: 0,
    },
    {
      name: 'allowGuestBooking',
      type: 'checkbox',
      admin: {
        description: 'Allow non-registered users to book appointments',
      },
      defaultValue: true,
    },
    {
      name: 'requireApproval',
      type: 'checkbox',
      admin: {
        description: 'Appointments require admin approval before confirmation',
      },
      defaultValue: false,
    },
    {
      name: 'sendConfirmationEmails',
      type: 'checkbox',
      admin: {
        description: 'Automatically send confirmation emails',
      },
      defaultValue: true,
    },
    {
      name: 'sendReminderEmails',
      type: 'checkbox',
      admin: {
        description: 'Automatically send reminder emails',
      },
      defaultValue: true,
    },
    {
      name: 'reminderHoursBefore',
      type: 'number',
      admin: {
        condition: (data) => data?.sendReminderEmails === true,
        description: 'Hours before appointment to send reminder',
      },
      defaultValue: 24,
      min: 1,
    },
  ],
  label: 'Opening Times',
}
