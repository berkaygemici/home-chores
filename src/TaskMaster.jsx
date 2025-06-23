import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Typography, Paper, IconButton, Chip, Grid, Card, CardContent, Stack
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { format } from 'date-fns'

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

export default function TaskMaster({ user, onBack }) {
  // TASKMASTER state
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

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

  // TASKMASTER Implementation - Project list view
  if (!selectedProject) {
    return (
      <Box sx={{ bgcolor: 'linear-gradient(120deg, #f5f7fa 60%, #e3f0ff 100%)', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: '100vh' }}>
          <Paper elevation={4} sx={{ maxWidth: 1200, width: '100%', mx: 'auto', p: { xs: 2, sm: 4 }, borderRadius: 5, boxShadow: '0 8px 32px #2563eb22' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  sx={{ borderRadius: 99, fontWeight: 600 }}
                  onClick={onBack}
                >
                  Back to Home
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewKanbanIcon fontSize="large" />
                  TASKMASTER
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ borderRadius: 99, fontWeight: 600 }}
                onClick={() => setProjectModalOpen(true)}
              >
                New Project
              </Button>
            </Box>

            {projects.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FolderIcon sx={{ fontSize: 64, color: '#64748b', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>No projects yet</Typography>
                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>Create your first project to get started with TASKMASTER</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 99, fontWeight: 600 }}
                  onClick={() => setProjectModalOpen(true)}
                >
                  Create Project
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {projects.map((project) => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        cursor: 'pointer', 
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(37, 99, 235, 0.15)' },
                        transition: 'all 0.2s ease-in-out',
                        borderRadius: 3
                      }}
                      onClick={() => setSelectedProject(project)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2563eb' }}>
                            {project.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            sx={{ color: '#ef4444' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm('Are you sure you want to delete this project?')) {
                                handleDeleteProject(project.id)
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2, minHeight: 40 }}>
                          {project.description || 'No description'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={`${project.tasks?.length || 0} tasks`} 
                            size="small" 
                            sx={{ bgcolor: '#e0e7ff', color: '#2563eb', fontWeight: 600 }}
                          />
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <ProjectModal
              open={projectModalOpen}
              onClose={() => setProjectModalOpen(false)}
              onSave={handleCreateProject}
            />
          </Paper>
        </Box>
      </Box>
    )
  }

  // Kanban board view for selected project
  const todoTasks = selectedProject.tasks.filter(task => task.status === 'todo')
  const inProgressTasks = selectedProject.tasks.filter(task => task.status === 'inprogress')
  const doneTasks = selectedProject.tasks.filter(task => task.status === 'done')

  return (
    <Box sx={{ bgcolor: 'linear-gradient(120deg, #f5f7fa 60%, #e3f0ff 100%)', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: '100vh' }}>
        <Paper elevation={4} sx={{ maxWidth: 1400, width: '100%', mx: 'auto', p: { xs: 2, sm: 4 }, borderRadius: 5, boxShadow: '0 8px 32px #2563eb22' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                sx={{ borderRadius: 99, fontWeight: 600 }}
                onClick={() => setSelectedProject(null)}
              >
                Back to Projects
              </Button>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563eb' }}>
                {selectedProject.name}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 99, fontWeight: 600 }}
              onClick={() => {
                setEditingTask(null)
                setTaskModalOpen(true)
              }}
            >
              Add Task
            </Button>
          </Box>

          {selectedProject.description && (
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4, fontStyle: 'italic' }}>
              {selectedProject.description}
            </Typography>
          )}

          <Grid container spacing={3}>
            {/* Todo Column */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 3, minHeight: 400 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#92400e', mb: 2, textAlign: 'center' }}>
                  TO DO ({todoTasks.length})
                </Typography>
                <Stack spacing={2}>
                  {todoTasks.map((task) => (
                    <Card key={task.id} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                            {task.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" onClick={() => handleUpdateTaskStatus(task.id, 'inprogress')}>
                            Start
                          </Button>
                          <Button size="small" onClick={() => {
                            setEditingTask(task)
                            setTaskModalOpen(true)
                          }}>
                            Edit
                          </Button>
                          <Button size="small" color="error" onClick={() => {
                            if (window.confirm('Delete this task?')) {
                              handleDeleteProjectTask(task.id)
                            }
                          }}>
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* In Progress Column */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: '#dbeafe', borderRadius: 3, minHeight: 400 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af', mb: 2, textAlign: 'center' }}>
                  IN PROGRESS ({inProgressTasks.length})
                </Typography>
                <Stack spacing={2}>
                  {inProgressTasks.map((task) => (
                    <Card key={task.id} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                            {task.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" onClick={() => handleUpdateTaskStatus(task.id, 'todo')}>
                            Back
                          </Button>
                          <Button size="small" onClick={() => handleUpdateTaskStatus(task.id, 'done')}>
                            Done
                          </Button>
                          <Button size="small" onClick={() => {
                            setEditingTask(task)
                            setTaskModalOpen(true)
                          }}>
                            Edit
                          </Button>
                          <Button size="small" color="error" onClick={() => {
                            if (window.confirm('Delete this task?')) {
                              handleDeleteProjectTask(task.id)
                            }
                          }}>
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* Done Column */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: '#d1fae5', borderRadius: 3, minHeight: 400 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#065f46', mb: 2, textAlign: 'center' }}>
                  DONE ({doneTasks.length})
                </Typography>
                <Stack spacing={2}>
                  {doneTasks.map((task) => (
                    <Card key={task.id} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.8 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, textDecoration: 'line-through' }}>
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                            {task.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" onClick={() => handleUpdateTaskStatus(task.id, 'inprogress')}>
                            Reopen
                          </Button>
                          <Button size="small" color="error" onClick={() => {
                            if (window.confirm('Delete this task?')) {
                              handleDeleteProjectTask(task.id)
                            }
                          }}>
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <TaskModal
            open={taskModalOpen}
            onClose={() => {
              setTaskModalOpen(false)
              setEditingTask(null)
            }}
            onSave={editingTask ? handleEditProjectTask : handleCreateTask}
            initial={editingTask}
          />
        </Paper>
      </Box>
    </Box>
  )
} 