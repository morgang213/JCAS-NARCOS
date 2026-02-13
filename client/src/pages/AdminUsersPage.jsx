import React, { useState, useEffect } from 'react';
import { userApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import './AdminUsersPage.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    displayName: '',
    pin: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.username.trim() || !newUser.displayName.trim()) {
      toast.error('Username and display name are required');
      return;
    }
    if (!/^\d{4}$/.test(newUser.pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    try {
      await userApi.create(newUser);
      toast.success(`User "${newUser.username}" created`);
      setNewUser({ username: '', displayName: '', pin: '', role: 'user' });
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userApi.updateRole(userId, newRole);
      toast.success('Role updated');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleResetPin = async (userId) => {
    const pin = window.prompt('Enter new 4-digit PIN:');
    if (!pin) return;
    if (!/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    try {
      await userApi.resetPin(userId, pin);
      toast.success('PIN reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset PIN');
    }
  };

  const handleDeactivate = async (userId, username) => {
    if (!window.confirm(`Deactivate user "${username}"?`)) return;

    try {
      await userApi.delete(userId);
      toast.success('User deactivated');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} active users</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Cancel' : '➕ New User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="create-form-card">
          <h2>Create New User</h2>
          <form onSubmit={handleCreateUser}>
            <div className="form-grid">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="alphanumeric, 2-30 chars"
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, displayName: e.target.value })
                  }
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>4-digit PIN *</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newUser.pin}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      pin: e.target.value.replace(/\D/g, '').slice(0, 4),
                    })
                  }
                  placeholder="••••"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="user-username">{u.username}</td>
                <td>{u.displayName}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : '—'}
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="btn btn-sm"
                      onClick={() => handleResetPin(u.id)}
                    >
                      🔄 Reset PIN
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeactivate(u.id, u.username)}
                    >
                      🚫
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
