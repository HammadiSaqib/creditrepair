import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Pencil, Trash2, RefreshCw, Users, ToggleLeft, ToggleRight } from 'lucide-react';

type EmployeeUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'employee' | 'user' | 'funding_manager' | 'admin' | string;
  status: 'active' | 'inactive' | string;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Employee = {
  id: number;
  status: 'active' | 'inactive' | string;
  createdAt: string;
  updatedAt: string;
  user: EmployeeUser;
};

type CreateEmployeeInput = {
  email: string;
  firstName: string;
  lastName: string;
  role?: 'employee';
  status?: 'active' | 'inactive';
  password?: string;
};

type UpdateEmployeeInput = {
  firstName?: string;
  lastName?: string;
  status?: 'active' | 'inactive';
};

function PageHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Employees</h1>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  children,
  variant = 'default',
  icon: Icon,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
}) {
  const base = 'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm';
  const variants: Record<string, string> = {
    default: 'bg-primary text-primary-foreground hover:opacity-90',
    outline: 'border border-input text-foreground hover:bg-muted',
    ghost: 'text-foreground hover:bg-muted',
  };
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function EmployeesTable({ employees, onEdit, onToggle, onDeactivate }: {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onToggle: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Role</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Created</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id} className="border-t border-muted">
              <td className="p-3">{e.user.firstName} {e.user.lastName}</td>
              <td className="p-3">{e.user.email}</td>
              <td className="p-3 capitalize">{e.user.role}</td>
              <td className="p-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${e.user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                  {e.user.status}
                </span>
              </td>
              <td className="p-3">{new Date(e.createdAt).toLocaleDateString()}</td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  <ActionButton variant="outline" icon={Pencil} onClick={() => onEdit(e)}>Edit</ActionButton>
                  <ActionButton variant="outline" icon={e.user.status === 'active' ? ToggleLeft : ToggleRight} onClick={() => onToggle(e)}>
                    {e.user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </ActionButton>
                  <ActionButton variant="outline" icon={Trash2} onClick={() => onDeactivate(e)}>Remove</ActionButton>
                </div>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td className="p-6 text-center text-muted-foreground" colSpan={6}>No employees found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Employees() {
  const qc = useQueryClient();

  const { data: employees = [], isLoading, refetch, isFetching } = useQuery<Employee[]>({
    queryKey: ['employees:list'],
    queryFn: async () => {
      const res = await employeesApi.getEmployees();
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateEmployeeInput) => employeesApi.createEmployee(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['employees:list'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: UpdateEmployeeInput }) => employeesApi.updateEmployee(vars.id, vars.payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['employees:list'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => employeesApi.toggleEmployeeStatus(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['employees:list'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => employeesApi.deactivateEmployee(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['employees:list'] });
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);

  const [formCreate, setFormCreate] = useState<CreateEmployeeInput>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'employee',
    status: 'active',
    password: '',
  });

  const [formEdit, setFormEdit] = useState<UpdateEmployeeInput>({});

  const canSubmitCreate = useMemo(() => {
    return (
      formCreate.email.trim() !== '' &&
      formCreate.firstName.trim() !== '' &&
      formCreate.lastName.trim() !== ''
    );
  }, [formCreate]);

  const onOpenEdit = (employee: Employee) => {
    setEditTarget(employee);
    setFormEdit({
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
      status: (employee.user.status as 'active' | 'inactive') || 'active',
    });
    setEditOpen(true);
  };

  return (
    <DashboardLayout title="Employees" description="Manage internal staff accounts and roles">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ActionButton icon={RefreshCw} variant="outline" onClick={() => refetch()} disabled={isFetching}>Refresh</ActionButton>
        </div>
        <ActionButton icon={Plus} onClick={() => setCreateOpen(true)}>Add Employee</ActionButton>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Loading employees...</div>
      ) : (
        <EmployeesTable
          employees={employees}
          onEdit={onOpenEdit}
          onToggle={(e) => toggleMutation.mutate(e.id)}
          onDeactivate={(e) => deactivateMutation.mutate(e.id)}
        />
      )}

      {/* Create Dialog */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setCreateOpen(false)} />
      )}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Employee</h2>
              <button className="text-muted-foreground" onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            <div className="grid gap-4">
              <Field label="First Name">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={formCreate.firstName}
                  onChange={(e) => setFormCreate({ ...formCreate, firstName: e.target.value })}
                />
              </Field>
              <Field label="Last Name">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={formCreate.lastName}
                  onChange={(e) => setFormCreate({ ...formCreate, lastName: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className="w-full rounded-md border px-3 py-2"
                  value={formCreate.email}
                  onChange={(e) => setFormCreate({ ...formCreate, email: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={formCreate.status || 'active'}
                  onChange={(e) => setFormCreate({ ...formCreate, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Password (optional)">
                <input
                  type="password"
                  className="w-full rounded-md border px-3 py-2"
                  value={formCreate.password || ''}
                  onChange={(e) => setFormCreate({ ...formCreate, password: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <ActionButton variant="outline" onClick={() => setCreateOpen(false)}>Cancel</ActionButton>
              <ActionButton
                onClick={async () => {
                  await createMutation.mutateAsync({
                    email: formCreate.email,
                    firstName: formCreate.firstName,
                    lastName: formCreate.lastName,
                    role: 'employee',
                    status: formCreate.status || 'active',
                    password: formCreate.password || undefined,
                  });
                  setCreateOpen(false);
                  setFormCreate({ email: '', firstName: '', lastName: '', role: 'employee', status: 'active', password: '' });
                }}
                disabled={!canSubmitCreate || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditOpen(false)} />
      )}
      {editOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Employee</h2>
              <button className="text-muted-foreground" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <div className="grid gap-4">
              <Field label="First Name">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={formEdit.firstName || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, firstName: e.target.value })}
                />
              </Field>
              <Field label="Last Name">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={formEdit.lastName || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, lastName: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={formEdit.status || 'active'}
                  onChange={(e) => setFormEdit({ ...formEdit, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <ActionButton variant="outline" onClick={() => setEditOpen(false)}>Cancel</ActionButton>
              <ActionButton
                onClick={async () => {
                  if (!editTarget) return;
                  await updateMutation.mutateAsync({ id: editTarget.id, payload: formEdit });
                  setEditOpen(false);
                  setEditTarget(null);
                  setFormEdit({});
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}