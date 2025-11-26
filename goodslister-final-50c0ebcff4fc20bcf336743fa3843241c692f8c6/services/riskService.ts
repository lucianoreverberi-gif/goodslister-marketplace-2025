
import { Listing, ListingCategory, RiskTier } from '../types';

// --- Configuration Constants ---
const WAIVER_PERCENTAGE = 0.15; // 15% for Soft Goods
const POWERSPORT_INSURANCE_DAILY_RATE = 35.00; // $35/day flat rate for now

export interface PriceBreakdown {
    baseRentalPrice: number;
    protectionFee: number;
    serviceFee: number; // Platform fee (e.g. 10%)
    totalPrice: number;
    riskTier: RiskTier;
    protectionLabel: string;
    requiresLicense: boolean;
}

export class RiskManagerService {
    
    /**
     * Determines the Risk Tier based on Category and Subcategory.
     */
    public static getRiskTier(listing: Listing): RiskTier {
        // Logic Branch 2: Powersports & Marine (High Risk)
        if (
            listing.category === ListingCategory.MOTORCYCLES ||
            listing.category === ListingCategory.RVS ||
            listing.category === ListingCategory.UTVS ||
            listing.category === ListingCategory.BOATS
        ) {
            return RiskTier.TIER_2_POWERSPORTS;
        }

        // Edge Case: Water Sports contains both Soft (Kayak) and Power (Jet Ski)
        if (listing.category === ListingCategory.WATER_SPORTS) {
            const sub = listing.subcategory?.toLowerCase() || '';
            if (sub.includes('jet ski') || sub.includes('wakeboard') || sub.includes('motor')) {
                return RiskTier.TIER_2_POWERSPORTS;
            }
        }

        // Logic Branch 1: Soft Goods (Low Risk) - Default
        return RiskTier.TIER_1_SOFT_GOODS;
    }

    /**
     * Calculates the full price breakdown including dynamic protection fees.
     */
    public static calculatePricing(listing: Listing, days: number): PriceBreakdown {
        const baseRate = listing.pricingType === 'daily' ? (listing.pricePerDay || 0) : (listing.pricePerHour || 0) * 24; // Normalize to daily if needed for logic
        const baseRentalPrice = baseRate * days;
        
        const riskTier = this.getRiskTier(listing);
        let protectionFee = 0;
        let protectionLabel = '';
        let requiresLicense = false;

        if (riskTier === RiskTier.TIER_1_SOFT_GOODS) {
            // Logic Branch 1: 15% of Daily Rate
            protectionFee = baseRentalPrice * WAIVER_PERCENTAGE;
            protectionLabel = 'Goodslister Protection Plan (15%)';
            requiresLicense = false;
        } else {
            // Logic Branch 2: Fixed Daily Premium
            protectionFee = POWERSPORT_INSURANCE_DAILY_RATE * days;
            protectionLabel = `Third-Party Liability Insurance ($${POWERSPORT_INSURANCE_DAILY_RATE}/day)`;
            requiresLicense = true;
        }

        // Platform Service Fee (e.g., 10% of base)
        const serviceFee = baseRentalPrice * 0.10;

        const totalPrice = baseRentalPrice + protectionFee + serviceFee;

        return {
            baseRentalPrice,
            protectionFee,
            serviceFee,
            totalPrice,
            riskTier,
            protectionLabel,
            requiresLicense
        };
    }

    /**
     * Verifies if a user is eligible to book a Tier 2 Asset.
     * In Phase 1, this checks if they have uploaded a license.
     */
    public static validateUserEligibility(listing: Listing, userHasLicense: boolean): boolean {
        const tier = this.getRiskTier(listing);
        if (tier === RiskTier.TIER_2_POWERSPORTS) {
            return userHasLicense;
        }
        return true;
    }
}
