import { pool } from "./pool.js";

async function main() {
  const text =
    'INSERT INTO public."users" ("email", "password_hash", "role") ' +
    "VALUES ($1, $2, $3) " +
    'ON CONFLICT ("email") DO NOTHING ' +
    "RETURNING id";

  const values = ["admin@font.local", "dev-password-hash", "admin"];

  const res = await pool.query(text, values);

  console.log(res.rowCount === 1 ? "seed ok (inserted)" : "seed ok (already exists)");
  await pool.end();
}

main().catch(async (e) => {
  console.error("seed failed:", e);
  await pool.end();
  process.exit(1);
});