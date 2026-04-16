'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Building2, Users, UserPlus, Pencil, Trash2,
  ShieldCheck, Phone, Mail, MoreHorizontal,
  CheckCircle2, XCircle, Search, ArrowUpDown,
  ArrowUp, ArrowDown,
} from 'lucide-react';

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button }    from '@/components/ui/button';
import { Input }     from '@/components/ui/input';
import { Label }     from '@/components/ui/label';
import { Badge }     from '@/components/ui/badge';
import { Checkbox }  from '@/components/ui/checkbox';
import { Skeleton }  from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { useManagerStore }   from '@/stores/landlord/useManagerStore';
import PropertyService       from '@/services/landlord/property';

// ── helpers ───────────────────────────────────────────────────────────────────

function PermIcon({ on }) {
  return on
    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
    : <XCircle      className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />;
}

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sort.dir === 'asc'
    ? <ArrowUp   className="h-3 w-3 ml-1" />
    : <ArrowDown className="h-3 w-3 ml-1" />;
}

// ── empty state ───────────────────────────────────────────────────────────────

function EmptyManagers({ onAssign }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No managers assigned</p>
      <p className="text-xs text-muted-foreground">Assign someone to manage this property.</p>
      <Button size="sm" className="mt-1" onClick={onAssign}>
        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Assign manager
      </Button>
    </div>
  );
}

// ── assign / edit dialog ──────────────────────────────────────────────────────

const EMPTY = {
  phone_number: '', full_name: '', email: '',
  can_create_tenants: true, 
  can_collect_payments: false,
  can_manage_maintenance: true, is_active: true,
};

const PERMS = [
  { key: 'can_create_tenants',     label: 'Create tenants'    },
  // { key: 'can_collect_payments',   label: 'Collect payments'  },
  { key: 'can_manage_maintenance', label: 'Manage maintenance'},
];

