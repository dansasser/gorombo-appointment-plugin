'use client'

import React, { useMemo } from 'react'

import type { CalendarEvent, DayViewProps } from './types.js'

import styles from './Calendar.module.css'
import { EventRenderer } from './EventRenderer.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatTime(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function getEventPosition(
  event: CalendarEvent,
  day: Date,
  startHour: number,
  endHour: number
): { height: number; top: number } | null {
  const eventStart = new Date(event.start)
  const eventEnd = new Date(event.end)

  if (!isSameDay(eventStart, day) && !isSameDay(eventEnd, day)) {
    if (day < eventStart || day > eventEnd) {
      return null
    }
  }

  const dayStart = new Date(day)
  dayStart.setHours(startHour, 0, 0, 0)
  const dayEnd = new Date(day)
  dayEnd.setHours(endHour, 0, 0, 0)

  const visibleStart = eventStart < dayStart ? dayStart : eventStart
  const visibleEnd = eventEnd > dayEnd ? dayEnd : eventEnd

  if (visibleStart >= visibleEnd) {
    return null
  }

  const totalMinutes = (endHour - startHour) * 60
  const startMinutes =
    (visibleStart.getHours() - startHour) * 60 + visibleStart.getMinutes()
  const endMinutes =
    (visibleEnd.getHours() - startHour) * 60 + visibleEnd.getMinutes()

  const top = (startMinutes / totalMinutes) * 100
  const height = ((endMinutes - startMinutes) / totalMinutes) * 100

  return { height: Math.max(height, 2), top }
}

function getCurrentTimePosition(startHour: number, endHour: number): null | number {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()

  if (currentHour < startHour || currentHour >= endHour) {
    return null
  }

  const totalMinutes = (endHour - startHour) * 60
  const minutesSinceStart = (currentHour - startHour) * 60 + currentMinutes

  return (minutesSinceStart / totalMinutes) * 100
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  endHour = 18,
  events,
  onEventClick,
  onSlotClick,
  startHour = 8,
}) => {
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  )

  const currentTimePosition = useMemo(() => {
    if (!isToday(date)) {return null}
    return getCurrentTimePosition(startHour, endHour)
  }, [date, startHour, endHour])

  const dayEvents = useMemo((): CalendarEvent[] => {
    return events.filter((event: CalendarEvent) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      return (
        isSameDay(eventStart, date) ||
        isSameDay(eventEnd, date) ||
        (eventStart < date && eventEnd > date)
      )
    })
  }, [events, date])

  const handleSlotClick = (hour: number) => {
    if (onSlotClick) {
      const start = new Date(date)
      start.setHours(hour, 0, 0, 0)
      const end = new Date(start)
      end.setHours(hour + 1, 0, 0, 0)
      onSlotClick(start, end)
    }
  }

  const formattedDate = `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`

  return (
    <div className={styles.dayGrid}>
      {/* Header row */}
      <div className={styles.timeGutter} />
      <div className={`${styles.dayHeader} ${isToday(date) ? styles.isToday : ''}`}>
        <div className={styles.dayName}>{formattedDate}</div>
        {isToday(date) && <div className={styles.dayNumber}>Today</div>}
      </div>

      {/* Time slots */}
      {hours.map((hour, index) => (
        <React.Fragment key={hour}>
          <div className={styles.timeSlot}>{formatTime(hour)}</div>
          <div className={styles.dayColumn} style={{ gridRow: 'span 1' }}>
            <div
              className={styles.hourSlot}
              onClick={() => handleSlotClick(hour)}
              onKeyDown={(e) => e.key === 'Enter' && handleSlotClick(hour)}
              role="button"
              tabIndex={0}
            />
            <div className={styles.halfHourLine} style={{ top: '50%' }} />
            {index === 0 && (
              <>
                {dayEvents.map((event: CalendarEvent) => {
                  const position = getEventPosition(event, date, startHour, endHour)
                  if (!position) {return null}

                  return (
                    <EventRenderer
                      event={event}
                      key={event.id}
                      onClick={onEventClick}
                      style={{
                        height: `${position.height}%`,
                        top: `${position.top}%`,
                      }}
                    />
                  )
                })}
                {currentTimePosition !== null && (
                  <div
                    className={styles.currentTimeIndicator}
                    style={{ top: `${currentTimePosition}%` }}
                  />
                )}
              </>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
