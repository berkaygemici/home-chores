import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay, isToday, isPast, isFuture } from 'date-fns'

// Get current week dates
export const getCurrentWeekDates = () => {
  const today = new Date()
  const startDate = startOfWeek(today, { weekStartsOn: 1 }) // Start week on Monday
  const endDate = endOfWeek(today, { weekStartsOn: 1 })
  
  return eachDayOfInterval({ start: startDate, end: endDate })
}

// Get dates for a specific month
export const getMonthDates = (year, month) => {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)
  
  return eachDayOfInterval({ start: startDate, end: endDate })
}

// Format date for display
export const formatDisplayDate = (date) => {
  if (isToday(date)) return 'Today'
  return format(date, 'MMM dd')
}

// Format date for habit completion tracking
export const formatTrackingDate = (date) => {
  return format(date, 'yyyy-MM-dd')
}

// Get day of week label
export const getDayLabel = (date) => {
  return format(date, 'EEE') // Mon, Tue, Wed, etc.
}

// Get full day label
export const getFullDayLabel = (date) => {
  return format(date, 'EEEE') // Monday, Tuesday, etc.
}

// Check if date is in current week
export const isInCurrentWeek = (date) => {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  
  return date >= weekStart && date <= weekEnd
}

// Get week progress (0-1)
export const getWeekProgress = () => {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const dayOfWeek = today.getDay() || 7 // Convert Sunday (0) to 7
  const mondayBasedDay = dayOfWeek === 7 ? 1 : dayOfWeek + 1 // Monday = 1
  
  return (mondayBasedDay - 1) / 6 // 0 on Monday, 1 on Sunday
}

// Get month progress (0-1)
export const getMonthProgress = () => {
  const today = new Date()
  const dayOfMonth = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  
  return (dayOfMonth - 1) / (daysInMonth - 1)
}

// Get relative date string
export const getRelativeDateString = (date) => {
  const today = new Date()
  const targetDate = typeof date === 'string' ? parseISO(date) : date
  
  if (isSameDay(targetDate, today)) return 'Today'
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(targetDate, yesterday)) return 'Yesterday'
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(targetDate, tomorrow)) return 'Tomorrow'
  
  if (isPast(targetDate)) {
    const daysAgo = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24))
    return `${daysAgo} days ago`
  }
  
  if (isFuture(targetDate)) {
    const daysAhead = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24))
    return `in ${daysAhead} days`
  }
  
  return format(targetDate, 'MMM dd, yyyy')
}

// Get calendar grid for month view
export const getCalendarGrid = (year, month) => {
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  // Start from the Monday of the week containing the first day
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 })
  
  // End at the Sunday of the week containing the last day
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 })
  
  const dates = eachDayOfInterval({ start: startDate, end: endDate })
  
  // Group into weeks
  const weeks = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }
  
  return weeks
}

// Check if date is weekend
export const isWeekend = (date) => {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

// Get days until date
export const getDaysUntil = (targetDate) => {
  const today = new Date()
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate
  
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

// Get days since date
export const getDaysSince = (startDate) => {
  const today = new Date()
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  
  return Math.floor((today - start) / (1000 * 60 * 60 * 24))
} 