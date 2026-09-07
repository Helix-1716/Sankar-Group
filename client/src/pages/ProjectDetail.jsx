import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import ProgressBar from '../components/ProgressBar';
import Avatar from '../components/Avatar';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium', assigneeId: '', dueDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProject(); loadUsers(); }, [id]);

  const loadProject = async () => {
    try {
      const data = await api.getProject(id);
      setProject(data);
    } catch (err) {
      console.error('Load project error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Load users error:', err);
    }
  };

  const openCreateTask = (status = 'todo') => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', status, priority: 'medium', assigneeId: '', dueDate: '' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...taskForm,
        assigneeId: taskForm.assigneeId || null,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
      };
      if (editingTask) {
        await api.updateTask(id, editingTask.id, payload);
      } else {
        await api.createTask(id, payload);
      }
      setShowTaskModal(false);
      loadProject();
    } catch (err) {
      console.error('Save task error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.deleteTask(id, task.id);
      loadProject();
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const fromStatus = e.dataTransfer.getData('fromStatus');

    if (fromStatus === newStatus) return;

    try {
      await api.updateTask(id, taskId, { status: newStatus });
      loadProject();
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('kanban-col-drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('kanban-col-drag-over');
  };

  const handleDropCleanup = (e, status) => {
    e.currentTarget.classList.remove('kanban-col-drag-over');
    handleDrop(e, status);
  };

  const handleAddMember = async (userId) => {
    try {
      await api.addMember(id, userId);
      loadProject();
      setShowMemberModal(false);
    } catch (err) {
      console.error('Add member error:', err);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.removeMember(id, userId);
      loadProject();
    } catch (err) {
      console.error('Remove member error:', err);
    }
  };

  const statusConfig = {
    planning: { label: 'Planning', class: 'badge-status-planning' },
    active: { label: 'Active', class: 'badge-status-active' },
    completed: { label: 'Completed', class: 'badge-status-completed' },
    'on-hold': { label: 'On Hold', class: 'badge-status-on-hold' },
  };

  const columns = [
    { key: 'todo', label: 'To Do', color: '#06b6d4' },
    { key: 'in-progress', label: 'In Progress', color: '#f59e0b' },
    { key: 'done', label: 'Done', color: '#10b981' },
  ];

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state">
        <h3>Project not found</h3>
        <Link to="/projects" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
          Back to Projects
        </Link>
      </div>
    );
  }

  const sc = statusConfig[project.status] || statusConfig.planning;
  const nonMembers = users.filter(u => !project.memberIds?.includes(u.uid));

  return (
    <div className="project-detail">
      {/* Breadcrumb */}
      <div className="breadcrumb animate-fade-in">
        <Link to="/projects">Projects</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="project-header animate-fade-in-up">
        <div className="project-header-info">
          <div className="project-header-top">
            <h1 className="project-title">{project.name}</h1>
            <span className={`badge ${sc.class}`}>{sc.label}</span>
          </div>
          {project.description && (
            <p className="project-description">{project.description}</p>
          )}
          <div className="project-meta">
            <div className="project-meta-item">
              <span className="meta-label">Progress</span>
              <div style={{ width: 160 }}>
                <ProgressBar value={project.progress} showLabel />
              </div>
            </div>
            <div className="project-meta-item">
              <span className="meta-label">Tasks</span>
              <span className="meta-value">{project.completedTasks}/{project.taskCount}</span>
            </div>
            {project.deadline && (
              <div className="project-meta-item">
                <span className="meta-label">Deadline</span>
                <span className="meta-value">
                  {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="project-header-actions">
          <button className="btn btn-primary" onClick={() => openCreateTask()}>
            ＋ Add Task
          </button>
          <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Add Member
          </button>
        </div>
      </div>

      {/* Members Bar */}
      {project.members && project.members.length > 0 && (
        <div className="members-bar animate-fade-in-up">
          <span className="members-label">Team ({project.members.length})</span>
          <div className="members-list">
            {project.members.map((member) => (
              <div key={member.uid} className="member-chip" title={member.name}>
                <Avatar name={member.name} color={member.avatarColor} size={28} />
                <span className="member-chip-name">{member.name}</span>
                <button
                  className="member-chip-remove"
                  onClick={() => handleRemoveMember(member.uid)}
                  title="Remove"
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="kanban-board animate-fade-in-up">
        {columns.map((col) => {
          const tasks = (project.tasks || []).filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              className="kanban-col"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropCleanup(e, col.key)}
            >
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <span>{col.label}</span>
                  <span className="kanban-col-count">{tasks.length}</span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => openCreateTask(col.key)}
                  title={`Add to ${col.label}`}
                >＋</button>
              </div>
              <div className="kanban-col-body">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={project.members || []}
                    onEdit={openEditTask}
                  />
                ))}
                {tasks.length === 0 && (
                  <div className="kanban-empty">
                    <p>No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSaveTask}>
          <div className="form-group">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="Task title"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Task description..."
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-assignee">Assignee</label>
              <select
                id="task-assignee"
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {(project.members || []).map((m) => (
                  <option key={m.uid} value={m.uid}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-actions">
            {editingTask && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => { handleDeleteTask(editingTask); setShowTaskModal(false); }}
                style={{ marginRight: 'auto' }}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : (editingTask ? 'Save' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Add Team Member"
        size="sm"
      >
        {nonMembers.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-4)' }}>
            <p>All users are already members of this project</p>
          </div>
        ) : (
          <div className="member-select-list">
            {nonMembers.map((user) => (
              <button
                key={user.uid}
                className="member-select-item"
                onClick={() => handleAddMember(user.uid)}
              >
                <Avatar name={user.name} color={user.avatarColor} size={32} />
                <div className="member-select-info">
                  <span className="member-select-name">{user.name}</span>
                  <span className="member-select-email">{user.email}</span>
                </div>
                <span className="member-select-add">Add</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
