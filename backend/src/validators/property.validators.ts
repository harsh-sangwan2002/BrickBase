import { z } from 'zod';

export const propertyTypeEnum = z.enum(['land', 'residential', 'commercial']);
export const listingTypeEnum = z.enum(['sale', 'rent']);
export const furnishingEnum = z.enum(['unfurnished', 'semi_furnished', 'furnished']);
export const possessionEnum = z.enum(['ready_to_move', 'under_construction']);
export const areaUnitEnum = z.enum(['sqft', 'sqyd', 'acre', 'sqm']);

// Nullable optional fields: property detail responses send `null` (not `undefined`) for
// unset columns (e.g. bhk on a plot listing), and edit forms round-trip that value back on
// save — treat null the same as "not provided" instead of rejecting it.
function nullableOptional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => (val === null ? undefined : val), schema.optional());
}

export const createPropertySchema = z.object({
  property_type: propertyTypeEnum,
  listing_type: listingTypeEnum,
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  price: z.coerce.number().positive(),
  price_negotiable: z.boolean().optional().default(false),
  area_value: z.coerce.number().positive(),
  area_unit: areaUnitEnum,
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4).max(10),
  latitude: nullableOptional(z.coerce.number()),
  longitude: nullableOptional(z.coerce.number()),
  bhk: nullableOptional(z.coerce.number().int().min(1).max(20)),
  bathrooms: nullableOptional(z.coerce.number().int().min(0).max(20)),
  furnishing_status: nullableOptional(furnishingEnum),
  possession_status: nullableOptional(possessionEnum),
  age_of_property_years: nullableOptional(z.coerce.number().int().min(0).max(150)),
  attributes: z.record(z.any()).optional().default({}),
  amenity_ids: z.array(z.number().int()).optional().default([]),
});

export const updatePropertySchema = createPropertySchema.partial();

export const searchPropertiesSchema = z.object({
  property_type: propertyTypeEnum.optional(),
  listing_type: listingTypeEnum.optional(),
  city: z.string().optional(),
  q: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  min_area: z.coerce.number().optional(),
  max_area: z.coerce.number().optional(),
  bhk: z.coerce.number().int().optional(),
  amenities: z.string().optional(), // comma-separated ids
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'area']).optional().default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const compareQuerySchema = z.object({
  ids: z.string().min(1),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int(),
});
