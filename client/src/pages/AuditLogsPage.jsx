import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import './AuditLogsPage.css';

export default function AuditLogsPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (actionFilter) params.action = actionFilter;
      const data = await auditApi.getLogs(params);
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actionTypes = [
    'LOGIN',
    'LOGIN_FAILED',
    'BOX_CREATE',
    'BOX_UPDATE',
    'BOX_DELETE',
    'BOX_ASSIGN',
    'USER_CREATE',
    'USER_DELETE',
    'USER_ROLE_CHANGE',
    'USER_PIN_RESET',
    'INVENTORY_CHECK',
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>{isAdmin ? 'All system activity' : 'Your activity'}</p>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button className="btn btn-sm" onClick={loadLogs}>
          🔄 Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state-card">
          <p>No audit logs found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="log-time">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : '—'}
                  </td>
                  <td className="log-user">{log.username}</td>
                  <td>
                    <span className={`action-badge action-${getActionCategory(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="log-target">
                    {log.targetId || '—'}
                  </td>
                  <td>
                    {log.success ? (
                      <span className="badge badge-success">✓</span>
                    ) : (
                      <span className="badge badge-danger">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getActionCategory(action) {
  if (action.startsWith('LOGIN')) return 'auth';
  if (action.startsWith('BOX')) return 'box';
  if (action.startsWith('USER')) return 'user';
  if (action === 'INVENTORY_CHECK') return 'inventory';
  return 'default';
}
