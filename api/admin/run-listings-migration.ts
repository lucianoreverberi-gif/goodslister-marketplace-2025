import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { mockListings } from '../../constants.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 0. Secure Authentication Check
    const expectedSecret = process.env.ADMIN_MIGRATION_SECRET;
    
    if (!expectedSecret) {
      return res.status(500).json({
        status: "error",
        error: "Server Configuration Error",
        message: "Server misconfiguration: ADMIN_MIGRATION_SECRET environment variable is required."
      });
    }

    const clientSecret = req.headers['x-admin-secret'];
    
    if (typeof clientSecret !== 'string') {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
        message: "Missing or invalid 'x-admin-secret' header. Access denied."
      });
    }

    // Use constant-time comparison via SHA-256 hashes of the strings
    const expectedHash = crypto.createHash('sha256').update(expectedSecret).digest();
    const clientHash = crypto.createHash('sha256').update(clientSecret).digest();

    if (!crypto.timingSafeEqual(expectedHash, clientHash)) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
        message: "Invalid 'x-admin-secret' header. Access denied."
      });
    }

    let dbListings: any[] = [];
    let isMockFallback = false;

    // 1. Try to ensure columns exist on the database and retrieve real rows
    try {
      await sql`
        ALTER TABLE listings 
        ADD COLUMN IF NOT EXISTS operation_mode INT,
        ADD COLUMN IF NOT EXISTS item_value NUMERIC,
        ADD COLUMN IF NOT EXISTS schema_version INT DEFAULT 1;
      `;
      const { rows } = await sql`SELECT * FROM listings`;
      dbListings = rows;
    } catch (dbErr: any) {
      console.warn("Neon Postgres connection / schema update failed, falling back to mock listings:", dbErr.message);
      isMockFallback = true;
      // Convert mockListings to match DB row formats
      dbListings = mockListings.map(l => ({
        id: l.id,
        title: l.title,
        category: l.category,
        subcategory: l.subcategory || '',
        price_per_day: l.pricePerDay || 0,
        price_per_hour: l.pricePerHour || 0,
        pricing_type: l.pricingType,
        security_deposit: l.securityDeposit || null,
        owner_id: l.owner.id
      }));
    }

    const totalListings = dbListings.length;
    const reviewedListings: any[] = [];
    const ambiguousListings: any[] = [];
    const updatesToApply: any[] = [];

    let countMode1 = 0;
    let countMode2 = 0;
    let countMode3 = 0;

    for (const row of dbListings) {
      const id = row.id;
      const title = row.title || '';
      const category = row.category || '';
      const subcategory = row.subcategory || '';
      const pricePerDay = Number(row.price_per_day || 0);
      const pricePerHour = Number(row.price_per_hour || 0);
      const pricingType = row.pricing_type || 'daily';
      const currentDeposit = row.security_deposit !== null ? Number(row.security_deposit) : null;

      const titleLower = title.toLowerCase();
      const subLower = subcategory.toLowerCase();
      const catLower = category.toLowerCase();

      let derivedMode: 1 | 2 | 3 = 1;
      let derivedValue = 1000;
      let notes = "";
      let isAmbiguous = false;

      // 1. Calculate Valuation FIRST
      if (subLower === "yacht" || titleLower.includes("yacht")) {
        derivedValue = 450000;
        derivedMode = 3; // Yachts are always Mode 3
        notes = "Yacht placed in Mode 3 (Bareboat Demise Charter & Owner Commercial Hull Policy).";
      } else if (catLower === "boats") {
        derivedValue = pricingType === "daily" ? pricePerDay * 150 : pricePerHour * 1200;
        if (derivedValue < 40000) derivedValue = 40000;
        derivedMode = 3; // All boats are Mode 3
        notes = "Boat placed in Mode 3 (Bareboat Demise Charter & Owner Commercial Hull Policy).";
      } else if (catLower === "rvs" || subLower === "campervan" || titleLower.includes("rv ") || titleLower.includes("campervan")) {
        derivedValue = pricePerDay * 300;
        if (derivedValue < 25000) derivedValue = 25000;
        
        // If Class A RV (over $150,000 or explicitly named "Class A") -> Mode 3.
        // Otherwise RV Class B/C / Campervan -> Mode 2.
        if (derivedValue >= 150000 || titleLower.includes("class a")) {
          derivedMode = 3;
          notes = "Premium RV Class A high-value asset placed in Mode 3 (Bareboat Demise Charter).";
        } else {
          derivedMode = 2;
          notes = "RV Class B/C campervan/trailer placed in Mode 2 (Peer-to-Peer Insurance Covered).";
        }
      } else if (
        catLower === "motorcycles" || 
        catLower === "atvs & utvs" || 
        subLower === "jet ski" || 
        titleLower.includes("jet ski") || 
        titleLower.includes("motorcycle") || 
        titleLower.includes("atv") || 
        titleLower.includes("utv")
      ) {
        derivedMode = 2;
        if (subLower === "jet ski" || titleLower.includes("jet ski")) {
          derivedValue = pricePerHour * 125;
          if (derivedValue < 10000) derivedValue = 10000;
          notes = "Motorized Jet Ski placed in Mode 2 (Peer-to-Peer Insurance Covered).";
        } else {
          derivedValue = pricingType === "daily" ? pricePerDay * 80 : pricePerHour * 800;
          if (derivedValue < 6000) derivedValue = 6000;
          notes = "Motorized powersports asset placed in Mode 2 (Peer-to-Peer Insurance Covered).";
        }
      } else {
        derivedMode = 1;
        derivedValue = pricingType === "daily" ? pricePerDay * 15 : pricePerHour * 40;
        if (derivedValue < 500) derivedValue = 500;
        if (derivedValue > 4000) derivedValue = 4000; // Cap Mode 1 items
        notes = "Low-risk non-motorized gears placed in Mode 1 (Self-Insured / Peer Damage Waiver).";

        // Check if there are motorized indicators
        if (titleLower.includes("motor") || titleLower.includes("engine") || titleLower.includes("electric")) {
          isAmbiguous = true;
          notes = "WARNING: Mode 1 item has motorized references ('motor', 'engine', 'electric') in title.";
        }
      }

      // Count modes
      if (derivedMode === 1) countMode1++;
      else if (derivedMode === 2) countMode2++;
      else if (derivedMode === 3) countMode3++;

      // Security deposit auto-correction block
      let proposedSecurityDeposit = currentDeposit;
      let depositAction = "No action (adequate or custom-set deposit)";

      if (derivedMode === 2) {
        if (currentDeposit === null || currentDeposit === 0) {
          if (catLower === "rvs" || subLower === "campervan" || titleLower.includes("rv ") || titleLower.includes("campervan")) {
            proposedSecurityDeposit = 1500;
            depositAction = `Auto-corrected from $${currentDeposit || 0} to proposed Mode 2 RV Class B/C minimum of $1,500.`;
          } else if (
            subLower === "jet ski" || 
            titleLower.includes("jet ski") || 
            catLower === "motorcycles" || 
            catLower === "atvs & utvs" || 
            titleLower.includes("motorcycle") || 
            titleLower.includes("atv") || 
            titleLower.includes("utv")
          ) {
            proposedSecurityDeposit = 1000;
            depositAction = `Auto-corrected from $${currentDeposit || 0} to proposed Mode 2 Motorized minimum of $1,000.`;
          } else {
            proposedSecurityDeposit = 500;
            depositAction = `Auto-corrected from $${currentDeposit || 0} to proposed Mode 2 High-value minimum of $500.`;
          }
        } else {
          // If a custom deposit was provided, ensure it meets the minimum bounds
          let minRequired = 500;
          if (catLower === "rvs" || subLower === "campervan" || titleLower.includes("rv ") || titleLower.includes("campervan")) {
            minRequired = 1500;
          } else if (
            subLower === "jet ski" || 
            titleLower.includes("jet ski") || 
            catLower === "motorcycles" || 
            catLower === "atvs & utvs" || 
            titleLower.includes("motorcycle") || 
            titleLower.includes("atv") || 
            titleLower.includes("utv")
          ) {
            minRequired = 1000;
          }
          if (currentDeposit < minRequired) {
            proposedSecurityDeposit = minRequired;
            depositAction = `Elevated from $${currentDeposit} to meet the absolute Mode 2 safety minimum of $${minRequired}.`;
          }
        }
      } else if (derivedMode === 3) {
        if (currentDeposit === null || currentDeposit === 0) {
          if (subLower === "yacht" || titleLower.includes("yacht")) {
            proposedSecurityDeposit = 3500;
            depositAction = `Auto-corrected from $${currentDeposit || 0} to proposed Mode 3 Yacht minimum of $3,500.`;
          } else if (catLower === "rvs" || subLower === "campervan" || titleLower.includes("rv ") || titleLower.includes("campervan")) {
            proposedSecurityDeposit = 2000;
            depositAction = `Auto-corrected from $${currentDeposit || 0} to proposed Mode 3 Class A RV minimum of $2,000.`;
          } else {
            proposedSecurityDeposit = 2000;
            depositAction = `Auto-corrected from $${currentDeposit || 0} to proposed Mode 3 Boat minimum of $2,000.`;
          }
        } else {
          let minRequired = (subLower === "yacht" || titleLower.includes("yacht")) ? 3500 : 2000;
          if (currentDeposit < minRequired) {
            proposedSecurityDeposit = minRequired;
            depositAction = `Elevated from $${currentDeposit} to meet the absolute Mode 3 safety minimum of $${minRequired}.`;
          }
        }
      }

      const listingReportObj = {
        id,
        title,
        category,
        subcategory,
        pricingType,
        pricePerDay,
        pricePerHour,
        currentDeposit,
        proposedDeposit: proposedSecurityDeposit,
        depositAction,
        derivedMode,
        derivedValue,
        notes,
        isAmbiguous
      };

      reviewedListings.push(listingReportObj);

      if (isAmbiguous) {
        ambiguousListings.push(listingReportObj);
      }

      updatesToApply.push({
        id,
        operation_mode: derivedMode,
        item_value: derivedValue,
        security_deposit: proposedSecurityDeposit,
        schema_version: 1
      });
    }

    // 3. Determine if live-write should be committed or only dry-run reported
    const isDryRun = req.query.dryRun !== 'false';

    // Safety Abort Check
    if (!isDryRun && totalListings > 50 && req.query.confirmAll !== 'true') {
      return res.status(400).json({
        status: "error",
        code: "CONFIRM_ALL_REQUIRED",
        message: `Safety Abort: There are ${totalListings} listings in the database, which exceeds the safety threshold of 50 for direct bulk execution. To proceed with this live database write, call the handler with '?dryRun=false&confirmAll=true'.`
      });
    }

    if (!isDryRun && !isMockFallback) {
      // Execute the actual write to Postgres
      for (const update of updatesToApply) {
        await sql`
          UPDATE listings 
          SET 
            operation_mode = ${update.operation_mode}, 
            item_value = ${update.item_value}, 
            security_deposit = ${update.security_deposit},
            schema_version = ${update.schema_version}
          WHERE id = ${update.id};
        `;
      }
    }

    return res.status(200).json({
      status: "success",
      executionMode: isDryRun 
        ? (isMockFallback ? "DRY_RUN (Fallback mock mode - Postgres Auth failed)" : "DRY_RUN (No records altered)") 
        : (isMockFallback ? "LIVE_WRITE (Simulated write to local context - Postgres Auth failed)" : "LIVE_WRITE (Database successfully updated)"),
      valuationMethodology: {
        mode1: "Multiplier of 15x Daily price, capped at $4,000, defaulted with a $500 minimum.",
        mode2: "Multiplier of 80x Daily price / 125x Hourly rate for Jet Skis, minimum $6,000-$10,000. RV Class B/C has a $25,000 minimum floor.",
        mode3: "Yachts fixed at $450,000. Boats daily pricing with 150x multiplier (min $40,000). Class A RVs with 300x multiplier (min $150,000)."
      },
      summary: {
        totalReviewed: totalListings,
        modeCounts: {
          mode1Count: countMode1,
          mode2Count: countMode2,
          mode3Count: countMode3
        },
        yachtDepositAutoCorrected: true
      },
      flaggedAmbiguousItems: ambiguousListings,
      listingsReport: reviewedListings
    });

  } catch (error: any) {
    console.error("Migration handler failed:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
}
