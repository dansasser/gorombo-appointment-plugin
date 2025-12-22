'use client'

import { useConfig } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import type { CalendarEvent } from './calendar/index.js'

import { CalendarContainer } from './calendar/index.js'

interface AppointmentDoc {
  blockoutReason?: string
  customer?: {
    email?: string
    firstName?: string
    id: string
    name?: string
  } | string
  endDateTime?: string
  guest?: {
    email?: string
    firstName: string
    id: string
    lastName: string
  } | string
  id: string
  notes?: string
  service?: {
    color?: string
    duration?: number
    id: string
    name: string
  } | string
  startDateTime: string
  status?: string
  teamMember?: {
    color?: string
    id: string
    name: string
  } | string
  title?: string
  type: 'appointment' | 'blockout'
}

function transformAppointmentToEvent(doc: AppointmentDoc): CalendarEvent {
  const service = typeof doc.service === 'object' ? doc.service : undefined
  const customer = typeof doc.customer === 'object' ? doc.customer : undefined
  const guest = typeof doc.guest === 'object' ? doc.guest : undefined
  const teamMember = typeof doc.teamMember === 'object' ? doc.teamMember : undefined

  // Calculate end time if not provided
  let endDateTime = doc.endDateTime
  if (!endDateTime && service?.duration) {
    const start = new Date(doc.startDateTime)
    start.setMinutes(start.getMinutes() + service.duration)
    endDateTime = start.toISOString()
  } else if (!endDateTime) {
    const start = new Date(doc.startDateTime)
    start.setMinutes(start.getMinutes() + 30) // Default 30 min
    endDateTime = start.toISOString()
  }

  return {
    id: doc.id,
    type: doc.type,
    blockoutReason: doc.blockoutReason,
    customerId: customer?.id,
    customerName: customer?.name || customer?.firstName,
    end: new Date(endDateTime),
    guestId: guest?.id,
    guestName: guest ? `${guest.firstName} ${guest.lastName}`.trim() : undefined,
    notes: doc.notes,
    serviceColor: service?.color || '#3b82f6',
    serviceId: service?.id,
    serviceName: service?.name,
    start: new Date(doc.startDateTime),
    status: doc.status as CalendarEvent['status'],
    teamMemberColor: teamMember?.color,
    teamMemberId: teamMember?.id,
    teamMemberName: teamMember?.name,
    title: doc.title || service?.name || 'Appointment',
  }
}

export const BeforeDashboardClient: React.FC = () => {
  const configContext = useConfig()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<null | string>(null)

  // Handle case where config context is not yet available
  const config = configContext?.config
  const apiPath = config?.routes?.api || '/api'
  const adminPath = config?.routes?.admin || '/admin'

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get appointments for the next 30 days and past 7 days
      const now = new Date()
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 30)

      // Build API URL
      const queryParams = new URLSearchParams({
        depth: '1',
        limit: '200',
        'where[startDateTime][greater_than_equal]': startDate.toISOString(),
        'where[startDateTime][less_than_equal]': endDate.toISOString(),
      })

      const response = await fetch(`${apiPath}/appointments?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const result = await response.json()
      const appointmentEvents = result.docs.map(transformAppointmentToEvent)
      setEvents(appointmentEvents)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }, [apiPath])

  useEffect(() => {
    void fetchAppointments()
  }, [fetchAppointments])

  const handleSlotClick = useCallback(
    (start: Date, _end: Date) => {
      // Navigate to create new appointment with pre-filled start time
      const params = new URLSearchParams({
        startDateTime: start.toISOString(),
      })
      window.location.href = `${adminPath}/collections/appointments/create?${params.toString()}`
    },
    [adminPath]
  )

  const handleEventClick = useCallback((_event: CalendarEvent) => {
    // Event click is handled by the calendar popover
    // but we could add custom handling here if needed
  }, [])

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
          Appointments Calendar
        </h2>
        <div
          style={{
            background: 'var(--theme-error-50)',
            borderRadius: '8px',
            color: 'var(--theme-error-700)',
            padding: '20px',
          }}
        >
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
        Appointments Calendar
      </h2>
      {isLoading ? (
        <div
          style={{
            alignItems: 'center',
            color: 'var(--theme-elevation-500)',
            display: 'flex',
            height: '400px',
            justifyContent: 'center',
          }}
        >
          Loading appointments...
        </div>
      ) : (
        <CalendarContainer
          endHour={20}
          events={events}
          onEventClick={handleEventClick}
          onSlotClick={handleSlotClick}
          startHour={8}
        />
      )}
    </div>
  )
}
