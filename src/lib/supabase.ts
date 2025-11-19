import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Device {
  id: string;
  name: string;
  device_type: string;
  ip_address: string;
  mac_address: string;
  status: 'online' | 'offline' | 'compromised' | 'unknown';
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityEvent {
  id: string;
  device_id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source_ip: string;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
  devices?: {
    name: string;
    device_type: string;
  };
}

export interface DeviceMetrics {
  id: string;
  device_id: string;
  cpu_usage: number;
  memory_usage: number;
  network_traffic: number;
  failed_auth_attempts: number;
  recorded_at: string;
}

export interface AttackPattern {
  id: string;
  name: string;
  description: string;
  detection_rules: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  created_at: string;
}
