import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, CheckCircle2, Heart, MapPin, Ruler, Scale, Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PropertySummary } from '@/types';
import { coverImage, formatArea, formatPrice, propertyTypeLabel } from '@/utils/format';
import { Badge } from '@/components/Badge';
import { useCompareStore } from '@/store/compareStore';
import { useAuth } from '@/hooks/useAuth';
import { favoritesApi } from '@/api/favorites';
import clsx from 'clsx';

export function PropertyCard({ property }: { property: PropertySummary }) {
  const isSelected = useCompareStore((s) => s.isSelected(property.id));
  const toggle = useCompareStore((s) => s.toggle);
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.list,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const isFavorited = favorites?.items.some((f) => f.property_id === property.id) ?? false;

  const favoriteMutation = useMutation({
    mutationFn: () => (isFavorited ? favoritesApi.remove(property.id) : favoritesApi.add(property.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      navigate('/login');
      return;
    }
    favoriteMutation.mutate();
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-navy-100 bg-white card-shadow transition-transform hover:-translate-y-1">
      <Link to={`/properties/${property.id}`} className="block">
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={coverImage(property.property_images)}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <Badge tone="navy">{propertyTypeLabel(property.property_type)}</Badge>
            {property.is_verified && (
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
          </div>
          <button
            onClick={handleFavoriteClick}
            disabled={favoriteMutation.isPending}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy-600 shadow-md transition-colors hover:bg-white disabled:opacity-60"
          >
            <Heart size={16} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
          </button>
          {property.is_featured && (
            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-brand-gradient px-2 py-0.5 text-xs font-semibold text-white">
              <Star size={12} /> Featured
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/properties/${property.id}`}>
          <h3 className="truncate text-base font-semibold text-navy-900">{property.title}</h3>
        </Link>
        <p className="mt-1 flex items-center gap-1 text-sm text-navy-400">
          <MapPin size={14} /> {property.city}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gradient">{formatPrice(property.price)}</span>
          <span className="text-xs font-medium uppercase text-navy-400">{property.listing_type}</span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-navy-500">
          <span className="flex items-center gap-1">
            <Ruler size={14} /> {formatArea(property.area_value, property.area_unit)}
          </span>
          {property.bhk ? (
            <span className="flex items-center gap-1">
              <BedDouble size={14} /> {property.bhk} BHK
            </span>
          ) : null}
        </div>

        <button
          onClick={() => toggle(property.id)}
          className={clsx(
            'mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-colors',
            isSelected
              ? 'border-navy-600 bg-navy-600 text-white'
              : 'border-navy-100 text-navy-500 hover:border-navy-300'
          )}
        >
          <Scale size={13} /> {isSelected ? 'Added to compare' : 'Add to compare'}
        </button>
      </div>
    </div>
  );
}
