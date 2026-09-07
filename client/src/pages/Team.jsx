import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import './Team.css';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersData, projectsData] = await Promise.all([
        api.getUsers(),
        api.getProjects(),
      ]);
      setUsers(usersData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Load team data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserProjectCount = (uid) => {
    return projects.filter(p => p.memberIds && p.memberIds.includes(uid)).length;
  };

  const getUserProjects = (uid) => {
    return projects.filter(p => p.memberIds && p.memberIds.includes(uid));
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="team-page">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1>Team</h1>
          <p>Your team members and their project assignments</p>
        </div>
        <div className="team-stat">
          <span className="team-stat-value">{users.length}</span>
          <span className="team-stat-label">Members</span>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No team members yet</h3>
          <p>Team members will appear here when they register</p>
        </div>
      ) : (
        <div className="team-grid">
          {users.map((user, i) => {
            const userProjects = getUserProjects(user.uid);
            return (
              <Link key={user.uid} to={`/profile/${user.uid}`} className={`team-card card animate-fade-in-up stagger-${Math.min(i + 1, 6)}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
                <div className="team-card-header">
                  <Avatar name={user.name} color={user.avatarColor} size={56} />
                  <div className="team-card-info">
                    <h3 className="team-card-name">{user.name}</h3>
                    <span className="team-card-email">{user.email}</span>
                  </div>
                  <span className={`badge ${user.role === 'admin' ? 'badge-status-active' : 'badge-status-planning'}`}>
                    {user.role}
                  </span>
                </div>

                <div className="team-card-stats">
                  <div className="team-stat-item">
                    <span className="team-stat-number">{getUserProjectCount(user.uid)}</span>
                    <span className="team-stat-text">Projects</span>
                  </div>
                  <div className="team-stat-divider" />
                  <div className="team-stat-item">
                    <span className="team-stat-number">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="team-stat-text">Joined</span>
                  </div>
                </div>

                {userProjects.length > 0 && (
                  <div className="team-card-projects">
                    <span className="team-projects-label">Active Projects</span>
                    <div className="team-projects-list">
                      {userProjects.slice(0, 3).map((proj) => (
                        <span key={proj.id} className="team-project-tag">
                          {proj.name}
                        </span>
                      ))}
                      {userProjects.length > 3 && (
                        <span className="team-project-tag team-project-more">
                          +{userProjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
