
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function ensureListingColumns() {
    try {
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_gps_tracker BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_commercial_insurance BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10, 2) DEFAULT 0`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'rental'`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS operator_license_id TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS fuel_policy VARCHAR(20) `;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS skill_level VARCHAR(20) `;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS whats_included TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS itinerary TEXT`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20) DEFAULT 'item'`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS instant_booking_enabled BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS legal_template_selection VARCHAR(20) DEFAULT 'standard'`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS legal_item_name TEXT`;
    } catch (e) {
        console.error("Migration in update failed:", e);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { listing } = req.body;

  if (!listing || !listing.id) {
      return res.status(400).json({ error: 'Invalid listing data' });
  }

  const executeUpdate = async (retryCount = 0): Promise<any> => {
      try {
        await sql`
            UPDATE listings SET
                title = ${listing.title},
                description = ${listing.description},
                category = ${listing.category},
                subcategory = ${listing.subcategory},
                price_per_day = ${listing.pricePerDay || 0},
                price_per_hour = ${listing.pricePerHour || 0},
                pricing_type = ${listing.pricingType},
                location_city = ${listing.location.city},
                location_state = ${listing.location.state},
                location_country = ${listing.location.country},
                location_lat = ${listing.location.latitude},
                location_lng = ${listing.location.longitude},
                images = ${listing.images as any},
                video_url = ${listing.videoUrl || ''},
                owner_rules = ${listing.ownerRules || ''},
                has_gps_tracker = ${listing.hasGpsTracker || false},
                has_commercial_insurance = ${listing.hasCommercialInsurance || false},
                security_deposit = ${listing.securityDeposit || 0},
                listing_type = ${listing.listingType || 'rental'},
                operator_license_id = ${listing.operatorLicenseId || ''},
                fuel_policy = ${listing.fuelPolicy || ''},
                skill_level = ${listing.skillLevel || ''},
                whats_included = ${listing.whatsIncluded || ''},
                itinerary = ${listing.itinerary || ''},
                price_unit = ${listing.priceUnit || 'item'},
                instant_booking_enabled = ${listing.instantBookingEnabled || false},
                legal_template_selection = ${listing.legalTemplateSelection || 'standard'},
                legal_item_name = ${listing.legalItemName || ''}
            WHERE id = ${listing.id}
        `;
        return { success: true, listing };
      } catch (error: any) {
          if (retryCount >= 1) throw error;
          if (error.code === '42703' || error.message?.includes('does not exist')) {
              await ensureListingColumns();
              return await executeUpdate(retryCount + 1);
          }
          throw error;
      }
  };

  try {
    const result = await executeUpdate();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Update listing error:', error);
    return res.status(500).json({ error: `Failed to update listing: ${error.message}` });
  }
}
