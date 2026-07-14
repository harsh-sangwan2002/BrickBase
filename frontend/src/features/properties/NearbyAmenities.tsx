import { useQuery } from '@tanstack/react-query';
import { Bus, MapPin, Pill, School, ShoppingCart, Stethoscope, UtensilsCrossed } from 'lucide-react';
import { propertiesApi } from '@/api/properties';
import { Spinner } from '@/components/Spinner';
import { PropertyMap } from './PropertyMap';
import { ApiRequestError } from '@/api/client';

const CATEGORY_ICON: Record<string, typeof Bus> = {
  bus_station: Bus,
  supermarket: ShoppingCart,
  hospital: Stethoscope,
  school: School,
  restaurant: UtensilsCrossed,
  pharmacy: Pill,
};

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

export function NearbyAmenities({ propertyId, title }: { propertyId: number; title: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['nearby', propertyId],
    queryFn: () => propertiesApi.nearby(propertyId),
    retry: false,
  });

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-navy-900">Location & nearby</h2>
      <p className="mt-1 text-xs text-navy-400">Map data &copy; OpenStreetMap contributors</p>

      {isLoading ? (
        <div className="mt-4 flex justify-center py-10">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-navy-400">
          {error instanceof ApiRequestError ? error.message : "Couldn't load nearby amenities right now."}
        </p>
      ) : data ? (
        <>
          <div className="mt-4">
            <PropertyMap latitude={data.latitude} longitude={data.longitude} title={title} />
          </div>

          {data.categories.length === 0 ? (
            <p className="mt-4 text-sm text-navy-400">No nearby amenities found within 1.5 km.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.categories.map((category) => {
                const Icon = CATEGORY_ICON[category.type] ?? MapPin;
                return (
                  <div key={category.type} className="rounded-xl border border-navy-100 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                      <Icon size={15} className="text-navy-500" /> {category.label}
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {category.places.map((place) => (
                        <li key={`${place.name}-${place.distanceMeters}`} className="text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium text-navy-800">{place.name}</span>
                            <span className="shrink-0 text-xs text-navy-400">{formatDistance(place.distanceMeters)}</span>
                          </div>
                          {place.vicinity && <p className="truncate text-xs text-navy-400">{place.vicinity}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
