import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users as UsersIcon, Shield, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { adminService } from '../services/admin.service';
import { formatRelativeTime } from '../utils/format';
import { getErrorMessage } from '../services/api';

const Users = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, roleFilter, page }],
    queryFn: () =>
      adminService.getUsers({
        search: search || undefined,
        platformRole: roleFilter || undefined,
        page,
        limit: 20,
      }),
    keepPreviousData: true,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }) => adminService.suspendUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User suspended');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id) => adminService.unsuspendUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User unsuspended');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSuspend = (user) => {
    const reason = prompt('Reason for suspension (optional):');
    if (reason !== null) {
      suspendMutation.mutate({ id: user._id, reason });
    }
  };

  const handleUnsuspend = (user) => {
    if (confirm(`Unsuspend ${user.email}?`)) {
      unsuspendMutation.mutate(user._id);
    }
  };

  const users = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Users</h1>
        <p className="text-gray-600 mt-1">
          {meta.total || 0} platform users
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          <option value="">All roles</option>
          <option value="merchant">Merchants</option>
          <option value="platform_admin">Platform Admins</option>
          <option value="support">Support</option>
        </select>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-dark">
                      {user.firstName} {user.lastName}
                    </p>
                    {user.platformRole === 'platform_admin' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                    {user.isSuspended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        <Ban className="w-3 h-3" />
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Joined {formatRelativeTime(user.createdAt)} •{' '}
                    {user.storeAccess?.length || 0} stores
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {user.platformRole !== 'platform_admin' && (
                    user.isSuspended ? (
                      <button
                        onClick={() => handleUnsuspend(user)}
                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspend(user)}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        Suspend
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline">
              Previous
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages} className="btn-outline">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;