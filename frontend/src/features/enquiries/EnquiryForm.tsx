import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { enquiriesApi } from '@/api/enquiries';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  message: z.string().min(5, 'Tell the owner what you need'),
});

type FormValues = z.infer<typeof schema>;

export function EnquiryForm({ propertyId }: { propertyId: number }) {
  const { profile } = useAuth();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.full_name ?? '',
      email: '',
      phone: profile?.phone ?? '',
      message: "Hi, I'm interested in this property. Please share more details.",
    },
  });

  async function onSubmit(values: FormValues) {
    await enquiriesApi.create(propertyId, values);
    setSent(true);
    reset();
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="text-emerald-600" size={28} />
        <p className="font-semibold text-emerald-700">Enquiry sent!</p>
        <p className="text-sm text-emerald-600">The owner/agent will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-navy-100 p-5">
      <h3 className="font-semibold text-navy-900">Interested? Send an enquiry</h3>
      <div>
        <input
          {...register('name')}
          placeholder="Your name"
          className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <input
          {...register('email')}
          placeholder="Email"
          className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <input
          {...register('phone')}
          placeholder="Phone number"
          className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>
      <div>
        <textarea
          {...register('message')}
          rows={3}
          className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send enquiry'}
      </Button>
    </form>
  );
}
