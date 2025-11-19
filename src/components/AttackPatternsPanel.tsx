import { Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, AttackPattern } from '../lib/supabase';

export function AttackPatternsPanel() {
  const [patterns, setPatterns] = useState<AttackPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    const { data, error } = await supabase
      .from('attack_patterns')
      .select('*')
      .order('severity', { ascending: false });

    if (!error && data) {
      setPatterns(data);
    }
    setLoading(false);
  };

  const togglePattern = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('attack_patterns')
      .update({ active: !currentState })
      .eq('id', id);

    if (!error) {
      fetchPatterns();
    }
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attack Patterns</h3>
        <p className="text-sm text-gray-500">Loading patterns...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Attack Detection Patterns</h3>
      </div>

      <div className="space-y-3">
        {patterns.map((pattern) => (
          <div
            key={pattern.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{pattern.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityColors[pattern.severity]}`}>
                    {pattern.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{pattern.description}</p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Rules:</span>{' '}
                  {Object.entries(pattern.detection_rules).map(([key, value]) => (
                    <span key={key} className="mr-2">
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => togglePattern(pattern.id, pattern.active)}
                className="flex-shrink-0"
              >
                {pattern.active ? (
                  <ToggleRight className="w-8 h-8 text-green-600 hover:text-green-700 transition-colors" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-gray-500 transition-colors" />
                )}
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className={`text-xs font-medium ${pattern.active ? 'text-green-600' : 'text-gray-500'}`}>
                {pattern.active ? 'Active - Monitoring' : 'Inactive - Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
