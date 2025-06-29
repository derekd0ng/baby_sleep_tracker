import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Baby } from '../../types';
import api from '../../services/api';
import BabyList from './BabyList';
import SleepTracker from './SleepTracker';
import SleepChart from './SleepChart';

const Dashboard: React.FC = () => {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'chart'>('tracker');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useAuth();

  const fetchBabies = useCallback(async () => {
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
  }, [selectedBaby]);

  useEffect(() => {
    fetchBabies();
  }, [fetchBabies]);

  const handleBabyAdded = (newBaby: Baby) => {
    setBabies([...babies, newBaby]);
    setSelectedBaby(newBaby);
  };

  const handleBabyUpdated = (updatedBaby: Baby) => {
    setBabies(babies.map(baby => baby.id === updatedBaby.id ? updatedBaby : baby));
    if (selectedBaby?.id === updatedBaby.id) {
      setSelectedBaby(updatedBaby);
    }
  };

  const handleBabyDeleted = (deletedBabyId: number) => {
    setBabies(babies.filter(baby => baby.id !== deletedBabyId));
    if (selectedBaby?.id === deletedBabyId) {
      const remainingBabies = babies.filter(baby => baby.id !== deletedBabyId);
      setSelectedBaby(remainingBabies.length > 0 ? remainingBabies[0] : null);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Baby Sleep Tracker</h1>
        <div className="user-info">
          <span>Welcome, {user?.motherName}!</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        <div className="sidebar">
          <BabyList
            babies={babies}
            selectedBaby={selectedBaby}
            onBabySelect={setSelectedBaby}
            onBabyAdded={handleBabyAdded}
            onBabyUpdated={handleBabyUpdated}
            onBabyDeleted={handleBabyDeleted}
          />
        </div>

        <div className="main-content">
          {selectedBaby ? (
            <>
              <div className="tabs">
                <button
                  className={activeTab === 'tracker' ? 'active' : ''}
                  onClick={() => setActiveTab('tracker')}
                >
                  Sleep Tracker
                </button>
                <button
                  className={activeTab === 'chart' ? 'active' : ''}
                  onClick={() => setActiveTab('chart')}
                >
                  Sleep Chart
                </button>
              </div>

              {activeTab === 'tracker' && (
                <SleepTracker baby={selectedBaby} />
              )}

              {activeTab === 'chart' && (
                <SleepChart baby={selectedBaby} />
              )}
            </>
          ) : (
            <div className="no-baby-selected">
              <p>No babies added yet. Add a baby to start tracking sleep!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;