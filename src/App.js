import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    quantity: '',
    expiryDate: '',
    location: ''
  });

  // Load medications from localStorage on component mount
  useEffect(() => {
    const savedMedications = localStorage.getItem('jcas-narcos-medications');
    if (savedMedications) {
      setMedications(JSON.parse(savedMedications));
    }
  }, []);

  // Save medications to localStorage whenever medications change
  useEffect(() => {
    localStorage.setItem('jcas-narcos-medications', JSON.stringify(medications));
  }, [medications]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMedication(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addMedication = (e) => {
    e.preventDefault();
    if (!newMedication.name || !newMedication.dosage || !newMedication.quantity) {
      alert('Please fill in required fields: Name, Dosage, and Quantity');
      return;
    }

    const medication = {
      id: Date.now(),
      ...newMedication,
      addedDate: new Date().toLocaleDateString()
    };

    setMedications(prev => [...prev, medication]);
    setNewMedication({
      name: '',
      dosage: '',
      quantity: '',
      expiryDate: '',
      location: ''
    });
  };

  const removeMedication = (id) => {
    setMedications(prev => prev.filter(med => med.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 0) return;
    setMedications(prev => 
      prev.map(med => 
        med.id === id ? { ...med, quantity: newQuantity } : med
      )
    );
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>JCAS-NARCOS</h1>
        <p>Medication Box Tracker v1.0.0</p>
      </header>

      <main className="App-main">
        <div className="medication-form">
          <h2>Add New Medication</h2>
          <form onSubmit={addMedication}>
            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="Medication Name *"
                value={newMedication.name}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="dosage"
                placeholder="Dosage *"
                value={newMedication.dosage}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                name="quantity"
                placeholder="Quantity *"
                value={newMedication.quantity}
                onChange={handleInputChange}
                required
                min="0"
              />
              <input
                type="date"
                name="expiryDate"
                placeholder="Expiry Date"
                value={newMedication.expiryDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                name="location"
                placeholder="Storage Location"
                value={newMedication.location}
                onChange={handleInputChange}
              />
              <button type="submit">Add Medication</button>
            </div>
          </form>
        </div>

        <div className="medication-inventory">
          <h2>Medication Inventory ({medications.length} items)</h2>
          {medications.length === 0 ? (
            <p className="no-medications">No medications in inventory. Add your first medication above.</p>
          ) : (
            <div className="medication-grid">
              {medications.map(med => (
                <div 
                  key={med.id} 
                  className={`medication-card ${isExpired(med.expiryDate) ? 'expired' : isExpiringSoon(med.expiryDate) ? 'expiring-soon' : ''}`}
                >
                  <div className="medication-header">
                    <h3>{med.name}</h3>
                    <button 
                      className="remove-btn"
                      onClick={() => removeMedication(med.id)}
                      title="Remove medication"
                    >
                      ×
                    </button>
                  </div>
                  <div className="medication-details">
                    <p><strong>Dosage:</strong> {med.dosage}</p>
                    <div className="quantity-control">
                      <strong>Quantity:</strong>
                      <div className="quantity-buttons">
                        <button onClick={() => updateQuantity(med.id, parseInt(med.quantity) - 1)}>-</button>
                        <span>{med.quantity}</span>
                        <button onClick={() => updateQuantity(med.id, parseInt(med.quantity) + 1)}>+</button>
                      </div>
                    </div>
                    {med.expiryDate && (
                      <p className={`expiry ${isExpired(med.expiryDate) ? 'expired' : isExpiringSoon(med.expiryDate) ? 'warning' : ''}`}>
                        <strong>Expires:</strong> {new Date(med.expiryDate).toLocaleDateString()}
                        {isExpired(med.expiryDate) && <span className="status-badge">EXPIRED</span>}
                        {isExpiringSoon(med.expiryDate) && !isExpired(med.expiryDate) && <span className="status-badge warning">EXPIRES SOON</span>}
                      </p>
                    )}
                    {med.location && <p><strong>Location:</strong> {med.location}</p>}
                    <p className="added-date"><strong>Added:</strong> {med.addedDate}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>JCAS-NARCOS Medication Box Tracker - Keep track of your medication inventory</p>
      </footer>
    </div>
  );
}

export default App;
