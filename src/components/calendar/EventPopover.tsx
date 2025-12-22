'use client'

import React, { useEffect, useRef } from 'react'

import type { EventPopoverProps } from './types.js'

import styles from './Calendar.module.css'

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case 'cancelled':
      return 'Cancelled'
    case 'completed':
      return 'Completed'
    case 'confirmed':
      return 'Confirmed'
    case 'no-show':
      return 'No Show'
    case 'scheduled':
      return 'Scheduled'
    default:
      return 'Unknown'
  }
}

function getStatusClass(status?: string): string {
  switch (status) {
    case 'cancelled':
      return styles.cancelled
    case 'completed':
      return styles.completed
    case 'confirmed':
      return styles.confirmed
    case 'scheduled':
      return styles.scheduled
    default:
      return ''
  }
}

export const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  onClose,
  onDelete,
  onEdit,
  position,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position if popover would overflow viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedLeft = position.left
      let adjustedTop = position.top

      if (rect.right > viewportWidth) {
        adjustedLeft = viewportWidth - rect.width - 20
      }

      if (rect.bottom > viewportHeight) {
        adjustedTop = viewportHeight - rect.height - 20
      }

      if (adjustedLeft !== position.left || adjustedTop !== position.top) {
        popoverRef.current.style.left = `${Math.max(10, adjustedLeft)}px`
        popoverRef.current.style.top = `${Math.max(10, adjustedTop)}px`
      }
    }
  }, [position])

  const customerName = event.customerName || event.guestName || 'Unknown'
  const isBlockout = event.type === 'blockout'

  return (
    <>
      <div
        aria-label="Close popover"
        className={styles.overlay}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
      />
      <div
        className={styles.popover}
        ref={popoverRef}
        style={{ left: position.left, top: position.top }}
      >
        <div className={styles.popoverHeader}>
          <div>
            <h3 className={styles.popoverTitle}>
              {isBlockout
                ? event.blockoutReason || 'Blocked Time'
                : event.serviceName || event.title}
            </h3>
            {!isBlockout && event.status && (
              <span
                className={`${styles.popoverStatus} ${getStatusClass(event.status)}`}
              >
                {getStatusLabel(event.status)}
              </span>
            )}
          </div>
          <button className={styles.popoverClose} onClick={onClose}>
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.popoverBody}>
          <div className={styles.popoverRow}>
            <span className={styles.popoverLabel}>Date</span>
            <span className={styles.popoverValue}>
              {formatEventDate(new Date(event.start))}
            </span>
          </div>

          <div className={styles.popoverRow}>
            <span className={styles.popoverLabel}>Time</span>
            <span className={styles.popoverValue}>
              {formatEventTime(new Date(event.start))} -{' '}
              {formatEventTime(new Date(event.end))}
            </span>
          </div>

          {!isBlockout && (
            <>
              <div className={styles.popoverRow}>
                <span className={styles.popoverLabel}>Customer</span>
                <span className={styles.popoverValue}>{customerName}</span>
              </div>

              {event.teamMemberName && (
                <div className={styles.popoverRow}>
                  <span className={styles.popoverLabel}>With</span>
                  <span className={styles.popoverValue}>
                    {event.teamMemberName}
                  </span>
                </div>
              )}
            </>
          )}

          {event.notes && (
            <div className={styles.popoverRow}>
              <span className={styles.popoverLabel}>Notes</span>
              <span className={styles.popoverValue}>{event.notes}</span>
            </div>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className={styles.popoverActions}>
            {onEdit && (
              <button
                className={`${styles.popoverButton} ${styles.primary}`}
                onClick={() => onEdit(event)}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                className={`${styles.popoverButton} ${styles.secondary}`}
                onClick={() => onDelete(event)}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
