import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Typography, Paper, IconButton, Chip, Grid, Card, CardContent, Stack, Avatar,
  Menu, MenuItem, Divider, Container, useTheme, useMediaQuery
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RestoreIcon from '@mui/icons-material/Restore'
import CloseIcon from '@mui/icons-material/Close'
import { format } from 'date-fns'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Project Modal Component
function ProjectModal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
    }
  }, [open])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim() })
    setName('')
    setDescription('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.35rem', color: '#2563eb' }}>
        Create New Project
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 99, fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim()}
          sx={{ borderRadius: 99, fontWeight: 600 }}
        >
          Create Project
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Task Modal Component
function TaskModal({ open, onClose, onSave, initial }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDescription(initial?.description || '')
    }
  }, [open, initial])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description: description.trim() })
    setTitle('')
    setDescription('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.35rem', color: '#2563eb' }}>
        {initial ? 'Edit Task' : 'Create New Task'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 99, fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!title.trim()}
          sx={{ borderRadius: 99, fontWeight: 600 }}
        >
          {initial ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Task Detail Modal Component (Jira-inspired)
function TaskDetailModal({ task, open, onClose, onUpdate, onDelete, onStatusChange }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
    }
  }, [task])

  const handleSave = () => {
    onUpdate({ title: title.trim(), description: description.trim() })
    setEditing(false)
  }

  const handleStatusChange = (newStatus) => {
    onStatusChange(task.id, newStatus)
    setAnchorEl(null)
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  if (!task) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e7ff',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32 }}>
            {task.title?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Task Details
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Title Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
              Title
            </Typography>
            {editing ? (
              <TextField
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                variant="outlined"
                autoFocus
              />
            ) : (
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  p: 1.5,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#f8fafc' }
                }}
                onClick={() => setEditing(true)}
              >
                {task.title}
              </Typography>
            )}
          </Box>

          {/* Status Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
              Status
            </Typography>
            <Chip
              label={task.status === 'todo' ? 'TO DO' : task.status === 'inprogress' ? 'IN PROGRESS' : 'DONE'}
              sx={{
                bgcolor: task.status === 'todo' ? '#fef3c7' : task.status === 'inprogress' ? '#dbeafe' : '#d1fae5',
                color: task.status === 'todo' ? '#92400e' : task.status === 'inprogress' ? '#1e40af' : '#065f46',
                fontWeight: 600
              }}
            />
          </Box>

          {/* Description Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
              Description
            </Typography>
            {editing ? (
              <TextField
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Add a description..."
              />
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  cursor: 'pointer',
                  minHeight: 80,
                  '&:hover': { bgcolor: '#f1f5f9' }
                }}
                onClick={() => setEditing(true)}
              >
                <Typography sx={{ color: description ? '#334155' : '#94a3b8' }}>
                  {description || 'Click to add a description...'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Created Date */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
              Created
            </Typography>
            <Typography sx={{ color: '#64748b' }}>
              {format(new Date(task.createdAt), 'MMM dd, yyyy • HH:mm')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        {editing ? (
          <>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save Changes</Button>
          </>
        ) : (
          <>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => {
                if (window.confirm('Delete this task?')) {
                  onDelete(task.id)
                  onClose()
                }
              }}
            >
              Delete
            </Button>
            <Button variant="outlined" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </>
        )}
      </DialogActions>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleStatusChange('todo')}>
          <RestoreIcon sx={{ mr: 1 }} />
          Move to TO DO
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('inprogress')}>
          <PlayArrowIcon sx={{ mr: 1 }} />
          Move to IN PROGRESS
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('done')}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Move to DONE
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (window.confirm('Delete this task?')) {
              onDelete(task.id)
              onClose()
            }
            setAnchorEl(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Task
        </MenuItem>
      </Menu>
    </Dialog>
  )
}

