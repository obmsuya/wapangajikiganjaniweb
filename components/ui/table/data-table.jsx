// components/ui/table/data-table.jsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/button";

const DataTable = ({
  data = [],
  columns = [],
  pagination = true,
  pageSize = 10,
  searchable = true,
  filterable = true,
  loading = false,
  emptyState = "No data available",
  onRowClick,
}) => {
  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // State for searching
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for filters
  const [filters, setFilters] = useState({});
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle filter change
  const handleFilterChange = (columnKey, value) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  };
  
  // Apply sorting, filtering, and searching to data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      result = result.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          const cellValue = item[key]?.toString().toLowerCase();
          return cellValue?.includes(value.toLowerCase());
        });
      });
    }
    
    // Apply search
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(item => {
        return columns.some(column => {
          if (!column.searchable) return false;
          const value = item[column.accessor]?.toString().toLowerCase();
          return value?.includes(lowercasedQuery);
        });
      });
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle null/undefined values
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      });
    }
    
    return result;
  }, [data, sortConfig, searchQuery, filters, columns]);
  
  // Pagination logic
  const pageCount = Math.ceil(processedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);
  
  // Reset current page if it exceeds the new page count
  useEffect(() => {
    if (currentPage > pageCount && pageCount > 0) {
      setCurrentPage(1);
    }
  }, [pageCount, currentPage]);
  
  // Determine if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => !!value) || !!searchQuery;
  }, [filters, searchQuery]);

  // Render the sort indicator
  const renderSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="inline-block ml-1 w-4 h-4 opacity-0 group-hover:opacity-50" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="inline-block ml-1 w-4 h-4" />
      : <ChevronDown className="inline-block ml-1 w-4 h-4" />;
  };
  
  // Filter component for each column
  const renderColumnFilter = (column) => {
    if (!column.filterable) return null;
    
    return (
      <div className="mt-2">
        <input
          type="text"
          placeholder={`Filter ${column.header}`}
          value={filters[column.accessor] || ''}
          onChange={(e) => handleFilterChange(column.accessor, e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and filter controls */}
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
          {searchable && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-input border border-input-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {filterable && (
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
                <span className="text-sm">Filters</span>
              </div>
            )}
            
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
            
            <div className="text-sm text-muted-foreground ml-2">
              {processedData.length} results
            </div>
          </div>
        </div>
      )}
      
      {/* Main table */}
      <div className="w-full overflow-auto rounded-lg border border-card-border">
        <table className="w-full divide-y divide-card-border">
          <thead className="bg-secondary">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={`
                    px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer group' : ''}
                    ${column.width ? `w-${column.width}` : ''}
                  `}
                  onClick={() => column.sortable && requestSort(column.accessor)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && renderSortIndicator(column.accessor)}
                  </div>
                  {filterable && renderColumnFilter(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-card-border">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-20 text-center text-muted-foreground"
                >
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <div className="mt-2">Loading data...</div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-20 text-center text-muted-foreground"
                >
                  {emptyState}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    hover:bg-secondary/50 transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.accessor}`}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                    >
                      {column.cell 
                        ? column.cell(row) 
                        : row[column.accessor] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {pagination && pageCount > 1 && (
        <div className="flex justify-between items-center px-2">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                // Show first page, last page, current page, and pages around current
                let pageNum;
                if (pageCount <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                  if (i === 4) pageNum = pageCount;
                } else if (currentPage >= pageCount - 2) {
                  pageNum = pageCount - 4 + i;
                  if (i === 0) pageNum = 1;
                } else {
                  pageNum = currentPage - 2 + i;
                  if (i === 0) pageNum = 1;
                  if (i === 4) pageNum = pageCount;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${pageNum === 1 && i !== 0 && pageCount > 5 ? 'mr-1' : ''} ${pageNum === pageCount && i !== 4 && pageCount > 5 ? 'ml-1' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === pageCount}
              onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;