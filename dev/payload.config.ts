import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import { goromboAppointmentsPlugin } from 'gorombo-payload-appointments'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URL = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'posts',
        fields: [],
      },
      {
        slug: 'media',
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
      {
        // Mock team collection for testing - plugin references this externally
        slug: 'team',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'role', type: 'text' },
          { name: 'takingAppointments', type: 'checkbox', defaultValue: true },
          { name: 'services', type: 'relationship', relationTo: 'services', hasMany: true },
          {
            name: 'availability',
            type: 'array',
            fields: [
              { name: 'day', type: 'select', options: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
              { name: 'isAvailable', type: 'checkbox', defaultValue: true },
              { name: 'startTime', type: 'text', defaultValue: '09:00' },
              { name: 'endTime', type: 'text', defaultValue: '17:00' },
              { name: 'breakStart', type: 'text' },
              { name: 'breakEnd', type: 'text' },
            ],
          },
        ],
        admin: {
          useAsTitle: 'name',
        },
      },
    ],
    db: mongooseAdapter({
      ensureIndexes: true,
      url: process.env.DATABASE_URL || '',
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      goromboAppointmentsPlugin({
        teamCollectionSlug: 'team',
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
