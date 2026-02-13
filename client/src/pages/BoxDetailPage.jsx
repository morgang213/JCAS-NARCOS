import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { boxApi, auditApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import './BoxDetailPage.css';

export default function BoxDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [box, setBox] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const loadBox = useCallback(async () => {
    try {
      const [boxData, logData] = await Promise.all([
        boxApi.getById(id),
        auditApi.getLogs({ targetId: id, limit: 20 }),
      ]);
      setBox(boxData);
      setAuditLogs(logData);
      setEditData({
        description: boxData.description || '',
        location: boxData.location || '',
        status: boxData.status || 'active',
      });
    } catch (err) {
      toast.error('Failed to load medication box');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadBox();
  }, [loadBox]);

  const handleSave = async () => {
    try {
      const updated = await boxApi.update(id, editData);
      setBox(updated);
      setEditing(false);
      toast.success('Box updated successfully');
      loadBox();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update box');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${box.boxNumber}? This cannot be undone.`)) return;

    try {
      await boxApi.delete(id);
      toast.success('Box deleted');
      navigate('/inventory');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete box');
    }
  };

  const handleAddMedication = () => {
    const name = window.prompt('Medication name:');
    if (!name) return;
    const quantity = parseInt(window.prompt('Quantity:', '0') || '0', 10);
    const expirationDate = window.prompt('Expiration date (YYYY-MM-DD):', '');
    const lotNumber = window.prompt('Lot number:', '');

    const newMed = {
      name,
      quantity,
      unit: 'units',
      expirationDate: expirationDate || null,
      lotNumber: lotNumber || '',
      controlledSubstance: false,
      schedule: '',
    };

    const updatedMeds = [...(box.medications || []), newMed];
    boxApi
      .update(id, { medications: updatedMeds })
      .then(() => {
        toast.success('Medication added');
        loadBox();
      })
      .catch(() => toast.error('Failed to add medication'));
  };

  const handleRemoveMedication = (index) => {
    if (!window.confirm('Remove this medication?')) return;
    const updatedMeds = box.medications.filter((_, i) => i !== index);
    boxApi
      .update(id, { medications: updatedMeds })
      .then(() => {
        toast.success('Medication removed');
        loadBox();
      })
      .catch(() => toast.error('Failed to remove medication'));
  };

  const handleInventoryCheck = async () => {
    try {
      await boxApi.recordInventory(id, box.medications || []);
      toast.success('Inventory check recorded');
      loadBox();
    } catch (err) {
      toast.error('Failed to record inventory check');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading box details...</p>
      </div>
    );
  }

  if (!box) return null;

  return (
    <div className="box-detail">
      <div className="page-header">
        <div>
          <Link to="/inventory" className="back-link">
            ← Back to Inventory
          </Link>
          <h1>{box.boxNumber}</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleInventoryCheck}>
            📋 Record Inventory Check
          </button>
          {isAdmin && (
            <button className="btn btn-danger" onClick={handleDelete}>
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Box Info */}
      <div className="detail-grid">
        <div className="detail-card">
          <div className="card-header">
            <h2>Box Information</h2>
            <button
              className="btn btn-sm"
              onClick={() => (editing ? handleSave() : setEditing(true))}
            >
              {editing ? '💾 Save' : '✏️ Edit'}
            </button>
          </div>

          {editing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) =>
                    setEditData({ ...editData, location: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Description</span>
                <span className="info-value">{box.description || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location</span>
                <span className="info-value">{box.location || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className={`badge badge-${box.status === 'active' ? 'success' : box.status === 'maintenance' ? 'warning' : 'secondary'}`}>
                  {box.status}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Inventory</span>
                <span className="info-value">
                  {box.lastInventoryDate
                    ? new Date(box.lastInventoryDate).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">
                  {box.createdAt
                    ? new Date(box.createdAt).toLocaleString()
                    : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Medications ({(box.medications || []).length})</h2>
            <button className="btn btn-sm" onClick={handleAddMedication}>
              ➕ Add
            </button>
          </div>

          {(box.medications || []).length === 0 ? (
            <p className="empty-state">No medications in this box</p>
          ) : (
            <div className="med-list">
              {box.medications.map((med, index) => {
                const isExpired =
                  med.expirationDate && new Date(med.expirationDate) < new Date();
                const isExpiring =
                  med.expirationDate &&
                  !isExpired &&
                  new Date(med.expirationDate) <
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <div
                    key={index}
                    className={`med-item ${isExpired ? 'expired' : ''} ${isExpiring ? 'expiring' : ''}`}
                  >
                    <div className="med-info">
                      <span className="med-name">{med.name}</span>
                      <span className="med-details">
                        Qty: {med.quantity} {med.unit}
                        {med.lotNumber && ` | Lot: ${med.lotNumber}`}
                      </span>
                      {med.expirationDate && (
                        <span
                          className={`med-expiry ${isExpired ? 'text-danger' : ''} ${isExpiring ? 'text-warning' : ''}`}
                        >
                          {isExpired ? '🚨 Expired: ' : isExpiring ? '⚠️ Expires: ' : 'Expires: '}
                          {new Date(med.expirationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveMedication(index)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="detail-card audit-card">
        <h2>Activity Log</h2>
        {auditLogs.length === 0 ? (
          <p className="empty-state">No activity recorded for this box</p>
        ) : (
          <div className="audit-list">
            {auditLogs.map((log) => (
              <div key={log.id} className="audit-item">
                <span className="audit-action">
                  <strong>{log.username}</strong> — {log.action}
                </span>
                <span className="audit-time">
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : 'Just now'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
