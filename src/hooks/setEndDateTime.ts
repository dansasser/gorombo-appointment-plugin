import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Hook to automatically calculate endDateTime based on service duration
 * Runs before save on the Appointments collection
 */
export const setEndDateTime: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  // Only process for appointments (not blockouts)
  if (data.type !== 'appointment') {
    // For blockouts, if no endDateTime is set, default to 1 hour
    if (!data.endDateTime && data.startDateTime) {
      const start = new Date(data.startDateTime)
      const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hour default
      data.endDateTime = end.toISOString()
    }
    return data
  }

  // Get service to determine duration
  if (!data.service || !data.startDateTime) {
    return data
  }

  try {
    // Resolve service ID (could be an object if populated or just an ID)
    const serviceId = typeof data.service === 'object' ? data.service.id : data.service

    const service = await req.payload.findByID({
      id: serviceId,
      collection: 'services',
    })

    if (service && service.duration) {
      const start = new Date(data.startDateTime)
      const durationMs = service.duration * 60 * 1000 // Convert minutes to milliseconds
      const end = new Date(start.getTime() + durationMs)

      data.endDateTime = end.toISOString()
    }
  } catch (error) {
    // Log error but don't fail the operation
    req.payload.logger.error({
      error,
      msg: 'Failed to calculate endDateTime',
    })
  }

  return data
}
