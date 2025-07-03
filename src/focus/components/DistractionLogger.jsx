import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  Chip,
  Typography,
  Paper,
  Stack
} from '@mui/material'

import { DISTRACTION_CATEGORIES } from '../constants/focusConstants'

export default function DistractionLogger({ 
  open, 
  onClose, 
  onLogDistraction,
  sessionId 
}) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [description, setDescription] = useState('')
  const [customCategory, setCustomCategory] = useState('')

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    if (category.value !== 'other') {
      setCustomCategory('')
    }
  }

  const handleSubmit = () => {
    if (!selectedCategory) return

    const distractionData = {
      id: `distraction_${Date.now()}`,
      category: selectedCategory.value === 'other' ? customCategory : selectedCategory.value,
      categoryLabel: selectedCategory.value === 'other' ? customCategory : selectedCategory.label,
      description: description.trim(),
      timestamp: new Date().toISOString(),
      sessionId
    }

    onLogDistraction(distractionData)
    handleClose()
  }

  const handleClose = () => {
    setSelectedCategory(null)
    setDescription('')
    setCustomCategory('')
    onClose()
  }

  const isSubmitDisabled = !selectedCategory || 
    (selectedCategory.value === 'other' && !customCategory.trim())

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1,
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderBottom: '1px solid #f59e0b20'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#92400e' }}>
            🚨 Log Distraction
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#92400e', mt: 1 }}>
          What pulled your attention away? Let's learn from it!
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
            What type of distraction was it?
          </Typography>
          
          <Grid container spacing={2}>
            {DISTRACTION_CATEGORIES.map((category) => (
              <Grid item xs={6} sm={4} key={category.value}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: selectedCategory?.value === category.value 
                      ? `2px solid ${category.color}` 
                      : '2px solid transparent',
                    bgcolor: selectedCategory?.value === category.value 
                      ? `${category.color}10` 
                      : '#f8fafc',
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: `${category.color}10`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${category.color}20`
                    }
                  }}
                  onClick={() => handleCategorySelect(category)}
                >
                  <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>
                    {category.icon}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 600, 
                    color: selectedCategory?.value === category.value ? category.color : '#64748b'
                  }}>
                    {category.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {selectedCategory?.value === 'other' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1e293b' }}>
              Specify the distraction type:
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., Phone call, Email notification, Snack break..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1e293b' }}>
            Additional details (optional):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Describe what happened and how you handled it..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>

        {selectedCategory && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
            <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 500 }}>
              💡 <strong>Quick Tip:</strong> Recognizing distractions is the first step to managing them. 
              You're building awareness that will help you stay focused longer in future sessions!
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleClose}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            bgcolor: selectedCategory?.color || '#8b5cf6',
            '&:hover': { 
              bgcolor: selectedCategory?.color 
                ? `${selectedCategory.color}dd` 
                : '#7c3aed' 
            }
          }}
        >
          Log Distraction
        </Button>
      </DialogActions>
    </Dialog>
  )
} 