import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import Avatar from '../components/Avatar';
import './Dashboard.css';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, projectsData, activityData] = await Promise.all([
        api.getStats(),
        api.getProjects(),
        api.getActivity(),
      ]);
      setStats(statsData);
      setProjects(projectsData);
      setActivities(activityData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getActivityIcon = (action) => {
    const icons = {
      created_project: '📁',
      updated_project: '✏️',
      deleted_project: '🗑️',
      created_task: '✅',
      updated_task: '📝',
      updated_task_status: '🔄',
      deleted_task: '❌',
      added_member: '👤',
    };
    return icons[action] || '📌';
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const statusConfig = {
    planning: { label: 'Planning', class: 'badge-status-planning' },
    active: { label: 'Active', class: 'badge-status-active' },
    completed: { label: 'Completed', class: 'badge-status-completed' },
    'on-hold': { label: 'On Hold', class: 'badge-status-on-hold' },
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header animate-fade-in-up">
        <div>
          <h1 className="dashboard-greeting">
            {getGreeting()}, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="dashboard-subtext">Here's what's happening with your projects today.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          ＋ New Project
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card animate-fade-in-up stagger-1">
            <div className="stat-content">
              <span className="stat-value">{stats.totalProjects}</span>
              <span className="stat-label">Projects</span>
            </div>
          </div>
          <div className="stat-card animate-fade-in-up stagger-2">
            <div className="stat-content">
              <span className="stat-value">{stats.totalTasks}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
          </div>
          <div className="stat-card animate-fade-in-up stagger-3">
            <div className="stat-content">
              <span className="stat-value">{stats.completionRate}%</span>
              <span className="stat-label">Completion</span>
            </div>
          </div>
          <div className="stat-card animate-fade-in-up stagger-4">
            <div className="stat-content">
              <span className="stat-value">{stats.totalMembers}</span>
              <span className="stat-label">Members</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Projects Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active Projects</h2>
            <Link to="/projects" className="btn btn-ghost">View All →</Link>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
            </div>
          ) : (
            <div className="project-cards">
              {projects.slice(0, 4).map((project, i) => {
                const sc = statusConfig[project.status] || statusConfig.planning;
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className={`project-card card animate-fade-in-up stagger-${i + 1}`}
                  >
                    <div className="project-card-top">
                      <span className={`badge ${sc.class}`}>{sc.label}</span>
                      <span className="project-card-tasks">
                        {project.completedTasks}/{project.taskCount} tasks
                      </span>
                    </div>
                    <h3 className="project-card-name">{project.name}</h3>
                    <p className="project-card-desc">{project.description}</p>
                    <div className="project-card-progress">
                      <ProgressBar value={project.progress} showLabel />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="dashboard-section dashboard-activity">
          <div className="section-header">
            <h2>Recent Activity</h2>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <h3>No activity yet</h3>
              <p>Start working on projects to see activity here</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.slice(0, 10).map((activity, i) => (
                <div key={activity.id} className={`activity-item animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                  <div className="activity-content">
                    <p className="activity-text">
                      <strong>{activity.userName || 'Someone'}</strong>{' '}
                      {activity.details}
                    </p>
                    <span className="activity-time">{formatTimeAgo(activity.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Overview */}
      {stats && stats.totalTasks > 0 && (
        <div className="task-overview animate-fade-in-up">
          <h2 className="section-title">Task Overview</h2>
          <div className="task-overview-grid">
            <div className="overview-stat">
              <div className="overview-bar" style={{ background: 'var(--info)', height: `${Math.max(10, (stats.todoTasks / stats.totalTasks) * 100)}%` }} />
              <span className="overview-count">{stats.todoTasks}</span>
              <span className="overview-label">To Do</span>
            </div>
            <div className="overview-stat">
              <div className="overview-bar" style={{ background: 'var(--warning)', height: `${Math.max(10, (stats.inProgressTasks / stats.totalTasks) * 100)}%` }} />
              <span className="overview-count">{stats.inProgressTasks}</span>
              <span className="overview-label">In Progress</span>
            </div>
            <div className="overview-stat">
              <div className="overview-bar" style={{ background: 'var(--success)', height: `${Math.max(10, (stats.completedTasks / stats.totalTasks) * 100)}%` }} />
              <span className="overview-count">{stats.completedTasks}</span>
              <span className="overview-label">Done</span>
            </div>
            <div className="overview-stat">
              <div className="overview-bar" style={{ background: 'var(--danger)', height: `${Math.max(10, (stats.highPriorityTasks / stats.totalTasks) * 100)}%` }} />
              <span className="overview-count">{stats.highPriorityTasks}</span>
              <span className="overview-label">High Priority</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
