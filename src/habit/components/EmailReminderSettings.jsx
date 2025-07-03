import { useState, useEffect } from 'react'
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
  Switch,
  FormControlLabel,
  Stack
} from '@mui/material'
import {
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { db } from '../../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { sendTestHabitReminder, formatHabitEmailPreview } from '../utils/emailUtils'

export default function EmailReminderSettings({ habits, user }) {
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  const [settings, setSettings] = useState({
    enabled: true
  })

  // Load user's email settings from Firebase
  useEffect(() => {
    if (!user) return

    const loadEmailSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'user_email_settings', user.uid))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setSettings({
            enabled: data.enabled ?? true
          })
        }
      } catch (error) {
        console.error('Error loading email settings:', error)
      }
    }

    loadEmailSettings()
  }, [user])

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

  const handleSaveSettings = async () => {
    if (!user) return

    setSaveLoading(true)
    try {
      await setDoc(doc(db, 'user_email_settings', user.uid), settings, { merge: true })
      setSnackbar({
        open: true,
        message: 'Email reminder settings saved successfully! ✨',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error saving email settings:', error)
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
            borderRadius: 2, 
            p: 1,
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
          }}>
            <EmailIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              📧 Email Reminder Settings
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Get daily habit reminders delivered to your inbox
            </Typography>
          </Box>
        </Box>

        {/* Enable/Disable Switch */}
        <Box sx={{ mb: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#8b5cf6',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#8b5cf6',
                    },
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Enable Daily Email Reminders
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Receive personalized habit reminders via email every day
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Fixed Schedule Info */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ScheduleIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Daily Delivery Schedule
            </Typography>
          </Box>
          <Typography variant="body2">
            Your habit reminders are delivered every day at <strong>3:00 PM (15:00) Germany Time (CET/CEST)</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem', opacity: 0.8 }}>
            This includes all your habits due for the day, completed and pending, with progress statistics and motivational messages.
          </Typography>
        </Alert>

        {settings.enabled && (
          <>
            {/* Email Preview Stats */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                📊 Today's Email Preview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#f8fafc', 
                    borderRadius: 3, 
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
                    borderRadius: 3, 
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
                    borderRadius: 3, 
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
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    An email will be sent today at 3:00 PM with {emailPreview.completedToday + emailPreview.pendingToday} habit(s)
                  </Alert>
                ) : (
                  <Alert severity="info" icon={<InfoIcon />}>
                    No email will be sent today (no habits due or all habits completed)
                  </Alert>
                )}
              </Box>
            </Box>

            {/* Email Content Preview */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                📋 Email Content Preview
              </Typography>
              <Box sx={{ 
                p: 3, 
                bgcolor: '#f8fafc', 
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1e293b' }}>
                  Subject: 🎯 Daily Habits - {emailPreview.completedToday} completed, {emailPreview.pendingToday} pending
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                  Hi {user?.displayName || user?.email?.split('@')[0] || 'there'}! 👋<br/><br/>
                  Your daily habit reminder includes:<br/>
                  • Progress statistics and streaks<br/>
                  • Completed habits with celebration<br/>
                  • Pending habits with motivation<br/>
                  • Personalized motivational message<br/>
                  • Direct link to HabitMaster<br/>
                  <br/>
                  <em>Beautiful, professional HTML email with your branding!</em>
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                startIcon={saveLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saveLoading}
                sx={{ 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                  }
                }}
              >
                {saveLoading ? 'Saving...' : 'Save Settings'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                onClick={handleSendTestEmail}
                disabled={loading || !settings.enabled}
                sx={{ borderRadius: 2 }}
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </Stack>

            {/* Info Box */}
            <Box sx={{ 
              mt: 4, 
              p: 3, 
              bgcolor: '#f0f9ff', 
              borderRadius: 3,
              border: '1px solid #bae6fd'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0369a1', mb: 1 }}>
                💡 How Email Reminders Work
              </Typography>
              <Typography variant="body2" sx={{ color: '#0369a1', lineHeight: 1.6 }}>
                • <strong>Daily Schedule:</strong> Emails are sent automatically at 3:00 PM Germany time<br/>
                • <strong>Smart Content:</strong> Only sent when you have habits due for the day<br/>
                • <strong>Rich Format:</strong> Professional HTML emails with progress tracking<br/>
                • <strong>Personal Touch:</strong> Customized with your name and motivational messages<br/>
                • <strong>No Spam:</strong> One comprehensive email per day, never overwhelming
              </Typography>
            </Box>
          </>
        )}

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
      </CardContent>
    </Card>
  )
} 