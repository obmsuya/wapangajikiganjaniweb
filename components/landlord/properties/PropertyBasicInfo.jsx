// components/landlord/properties/PropertyBasicInfo.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function PropertyBasicInfo({ 
  onValidationChange, 
  propertyData, 
  updatePropertyData 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Initialize image preview from existing data
  useEffect(() => {
    if (propertyData.prop_image?.uri) {
      setImagePreview(propertyData.prop_image.uri);
    }
  }, [propertyData.prop_image]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!propertyData.name?.trim()) {
      newErrors.name = 'Property name is required';
    } else if (propertyData.name.length < 2) {
      newErrors.name = 'Property name must be at least 2 characters';
    }

    if (!propertyData.location?.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!propertyData.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange?.(isValid);
    return isValid;
  }, [propertyData, onValidationChange]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleInputChange = (field, value) => {
    updatePropertyData({ [field]: value });
  };

  const handleImageUpload = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const imageData = {
        uri: URL.createObjectURL(file),
        base64: base64
      };
      
      updatePropertyData({ prop_image: imageData });
      setImagePreview(imageData.uri);
      setErrors(prev => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    updatePropertyData({ prop_image: null });
    setImagePreview(null);
    if (propertyData.prop_image?.uri) {
      URL.revokeObjectURL(propertyData.prop_image.uri);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Property Information</h2>
        <p className="text-muted-foreground">
          Let's start with the basic details about your property
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form Fields */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="propertyName" className="text-base font-medium">
              Property Name *
            </Label>
            <Input
              id="propertyName"
              placeholder="e.g., Sunrise Apartments, Blue Villa..."
              value={propertyData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`mt-1 h-12 ${errors.name ? 'border-red-500' : ''}`}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {propertyData.name?.length || 0}/50 characters
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="location" className="text-base font-medium">
              Location *
            </Label>
            <Input
              id="location"
              placeholder="e.g., Kinondoni, Dar es Salaam"
              value={propertyData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`mt-1 h-12 ${errors.location ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label htmlFor="address" className="text-base font-medium">
              Full Address *
            </Label>
            <Input
              id="address"
              placeholder="e.g., Plot 123, Mwalimu Nyerere Road"
              value={propertyData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`mt-1 h-12 ${errors.address ? 'border-red-500' : ''}`}
              maxLength={200}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </motion.div>
        </div>

        {/* Right Column - Image Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Label className="text-base font-medium mb-3 block">
            Property Image
          </Label>
          
          {imagePreview ? (
            <Card className="relative overflow-hidden">
              <img
                src={imagePreview}
                alt="Property preview"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <p className="text-white text-sm">Click the × to remove image</p>
              </div>
            </Card>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('imageInput').click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Upload Property Image
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop an image here, or click to browse
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Upload className="w-4 h-4" />
                <span>Supports: JPG, PNG (Max 5MB)</span>
              </div>
              
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}
          
          {errors.image && (
            <p className="text-red-500 text-sm mt-2">{errors.image}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Optional: Add a photo to help identify your property
          </p>
        </motion.div>
      </div>
    </div>
  );
}