// node --env-file=.env scripts/migrate-v3.mjs
// Agrega columna is_bulk_print a qr_codes para marcar los QR generados desde "Generar página"
import mysql from "mysql2/promise";

function unescapeEnv(value) {
  return value?.replace(/\\(.)/g, "$1");
}

const config = {
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "3306", 10),
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USERNAME,
  password: unescapeEnv(process.env.DB_PASSWORD),
  connectTimeout: 10000,
};

const migrations = [
  `ALTER TABLE qr_codes
   ADD COLUMN IF NOT EXISTS is_bulk_print TINYINT(1) NOT NULL DEFAULT 0`,
];

let conn;
try {
  conn = await mysql.createConnection(config);
  console.log(`\nConectado a ${config.host}:${config.port} / ${config.database}\n`);

  for (const sql of migrations) {
    try {
      await conn.query(sql);
      console.log("✓", sql.slice(0, 60).replace(/\n/g, " ").trim() + "…");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.message?.includes("Duplicate column")) {
        console.log("  (ya existe, ignorado)");
      } else {
        throw err;
      }
    }
  }

  console.log("\n✅ Migración v3 completada.\n");
} catch (err) {
  console.error(`\n❌ Error: ${err.message}\n`);
  process.exit(1);
} finally {
  if (conn) await conn.end().catch(() => {});
}
