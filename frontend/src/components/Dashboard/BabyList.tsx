import React, { useState } from 'react';
import { Baby } from '../../types';
import api from '../../services/api';

interface BabyListProps {
  babies: Baby[];
  selectedBaby: Baby | null;
  onBabySelect: (baby: Baby) => void;
  onBabyAdded: (baby: Baby) => void;
  onBabyUpdated: (baby: Baby) => void;
  onBabyDeleted: (babyId: number) => void;
}

const BabyList: React.FC<BabyListProps> = ({
  babies,
  selectedBaby,
  onBabySelect,
  onBabyAdded,
  onBabyUpdated,
  onBabyDeleted,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setBirthDate('');
    setError('');
    setShowAddForm(false);
    setEditingBaby(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingBaby) {
        const response = await api.put(`/babies/${editingBaby.id}`, {
          name,
          birthDate: birthDate || null,
        });
        onBabyUpdated(response.data.baby);
      } else {
        const response = await api.post('/babies', {
          name,
          birthDate: birthDate || null,
        });
        onBabyAdded(response.data.baby);
      }
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (baby: Baby) => {
    setEditingBaby(baby);
    setName(baby.name);
    setBirthDate(baby.birth_date || '');
    setShowAddForm(true);
  };

  const handleDelete = async (babyId: number) => {
    if (window.confirm('Are you sure you want to delete this baby? All sleep records will be lost.')) {
      try {
        await api.delete(`/babies/${babyId}`);
        onBabyDeleted(babyId);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Delete failed');
      }
    }
  };

  return (
    <div className="baby-list">
      <h3>Your Babies</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="babies">
        {babies.map((baby) => (
          <div
            key={baby.id}
            className={`baby-item ${selectedBaby?.id === baby.id ? 'selected' : ''}`}
            onClick={() => onBabySelect(baby)}
          >
            <div className="baby-info">
              <h4>{baby.name}</h4>
              {baby.birth_date && (
                <p className="birth-date">Born: {new Date(baby.birth_date).toLocaleDateString()}</p>
              )}
            </div>
            <div className="baby-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(baby);
                }}
                className="edit-btn"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(baby.id);
                }}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {babies.length < 5 && (
        <button
          onClick={() => setShowAddForm(true)}
          className="add-baby-btn"
          disabled={showAddForm}
        >
          + Add Baby
        </button>
      )}

      {showAddForm && (
        <div className="add-baby-form">
          <h4>{editingBaby ? 'Edit Baby' : 'Add New Baby'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="babyName">Name:</label>
              <input
                type="text"
                id="babyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="babyBirthDate">Birth Date (optional):</label>
              <input
                type="date"
                id="babyBirthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingBaby ? 'Update' : 'Add Baby')}
              </button>
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BabyList;