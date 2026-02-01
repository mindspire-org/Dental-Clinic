import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { staffApi } from '@/lib/api';
import { toast } from 'sonner';

type RoleManagedUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  username: string;
  role: 'dentist' | 'receptionist';
  permissions?: string[];
  isActive?: boolean;
};

const RoleManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<string[]>([]);
  const [users, setUsers] = useState<RoleManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const selectedUser = useMemo(
    () => users.find((u) => u._id === selectedUserId) || null,
    [selectedUserId, users]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [modsRes, usersRes] = await Promise.all([
          staffApi.getRoleManagementModules(),
          staffApi.getRoleManagementUsers(),
        ]);

        const mods = (modsRes?.data?.modules || []) as string[];
        const usr = (usersRes?.data?.users || []) as RoleManagedUser[];

        if (!mounted) return;
        setModules(mods);
        setUsers(usr);

        if (usr.length && !selectedUserId) {
          const firstId = usr[0]._id;
          setSelectedUserId(firstId);
          setSelectedPermissions(Array.isArray(usr[0].permissions) ? usr[0].permissions : []);
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load role management');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    setSelectedPermissions(Array.isArray(selectedUser.permissions) ? selectedUser.permissions : []);
  }, [selectedUser]);

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const selectAll = () => {
    setSelectedPermissions(modules);
  };

  const clearAll = () => {
    setSelectedPermissions([]);
  };

  const save = async () => {
    if (!selectedUserId) return;
    if (saving) return;

    try {
      setSaving(true);
      await staffApi.setRoleManagementUserPermissions(selectedUserId, { permissions: selectedPermissions });

      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUserId ? { ...u, permissions: selectedPermissions } : u))
      );

      toast.success('Permissions updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState type="table" rows={8} />
      </DashboardLayout>
    );
  }

  if (!users.length) {
    return (
      <DashboardLayout>
        <EmptyState
          title="No users found"
          description="Create dentist or receptionist users first, then assign module access here."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Assign module access to Dentist and Receptionist users</p>
          </div>
          <Button onClick={save} disabled={!selectedUserId || saving} className="gradient-primary">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Select user</div>
                <Select
                  value={selectedUserId}
                  onValueChange={(v) => {
                    setSelectedUserId(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Selected</div>
                <div className="rounded-md border p-3">
                  <div className="font-medium">
                    {selectedUser ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.username : '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
                  <div className="text-sm text-muted-foreground">Role: {selectedUser?.role}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Module Access</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={selectAll} disabled={!modules.length}>
                  Select all
                </Button>
                <Button type="button" variant="outline" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <div key={m} className="flex items-center justify-between rounded-md border p-3">
                  <div className="font-medium">{m}</div>
                  <Switch checked={selectedPermissions.includes(m)} onCheckedChange={() => togglePermission(m)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
