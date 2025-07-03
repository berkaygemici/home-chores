import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material'
import {
  DeleteSweep as ClearIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  RestartAlt as ResetIcon,
  Person as AccountIcon,
  Palette as ThemeIcon,
  Storage as DataIcon,
  Security as SecurityIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { db } from '../../firebase'
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'

export default function GeneralSettings({ habits, user, onHabitsUpdate }) {
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  const [dialogOpen, setDialogOpen] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [importData, setImportData] = useState('')

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const closeDialog = () => {
    setDialogOpen('')
    setConfirmText('')
    setImportData('')
  }

  // Clear all habits
  const handleClearAllHabits = async () => {
    if (confirmText !== 'DELETE ALL HABITS') {
      showSnackbar('Please type "DELETE ALL HABITS" to confirm', 'error')
      return
    }

    setLoading(true)
    try {
      await setDoc(doc(db, 'habitmaster_habits', user.uid), { habits: [] }, { merge: true })
      onHabitsUpdate([])
      closeDialog()
      showSnackbar('All habits have been deleted successfully', 'success')
    } catch (error) {
      console.error('Error clearing habits:', error)
      showSnackbar('Failed to clear habits', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Reset all progress (keep habits but clear completions)
  const handleResetProgress = async () => {
    if (confirmText !== 'RESET PROGRESS') {
      showSnackbar('Please type "RESET PROGRESS" to confirm', 'error')
      return
    }

    setLoading(true)
    try {
      const resetHabits = habits.map(habit => ({
        ...habit,
        completions: [],
        updatedAt: new Date().toISOString()
      }))
      
      await setDoc(doc(db, 'habitmaster_habits', user.uid), { habits: resetHabits }, { merge: true })
      onHabitsUpdate(resetHabits)
      closeDialog()
      showSnackbar('All progress has been reset successfully', 'success')
    } catch (error) {
      console.error('Error resetting progress:', error)
      showSnackbar('Failed to reset progress', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Export habits data
  const handleExportData = () => {
    try {
      const exportData = {
        habits,
        exportDate: new Date().toISOString(),
        version: '1.0',
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `habitmaster-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showSnackbar('Habits data exported successfully! 📦', 'success')
    } catch (error) {
      console.error('Error exporting data:', error)
      showSnackbar('Failed to export data', 'error')
    }
  }

  // Import habits data
  const handleImportData = async () => {
    setLoading(true)
    try {
      const parsedData = JSON.parse(importData)
      
      if (!parsedData.habits || !Array.isArray(parsedData.habits)) {
        throw new Error('Invalid data format')
      }

      // Validate and clean imported data
      const validHabits = parsedData.habits.map(habit => ({
        ...habit,
        id: habit.id || Date.now().toString() + Math.random(),
        createdAt: habit.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completions: habit.completions || [],
        reminderTime: habit.reminderTime || '09:00',
        enableReminder: habit.enableReminder !== undefined ? habit.enableReminder : true
      }))

      await setDoc(doc(db, 'habitmaster_habits', user.uid), { habits: validHabits }, { merge: true })
      onHabitsUpdate(validHabits)
      closeDialog()
      showSnackbar(`Successfully imported ${validHabits.length} habits! 🎉`, 'success')
    } catch (error) {
      console.error('Error importing data:', error)
      showSnackbar('Invalid data format or import failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Delete all user data
  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      showSnackbar('Please type "DELETE MY ACCOUNT" to confirm', 'error')
      return
    }

    setLoading(true)
    try {
      // Delete habits data
      await deleteDoc(doc(db, 'habitmaster_habits', user.uid))
      
      // Delete email settings
      try {
        await deleteDoc(doc(db, 'user_email_settings', user.uid))
      } catch (e) {
        // Settings might not exist, that's ok
      }

      onHabitsUpdate([])
      closeDialog()
      showSnackbar('All your data has been deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting account data:', error)
      showSnackbar('Failed to delete account data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const totalCompletions = habits.reduce((sum, habit) => sum + (habit.completions?.length || 0), 0)
  const dataSize = JSON.stringify(habits).length
  const formattedSize = dataSize < 1024 ? `${dataSize} bytes` : `${(dataSize / 1024).toFixed(1)} KB`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Data Management */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <DataIcon sx={{ color: '#059669', fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                📊 Data Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Export, import, and manage your habit data
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
              Current Data Summary
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip label={`${habits.length} Habits`} size="small" color="primary" />
              <Chip label={`${totalCompletions} Completions`} size="small" color="success" />
              <Chip label={`${formattedSize} Storage`} size="small" color="info" />
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportData}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              Export Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={() => setDialogOpen('import')}
              sx={{ borderRadius: 2, flex: 1 }}
            >
              Import Data
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Account & Privacy */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <AccountIcon sx={{ color: '#3b82f6', fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                👤 Account & Privacy
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Manage your account settings and privacy preferences
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
              Account Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
              <strong>Email:</strong> {user?.email}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
              <strong>Display Name:</strong> {user?.displayName || 'Not set'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              <strong>Account ID:</strong> {user?.uid.substring(0, 8)}...
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            To change your email or password, please use your authentication provider's settings.
          </Alert>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card sx={{ borderRadius: 3, border: '2px solid #fecaca', bgcolor: '#fef2f2' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <WarningIcon sx={{ color: '#dc2626', fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626' }}>
                ⚠️ Danger Zone
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f1d1d' }}>
                Irreversible actions that will permanently affect your data
              </Typography>
            </Box>
          </Box>

          <Stack spacing={2}>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #f87171' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#dc2626', mb: 1 }}>
                Reset All Progress
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f1d1d', mb: 2 }}>
                Keep your habits but remove all completion data and streaks. This cannot be undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ResetIcon />}
                onClick={() => setDialogOpen('reset')}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Reset Progress
              </Button>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #f87171' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#dc2626', mb: 1 }}>
                Delete All Habits
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f1d1d', mb: 2 }}>
                Permanently delete all your habits and their data. This cannot be undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ClearIcon />}
                onClick={() => setDialogOpen('clear')}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Delete All Habits
              </Button>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #f87171' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#dc2626', mb: 1 }}>
                Delete Account Data
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f1d1d', mb: 2 }}>
                Permanently delete all your HabitMaster data including habits, progress, and settings.
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<SecurityIcon />}
                onClick={() => setDialogOpen('delete')}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Delete All Data
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <Dialog open={dialogOpen === 'clear'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
          ⚠️ Delete All Habits
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will permanently delete all {habits.length} habits and their completion data. This action cannot be undone.
          </Typography>
          <TextField
            fullWidth
            label='Type "DELETE ALL HABITS" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            error={confirmText && confirmText !== 'DELETE ALL HABITS'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleClearAllHabits}
            disabled={loading || confirmText !== 'DELETE ALL HABITS'}
            startIcon={loading ? <CircularProgress size={16} /> : <ClearIcon />}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Deleting...' : 'Delete All Habits'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen === 'reset'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
          ⚠️ Reset All Progress
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will reset all completion data and streaks for your {habits.length} habits. Your habits will remain but all progress will be lost.
          </Typography>
          <TextField
            fullWidth
            label='Type "RESET PROGRESS" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            error={confirmText && confirmText !== 'RESET PROGRESS'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleResetProgress}
            disabled={loading || confirmText !== 'RESET PROGRESS'}
            startIcon={loading ? <CircularProgress size={16} /> : <ResetIcon />}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Resetting...' : 'Reset Progress'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen === 'delete'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
          ⚠️ Delete Account Data
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will permanently delete ALL your HabitMaster data including habits, progress, and email settings. This action cannot be undone.
          </Typography>
          <TextField
            fullWidth
            label='Type "DELETE MY ACCOUNT" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            error={confirmText && confirmText !== 'DELETE MY ACCOUNT'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={loading || confirmText !== 'DELETE MY ACCOUNT'}
            startIcon={loading ? <CircularProgress size={16} /> : <SecurityIcon />}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Deleting...' : 'Delete All Data'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen === 'import'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          📦 Import Habits Data
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Paste your exported HabitMaster data below. This will replace your current habits.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Paste JSON data here"
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder='{"habits": [...], "exportDate": "...", ...}'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImportData}
            disabled={loading || !importData.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <ImportIcon />}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Importing...' : 'Import Data'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  )
} 