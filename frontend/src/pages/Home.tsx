import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Search, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { propertiesApi } from '@/api/properties';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';

const CATEGORIES = [
  { type: 'residential', label: 'Residential', desc: 'Apartments, villas & builder floors' },
  { type: 'commercial', label: 'Commercial', desc: 'Offices, shops & warehouses' },
  { type: 'land', label: 'Plot / Land', desc: 'Residential & agricultural plots' },
];

export function Home() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => propertiesApi.search({ sort: 'newest', limit: 8 }),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-hero-gradient px-4 py-24 text-white sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-navy-100 backdrop-blur">
            <ShieldCheck size={13} /> Verified listings, zero brokerage friction
          </span>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Find your next plot, home, or workspace with <span className="text-navy-200">BrickBase</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-navy-200">
            Search thousands of verified listings across residential, commercial and land categories — compare,
            save, and enquire in seconds.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-xl gap-2 rounded-xl bg-white p-2 shadow-xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by city, locality, or project name"
                className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm text-navy-900 focus:outline-none"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-navy-900">Browse by category</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.type}
              to={`/search?property_type=${cat.type}`}
              className="group rounded-2xl border border-navy-100 bg-brand-gradient-soft p-6 card-shadow transition-transform hover:-translate-y-1"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
                <Building2 size={20} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">{cat.label}</h3>
              <p className="mt-1 text-sm text-navy-400">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-navy-50/60 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-navy-900">Newest listings</h2>
            <Link to="/search" className="text-sm font-semibold text-navy-600 hover:text-navy-800">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data?.items.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: MapPin, title: 'Verified listings', desc: 'Every listing goes through admin review before it goes live.' },
            { icon: TrendingUp, title: 'Compare side-by-side', desc: 'Shortlist up to 4 properties and compare specs instantly.' },
            { icon: Users, title: 'Direct to owner/agent', desc: 'Enquiries route straight to the listing owner — no middlemen.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-navy-100 p-6">
              <Icon className="text-navy-500" size={22} />
              <h3 className="mt-3 font-semibold text-navy-900">{title}</h3>
              <p className="mt-1 text-sm text-navy-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
