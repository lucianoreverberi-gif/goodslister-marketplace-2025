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
      { table: 'users', column: 'host_type' },
      { table: 'users', column: 'business_name' },
      { table: 'users', column: 'business_ein' },
      { table: 'users', column: 'business_license_url' },
      { table: 'listings', column: 'owner_insurance_declared' },
      { table: 'listings', column: 'owner_insurance_proof_url' },
      { table: 'listings', column: 'owner_insurance_declared_at' }
    ];

    // Determine existing tables & columns by querying information_schema
    let existingTables: string[] = [];
    let existingCols: { table_name: string; column_name: string }[] = [];

    try {
      const tablesResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('users', 'listings')
      `;
      existingTables = tablesResult.rows.map(r => r.table_name);

      const columnsResult = await sql`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name IN ('users', 'listings')
      `;
      existingCols = columnsResult.rows.map(r => ({
        table_name: r.table_name,
        column_name: r.column_name
      }));
    } catch (dbError: any) {
      console.warn("Could not query information_schema from database:", dbError.message);
    }

    const tableChecks: { users: 'exists' | 'created'; listings: 'exists' | 'created' } = {
      users: existingTables.includes('users') ? 'exists' : (isDryRun ? 'exists' : 'created'),
      listings: existingTables.includes('listings') ? 'exists' : (isDryRun ? 'exists' : 'created')
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
        // 1. Add host classification columns to users
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS host_type VARCHAR(20) DEFAULT 'individual';`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255) NULL;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_ein VARCHAR(20) NULL;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_license_url VARCHAR(500) NULL;`;

        // 2. Add insurance declaration columns to listings
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_insurance_declared BOOLEAN DEFAULT FALSE;`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_insurance_proof_url VARCHAR(500) NULL;`;
        await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_insurance_declared_at TIMESTAMPTZ NULL;`;

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
