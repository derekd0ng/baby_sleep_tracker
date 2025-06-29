import React, { useState, useEffect } from 'react';
import { Baby, SleepRecord } from '../../types';
import api from '../../services/api';

interface SleepTrackerProps {
  baby: Baby;
}

const SLEEP_LABELS = [
  'long_rock',
  'self_rock', 
  'after_food',
  'nap',
  'night_sleep',
  'car_sleep',
  'stroller_sleep'
];

const SleepTracker: React.FC<SleepTrackerProps> = ({ baby }) => {
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SleepRecord | null>(null);
  const [sleepDate, setSleepDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [label, setLabel] = useState('nap');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSleepRecords();
  }, [baby.id]);

  const fetchSleepRecords = async () => {
    try {
      const response = await api.get(`/sleep/baby/${baby.id}`);
      setSleepRecords(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sleep records');
    }
  };

  const resetForm = () => {
    setSleepDate(new Date().toISOString().split('T')[0]);
    setStartTime('');
    setEndTime('');
    setLabel('nap');
    setNotes('');
    setError('');
    setShowAddForm(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (startTime >= endTime) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      if (editingRecord) {
        await api.put(`/sleep/${editingRecord.id}`, {
          sleepDate,
          startTime,
          endTime,
          label,
          notes,
        });
      } else {
        await api.post('/sleep', {
          babyId: baby.id,
          sleepDate,
          startTime,
          endTime,
          label,
          notes,
        });
      }
      await fetchSleepRecords();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: SleepRecord) => {
    setEditingRecord(record);
    setSleepDate(record.sleep_date);
    setStartTime(record.start_time);
    setEndTime(record.end_time);
    setLabel(record.label);
    setNotes(record.notes || '');
    setShowAddForm(true);
  };

  const handleDelete = async (recordId: number) => {
    if (window.confirm('Are you sure you want to delete this sleep record?')) {
      try {
        await api.delete(`/sleep/${recordId}`);
        await fetchSleepRecords();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Delete failed');
      }
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatLabel = (label: string) => {
    return label.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="sleep-tracker">
      <h3>Sleep Records for {baby.name}</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <button
        onClick={() => setShowAddForm(true)}
        className="add-record-btn"
        disabled={showAddForm}
      >
        + Add Sleep Record
      </button>

      {showAddForm && (
        <div className="add-record-form">
          <h4>{editingRecord ? 'Edit Sleep Record' : 'Add New Sleep Record'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sleepDate">Date:</label>
                <input
                  type="date"
                  id="sleepDate"
                  value={sleepDate}
                  onChange={(e) => setSleepDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="startTime">Start Time:</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">End Time:</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="label">Sleep Type:</label>
                <select
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                >
                  {SLEEP_LABELS.map((labelOption) => (
                    <option key={labelOption} value={labelOption}>
                      {formatLabel(labelOption)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes (optional):</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this sleep..."
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingRecord ? 'Update' : 'Add Record')}
              </button>
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="sleep-records">
        {sleepRecords.length === 0 ? (
          <p>No sleep records yet. Add one to get started!</p>
        ) : (
          sleepRecords.map((record) => (
            <div key={record.id} className="sleep-record">
              <div className="record-header">
                <span className="date">{new Date(record.sleep_date).toLocaleDateString()}</span>
                <span className="duration">{formatDuration(record.duration_minutes)}</span>
              </div>
              <div className="record-details">
                <span className="time">{record.start_time} - {record.end_time}</span>
                <span className="label">{formatLabel(record.label)}</span>
              </div>
              {record.notes && (
                <div className="record-notes">{record.notes}</div>
              )}
              <div className="record-actions">
                <button onClick={() => handleEdit(record)} className="edit-btn">
                  Edit
                </button>
                <button onClick={() => handleDelete(record.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SleepTracker;