import { Filter, X } from 'lucide-react';

interface FilterPanelProps {
  severity: string;
  eventType: string;
  showResolved: boolean;
  onSeverityChange: (severity: string) => void;
  onEventTypeChange: (type: string) => void;
  onShowResolvedChange: (show: boolean) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  severity,
  eventType,
  showResolved,
  onSeverityChange,
  onEventTypeChange,
  onShowResolvedChange,
  onClearFilters,
}: FilterPanelProps) {
  const hasActiveFilters = severity !== 'all' || eventType !== 'all' || showResolved;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Severity
          </label>
          <select
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => onEventTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="brute_force">Brute Force</option>
            <option value="ddos">DDoS</option>
            <option value="resource_anomaly">Resource Anomaly</option>
            <option value="unauthorized_access">Unauthorized Access</option>
            <option value="port_scanning">Port Scanning</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => onShowResolvedChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Show Resolved
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
