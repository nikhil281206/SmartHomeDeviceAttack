import { X, Clock, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Device, SecurityEvent, supabase } from '../lib/supabase';
import { DeviceHealthMonitor } from './DeviceHealthMonitor';

interface DeviceDetailModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceDetailModal({ device, isOpen, onClose }: DeviceDetailModalProps) {
  const [deviceEvents, setDeviceEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (device && isOpen) {
      fetchDeviceEvents();
    }
  }, [device, isOpen]);

  const fetchDeviceEvents = async () => {
    if (!device) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('device_id', device.id)
      .order('detected_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setDeviceEvents(data);
    }
    setLoading(false);
  };

  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{device.name}</h2>
            <p className="text-sm text-gray-600 capitalize">{device.device_type.replace('_', ' ')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">IP Address</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{device.ip_address}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">MAC Address</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{device.mac_address}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Status</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{device.status}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Last Seen</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(device.last_seen).toLocaleString()}
              </p>
            </div>
          </div>

          <DeviceHealthMonitor deviceId={device.id} deviceName={device.name} />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading activity...</p>
            ) : deviceEvents.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700">No security events for this device</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deviceEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium">
                            {event.severity}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                            {event.event_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.detected_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
