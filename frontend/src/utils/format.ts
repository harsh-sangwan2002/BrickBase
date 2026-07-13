export function formatPrice(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatArea(value: number, unit: string): string {
  const unitLabel: Record<string, string> = {
    sqft: 'sq.ft',
    sqyd: 'sq.yd',
    acre: 'acre',
    sqm: 'sq.m',
  };
  return `${value.toLocaleString('en-IN')} ${unitLabel[unit] ?? unit}`;
}

export function coverImage(images: { image_url: string; is_cover: boolean }[] | undefined): string {
  if (!images || images.length === 0) {
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=60';
  }
  return images.find((img) => img.is_cover)?.image_url ?? images[0].image_url;
}

export function propertyTypeLabel(type: string): string {
  return { land: 'Plot/Land', residential: 'Residential', commercial: 'Commercial' }[type] ?? type;
}
