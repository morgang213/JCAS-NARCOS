import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { boxApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import './InventoryPage.css';

export default function InventoryPage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('boxNumber');
  const [sortDir, setSortDir] = useState('asc');

  const loadBoxes = useCallback(async () => {
    try {
      const data = await boxApi.getAll();
      setBoxes(data);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoxes();
  }, [loadBoxes]);

  // Filter and sort
  let filtered = boxes.filter((box) => {
    const matchSearch =
      box.boxNumber.toLowerCase().includes(search.toLowerCase()) ||
      box.description?.toLowerCase().includes(search.toLowerCase()) ||
      box.location?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || box.status === statusFilter;

    return matchSearch && matchStatus;
  });

  filtered.sort((a, b) => {
    const aVal = (a[sortField] || '').toString().toLowerCase();
    const bVal = (b[sortField] || '').toString().toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      active: 'badge-success',
      inactive: 'badge-secondary',
      maintenance: 'badge-warning',
    };
    return (
      <span className={`badge ${classes[status] || 'badge-secondary'}`}>
        {status}
      </span>
    );
  };

  const getMedCount = (box) => {
    return (box.medications || []).length;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div>
          <h1>Medication Box Inventory</h1>
          <p>{boxes.length} total boxes</p>
        </div>
        <Link to="/box/new" className="btn btn-primary">
          ➕ Add Box
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search boxes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state-card">
          <p>📦 No medication boxes found</p>
          {boxes.length === 0 && (
            <Link to="/box/new" className="btn btn-primary">
              Create your first box
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('boxNumber')} className="sortable">
                  Box # {sortField === 'boxNumber' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('description')} className="sortable">
                  Description {sortField === 'description' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('location')} className="sortable">
                  Location {sortField === 'location' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th>Medications</th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status {sortField === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th>Last Inventory</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((box) => (
                <tr key={box.id}>
                  <td className="box-number">
                    <Link to={`/box/${box.id}`}>{box.boxNumber}</Link>
                  </td>
                  <td>{box.description || '—'}</td>
                  <td>{box.location || '—'}</td>
                  <td>{getMedCount(box)} items</td>
                  <td>{getStatusBadge(box.status)}</td>
                  <td>
                    {box.lastInventoryDate
                      ? new Date(box.lastInventoryDate).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <Link to={`/box/${box.id}`} className="btn btn-sm">
                      View
                    </Link>
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
