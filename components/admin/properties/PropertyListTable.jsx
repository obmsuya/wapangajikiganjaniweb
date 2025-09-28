'use client';

import React, { useState } from 'react';
import {
  usePropertiesList,
  useDeleteProperty,
} from '@/hooks/admin/useAdminProperties';
import { CloudflareTable } from '@/components/cloudflare/Table';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, Trash2, Building, MapPin, User, Calendar } from 'lucide-react';

export default function PropertyListTable() {
  /* ---------- local state ---------- */
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  /* ---------- data ---------- */
  const {
    properties,
    loading,
    error,
    filters,
    updateFilters,
    updatePagination,
    limit,
    refreshProperties,
  } = usePropertiesList();

  const { remove } = useDeleteProperty();

  /* ---------- delete flow ---------- */
  const confirmDelete = (id) => setIdToDelete(id);
  const cancelDelete = () => setIdToDelete(null);
  const proceedDelete = async () => {
    try {
      await remove(idToDelete);
      toast.success('Property deleted');
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    } finally {
      cancelDelete();
    }
  };

  /* ---------- view detail ---------- */
  const viewDetail = (row) => {
    setSelectedId(row.id);
    setDetailOpen(true);
  };

  /* ---------- columns ---------- */
  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Location',
      accessor: 'location',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Units',
      accessor: 'total_units',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.total_units}</span>
          <span className="text-xs text-gray-500">
            ({row.total_units
              ? `${Math.round((row.occupancy_rate / 100) * row.total_units)} occupied`
              : '0 occupied'})
          </span>
        </div>
      ),
    },
    {
      header: 'Occupancy',
      accessor: 'occupancy_rate',
      sortable: true,
      cell: (row) => {
        const rate = row.occupancy_rate || 0;
        let color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (rate < 50) color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        else if (rate < 80) color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${rate}%` }} />
            </div>
            <Badge className={color}>{rate}%</Badge>
          </div>
        );
      },
    },
    {
      header: 'Owner',
      accessor: 'owner_name',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.owner_name}</span>
        </div>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      type: 'date',
      cell: (row) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      type: 'actions',
      actions: [
        {
          label: 'View',
          icon: <Eye className="h-4 w-4" />,
          onClick: viewDetail,
        },
        {
          label: 'Delete',
          icon: <Trash2 className="h-4 w-4" />,
          variant: 'destructive',
          onClick: (row) => confirmDelete(row.id),
        },
      ],
    },
  ];

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Properties</h2>
        {/* Admin does NOT add properties – button removed */}
      </div>

      <CloudflareTable
        data={properties}
        columns={columns}
        loading={loading}
        error={error}
        initialSort={{ field: 'created_at', direction: 'desc' }}
        initialFilters={filters}
        pagination
        searchable
        rowsPerPageOptions={[10, 25, 50, 100]}
        initialRowsPerPage={limit}
        onFiltersChange={updateFilters}
        onPaginationChange={updatePagination}
        emptyMessage="No properties found"
      />

      {/* ---- detail dialog (read-only) ---- */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
          </DialogHeader>

          {!selectedId || loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DetailPanel property={properties.find((p) => p.id === selectedId)} />
          )}
        </DialogContent>
      </Dialog>

      {/* ---- delete confirm ---- */}
      <AlertDialog open={!!idToDelete} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The property will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceedDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- static detail panel ---------- */
function DetailPanel({ property }) {
  if (!property) return <p className="text-red-600">Property not found</p>;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{property.name}</p></div>
          <div><p className="text-sm text-gray-500">Category</p><p className="font-medium">{property.category}</p></div>
          <div><p className="text-sm text-gray-500">Location</p><p className="font-medium">{property.location}</p></div>
          <div><p className="text-sm text-gray-500">Total Floors</p><p className="font-medium">{property.total_floors}</p></div>
          <div><p className="text-sm text-gray-500">Total Units</p><p className="font-medium">{property.total_units}</p></div>
          <div><p className="text-sm text-gray-500">Occupancy Rate</p><p className="font-medium">{property.occupancy_rate}%</p></div>
          <div className="col-span-2"><p className="text-sm text-gray-500">Owner</p><p className="font-medium">{property.owner_name}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}