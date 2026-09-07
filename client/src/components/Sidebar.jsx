import './Sidebar.css';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Sidebar({ isOpen, onClose }) {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/team', label: 'Team' },
  ];

  return (
    <aside className={`sidebar glass ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">N</div>
          <div className="logo-text">
            <span className="logo-name">NOVA</span>
            <span className="logo-tagline">Team Productivity</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-label">Menu</span>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <span className="nav-label">{item.label}</span>
              {location.pathname === item.path && (
                <span className="nav-indicator" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <Link to={`/profile/${profile?.uid}`} className="user-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Avatar
            name={profile?.name || 'User'}
            color={profile?.avatarColor}
            size={36}
          />
          <div className="user-info">
            <span className="user-name">{profile?.name || 'User'}</span>
            <span className="user-role">{profile?.role || 'member'}</span>
          </div>
        </Link>
        <button className="btn btn-ghost sidebar-logout" onClick={logout} title="Logout" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </aside>
  );
}
