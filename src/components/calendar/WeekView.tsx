'use client'

import React, { useMemo } from 'react'

import type { CalendarEvent, WeekViewProps } from './types.js'

import styles from './Calendar.module.css'
import { EventRenderer } from './EventRenderer.js'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = []
  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }

  return days
}

function formatTime(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
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
    // Check if the day is between start and end
    if (day < eventStart || day > eventEnd) {
      return null
    }
  }

  const dayStart = new Date(day)
  dayStart.setHours(startHour, 0, 0, 0)
  const dayEnd = new Date(day)
  dayEnd.setHours(endHour, 0, 0, 0)

  // Clamp event times to the visible day range
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

export const WeekView: React.FC<WeekViewProps> = ({
  endHour = 18,
  events,
  onEventClick,
  onSlotClick,
  startHour = 8,
  weekStart,
}) => {
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  )

  const currentTimePosition = useMemo(() => {
    const today = weekDays.find(isToday)
    if (!today) {return null}
    return getCurrentTimePosition(startHour, endHour)
  }, [weekDays, startHour, endHour])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()

    weekDays.forEach((day) => {
      const dayKey = day.toISOString().split('T')[0]
      const dayEvents = events.filter((event: CalendarEvent) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end)
        return (
          isSameDay(eventStart, day) ||
          isSameDay(eventEnd, day) ||
          (eventStart < day && eventEnd > day)
        )
      })
      map.set(dayKey, dayEvents)
    })

    return map
  }, [events, weekDays])

  const handleSlotClick = (day: Date, hour: number) => {
    if (onSlotClick) {
      const start = new Date(day)
      start.setHours(hour, 0, 0, 0)
      const end = new Date(start)
      end.setHours(hour + 1, 0, 0, 0)
      onSlotClick(start, end)
    }
  }

  return (
    <div className={styles.weekGrid}>
      {/* Header row */}
      <div className={styles.timeGutter} />
      {weekDays.map((day) => (
        <div
          className={`${styles.dayHeader} ${isToday(day) ? styles.isToday : ''}`}
          key={day.toISOString()}
        >
          <div className={styles.dayName}>{DAY_NAMES[day.getDay()]}</div>
          <div className={styles.dayNumber}>{day.getDate()}</div>
        </div>
      ))}

      {/* Time slots */}
      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className={styles.timeSlot}>{formatTime(hour)}</div>
          {weekDays.map((day) => {
            const dayKey = day.toISOString().split('T')[0]
            const dayEvents = eventsByDay.get(dayKey) || []

            return (
              <div
                className={styles.dayColumn}
                key={`${dayKey}-${hour}`}
                style={{ gridRow: 'span 1' }}
              >
                <div
                  className={styles.hourSlot}
                  onClick={() => handleSlotClick(day, hour)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSlotClick(day, hour)}
                  role="button"
                  tabIndex={0}
                />
                <div
                  className={styles.halfHourLine}
                  style={{ top: '50%' }}
                />
                {hour === hours[0] && (
                  <>
                    {dayEvents.map((event) => {
                      const position = getEventPosition(
                        event,
                        day,
                        startHour,
                        endHour
                      )
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
                    {isToday(day) && currentTimePosition !== null && (
                      <div
                        className={styles.currentTimeIndicator}
                        style={{ top: `${currentTimePosition}%` }}
                      />
                    )}
                  </>
                )}
              </div>
            )
          })}
        </React.Fragment>
      ))}
    </div>
  )
}
