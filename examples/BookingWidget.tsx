'use client'

import React, { useState, useEffect } from 'react'

// Types
interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  color?: string
}

interface TeamMember {
  id: string
  name: string
  role?: string
  avatar?: { url: string }
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

// Configuration - adjust to your API URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

// Styles (inline for portability - extract to CSS/Tailwind as needed)
const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '24px',
    color: '#111',
  },
  stepIndicator: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  step: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    backgroundColor: '#e5e7eb',
  },
  stepActive: {
    backgroundColor: '#10b981',
  },
  section: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: '#374151',
  },
  serviceGrid: {
    display: 'grid',
    gap: '12px',
  },
  serviceCard: {
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  serviceCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  serviceName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
  },
  serviceMeta: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  slotButton: {
    padding: '12px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  slotButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: '#fff',
  },
  slotButtonDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  success: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    color: '#fff',
    fontSize: '32px',
  },
}

export function BookingWidget() {
  // State
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingData, setBookingData] = useState<BookingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [bookingComplete, setBookingComplete] = useState(false)
  const [confirmationDetails, setConfirmationDetails] = useState<any>(null)

  // Fetch services on mount
  useEffect(() => {
    fetchServices()
    fetchTeamMembers()
  }, [])

  // Fetch slots when date/service/team member changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots()
    }
  }, [selectedDate, selectedService, selectedTeamMember])

  async function fetchServices() {
    try {
      const res = await fetch(`${API_BASE}/services?where[isActive][equals]=true&limit=50`)
      const data = await res.json()
      setServices(data.docs || [])
    } catch (err) {
      console.error('Failed to fetch services:', err)
      setError('Failed to load services')
    }
  }

  async function fetchTeamMembers() {
    try {
      const res = await fetch(`${API_BASE}/team-members?where[takingAppointments][equals]=true&limit=50`)
      const data = await res.json()
      setTeamMembers(data.docs || [])
    } catch (err) {
      console.error('Failed to fetch team members:', err)
    }
  }

  async function fetchSlots() {
    if (!selectedDate || !selectedService) return

    setLoading(true)
    setSlots([])

    try {
      let url = `${API_BASE}/appointments/available-slots?date=${selectedDate}&serviceId=${selectedService.id}`
      if (selectedTeamMember) {
        url += `&teamMemberId=${selectedTeamMember.id}`
      }

      const res = await fetch(url)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setSlots([])
      } else {
        setSlots(data.slots || [])
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err)
      setError('Failed to load available times')
    } finally {
      setLoading(false)
    }
  }

  async function handleBooking() {
    if (!selectedService || !selectedSlot || !bookingData.email) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Create guest customer
      const guestRes = await fetch(`${API_BASE}/guest-customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          source: 'website',
        }),
      })

      const guestData = await guestRes.json()

      if (guestData.errors) {
        // Guest might already exist, try to find them
        const existingRes = await fetch(
          `${API_BASE}/guest-customers?where[email][equals]=${encodeURIComponent(bookingData.email)}`
        )
        const existingData = await existingRes.json()

        if (existingData.docs?.length > 0) {
          guestData.doc = existingData.docs[0]
        } else {
          throw new Error(guestData.errors?.[0]?.message || 'Failed to create guest')
        }
      }

      // 2. Create appointment
      const appointmentRes = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment',
          service: selectedService.id,
          guest: guestData.doc.id,
          teamMember: selectedTeamMember?.id || undefined,
          startDateTime: selectedSlot.start,
          status: 'scheduled',
        }),
      })

      const appointmentData = await appointmentRes.json()

      if (appointmentData.errors) {
        throw new Error(appointmentData.errors?.[0]?.message || 'Failed to create appointment')
      }

      // Success!
      setConfirmationDetails({
        service: selectedService,
        date: new Date(selectedSlot.start),
        teamMember: selectedTeamMember,
      })
      setBookingComplete(true)
    } catch (err: any) {
      console.error('Booking failed:', err)
      setError(err.message || 'Failed to complete booking')
    } finally {
      setLoading(false)
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  function formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  function getMinDate(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  function getMaxDate(): string {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().split('T')[0]
  }

  // Render success screen
  if (bookingComplete && confirmationDetails) {
    return (
      <div style={styles.container}>
        <div style={styles.success}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={{ ...styles.heading, marginBottom: '8px' }}>Booking Confirmed!</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            A confirmation email has been sent to {bookingData.email}
          </p>
          <div style={{ textAlign: 'left', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Service:</strong> {confirmationDetails.service.name}
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Date:</strong>{' '}
              {confirmationDetails.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Time:</strong>{' '}
              {confirmationDetails.date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            {confirmationDetails.teamMember && (
              <p style={{ margin: 0 }}>
                <strong>With:</strong> {confirmationDetails.teamMember.name}
              </p>
            )}
          </div>
          <button
            style={{ ...styles.button, marginTop: '24px' }}
            onClick={() => {
              setBookingComplete(false)
              setStep(1)
              setSelectedService(null)
              setSelectedSlot(null)
              setSelectedDate('')
              setBookingData({ firstName: '', lastName: '', email: '', phone: '' })
            }}
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Book an Appointment</h1>

      {/* Step Indicator */}
      <div style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ ...styles.step, ...(step >= s ? styles.stepActive : {}) }} />
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div style={styles.section}>
          <label style={styles.label}>Select a Service</label>
          <div style={styles.serviceGrid}>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  ...styles.serviceCard,
                  ...(selectedService?.id === service.id ? styles.serviceCardSelected : {}),
                  borderLeftWidth: '4px',
                  borderLeftColor: service.color || '#3b82f6',
                }}
                onClick={() => setSelectedService(service)}
              >
                <div style={styles.serviceName}>{service.name}</div>
                <div style={styles.serviceMeta}>
                  {formatDuration(service.duration)} • {formatPrice(service.price)}
                </div>
                {service.description && (
                  <div style={{ ...styles.serviceMeta, marginTop: '8px' }}>{service.description}</div>
                )}
              </div>
            ))}
          </div>

          {teamMembers.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <label style={styles.label}>Select Team Member (Optional)</label>
              <select
                style={styles.input}
                value={selectedTeamMember?.id || ''}
                onChange={(e) => {
                  const member = teamMembers.find((m) => m.id === e.target.value)
                  setSelectedTeamMember(member || null)
                }}
              >
                <option value="">Any available</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.role ? `- ${member.role}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            style={{
              ...styles.button,
              marginTop: '24px',
              ...(!selectedService ? styles.buttonDisabled : {}),
            }}
            disabled={!selectedService}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div style={styles.section}>
          <label style={styles.label}>Select Date</label>
          <input
            type="date"
            style={styles.input}
            value={selectedDate}
            min={getMinDate()}
            max={getMaxDate()}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setSelectedSlot(null)
            }}
          />

          {selectedDate && (
            <>
              <label style={{ ...styles.label, marginTop: '16px' }}>Select Time</label>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Loading available times...
                </div>
              ) : slots.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No available times for this date
                </div>
              ) : (
                <div style={styles.slotsGrid}>
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      style={{
                        ...styles.slotButton,
                        ...(selectedSlot?.start === slot.start ? styles.slotButtonSelected : {}),
                        ...(!slot.available ? styles.slotButtonDisabled : {}),
                      }}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ ...styles.buttonGroup, marginTop: '24px' }}>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              style={{
                ...styles.button,
                flex: 2,
                ...(!selectedSlot ? styles.buttonDisabled : {}),
              }}
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Your Details */}
      {step === 3 && (
        <div style={styles.section}>
          <label style={styles.label}>Your Details</label>

          <input
            type="text"
            placeholder="First Name *"
            style={styles.input}
            value={bookingData.firstName}
            onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
          />

          <input
            type="text"
            placeholder="Last Name *"
            style={styles.input}
            value={bookingData.lastName}
            onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email *"
            style={styles.input}
            value={bookingData.email}
            onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
          />

          <input
            type="tel"
            placeholder="Phone (optional)"
            style={styles.input}
            value={bookingData.phone}
            onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
          />

          {/* Booking Summary */}
          <div
            style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '16px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Booking Summary</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <p style={{ margin: '4px 0' }}>
                <strong>Service:</strong> {selectedService?.name}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Date:</strong>{' '}
                {selectedSlot &&
                  new Date(selectedSlot.start).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Time:</strong> {selectedSlot && formatTime(selectedSlot.start)}
              </p>
              {selectedTeamMember && (
                <p style={{ margin: '4px 0' }}>
                  <strong>With:</strong> {selectedTeamMember.name}
                </p>
              )}
              <p style={{ margin: '4px 0' }}>
                <strong>Price:</strong> {selectedService && formatPrice(selectedService.price)}
              </p>
            </div>
          </div>

          <div style={{ ...styles.buttonGroup, marginTop: '24px' }}>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              style={{
                ...styles.button,
                flex: 2,
                ...(loading || !bookingData.firstName || !bookingData.lastName || !bookingData.email
                  ? styles.buttonDisabled
                  : {}),
              }}
              disabled={loading || !bookingData.firstName || !bookingData.lastName || !bookingData.email}
              onClick={handleBooking}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingWidget
