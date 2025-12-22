import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  access: {
    create: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  admin: {
    defaultColumns: ['name', 'duration', 'price', 'isActive'],
    group: 'Scheduling',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Name of the service (e.g., "30-Minute Consultation")',
      },
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'URL-friendly identifier',
      },
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Description shown to customers',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Duration in minutes',
        step: 5,
      },
      defaultValue: 30,
      max: 480,
      min: 5,
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        description: 'Price in cents (e.g., 5000 = $50.00)',
      },
      defaultValue: 0,
      min: 0,
      required: true,
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Color for calendar display (hex code)',
      },
      defaultValue: '#3b82f6',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      admin: {
        description: 'Whether this service is available for booking',
        position: 'sidebar',
      },
      defaultValue: true,
    },
    {
      name: 'requiresDeposit',
      type: 'checkbox',
      admin: {
        description: 'Whether a deposit is required to book',
        position: 'sidebar',
      },
      defaultValue: false,
    },
    {
      name: 'depositAmount',
      type: 'number',
      admin: {
        condition: (data) => data?.requiresDeposit === true,
        description: 'Deposit amount in cents',
      },
      min: 0,
    },
    {
      name: 'bufferBefore',
      type: 'number',
      admin: {
        description: 'Buffer time before appointment (minutes)',
        step: 5,
      },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'bufferAfter',
      type: 'number',
      admin: {
        description: 'Buffer time after appointment (minutes)',
        step: 5,
      },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'maxAdvanceBooking',
      type: 'number',
      admin: {
        description: 'How many days in advance can this be booked',
      },
      defaultValue: 30,
      min: 1,
    },
    {
      name: 'minAdvanceBooking',
      type: 'number',
      admin: {
        description: 'Minimum hours notice required to book',
      },
      defaultValue: 0,
      min: 0,
    },
  ],
  labels: {
    plural: 'Services',
    singular: 'Service',
  },
  timestamps: true,
}
