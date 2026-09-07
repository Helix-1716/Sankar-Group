import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import Avatar from '../components/Avatar';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        setError('');
        
        // Fetch user data
        const userData = await api.getUser(id);
        setUser(userData);

        // Fetch all projects and filter by those containing this user
        const allProjects = await api.getProjects();
        const userProjects = allProjects.filter(p => 
          p.memberIds && p.memberIds.includes(id)
        );
        setProjects(userProjects);
      } catch (err) {
        console.error(err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProfileData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>{error || 'User not found'}</h3>
          <Link to="/team" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            Back to Team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">User details and activity</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card card">
          <div className="profile-header">
            <Avatar name={user.name} color={user.avatarColor} size={80} />
            <div className="profile-info">
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-role">{user.role || 'Member'}</p>
              <div className="profile-meta">
                <span className="meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  {user.email}
                </span>
                {user.createdAt && (
                  <span className="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-projects">
          <h3>Active Projects</h3>
          {projects.length > 0 ? (
            <div className="projects-grid">
              {projects.map(project => {
                const statusColors = {
                  planning: { class: 'badge-status-planning', label: 'Planning' },
                  active: { class: 'badge-status-active', label: 'Active' },
                  completed: { class: 'badge-status-completed', label: 'Completed' },
                  'on-hold': { class: 'badge-status-hold', label: 'On Hold' },
                };
                const sc = statusColors[project.status] || statusColors.planning;

                return (
                  <Link key={project.id} to={`/projects/${project.id}`} className="project-card card" style={{ textDecoration: 'none' }}>
                    <div className="project-item-header">
                      <span className={`badge ${sc.class}`}>{sc.label}</span>
                    </div>
                    <h3 className="project-item-title" style={{ marginTop: 'var(--space-3)', color: 'var(--text-primary)' }}>{project.name}</h3>
                    <p className="project-item-desc">{project.description}</p>
                    <div className="project-progress">
                      <div className="progress-info">
                        <span className="progress-label">Progress</span>
                        <span className="progress-value">{project.progress || 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No active projects found for this user.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
