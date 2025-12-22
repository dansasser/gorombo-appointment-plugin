import type { CollectionConfig } from 'payload'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  access: {
    create: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role', 'takingAppointments'],
    group: 'Scheduling',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Full name of the team member',
      },
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Contact phone number',
      },
    },
    {
      name: 'role',
      type: 'text',
      admin: {
        description: 'Job title or role (e.g., "Senior Consultant")',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short bio shown to customers',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      admin: {
        description: 'Profile photo',
      },
      relationTo: 'media',
    },
    {
      name: 'takingAppointments',
      type: 'checkbox',
      admin: {
        description: 'Whether this team member accepts appointments',
        position: 'sidebar',
      },
      defaultValue: true,
    },
    {
      name: 'services',
      type: 'relationship',
      admin: {
        description: 'Services this team member can provide',
      },
      hasMany: true,
      relationTo: 'services',
    },
    {
      name: 'availability',
      type: 'array',
      admin: {
        description: 'Weekly availability schedule',
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
          name: 'isAvailable',
          type: 'checkbox',
          admin: {
            description: 'Available on this day',
          },
          defaultValue: true,
        },
        {
          name: 'startTime',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isAvailable === true,
            description: 'Start time (HH:MM format)',
          },
          defaultValue: '09:00',
        },
        {
          name: 'endTime',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isAvailable === true,
            description: 'End time (HH:MM format)',
          },
          defaultValue: '17:00',
        },
        {
          name: 'breakStart',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isAvailable === true,
            description: 'Break start time (optional)',
          },
        },
        {
          name: 'breakEnd',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isAvailable === true,
            description: 'Break end time (optional)',
          },
        },
      ],
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Color for calendar display (hex code)',
        position: 'sidebar',
      },
      defaultValue: '#10b981',
    },
  ],
  labels: {
    plural: 'Team Members',
    singular: 'Team Member',
  },
  timestamps: true,
}
