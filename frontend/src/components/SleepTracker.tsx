import React, { useState, useEffect } from 'react';
import { Baby } from '../types';
import api from '../services/api';

interface SleepRecord {
  id: number;
  baby_id: number;
  sleep_date: string;
  start_time: string;
  end_time: string;
  label: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

interface SleepTrackerProps {
  baby: Baby;
}

const SleepTracker: React.FC<SleepTrackerProps> = ({ baby }) => {
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sleepDate, setSleepDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [label, setLabel] = useState('night sleep');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sleepLabels = [
    'night sleep',
    'morning nap',
    'afternoon nap',
    'evening nap',
    'long rock',
    'self rock',
    'after food sleep',
    'car sleep',
    'stroller sleep'
  ];

  useEffect(() => {
    fetchSleepRecords();
  }, [baby.id]);

  const fetchSleepRecords = async () => {
    try {
      const response = await api.get(`/sleep/baby/${baby.id}`);
      setSleepRecords(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sleep records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sleepDate || !startTime || !endTime || !label) return;

    try {
      const response = await api.post('/sleep', {
        babyId: baby.id,
        sleepDate,
        startTime,
        endTime,
        label,
        notes: notes || undefined
      });

      setSleepRecords([response.data.sleepRecord, ...sleepRecords]);
      
      // Reset form
      setStartTime('');
      setEndTime('');
      setLabel('night sleep');
      setNotes('');
      setShowAddForm(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add sleep record');
    }
  };

  const handleDeleteSleep = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this sleep record?')) return;

    try {
      await api.delete(`/sleep/${recordId}`);
      setSleepRecords(sleepRecords.filter(record => record.id !== recordId));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete sleep record');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '10px',
    fontSize: '14px'
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

  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#28a745',
    color: 'white'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '5px 10px',
    fontSize: '12px'
  };

  if (loading) {
    return <div>Loading sleep records...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Sleep Records for {baby.name}</h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={primaryButtonStyle}
        >
          Add Sleep Record
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

      {showAddForm && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#f8f9fa'
        }}>
          <h4>Add New Sleep Record</h4>
          <form onSubmit={handleAddSleep}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Sleep Date:
                </label>
                <input
                  type="date"
                  value={sleepDate}
                  onChange={(e) => setSleepDate(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Sleep Type:
                </label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  style={inputStyle}
                  required
                >
                  {sleepLabels.map(sleepLabel => (
                    <option key={sleepLabel} value={sleepLabel}>
                      {sleepLabel.charAt(0).toUpperCase() + sleepLabel.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Start Time:
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  End Time:
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Notes (optional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this sleep session..."
                style={{
                  ...inputStyle,
                  height: '60px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={successButtonStyle}>
                Add Sleep Record
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                style={buttonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h4>Recent Sleep Records</h4>
        {sleepRecords.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No sleep records yet. Add the first sleep record to get started!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sleepRecords.map(record => (
              <div 
                key={record.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '5px' }}>
                    <strong>{new Date(record.sleep_date).toLocaleDateString()}</strong>
                    <span style={{ 
                      backgroundColor: '#e3f2fd', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}>
                      {record.label}
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {formatTime(record.start_time)} - {formatTime(record.end_time)} 
                    <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#28a745' }}>
                      ({formatDuration(record.duration_minutes)})
                    </span>
                  </div>
                  {record.notes && (
                    <div style={{ marginTop: '5px', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                      "{record.notes}"
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSleep(record.id)}
                  style={dangerButtonStyle}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SleepTracker;