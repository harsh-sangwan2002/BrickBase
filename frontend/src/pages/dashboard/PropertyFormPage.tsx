import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/api/properties';
import { metaApi } from '@/api/meta';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { Upload, Sparkles, X } from 'lucide-react';
import { ApiRequestError } from '@/api/client';

interface FormValues {
  property_type: 'land' | 'residential' | 'commercial';
  listing_type: 'sale' | 'rent';
  title: string;
  description: string;
  price: number;
  price_negotiable: boolean;
  area_value: number;
  area_unit: 'sqft' | 'sqyd' | 'acre' | 'sqm';
  address: string;
  city: string;
  state: string;
  pincode: string;
  bhk?: number;
  bathrooms?: number;
  furnishing_status?: 'unfurnished' | 'semi_furnished' | 'furnished';
  possession_status?: 'ready_to_move' | 'under_construction';
}

export function PropertyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<{ url: string; id?: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);

  const { data: amenities } = useQuery({ queryKey: ['amenities'], queryFn: metaApi.amenities });

  const { data: existing } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.detail(id!),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { price_negotiable: false, area_unit: 'sqft', property_type: 'residential', listing_type: 'sale' },
  });
  const propertyType = watch('property_type');

  function handleFillDummyData() {
    setValue('title', '3 BHK Apartment in Sector 57', { shouldDirty: true });
    setValue('description', 'Spacious and well-ventilated apartment with modern amenities, close to schools, hospitals and the metro station. Ideal for families.', { shouldDirty: true });
    setValue('price', 9800000, { shouldDirty: true });
    setValue('price_negotiable', true, { shouldDirty: true });
    setValue('area_value', 1650, { shouldDirty: true });
    setValue('area_unit', 'sqft', { shouldDirty: true });
    setValue('address', 'Plot 42, DLF Phase 4', { shouldDirty: true });
    setValue('city', 'Gurugram', { shouldDirty: true });
    setValue('state', 'Haryana', { shouldDirty: true });
    setValue('pincode', '122009', { shouldDirty: true });
    setValue('bhk', 3, { shouldDirty: true });
    setValue('bathrooms', 2, { shouldDirty: true });
    setValue('furnishing_status', 'semi_furnished', { shouldDirty: true });
    setValue('possession_status', 'ready_to_move', { shouldDirty: true });
    if (amenities?.items.length) {
      setSelectedAmenities(amenities.items.slice(0, 3).map((a) => a.id));
    }
  }

  useEffect(() => {
    if (existing) {
      const { id: _id, owner_id: _ownerId, property_images: _images, ...formFields } = existing;
      void _id;
      void _ownerId;
      void _images;
      reset(formFields as unknown as FormValues);
      setImages(existing.property_images.map((img) => ({ url: img.image_url, id: img.id })));
      const existingAmenityIds = (existing as unknown as { property_amenities?: { amenity_id: number }[] }).property_amenities;
      if (existingAmenityIds?.length) {
        setSelectedAmenities(existingAmenityIds.map((pa) => pa.amenity_id));
      }
    }
  }, [existing, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, amenity_ids: selectedAmenities };
      if (isEdit) return propertiesApi.update(Number(id), payload);
      return propertiesApi.create(payload);
    },
    onSuccess: async (property) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['property', String(property.id)] });
      if (!isEdit) {
        for (const img of images) {
          await propertiesApi.addImage(property.id, img.url, images.indexOf(img) === 0);
        }
      }
      navigate('/dashboard/listings');
    },
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `properties/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('property-images').upload(path, file);
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('property-images').getPublicUrl(path);
        setImages((prev) => [...prev, { url: publicUrl.publicUrl }]);
      }
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((img) => img.url !== url));
  }

  function toggleAmenity(id: number) {
    setSelectedAmenities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  return (
    <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy-900">{isEdit ? 'Edit listing' : 'New listing'}</h1>
        {!isEdit && (
          <Button type="button" variant="secondary" size="sm" onClick={handleFillDummyData}>
            <Sparkles size={14} /> Fill dummy data
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-navy-700">Property type</label>
          <select {...register('property_type')} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm">
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="land">Plot/Land</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-navy-700">Listing type</label>
          <select {...register('listing_type')} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm">
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-navy-700">Title</label>
        <input {...register('title', { required: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
      </div>

      <div>
        <label className="text-sm font-medium text-navy-700">Description</label>
        <textarea
          {...register('description', { required: true })}
          rows={4}
          className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-navy-700">Price (₹)</label>
          <input type="number" {...register('price', { required: true, valueAsNumber: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-700">Area value</label>
          <input type="number" {...register('area_value', { required: true, valueAsNumber: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-700">Area unit</label>
          <select {...register('area_unit')} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm">
            <option value="sqft">sq.ft</option>
            <option value="sqyd">sq.yd</option>
            <option value="acre">acre</option>
            <option value="sqm">sq.m</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy-700">
        <input type="checkbox" {...register('price_negotiable')} /> Price negotiable
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-navy-700">Address</label>
          <input {...register('address', { required: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-700">City</label>
          <input {...register('city', { required: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-700">State</label>
          <input {...register('state', { required: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-700">Pincode</label>
          <input {...register('pincode', { required: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
        </div>
      </div>

      {propertyType === 'residential' && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-navy-700">BHK</label>
            <input type="number" {...register('bhk', { valueAsNumber: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-700">Bathrooms</label>
            <input type="number" {...register('bathrooms', { valueAsNumber: true })} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-700">Furnishing</label>
            <select {...register('furnishing_status')} className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm">
              <option value="">Select</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi_furnished">Semi-furnished</option>
              <option value="furnished">Furnished</option>
            </select>
          </div>
        </div>
      )}

      {amenities?.items.length ? (
        <div>
          <label className="text-sm font-medium text-navy-700">Amenities</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {amenities.items.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => toggleAmenity(a.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  selectedAmenities.includes(a.id) ? 'border-navy-600 bg-navy-600 text-white' : 'border-navy-100 text-navy-500'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-navy-700">Images</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.url} className="relative h-20 w-28">
              <img src={img.url} className="h-full w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.url)}
                className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-navy-600 shadow"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-navy-200 text-navy-400 hover:border-navy-400">
            <Upload size={16} />
            <span className="mt-1 text-xs">{uploading ? 'Uploading...' : 'Upload'}</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-600">
          {saveMutation.error instanceof ApiRequestError ? saveMutation.error.message : 'Failed to save listing.'}
        </p>
      )}

      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Create listing'}
      </Button>
    </form>
  );
}
