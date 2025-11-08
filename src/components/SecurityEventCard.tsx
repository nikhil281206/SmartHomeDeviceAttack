import { AlertTriangle, Shield, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { SecurityEvent } from '../lib/supabase';

interface SecurityEventCardProps {
  event: SecurityEvent;
  onResolve?: (id: string) => void;
}

export function SecurityEventCard({ event, onResolve }: SecurityEventCardProps) {
  const severityConfig = {
    low: {
      icon: Shield,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
    },
    medium: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800',
    },
    critical: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800',
    },
  };

  const config = severityConfig[event.severity];
  const SeverityIcon = config.icon;

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start gap-4">
        <div className={`${config.color} mt-1`}>
          <SeverityIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
                  {event.severity.toUpperCase()}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                  {event.event_type.replace('_', ' ')}
                </span>
              </div>
              {event.devices && (
                <p className="text-sm font-medium text-gray-900">
                  {event.devices.name} ({event.devices.device_type})
                </p>
              )}
            </div>
            {event.resolved ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Resolved</span>
              </div>
            ) : (
              onResolve && (
                <button
                  onClick={() => onResolve(event.id)}
                  className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  Resolve
                </button>
              )
            )}
          </div>

          <p className="text-sm text-gray-700 mb-2">{event.description}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            {event.source_ip && event.source_ip !== 'unknown' && (
              <span className="font-mono">Source: {event.source_ip}</span>
            )}
            <span>{new Date(event.detected_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
