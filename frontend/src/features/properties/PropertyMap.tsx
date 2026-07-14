import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

// A simple inline pin — avoids Leaflet's default marker image path issue under Vite's bundler.
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1e3a78;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(10,19,48,0.4)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker([latitude, longitude], { icon: pinIcon }).addTo(map).bindPopup(title);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, title]);

  return <div ref={containerRef} className="h-64 w-full rounded-xl border border-navy-100" />;
}
