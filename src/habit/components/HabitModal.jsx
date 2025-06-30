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
  Avatar
} from '@mui/material'

import { HABIT_CATEGORIES, DIFFICULTY_LEVELS, HABIT_FREQUENCIES } from '../constants/habitConstants'

export default function HabitModal({ open, onClose, onSave, habit = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'health',
    difficulty: 'medium',
    frequency: 'daily'
  })

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name || '',
        description: habit.description || '',
        category: habit.category || 'health',
        difficulty: habit.difficulty || 'medium',
        frequency: habit.frequency || 'daily'
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'health',
        difficulty: 'medium',
        frequency: 'daily'
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