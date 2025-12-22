import type { CollectionConfig } from 'payload'

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  access: {
    create: () => true,
    delete: ({ req }) => !!req.user,
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  admin: {
    defaultColumns: ['title', 'startDateTime', 'service', 'status'],
    group: 'Scheduling',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Auto-generated display title',
        hidden: true,
      },
    },
    {
      name: 'type',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'appointment',
      options: [
        { label: 'Appointment', value: 'appointment' },
        { label: 'Blockout', value: 'blockout' },
      ],
      required: true,
    },
    {
      name: 'service',
      type: 'relationship',
      admin: {
        condition: (data) => data?.type === 'appointment',
      },
      relationTo: 'services',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        condition: (data) => data?.type === 'appointment',
        description: 'Registered user booking the appointment',
      },
      relationTo: 'users',
    },
    {
      name: 'guest',
      type: 'relationship',
      admin: {
        condition: (data) => data?.type === 'appointment',
        description: 'Guest customer (non-registered user)',
      },
      relationTo: 'guest-customers',
    },
    {
      name: 'teamMember',
      type: 'relationship',
      admin: {
        description: 'Staff member assigned to this appointment',
        position: 'sidebar',
      },
      relationTo: 'team-members',
    },
    {
      name: 'startDateTime',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'MMM d, yyyy h:mm a',
          pickerAppearance: 'dayAndTime',
        },
      },
      required: true,
    },
    {
      name: 'endDateTime',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'MMM d, yyyy h:mm a',
          pickerAppearance: 'dayAndTime',
        },
        description: 'Auto-calculated from service duration',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'scheduled',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'No-show', value: 'no-show' },
      ],
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this appointment',
      },
    },
    {
      name: 'blockoutReason',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'blockout',
        description: 'Reason for the blockout (e.g., lunch, meeting)',
      },
    },
  ],
  labels: {
    plural: 'Appointments',
    singular: 'Appointment',
  },
  timestamps: true,
}
