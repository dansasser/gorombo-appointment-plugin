import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { beforeAll, describe, expect, test } from 'vitest'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('Gorombo Appointments Plugin', () => {
  describe('Collections', () => {
    test('services collection exists', () => {
      expect(payload.collections['services']).toBeDefined()
    })

    test('team-members collection exists', () => {
      expect(payload.collections['team-members']).toBeDefined()
    })

    test('guest-customers collection exists', () => {
      expect(payload.collections['guest-customers']).toBeDefined()
    })

    test('appointments collection exists', () => {
      expect(payload.collections['appointments']).toBeDefined()
    })
  })

  describe('Globals', () => {
    test('opening-times global exists', () => {
      expect(payload.globals.config.find((g) => g.slug === 'opening-times')).toBeDefined()
    })
  })

  describe('CRUD Operations', () => {
    test('can create a service', async () => {
      const service = await payload.create({
        collection: 'services',
        data: {
          name: 'Test Service',
          slug: 'test-service',
          duration: 30,
          price: 5000,
          isActive: true,
        },
      })

      expect(service.id).toBeDefined()
      expect(service.name).toBe('Test Service')
      expect(service.duration).toBe(30)
      expect(service.price).toBe(5000)
    })

    test('can create a team member', async () => {
      const teamMember = await payload.create({
        collection: 'team-members',
        data: {
          name: 'Test Team Member',
          email: 'team@test.com',
          takingAppointments: true,
        },
      })

      expect(teamMember.id).toBeDefined()
      expect(teamMember.name).toBe('Test Team Member')
    })

    test('can create a guest customer', async () => {
      const guest = await payload.create({
        collection: 'guest-customers',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
        },
      })

      expect(guest.id).toBeDefined()
      expect(guest.firstName).toBe('John')
      expect(guest.lastName).toBe('Doe')
    })

    test('can create an appointment', async () => {
      // First create required relations
      const service = await payload.create({
        collection: 'services',
        data: {
          name: 'Appointment Test Service',
          slug: 'appointment-test-service',
          duration: 60,
          price: 10000,
          isActive: true,
        },
      })

      const guest = await payload.create({
        collection: 'guest-customers',
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
        },
      })

      const startDateTime = new Date()
      startDateTime.setHours(startDateTime.getHours() + 24) // Tomorrow

      const appointment = await payload.create({
        collection: 'appointments',
        data: {
          type: 'appointment',
          service: service.id,
          guest: guest.id,
          startDateTime: startDateTime.toISOString(),
          status: 'scheduled',
        },
      })

      expect(appointment.id).toBeDefined()
      expect(appointment.type).toBe('appointment')
      expect(appointment.status).toBe('scheduled')
      // End time should be auto-calculated by hook
      expect(appointment.endDateTime).toBeDefined()
    })

    test('can create a blockout', async () => {
      const startDateTime = new Date()
      startDateTime.setHours(startDateTime.getHours() + 48)

      const blockout = await payload.create({
        collection: 'appointments',
        data: {
          type: 'blockout',
          startDateTime: startDateTime.toISOString(),
          blockoutReason: 'Staff meeting',
        },
      })

      expect(blockout.id).toBeDefined()
      expect(blockout.type).toBe('blockout')
      expect(blockout.blockoutReason).toBe('Staff meeting')
    })
  })

  describe('Validation', () => {
    test('appointment requires customer or guest', async () => {
      const service = await payload.create({
        collection: 'services',
        data: {
          name: 'Validation Test Service',
          slug: 'validation-test-service',
          duration: 30,
          price: 3000,
          isActive: true,
        },
      })

      const startDateTime = new Date()
      startDateTime.setHours(startDateTime.getHours() + 72)

      await expect(
        payload.create({
          collection: 'appointments',
          data: {
            type: 'appointment',
            service: service.id,
            startDateTime: startDateTime.toISOString(),
            status: 'scheduled',
            // No customer or guest provided
          },
        }),
      ).rejects.toThrow()
    })
  })
})
