'use client'

import React from 'react'

import type { EventRendererProps } from './types.js'

import styles from './Calendar.module.css'

function formatEventTime(start: Date, end: Date): string {
  const formatTime = (d: Date) => {
    const hours = d.getHours()
    const minutes = d.getMinutes()
    const period = hours >= 12 ? 'pm' : 'am'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return minutes === 0 ? `${displayHours}${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`
  }

  return `${formatTime(start)} - ${formatTime(end)}`
}

function getStatusClass(status?: string): string {
  switch (status) {
    case 'cancelled':
      return styles.cancelled
    case 'completed':
      return styles.completed
    case 'confirmed':
      return styles.confirmed
    case 'no-show':
      return styles.noShow
    case 'scheduled':
      return styles.scheduled
    default:
      return ''
  }
}

export const EventRenderer: React.FC<EventRendererProps> = ({
  event,
  onClick,
  style,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick(event)
    }
  }

  const backgroundColor =
    event.type === 'blockout'
      ? undefined
      : event.serviceColor || event.teamMemberColor || '#3b82f6'

  const borderColor = backgroundColor

  const eventStyle: React.CSSProperties = {
    ...style,
    backgroundColor:
      event.type === 'blockout' ? undefined : `${backgroundColor}20`,
    borderLeftColor: borderColor,
    color: event.type === 'blockout' ? undefined : backgroundColor,
  }

  const eventClasses = [
    styles.event,
    event.type === 'appointment' ? styles.appointment : styles.blockout,
    getStatusClass(event.status),
  ]
    .filter(Boolean)
    .join(' ')

  const customerName =
    event.customerName || event.guestName || 'Unknown Customer'

  return (
    <div
      className={eventClasses}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e as unknown as React.MouseEvent)}
      role="button"
      style={eventStyle}
      tabIndex={0}
    >
      <div className={styles.eventTitle}>
        {event.type === 'blockout'
          ? event.blockoutReason || 'Blocked'
          : event.serviceName || event.title}
      </div>
      <div className={styles.eventTime}>
        {formatEventTime(new Date(event.start), new Date(event.end))}
      </div>
      {event.type === 'appointment' && (
        <div className={styles.eventCustomer}>{customerName}</div>
      )}
    </div>
  )
}
