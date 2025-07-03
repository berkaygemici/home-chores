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
  Chip
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Assignment as TaskIcon,
  TrendingUp as TrendIcon,
  Warning as WarningIcon,
  CheckCircle as CompletedIcon
} from '@mui/icons-material'
import { APP_COLORS, CHART_COLORS } from '../constants/metricsConstants'

export default function TaskAnalyticsDashboard({ taskAnalytics, timeRange }) {
  if (!taskAnalytics) {
    return (
      <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Loading task analytics...
      </Typography>
    )
  }

  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b', 
    high: '#ef4444',
    urgent: '#dc2626'
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          ✅ Task Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          TaskMaster insights for the last {timeRange} days
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tasks"
            value={taskAnalytics.totalTasks}
            subtitle="All tracked tasks"
            icon={TaskIcon}
            color={APP_COLORS.tasks}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={taskAnalytics.completedTasks}
            subtitle={`${taskAnalytics.completionRate.toFixed(1)}% completion rate`}
            icon={CompletedIcon}
            color="#10b981"
            progress={taskAnalytics.completionRate}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={taskAnalytics.inProgressTasks}
            subtitle="Currently being worked on"
            icon={TrendIcon}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="To Do"
            value={taskAnalytics.todoTasks}
            subtitle="Waiting to be started"
            icon={WarningIcon}
            color="#6b7280"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4}>
        {/* Daily Completion Trend */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                📈 Daily Task Completion
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={taskAnalytics.dailyData}>
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
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke={APP_COLORS.tasks}
                    strokeWidth={3}
                    dot={{ fill: APP_COLORS.tasks, strokeWidth: 2, r: 4 }}
                    name="Tasks Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                🎯 Priority Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={taskAnalytics.priorityStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ priority, percent }) => percent > 0 ? `${priority} ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {taskAnalytics.priorityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={priorityColors[entry.priority]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, `${name} priority`]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project Breakdown */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
            📁 Project Breakdown
          </Typography>
          
          {taskAnalytics.projectStats.length > 0 ? (
            <>
              {/* Bar Chart */}
              <Box sx={{ mb: 4 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskAnalytics.projectStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
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
                      dataKey="completed" 
                      stackId="a" 
                      fill="#10b981" 
                      name="Completed"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar 
                      dataKey="inProgress" 
                      stackId="a" 
                      fill="#f59e0b" 
                      name="In Progress"
                    />
                    <Bar 
                      dataKey="todo" 
                      stackId="a" 
                      fill="#6b7280" 
                      name="To Do"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Completed</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>In Progress</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>To Do</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taskAnalytics.projectStats.map((project) => {
                      const completionRate = project.total > 0 ? (project.completed / project.total) * 100 : 0
                      return (
                        <TableRow key={project.name}>
                          <TableCell sx={{ fontWeight: 500 }}>{project.name}</TableCell>
                          <TableCell align="center">{project.total}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={project.completed} 
                              size="small" 
                              sx={{ bgcolor: '#10b98120', color: '#059669' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={project.inProgress} 
                              size="small" 
                              sx={{ bgcolor: '#f59e0b20', color: '#d97706' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={project.todo} 
                              size="small" 
                              sx={{ bgcolor: '#6b728020', color: '#4b5563' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={completionRate}
                                sx={{ 
                                  flexGrow: 1, 
                                  height: 6, 
                                  borderRadius: 3,
                                  bgcolor: '#e2e8f0',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: '#10b981',
                                    borderRadius: 3
                                  }
                                }}
                              />
                              <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'right' }}>
                                {completionRate.toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4, 
              color: '#64748b' 
            }}>
              <TaskIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6">No projects found</Typography>
              <Typography variant="body2">Create some projects in TaskMaster to see analytics</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
} 