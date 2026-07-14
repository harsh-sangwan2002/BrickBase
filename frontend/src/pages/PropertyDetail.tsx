import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BedDouble, Bath, CheckCircle2, Heart, MapPin, Ruler, Scale } from 'lucide-react';
import { propertiesApi } from '@/api/properties';
import { favoritesApi } from '@/api/favorites';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/Badge';
import { formatArea, formatPrice, propertyTypeLabel } from '@/utils/format';
import { EnquiryForm } from '@/features/enquiries/EnquiryForm';
import { EmiCalculator } from '@/features/properties/EmiCalculator';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { NearbyAmenities } from '@/features/properties/NearbyAmenities';
import { useAuth } from '@/hooks/useAuth';
import { useCompareStore } from '@/store/compareStore';
import { Button } from '@/components/Button';

export function PropertyDetail() {
  const { id } = useParams();
  const propertyId = Number(id);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);
  const toggle = useCompareStore((s) => s.toggle);
  const isSelected = useCompareStore((s) => s.isSelected(propertyId));

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesApi.detail(propertyId),
    enabled: !Number.isNaN(propertyId),
  });

  const { data: similar } = useQuery({
    queryKey: ['similar', propertyId],
    queryFn: () => propertiesApi.similar(propertyId),
    enabled: !Number.isNaN(propertyId),
  });

  const favoriteMutation = useMutation({
    mutationFn: () => favoritesApi.add(propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (isLoading || !property) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const images = property.property_images.length
    ? property.property_images
    : [{ image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60', is_cover: true }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-navy-100">
            <img src={images[activeImage].image_url} alt={property.title} className="h-96 w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-thin">
              {images.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImage(idx)}>
                  <img
                    src={img.image_url}
                    className={`h-16 w-24 rounded-lg object-cover ${idx === activeImage ? 'ring-2 ring-navy-600' : 'opacity-70'}`}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge>{propertyTypeLabel(property.property_type)}</Badge>
                {property.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-navy-900">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-navy-400">
                <MapPin size={14} /> {property.address}, {property.city}, {property.state} {property.pincode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gradient">{formatPrice(property.price)}</p>
              {property.price_negotiable && <p className="text-xs text-navy-400">Negotiable</p>}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 rounded-xl border border-navy-100 p-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Ruler size={15} className="text-navy-400" /> {formatArea(property.area_value, property.area_unit)}
            </span>
            {property.bhk ? (
              <span className="flex items-center gap-1.5">
                <BedDouble size={15} className="text-navy-400" /> {property.bhk} BHK
              </span>
            ) : null}
            {property.bathrooms ? (
              <span className="flex items-center gap-1.5">
                <Bath size={15} className="text-navy-400" /> {property.bathrooms} Bath
              </span>
            ) : null}
            {property.furnishing_status && <Badge>{property.furnishing_status.replace('_', ' ')}</Badge>}
            {property.possession_status && <Badge>{property.possession_status.replace(/_/g, ' ')}</Badge>}
          </div>

          <div className="mt-6">
            <h2 className="font-semibold text-navy-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-600">{property.description}</p>
          </div>

          {Object.keys(property.attributes ?? {}).length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-navy-900">Details</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {Object.entries(property.attributes).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-navy-50 px-3 py-2">
                    <p className="text-xs uppercase text-navy-400">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-navy-800">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => toggle(propertyId)}
              className={isSelected ? 'border-navy-600 text-navy-700' : ''}
            >
              <Scale size={15} /> {isSelected ? 'In comparison' : 'Compare'}
            </Button>
            {session && (
              <Button variant="secondary" onClick={() => favoriteMutation.mutate()}>
                <Heart size={15} /> Save to favorites
              </Button>
            )}
          </div>

          <NearbyAmenities propertyId={propertyId} title={property.title} />

          {similar && similar.items.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-navy-900">Similar properties</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {similar.items.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <EnquiryForm propertyId={propertyId} />
          <EmiCalculator defaultPrice={property.price} />
        </div>
      </div>
    </div>
  );
}
