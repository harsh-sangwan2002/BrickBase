import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api/admin';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';

export function UsersAdmin() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState('');
  const query = role ? `?role=${role}` : '';
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', role], queryFn: () => adminApi.listUsers(query) });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) => adminApi.setUserStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminApi.verifyAgent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy-900">Users</h1>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-navy-100 px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="buyer">Buyer</option>
          <option value="owner">Owner</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-navy-100">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-left text-navy-500">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => (
                <tr key={u.id} className="border-t border-navy-100">
                  <td className="p-3 font-medium text-navy-900">{u.full_name}</td>
                  <td className="p-3 capitalize text-navy-600">{u.role}</td>
                  <td className="p-3">
                    <Badge tone={u.status === 'active' ? 'green' : u.status === 'pending' ? 'amber' : 'red'}>{u.status}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {u.status !== 'suspended' ? (
                        <Button variant="danger" size="sm" onClick={() => statusMutation.mutate({ id: u.id, status: 'suspended' })}>
                          Suspend
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => statusMutation.mutate({ id: u.id, status: 'active' })}>
                          Reactivate
                        </Button>
                      )}
                      {u.role === 'agent' && !u.is_license_verified && (
                        <Button variant="secondary" size="sm" onClick={() => verifyMutation.mutate(u.id)}>
                          Verify license
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
