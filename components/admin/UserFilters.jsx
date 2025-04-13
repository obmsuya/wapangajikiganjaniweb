// components/admin/UserFilters.jsx
"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export function UserFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    search: "",
    userType: "",
    status: "",
  });

  const [expanded, setExpanded] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: "",
      userType: "",
      status: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = filters.search || filters.userType || filters.status;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              name="search"
              placeholder="Search users..."
              className="pl-10"
              value={filters.search}
              onChange={handleInputChange}
            />
            {filters.search && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => {
                  setFilters(prev => ({ ...prev, search: "" }));
                }}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Toggle filter expansion */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="md:w-auto w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 flex h-2 w-2 rounded-full bg-primary"></span>
            )}
          </Button>

          {/* Apply/Reset buttons */}
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={applyFilters}
              className="md:w-auto w-full"
            >
              Apply
            </Button>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="md:w-auto w-full"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Expanded filters */}
        {expanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">User Type</label>
              <Select
                value={filters.userType}
                onValueChange={(value) => handleSelectChange("userType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All user types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All user types</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}