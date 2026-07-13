import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/api/auth';
import { Button } from '@/components/Button';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email(),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['buyer', 'owner', 'agent']),
  agency_name: z.string().optional(),
  license_number: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'buyer' } });
  const role = watch('role');

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await authApi.signup(values);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (signInError) throw signInError;
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signup failed');
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-brand-gradient-soft px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 card-shadow">
        <div className="flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <Building2 size={20} />
          </span>
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-navy-900">Create your account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-navy-700">I am a</label>
            <select
              {...register('role')}
              className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
            >
              <option value="buyer">Buyer</option>
              <option value="owner">Owner</option>
              <option value="agent">Agent</option>
            </select>
          </div>
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
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-navy-700">Phone</label>
            <input
              {...register('phone')}
              className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-navy-700">Password</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {role === 'agent' && (
            <>
              <div>
                <label className="text-sm font-medium text-navy-700">Agency name</label>
                <input
                  {...register('agency_name')}
                  className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-700">License number (optional)</label>
                <input
                  {...register('license_number')}
                  className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
                />
              </div>
              <p className="text-xs text-navy-400">
                Agent accounts are reviewed by an admin before your license is verified.
              </p>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-navy-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
