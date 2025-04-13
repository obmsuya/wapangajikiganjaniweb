// app/components/cloudflare/Table.js
'use client'
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  X, 
  Check,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CloudflareCard } from './Card';

/**
 * CloudflareTable Component
 * 
 * A table component inspired by Cloudflare's UI design with support for:
 * - Sorting
 * - Filtering
 * - Pagination
 * - Row selection
 * - Custom cell rendering
 */
const CloudflareTable = ({
  data = [],
  columns = [],
  initialSort = null,
  initialFilters = {},
  pagination = true,
  rowsPerPageOptions = [10, 25, 50, 100],
  initialRowsPerPage = 10,
  searchable = true,
  selectable = false,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  className = '',
  ...props
}) => {
  // State management
  const [sortField, setSortField] = useState(initialSort?.field || null);
  const [sortDirection, setSortDirection] = useState(initialSort?.direction || 'asc');
  const [filters, setFilters] = useState(initialFilters || {});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map(col => ({ ...col, visible: col.visible !== false }))
  );
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);
  
  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle filters
  const handleFilterChange = (field, value) => {
    if (value === '' || value === null || value === undefined) {
      const newFilters = { ...filters };
      delete newFilters[field];
      setFilters(newFilters);
    } else {
      setFilters({
        ...filters,
        [field]: value
      });
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Apply filters and search to data
  const filteredData = data.filter(row => {
    // Check filters
    const passesFilters = Object.keys(filters).every(field => {
      if (!filters[field]) return true;
      return row[field] === filters[field];
    });
    
    // Check search
    const passesSearch = !searchQuery || 
      Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return passesFilters && passesSearch;
  });
  
  // Apply sorting to filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = aValue > bValue ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Apply pagination
  const paginatedData = pagination 
    ? sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) 
    : sortedData;
    
  // Calculate total pages
  const totalPages = pagination ? Math.ceil(sortedData.length / rowsPerPage) : 1;
  
  // Handle row selection
  const handleSelectRow = (rowId, isChecked) => {
    if (isChecked) {
      setSelectedRows([...selectedRows, rowId]);
    } else {
      setSelectedRows(selectedRows.filter(id => id !== rowId));
    }
  };
  
  const handleSelectAllRows = (isChecked) => {
    if (isChecked) {
      setSelectedRows(paginatedData.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };
  
  // Toggle column visibility
  const toggleColumnVisibility = (index, visible) => {
    const newColumns = [...visibleColumns];
    newColumns[index].visible = visible;
    setVisibleColumns(newColumns);
  };
  
  // Render Cloudflare-style table
  return (
    <div className={`w-full ${className}`}>
      {/* Table controls */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 w-64"
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Filter button */}
          {columns.some(col => col.filterable) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {Object.keys(filters).length > 0 && (
                    <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">
                      {Object.keys(filters).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-4">
                  <h3 className="font-medium">Filters</h3>
                  {columns.filter(col => col.filterable).map((column, i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-sm font-medium">{column.header}</label>
                      {column.filterOptions ? (
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={filters[column.accessor] || ''}
                          onChange={(e) => handleFilterChange(column.accessor, e.target.value)}
                        >
                          <option value="">All</option>
                          {column.filterOptions.map((option, j) => (
                            <option key={j} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type="text"
                          placeholder={`Filter by ${column.header.toLowerCase()}`}
                          value={filters[column.accessor] || ''}
                          onChange={(e) => handleFilterChange(column.accessor, e.target.value)}
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
                  
                  {Object.keys(filters).length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setFilters({})}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Column visibility toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-2">
                <h3 className="font-medium">Visible columns</h3>
                {visibleColumns.map((column, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`col-${index}`}
                      checked={column.visible}
                      onCheckedChange={(checked) => toggleColumnVisibility(index, checked)}
                    />
                    <label htmlFor={`col-${index}`} className="text-sm cursor-pointer">
                      {column.header}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Pagination controls */}
        {pagination && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Showing {sortedData.length ? (currentPage - 1) * rowsPerPage + 1 : 0}-
              {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length}
            </span>
            
            <select
              className="border border-gray-300 rounded-md text-sm px-2 py-1"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {rowsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Table */}
      <CloudflareCard padded={false} className="border border-card-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-card-border">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 && 
                        paginatedData.every(row => selectedRows.includes(row.id))
                      }
                      onCheckedChange={handleSelectAllRows}
                    />
                  </th>
                )}
                
                {visibleColumns
                  .filter(column => column.visible)
                  .map((column, index) => (
                    <th 
                      key={index} 
                      className={`
                        px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                        ${column.sortable ? 'cursor-pointer' : ''}
                      `}
                      onClick={() => column.sortable && handleSort(column.accessor)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {column.sortable && sortField === column.accessor && (
                          sortDirection === 'asc' 
                            ? <ChevronUp className="h-4 w-4" /> 
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))
                }
                
                {/* Actions column if needed */}
                {columns.some(col => col.type === 'actions') && (
                  <th className="px-4 py-3 text-right w-20"></th>
                )}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-card-border">
              {loading ? (
                <tr>
                  <td 
                    colSpan={visibleColumns.filter(col => col.visible).length + (selectable ? 1 : 0)} 
                    className="px-4 py-4 text-center"
                  >
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={visibleColumns.filter(col => col.visible).length + (selectable ? 1 : 0)} 
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className={`
                      ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}
                      ${selectedRows.includes(row.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={(checked) => handleSelectRow(row.id, checked)}
                        />
                      </td>
                    )}
                    
                    {visibleColumns
                      .filter(column => column.visible)
                      .map((column, colIndex) => {
                        // Get cell value
                        const value = row[column.accessor];
                        
                        // Custom cell renderer
                        if (column.cell) {
                          return (
                            <td key={colIndex} className="px-4 py-3">
                              {column.cell(row)}
                            </td>
                          );
                        }
                        
                        // Default cell renderer based on type
                        switch (column.type) {
                          case 'boolean':
                            return (
                              <td key={colIndex} className="px-4 py-3">
                                {value ? (
                                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Check className="h-3 w-3 mr-1" /> Yes
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <X className="h-3 w-3 mr-1" /> No
                                  </div>
                                )}
                              </td>
                            );
                          case 'date':
                            return (
                              <td key={colIndex} className="px-4 py-3">
                                {value ? new Date(value).toLocaleString() : '—'}
                              </td>
                            );
                          case 'actions':
                            return (
                              <td key={colIndex} className="px-4 py-3 text-right">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48">
                                    <div className="py-1">
                                      {column.actions.map((action, actionIndex) => (
                                        <button 
                                          key={actionIndex} 
                                          className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            action.onClick(row);
                                          }}
                                        >
                                          {action.icon && (
                                            <span className="mr-2">{action.icon}</span>
                                          )}
                                          {action.label}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </td>
                            );
                          default:
                            return (
                              <td key={colIndex} className="px-4 py-3">
                                {value !== null && value !== undefined ? value : '—'}
                              </td>
                            );
                        }
                      })
                    }
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CloudflareCard>
    </div>
  );
};

export { CloudflareTable };