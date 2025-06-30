import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
} from '@mui/material'
import {
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { sendTestHabitReminder, formatHabitEmailPreview } from '../utils/emailUtils'

export default function EmailSettings({ habits, user }) {
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const emailPreview = formatHabitEmailPreview(habits)

  const handleSendTestEmail = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Please sign in to send test emails',
        severity: 'warning'
      })
      return
    }

    setLoading(true)
    
    try {
      const result = await sendTestHabitReminder()
      setSnackbar({
        open: true,
        message: result.message || 'Test email sent successfully!',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error sending test email:', error)
      setSnackbar({
        open: true,
        message: error.message || 'Failed to send test email',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <EmailIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Daily Email Reminders
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Get personalized habit reminders every day at 15:00 Germany time
            </Typography>
          </Box>
        </Box>

        {/* Email Preview Stats */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
            Today's Email Preview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f8fafc', 
                borderRadius: 2, 
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {emailPreview.totalHabits}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Total Habits
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f0fdf4', 
                borderRadius: 2, 
                textAlign: 'center',
                border: '1px solid #bbf7d0'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                  {emailPreview.completedToday}
                </Typography>
                <Typography variant="caption" sx={{ color: '#065f46' }}>
                  Completed Today
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#fffbeb', 
                borderRadius: 2, 
                textAlign: 'center',
                border: '1px solid #fde68a'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#d97706' }}>
                  {emailPreview.pendingToday}
                </Typography>
                <Typography variant="caption" sx={{ color: '#92400e' }}>
                  Still Pending
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Email Status */}
          <Box sx={{ mt: 2 }}>
            {emailPreview.wouldSendEmail ? (
              <Alert severity="info" icon={<EmailIcon />}>
                An email would be sent today with {emailPreview.completedToday + emailPreview.pendingToday} habit(s)
              </Alert>
            ) : (
              <Alert severity="info" icon={<InfoIcon />}>
                No email would be sent today (no habits due or completed)
              </Alert>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Schedule Information */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ScheduleIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
              Schedule Information
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Daily at 15:00"
              size="small"
              sx={{ bgcolor: '#e0e7ff', color: '#3730a3' }}
            />
            <Chip
              label="Germany Time (CET/CEST)"
              size="small"
              sx={{ bgcolor: '#f0f9ff', color: '#1e40af' }}
            />
            <Chip
              label="Automatic"
              size="small"
              sx={{ bgcolor: '#f0fdf4', color: '#166534' }}
            />
          </Box>
        </Box>

        {/* Test Email Button */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSendTestEmail}
            disabled={loading || !user}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' },
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>
          
          {user?.email && (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Test email will be sent to: <strong>{user.email}</strong>
            </Typography>
          )}
        </Box>

        {!user && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please sign in to test email functionality
          </Alert>
        )}
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
} 