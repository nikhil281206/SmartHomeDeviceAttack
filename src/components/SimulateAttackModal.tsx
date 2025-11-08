import { X } from 'lucide-react';
import { useState } from 'react';
import { Device } from '../lib/supabase';

interface SimulateAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onSimulate: (deviceId: string, metrics: {
    cpu_usage: number;
    memory_usage: number;
    network_traffic: number;
    failed_auth_attempts: number;
  }) => void;
}

export function SimulateAttackModal({ isOpen, onClose, devices, onSimulate }: SimulateAttackModalProps) {
  const [selectedDevice, setSelectedDevice] = useState('');
  const [attackType, setAttackType] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let metrics = {
      cpu_usage: 45,
      memory_usage: 50,
      network_traffic: 1000000,
      failed_auth_attempts: 0,
    };

    switch (attackType) {
      case 'brute_force':
        metrics = {
          ...metrics,
          failed_auth_attempts: 8,
        };
        break;
      case 'ddos':
        metrics = {
          ...metrics,
          network_traffic: 15000000,
        };
        break;
      case 'resource_spike':
        metrics = {
          ...metrics,
          cpu_usage: 95,
          memory_usage: 93,
        };
        break;
      case 'combined':
        metrics = {
          cpu_usage: 92,
          memory_usage: 88,
          network_traffic: 12000000,
          failed_auth_attempts: 6,
        };
        break;
    }

    onSimulate(selectedDevice, metrics);
    setSelectedDevice('');
    setAttackType('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Simulate Attack</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Device
            </label>
            <select
              required
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a device...</option>
              {devices.filter(d => d.status === 'online').map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.device_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attack Type
            </label>
            <select
              required
              value={attackType}
              onChange={(e) => setAttackType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select attack type...</option>
              <option value="brute_force">Brute Force Attack</option>
              <option value="ddos">DDoS Attack</option>
              <option value="resource_spike">High Resource Usage</option>
              <option value="combined">Combined Attack</option>
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              This will simulate attack metrics for the selected device and trigger detection algorithms.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Simulate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
