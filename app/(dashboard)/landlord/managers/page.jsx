'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

import { useManagerStore } from '@/stores/landlord/useManagerStore';
import PropertyService from '@/services/landlord/property';

// ── Small helpers ────────────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return active ? (
    <Badge variant="outline" className="text-green-700 border-green-600">Active</Badge>
  ) : (
    <Badge variant="outline" className="text-red-600 border-red-500">Inactive</Badge>
  );
}

function PermissionDot({ allowed }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${allowed ? 'bg-green-500' : 'bg-gray-300'}`} />
  );
}

// ── Assign / Edit dialog ─────────────────────────────────────────────────────

const EMPTY_FORM = {
  mode: 'new',        // 'new' | 'existing' | 'edit'
  manager_id: null,
  phone_number: '',
  full_name: '',
  email: '',
  can_create_tenants: true,
  can_collect_payments: true,
  can_manage_maintenance: true,
  is_active: true,
};

function AssignEditDialog({ open, onClose, property, manager, existingManagers }) {
  const { assignManager, updateManager, actionLoading } = useManagerStore();
  const [form, setForm] = useState(EMPTY_FORM);

  // Populate form when editing
  useEffect(() => {
    if (manager) {
      setForm({
        mode: 'edit',
        manager_id: manager.id,
        phone_number: manager.phone_number,
        full_name: manager.full_name,
        email: manager.email || '',
        can_create_tenants: manager.can_create_tenants,
        can_collect_payments: manager.can_collect_payments,
        can_manage_maintenance: manager.can_manage_maintenance,
        is_active: manager.is_active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [manager, open]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (form.mode === 'edit') {
      const res = await updateManager(
        form.manager_id,
        {
          can_create_tenants: form.can_create_tenants,
          can_collect_payments: form.can_collect_payments,
          can_manage_maintenance: form.can_manage_maintenance,
          is_active: form.is_active,
        },
        property.id
      );
      if (res.success) onClose();
      return;
    }

    // Assign — new or existing
    if (!form.phone_number || !form.full_name) {
      toast.error('Phone number and full name are required');
      return;
    }

    const res = await assignManager({
      property_id: property.id,
      phone_number: form.phone_number,
      full_name: form.full_name,
      email: form.email || undefined,
    });
    if (res.success) onClose();
  };

  const isEdit = form.mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Manager' : `Assign Manager — ${property?.name}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* New manager fields — hidden in edit mode */}
          {!isEdit && (
            <>
              <div className="space-y-1">
                <Label>Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="+255700000000"
                  value={form.phone_number}
                  onChange={(e) => set('phone_number', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Permissions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Permissions</Label>
            {[
              { key: 'can_create_tenants', label: 'Can create tenants' },
              { key: 'can_collect_payments', label: 'Can collect payments' },
              { key: 'can_manage_maintenance', label: 'Can manage maintenance' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={key}
                  checked={form[key]}
                  onCheckedChange={(v) => set(key, v)}
                />
                <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
              </div>
            ))}
          </div>

          {/* Active toggle — edit only */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(v) => set('is_active', v)}
              />
              <label htmlFor="is_active" className="text-sm cursor-pointer">Active</label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={actionLoading}>
            {actionLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Assign Manager'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ open, onClose, onConfirm, name, loading }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Manager</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{name}</strong> and remove them from all properties.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Property accordion row ───────────────────────────────────────────────────

function PropertyAccordionItem({ property }) {
  const { propertyManagers, fetchPropertyManagers, removeFromProperty, deleteManager, actionLoading } =
    useManagerStore();

  const [loaded, setLoaded] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // manager being edited
  const [deleteTarget, setDeleteTarget] = useState(null); // manager being deleted

  const managers = propertyManagers[property.id] || [];

  const handleOpen = async () => {
    if (!loaded) {
      await fetchPropertyManagers(property.id);
      setLoaded(true);
    }
  };

  const handleRemove = async () => {
    const res = await removeFromProperty(deleteTarget.id, property.id);
    if (res.success) setDeleteTarget(null);
  };

  return (
    <>
      <AccordionItem value={String(property.id)}>
        <AccordionTrigger onClick={handleOpen} className="px-4">
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-center gap-3">
              <span className="font-medium">{property.name}</span>
              <Badge variant="secondary" className="text-xs">{property.category}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{managers.length} manager{managers.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              + Assign Manager
            </Button>
          </div>

          {!loaded ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : managers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No managers assigned to this property.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Tenants</TableHead>
                  <TableHead className="text-center">Payments</TableHead>
                  <TableHead className="text-center">Maint.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.phone_number}</TableCell>
                    <TableCell><StatusBadge active={m.is_active} /></TableCell>
                    <TableCell className="text-center"><PermissionDot allowed={m.can_create_tenants} /></TableCell>
                    <TableCell className="text-center"><PermissionDot allowed={m.can_collect_payments} /></TableCell>
                    <TableCell className="text-center"><PermissionDot allowed={m.can_manage_maintenance} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditTarget(m)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(m)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Assign dialog */}
      <AssignEditDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        property={property}
        manager={null}
      />

      {/* Edit dialog */}
      <AssignEditDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        property={property}
        manager={editTarget}
      />

      {/* Delete confirmation */}
      <DeleteConfirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRemove}
        name={deleteTarget?.full_name}
        loading={actionLoading}
      />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ManagersPage() {
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await PropertyService.getProperties();
        const list = Array.isArray(res) ? res : res.results || [];
        setProperties(list);
      } catch {
        toast.error('Failed to load properties');
      } finally {
        setPropertiesLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Managers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign and manage property managers per property.
        </p>
      </div>

      {/* Accordion */}
      {propertiesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="border rounded-md px-6 py-12 text-center text-muted-foreground">
          No properties found. Add a property first.
        </div>
      ) : (
        <Accordion type="multiple" className="border rounded-md divide-y">
          {properties.map((p) => (
            <PropertyAccordionItem key={p.id} property={p} />
          ))}
        </Accordion>
      )}
    </div>
  );
}