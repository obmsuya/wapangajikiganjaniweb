"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Home,
  Eye,
  ImageIcon,
  Crown,
  Lock,
  Users,
  TrendingUp,
  DoorOpen,
  Banknote,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import PropertyService from "@/services/landlord/property";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PropertyCard({ property, subscriptionContext, isVisible = true, onDelete }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate accurate occupancy from property floor data
  const occupancyData = useMemo(() => {
    if (!property)
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        occupancyRate: 0,
        vacantUnits: 0,
        totalRent: 0,
        actualRent: 0,
      };

    let totalUnits = 0;
    let occupiedUnits = 0;
    let totalRent = 0;
    let actualRent = 0;

    if (property.property_floor && Array.isArray(property.property_floor)) {
      property.property_floor.forEach((floor) => {
        if (floor.units_floor && Array.isArray(floor.units_floor)) {
          floor.units_floor.forEach((unit) => {
            totalUnits++;
            const rentAmount = parseFloat(String(unit.rent_amount)) || 0;
            totalRent += rentAmount;

            if (unit.current_tenant || unit.status === "occupied") {
              occupiedUnits++;
              actualRent += rentAmount;
            }
          });
        }
      });
    } else {
      totalUnits = property.total_units || 0;

      if (property.stats) {
        occupiedUnits =
          property.stats.occupiedUnits || property.occupied_units || 0;
        totalRent =
          property.stats.totalRent || property.total_monthly_rent || 0;
        actualRent = property.stats.actualRent || 0;
      } else {
        occupiedUnits = property.occupied_units || 0;
        totalRent = property.total_monthly_rent || 0;
        actualRent = totalRent;
      }
    }

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits: totalUnits - occupiedUnits,
      occupancyRate,
      totalRent,
      actualRent,
    };
  }, [property]);

  if (!property) return null;

  const propertyImage = property.images?.[0]?.image_url || property.prop_image;
  const propertyName = property.name || property.property_name;
  const propertyLocation = property.location || property.address;
  const propertyCategory =
    property.category || property.property_type || "Property";

  const handleCardClick = () => {
    if (
      !isVisible ||
      (subscriptionContext?.isFreePlan && !property.is_primary)
    ) {
      return;
    }
    router.push(`/landlord/properties/${property.id}`);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (!isVisible) {
      return;
    }
    router.push(`/landlord/properties/${property.id}`);
  };

  const handleUpgradeClick = (e) => {
    e.stopPropagation();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };


  const getCategoryStyle = (category) => {
    const styles = {
      "multi-floor": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      "single floor":
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      apartment: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
      house: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      commercial: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
    };
    return styles[category?.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 90) return "bg-emerald-500";
    if (rate >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `TZS ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `TZS ${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // prevent card navigation
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await PropertyService.deleteProperty(property.id);
      toast.success("Property deleted", {
        description: `"${propertyName}" and all associated data have been removed.`,
      });
      // Tell the parent list to remove this card
      if (onDelete) onDelete(property.id);
    } catch (error) {
      toast.error("Delete failed", {
        description: error?.response?.data?.error || "Something went wrong. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Locked state card
  if (!isVisible) {
    return (
      <Card
        className="group relative overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-border"
        onClick={handleCardClick}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative h-48 sm:h-auto sm:w-40 md:w-48 flex-shrink-0 bg-muted">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/90 to-orange-600/90 flex items-center justify-center">
              <div className="text-center text-white p-4">
                <Crown className="h-8 w-8 mx-auto mb-2 drop-shadow-md" />
                <p className="font-semibold text-sm">Upgrade Required</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground/60 truncate text-base">
                  {propertyName}
                </h3>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-sm">{propertyLocation}</span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="flex-shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20 mb-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Lock className="h-4 w-4 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">
                    Upgrade to access this property
                  </span>
                  {occupancyData.totalUnits > 0 && (
                    <span className="block text-xs opacity-75 mt-0.5">
                      {occupancyData.totalUnits} units available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
              onClick={handleUpgradeClick}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade to Access
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="group relative overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-border hover:shadow-lg cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex flex-col">
          {/* Image Section */}
          <div className="relative h-36 md:h-48 flex-shrink-0 overflow-hidden rounded-3xl">
            {propertyImage && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-foreground animate-spin" />
                  </div>
                )}
                <img
                  src={propertyImage}
                  alt={propertyName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Building2 className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}

            {/* Category Badge - Positioned on image */}
            <div className="absolute top-2 left-2">
              <Badge
                variant="secondary"
                className={`${getCategoryStyle(propertyCategory)} border font-medium text-xs`}
              >
                {propertyCategory}
              </Badge>
            </div>

            {/* Occupancy indicator on image - mobile only */}
            <div className="absolute bottom-3 left-3 right-3 sm:hidden">
              <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                <div
                  className={`h-2 w-2 rounded-full ${getOccupancyColor(occupancyData.occupancyRate)}`}
                />
                <span className="text-sm font-medium text-foreground">
                  {occupancyData.occupancyRate}% Occupied
                </span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 py-4 sm:p-5 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate text-base md:text-lg group-hover:text-primary transition-colors">
                  {propertyName}
                </h3>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-sm">{propertyLocation}</span>
                </div>
              </div>

              {/* Desktop occupancy badge */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${getOccupancyColor(occupancyData.occupancyRate)}`}
                />
                <span className="text-sm font-medium text-foreground">
                  {occupancyData.occupancyRate}%
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col items-center sm:items-start p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Home className="h-3.5 w-3.5 max-xl:hidden" />
                  <span className="text-xs font-mediu m hidden sm:inline">
                    Units
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-foreground">
                  {occupancyData.totalUnits}
                </span>
                <span className="text-xs text-muted-foreground sm:hidden">
                  Units
                </span>
              </div>

              <div className="flex flex-col items-center sm:items-start p-2.5 sm:p-3 bg-emerald-500/10 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Users className="h-3.5 w-3.5 max-xl:hidden" />
                  <span className="text-xs font-medium  hidden sm:inline">
                    Occupied
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {occupancyData.occupiedUnits}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 sm:hidden">
                  Occupied
                </span>
              </div>
            </div>

            {/* Occupancy Progress Bar - Desktop */}
            {occupancyData.totalUnits > 0 && (
              <div className="hidden sm:block mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Occupancy Rate</span>
                  <span className="font-medium text-foreground">
                    {occupancyData.occupiedUnits} of {occupancyData.totalUnits}{" "}
                    units
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(occupancyData.occupancyRate)}`}
                    style={{ width: `${occupancyData.occupancyRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* Revenue Section */}
            {occupancyData.actualRent > 0 && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20 mb-4 max-md:hidden">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Banknote className="h-4 w-4" />
                  <span className="text-sm font-medium">Monthly Revenue</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(occupancyData.actualRent)}
                  </span>
                  {occupancyData.actualRent < occupancyData.totalRent && (
                    <span className="block text-xs text-emerald-600/70 dark:text-emerald-400/70">
                      Potential: {formatCurrency(occupancyData.totalRent)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-auto flex gap-2">
              <Button
                variant="outline"
                className="flex-1 group/btn"
                onClick={handleViewDetails}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
                <ChevronRight className="h-4 w-4 ml-auto opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
              </Button>

              <Button
                variant="outline"
                className="flex-1 group/btn border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm w-[calc(100%-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">"{propertyName}"</span> and all its floors, units, and linked tenants will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isDeleting} className="flex-1 mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
