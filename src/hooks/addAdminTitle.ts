import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Hook to generate a descriptive admin title for appointments
 * Format: "Service Name - Customer Name (Date)"
 * Runs before save on the Appointments collection
 */
export const addAdminTitle: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  const parts: string[] = []

  // Handle blockouts
  if (data.type === 'blockout') {
    parts.push('Blockout')
    if (data.blockoutReason) {
      parts.push(`(${data.blockoutReason})`)
    }
    if (data.startDateTime) {
      const date = new Date(data.startDateTime)
      parts.push(`- ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`)
    }
    data.title = parts.join(' ')
    return data
  }

  // Get service name
  if (data.service) {
    try {
      const serviceId = typeof data.service === 'object' ? data.service.id : data.service
      const service = await req.payload.findByID({
        id: serviceId,
        collection: 'services',
      })
      if (service?.name) {
        parts.push(service.name)
      }
    } catch {
      parts.push('Appointment')
    }
  } else {
    parts.push('Appointment')
  }

  // Get customer name
  if (data.customer) {
    try {
      const customerId = typeof data.customer === 'object' ? data.customer.id : data.customer
      const customer = await req.payload.findByID({
        id: customerId,
        collection: 'users',
      })
      if (customer) {
        // Try to get name from various fields
        const name = customer.name || customer.firstName || customer.email?.split('@')[0] || 'Customer'
        parts.push(`- ${name}`)
      }
    } catch {
      // Customer lookup failed, skip
    }
  } else if (data.guest) {
    try {
      const guestId = typeof data.guest === 'object' ? data.guest.id : data.guest
      const guest = await req.payload.findByID({
        id: guestId,
        collection: 'guest-customers',
      })
      if (guest) {
        const name = `${guest.firstName} ${guest.lastName}`.trim() || 'Guest'
        parts.push(`- ${name}`)
      }
    } catch {
      parts.push('- Guest')
    }
  }

  // Add date
  if (data.startDateTime) {
    const date = new Date(data.startDateTime)
    const formattedDate = date.toLocaleDateString('en-US', {
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
    })
    parts.push(`(${formattedDate})`)
  }

  data.title = parts.join(' ')
  return data
}
