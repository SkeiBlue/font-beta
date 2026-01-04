import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS uploads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename text NOT NULL,
      mimetype text NOT NULL,
      bytes integer NOT NULL,
      sha256 text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`CREATE INDEX IF NOT EXISTS uploads_user_id_idx ON uploads(user_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS uploads_sha256_idx ON uploads(sha256);`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE IF EXISTS uploads;`);
}
