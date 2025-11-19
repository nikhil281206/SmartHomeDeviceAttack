import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, DeviceMetrics } from '../lib/supabase';

interface DeviceHealthMonitorProps {
  deviceId: string;
  deviceName: string;
}

export function DeviceHealthMonitor({ deviceId, deviceName }: DeviceHealthMonitorProps) {
  const [metrics, setMetrics] = useState<DeviceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestMetrics();

    const channel = supabase
      .channel(`metrics-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_metrics',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          fetchLatestMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const fetchLatestMetrics = async () => {
    const { data, error } = await supabase
      .from('device_metrics')
      .select('*')
      .eq('device_id', deviceId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setMetrics(data);
    }
    setLoading(false);
  };

  const getStatusColor = (value: number) => {
    if (value >= 90) return 'text-red-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'bg-red-500';
    if (value >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Health</h3>
        <p className="text-sm text-gray-500">Loading metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Health</h3>
        <p className="text-sm text-gray-500">No metrics available for {deviceName}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Device Health</h3>
        <Activity className="w-5 h-5 text-blue-600" />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">CPU Usage</span>
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(metrics.cpu_usage)}`}>
              {metrics.cpu_usage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(metrics.cpu_usage)}`}
              style={{ width: `${Math.min(metrics.cpu_usage, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(metrics.memory_usage)}`}>
              {metrics.memory_usage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(metrics.memory_usage)}`}
              style={{ width: `${Math.min(metrics.memory_usage, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Network Traffic</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {(metrics.network_traffic / 1000000).toFixed(2)} MB
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Failed Auth Attempts</span>
            <span className={`font-semibold ${metrics.failed_auth_attempts > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.failed_auth_attempts}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(metrics.recorded_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
