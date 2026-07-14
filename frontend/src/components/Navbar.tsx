import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Heart, LayoutDashboard, LogOut, MessageCircle, Menu, Scale, ShieldCheck, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './Button';
import { useCompareStore } from '@/store/compareStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
    isActive ? 'text-navy-900 bg-navy-50' : 'text-navy-500 hover:text-navy-800 hover:bg-navy-50'
  }`;

export function Navbar() {
  const { profile, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const compareCount = useCompareStore((s) => s.ids.length);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setProfileMenuOpen(false);
    await signOut();
    navigate('/');
  }

  const canManageListings = profile?.role === 'owner' || profile?.role === 'agent';

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <Building2 size={18} />
          </span>
          <span className="text-lg font-bold text-navy-900">
            Brick<span className="text-gradient">Base</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/search" className={navLinkClass}>
            Browse
          </NavLink>
          <NavLink to="/compare" className={navLinkClass}>
            <span className="inline-flex items-center gap-1">
              <Scale size={14} /> Compare {compareCount > 0 && `(${compareCount})`}
            </span>
          </NavLink>
          {session && (
            <NavLink to="/favorites" className={navLinkClass}>
              <span className="inline-flex items-center gap-1">
                <Heart size={14} /> Favorites
              </span>
            </NavLink>
          )}
          {session && (
            <NavLink to="/messages" className={navLinkClass}>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={14} /> Messages
              </span>
            </NavLink>
          )}
          {canManageListings && (
            <NavLink to="/dashboard/listings" className={navLinkClass}>
              <span className="inline-flex items-center gap-1">
                <LayoutDashboard size={14} /> My Listings
              </span>
            </NavLink>
          )}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={14} /> Admin
              </span>
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session && profile ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-white">
                  <User size={14} />
                </span>
                {profile.full_name.split(' ')[0]}
                <ChevronDown size={14} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-navy-100 bg-white py-1 card-shadow">
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                  >
                    <User size={14} /> Edit profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-navy-700 hover:bg-navy-50"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-100 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/search" className={navLinkClass} onClick={() => setOpen(false)}>
              Browse
            </NavLink>
            <NavLink to="/compare" className={navLinkClass} onClick={() => setOpen(false)}>
              Compare
            </NavLink>
            {session && (
              <NavLink to="/favorites" className={navLinkClass} onClick={() => setOpen(false)}>
                Favorites
              </NavLink>
            )}
            {session && (
              <NavLink to="/messages" className={navLinkClass} onClick={() => setOpen(false)}>
                Messages
              </NavLink>
            )}
            {session && (
              <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>
                Edit profile
              </NavLink>
            )}
            {canManageListings && (
              <NavLink to="/dashboard/listings" className={navLinkClass} onClick={() => setOpen(false)}>
                My Listings
              </NavLink>
            )}
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            )}
            <div className="mt-2 flex gap-2">
              {session ? (
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
