import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { favoritesApi } from '@/api/favorites';
import { Spinner } from '@/components/Spinner';
import { formatArea, formatPrice, coverImage } from '@/utils/format';
import { Button } from '@/components/Button';

export function Favorites() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['favorites'], queryFn: favoritesApi.list });

  const removeMutation = useMutation({
    mutationFn: (propertyId: number) => favoritesApi.remove(propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-900">Your favorites</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data?.items.length ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-navy-200 py-16 text-navy-400">
          <Heart size={28} />
          <p>No saved properties yet.</p>
          <Link to="/search" className="text-sm font-semibold text-navy-600 hover:underline">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.items.map(({ property_id, properties }) => (
            <div key={property_id} className="flex items-center gap-4 rounded-xl border border-navy-100 p-4">
              <img
                src={coverImage(properties.property_images)}
                className="h-20 w-28 rounded-lg object-cover"
                alt={properties.title}
              />
              <div className="min-w-0 flex-1">
                <Link to={`/properties/${property_id}`} className="truncate font-semibold text-navy-900 hover:underline">
                  {properties.title}
                </Link>
                <p className="text-sm text-navy-400">{properties.city}</p>
                <p className="mt-1 text-sm font-bold text-gradient">{formatPrice(properties.price)}</p>
                <p className="text-xs text-navy-400">{formatArea(properties.area_value, properties.area_unit)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeMutation.mutate(property_id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
