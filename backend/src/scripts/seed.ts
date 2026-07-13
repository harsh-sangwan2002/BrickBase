import { supabaseAdmin } from '../config/supabase';

const UNSPLASH = {
  apartment: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60',
  villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=60',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=60',
  shop: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=60',
  plot: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=60',
  warehouse: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=60',
};

interface SeedProperty {
  property_type: 'land' | 'residential' | 'commercial';
  listing_type: 'sale' | 'rent';
  title: string;
  description: string;
  price: number;
  price_negotiable: boolean;
  area_value: number;
  area_unit: 'sqft' | 'sqyd' | 'acre' | 'sqm';
  address: string;
  city: string;
  state: string;
  pincode: string;
  bhk?: number;
  bathrooms?: number;
  furnishing_status?: 'unfurnished' | 'semi_furnished' | 'furnished';
  possession_status?: 'ready_to_move' | 'under_construction';
  attributes?: Record<string, unknown>;
  is_verified?: boolean;
  is_featured?: boolean;
  image: string;
}

const SEED_PROPERTIES: SeedProperty[] = [
  {
    property_type: 'residential',
    listing_type: 'sale',
    title: '3 BHK Apartment in Sector 57',
    description: 'Spacious and well-ventilated 3 BHK apartment with modern amenities, close to schools, hospitals and the metro station. Ideal for families.',
    price: 9800000,
    price_negotiable: true,
    area_value: 1650,
    area_unit: 'sqft',
    address: 'Plot 42, DLF Phase 4',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122009',
    bhk: 3,
    bathrooms: 2,
    furnishing_status: 'semi_furnished',
    possession_status: 'ready_to_move',
    is_verified: true,
    is_featured: true,
    image: UNSPLASH.apartment,
  },
  {
    property_type: 'residential',
    listing_type: 'rent',
    title: '2 BHK Builder Floor near Metro',
    description: 'Well-maintained 2 BHK builder floor, walking distance to the metro station and market. Great for young families or working professionals.',
    price: 32000,
    price_negotiable: false,
    area_value: 1100,
    area_unit: 'sqft',
    address: 'Lajpat Nagar Main Rd',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110024',
    bhk: 2,
    bathrooms: 2,
    furnishing_status: 'furnished',
    possession_status: 'ready_to_move',
    is_verified: true,
    image: UNSPLASH.apartment,
  },
  {
    property_type: 'residential',
    listing_type: 'sale',
    title: '4 BHK Independent Villa with Garden',
    description: 'Premium independent villa with private garden, servant quarters and covered parking for 3 cars. Located in a gated community.',
    price: 28500000,
    price_negotiable: true,
    area_value: 3800,
    area_unit: 'sqft',
    address: 'Whitefield Main Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    bhk: 4,
    bathrooms: 4,
    furnishing_status: 'unfurnished',
    possession_status: 'ready_to_move',
    is_verified: true,
    is_featured: true,
    image: UNSPLASH.villa,
  },
  {
    property_type: 'residential',
    listing_type: 'rent',
    title: '1 BHK Furnished Studio for Rent',
    description: 'Cozy fully furnished 1 BHK, perfect for a single professional or couple. Includes AC, wardrobe, bed and modular kitchen.',
    price: 18000,
    price_negotiable: false,
    area_value: 550,
    area_unit: 'sqft',
    address: 'Baner-Pashan Link Rd',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
    bhk: 1,
    bathrooms: 1,
    furnishing_status: 'furnished',
    possession_status: 'ready_to_move',
    image: UNSPLASH.apartment,
  },
  {
    property_type: 'commercial',
    listing_type: 'rent',
    title: 'Grade-A Office Space in Business Park',
    description: 'Ready-to-move office space with modern interiors, dedicated parking, power backup and 24/7 security in a premium business park.',
    price: 250000,
    price_negotiable: true,
    area_value: 5000,
    area_unit: 'sqft',
    address: 'Cyber City, DLF',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    is_verified: true,
    is_featured: true,
    attributes: { cabins: 6, workstations: 60, washrooms: 4, power_backup: true, subtype: 'office' },
    image: UNSPLASH.office,
  },
  {
    property_type: 'commercial',
    listing_type: 'sale',
    title: 'Retail Shop on Main Market Road',
    description: 'High footfall retail shop facing the main road, ideal for a showroom, restaurant, or retail outlet. Excellent visibility and signage rights.',
    price: 12000000,
    price_negotiable: true,
    area_value: 800,
    area_unit: 'sqft',
    address: 'MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    attributes: { subtype: 'shop', washrooms: 1, floor: 'ground' },
    image: UNSPLASH.shop,
  },
  {
    property_type: 'commercial',
    listing_type: 'rent',
    title: 'Warehouse with Loading Dock',
    description: 'Large warehouse facility with high ceilings, multiple loading docks and 24/7 security. Suitable for logistics and storage businesses.',
    price: 180000,
    price_negotiable: true,
    area_value: 12000,
    area_unit: 'sqft',
    address: 'Bhiwandi Industrial Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '421302',
    attributes: { subtype: 'warehouse', power_backup: true },
    image: UNSPLASH.warehouse,
  },
  {
    property_type: 'land',
    listing_type: 'sale',
    title: 'DTCP Approved Residential Plot',
    description: 'Corner residential plot in a gated layout, DTCP approved with clear title. Close to schools and upcoming metro extension.',
    price: 6500000,
    price_negotiable: true,
    area_value: 2400,
    area_unit: 'sqft',
    address: 'Sarjapur Road Extension',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '562125',
    is_verified: true,
    attributes: { zoning: 'residential', corner_plot: true, boundary_wall: true, approving_authority: 'DTCP', road_width_ft: 40 },
    image: UNSPLASH.plot,
  },
  {
    property_type: 'land',
    listing_type: 'sale',
    title: 'Agricultural Land near Highway',
    description: 'Fertile agricultural land with borewell and highway frontage, suitable for farming or future commercial development.',
    price: 4200000,
    price_negotiable: true,
    area_value: 2,
    area_unit: 'acre',
    address: 'NH-48 Frontage Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412108',
    attributes: { zoning: 'agricultural', road_width_ft: 60 },
    image: UNSPLASH.plot,
  },
  {
    property_type: 'residential',
    listing_type: 'sale',
    title: '2 BHK Apartment Under Construction',
    description: 'Brand new 2 BHK in an upcoming project with clubhouse, swimming pool and landscaped gardens. Possession expected in 18 months.',
    price: 7200000,
    price_negotiable: false,
    area_value: 1050,
    area_unit: 'sqft',
    address: 'Kharadi-Wagholi Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '412207',
    bhk: 2,
    bathrooms: 2,
    furnishing_status: 'unfurnished',
    possession_status: 'under_construction',
    image: UNSPLASH.apartment,
  },
];

async function ensureSeedOwner(): Promise<string> {
  const email = 'seed-owner@brickbase.app';
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'SeedOwner123!',
    email_confirm: true,
    user_metadata: { full_name: 'BrickBase Seed Owner', phone: '9800000000', role: 'owner' },
  });
  if (error || !data.user) throw new Error(`Failed to create seed owner: ${error?.message}`);
  return data.user.id;
}

async function main() {
  const ownerId = await ensureSeedOwner();
  console.log(`Seeding ${SEED_PROPERTIES.length} properties for owner ${ownerId}...`);

  for (const seed of SEED_PROPERTIES) {
    const { image, ...rest } = seed;

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .insert({ ...rest, owner_id: ownerId, status: 'active' })
      .select('id, title')
      .single();

    if (error) {
      console.error(`Failed to insert "${seed.title}": ${error.message}`);
      continue;
    }

    await supabaseAdmin.from('property_images').insert({ property_id: property.id, image_url: image, is_cover: true, sort_order: 0 });
    console.log(`Created: ${property.title} (id ${property.id})`);
  }

  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
