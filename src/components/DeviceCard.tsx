import { Wifi, WifiOff, AlertTriangle, Monitor } from 'lucide-react';
import { Device } from '../lib/supabase';

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const statusConfig = {
    online: {
      icon: Wifi,
      color: 'text-green-500',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    offline: {
      icon: WifiOff,
      color: 'text-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
    compromised: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    unknown: {
      icon: Monitor,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
  };

  const config = statusConfig[device.status];
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-xl border-2 ${config.border} ${config.bg} p-6 transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{device.name}</h3>
          <p className="text-sm text-gray-600 capitalize">{device.device_type.replace('_', ' ')}</p>
        </div>
        <StatusIcon className={`${config.color} w-6 h-6`} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">IP Address</span>
          <span className="text-xs font-mono text-gray-700">{device.ip_address}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">MAC Address</span>
          <span className="text-xs font-mono text-gray-700">{device.mac_address}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Status</span>
          <span className={`text-xs font-semibold capitalize ${config.color}`}>
            {device.status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Last Seen</span>
          <span className="text-xs text-gray-700">
            {new Date(device.last_seen).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
