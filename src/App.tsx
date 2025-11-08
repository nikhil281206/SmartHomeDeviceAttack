import { useEffect, useState } from 'react';
import { Shield, Plus, Activity, AlertTriangle, CheckCircle, Zap, FileDown, Settings } from 'lucide-react';
import { supabase, Device, SecurityEvent } from './lib/supabase';
import { DeviceCard } from './components/DeviceCard';
import { SecurityEventCard } from './components/SecurityEventCard';
import { StatsCard } from './components/StatsCard';
import { AddDeviceModal } from './components/AddDeviceModal';
import { SimulateAttackModal } from './components/SimulateAttackModal';
import { FilterPanel } from './components/FilterPanel';
import { AttackPatternsPanel } from './components/AttackPatternsPanel';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { ExportReportModal } from './components/ExportReportModal';

// --- RESOLUTION CONFIGURATION (UNCHANGED) ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ybeewhglazzsnlalcfmz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZWV3aGdsYXp6c25sYWxjZm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjY0MTcsImV4cCI6MjA3NzU0MjQxN30.VZWdeo2TdNU77ME8y3_LwAJ47PlDk2--M7xYL6jpKEE';
const RESOLVE_ENDPOINT = `${SUPABASE_URL}/functions/v1/resolve-event`;

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPatternsPanelOpen, setIsPatternsPanelOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchEvents();

    const devicesChannel = supabase
      .channel('devices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDevices();
      })
      .subscribe();

    const eventsChannel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const fetchDevices = async () => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDevices(data);
    }
    setLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('security_events')
      .select('*, devices(name, device_type)')
      .order('detected_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setEvents(data);
    }
  };

  const handleAddDevice = async (deviceData: {
    name: string;
    device_type: string;
    ip_address: string;
    mac_address: string;
  }) => {
    const { error } = await supabase
      .from('devices')
      .insert([{ ...deviceData, status: 'online' }]);

    if (!error) {
      fetchDevices();
    }
  };

  const handleSimulateAttack = async (
    deviceId: string,
    metrics: {
      cpu_usage: number;
      memory_usage: number;
      network_traffic: number;
      failed_auth_attempts: number;
    }
  ) => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-attacks`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
          ...metrics,
        }),
      });

      if (response.ok) {
        fetchEvents();
        fetchDevices();
      }
    } catch (error) {
      console.error('Error simulating attack:', error);
    }
  };

  const handleResolveEvent = async (eventId: string, deviceId: string) => {
    // 1. Mark the alert as resolved in the security_events table
    const { error: eventError } = await supabase
      .from('security_events')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', eventId);

    if (eventError) {
      console.error("Error marking event as resolved:", eventError);
      return;
    }
    
    // 2. Call the Edge Function to reset the device status in the 'devices' table
    try {
      const resolveResponse = await fetch(RESOLVE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
        }),
      });

      if (!resolveResponse.ok) {
         const errorData = await resolveResponse.json();
         console.error("Failed to reset device status:", errorData);
      }
      
    } catch (statusError) {
      console.error("Network error resetting device status:", statusError);
    }

    // 3. Refresh data to update the UI
    fetchEvents();
    fetchDevices();
  };

  // --- START NEW/MODIFIED FUNCTION DEFINITIONS (to fix the L335 error) ---
  const handleClearAll = async () => {
    // 1. Database Deletion (Clears resolved events)
    const { error } = await supabase
      .from('security_events')
      .delete()
      .eq('resolved', true); // Only delete items that are marked as resolved

    if (error) {
      console.error("Error clearing resolved events:", error);
      alert("Failed to clear resolved events from the database.");
      return;
    }

    // 2. Clear Local Filters/State (Crucial for resetting the UI)
    setSeverityFilter('all');
    setEventTypeFilter('all');
    setShowResolved(false);
    
    // 3. Refresh the UI to reflect deleted events
    fetchEvents(); 
  };

  // The following functions are now obsolete and can be deleted from the original file:
  // const handleClearFilters = () => { /* ... */ };
  // const handleClearEvents = async () => { /* ... */ };
  // --- END NEW/MODIFIED FUNCTION DEFINITIONS ---
  
  const filteredEvents = events.filter((event) => {
    if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
    if (eventTypeFilter !== 'all' && event.event_type !== eventTypeFilter) return false;
    if (!showResolved && event.resolved) return false;
    return true;
  });

  const stats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter((d) => d.status === 'online').length,
    compromisedDevices: devices.filter((d) => d.status === 'compromised').length,
    activeAlerts: events.filter((e) => !e.resolved).length,
    criticalEvents: events.filter((e) => e.severity === 'critical' && !e.resolved).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Home Security</h1>
              <p className="text-gray-600">Real-time attack detection and monitoring</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Devices"
            value={stats.totalDevices}
            icon={Activity}
            color="text-blue-600"
          />
          <StatsCard
            title="Online Devices"
            value={stats.onlineDevices}
            icon={CheckCircle}
            color="text-green-600"
          />
          <StatsCard
            title="Compromised"
            value={stats.compromisedDevices}
            icon={AlertTriangle}
            color="text-red-600"
          />
          <StatsCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={Shield}
            color="text-orange-600"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Device
          </button>
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Zap className="w-5 h-5" />
            Simulate Attack
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <FileDown className="w-5 h-5" />
            Export Report
          </button>
          <button
            onClick={() => setIsPatternsPanelOpen(!isPatternsPanelOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Attack Patterns
          </button>
        </div>

        {isPatternsPanelOpen && (
          <div className="mb-8">
            <AttackPatternsPanel />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monitored Devices</h2>
            {devices.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No devices registered yet</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Device
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div key={device.id} onClick={() => setSelectedDevice(device)} className="cursor-pointer">
                    <DeviceCard device={device} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Security Events</h2>

            <FilterPanel
                severity={severityFilter}
                eventType={eventTypeFilter}
                showResolved={showResolved}
                onSeverityChange={setSeverityFilter}
                onEventTypeChange={setEventTypeFilter}
                onShowResolvedChange={setShowResolved}
                onClearFilters={handleClearAll} // <--- NOW CALLS THE FUNCTION THAT DELETES AND RESETS FILTERS
              />

            {events.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-600">No security events detected</p>
                <p className="text-sm text-gray-500 mt-2">Your devices are secure</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No events match your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <SecurityEventCard
                    key={event.id}
                    event={event}
                    onResolve={() => handleResolveEvent(event.id, event.device_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDevice}
      />

      <SimulateAttackModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        devices={devices}
        onSimulate={handleSimulateAttack}
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        events={events}
        devices={devices}
      />

      <DeviceDetailModal
        device={selectedDevice}
        isOpen={selectedDevice !== null}
        onClose={() => setSelectedDevice(null)}
      />
    </div>
  );
}

export default App;