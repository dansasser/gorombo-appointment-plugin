import type { PayloadHandler } from 'payload'

interface TimeSlot {
  available: boolean
  end: string // ISO datetime
  start: string // ISO datetime
}

interface AvailableSlotsResponse {
  date: string
  serviceId: string
  slots: TimeSlot[]
  teamMemberId?: string
}

/**
 * GET /api/appointments/available-slots
 *
 * Query params:
 *   - date: YYYY-MM-DD (required)
 *   - serviceId: string (required)
 *   - teamMemberId: string (optional)
 *
 * Returns available time slots for booking
 */
export const getAvailableSlotsHandler: PayloadHandler = async (req) => {
  try {
    const url = new URL(req.url || '', 'http://localhost')
    const dateParam = url.searchParams.get('date')
    const serviceId = url.searchParams.get('serviceId')
    const teamMemberId = url.searchParams.get('teamMemberId')

    // Validate required params
    if (!dateParam) {
      return Response.json(
        { error: 'Missing required parameter: date (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    if (!serviceId) {
      return Response.json(
        { error: 'Missing required parameter: serviceId' },
        { status: 400 }
      )
    }

    // Parse date
    const requestedDate = new Date(dateParam)
    if (isNaN(requestedDate.getTime())) {
      return Response.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Get service details
    const service = await req.payload.findByID({
      id: serviceId,
      collection: 'services',
    })

    if (!service) {
      return Response.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!service.isActive) {
      return Response.json(
        { error: 'Service is not available for booking' },
        { status: 400 }
      )
    }

    // Get opening times settings
    const openingTimes = await req.payload.findGlobal({
      slug: 'opening-times',
    })

    // Check booking window
    const now = new Date()
    const maxBookingDate = new Date(now)
    maxBookingDate.setDate(maxBookingDate.getDate() + (openingTimes?.maxAdvanceBookingDays || 30))

    const minBookingDate = new Date(now)
    minBookingDate.setHours(minBookingDate.getHours() + (openingTimes?.minAdvanceBookingHours || 1))

    if (requestedDate > maxBookingDate) {
      return Response.json(
        { error: `Cannot book more than ${openingTimes?.maxAdvanceBookingDays || 30} days in advance` },
        { status: 400 }
      )
    }

    if (requestedDate < minBookingDate) {
      return Response.json(
        { error: `Must book at least ${openingTimes?.minAdvanceBookingHours || 1} hours in advance` },
        { status: 400 }
      )
    }

    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[requestedDate.getDay()]

    // Find business hours for this day
    const daySchedule = openingTimes?.schedule?.find(
      (s: any) => s.day === dayOfWeek
    )

    if (!daySchedule || !daySchedule.isOpen) {
      return Response.json({
        date: dateParam,
        message: 'Business is closed on this day',
        serviceId,
        slots: [],
        teamMemberId: teamMemberId || undefined,
      })
    }

    // Calculate slot duration (service duration + buffer)
    const slotDuration = service.duration || 30
    const bufferBefore = service.bufferBefore || 0
    const bufferAfter = service.bufferAfter || 0
    const totalSlotTime = slotDuration + bufferBefore + bufferAfter

    // Parse business hours
    const [openHour, openMin] = (daySchedule.openTime || '09:00').split(':').map(Number)
    const [closeHour, closeMin] = (daySchedule.closeTime || '17:00').split(':').map(Number)

    // Parse break times if set
    let breakStart: null | number = null
    let breakEnd: null | number = null
    if (daySchedule.breakStart && daySchedule.breakEnd) {
      const [breakStartHour, breakStartMin] = daySchedule.breakStart.split(':').map(Number)
      const [breakEndHour, breakEndMin] = daySchedule.breakEnd.split(':').map(Number)
      breakStart = breakStartHour * 60 + breakStartMin
      breakEnd = breakEndHour * 60 + breakEndMin
    }

    // Get team member availability if specified
    let teamMemberSchedule: any = null
    if (teamMemberId) {
      const teamMember = await req.payload.findByID({
        id: teamMemberId,
        collection: 'team-members',
      })

      if (!teamMember) {
        return Response.json(
          { error: 'Team member not found' },
          { status: 404 }
        )
      }

      if (!teamMember.takingAppointments) {
        return Response.json(
          { error: 'Team member is not taking appointments' },
          { status: 400 }
        )
      }

      // Check if team member provides this service
      const teamMemberServices = teamMember.services || []
      const serviceIds = teamMemberServices.map((s: any) =>
        typeof s === 'object' ? s.id : s
      )

      if (serviceIds.length > 0 && !serviceIds.includes(serviceId)) {
        return Response.json(
          { error: 'Team member does not provide this service' },
          { status: 400 }
        )
      }

      // Get team member's schedule for this day
      teamMemberSchedule = teamMember.availability?.find(
        (a: any) => a.day === dayOfWeek
      )

      if (teamMemberSchedule && !teamMemberSchedule.isAvailable) {
        return Response.json({
          date: dateParam,
          message: 'Team member is not available on this day',
          serviceId,
          slots: [],
          teamMemberId,
        })
      }
    }

    // Get existing appointments for this day
    const dayStart = new Date(requestedDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(requestedDate)
    dayEnd.setHours(23, 59, 59, 999)

    const existingAppointments = await req.payload.find({
      collection: 'appointments',
      limit: 100,
      where: {
        and: [
          {
            startDateTime: {
              greater_than_equal: dayStart.toISOString(),
            },
          },
          {
            startDateTime: {
              less_than: dayEnd.toISOString(),
            },
          },
          {
            status: {
              not_in: ['cancelled'],
            },
          },
          ...(teamMemberId
            ? [{ teamMember: { equals: teamMemberId } }]
            : []),
        ],
      },
    })

    // Convert appointments to blocked time ranges (in minutes from midnight)
    const blockedRanges: Array<{ end: number; start: number }> = []
    for (const apt of existingAppointments.docs) {
      const aptStart = new Date(apt.startDateTime)
      const aptEnd = apt.endDateTime ? new Date(apt.endDateTime) : new Date(aptStart.getTime() + 30 * 60000)

      const startMinutes = aptStart.getHours() * 60 + aptStart.getMinutes()
      const endMinutes = aptEnd.getHours() * 60 + aptEnd.getMinutes()

      blockedRanges.push({
        end: endMinutes + bufferAfter,
        start: startMinutes - bufferBefore,
      })
    }

    // Determine effective working hours
    let effectiveOpenMinutes = openHour * 60 + openMin
    let effectiveCloseMinutes = closeHour * 60 + closeMin

    // Apply team member schedule if available
    if (teamMemberSchedule) {
      const [tmOpenHour, tmOpenMin] = (teamMemberSchedule.startTime || '09:00').split(':').map(Number)
      const [tmCloseHour, tmCloseMin] = (teamMemberSchedule.endTime || '17:00').split(':').map(Number)

      effectiveOpenMinutes = Math.max(effectiveOpenMinutes, tmOpenHour * 60 + tmOpenMin)
      effectiveCloseMinutes = Math.min(effectiveCloseMinutes, tmCloseHour * 60 + tmCloseMin)

      // Apply team member break
      if (teamMemberSchedule.breakStart && teamMemberSchedule.breakEnd) {
        const [tmBreakStartHour, tmBreakStartMin] = teamMemberSchedule.breakStart.split(':').map(Number)
        const [tmBreakEndHour, tmBreakEndMin] = teamMemberSchedule.breakEnd.split(':').map(Number)

        // Use the more restrictive break
        if (breakStart === null) {
          breakStart = tmBreakStartHour * 60 + tmBreakStartMin
          breakEnd = tmBreakEndHour * 60 + tmBreakEndMin
        } else {
          breakStart = Math.min(breakStart, tmBreakStartHour * 60 + tmBreakStartMin)
          breakEnd = Math.max(breakEnd!, tmBreakEndHour * 60 + tmBreakEndMin)
        }
      }
    }

    // Generate slots
    const slots: TimeSlot[] = []
    const slotInterval = openingTimes?.slotDuration || 30

    for (let minutes = effectiveOpenMinutes; minutes + totalSlotTime <= effectiveCloseMinutes; minutes += slotInterval) {
      const slotEnd = minutes + totalSlotTime

      // Check if slot is during break
      if (breakStart !== null && breakEnd !== null) {
        if (minutes < breakEnd && slotEnd > breakStart) {
          continue // Skip slots that overlap with break
        }
      }

      // Check if slot conflicts with existing appointments
      let isBlocked = false
      for (const blocked of blockedRanges) {
        if (minutes < blocked.end && slotEnd > blocked.start) {
          isBlocked = true
          break
        }
      }

      // Create slot datetime
      const slotStart = new Date(requestedDate)
      slotStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

      const slotEndDate = new Date(requestedDate)
      slotEndDate.setHours(Math.floor(slotEnd / 60), slotEnd % 60, 0, 0)

      // Check if slot is in the past
      if (slotStart < now) {
        isBlocked = true
      }

      slots.push({
        available: !isBlocked,
        end: slotEndDate.toISOString(),
        start: slotStart.toISOString(),
      })
    }

    const response: AvailableSlotsResponse = {
      date: dateParam,
      serviceId,
      slots,
      teamMemberId: teamMemberId || undefined,
    }

    return Response.json(response)
  } catch (error) {
    req.payload.logger.error({
      error,
      msg: 'Error getting available slots',
    })

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
