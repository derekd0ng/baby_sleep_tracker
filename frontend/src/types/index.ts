export interface User {
  id: number;
  username: string;
  motherName: string;
}

export interface Baby {
  id: number;
  name: string;
  birth_date?: string;
  created_at: string;
}

export interface SleepRecord {
  id: number;
  sleep_date: string;
  start_time: string;
  end_time: string;
  label: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

export interface DailySleepTotal {
  sleep_date: string;
  total_minutes: number;
  sleep_count: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}