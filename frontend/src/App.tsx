import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

import { Home } from '@/pages/Home';
import { Search } from '@/pages/Search';
import { PropertyDetail } from '@/pages/PropertyDetail';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Favorites } from '@/pages/Favorites';
import { Compare } from '@/pages/Compare';

import { MyListings } from '@/pages/dashboard/MyListings';
import { PropertyFormPage } from '@/pages/dashboard/PropertyFormPage';
import { EnquiriesInbox } from '@/pages/dashboard/EnquiriesInbox';

import { AdminOverview } from '@/pages/admin/Overview';
import { AdminModeration } from '@/pages/admin/Moderation';
import { UsersAdmin } from '@/pages/admin/UsersAdmin';
import { ReportsAdmin } from '@/pages/admin/ReportsAdmin';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/favorites" element={<Favorites />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['owner', 'agent', 'admin']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard/listings" element={<MyListings />} />
                <Route path="/dashboard/listings/new" element={<PropertyFormPage />} />
                <Route path="/dashboard/listings/:id/edit" element={<PropertyFormPage />} />
                <Route path="/dashboard/enquiries" element={<EnquiriesInbox />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/users" element={<UsersAdmin />} />
                <Route path="/admin/reports" element={<ReportsAdmin />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
