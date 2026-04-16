'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

const PERMISSION_KEYS = [
  { key: 'auto_rent_reminders',    label: 'Auto rent reminders',     description: 'Automated SMS reminders sent before rent due date' },
  { key: 'sms_notifications',      label: 'SMS notifications',       description: 'SMS alerts sent to the landlord' },
  { key: 'online_rent_collection', label: 'Online rent collection',  description: 'MNO and bank rent collection via the platform' },
  { key: 'wallet_withdrawals',     label: 'Wallet withdrawals',      description: 'Withdraw collected rent from landlord wallet' },
];

const DEFAULT_PERMISSIONS = PERMISSION_KEYS.reduce((acc, { key }) => {
  acc[key] = false;
  return acc;
}, {});

function formatPrice(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-TZ');
}

function parsePrice(formatted) {
  return parseFloat(formatted.replace(/,/g, '')) || 0;
}

export default function SubscriptionPlanForm({ initialData = null, onSubmit, onCancel }) {
  const [permissions, setPermissions] = useState({ ...DEFAULT_PERMISSIONS });
  const [priceDisplay, setPriceDisplay] = useState('');

  const form = useForm({
    defaultValues: {
      name:           initialData?.name || '',
      plan_type:      initialData?.plan_type || 'basic',
      duration:       initialData?.duration || 'monthly',
      property_limit: initialData?.property_limit || 1,
      description:    initialData?.description || '',
      is_active:      initialData?.is_active !== undefined ? initialData.is_active : true,
    },
  });

  useEffect(() => {
    if (initialData?.price) {
      setPriceDisplay(formatPrice(String(Math.round(initialData.price))));
    }

    if (initialData?.features) {
      const merged = { ...DEFAULT_PERMISSIONS };
      PERMISSION_KEYS.forEach(({ key }) => {
        if (key in initialData.features) {
          merged[key] = Boolean(initialData.features[key]);
        }
      });
      setPermissions(merged);
    }
  }, [initialData]);

  const handlePriceInput = (e) => {
    setPriceDisplay(formatPrice(e.target.value));
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFormSubmit = (values) => {
    const price = parsePrice(priceDisplay);
    if (!price) {
      toast.error('Please enter a valid price');
      return;
    }

    onSubmit({
      ...values,
      price,
      features: { ...permissions },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Plan name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Premium Plan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plan_type"
            rules={{ required: 'Plan type is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            rules={{ required: 'Duration is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing cycle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="price">Price (TZS)</Label>
            <Input
              id="price"
              inputMode="numeric"
              placeholder="0"
              value={priceDisplay}
              onChange={handlePriceInput}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="property_limit"
          rules={{
            required: 'Property limit is required',
            min: { value: 1, message: 'Minimum is 1' },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property limit</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || '')}
                />
              </FormControl>
              <FormDescription>Maximum properties allowed on this plan</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this plan includes..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Plan permissions</Label>
            <p className="text-sm text-muted-foreground mt-0.5">
              Toggle the features available on this plan
            </p>
          </div>

          <Separator />

          <div className="space-y-1">
            {PERMISSION_KEYS.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={permissions[key]}
                  onCheckedChange={() => togglePermission(key)}
                />
              </div>
            ))}
          </div>

          <Separator />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>Make this plan available for subscription</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
            {initialData ? 'Update plan' : 'Create plan'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}