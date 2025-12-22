import type { CollectionConfig } from 'payload'

export const GuestCustomers: CollectionConfig = {
  slug: 'guest-customers',
  access: {
    create: () => true,
    delete: ({ req }) => !!req.user,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
  },
  admin: {
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'createdAt'],
    group: 'Scheduling',
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
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
      name: 'company',
      type: 'text',
      admin: {
        description: 'Company or organization name',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this guest',
      },
    },
    {
      name: 'marketingOptIn',
      type: 'checkbox',
      admin: {
        description: 'Opted in to marketing communications',
        position: 'sidebar',
      },
      defaultValue: false,
    },
    {
      name: 'source',
      type: 'select',
      admin: {
        description: 'How did they find us',
        position: 'sidebar',
      },
      defaultValue: 'website',
      options: [
        { label: 'Website', value: 'website' },
        { label: 'Referral', value: 'referral' },
        { label: 'Walk-in', value: 'walkin' },
        { label: 'Phone', value: 'phone' },
        { label: 'Other', value: 'other' },
      ],
    },
  ],
  labels: {
    plural: 'Guest Customers',
    singular: 'Guest Customer',
  },
  timestamps: true,
}
