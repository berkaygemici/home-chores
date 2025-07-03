import React from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip
} from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Timer as FocusIcon,
  PlayCircle as SessionIcon,
  CheckCircle as CompletedIcon,
  Schedule as AvgIcon,
  TrendingUp as ProductivityIcon
} from '@mui/icons-material'
import { APP_COLORS } from '../constants/metricsConstants'

export default function FocusAnalyticsDashboard({ focusAnalytics, timeRange }) {
  if (!focusAnalytics) {
    return (
      <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Loading focus analytics...
      </Typography>
    )
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, progress }) => (
    <Card sx={{ 
      borderRadius: 3,
      border: '1px solid #e2e8f0',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ 
            bgcolor: `${color}20`, 
            borderRadius: 2, 
            p: 1.5 
          }}>
            <Icon sx={{ color, fontSize: 24 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {value}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {progress !== undefined && (
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                bgcolor: color,
                borderRadius: 3
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )

  // Generate focus time distribution data
  const timeDistribution = [
    { range: '0-25 min', count: focusAnalytics.dailyData.filter(d => d.totalTime < 25).length },
    { range: '25-50 min', count: focusAnalytics.dailyData.filter(d => d.totalTime >= 25 && d.totalTime < 50).length },
    { range: '50-100 min', count: focusAnalytics.dailyData.filter(d => d.totalTime >= 50 && d.totalTime < 100).length },
    { range: '100+ min', count: focusAnalytics.dailyData.filter(d => d.totalTime >= 100).length }
  ].filter(item => item.count > 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          🍅 Focus Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          FocusMaster insights for the last {timeRange} days
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={focusAnalytics.totalSessions}
            subtitle="Focus sessions started"
            icon={SessionIcon}
            color={APP_COLORS.focus}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={focusAnalytics.completedSessions}
            subtitle={`${focusAnalytics.completionRate.toFixed(1)}% completion rate`}
            icon={CompletedIcon}
            color="#10b981"
            progress={focusAnalytics.completionRate}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Focus Time"
            value={`${focusAnalytics.totalFocusTime}m`}
            subtitle="Total minutes focused"
            icon={FocusIcon}
            color={APP_COLORS.focus}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Session"
            value={`${focusAnalytics.avgSessionLength}m`}
            subtitle="Average session length"
            icon={AvgIcon}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4}>
        {/* Daily Focus Sessions */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                📈 Daily Focus Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={focusAnalytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="sessions"
                    stroke="#64748b" 
                    fontSize={12}
                    orientation="left"
                  />
                  <YAxis 
                    yAxisId="time"
                    stroke="#64748b" 
                    fontSize={12}
                    orientation="right"
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Total Time') return [`${value} min`, name]
                      return [value, name]
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    yAxisId="sessions"
                    type="monotone" 
                    dataKey="completed" 
                    stroke={APP_COLORS.focus}
                    strokeWidth={3}
                    dot={{ fill: APP_COLORS.focus, strokeWidth: 2, r: 4 }}
                    name="Completed Sessions"
                  />
                  <Line 
                    yAxisId="time"
                    type="monotone" 
                    dataKey="totalTime" 
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                    name="Total Time"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                ⏱️ Session Length Distribution
              </Typography>
              {timeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={timeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percent }) => percent > 0 ? `${range} ${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {timeDistribution.map((entry, index) => {
                        const colors = [APP_COLORS.focus, '#10b981', '#8b5cf6', '#ef4444']
                        return (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        )
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, 'Days']}
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
                    No sessions found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Session Progress Chart */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
            🎯 Session Completion vs Started
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={focusAnalytics.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="sessions" 
                fill="#f59e0b20" 
                stroke="#f59e0b"
                strokeWidth={2}
                name="Total Sessions"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="completed" 
                fill={APP_COLORS.focus} 
                name="Completed Sessions"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Focus Insights */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                🎪 Quick Insights
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Sessions per day average
                  </Typography>
                  <Chip 
                    label={`${(focusAnalytics.totalSessions / timeRange).toFixed(1)}`}
                    size="small"
                    sx={{ bgcolor: `${APP_COLORS.focus}20`, color: APP_COLORS.focus }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Focus time per day average
                  </Typography>
                  <Chip 
                    label={`${(focusAnalytics.totalFocusTime / timeRange).toFixed(1)}m`}
                    size="small"
                    sx={{ bgcolor: '#10b98120', color: '#059669' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Best day this period
                  </Typography>
                  <Chip 
                    label={focusAnalytics.dailyData.reduce((best, current) => 
                      current.totalTime > best.totalTime ? current : best, 
                      focusAnalytics.dailyData[0] || { date: 'N/A', totalTime: 0 }
                    ).date}
                    size="small"
                    sx={{ bgcolor: '#8b5cf620', color: '#7c3aed' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Productivity rating
                  </Typography>
                  <Chip 
                    label={
                      focusAnalytics.completionRate >= 80 ? 'Excellent 🔥' :
                      focusAnalytics.completionRate >= 60 ? 'Good 👍' :
                      focusAnalytics.completionRate >= 40 ? 'Average 📈' : 'Needs Work 💪'
                    }
                    size="small"
                    sx={{ 
                      bgcolor: focusAnalytics.completionRate >= 60 ? '#10b98120' : '#f59e0b20',
                      color: focusAnalytics.completionRate >= 60 ? '#059669' : '#d97706'
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                💡 Recommendations
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {focusAnalytics.completionRate < 60 && (
                  <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#92400e' }}>
                      💪 Try shorter sessions to improve completion rate
                    </Typography>
                  </Box>
                )}
                {focusAnalytics.avgSessionLength < 20 && (
                  <Box sx={{ p: 2, bgcolor: '#dbeafe', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#1e40af' }}>
                      ⏰ Consider extending sessions for deeper focus
                    </Typography>
                  </Box>
                )}
                {focusAnalytics.totalFocusTime / timeRange < 30 && (
                  <Box sx={{ p: 2, bgcolor: '#f3e8ff', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#7c3aed' }}>
                      📈 Aim for more daily focus time to boost productivity
                    </Typography>
                  </Box>
                )}
                {focusAnalytics.completionRate >= 80 && (
                  <Box sx={{ p: 2, bgcolor: '#d1fae5', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#065f46' }}>
                      🎉 Excellent focus! You're building great habits!
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
} 