'use client'

import React, { useCallback, useMemo, useState } from 'react'

import type { CalendarEvent, CalendarProps, CalendarViewMode } from './types.js'

import styles from './Calendar.module.css'
import { DayView } from './DayView.js'
import { EventPopover } from './EventPopover.js'
import { WeekView } from './WeekView.js'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const CalendarContainer: React.FC<CalendarProps> = ({
  endHour = 18,
  events,
  onDateChange,
  onEventClick,
  onEventDrop,
  onSlotClick,
  onViewModeChange,
  selectedDate: controlledSelectedDate,
  slotDuration = 30,
  startHour = 8,
  teamMembers,
  viewMode: controlledViewMode,
}) => {
  // Local state for uncontrolled mode
  const [localViewMode, setLocalViewMode] = useState<CalendarViewMode>('week')
  const [localSelectedDate, setLocalSelectedDate] = useState(new Date())
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null)
  const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0 })

  // Use controlled or local state
  const viewMode = controlledViewMode ?? localViewMode
  const selectedDate = controlledSelectedDate ?? localSelectedDate

  const handleViewModeChange = useCallback(
    (mode: CalendarViewMode) => {
      if (onViewModeChange) {
        onViewModeChange(mode)
      } else {
        setLocalViewMode(mode)
      }
    },
    [onViewModeChange]
  )

  const handleDateChange = useCallback(
    (date: Date) => {
      if (onDateChange) {
        onDateChange(date)
      } else {
        setLocalSelectedDate(date)
      }
    },
    [onDateChange]
  )

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate])

  const handlePrev = useCallback(() => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    handleDateChange(newDate)
  }, [selectedDate, viewMode, handleDateChange])

  const handleNext = useCallback(() => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    handleDateChange(newDate)
  }, [selectedDate, viewMode, handleDateChange])

  const handleToday = useCallback(() => {
    handleDateChange(new Date())
  }, [handleDateChange])

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      // Calculate popover position near the event
      const rect = document
        .querySelector(`[data-event-id="${event.id}"]`)
        ?.getBoundingClientRect()

      if (rect) {
        setPopoverPosition({
          left: rect.right + 10,
          top: rect.top + window.scrollY,
        })
      } else {
        // Fallback to center of screen
        setPopoverPosition({
          left: window.innerWidth / 2 - 150,
          top: window.innerHeight / 2 - 150,
        })
      }

      setPopoverEvent(event)

      if (onEventClick) {
        onEventClick(event)
      }
    },
    [onEventClick]
  )

  const handleClosePopover = useCallback(() => {
    setPopoverEvent(null)
  }, [])

  const handleEditEvent = useCallback(
    (event: CalendarEvent) => {
      handleClosePopover()
      // Navigate to edit page
      window.location.href = `/admin/collections/appointments/${event.id}`
    },
    [handleClosePopover]
  )

  const dateTitle = useMemo(() => {
    if (viewMode === 'week') {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`
      } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} - ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`
      } else {
        return `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}, ${weekStart.getFullYear()} - ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
      }
    } else {
      return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
    }
  }, [viewMode, weekStart, selectedDate])

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarNav}>
          <button
            aria-label="Previous"
            className={styles.navButton}
            onClick={handlePrev}
          >
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            aria-label="Next"
            className={styles.navButton}
            onClick={handleNext}
          >
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <span className={styles.dateTitle}>{dateTitle}</span>
        </div>

        <button className={styles.todayButton} onClick={handleToday}>
          Today
        </button>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'week' ? styles.active : ''}`}
            onClick={() => handleViewModeChange('week')}
          >
            Week
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'day' ? styles.active : ''}`}
            onClick={() => handleViewModeChange('day')}
          >
            Day
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <WeekView
          endHour={endHour}
          events={events}
          onEventClick={handleEventClick}
          onSlotClick={onSlotClick}
          slotDuration={slotDuration}
          startHour={startHour}
          teamMembers={teamMembers}
          weekStart={weekStart}
        />
      ) : (
        <DayView
          date={selectedDate}
          endHour={endHour}
          events={events}
          onEventClick={handleEventClick}
          onSlotClick={onSlotClick}
          slotDuration={slotDuration}
          startHour={startHour}
          teamMembers={teamMembers}
        />
      )}

      {popoverEvent && (
        <EventPopover
          event={popoverEvent}
          onClose={handleClosePopover}
          onEdit={handleEditEvent}
          position={popoverPosition}
        />
      )}
    </div>
  )
}
