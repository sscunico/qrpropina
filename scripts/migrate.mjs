// node --env-file=.env scripts/migrate.mjs
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  multipleStatements: true,
};

console.log(`\nConectando a ${config.host}:${config.port} / ${config.database} como ${config.user}…\n`);

const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");

// Separar por statements, stripear líneas de comentario antes de evaluar
const statements = sql
  .split(";")
  .map((s) =>
    s.split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim()
  )
  .filter(Boolean);

let conn;
try {
  conn = await mysql.createConnection({ ...config, multipleStatements: false });

  for (const stmt of statements) {
    const preview = stmt.slice(0, 60).replace(/\s+/g, " ");
    try {
      await conn.query(stmt);
      console.log(`✓ ${preview}…`);
    } catch (err) {
      console.error(`✗ ${preview}…`);
      console.error(`  → ${err.message}`);
      process.exit(1);
    }
  }

  console.log("\n✅ Migración completada.\n");
} catch (err) {
  console.error(`\n❌ No se pudo conectar: ${err.message}\n`);
  process.exit(1);
} finally {
  if (conn) await conn.end().catch(() => {});
}
