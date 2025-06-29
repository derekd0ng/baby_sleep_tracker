-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Babies table (up to 5 babies per user)
CREATE TABLE babies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT max_babies_per_user CHECK (
        (SELECT COUNT(*) FROM babies WHERE user_id = babies.user_id) <= 5
    )
);

-- Sleep records table
CREATE TABLE sleep_records (
    id SERIAL PRIMARY KEY,
    baby_id INTEGER REFERENCES babies(id) ON DELETE CASCADE,
    sleep_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    label VARCHAR(50) NOT NULL, -- 'long_rock', 'self_rock', 'after_food', 'nap', 'night_sleep', etc.
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_babies_user_id ON babies(user_id);
CREATE INDEX idx_sleep_records_baby_id ON sleep_records(baby_id);
CREATE INDEX idx_sleep_records_date ON sleep_records(sleep_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sleep_records_updated_at BEFORE UPDATE ON sleep_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();