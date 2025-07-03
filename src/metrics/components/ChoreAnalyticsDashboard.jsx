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
  Home as ChoreIcon,
  CheckCircle as CompletedIcon,
  Schedule as FrequencyIcon,
  Room as SectionIcon
} from '@mui/icons-material'
import { APP_COLORS } from '../constants/metricsConstants'

const SECTION_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
  '#ef4444', '#06b6d4', '#84cc16', '#f97316'
]

export default function ChoreAnalyticsDashboard({ choreAnalytics, timeRange }) {
  if (!choreAnalytics) {
    return (
      <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Loading chore analytics...
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

  // Prepare section data for charts
  const sectionData = Object.entries(choreAnalytics.sectionStats).map(([section, stats], index) => ({
    name: section,
    total: stats.total,
    completed: stats.completed,
    completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    color: SECTION_COLORS[index % SECTION_COLORS.length]
  }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          🧹 Chore Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          ChoresMaster insights for the last {timeRange} days
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Chores"
            value={choreAnalytics.totalChores}
            subtitle="Chores being tracked"
            icon={ChoreIcon}
            color={APP_COLORS.chores}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completions"
            value={choreAnalytics.totalCompletions}
            subtitle={`${choreAnalytics.completionRate.toFixed(1)}% completion rate`}
            icon={CompletedIcon}
            color="#10b981"
            progress={choreAnalytics.completionRate}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sections"
            value={Object.keys(choreAnalytics.sectionStats).length}
            subtitle="Home areas tracked"
            icon={SectionIcon}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Daily Average"
            value={`${(choreAnalytics.totalCompletions / timeRange).toFixed(1)}`}
            subtitle="Chores completed per day"
            icon={FrequencyIcon}
            color="#f59e0b"
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
                📈 Daily Completion Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={choreAnalytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="count"
                    stroke="#64748b" 
                    fontSize={12}
                    orientation="left"
                  />
                  <YAxis 
                    yAxisId="rate"
                    stroke="#64748b" 
                    fontSize={12}
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Completion Rate') return [`${value.toFixed(1)}%`, name]
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
                    yAxisId="count"
                    type="monotone" 
                    dataKey="completed" 
                    stroke={APP_COLORS.chores}
                    strokeWidth={3}
                    dot={{ fill: APP_COLORS.chores, strokeWidth: 2, r: 4 }}
                    name="Completed"
                  />
                  <Line 
                    yAxisId="rate"
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                    name="Completion Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Section Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                🏠 Section Distribution
              </Typography>
              {sectionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sectionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {sectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, 'Total chores']}
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
                    No sections found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section Performance */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
            📊 Section Performance
          </Typography>
          
          {sectionData.length > 0 ? (
            <>
              {/* Bar Chart */}
              <Box sx={{ mb: 4 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectionData}>
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
                      fill={APP_COLORS.chores}
                      name="Completed"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="#e2e8f0"
                      name="Total"
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
                      <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Total Chores</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Completed</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Completion Rate</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sectionData.map((section) => (
                      <TableRow key={section.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%',
                              bgcolor: section.color
                            }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {section.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{section.total}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={section.completed} 
                            size="small" 
                            sx={{ bgcolor: `${APP_COLORS.chores}20`, color: '#059669' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${section.completionRate.toFixed(1)}%`}
                            size="small"
                            sx={{ 
                              bgcolor: section.completionRate >= 50 ? '#10b98120' : '#f59e0b20',
                              color: section.completionRate >= 50 ? '#059669' : '#d97706'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={section.completionRate}
                              sx={{ 
                                flexGrow: 1, 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: section.color,
                                  borderRadius: 3
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'right' }}>
                              {section.completionRate.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
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
              <ChoreIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6">No chores found</Typography>
              <Typography variant="body2">Create some chores in ChoresMaster to see analytics</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                🏆 Top Performing Sections
              </Typography>
              {sectionData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sectionData
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .slice(0, 3)
                    .map((section, index) => (
                      <Box key={section.name} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2,
                        bgcolor: index === 0 ? '#fef3c7' : index === 1 ? '#e5e7eb' : '#f3f4f6',
                        borderRadius: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ 
                            color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                            fontWeight: 700
                          }}>
                            #{index + 1}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {section.name}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${section.completionRate.toFixed(1)}%`}
                          size="small"
                          sx={{ 
                            bgcolor: `${section.color}20`,
                            color: section.color,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>
                  No data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                💡 Insights & Tips
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {choreAnalytics.completionRate < 50 && (
                  <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#92400e' }}>
                      💪 Try breaking down larger chores into smaller, manageable tasks
                    </Typography>
                  </Box>
                )}
                {choreAnalytics.completionRate >= 80 && (
                  <Box sx={{ p: 2, bgcolor: '#d1fae5', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#065f46' }}>
                      🎉 Excellent work! Your home is well-maintained!
                    </Typography>
                  </Box>
                )}
                <Box sx={{ p: 2, bgcolor: '#dbeafe', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#1e40af' }}>
                    📅 Most active day: {choreAnalytics.dailyData.reduce((best, current) => 
                      current.completed > best.completed ? current : best, 
                      choreAnalytics.dailyData[0] || { date: 'N/A' }
                    ).date}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#f3e8ff', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#7c3aed' }}>
                    🏠 Focus on: {sectionData.length > 0 ? 
                      sectionData.sort((a, b) => a.completionRate - b.completionRate)[0]?.name || 'All sections'
                      : 'Create some chores to get started!'
                    }
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
} 