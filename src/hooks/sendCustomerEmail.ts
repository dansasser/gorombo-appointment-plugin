import type { CollectionAfterChangeHook } from 'payload'

interface EmailContext {
  appointmentDate: string
  appointmentTime: string
  customerEmail: string
  customerName: string
  serviceName: string
  status: string
  teamMemberName?: string
}

/**
 * Hook to send confirmation/update emails to customers after appointment changes
 * Runs after save on the Appointments collection
 */
export const sendCustomerEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  // Skip for blockouts
  if (doc.type === 'blockout') {
    return doc
  }

  // Check if email sending is enabled
  try {
    const settings = await req.payload.findGlobal({
      slug: 'opening-times',
    })

    if (!settings?.sendConfirmationEmails) {
      return doc
    }
  } catch {
    // Settings not found, skip email
    return doc
  }

  // Determine if we should send email
  const isNewAppointment = operation === 'create'
  const statusChanged = previousDoc && previousDoc.status !== doc.status

  if (!isNewAppointment && !statusChanged) {
    return doc
  }

  // Build email context
  try {
    const context = await buildEmailContext(doc, req)

    if (!context) {
      return doc
    }

    // Determine email type
    let subject: string
    let template: string

    if (isNewAppointment) {
      subject = `Appointment Confirmed: ${context.serviceName}`
      template = buildCreatedEmail(context)
    } else if (doc.status === 'cancelled') {
      subject = `Appointment Cancelled: ${context.serviceName}`
      template = buildCancelledEmail(context)
    } else if (doc.status === 'confirmed') {
      subject = `Appointment Confirmed: ${context.serviceName}`
      template = buildConfirmedEmail(context)
    } else {
      subject = `Appointment Update: ${context.serviceName}`
      template = buildUpdatedEmail(context)
    }

    // Send email using Payload's email adapter
    await req.payload.sendEmail({
      html: template,
      subject,
      to: context.customerEmail,
    })

    req.payload.logger.info({
      msg: 'Appointment email sent',
      operation: isNewAppointment ? 'create' : 'update',
      status: doc.status,
      to: context.customerEmail,
    })
  } catch (error) {
    // Log error but don't fail the operation
    req.payload.logger.error({
      error,
      msg: 'Failed to send appointment email',
    })
  }

  return doc
}

async function buildEmailContext(doc: any, req: any): Promise<EmailContext | null> {
  let customerName = ''
  let customerEmail = ''

  // Get customer info
  if (doc.customer) {
    try {
      const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
      const customer = await req.payload.findByID({
        id: customerId,
        collection: 'users',
      })
      if (customer) {
        customerName = customer.name || customer.firstName || 'Customer'
        customerEmail = customer.email
      }
    } catch {
      return null
    }
  } else if (doc.guest) {
    try {
      const guestId = typeof doc.guest === 'object' ? doc.guest.id : doc.guest
      const guest = await req.payload.findByID({
        id: guestId,
        collection: 'guest-customers',
      })
      if (guest) {
        customerName = `${guest.firstName} ${guest.lastName}`.trim()
        customerEmail = guest.email
      }
    } catch {
      return null
    }
  }

  if (!customerEmail) {
    return null
  }

  // Get service info
  let serviceName = 'Appointment'
  if (doc.service) {
    try {
      const serviceId = typeof doc.service === 'object' ? doc.service.id : doc.service
      const service = await req.payload.findByID({
        id: serviceId,
        collection: 'services',
      })
      if (service?.name) {
        serviceName = service.name
      }
    } catch {
      // Use default
    }
  }

  // Get team member info
  let teamMemberName: string | undefined
  if (doc.teamMember) {
    try {
      const teamMemberId = typeof doc.teamMember === 'object' ? doc.teamMember.id : doc.teamMember
      const teamMember = await req.payload.findByID({
        id: teamMemberId,
        collection: 'team-members',
      })
      if (teamMember?.name) {
        teamMemberName = teamMember.name
      }
    } catch {
      // Skip team member
    }
  }

  // Format date/time
  const startDate = new Date(doc.startDateTime)
  const appointmentDate = startDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  })
  const appointmentTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return {
    appointmentDate,
    appointmentTime,
    customerEmail,
    customerName,
    serviceName,
    status: doc.status,
    teamMemberName,
  }
}

function buildCreatedEmail(ctx: EmailContext): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { font-weight: 600; width: 120px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Appointment Confirmed</h1>
    </div>
    <div class="content">
      <p>Hello ${ctx.customerName},</p>
      <p>Your appointment has been successfully scheduled!</p>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span>${ctx.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${ctx.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${ctx.appointmentTime}</span>
        </div>
        ${ctx.teamMemberName ? `
        <div class="detail-row">
          <span class="detail-label">With:</span>
          <span>${ctx.teamMemberName}</span>
        </div>
        ` : ''}
      </div>
      <p>If you need to make any changes, please contact us.</p>
    </div>
  </div>
</body>
</html>
`
}

function buildConfirmedEmail(ctx: EmailContext): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { font-weight: 600; width: 120px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Appointment Confirmed</h1>
    </div>
    <div class="content">
      <p>Hello ${ctx.customerName},</p>
      <p>Great news! Your appointment has been confirmed.</p>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span>${ctx.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${ctx.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${ctx.appointmentTime}</span>
        </div>
      </div>
      <p>We look forward to seeing you!</p>
    </div>
  </div>
</body>
</html>
`
}

function buildCancelledEmail(ctx: EmailContext): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { font-weight: 600; width: 120px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Appointment Cancelled</h1>
    </div>
    <div class="content">
      <p>Hello ${ctx.customerName},</p>
      <p>Your appointment has been cancelled.</p>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span>${ctx.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${ctx.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${ctx.appointmentTime}</span>
        </div>
      </div>
      <p>If you would like to reschedule, please book a new appointment.</p>
    </div>
  </div>
</body>
</html>
`
}

function buildUpdatedEmail(ctx: EmailContext): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { font-weight: 600; width: 120px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Appointment Updated</h1>
    </div>
    <div class="content">
      <p>Hello ${ctx.customerName},</p>
      <p>Your appointment details have been updated.</p>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span>${ctx.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${ctx.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${ctx.appointmentTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span>${ctx.status}</span>
        </div>
      </div>
      <p>If you have any questions, please contact us.</p>
    </div>
  </div>
</body>
</html>
`
}
