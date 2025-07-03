import React, { useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Alert
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RestoreIcon from '@mui/icons-material/Restore'

import { DEFAULT_SETTINGS } from '../constants/focusConstants'

export default function SettingsPage({ user, onBack, settings = DEFAULT_SETTINGS, onSaveSettings }) {
  const [formSettings, setFormSettings] = useState(settings)
  const [lastSaved, setLastSaved] = useState(null)

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...formSettings, [key]: value }
    setFormSettings(newSettings)
    
    // Auto-save immediately
    if (onSaveSettings) {
      try {
        await onSaveSettings(newSettings)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Failed to save setting:', error)
      }
    }
  }

  const handleReset = async () => {
    setFormSettings(DEFAULT_SETTINGS)
    if (onSaveSettings) {
      try {
        await onSaveSettings(DEFAULT_SETTINGS)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Failed to reset settings:', error)
      }
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Back to FocusMaster
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
            ⚙️ FocusMaster Settings
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {lastSaved && (
            <Typography variant="body2" sx={{ 
              color: '#10b981', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              ✓ Auto-saved {lastSaved.toLocaleTimeString()}
            </Typography>
          )}
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Reset to Defaults
          </Button>
        </Box>
      </Box>



      <Grid container spacing={4}>
        {/* Timer Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
              🍅 Timer Settings
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Pomodoro Length (minutes)
              </Typography>
              <Slider
                value={formSettings.pomodoroLength}
                onChange={(e, value) => handleSettingChange('pomodoroLength', value)}
                min={1}
                max={60}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ color: '#ef4444' }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Short Break Length (minutes)
              </Typography>
              <Slider
                value={formSettings.shortBreakLength}
                onChange={(e, value) => handleSettingChange('shortBreakLength', value)}
                min={3}
                max={15}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ color: '#10b981' }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Long Break Length (minutes)
              </Typography>
              <Slider
                value={formSettings.longBreakLength}
                onChange={(e, value) => handleSettingChange('longBreakLength', value)}
                min={15}
                max={30}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ color: '#3b82f6' }}
              />
            </Box>

            <TextField
              fullWidth
              type="number"
              label="Sessions until Long Break"
              value={formSettings.sessionsUntilLongBreak}
              onChange={(e) => handleSettingChange('sessionsUntilLongBreak', parseInt(e.target.value) || 4)}
              inputProps={{ min: 2, max: 10 }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Daily Goal (sessions)"
              value={formSettings.dailyGoal}
              onChange={(e) => handleSettingChange('dailyGoal', parseInt(e.target.value) || 8)}
              inputProps={{ min: 1, max: 20 }}
            />
          </Paper>
        </Grid>

        {/* Notifications & Sound */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
              🔔 Notifications & Sound
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                />
              }
              label="Browser Notifications"
              sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                />
              }
              label="Sound Notifications"
              sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}
            />

            {formSettings.soundEnabled && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Sound Volume
                </Typography>
                <Slider
                  value={formSettings.soundVolume}
                  onChange={(e, value) => handleSettingChange('soundVolume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                  sx={{ color: '#8b5cf6' }}
                />
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.autoStartBreaks}
                  onChange={(e) => handleSettingChange('autoStartBreaks', e.target.checked)}
                />
              }
              label="Auto-start Breaks"
              sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.autoStartPomodoros}
                  onChange={(e) => handleSettingChange('autoStartPomodoros', e.target.checked)}
                />
              }
              label="Auto-start Pomodoros"
              sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.showTimerInTitle}
                  onChange={(e) => handleSettingChange('showTimerInTitle', e.target.checked)}
                />
              }
              label="Show Timer in Browser Title"
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            />
          </Paper>
        </Grid>

        {/* Recently Added Section */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 4, 
            border: '1px solid #10b981',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
              ✅ Recently Added Features
            </Typography>
            <Typography variant="body1" sx={{ color: '#064e3b', mb: 2 }}>
              These powerful features are now available:
            </Typography>
            <Box component="ul" sx={{ color: '#064e3b', pl: 2, mb: 3 }}>
              <li><strong>Advanced Analytics:</strong> Comprehensive insights, productivity scoring, and data export</li>
              <li><strong>Focus Mode:</strong> Distraction blocking, mindfulness prompts, and attention training</li>
              <li><strong>Auto-Save Settings:</strong> Changes save automatically without clicking save</li>
            </Box>
            
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
              🚀 Coming Soon
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
              These features are in development for future updates:
            </Typography>
            <Box component="ul" sx={{ color: '#64748b', pl: 2 }}>
              <li>Background soundscapes (white noise, rain, café ambience)</li>
              <li>Custom break activities and exercises</li>
              <li>Team collaboration and shared sessions</li>
              <li>Integration with calendar apps</li>
              <li>AI-powered productivity coaching</li>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
} 