import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Baby } from '../../types';
import api from '../../services/api';
import SleepTracker from '../SleepTracker';
import SleepCalendar from '../SleepCalendar';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyBirthDate, setNewBabyBirthDate] = useState('');
  const [activeTab, setActiveTab] = useState<'tracker' | 'calendar'>('tracker');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    try {
      const response = await api.get('/babies');
      setBabies(response.data);
      if (response.data.length > 0 && !selectedBaby) {
        setSelectedBaby(response.data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch babies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBaby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBabyName.trim()) return;

    try {
      const response = await api.post('/babies', {
        name: newBabyName,
        birthDate: newBabyBirthDate || null
      });
      const newBaby = response.data.baby;
      setBabies([...babies, newBaby]);
      setSelectedBaby(newBaby);
      setNewBabyName('');
      setNewBabyBirthDate('');
      setShowAddBaby(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add baby');
    }
  };

  const handleDeleteBaby = async (babyId: number) => {
    if (!confirm('Are you sure you want to delete this baby?')) return;

    try {
      await api.delete(`/babies/${babyId}`);
      const updatedBabies = babies.filter(baby => baby.id !== babyId);
      setBabies(updatedBabies);
      if (selectedBaby?.id === babyId) {
        setSelectedBaby(updatedBabies.length > 0 ? updatedBabies[0] : null);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete baby');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  const containerStyle = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #ddd',
    paddingBottom: '20px',
    marginBottom: '20px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: 'white'
  };

  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#28a745',
    color: 'white'
  };

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    margin: '10px 0',
    backgroundColor: '#f9f9f9'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '10px',
    fontSize: '14px'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1>Baby Sleep Tracker</h1>
          <p>Welcome, {user?.motherName}! ({user?.username})</p>
        </div>
        <button onClick={logout} style={dangerButtonStyle}>
          Logout
        </button>
      </div>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Baby Management Sidebar */}
        <div style={{ flex: '0 0 300px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Your Babies</h3>
              <button 
                onClick={() => setShowAddBaby(!showAddBaby)} 
                style={primaryButtonStyle}
              >
                Add Baby
              </button>
            </div>

            {showAddBaby && (
              <form onSubmit={handleAddBaby} style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Baby name"
                  value={newBabyName}
                  onChange={(e) => setNewBabyName(e.target.value)}
                  style={inputStyle}
                  required
                />
                <input
                  type="date"
                  placeholder="Birth date (optional)"
                  value={newBabyBirthDate}
                  onChange={(e) => setNewBabyBirthDate(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={successButtonStyle}>
                    Add
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddBaby(false)}
                    style={buttonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {babies.length === 0 ? (
              <p>No babies added yet. Add your first baby to start tracking!</p>
            ) : (
              <div>
                {babies.map(baby => (
                  <div 
                    key={baby.id} 
                    style={{
                      padding: '10px',
                      border: selectedBaby?.id === baby.id ? '2px solid #007bff' : '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      backgroundColor: selectedBaby?.id === baby.id ? '#e3f2fd' : 'white'
                    }}
                    onClick={() => setSelectedBaby(baby)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{baby.name}</strong>
                        {baby.birth_date && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Born: {new Date(baby.birth_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBaby(baby.id);
                        }}
                        style={{
                          ...dangerButtonStyle,
                          padding: '5px 10px',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {selectedBaby ? (
            <div style={cardStyle}>
              {/* Tabs */}
              <div style={{ 
                display: 'flex', 
                borderBottom: '1px solid #ddd',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setActiveTab('tracker')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderBottom: activeTab === 'tracker' ? '2px solid #007bff' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: activeTab === 'tracker' ? 'bold' : 'normal',
                    color: activeTab === 'tracker' ? '#007bff' : '#666'
                  }}
                >
                  Sleep Tracker
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderBottom: activeTab === 'calendar' ? '2px solid #007bff' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: activeTab === 'calendar' ? 'bold' : 'normal',
                    color: activeTab === 'calendar' ? '#007bff' : '#666'
                  }}
                >
                  Sleep Calendar
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'tracker' && <SleepTracker baby={selectedBaby} />}
              {activeTab === 'calendar' && <SleepCalendar baby={selectedBaby} />}
            </div>
          ) : (
            <div style={cardStyle}>
              <h3>No Baby Selected</h3>
              <p>Please select or add a baby to start tracking sleep.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;