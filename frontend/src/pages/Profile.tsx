import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { CheckCircle2, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(7, 'Enter a valid phone number').optional().or(z.literal('')),
  agency_name: z.string().optional().or(z.literal('')),
  license_number: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export function Profile() {
  const { profile, session, refreshProfile } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        phone: profile.phone ?? '',
        agency_name: profile.agency_name ?? '',
        license_number: profile.license_number ?? '',
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: FormValues) {
    await authApi.updateMe(values);
    await refreshProfile();
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white">
          <User size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-navy-900">Your profile</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge>{profile.role}</Badge>
            {profile.role === 'agent' && (
              <Badge tone={profile.is_license_verified ? 'green' : 'amber'}>
                {profile.is_license_verified ? 'License verified' : 'Verification pending'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 rounded-2xl border border-navy-100 p-6 card-shadow">
        <div>
          <label className="text-sm font-medium text-navy-700">Full name</label>
          <input
            {...register('full_name')}
            className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
          />
          {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-navy-700">Email</label>
          <input
            value={session?.user.email ?? ''}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-navy-100 bg-navy-50 px-3 py-2.5 text-sm text-navy-400"
          />
          <p className="mt-1 text-xs text-navy-400">Email cannot be changed here.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-navy-700">Phone</label>
          <input
            {...register('phone')}
            className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>

        {profile.role === 'agent' && (
          <>
            <div>
              <label className="text-sm font-medium text-navy-700">Agency name</label>
              <input
                {...register('agency_name')}
                className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy-700">License number</label>
              <input
                {...register('license_number')}
                className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
              />
            </div>
          </>
        )}

        {isSubmitSuccessful && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 size={15} /> Profile updated
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
