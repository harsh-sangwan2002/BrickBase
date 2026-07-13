import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { formatPrice } from '@/utils/format';

export function EmiCalculator({ defaultPrice }: { defaultPrice: number }) {
  const [principal, setPrincipal] = useState(Math.round(defaultPrice * 0.8));
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const emi = useMemo(() => {
    const monthlyRate = rate / 12 / 100;
    const months = years * 12;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }, [principal, rate, years]);

  return (
    <div className="rounded-xl border border-navy-100 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-navy-900">
        <Calculator size={16} /> EMI Calculator
      </h3>
      <div className="mt-4 space-y-4 text-sm">
        <label className="block">
          <span className="text-navy-500">Loan amount</span>
          <input
            type="range"
            min={100000}
            max={defaultPrice}
            step={50000}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="mt-1 w-full accent-navy-600"
          />
          <span className="font-semibold text-navy-800">{formatPrice(principal)}</span>
        </label>
        <label className="block">
          <span className="text-navy-500">Interest rate (% p.a.)</span>
          <input
            type="range"
            min={5}
            max={15}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full accent-navy-600"
          />
          <span className="font-semibold text-navy-800">{rate.toFixed(1)}%</span>
        </label>
        <label className="block">
          <span className="text-navy-500">Tenure (years)</span>
          <input
            type="range"
            min={1}
            max={30}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full accent-navy-600"
          />
          <span className="font-semibold text-navy-800">{years} yrs</span>
        </label>
      </div>
      <div className="mt-5 rounded-lg bg-brand-gradient p-4 text-center text-white">
        <p className="text-xs uppercase tracking-wide text-navy-200">Estimated monthly EMI</p>
        <p className="text-2xl font-bold">{formatPrice(Math.round(emi))}</p>
      </div>
    </div>
  );
}
