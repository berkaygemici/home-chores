import React, { useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import EmailIcon from '@mui/icons-material/Email'
import NotificationsIcon from '@mui/icons-material/Notifications'

import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import EmailReminderSettings from '../components/EmailReminderSettings'
import GeneralSettings from '../components/GeneralSettings'

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function SettingsPage({ user, onBack, habits, onHabitsUpdate }) {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#8b5cf6', width: 60, height: 60 }}>⚙️</Avatar>
          <Typography variant="h6">Loading settings...</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#e2e8f0' }}
          >
            Back to HabitMaster
          </Button>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #64748b, #475569)', 
            borderRadius: 3, 
            p: 1.5,
            boxShadow: '0 8px 32px rgba(100, 116, 139, 0.3)'
          }}>
            <Avatar sx={{ bgcolor: 'transparent', width: 48, height: 48, fontSize: '1.5rem' }}>
              ⚙️
            </Avatar>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #1e293b, #475569)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              SETTINGS
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Customize your HabitMaster experience ⚙️
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Settings Tabs */}
      <Paper sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            px: 3,
            '& .MuiTab-root': {
              fontWeight: 600,
              minHeight: 64
            },
            '& .Mui-selected': {
              color: '#8b5cf6'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#8b5cf6'
            }
          }}
        >
          <Tab 
            icon={<EmailIcon />} 
            label="Email Reminders" 
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<NotificationsIcon />} 
            label="Notifications" 
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="General" 
            iconPosition="start"
            sx={{ gap: 1 }}
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <EmailReminderSettings habits={habits} user={user} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                borderRadius: 2, 
                p: 1,
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
              }}>
                <NotificationsIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  🔔 Push Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Browser and mobile notification preferences
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Push notifications are coming soon! For now, you can set up email reminders in the Email Reminders tab.
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.5 }}>
              <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                  🔔 Browser Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  Get instant notifications in your browser when habits are due.
                </Typography>
                <Button variant="outlined" disabled sx={{ borderRadius: 2 }}>
                  Enable Browser Notifications
                </Button>
              </Box>

              <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                  📱 Mobile Push Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  Receive notifications on your mobile device through the PWA.
                </Typography>
                <Button variant="outlined" disabled sx={{ borderRadius: 2 }}>
                  Configure Mobile Notifications
                </Button>
              </Box>

              <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                  ⏰ Smart Notification Timing
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  AI-powered optimal notification timing based on your habits and behavior.
                </Typography>
                <Button variant="outlined" disabled sx={{ borderRadius: 2 }}>
                  Enable Smart Timing
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <GeneralSettings 
          habits={habits} 
          user={user} 
          onHabitsUpdate={onHabitsUpdate} 
        />
      </TabPanel>
    </Container>
  )
} 