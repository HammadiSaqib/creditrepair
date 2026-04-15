/**
 * Migration: Add missing columns to disputes and clients tables
 * so the V2 code matches the actual MySQL DB schema.
 *
 * Run: node add-missing-db-columns.cjs
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function addColumnIfMissing(connection, table, column, definition) {
  if (await columnExists(connection, table, column)) {
    console.log(`  ⏭️  ${table}.${column} already exists`);
    return;
  }
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`  ✅  ${table}.${column} added`);
}

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'creditrepair_db',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
  });

  console.log('Connected to MySQL. Running migrations...\n');

  try {
    // ── Disputes table ──
    await addColumnIfMissing(connection, 'disputes', 'filed_date', 'DATE NULL');
    await addColumnIfMissing(connection, 'disputes', 'response_date', 'DATE NULL');
    await addColumnIfMissing(connection, 'disputes', 'result', 'TEXT NULL');
    await addColumnIfMissing(connection, 'disputes', 'notes', 'TEXT NULL');
    await addColumnIfMissing(connection, 'disputes', 'created_by', 'INT NULL');
    await addColumnIfMissing(connection, 'disputes', 'updated_by', 'INT NULL');

    // ── Clients table ──
    await addColumnIfMissing(connection, 'clients', 'middle_name', 'VARCHAR(100) NULL');
    await addColumnIfMissing(connection, 'clients', 'street_number_and_name', 'TEXT NULL');
    await addColumnIfMissing(connection, 'clients', 'country', "VARCHAR(100) DEFAULT 'United States'");
    await addColumnIfMissing(connection, 'clients', 'ssn_last_six', 'VARCHAR(6) NULL');
    await addColumnIfMissing(connection, 'clients', 'security_freeze_pin', 'VARCHAR(100) NULL');
    await addColumnIfMissing(connection, 'clients', 'fundable_status', 'VARCHAR(20) DEFAULT NULL');
    await addColumnIfMissing(connection, 'clients', 'fundable_in_tu', 'TINYINT(1) DEFAULT 0');
    await addColumnIfMissing(connection, 'clients', 'fundable_in_ex', 'TINYINT(1) DEFAULT 0');
    await addColumnIfMissing(connection, 'clients', 'fundable_in_eq', 'TINYINT(1) DEFAULT 0');

    // Backfill street_number_and_name from address where missing
    if (await columnExists(connection, 'clients', 'street_number_and_name') && await columnExists(connection, 'clients', 'address')) {
      const [result] = await connection.query(`
        UPDATE clients
        SET street_number_and_name = address
        WHERE (street_number_and_name IS NULL OR street_number_and_name = '')
          AND address IS NOT NULL AND address != ''
      `);
      console.log(`\n  ✅  Backfilled street_number_and_name for ${result.affectedRows} rows`);
    }

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('Migration error:', err);
  }

  await connection.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
