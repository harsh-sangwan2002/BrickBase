import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { Spinner } from '@/components/Spinner';
import { Building2, MessageSquare, Users } from 'lucide-react';

export function AdminOverview() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-analytics'], queryFn: adminApi.analytics });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const cards = [
    { icon: Users, label: 'Total users', value: data.total_users },
    { icon: Building2, label: 'Total properties', value: data.total_properties },
    { icon: MessageSquare, label: 'Total enquiries', value: data.total_enquiries },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Platform overview</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-navy-100 p-5 card-shadow">
            <Icon className="text-navy-500" size={20} />
            <p className="mt-3 text-2xl font-bold text-navy-900">{value}</p>
            <p className="text-sm text-navy-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy-100 p-5">
          <h2 className="font-semibold text-navy-900">Users by role</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(data.users_by_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="capitalize text-navy-500">{role}</span>
                <span className="font-semibold text-navy-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-navy-100 p-5">
          <h2 className="font-semibold text-navy-900">Properties by status</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(data.properties_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-navy-500">{status.replace('_', ' ')}</span>
                <span className="font-semibold text-navy-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