function AssignEditDialog({ open, onClose, property, manager }) {
  const { assignManager, updateManager, actionLoading } = useManagerStore();
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!manager;

  useEffect(() => {
    setForm(manager ? {
      phone_number:           manager.phone_number,
      full_name:              manager.full_name,
      email:                  manager.email || '',
      can_create_tenants:     manager.can_create_tenants,
      can_collect_payments:   manager.can_collect_payments,
      can_manage_maintenance: manager.can_manage_maintenance,
      is_active:              manager.is_active,
    } : EMPTY);
  }, [manager, open]);

  const patch = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (isEdit) {
      const res = await updateManager(manager.id, {
        full_name:              form.full_name,
        phone_number:           form.phone_number,
        email:                  form.email || undefined,
        can_create_tenants:     form.can_create_tenants,
        can_collect_payments:   form.can_collect_payments,
        can_manage_maintenance: form.can_manage_maintenance,
        is_active:              form.is_active,
      }, property?.id);
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
              <Building2 className="h-3 w-3" /> {property.name}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Identity fields — always shown, editable in both modes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">
                Phone number {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              <Input
                placeholder="+255700000000"
                value={form.phone_number}
                onChange={e => patch('phone_number', e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">
                Full name {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              <Input
                placeholder="Amina Hassan"
                value={form.full_name}
                onChange={e => patch('full_name', e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
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

          <Separator />

          {/* Permissions */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Permissions
            </p>
            <div className="rounded-md border divide-y">
              {PERMS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-3 py-2.5">
                  <label htmlFor={key} className="text-sm cursor-pointer select-none">{label}</label>
                  <Checkbox id={key} checked={form[key]} onCheckedChange={v => patch(key, v)} />
                </div>
              ))}
              {isEdit && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <label htmlFor="is_active" className="text-sm cursor-pointer select-none">Active</label>
                  <Checkbox id="is_active" checked={form.is_active} onCheckedChange={v => patch('is_active', v)} />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={actionLoading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={submit} disabled={actionLoading} className="flex-1">
            {actionLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ open, onClose, onConfirm, name, loading }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove manager</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{name}</strong> will be removed and their access revoked. Cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm} disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Removing…' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── data table ────────────────────────────────────────────────────────────────

const COLS = [
  { key: 'full_name',  label: 'Manager'     },
  { key: 'is_active',  label: 'Status'      },
  { key: 'perms',      label: 'Permissions', noSort: true },
];

function ManagersDataTable({ managers, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState({ col: 'full_name', dir: 'asc' });

  const toggle = col => setSort(s =>
    s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }
  );

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    let list = managers.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.phone_number.includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );

    list = [...list].sort((a, b) => {
      let av = a[sort.col], bv = b[sort.col];
      if (typeof av === 'boolean') { av = av ? 1 : 0; bv = bv ? 1 : 0; }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ?  1 : -1;
      return 0;
    });
    return list;
  }, [managers, search, sort]);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Search by name, phone or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {COLS.map(c => (
                <TableHead key={c.key} className="text-xs">
                  {c.noSort ? c.label : (
                    <button
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => toggle(c.key)}
                    >
                      {c.label}
                      <SortIcon col={c.key} sort={sort} />
                    </button>
                  )}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  No managers match your search.
                </TableCell>
              </TableRow>
            ) : rows.map(m => (
              <TableRow key={m.id} className="group">

                {/* Manager */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{m.full_name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" /> {m.phone_number}
                    </span>
                    {m.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5" /> {m.email}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  {m.is_active
                    ? <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-xs">Active</Badge>
                    : <Badge variant="outline" className="text-muted-foreground text-xs">Inactive</Badge>
                  }
                </TableCell>

                {/* Permissions */}
                <TableCell>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1 min-w-[220px]">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PermIcon on={m.can_create_tenants} /> Tenants
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PermIcon on={m.can_collect_payments} /> Payments
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PermIcon on={m.can_manage_maintenance} /> Maint.
                    </span>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onEdit(m)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Edit manager
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Row count */}
      <p className="text-xs text-muted-foreground">
        {rows.length} of {managers.length} manager{managers.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ── property accordion item ───────────────────────────────────────────────────

function PropertyAccordionItem({ property }) {
  const { propertyManagers, fetchPropertyManagers, removeFromProperty, loading, actionLoading } =
    useManagerStore();

  const [assignOpen,   setAssignOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const managers = propertyManagers[property.id] || [];

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
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 data-[state=open]:bg-muted/40 transition-colors rounded-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">

            {/* icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted border shrink-0">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* name + meta */}
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold truncate">{property.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{property.category}</Badge>
                {property.location && (
                  <span className="text-[11px] text-muted-foreground truncate">{property.location}</span>
                )}
              </div>
            </div>

            {/* right side */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* tiny assign button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full border"
                title="Assign manager"
                onClick={e => { e.stopPropagation(); setAssignOpen(true); }}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>

              {/* count pill */}
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                managers.length > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {managers.length} {managers.length === 1 ? 'manager' : 'managers'}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4 pt-1">
          {loading ? (
            <div className="space-y-2 pt-2">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : managers.length === 0 ? (
            <EmptyManagers onAssign={() => setAssignOpen(true)} />
          ) : (
            <ManagersDataTable
              managers={managers}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
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

// ── page ──────────────────────────────────────────────────────────────────────

export default function ManagersPage() {
  const [properties,        setProperties]        = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res  = await PropertyService.getProperties();
        setProperties(Array.isArray(res) ? res : res.results || []);
      } catch {
        toast.error('Failed to load properties');
      } finally {
        setPropertiesLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">

      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Managers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign managers to properties and control what they can do.
          </p>
        </div>
        {!propertiesLoading && properties.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/40 shrink-0 text-sm text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </div>
        )}
      </div>

      <Separator />

      {/* body */}
      {propertiesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border rounded-lg">
              <Skeleton className="w-8 h-8 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border rounded-lg text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No properties found</p>
          <p className="text-xs text-muted-foreground">Add a property first to assign managers.</p>
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