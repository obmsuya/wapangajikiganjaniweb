'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  Phone,
  Mail,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

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
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { useManagerStore } from '@/stores/landlord/useManagerStore';
import PropertyService from '@/services/landlord/property';

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function Dot({ on }) {
  return on ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyManagers({ onAssign }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No managers yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Assign someone to manage this property
        </p>
      </div>
      <Button size="sm" onClick={onAssign}>
        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
        Assign manager
      </Button>
    </div>
  );
}

// ── Assign / Edit Dialog ──────────────────────────────────────────────────────

const EMPTY_FORM = {
  phone_number: '',
  full_name: '',
  email: '',
  can_create_tenants: true,
  can_collect_payments: true,
  can_manage_maintenance: true,
  is_active: true,
};

const PERMISSIONS = [
  { key: 'can_create_tenants',     label: 'Create tenants'    },
  { key: 'can_collect_payments',   label: 'Collect payments'  },
  { key: 'can_manage_maintenance', label: 'Manage maintenance'},
];

function AssignEditDialog({ open, onClose, property, manager }) {
  const { assignManager, updateManager, actionLoading } = useManagerStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const isEdit = !!manager;

  useEffect(() => {
    if (manager) {
      setForm({
        phone_number:           manager.phone_number,
        full_name:              manager.full_name,
        email:                  manager.email || '',
        can_create_tenants:     manager.can_create_tenants,
        can_collect_payments:   manager.can_collect_payments,
        can_manage_maintenance: manager.can_manage_maintenance,
        is_active:              manager.is_active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [manager, open]);

  const patch = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (isEdit) {
      const res = await updateManager(
        manager.id,
        {
          can_create_tenants:     form.can_create_tenants,
          can_collect_payments:   form.can_collect_payments,
          can_manage_maintenance: form.can_manage_maintenance,
          is_active:              form.is_active,
        },
        property?.id
      );
      if (res.success) onClose();
      return;
    }

    if (!form.phone_number || !form.full_name) {
      toast.error('Phone number and full name are required');
      return;
    }

    const res = await assignManager({
      property_id:  property.id,
      phone_number: form.phone_number,
      full_name:    form.full_name,
      email:        form.email || undefined,
    });
    if (res.success) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Manager' : 'Assign Manager'}</DialogTitle>
          {!isEdit && property && (
            <DialogDescription className="flex items-center gap-1.5 text-xs">
              <Building2 className="h-3 w-3" />
              {property.name}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Identity — new only */}
          {!isEdit && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Phone number <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="+255700000000"
                  value={form.phone_number}
                  onChange={e => patch('phone_number', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Amina Hassan"
                  value={form.full_name}
                  onChange={e => patch('full_name', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Email <span className="font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="amina@example.com"
                  value={form.email}
                  onChange={e => patch('email', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Permissions
            </p>
            <div className="rounded-md border divide-y">
              {PERMISSIONS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-3 py-2.5">
                  <label htmlFor={key} className="text-sm cursor-pointer select-none">
                    {label}
                  </label>
                  <Checkbox
                    id={key}
                    checked={form[key]}
                    onCheckedChange={v => patch(key, v)}
                  />
                </div>
              ))}
              {isEdit && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <label htmlFor="is_active" className="text-sm cursor-pointer select-none">
                    Active
                  </label>
                  <Checkbox
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={v => patch('is_active', v)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={actionLoading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={actionLoading} className="flex-1">
            {actionLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Assign manager'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ open, onClose, onConfirm, name, loading }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove manager</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{name}</strong> will be permanently removed and their access revoked from all
            properties. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Removing…' : 'Remove manager'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Manager row ───────────────────────────────────────────────────────────────

function ManagerRow({ manager, property, onEdit, onDelete }) {
  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium leading-tight">{manager.full_name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-2.5 w-2.5" />
            {manager.phone_number}
          </span>
          {manager.email && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-2.5 w-2.5" />
              {manager.email}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell>
        {manager.is_active ? (
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-xs">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Inactive
          </Badge>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Dot on={manager.can_create_tenants} /> Tenants
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Dot on={manager.can_collect_payments} /> Payments
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Dot on={manager.can_manage_maintenance} /> Maint.
          </span>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(manager)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit permissions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(manager)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Remove manager
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ── Property accordion item ───────────────────────────────────────────────────

function PropertyAccordionItem({ property }) {
  const { propertyManagers, fetchPropertyManagers, removeFromProperty, loading, actionLoading } =
    useManagerStore();

  const [assignOpen,   setAssignOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const managers = propertyManagers[property.id] || [];

  // Fetch on mount so data is ready when accordion opens
  useEffect(() => {
    fetchPropertyManagers(property.id);
  }, [property.id]);

  const handleRemove = async () => {
    const res = await removeFromProperty(deleteTarget.id, property.id);
    if (res.success) setDeleteTarget(null);
  };

  return (
    <>
      <AccordionItem value={String(property.id)} className="border-none">
        <AccordionTrigger
          className="px-5 py-4 hover:no-underline hover:bg-muted/40 rounded-lg data-[state=open]:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/8 border shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>

            <div className="flex flex-col items-start gap-0.5 min-w-0">
              <span className="text-sm font-semibold leading-tight truncate">{property.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {property.category}
                </Badge>
                {property.location && (
                  <span className="text-xs text-muted-foreground truncate">{property.location}</span>
                )}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={e => { e.stopPropagation(); setAssignOpen(true); }}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Assign
              </Button>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                managers.length > 0
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Users className="h-3 w-3" />
                {managers.length} {managers.length === 1 ? 'manager' : 'managers'}
              </div>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-5 pb-5 pt-2">
          {loading ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          ) : managers.length === 0 ? (
            <EmptyManagers onAssign={() => setAssignOpen(true)} />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs">Manager</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Permissions</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map(m => (
                    <ManagerRow
                      key={m.id}
                      manager={m}
                      property={property}
                      onEdit={setEditTarget}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AssignEditDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        property={property}
        manager={null}
      />
      <AssignEditDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        property={property}
        manager={editTarget}
      />
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManagersPage() {
  const [properties,        setProperties]        = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res  = await PropertyService.getProperties();
        const list = Array.isArray(res) ? res : res.results || [];
        setProperties(list);
      } catch {
        toast.error('Failed to load properties');
      } finally {
        setPropertiesLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Managers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign managers to properties and control what they can do.
          </p>
        </div>
        {!propertiesLoading && properties.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/40 shrink-0">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Body */}
      {propertiesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 px-5 py-4 border rounded-lg">
              <Skeleton className="w-9 h-9 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border rounded-lg text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No properties found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a property first to assign managers.
            </p>
          </div>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {properties.map(p => (
            <div key={p.id} className="border rounded-lg overflow-hidden">
              <PropertyAccordionItem property={p} />
            </div>
          ))}
        </Accordion>
      )}
    </div>
  );
}