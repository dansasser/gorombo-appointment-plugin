export interface CalendarEvent {
  blockoutReason?: string
  customerId?: string
  customerName?: string
  end: Date
  guestId?: string
  guestName?: string
  id: string
  notes?: string
  serviceColor?: string
  serviceId?: string
  serviceName?: string
  start: Date
  status?: 'cancelled' | 'completed' | 'confirmed' | 'no-show' | 'scheduled'
  teamMemberColor?: string
  teamMemberId?: string
  teamMemberName?: string
  title: string
  type: 'appointment' | 'blockout'
}

export interface TeamMember {
  color: string
  id: string
  name: string
  takingAppointments: boolean
}

export interface Service {
  color: string
  duration: number
  id: string
  isActive: boolean
  name: string
}

export type CalendarViewMode = 'day' | 'week'

export interface CalendarProps {
  endHour?: number
  events: CalendarEvent[]
  onDateChange?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onEventDrop?: (event: CalendarEvent, newStart: Date) => void
  onSlotClick?: (start: Date, end: Date, teamMemberId?: string) => void
  onViewModeChange?: (mode: CalendarViewMode) => void
  selectedDate?: Date
  slotDuration?: number // in minutes
  startHour?: number
  teamMembers?: TeamMember[]
  viewMode?: CalendarViewMode
}

export interface WeekViewProps extends Omit<CalendarProps, 'onViewModeChange' | 'viewMode'> {
  weekStart: Date
}

export interface DayViewProps extends Omit<CalendarProps, 'onViewModeChange' | 'viewMode'> {
  date: Date
}

export interface EventRendererProps {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
  style: React.CSSProperties
}

export interface EventPopoverProps {
  event: CalendarEvent
  onClose: () => void
  onDelete?: (event: CalendarEvent) => void
  onEdit?: (event: CalendarEvent) => void
  position: { left: number; top: number }
}
