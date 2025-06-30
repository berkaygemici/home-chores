import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Avatar
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

import { HABIT_CATEGORIES, DIFFICULTY_LEVELS } from '../constants/habitConstants'
import { 
  calculateStreak, 
  isHabitCompletedToday, 
  isHabitDueToday,
  getCompletionRate 
} from '../utils/habitUtils'

export default function HabitCard({ 
  habit, 
  onToggleCompletion, 
  onEdit, 
  onDelete, 
  onClick 
}) {
  const category = HABIT_CATEGORIES.find(cat => cat.id === habit.category) || HABIT_CATEGORIES[0]
  const difficulty = DIFFICULTY_LEVELS.find(diff => diff.value === habit.difficulty) || DIFFICULTY_LEVELS[0]
  
  const isCompleted = isHabitCompletedToday(habit)
  const isDue = isHabitDueToday(habit)
  const currentStreak = calculateStreak(habit)
  const completionRate = getCompletionRate(habit, 30)

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggleCompletion(habit.id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(habit)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${habit.name}"? This action cannot be undone.`)) {
      onDelete(habit.id)
    }
  }

  const getFrequencyDisplay = () => {
    switch (habit.frequency) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const days = habit.weeklyDays?.map(day => dayNames[day]).join(', ') || ''
        return `${days}`
      case 'monthly':
        const dates = habit.monthlyDays?.join(', ') || ''
        return `${dates}th of month`
      case 'custom':
        return `Every ${habit.customInterval} days`
      default:
        return 'Daily'
    }
  }

  return (
    <Card
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isCompleted ? `2px solid ${category.color}` : '1px solid #e2e8f0',
        bgcolor: isCompleted ? `${category.color}08` : '#fff',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          borderColor: category.color
        },
        opacity: !isDue ? 0.6 : 1
      }}
      onClick={onClick}
    >
      {/* Progress bar at top for completion rate */}
      <LinearProgress
        variant="determinate"
        value={completionRate}
        sx={{
          height: 4,
          backgroundColor: '#f1f5f9',
          '& .MuiLinearProgress-bar': {
            backgroundColor: category.color
          }
        }}
      />

      <CardContent sx={{ pb: 1 }}>
        {/* Header with category and completion status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: category.color,
                fontSize: '1rem'
              }}
            >
              {category.icon}
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: category.color, fontWeight: 600 }}>
                {category.name}
              </Typography>
            </Box>
          </Box>
          
          <IconButton
            size="small"
            onClick={handleToggle}
            disabled={!isDue}
            sx={{
              color: isCompleted ? category.color : '#94a3b8',
              '&:hover': {
                bgcolor: `${category.color}15`
              }
            }}
          >
            {isCompleted ? (
              <CheckCircleIcon />
            ) : (
              <RadioButtonUncheckedIcon />
            )}
          </IconButton>
        </Box>

        {/* Habit name */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            mb: 1,
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? '#64748b' : '#1e293b'
          }}
        >
          {habit.name}
        </Typography>

        {/* Description */}
        {habit.description && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b', 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {habit.description}
          </Typography>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Tooltip title="Current Streak">
            <Chip
              icon={<TrendingUpIcon />}
              label={`${currentStreak} days`}
              size="small"
              sx={{
                bgcolor: currentStreak > 0 ? '#fef3c7' : '#f1f5f9',
                color: currentStreak > 0 ? '#92400e' : '#64748b',
                '& .MuiChip-icon': {
                  color: currentStreak > 0 ? '#92400e' : '#64748b'
                }
              }}
            />
          </Tooltip>

          <Tooltip title="30-day Completion Rate">
            <Chip
              label={`${completionRate}%`}
              size="small"
              sx={{
                bgcolor: completionRate >= 80 ? '#dcfce7' : completionRate >= 60 ? '#fef3c7' : '#fef2f2',
                color: completionRate >= 80 ? '#166534' : completionRate >= 60 ? '#92400e' : '#991b1b'
              }}
            />
          </Tooltip>

          <Chip
            label={difficulty.label}
            size="small"
            sx={{
              bgcolor: `${difficulty.color}15`,
              color: difficulty.color,
              fontWeight: 600
            }}
          />
        </Box>

        {/* Frequency */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarTodayIcon sx={{ fontSize: 16, color: '#64748b' }} />
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {getFrequencyDisplay()}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {isDue ? (isCompleted ? 'Completed today' : 'Due today') : 'Not due today'}
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="Edit habit">
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete habit">
            <IconButton size="small" color="error" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  )
} 