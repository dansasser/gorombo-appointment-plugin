import type { CollectionConfig, Config } from 'payload'

import { Appointments } from './collections/Appointments.js'
import { GuestCustomers } from './collections/GuestCustomers.js'
import { Services } from './collections/Services.js'
import { createGetAvailableSlotsHandler } from './endpoints/getAvailableSlots.js'
import { OpeningTimes } from './globals/OpeningTimes.js'
import { addAdminTitle } from './hooks/addAdminTitle.js'
import { createSendCustomerEmail } from './hooks/sendCustomerEmail.js'
import { setEndDateTime } from './hooks/setEndDateTime.js'
import { validateCustomerOrGuest } from './hooks/validateCustomerOrGuest.js'

export type GoromboAppointmentsPluginConfig = {
  /**
   * Disable the plugin without removing the collections from the database
   */
  disabled?: boolean
  /**
   * External team collection slug for team member relationships
   * The plugin does NOT create its own team collection - you must provide one
   * If not provided, defaults to 'team'
   */
  teamCollectionSlug?: string
  /**
   * Require a Users collection with this slug for customer relationships
   * If not provided, defaults to 'users'
   */
  usersCollectionSlug?: string
}

export const goromboAppointmentsPlugin =
  (pluginOptions: GoromboAppointmentsPluginConfig = {}) =>
  (config: Config): Config => {
    const {
      disabled = false,
      teamCollectionSlug = 'team',
      usersCollectionSlug = 'users',
    } = pluginOptions

    // Initialize arrays if not present
    if (!config.collections) {
      config.collections = []
    }
    if (!config.globals) {
      config.globals = []
    }
    if (!config.endpoints) {
      config.endpoints = []
    }
    if (!config.admin) {
      config.admin = {}
    }
    if (!config.admin.components) {
      config.admin.components = {}
    }

    // Create Appointments collection with hooks attached
    const AppointmentsWithHooks: CollectionConfig = {
      ...Appointments,
      hooks: {
        afterChange: [createSendCustomerEmail(teamCollectionSlug)],
        beforeChange: [setEndDateTime, addAdminTitle],
        beforeValidate: [validateCustomerOrGuest],
      },
    }

    // Update customer field to use correct users collection if not default
    if (usersCollectionSlug !== 'users') {
      const customerFieldIndex = AppointmentsWithHooks.fields.findIndex(
        (f) => 'name' in f && f.name === 'customer'
      )
      if (customerFieldIndex !== -1) {
        const customerField = AppointmentsWithHooks.fields[customerFieldIndex]
        if ('relationTo' in customerField) {
          (customerField as { relationTo: string }).relationTo = usersCollectionSlug
        }
      }
    }

    // Update teamMember field to use configured team collection
    const teamMemberFieldIndex = AppointmentsWithHooks.fields.findIndex(
      (f) => 'name' in f && f.name === 'teamMember'
    )
    if (teamMemberFieldIndex !== -1) {
      const teamMemberField = AppointmentsWithHooks.fields[teamMemberFieldIndex]
      if ('relationTo' in teamMemberField) {
        (teamMemberField as { relationTo: string }).relationTo = teamCollectionSlug
      }
    }

    // Add collections (note: team collection is NOT created by plugin - must be provided externally)
    config.collections.push(AppointmentsWithHooks)
    config.collections.push(Services)
    config.collections.push(GuestCustomers)

    // Add globals
    config.globals.push(OpeningTimes)

    /**
     * If the plugin is disabled, we still want to keep added collections/fields
     * so the database schema is consistent which is important for migrations.
     */
    if (disabled) {
      return config
    }

    // Add endpoints
    config.endpoints.push({
      handler: createGetAvailableSlotsHandler(teamCollectionSlug),
      method: 'get',
      path: '/appointments/available-slots',
    })

    // Add admin components
    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    config.admin.components.beforeDashboard.push(
      `gorombo-payload-appointments/client#BeforeDashboardClient`,
    )

    // Add initialization logic
    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }

      // Seed default opening times if not set
      try {
        const existingOpeningTimes = await payload.findGlobal({
          slug: 'opening-times',
        })

        // If schedule is empty, initialize with defaults
        if (!existingOpeningTimes.schedule || existingOpeningTimes.schedule.length === 0) {
          const defaultSchedule = [
            { closeTime: '17:00', day: 'monday', isOpen: true, openTime: '09:00' },
            { closeTime: '17:00', day: 'tuesday', isOpen: true, openTime: '09:00' },
            { closeTime: '17:00', day: 'wednesday', isOpen: true, openTime: '09:00' },
            { closeTime: '17:00', day: 'thursday', isOpen: true, openTime: '09:00' },
            { closeTime: '17:00', day: 'friday', isOpen: true, openTime: '09:00' },
            { closeTime: '17:00', day: 'saturday', isOpen: false, openTime: '09:00' },
            { closeTime: '17:00', day: 'sunday', isOpen: false, openTime: '09:00' },
          ]

          await payload.updateGlobal({
            slug: 'opening-times',
            data: {
              allowGuestBooking: true,
              maxAdvanceBookingDays: 30,
              minAdvanceBookingHours: 1,
              schedule: defaultSchedule,
              sendConfirmationEmails: true,
              slotDuration: 30,
              timezone: 'America/New_York',
            },
          })

          payload.logger.info({
            msg: 'Gorombo Appointments Plugin: Initialized default opening times',
          })
        }
      } catch (error) {
        payload.logger.error({
          error,
          msg: 'Gorombo Appointments Plugin: Failed to initialize opening times',
        })
      }
    }

    return config
  }

// Re-export collections for type generation
export { Appointments } from './collections/Appointments.js'
export { GuestCustomers } from './collections/GuestCustomers.js'
export { Services } from './collections/Services.js'
export { OpeningTimes } from './globals/OpeningTimes.js'
