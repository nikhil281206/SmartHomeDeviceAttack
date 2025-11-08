import { X, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { SecurityEvent, Device } from '../lib/supabase';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: SecurityEvent[];
  devices: Device[];
}

export function ExportReportModal({ isOpen, onClose, events, devices }: ExportReportModalProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeResolved, setIncludeResolved] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const filteredEvents = includeResolved
      ? events
      : events.filter((e) => !e.resolved);

    if (format === 'json') {
      exportJSON(filteredEvents);
    } else {
      exportCSV(filteredEvents);
    }
  };

  const exportJSON = (data: SecurityEvent[]) => {
    const report = {
      generated_at: new Date().toISOString(),
      total_devices: devices.length,
      online_devices: devices.filter((d) => d.status === 'online').length,
      compromised_devices: devices.filter((d) => d.status === 'compromised').length,
      total_events: data.length,
      events: data,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    downloadFile(blob, `security-report-${Date.now()}.json`);
  };

  const exportCSV = (data: SecurityEvent[]) => {
    const headers = [
      'Event ID',
      'Device ID',
      'Device Name',
      'Event Type',
      'Severity',
      'Description',
      'Source IP',
      'Detected At',
      'Resolved',
      'Resolved At',
    ];

    const rows = data.map((event) => [
      event.id,
      event.device_id,
      event.devices?.name || 'Unknown',
      event.event_type,
      event.severity,
      event.description,
      event.source_ip,
      new Date(event.detected_at).toISOString(),
      event.resolved ? 'Yes' : 'No',
      event.resolved_at ? new Date(event.resolved_at).toISOString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `security-report-${Date.now()}.csv`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Export Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('json')}
                className={`px-4 py-3 border rounded-lg font-medium transition-all ${
                  format === 'json'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`px-4 py-3 border rounded-lg font-medium transition-all ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                CSV
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeResolved"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeResolved" className="text-sm text-gray-700">
              Include resolved events
            </label>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Report Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Total Devices: {devices.length}</p>
              <p>
                Total Events:{' '}
                {includeResolved ? events.length : events.filter((e) => !e.resolved).length}
              </p>
              <p>Format: {format.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
