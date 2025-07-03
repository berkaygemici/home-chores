import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Divider
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import InsightsIcon from '@mui/icons-material/Insights'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PsychologyIcon from '@mui/icons-material/Psychology'
import DownloadIcon from '@mui/icons-material/Download'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

import { DISTRACTION_TYPES } from '../constants/focusConstants'

export default function AdvancedAnalytics({ 
  sessions = [], 
  distractions = [], 
  tasks = [],
  onBack 
}) {
  const [timeRange, setTimeRange] = useState('30') // days
  const [chartType, setChartType] = useState('sessions')

  // Filter data by time range
  const filteredData = useMemo(() => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange))

    const filteredSessions = sessions.filter(session => 
      new Date(session.startTime) >= cutoffDate
    )
    const filteredDistractions = distractions.filter(distraction => 
      new Date(distraction.timestamp) >= cutoffDate
    )

    return { sessions: filteredSessions, distractions: filteredDistractions }
  }, [sessions, distractions, timeRange])

  // Calculate comprehensive metrics
  const analytics = useMemo(() => {
    const { sessions: sessionData, distractions: distractionData } = filteredData

    // Basic stats
    const totalSessions = sessionData.length
    const completedSessions = sessionData.filter(s => s.completed).length
    const totalFocusTime = sessionData.reduce((acc, s) => acc + (s.actualDuration || 0), 0)
    const avgSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    // Productivity score (0-100)
    const productivityScore = Math.min(100, Math.round(
      (completionRate * 0.4) + 
      (Math.min(avgSessionLength / 25, 1) * 100 * 0.3) + 
      (Math.max(0, 1 - (distractionData.length / Math.max(totalSessions, 1))) * 100 * 0.3)
    ))

    // Time-based analysis
    const hourlyData = new Array(24).fill(0).map((_, hour) => ({
      hour,
      sessions: sessionData.filter(s => new Date(s.startTime).getHours() === hour).length,
      avgDuration: 0,
      productivity: 0
    }))

    hourlyData.forEach(hourData => {
      const hourSessions = sessionData.filter(s => new Date(s.startTime).getHours() === hourData.hour)
      if (hourSessions.length > 0) {
        hourData.avgDuration = hourSessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0) / hourSessions.length
        hourData.productivity = (hourSessions.filter(s => s.completed).length / hourSessions.length) * 100
      }
    })

    // Daily trend analysis
    const dailyData = {}
    sessionData.forEach(session => {
      const date = new Date(session.startTime).toDateString()
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          sessions: 0,
          completedSessions: 0,
          totalTime: 0,
          distractions: 0
        }
      }
      dailyData[date].sessions++
      if (session.completed) dailyData[date].completedSessions++
      dailyData[date].totalTime += session.actualDuration || 0
    })

    distractionData.forEach(distraction => {
      const date = new Date(distraction.timestamp).toDateString()
      if (dailyData[date]) {
        dailyData[date].distractions++
      }
    })

    const dailyTrends = Object.values(dailyData).map(day => ({
      ...day,
      completionRate: day.sessions > 0 ? (day.completedSessions / day.sessions) * 100 : 0,
      avgSessionTime: day.sessions > 0 ? day.totalTime / day.sessions : 0,
      distractionsPerSession: day.sessions > 0 ? day.distractions / day.sessions : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date))

    // Distraction analysis
    const distractionAnalysis = DISTRACTION_TYPES.map(type => ({
      ...type,
      count: distractionData.filter(d => d.type === type.id).length,
      percentage: distractionData.length > 0 ? 
        (distractionData.filter(d => d.type === type.id).length / distractionData.length) * 100 : 0
    })).sort((a, b) => b.count - a.count)

    // Best performance insights
    const bestHour = hourlyData.reduce((best, current) => 
      current.productivity > best.productivity ? current : best
    )
    const bestDay = dailyTrends.reduce((best, current) => 
      current.completionRate > best.completionRate ? current : best, dailyTrends[0] || {}
    )

    // Weekly patterns
    const weeklyData = new Array(7).fill(0).map((_, day) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
      sessions: 0,
      avgProductivity: 0,
      totalTime: 0
    }))

    sessionData.forEach(session => {
      const dayOfWeek = new Date(session.startTime).getDay()
      weeklyData[dayOfWeek].sessions++
      weeklyData[dayOfWeek].totalTime += session.actualDuration || 0
    })

    weeklyData.forEach(day => {
      const daySessions = sessionData.filter(s => new Date(s.startTime).getDay() === weeklyData.indexOf(day))
      if (daySessions.length > 0) {
        day.avgProductivity = (daySessions.filter(s => s.completed).length / daySessions.length) * 100
      }
    })

    return {
      totalSessions,
      completedSessions,
      totalFocusTime,
      avgSessionLength,
      completionRate,
      productivityScore,
      hourlyData,
      dailyTrends,
      distractionAnalysis,
      bestHour,
      bestDay,
      weeklyData,
      totalDistractions: distractionData.length,
      avgDistractionsPerSession: totalSessions > 0 ? distractionData.length / totalSessions : 0
    }
  }, [filteredData])

  // Export functionality
  const exportData = () => {
    const exportObj = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      summary: {
        totalSessions: analytics.totalSessions,
        completedSessions: analytics.completedSessions,
        completionRate: analytics.completionRate,
        totalFocusTime: analytics.totalFocusTime,
        productivityScore: analytics.productivityScore,
        totalDistractions: analytics.totalDistractions
      },
      dailyTrends: analytics.dailyTrends,
      hourlyPatterns: analytics.hourlyData,
      distractionBreakdown: analytics.distractionAnalysis,
      weeklyPatterns: analytics.weeklyData,
      insights: {
        bestHour: analytics.bestHour.hour,
        bestDay: analytics.bestDay.date,
        avgSessionLength: analytics.avgSessionLength
      },
      rawData: {
        sessions: filteredData.sessions,
        distractions: filteredData.distractions
      }
    }

    const dataStr = JSON.stringify(exportObj, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `focusmaster-analytics-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getChartData = () => {
    switch (chartType) {
      case 'sessions':
        return analytics.dailyTrends.slice(-14).map(day => ({
          date: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          sessions: day.sessions,
          completed: day.completedSessions,
          completionRate: day.completionRate
        }))
      case 'hourly':
        return analytics.hourlyData.filter(h => h.sessions > 0).map(hour => ({
          hour: `${hour.hour}:00`,
          sessions: hour.sessions,
          productivity: hour.productivity,
          avgDuration: hour.avgDuration
        }))
      case 'weekly':
        return analytics.weeklyData.map(day => ({
          day: day.day,
          sessions: day.sessions,
          productivity: day.avgProductivity,
          totalTime: day.totalTime
        }))
      default:
        return []
    }
  }

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            ← Back to FocusMaster
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
            📊 Advanced Analytics
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 3 months</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportData}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Export Data
          </Button>
        </Stack>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <AccessTimeIcon sx={{ color: '#8b5cf6', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {analytics.totalSessions}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Total Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <TrendingUpIcon sx={{ color: '#10b981', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {Math.round(analytics.completionRate)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <CalendarTodayIcon sx={{ color: '#3b82f6', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {formatTime(analytics.totalFocusTime)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Total Focus Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <InsightsIcon sx={{ color: '#f59e0b', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {analytics.productivityScore}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Productivity Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PsychologyIcon sx={{ color: '#ef4444', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {analytics.totalDistractions}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Total Distractions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                📈 Performance Trends
              </Typography>
              <FormControl size="small">
                <Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <MenuItem value="sessions">Daily Sessions</MenuItem>
                  <MenuItem value="hourly">Hourly Patterns</MenuItem>
                  <MenuItem value="weekly">Weekly Patterns</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'sessions' ? (
                <AreaChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="sessions" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="completed" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                </AreaChart>
              ) : chartType === 'hourly' ? (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#8b5cf6" />
                </BarChart>
              ) : (
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={3} />
                  <Line type="monotone" dataKey="productivity" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              🎯 Distraction Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.distractionAnalysis.filter(d => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({name, percentage}) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {analytics.distractionAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Insights & Recommendations */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              💡 Key Insights
            </Typography>
            
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0369a1' }}>
                  🕐 Peak Performance Time
                </Typography>
                <Typography variant="body2" sx={{ color: '#0369a1' }}>
                  You're most productive at {analytics.bestHour.hour}:00 with {analytics.bestHour.productivity.toFixed(1)}% completion rate
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#166534' }}>
                  📅 Best Day
                </Typography>
                <Typography variant="body2" sx={{ color: '#166534' }}>
                  Your best performance was on {analytics.bestDay.date} with {analytics.bestDay.completionRate?.toFixed(1)}% completion rate
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #fcd34d' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#92400e' }}>
                  ⚡ Average Session
                </Typography>
                <Typography variant="body2" sx={{ color: '#92400e' }}>
                  Your average session lasts {formatTime(analytics.avgSessionLength)} with {analytics.avgDistractionsPerSession.toFixed(1)} distractions
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              📋 Detailed Statistics
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Sessions Completed</TableCell>
                    <TableCell align="right">{analytics.completedSessions} / {analytics.totalSessions}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average Session Length</TableCell>
                    <TableCell align="right">{formatTime(analytics.avgSessionLength)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Focus Time</TableCell>
                    <TableCell align="right">{formatTime(analytics.totalFocusTime)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Productivity Score</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={analytics.productivityScore} 
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        {analytics.productivityScore}/100
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Distractions per Session</TableCell>
                    <TableCell align="right">{analytics.avgDistractionsPerSession.toFixed(1)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Most Common Distraction</TableCell>
                    <TableCell align="right">
                      {analytics.distractionAnalysis[0]?.name || 'None'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
} 