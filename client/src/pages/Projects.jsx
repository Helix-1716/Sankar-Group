import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', status: 'planning', priority: 'medium', deadline: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Load projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', status: 'planning', priority: 'medium', deadline: '' });
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };
      if (editingProject) {
        await api.updateProject(editingProject.id, payload);
      } else {
        await api.createProject(payload);
      }
      setShowModal(false);
      loadProjects();
    } catch (err) {
      console.error('Save project error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.deleteProject(id);
      loadProjects();
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  const statusConfig = {
    planning: { label: 'Planning', class: 'badge-status-planning' },
    active: { label: 'Active', class: 'badge-status-active' },
    completed: { label: 'Completed', class: 'badge-status-completed' },
    'on-hold': { label: 'On Hold', class: 'badge-status-on-hold' },
  };

  const priorityConfig = {
    high: { label: 'High', class: 'badge-priority-high' },
    medium: { label: 'Medium', class: 'badge-priority-medium' },
    low: { label: 'Low', class: 'badge-priority-low' },
  };

  const filtered = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1>Projects</h1>
          <p>Manage and track all your team projects</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ New Project
        </button>
      </div>

      {/* Filters */}
      <div className="projects-toolbar animate-fade-in-up">
        <div className="projects-filters">
          {['all', 'planning', 'active', 'completed', 'on-hold'].map((s) => (
            <button
              key={s}
              className={`filter-btn ${filter === s ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="projects-search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>{search ? 'No matching projects' : 'No projects yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Create your first project to get started'}</p>
          {!search && (
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 'var(--space-4)' }}>
              ＋ Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project, i) => {
            const sc = statusConfig[project.status] || statusConfig.planning;
            const pc = priorityConfig[project.priority] || priorityConfig.medium;
            return (
              <div key={project.id} className={`project-item card animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="project-item-header">
                  <span className={`badge ${sc.class}`}>{sc.label}</span>
                  <div className="project-item-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(project)} title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(project.id)} title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
                <Link to={`/projects/${project.id}`} className="project-item-link">
                  <h3 className="project-item-name">{project.name}</h3>
                </Link>
                <p className="project-item-desc">{project.description || 'No description'}</p>
                <div className="project-item-meta">
                  <span className={`badge ${pc.class}`}>{pc.label}</span>
                  {project.deadline && (
                    <span className="project-item-deadline" style={{ display: 'flex', alignItems: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="project-item-footer">
                  <div className="project-item-progress">
                    <ProgressBar value={project.progress} showLabel />
                  </div>
                  <span className="project-item-task-count">
                    {project.completedTasks}/{project.taskCount} tasks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="proj-name">Project Name</label>
            <input
              id="proj-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="proj-desc">Description</label>
            <textarea
              id="proj-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project..."
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="proj-status">Status</label>
              <select
                id="proj-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="proj-priority">Priority</label>
              <select
                id="proj-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="proj-deadline">Deadline</label>
            <input
              id="proj-deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : (editingProject ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
