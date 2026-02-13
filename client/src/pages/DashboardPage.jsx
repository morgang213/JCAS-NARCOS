import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { boxApi, auditApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const [boxData, logData] = await Promise.all([
        boxApi.getAll(),
        auditApi.getLogs({ limit: 10 }),
      ]);
      setBoxes(boxData);
      setRecentLogs(logData);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Calculate stats
  const totalBoxes = boxes.length;
  const activeBoxes = boxes.filter((b) => b.status === 'active').length;

  // Check for expiring medications (within 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringMeds = [];

  boxes.forEach((box) => {
    (box.medications || []).forEach((med) => {
      if (med.expirationDate) {
        const expDate = new Date(med.expirationDate);
        if (expDate <= thirtyDaysFromNow && expDate >= now) {
          expiringMeds.push({ ...med, boxNumber: box.boxNumber, boxId: box.id });
        }
      }
    });
  });

  const expiredMeds = [];
  boxes.forEach((box) => {
    (box.medications || []).forEach((med) => {
      if (med.expirationDate) {
        const expDate = new Date(med.expirationDate);
        if (expDate < now) {
          expiredMeds.push({ ...med, boxNumber: box.boxNumber, boxId: box.id });
        }
      }
    });
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.displayName}</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{totalBoxes}</span>
            <span className="stat-label">Total Boxes</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{activeBoxes}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <span className="stat-value">{expiringMeds.length}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <span className="stat-value">{expiredMeds.length}</span>
            <span className="stat-label">Expired</span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(expiredMeds.length > 0 || expiringMeds.length > 0) && (
        <div className="alerts-section">
          <h2>⚠️ Alerts</h2>
          {expiredMeds.map((med, i) => (
            <div key={`expired-${i}`} className="alert alert-danger">
              <strong>EXPIRED:</strong> {med.name} in{' '}
              <Link to={`/box/${med.boxId}`}>{med.boxNumber}</Link> — expired{' '}
              {new Date(med.expirationDate).toLocaleDateString()}
            </div>
          ))}
          {expiringMeds.map((med, i) => (
            <div key={`expiring-${i}`} className="alert alert-warning">
              <strong>Expiring:</strong> {med.name} in{' '}
              <Link to={`/box/${med.boxId}`}>{med.boxNumber}</Link> — expires{' '}
              {new Date(med.expirationDate).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/box/new" className="action-card">
            <span className="action-icon">➕</span>
            <span>Add New Box</span>
          </Link>
          <Link to="/inventory" className="action-card">
            <span className="action-icon">📋</span>
            <span>View Inventory</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentLogs.length === 0 ? (
          <p className="empty-state">No recent activity</p>
        ) : (
          <div className="activity-list">
            {recentLogs.map((log) => (
              <div key={log.id} className="activity-item">
                <div className="activity-icon">{getActionIcon(log.action)}</div>
                <div className="activity-details">
                  <span className="activity-action">
                    <strong>{log.username}</strong> {formatAction(log.action)}
                  </span>
                  <span className="activity-time">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : 'Just now'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getActionIcon(action) {
  const icons = {
    LOGIN: '🔐',
    LOGIN_FAILED: '❌',
    BOX_CREATE: '📦',
    BOX_UPDATE: '✏️',
    BOX_DELETE: '🗑️',
    BOX_ASSIGN: '👤',
    USER_CREATE: '👥',
    USER_DELETE: '🚫',
    USER_ROLE_CHANGE: '🔑',
    USER_PIN_RESET: '🔄',
    INVENTORY_CHECK: '📋',
  };
  return icons[action] || '📌';
}

function formatAction(action) {
  const labels = {
    LOGIN: 'logged in',
    LOGIN_FAILED: 'failed login attempt',
    BOX_CREATE: 'created a medication box',
    BOX_UPDATE: 'updated a medication box',
    BOX_DELETE: 'deleted a medication box',
    BOX_ASSIGN: 'updated box assignments',
    USER_CREATE: 'created a user',
    USER_DELETE: 'deactivated a user',
    USER_ROLE_CHANGE: 'changed a user role',
    USER_PIN_RESET: 'reset a user PIN',
    INVENTORY_CHECK: 'performed inventory check',
  };
  return labels[action] || action;
}
