import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

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

    const isDryRun = req.query.dryRun !== 'false';

    const targetColumns = [
      { table: 'users', column: 'stripe_account_id' },
      { table: 'users', column: 'stripe_charges_enabled' },
      { table: 'users', column: 'stripe_payouts_enabled' },
      { table: 'users', column: 'stripe_onboarding_completed' },
      { table: 'users', column: 'stripe_details_submitted' },
      { table: 'bookings', column: 'stripe_payment_intent_id' },
      { table: 'bookings', column: 'stripe_application_fee_amount' },
      { table: 'bookings', column: 'stripe_transfer_destination' },
      { table: 'bookings', column: 'payment_status' }
    ];

    // Determine existing tables & columns by querying information_schema
    let existingTables: string[] = [];
    let existingCols: { table_name: string; column_name: string }[] = [];

    try {
      const tablesResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('users', 'bookings')
      `;
      existingTables = tablesResult.rows.map(r => r.table_name);

      const columnsResult = await sql`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name IN ('users', 'bookings')
      `;
      existingCols = columnsResult.rows.map(r => ({
        table_name: r.table_name,
        column_name: r.column_name
      }));
    } catch (dbError: any) {
      console.warn("Could not query information_schema from database:", dbError.message);
    }

    const tableChecks: { users: 'exists' | 'created'; bookings: 'exists' } = {
      users: existingTables.includes('users') ? 'exists' : (isDryRun ? 'exists' as any : 'created'),
      bookings: 'exists'
    };

    const columnsAdded: string[] = [];
    const columnsAlreadyPresent: string[] = [];
    const errors: string[] = [];

    // Analyze target columns
    for (const target of targetColumns) {
      const present = existingCols.some(
        ec => ec.table_name === target.table && ec.column_name === target.column
      );
      if (present) {
        columnsAlreadyPresent.push(`${target.table}.${target.column}`);
      } else {
        columnsAdded.push(`${target.table}.${target.column}`);
      }
    }

    if (!isDryRun) {
      try {
        // Execute migrations
        // 1. Create users table if needed
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
        
        // 2. Add users columns
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255) NULL;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;`;

        // 3. Add bookings columns
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) NULL;`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_application_fee_amount INTEGER NULL;`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_transfer_destination VARCHAR(255) NULL;`;
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';`;

      } catch (migrationError: any) {
        console.error("Migration query failed during execution:", migrationError);
        errors.push(migrationError.message);
      }
    }

    return res.status(200).json({
      mode: isDryRun ? 'dry-run' : 'execute',
      tableChecks,
      columnsAdded,
      columnsAlreadyPresent,
      errors
    });

  } catch (error: any) {
    console.error("Migration handler failed:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
}
