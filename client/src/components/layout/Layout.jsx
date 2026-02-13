import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/inventory', label: 'Inventory', icon: '💊' },
    { path: '/box/new', label: 'Add Box', icon: '➕' },
  ];

  if (isAdmin) {
    navItems.push(
      { path: '/admin/users', label: 'Users', icon: '👥' },
      { path: '/audit-logs', label: 'Audit Logs', icon: '📋' }
    );
  }

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="layout-header">
        <button
          className="menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="header-title">JCAS-NARCOS</h1>
        <div className="header-user">
          <span className="user-badge" data-role={user?.role}>
            {user?.role === 'admin' ? '🔑' : '👤'}
          </span>
          <span className="user-name">{user?.displayName}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`layout-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>JCAS-NARCOS</h2>
          <p className="sidebar-subtitle">Medication Box Tracker</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-badge" data-role={user?.role}>
              {user?.role === 'admin' ? '🔑 Admin' : '👤 User'}
            </span>
            <span className="sidebar-username">{user?.displayName}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="layout-main">{children}</main>
    </div>
  );
}
