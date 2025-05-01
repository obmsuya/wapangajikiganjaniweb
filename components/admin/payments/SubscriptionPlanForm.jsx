'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { Minus, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

/**
 * Form component for creating and editing subscription plans
 */
export default function SubscriptionPlanForm({ 
  initialData = null, 
  onSubmit, 
  onCancel 
}) {
  const [features, setFeatures] = useState([{ key: '', value: '' }]);
  
  // Initialize form with react-hook-form
  const form = useForm({
    defaultValues: {
      name: initialData?.name || '',
      plan_type: initialData?.plan_type || 'basic',
      duration: initialData?.duration || 'monthly',
      price: initialData?.price || '',
      property_limit: initialData?.property_limit || 1,
      description: initialData?.description || '',
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    },
  });

  // Initialize features from initialData
  useEffect(() => {
    if (initialData?.features) {
      const featuresList = Object.entries(initialData.features).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? '' : value
      }));
      
      // Ensure we always have at least one empty feature row
      if (featuresList.length === 0) {
        featuresList.push({ key: '', value: '' });
      }
      
      setFeatures(featuresList);
    }
  }, [initialData]);

  // Handle adding a new feature
  const addFeature = () => {
    setFeatures([...features, { key: '', value: '' }]);
  };

  // Handle removing a feature
  const removeFeature = (index) => {
    const newFeatures = [...features];
    newFeatures.splice(index, 1);
    setFeatures(newFeatures.length ? newFeatures : [{ key: '', value: '' }]);
  };

  // Handle feature key/value changes
  const handleFeatureChange = (index, field, value) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  // Handle form submission
  const handleFormSubmit = (values) => {
    // Convert features array to object
    const featuresObject = features.reduce((obj, { key, value }) => {
      if (key) {
        obj[key] = value || true; // If no value, treat as boolean feature
      }
      return obj;
    }, {});

    // Submit the form with features
    onSubmit({
      ...values,
      features: featuresObject,
      price: parseFloat(values.price)
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan Name */}
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Plan name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Basic Plan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Plan Type */}
          <FormField
            control={form.control}
            name="plan_type"
            rules={{ required: 'Plan type is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Duration */}
          <FormField
            control={form.control}
            name="duration"
            rules={{ required: 'Duration is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            rules={{ 
              required: 'Price is required',
              pattern: {
                value: /^[0-9]*\.?[0-9]+$/,
                message: 'Please enter a valid price'
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (TZS)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="0"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Property Limit */}
        <FormField
          control={form.control}
          name="property_limit"
          rules={{ 
            required: 'Property limit is required',
            min: {
              value: 1,
              message: 'Minimum property limit is 1'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Limit</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1"
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || '')}
                />
              </FormControl>
              <FormDescription>
                Maximum number of properties allowed for this plan
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter plan description..." 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Features */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Features</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addFeature}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
          </div>
          
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Input
                className="flex-1"
                placeholder="Feature name"
                value={feature.key}
                onChange={(e) => handleFeatureChange(index, 'key', e.target.value)}
              />
              <Input
                className="flex-1"
                placeholder="Value (optional)"
                value={feature.value}
                onChange={(e) => handleFeatureChange(index, 'value', e.target.value)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => removeFeature(index)}
                disabled={features.length === 1 && !features[0].key && !features[0].value}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <FormDescription>
            Add features that come with this plan. Leave value empty for boolean features.
          </FormDescription>
        </div>

        {/* Active Status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Make this plan available for subscription
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">
            {initialData ? 'Update Plan' : 'Create Plan'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}