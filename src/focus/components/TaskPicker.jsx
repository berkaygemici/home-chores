import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FlagIcon from '@mui/icons-material/Flag'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WorkIcon from '@mui/icons-material/Work'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import TimerIcon from '@mui/icons-material/Timer'
import FolderIcon from '@mui/icons-material/Folder'
import RefreshIcon from '@mui/icons-material/Refresh'

import { TASK_PRIORITIES } from '../constants/focusConstants'
import { 
  getTaskPriorityConfig, 
  getTaskProgress,
  estimateTaskTime,
  sortTasksByPriority,
  searchTasks,
  filterTasksByStatus
} from '../utils/taskUtils'

export default function TaskPicker({ 
  tasks, 
  currentTask,
  projects,
  onTaskSelect, 
  onCreateTask,
  onRefreshTasks,
  loading = false,
  disabled = false
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTasks, setFilteredTasks] = useState([])
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState('all') // 'all', 'taskmaster', 'focusmaster'
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedPomodoros: 1,
    projectId: '',
    addToTaskMaster: true
  })

  // Filter and search tasks
  useEffect(() => {
    let filtered = tasks

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(task => task.source === selectedSource)
    }

    // Filter by status (only todo and inprogress tasks)
    filtered = filterTasksByStatus(filtered, 'todo')
      .concat(filterTasksByStatus(filtered, 'inprogress'))

    // Apply search
    if (searchQuery.trim()) {
      filtered = searchTasks(filtered, searchQuery)
    }

    // Sort by priority
    filtered = sortTasksByPriority(filtered)

    setFilteredTasks(filtered)
  }, [tasks, searchQuery, selectedSource])

  const handleCreateTask = () => {
    if (!taskForm.title.trim()) return

    const newTask = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      priority: taskForm.priority,
      estimatedPomodoros: parseInt(taskForm.estimatedPomodoros) || 1,
      projectId: taskForm.addToTaskMaster ? taskForm.projectId : null,
      addToTaskMaster: taskForm.addToTaskMaster
    }

    onCreateTask(newTask)
    setNewTaskModalOpen(false)
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      estimatedPomodoros: 1,
      projectId: '',
      addToTaskMaster: true
    })
  }

  const getTaskStatusColor = (task) => {
    switch (task.status) {
      case 'todo': return '#3b82f6'
      case 'inprogress': return '#f59e0b'
      case 'done': return '#10b981'
      default: return '#64748b'
    }
  }

  const availableProjects = projects.filter(p => p.tasks)

  return (
    <>
      <Paper sx={{ 
        p: 3, 
        borderRadius: 4, 
        border: disabled ? '1px solid #d1d5db' : '1px solid #e2e8f0',
        background: disabled 
          ? 'linear-gradient(135deg, #f9fafb, #f3f4f6)' 
          : 'linear-gradient(135deg, #ffffff, #f8fafc)',
        opacity: disabled ? 0.7 : 1,
        position: 'relative'
      }}>
        {/* Disabled Overlay */}
        {disabled && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(2px)',
            borderRadius: 4,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: '#8b5cf6',
              textAlign: 'center'
            }}>
              🧘‍♂️ Focus Mode Active
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#64748b',
              textAlign: 'center',
              maxWidth: 250
            }}>
              Task selection is disabled during focus sessions. Complete your current session first!
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              🎯 Choose Your Focus Task
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh Tasks">
                <IconButton 
                  onClick={onRefreshTasks}
                  disabled={loading || disabled}
                  size="small"
                  sx={{ 
                    bgcolor: '#f1f5f9',
                    '&:hover': { bgcolor: '#e2e8f0' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setNewTaskModalOpen(true)}
                disabled={disabled}
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  bgcolor: '#8b5cf6',
                  '&:hover': { bgcolor: '#7c3aed' },
                  '&:disabled': {
                    bgcolor: '#d1d5db',
                    color: '#9ca3af'
                  }
                }}
              >
                New Task
              </Button>
            </Stack>
          </Box>

          {/* Search and Filters */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                )
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Source</InputLabel>
              <Select
                value={selectedSource}
                label="Source"
                onChange={(e) => setSelectedSource(e.target.value)}
                disabled={disabled}
              >
                <MenuItem value="all">All Tasks</MenuItem>
                <MenuItem value="taskmaster">TaskMaster</MenuItem>
                <MenuItem value="focusmaster">FocusMaster</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Task Stats */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip 
              label={`${filteredTasks.length} Available`} 
              size="small" 
              sx={{ bgcolor: '#dbeafe', color: '#1e40af' }}
            />
            <Chip 
              label={`${tasks.filter(t => t.source === 'taskmaster').length} from TaskMaster`} 
              size="small" 
              sx={{ bgcolor: '#dcfce7', color: '#166534' }}
            />
            <Chip 
              label={`${tasks.filter(t => t.source === 'focusmaster').length} Focus-only`} 
              size="small" 
              sx={{ bgcolor: '#fae8ff', color: '#86198f' }}
            />
          </Box>
        </Box>

        {/* Current Task Display */}
        {currentTask && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 3,
                bgcolor: '#f0f9ff',
                border: '1px solid #bae6fd'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Currently focusing on: {currentTask.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Progress: {currentTask.completedPomodoros || 0}/{currentTask.estimatedPomodoros || 1} pomodoros
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => onTaskSelect(null)}
                  disabled={disabled}
                  sx={{ 
                    color: disabled ? '#9ca3af' : '#64748b',
                    '&:disabled': {
                      color: '#9ca3af'
                    }
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Task List */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Loading tasks...
            </Typography>
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
              {searchQuery ? 'No tasks found' : 'No tasks available'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Create your first task or import from TaskMaster'
              }
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setNewTaskModalOpen(true)}
              sx={{ borderRadius: 3 }}
            >
              Create Task
            </Button>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredTasks.map((task, index) => {
              const priorityConfig = getTaskPriorityConfig(task.priority)
              const progress = getTaskProgress(task)
              const estimatedTime = estimateTaskTime(task)
              const isSelected = currentTask?.id === task.id

              return (
                <ListItem key={task.id} sx={{ p: 0, mb: 1 }}>
                  <ListItemButton
                    onClick={() => onTaskSelect(task)}
                    disabled={isSelected || disabled}
                    sx={{
                      borderRadius: 3,
                      border: isSelected ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                      bgcolor: isSelected ? '#f3f4f6' : 'white',
                      '&:hover': {
                        bgcolor: isSelected ? '#f3f4f6' : '#f8fafc',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&:disabled': {
                        bgcolor: '#f9fafb',
                        color: '#9ca3af'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                      {isSelected ? (
                        <CheckCircleIcon sx={{ color: '#8b5cf6' }} />
                      ) : (
                        <PlayArrowIcon sx={{ color: '#64748b' }} />
                      )}
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: 600, 
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 300
                          }}>
                            {task.title}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              icon={<FlagIcon />}
                              label={priorityConfig.label}
                              size="small"
                              sx={{
                                bgcolor: priorityConfig.bgcolor,
                                color: priorityConfig.color,
                                fontWeight: 600,
                                '& .MuiChip-icon': { color: priorityConfig.color }
                              }}
                            />
                            {task.source === 'taskmaster' && (
                              <Chip
                                icon={<WorkIcon />}
                                label={task.projectName || 'TaskMaster'}
                                size="small"
                                sx={{ bgcolor: '#dcfce7', color: '#166534' }}
                              />
                            )}
                          </Stack>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimerIcon sx={{ fontSize: 16, color: '#64748b' }} />
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {estimatedTime}min est.
                              </Typography>
                            </Box>
                            {progress > 0 && (
                              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                                {progress}% complete
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ 
                              color: getTaskStatusColor(task),
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}>
                              {task.status}
                            </Typography>
                          </Stack>
                          {task.description && (
                            <Typography variant="caption" sx={{ 
                              color: '#64748b',
                              display: 'block',
                              mt: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </Paper>

      {/* New Task Modal */}
      <Dialog 
        open={newTaskModalOpen} 
        onClose={() => setNewTaskModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 3,
            bgcolor: '#ffffff',
            boxShadow: '0 12px 40px rgba(139, 92, 246, 0.15)'
          } 
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          color: '#ffffff',
          fontWeight: 700,
          borderRadius: '12px 12px 0 0'
        }}>
          ✨ Create New Task
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title *"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="What needs to be done?"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#ffffff',
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                  },
                  '& .MuiInputLabel-root': { color: '#374151' },
                  '& .MuiInputBase-input': { color: '#111827' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Add more details about this task..."
                multiline
                rows={3}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#ffffff',
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                  },
                  '& .MuiInputLabel-root': { color: '#374151' },
                  '& .MuiInputBase-input': { color: '#111827' }
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#ffffff',
                  '& fieldset': { borderColor: '#d1d5db' },
                  '&:hover fieldset': { borderColor: '#8b5cf6' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                },
                '& .MuiInputLabel-root': { color: '#374151' }
              }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  label="Priority"
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  sx={{ color: '#111827' }}
                >
                  {TASK_PRIORITIES.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlagIcon sx={{ color: priority.color, fontSize: 16 }} />
                        <Typography sx={{ color: '#111827' }}>{priority.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Estimated Pomodoros"
                type="number"
                value={taskForm.estimatedPomodoros}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedPomodoros: e.target.value })}
                inputProps={{ min: 1, max: 20 }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#ffffff',
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                  },
                  '& .MuiInputLabel-root': { color: '#374151' },
                  '& .MuiInputBase-input': { color: '#111827' }
                }}
              />
            </Grid>

            {taskForm.addToTaskMaster && availableProjects.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#ffffff',
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                  },
                  '& .MuiInputLabel-root': { color: '#374151' }
                }}>
                  <InputLabel>Project (TaskMaster)</InputLabel>
                  <Select
                    value={taskForm.projectId}
                    label="Project (TaskMaster)"
                    onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                    sx={{ color: '#111827' }}
                  >
                    {availableProjects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FolderIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
                          <Typography sx={{ color: '#111827' }}>{project.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant={taskForm.addToTaskMaster ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setTaskForm({ ...taskForm, addToTaskMaster: !taskForm.addToTaskMaster })}
                    sx={{ 
                      bgcolor: taskForm.addToTaskMaster ? '#10b981' : 'transparent',
                      borderColor: '#10b981',
                      color: taskForm.addToTaskMaster ? 'white' : '#10b981',
                      '&:hover': { 
                        bgcolor: taskForm.addToTaskMaster ? '#059669' : '#f0fdf4' 
                      }
                    }}
                  >
                    {taskForm.addToTaskMaster ? 'Adding to TaskMaster' : 'Focus-only task'}
                  </Button>
                  <Typography variant="caption" sx={{ color: '#0369a1' }}>
                    {taskForm.addToTaskMaster 
                      ? 'This task will be synced with TaskMaster'
                      : 'This task will only exist in FocusMaster'
                    }
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, bgcolor: '#ffffff' }}>
          <Button 
            onClick={() => setNewTaskModalOpen(false)}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              color: '#64748b',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTask}
            disabled={!taskForm.title.trim()}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: '#8b5cf6',
              color: '#ffffff',
              '&:hover': { bgcolor: '#7c3aed' },
              '&:disabled': { bgcolor: '#d1d5db', color: '#9ca3af' }
            }}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 