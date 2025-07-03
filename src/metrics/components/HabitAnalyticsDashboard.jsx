import React from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
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
  Cell,
  BarChart,
  Bar
} from 'recharts'
import {
  Favorite as HabitIcon,
  LocalFireDepartment as StreakIcon,
  TrendingUp as ConsistencyIcon,
  Category as CategoryIcon,
  EmojiEvents as AchievementIcon
} from '@mui/icons-material'
import { APP_COLORS, CHART_COLORS } from '../constants/metricsConstants'

const HABIT_CATEGORY_COLORS = {
  health: '#10b981',
  learning: '#3b82f6', 
  productivity: '#8b5cf6',
  mindfulness: '#06b6d4',
  social: '#f59e0b',
  creativity: '#ef4444',
  lifestyle: '#84cc16',
  other: '#6b7280'
}

export default function HabitAnalyticsDashboard({ habitAnalytics, timeRange }) {
  if (!habitAnalytics) {
    return (
      <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Loading habit analytics...
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

  // Prepare category data for pie chart
  const categoryData = Object.entries(habitAnalytics.categoryStats).map(([category, stats]) => ({
    name: category,
    value: stats.total,
    color: HABIT_CATEGORY_COLORS[category] || HABIT_CATEGORY_COLORS.other
  }))

  // Get top streaks
  const topStreaks = habitAnalytics.habitStreaks
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 5)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          🎯 Habit Analytics  
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          HabitMaster insights for the last {timeRange} days
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Habits"
            value={habitAnalytics.totalHabits}
            subtitle="Habits being tracked"
            icon={HabitIcon}
            color={APP_COLORS.habits}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Max Streak"
            value={`${habitAnalytics.maxStreak} days`}
            subtitle="Longest current streak"
            icon={StreakIcon}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Streak"
            value={`${habitAnalytics.avgStreak} days`}
            subtitle="Across all habits"
            icon={StreakIcon}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Consistency"
            value={`${habitAnalytics.overallConsistency.toFixed(1)}%`}
            subtitle="Overall completion rate"
            icon={ConsistencyIcon}
            color="#10b981"
            progress={habitAnalytics.overallConsistency}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4}>
        {/* Daily Completion Rate */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                📈 Daily Completion Rate
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={habitAnalytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke={APP_COLORS.habits}
                    strokeWidth={3}
                    dot={{ fill: APP_COLORS.habits, strokeWidth: 2, r: 4 }}
                    name="Completion Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                🏷️ Category Distribution
              </Typography>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, `${name} habits`]}
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
                    No habits found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Streak Leaderboard */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                🏆 Top Streaks
              </Typography>
              {topStreaks.length > 0 ? (
                <List>
                  {topStreaks.map((habit, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box sx={{ 
                          bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#e2e8f0',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            #{index + 1}
                          </Typography>
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={habit.name}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip 
                              label={`${habit.currentStreak} days`}
                              size="small"
                              sx={{ bgcolor: '#f59e0b20', color: '#d97706' }}
                            />
                            <Chip 
                              label={habit.category}
                              size="small"
                              sx={{ 
                                bgcolor: `${HABIT_CATEGORY_COLORS[habit.category] || HABIT_CATEGORY_COLORS.other}20`,
                                color: HABIT_CATEGORY_COLORS[habit.category] || HABIT_CATEGORY_COLORS.other
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: '#64748b' 
                }}>
                  <AchievementIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">No streaks yet</Typography>
                  <Typography variant="body2">Start completing habits to build streaks!</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Category Details */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                📊 Category Breakdown
              </Typography>
              {Object.keys(habitAnalytics.categoryStats).length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Total</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Active</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(habitAnalytics.categoryStats).map(([category, stats]) => {
                        const activeRate = stats.total > 0 ? (stats.active / stats.total) * 100 : 0
                        return (
                          <TableRow key={category}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%',
                                  bgcolor: HABIT_CATEGORY_COLORS[category] || HABIT_CATEGORY_COLORS.other
                                }} />
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {category}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">{stats.total}</TableCell>
                            <TableCell align="center">{stats.active}</TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={`${activeRate.toFixed(0)}%`}
                                size="small"
                                sx={{ 
                                  bgcolor: activeRate > 50 ? '#10b98120' : '#f59e0b20',
                                  color: activeRate > 50 ? '#059669' : '#d97706'
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: '#64748b' 
                }}>
                  <CategoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">No categories found</Typography>
                  <Typography variant="body2">Create some habits to see category breakdown</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
} 