import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Snackbar,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import SendIcon from '@mui/icons-material/Send'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoIcon from '@mui/icons-material/Info'

import { sendTestHabitReminder, formatHabitsForEmailPreview } from '../utils/emailUtils'

export default function EmailTestPanel({ user, habits }) {
  const [sending, setSending] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const emailPreview = formatHabitsForEmailPreview(habits)

  const handleSendTestEmail = async () => {
    if (!user || !user.email) {
      setSnackbar({
        open: true,
        message: 'User must be logged in with an email address',
        severity: 'error'
      })
      return
    }

    setSending(true)
    try {
      const result = await sendTestHabitReminder(user)
      setSnackbar({
        open: true,
        message: `Test email sent successfully to ${result.sentTo || user.email}!`,
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to send test email: ${error.message}`,
        severity: 'error'
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <EmailIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Daily Email Reminders
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Automatic daily habit reminders at 15:00 Germany time
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Email Preview Stats */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2, fontWeight: 600 }}>
              Today's Email Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={`${emailPreview.totalHabits} Total Habits`}
                size="small"
                sx={{ bgcolor: '#f1f5f9', color: '#64748b' }}
              />
              <Chip
                label={`${emailPreview.completedToday} Completed`}
                size="small"
                sx={{ bgcolor: '#f0fdf4', color: '#065f46' }}
              />
              <Chip
                label={`${emailPreview.pendingToday} Pending`}
                size="small"
                sx={{ bgcolor: '#fef3c7', color: '#92400e' }}
              />
            </Box>
            
            {emailPreview.shouldSendEmail ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" />
                  Email would be sent today - you have habits due or completed
                </Box>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon fontSize="small" />
                  No email would be sent today - no habits due or completed
                </Box>
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Schedule Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2, fontWeight: 600 }}>
              Schedule Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <ScheduleIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Daily at 15:00</strong> (3:00 PM) Germany Time
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', ml: 4 }}>
              Automatically sends to: <strong>{user?.email || 'Not logged in'}</strong>
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Test Email Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2, fontWeight: 600 }}>
              Test Email Function
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Send a test email right now to verify the system is working correctly.
            </Typography>
            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SendIcon />}
              onClick={handleSendTestEmail}
              disabled={sending || !user?.email}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: '#8b5cf6',
                '&:hover': { bgcolor: '#7c3aed' },
                '&:disabled': { bgcolor: '#cbd5e1' }
              }}
            >
              {sending ? 'Sending...' : 'Send Test Email'}
            </Button>
            {!user?.email && (
              <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block' }}>
                Please log in with an email address to test
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
} 