import { NavLink, Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Home, Inbox, PlusCircle } from 'lucide-react';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-gradient text-white' : 'text-navy-600 hover:bg-navy-50'
  }`;

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6">
        <aside className="hidden w-56 shrink-0 flex-col gap-1 md:flex">
          <NavLink to="/dashboard/listings" className={linkClass} end>
            <Home size={16} /> My Listings
          </NavLink>
          <NavLink to="/dashboard/listings/new" className={linkClass}>
            <PlusCircle size={16} /> New Listing
          </NavLink>
          <NavLink to="/dashboard/enquiries" className={linkClass}>
            <Inbox size={16} /> Enquiries
          </NavLink>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
