import React from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Paper
} from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  TrendingUp as TrendingUpIcon,
  Assignment as TaskIcon,
  Home as ChoreIcon,
  Favorite as HabitIcon,
  Timer as FocusIcon,
  Analytics as ScoreIcon
} from '@mui/icons-material'
import { APP_COLORS, CHART_COLORS, PRODUCTIVITY_MESSAGES } from '../constants/metricsConstants'
import { getProductivityMessage } from '../utils/calculations'

export default function OverviewDashboard({ 
  overviewMetrics, 
  trendData, 
  timeRange 
}) {
  if (!overviewMetrics) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading overview data...
        </Typography>
      </Paper>
    )
  }

  const productivityMessage = getProductivityMessage(overviewMetrics.productivityScore)
  const randomMessage = PRODUCTIVITY_MESSAGES[productivityMessage][
    Math.floor(Math.random() * PRODUCTIVITY_MESSAGES[productivityMessage].length)
  ]

  // Data for pie chart showing app completion distribution
  const appCompletionData = [
    { name: 'Tasks', value: overviewMetrics.completedTasks, color: APP_COLORS.tasks },
    { name: 'Chores', value: overviewMetrics.choreCompletions, color: APP_COLORS.chores },
    { name: 'Habits', value: overviewMetrics.habitCompletions, color: APP_COLORS.habits },
    { name: 'Focus Sessions', value: overviewMetrics.totalFocusSessions, color: APP_COLORS.focus }
  ].filter(item => item.value > 0)

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <Card sx={{ 
      height: '100%',
      borderRadius: 3,
      border: '1px solid #e2e8f0',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ 
            bgcolor: `${color}20`, 
            borderRadius: 2, 
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon sx={{ color, fontSize: 24 }} />
          </Box>
          {trend && (
            <Chip 
              label={trend > 0 ? `+${trend}%` : `${trend}%`}
              size="small"
              color={trend > 0 ? "success" : trend < 0 ? "error" : "default"}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )

  const ProductivityScoreCard = () => (
    <Card sx={{ 
      borderRadius: 3,
      background: `linear-gradient(135deg, ${APP_COLORS.primary}10, ${APP_COLORS.overview}10)`,
      border: '1px solid #e2e8f0'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ 
            bgcolor: `${APP_COLORS.primary}20`, 
            borderRadius: 2, 
            p: 1.5 
          }}>
            <ScoreIcon sx={{ color: APP_COLORS.primary, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Productivity Score
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Last {timeRange} days
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h2" sx={{ 
            fontWeight: 800, 
            color: APP_COLORS.primary,
            mb: 1
          }}>
            {overviewMetrics.productivityScore}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={overviewMetrics.productivityScore}
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              mb: 2,
              bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${APP_COLORS.focus}, ${APP_COLORS.habits})`,
                borderRadius: 4
              }
            }}
          />
          <Typography variant="body1" sx={{ 
            color: '#1e293b', 
            fontWeight: 600,
            fontStyle: 'italic'
          }}>
            {randomMessage}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Productivity Score */}
      <ProductivityScoreCard />

      {/* Overview Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasks Completed"
            value={overviewMetrics.completedTasks}
            subtitle={`of ${overviewMetrics.totalTasks} total tasks`}
            icon={TaskIcon}
            color={APP_COLORS.tasks}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Chores Done"
            value={overviewMetrics.choreCompletions}
            subtitle={`${overviewMetrics.totalChores} total chores tracked`}
            icon={ChoreIcon}
            color={APP_COLORS.chores}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Habit Streak"
            value={`${overviewMetrics.maxHabitStreak} days`}
            subtitle={`${overviewMetrics.habitCompletions} habits completed`}
            icon={HabitIcon}
            color={APP_COLORS.habits}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Focus Time"
            value={`${overviewMetrics.totalFocusTime}m`}
            subtitle={`${overviewMetrics.totalFocusSessions} sessions completed`}
            icon={FocusIcon}
            color={APP_COLORS.focus}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4}>
        {/* Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                📈 Weekly Productivity Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke={APP_COLORS.primary}
                    strokeWidth={3}
                    dot={{ fill: APP_COLORS.primary, strokeWidth: 2, r: 4 }}
                    name="Productivity Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke={APP_COLORS.tasks}
                    strokeWidth={2}
                    dot={{ fill: APP_COLORS.tasks, strokeWidth: 2, r: 3 }}
                    name="Tasks"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="habits" 
                    stroke={APP_COLORS.habits}
                    strokeWidth={2}
                    dot={{ fill: APP_COLORS.habits, strokeWidth: 2, r: 3 }}
                    name="Habits"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="focus" 
                    stroke={APP_COLORS.focus}
                    strokeWidth={2}
                    dot={{ fill: APP_COLORS.focus, strokeWidth: 2, r: 3 }}
                    name="Focus (minutes)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* App Completion Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                🎯 Completion Distribution
              </Typography>
              {appCompletionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={appCompletionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: 250,
                  color: '#64748b'
                }}>
                  <Typography variant="body2">
                    No completed activities yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
} 