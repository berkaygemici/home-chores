import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Collapse
} from '@mui/material'

import { HABIT_CATEGORIES, DIFFICULTY_LEVELS, HABIT_FREQUENCIES } from '../constants/habitConstants'

export default function HabitModal({ open, onClose, onSave, habit = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'health',
    difficulty: 'medium',
    frequency: 'daily',
    customInterval: 1
  })

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name || '',
        description: habit.description || '',
        category: habit.category || 'health',
        difficulty: habit.difficulty || 'medium',
        frequency: habit.frequency || 'daily',
        customInterval: habit.customInterval || 1
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'health',
        difficulty: 'medium',
        frequency: 'daily',
        customInterval: 1
      })
    }
  }, [habit, open])

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    const habitData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      id: habit?.id || Date.now().toString(),
      createdAt: habit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completions: habit?.completions || []
    }

    // Only include customInterval if frequency is custom
    if (formData.frequency === 'custom') {
      habitData.customInterval = parseInt(formData.customInterval) || 1
    }

    onSave(habitData)
  }

  const selectedCategory = HABIT_CATEGORIES.find(cat => cat.id === formData.category)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        fontWeight: 700, 
        fontSize: '1.5rem', 
        color: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar sx={{ bgcolor: selectedCategory?.color || '#2563eb' }}>
          {selectedCategory?.icon || '🎯'}
        </Avatar>
        {habit ? 'Edit Habit' : 'Create New Habit'}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Habit Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
            fullWidth
            placeholder="e.g., Exercise for 30 minutes"
          />

          <TextField
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            fullWidth
            placeholder="Add details about your habit..."
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {HABIT_CATEGORIES.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{category.icon}</span>
                      <Typography>{category.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={formData.difficulty}
                label="Difficulty"
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                {DIFFICULTY_LEVELS.map((difficulty) => (
                  <MenuItem key={difficulty.value} value={difficulty.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: difficulty.color
                        }}
                      />
                      <Typography>{difficulty.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select
              value={formData.frequency}
              label="Frequency"
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
            >
              {HABIT_FREQUENCIES.map((freq) => (
                <MenuItem key={freq.value} value={freq.value}>
                  <Box>
                    <Typography>{freq.label}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {freq.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Custom Interval Input - appears when Custom frequency is selected */}
          <Collapse in={formData.frequency === 'custom'}>
            <Box sx={{ 
              p: 3, 
              bgcolor: '#f8fafc', 
              borderRadius: 2, 
              border: '1px solid #e2e8f0' 
            }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
                Custom Interval Settings
              </Typography>
              <TextField
                label="Repeat every X days"
                type="number"
                value={formData.customInterval}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  setFormData(prev => ({ ...prev, customInterval: Math.max(1, value) }))
                }}
                inputProps={{ min: 1, max: 365 }}
                fullWidth
                helperText={`This habit will be due every ${formData.customInterval} day${formData.customInterval > 1 ? 's' : ''}`}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff'
                  }
                }}
              />
              <Box sx={{ mt: 2, p: 2, bgcolor: '#e0f2fe', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 500 }}>
                  💡 Examples: 1 = daily, 2 = every other day, 7 = weekly, 14 = bi-weekly
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!formData.name.trim()}
          sx={{ 
            borderRadius: 2, 
            bgcolor: selectedCategory?.color,
            '&:hover': {
              bgcolor: selectedCategory?.color,
              filter: 'brightness(0.9)'
            }
          }}
        >
          {habit ? 'Update Habit' : 'Create Habit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 