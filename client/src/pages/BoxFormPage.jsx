import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { boxApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import './BoxFormPage.css';

export default function BoxFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    boxNumber: '',
    description: '',
    location: '',
  });
  const [medications, setMedications] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        quantity: 0,
        unit: 'units',
        expirationDate: '',
        lotNumber: '',
        controlledSubstance: false,
        schedule: '',
      },
    ]);
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.boxNumber.trim()) {
      toast.error('Box number is required');
      return;
    }

    setLoading(true);
    try {
      const box = await boxApi.create({
        ...formData,
        medications: medications.filter((m) => m.name.trim()),
      });
      toast.success(`Box ${box.boxNumber} created`);
      navigate(`/box/${box.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create box');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="box-form-page">
      <div className="page-header">
        <h1>Create Medication Box</h1>
      </div>

      <form className="box-form" onSubmit={handleSubmit}>
        <div className="form-card">
          <h2>Box Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="boxNumber">Box Number *</label>
              <input
                id="boxNumber"
                name="boxNumber"
                type="text"
                value={formData.boxNumber}
                onChange={handleChange}
                placeholder="e.g., BOX-001"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Building A, Room 101"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-card">
          <div className="card-header">
            <h2>Medications</h2>
            <button
              type="button"
              className="btn btn-sm"
              onClick={addMedication}
            >
              ➕ Add Medication
            </button>
          </div>

          {medications.length === 0 ? (
            <p className="empty-state">
              No medications added yet. You can add them now or later.
            </p>
          ) : (
            <div className="med-form-list">
              {medications.map((med, index) => (
                <div key={index} className="med-form-item">
                  <div className="med-form-grid">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) =>
                          updateMedication(index, 'name', e.target.value)
                        }
                        placeholder="Medication name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={med.quantity}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Expiration Date</label>
                      <input
                        type="date"
                        value={med.expirationDate}
                        onChange={(e) =>
                          updateMedication(index, 'expirationDate', e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Lot Number</label>
                      <input
                        type="text"
                        value={med.lotNumber}
                        onChange={(e) =>
                          updateMedication(index, 'lotNumber', e.target.value)
                        }
                        placeholder="Lot #"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeMedication(index)}
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => navigate('/inventory')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : '📦 Create Box'}
          </button>
        </div>
      </form>
    </div>
  );
}
