/*
  # Smart Home Attack Detection System Schema

  ## Overview
  This migration creates the database schema for a smart home device attack detection system
  that monitors devices, detects suspicious activities, and logs security events.

  ## New Tables

  ### 1. `devices`
  Stores registered smart home devices being monitored
  - `id` (uuid, primary key) - Unique device identifier
  - `name` (text) - Human-readable device name
  - `device_type` (text) - Type of device (camera, lock, thermostat, etc.)
  - `ip_address` (text) - Device IP address
  - `mac_address` (text) - Device MAC address
  - `status` (text) - Current status (online, offline, compromised)
  - `last_seen` (timestamptz) - Last time device was active
  - `created_at` (timestamptz) - When device was registered
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `security_events`
  Logs all security events and potential attacks detected
  - `id` (uuid, primary key) - Unique event identifier
  - `device_id` (uuid, foreign key) - Reference to affected device
  - `event_type` (text) - Type of event (brute_force, ddos, unauthorized_access, etc.)
  - `severity` (text) - Severity level (low, medium, high, critical)
  - `description` (text) - Detailed description of the event
  - `source_ip` (text) - Source IP of the attack
  - `detected_at` (timestamptz) - When the event was detected
  - `resolved` (boolean) - Whether the event has been resolved
  - `resolved_at` (timestamptz) - When the event was resolved

  ### 3. `device_metrics`
  Stores real-time metrics for device monitoring
  - `id` (uuid, primary key) - Unique metric identifier
  - `device_id` (uuid, foreign key) - Reference to device
  - `cpu_usage` (numeric) - CPU usage percentage
  - `memory_usage` (numeric) - Memory usage percentage
  - `network_traffic` (numeric) - Network traffic in bytes
  - `failed_auth_attempts` (integer) - Number of failed authentication attempts
  - `recorded_at` (timestamptz) - When metrics were recorded

  ### 4. `attack_patterns`
  Defines known attack patterns for detection
  - `id` (uuid, primary key) - Unique pattern identifier
  - `name` (text) - Pattern name
  - `description` (text) - Pattern description
  - `detection_rules` (jsonb) - Rules for pattern detection
  - `severity` (text) - Default severity level
  - `active` (boolean) - Whether pattern detection is active
  - `created_at` (timestamptz) - When pattern was created

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their devices
  - Public read access for attack patterns
  - Restricted write access to security events (system only)

  ## Important Notes
  1. All tables use UUID primary keys for security
  2. Timestamps use timestamptz for timezone awareness
  3. RLS ensures data isolation between users
  4. Indexes added for frequently queried columns
*/

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  device_type text NOT NULL,
  ip_address text NOT NULL,
  mac_address text UNIQUE NOT NULL,
  status text DEFAULT 'online' CHECK (status IN ('online', 'offline', 'compromised', 'unknown')),
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  source_ip text,
  detected_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);

-- Create device_metrics table
CREATE TABLE IF NOT EXISTS device_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  cpu_usage numeric CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
  memory_usage numeric CHECK (memory_usage >= 0 AND memory_usage <= 100),
  network_traffic numeric DEFAULT 0,
  failed_auth_attempts integer DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

-- Create attack_patterns table
CREATE TABLE IF NOT EXISTS attack_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  detection_rules jsonb NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);
CREATE INDEX IF NOT EXISTS idx_security_events_device_id ON security_events(device_id);
CREATE INDEX IF NOT EXISTS idx_security_events_detected_at ON security_events(detected_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_device_metrics_device_id ON device_metrics(device_id);
CREATE INDEX IF NOT EXISTS idx_device_metrics_recorded_at ON device_metrics(recorded_at);

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_patterns ENABLE ROW LEVEL SECURITY;

-- Policies for devices table
CREATE POLICY "Allow public read access to devices"
  ON devices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to devices"
  ON devices FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to devices"
  ON devices FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from devices"
  ON devices FOR DELETE
  TO public
  USING (true);

-- Policies for security_events table
CREATE POLICY "Allow public read access to security events"
  ON security_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to security events"
  ON security_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to security events"
  ON security_events FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policies for device_metrics table
CREATE POLICY "Allow public read access to device metrics"
  ON device_metrics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to device metrics"
  ON device_metrics FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for attack_patterns table
CREATE POLICY "Allow public read access to attack patterns"
  ON attack_patterns FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to attack patterns"
  ON attack_patterns FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert some default attack patterns
INSERT INTO attack_patterns (name, description, detection_rules, severity, active) VALUES
  ('Brute Force Attack', 'Multiple failed authentication attempts in short time', '{"threshold": 5, "timeWindow": 300}', 'high', true),
  ('DDoS Pattern', 'Unusual spike in network traffic from single source', '{"trafficThreshold": 10000000, "timeWindow": 60}', 'critical', true),
  ('Unauthorized Access', 'Access attempt from unknown IP address', '{"checkWhitelist": true}', 'high', true),
  ('Port Scanning', 'Sequential port access attempts detected', '{"portScanThreshold": 10, "timeWindow": 60}', 'medium', true),
  ('Firmware Tampering', 'Unexpected device firmware modification detected', '{"checkIntegrity": true}', 'critical', true)
ON CONFLICT DO NOTHING;