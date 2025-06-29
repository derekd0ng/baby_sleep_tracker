import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Baby, DailySleepTotal } from '../../types';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SleepChartProps {
  baby: Baby;
}

const SleepChart: React.FC<SleepChartProps> = ({ baby }) => {
  const [dailyTotals, setDailyTotals] = useState<DailySleepTotal[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDailyTotals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/sleep/baby/${baby.id}/daily-totals`, {
        params: { startDate, endDate }
      });
      setDailyTotals(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sleep data');
    } finally {
      setLoading(false);
    }
  }, [baby.id, startDate, endDate]);

  useEffect(() => {
    fetchDailyTotals();
  }, [fetchDailyTotals]);

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  const chartData = {
    labels: dailyTotals.map(total => new Date(total.sleep_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Sleep Duration (hours)',
        data: dailyTotals.map(total => parseFloat(formatHours(total.total_minutes))),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Sleep Duration Chart for ${baby.name}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const hours = Math.floor(context.parsed.y);
            const minutes = Math.round((context.parsed.y - hours) * 60);
            return `Total Sleep: ${hours}h ${minutes}m`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        },
        ticks: {
          callback: function(value: any) {
            return value + 'h';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
  };

  const averageSleep = dailyTotals.length > 0 
    ? dailyTotals.reduce((sum, total) => sum + total.total_minutes, 0) / dailyTotals.length
    : 0;

  const totalSleepSessions = dailyTotals.reduce((sum, total) => sum + total.sleep_count, 0);

  return (
    <div className="sleep-chart">
      <h3>Sleep Analytics for {baby.name}</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="date-range-selector">
        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <button onClick={fetchDailyTotals} disabled={loading}>
          {loading ? 'Loading...' : 'Update Chart'}
        </button>
      </div>

      {dailyTotals.length > 0 && (
        <>
          <div className="sleep-statistics">
            <div className="stat-card">
              <h4>Average Daily Sleep</h4>
              <p className="stat-value">{formatHours(averageSleep)}h</p>
            </div>
            <div className="stat-card">
              <h4>Total Sleep Sessions</h4>
              <p className="stat-value">{totalSleepSessions}</p>
            </div>
            <div className="stat-card">
              <h4>Days Tracked</h4>
              <p className="stat-value">{dailyTotals.length}</p>
            </div>
          </div>

          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </>
      )}

      {dailyTotals.length === 0 && !loading && (
        <div className="no-data">
          <p>No sleep data available for the selected date range.</p>
        </div>
      )}
    </div>
  );
};

export default SleepChart;