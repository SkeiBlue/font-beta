import { pool } from "./pool";
import { hashPassword } from "../auth/password";

async function main() {
  const passHash = await hashPassword("admin");

  const text =
    'INSERT INTO public."users" ("email", "password_hash", "role") ' +
    "VALUES ($1, $2, $3) " +
    'ON CONFLICT ("email") DO UPDATE SET "password_hash" = EXCLUDED."password_hash", "role" = EXCLUDED."role" ' +
    "RETURNING id";

  const values = ["admin@font.local", passHash, "admin"];
  await pool.query(text, values);

  console.log("seed ok");
  await pool.end();
}

main().catch(async (e) => {
  console.error("seed failed:", e);
  await pool.end();
  process.exit(1);
});
