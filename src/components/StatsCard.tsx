import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

export function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500">{trend}</p>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg bg-opacity-10`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
