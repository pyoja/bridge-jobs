import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from '@/types/database';

// process.env.DATABASE_URL은 Supabase Postgres 커넥션 스트링이어야 합니다.
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
