import React, { useState, useEffect } from 'react';
import { Baby } from '../types';
import api from '../services/api';

interface DailyTotal {
  sleep_date: string;
  total_minutes: number;
  sleep_count: number;
}

interface SleepCalendarProps {
  baby: Baby;
}

const SleepCalendar: React.FC<SleepCalendarProps> = ({ baby }) => {
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDailyTotals();
  }, [baby.id, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDailyTotals = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const response = await api.get(`/sleep/baby/${baby.id}/daily-totals?startDate=${startDate}&endDate=${endDate}`);
      setDailyTotals(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch daily totals');
    } finally {
      setLoading(false);
    }
  };

  const getDayData = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dailyTotals.find(dt => dt.sleep_date === dateStr);
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  };

  const getColorForDuration = (minutes: number) => {
    if (minutes === 0) return '#f8f9fa';
    if (minutes < 300) return '#ffebee'; // less than 5 hours - light red
    if (minutes < 480) return '#fff3e0'; // less than 8 hours - light orange
    if (minutes < 600) return '#e8f5e8'; // less than 10 hours - light green
    return '#c8e6c9'; // 10+ hours - green
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayData = getDayData(current);
      const isCurrentMonth = current.getMonth() === month;
      const isToday = current.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={current.toISOString()}
          style={{
            minHeight: '80px',
            border: '1px solid #ddd',
            padding: '4px',
            backgroundColor: isCurrentMonth 
              ? (dayData ? getColorForDuration(dayData.total_minutes) : '#f8f9fa')
              : '#f5f5f5',
            opacity: isCurrentMonth ? 1 : 0.5,
            position: 'relative',
            fontSize: '12px'
          }}
        >
          <div style={{ 
            fontWeight: isToday ? 'bold' : 'normal',
            color: isToday ? '#007bff' : 'inherit'
          }}>
            {current.getDate()}
          </div>
          {dayData && isCurrentMonth && (
            <div style={{ marginTop: '2px' }}>
              <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                {formatHours(dayData.total_minutes)}
              </div>
              <div style={{ color: '#666', fontSize: '10px' }}>
                {dayData.sleep_count} sleep{dayData.sleep_count !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      );

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: '#007bff',
    color: 'white'
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Sleep Calendar for {baby.name}</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => navigateMonth(-1)} style={buttonStyle}>
            ‹ Previous
          </button>
          <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '200px', textAlign: 'center' }}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => navigateMonth(1)} style={buttonStyle}>
            Next ›
          </button>
        </div>
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

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day}
              style={{
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
                border: '1px solid #ddd'
              }}
            >
              {day}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0' }}>
          {renderCalendar()}
        </div>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h4 style={{ marginTop: 0 }}>Legend</h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ffebee', border: '1px solid #ddd' }}></div>
            <span>&lt; 5 hours</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#fff3e0', border: '1px solid #ddd' }}></div>
            <span>5-8 hours</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#e8f5e8', border: '1px solid #ddd' }}></div>
            <span>8-10 hours</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#c8e6c9', border: '1px solid #ddd' }}></div>
            <span>10+ hours</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#f8f9fa', border: '1px solid #ddd' }}></div>
            <span>No sleep data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SleepCalendar;