// Draggable Task Card Component
function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1.5,
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        },
        transition: 'all 0.2s ease'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600, 
            mb: 1,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            color: task.status === 'done' ? '#64748b' : '#1e293b'
          }}
        >
          {task.title}
        </Typography>
        {task.description && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b', 
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {task.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: '#2563eb', fontSize: '0.75rem' }}>
            {task.title?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {format(new Date(task.createdAt), 'MMM dd')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

// Droppable Column Component
function DroppableColumn({ id, children, isOver }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <Box 
      ref={setNodeRef}
      sx={{ 
        minHeight: 200, 
        p: 1,
        borderRadius: 2,
        backgroundColor: isOver ? '#f0f9ff' : '#fafafa',
        border: isOver ? '2px dashed #3b82f6' : '2px dashed transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </Box>
  )
}

export default function TaskMaster({ user, onBack }) {
  // TASKMASTER state
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [activeId, setActiveId] = useState(null)
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Load TASKMASTER projects from Firestore
  useEffect(() => {
    if (!user) {
      setProjects([])
      return
    }
    getDoc(doc(db, 'taskmaster_projects', user.uid)).then(projectSnap => {
      setProjects(projectSnap.exists() ? projectSnap.data().projects || [] : [])
    }).catch(() => {
      setProjects([])
    })
  }, [user])

  // TASKMASTER handlers
  const saveProjects = async (newProjects) => {
    if (!user) return
    await setDoc(doc(db, 'taskmaster_projects', user.uid), { projects: newProjects }, { merge: true })
    setProjects(newProjects)
  }

  const handleCreateProject = async (projectData) => {
    const newProject = {
      id: Date.now().toString(),
      name: projectData.name,
      description: projectData.description || '',
      createdAt: new Date().toISOString(),
      tasks: []
    }
    await saveProjects([...projects, newProject])
    setProjectModalOpen(false)
  }

  const handleDeleteProject = async (projectId) => {
    const newProjects = projects.filter(p => p.id !== projectId)
    await saveProjects(newProjects)
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
    }
  }

  const handleCreateTask = async (taskData) => {
    if (!selectedProject) return
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      createdAt: new Date().toISOString()
    }
    const updatedProject = {
      ...selectedProject,
      tasks: [...selectedProject.tasks, newTask]
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
    setTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (!selectedProject) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
  }

  const handleEditProjectTask = async (taskData) => {
    if (!selectedProject || !editingTask) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(task => 
        task.id === editingTask.id ? { ...task, title: taskData.title, description: taskData.description || '' } : task
      )
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
    setTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleDeleteProjectTask = async (taskId) => {
    if (!selectedProject) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.filter(task => task.id !== taskId)
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
  }

  // Drag and drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !selectedProject) return

    const taskId = active.id
    const newStatus = over.id

    if (newStatus === 'todo' || newStatus === 'inprogress' || newStatus === 'done') {
      handleUpdateTaskStatus(taskId, newStatus)
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  const handleTaskUpdate = async (taskData) => {
    if (!selectedProject || !selectedTask) return
    const updatedProject = {
      ...selectedProject,
      tasks: selectedProject.tasks.map(task => 
        task.id === selectedTask.id ? { ...task, title: taskData.title, description: taskData.description || '' } : task
      )
    }
    const newProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p)
    await saveProjects(newProjects)
    setSelectedProject(updatedProject)
    setSelectedTask({ ...selectedTask, ...taskData })
  }

  // TASKMASTER Implementation - Project list view
  if (!selectedProject) {
    return (
      <Container maxWidth={false} sx={{ 
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        py: 3,
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          mb: 4,
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2, fontWeight: 600 }}
              onClick={onBack}
            >
              Back to App
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewKanbanIcon sx={{ fontSize: 36, color: '#2563eb' }} />
              <Box>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: '#1e293b' }}>
                  TASKMASTER
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Manage your projects and track progress
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
            onClick={() => setProjectModalOpen(true)}
          >
            Create Project
          </Button>
        </Box>

        {projects.length === 0 ? (
          <Paper sx={{ 
            textAlign: 'center', 
            py: 8, 
            px: 4,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            bgcolor: '#fff'
          }}>
            <ViewKanbanIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 3 }} />
            <Typography variant="h5" sx={{ color: '#1e293b', mb: 2, fontWeight: 600 }}>
              No projects yet
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: 400, mx: 'auto' }}>
              Create your first project to start organizing tasks and tracking progress with our kanban-style board
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: 2, 
                fontWeight: 600,
                py: 1.5,
                px: 4,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
              onClick={() => setProjectModalOpen(true)}
            >
              Create Your First Project
            </Button>
          </Paper>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 3
          }}>
            {projects.map((project) => (
              <Card 
                key={project.id}
                sx={{ 
                  borderRadius: 3, 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                  transition: 'all 0.2s ease', 
                  '&:hover': { 
                    transform: 'translateY(-2px)', 
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)' 
                  },
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#2563eb', width: 40, height: 40 }}>
                      {project.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {project.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Delete this project and all its tasks?')) {
                          handleDeleteProject(project.id)
                        }
                      }}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {project.description && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#64748b', 
                        mb: 3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 40
                      }}
                    >
                      {project.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                    <Chip 
                      size="small" 
                      label={`${project.tasks?.filter(t => t.status === 'todo').length || 0} To Do`} 
                      sx={{ 
                        bgcolor: '#fef2f2', 
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        height: 24
                      }} 
                    />
                    <Chip 
                      size="small" 
                      label={`${project.tasks?.filter(t => t.status === 'inprogress').length || 0} In Progress`} 
                      sx={{ 
                        bgcolor: '#fffbeb', 
                        color: '#f59e0b',
                        fontSize: '0.75rem',
                        height: 24
                      }} 
                    />
                    <Chip 
                      size="small" 
                      label={`${project.tasks?.filter(t => t.status === 'done').length || 0} Done`} 
                      sx={{ 
                        bgcolor: '#f0fdf4', 
                        color: '#10b981',
                        fontSize: '0.75rem',
                        height: 24
                      }} 
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      borderRadius: 2, 
                      fontWeight: 600,
                      bgcolor: '#2563eb',
                      '&:hover': { bgcolor: '#1d4ed8' }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProject(project)
                    }}
                  >
                    Open Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <ProjectModal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          onSave={handleCreateProject}
        />
      </Container>
    )
  }

  // Kanban board view for selected project
  const todoTasks = selectedProject.tasks.filter(task => task.status === 'todo')
  const inProgressTasks = selectedProject.tasks.filter(task => task.status === 'inprogress')
  const doneTasks = selectedProject.tasks.filter(task => task.status === 'done')

  const activeTask = activeId ? selectedProject.tasks.find(task => task.id === activeId) : null

  return (
    <Container maxWidth={false} sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      py: 3,
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        mb: 4,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
            onClick={() => setSelectedProject(null)}
          >
            Back to Projects
          </Button>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: '#1e293b' }}>
              {selectedProject.name}
            </Typography>
            {selectedProject.description && (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {selectedProject.description}
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ 
            borderRadius: 2, 
            fontWeight: 600,
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }
          }}
          onClick={() => {
            setEditingTask(null)
            setTaskModalOpen(true)
          }}
        >
          Create Task
        </Button>
      </Box>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 3,
          minHeight: 'calc(100vh - 200px)'
        }}>
          {/* TO DO Column */}
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: '#fff',
              borderRadius: 3, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444' }}>
                TO DO
              </Typography>
              <Chip 
                label={todoTasks.length} 
                size="small"
                sx={{ 
                  bgcolor: '#fef2f2', 
                  color: '#ef4444',
                  fontWeight: 600,
                  minWidth: 24
                }}
              />
            </Box>
            
            <DroppableColumn id="todo" isOver={false}>
              <SortableContext items={todoTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {todoTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
          </Paper>

          {/* IN PROGRESS Column */}
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: '#fff',
              borderRadius: 3, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                IN PROGRESS
              </Typography>
              <Chip 
                label={inProgressTasks.length} 
                size="small"
                sx={{ 
                  bgcolor: '#fffbeb', 
                  color: '#f59e0b',
                  fontWeight: 600,
                  minWidth: 24
                }}
              />
            </Box>
            
            <DroppableColumn id="inprogress" isOver={false}>
              <SortableContext items={inProgressTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {inProgressTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
          </Paper>

          {/* DONE Column */}
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: '#fff',
              borderRadius: 3, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                DONE
              </Typography>
              <Chip 
                label={doneTasks.length} 
                size="small"
                sx={{ 
                  bgcolor: '#f0fdf4', 
                  color: '#10b981',
                  fontWeight: 600,
                  minWidth: 24
                }}
              />
            </Box>
            
            <DroppableColumn id="done" isOver={false}>
              <SortableContext items={doneTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {doneTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
          </Paper>
        </Box>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setEditingTask(null)
        }}
        onSave={editingTask ? handleEditProjectTask : handleCreateTask}
        initial={editingTask}
      />

      <TaskDetailModal
        task={selectedTask}
        open={taskDetailOpen}
        onClose={() => {
          setTaskDetailOpen(false)
          setSelectedTask(null)
        }}
        onUpdate={handleTaskUpdate}
        onDelete={handleDeleteProjectTask}
        onStatusChange={handleUpdateTaskStatus}
      />
    </Container>
  )
} 