import pg from 'pg'
import connectPgSimple from 'connect-pg-simple'
import session from 'express-session'

const PgSession = connectPgSimple(session)

// Pool próprio para as sessões, separado do Prisma Client — connect-pg-simple
// fala diretamente com o Postgres via SQL, não através do Prisma.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

export const sessionStore = new PgSession({
  pool,
  tableName: 'user_sessions',
  // A tabela é criada pelas migrations do Prisma (model Session no
  // schema.prisma), não por aqui — evita "drift" entre o Prisma e a
  // realidade da BD sempre que corremos uma migration nova.
  createTableIfMissing: false,
})
