import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword(values);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate('/');
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-brand-gradient-soft px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 card-shadow">
        <div className="flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <Building2 size={20} />
          </span>
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-navy-900">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-navy-400">Log in to manage listings and enquiries</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-navy-700">Email</label>
            <input
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-navy-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
