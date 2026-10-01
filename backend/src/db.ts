import Pool from 'pg'

// PostgreSQL connection pool
// Instead of opening a new connection for every query, the pool keeps
// several connections open and reuses them, reduces overhead significantly
const pool = new Pool.Pool({
    connectionString: process.env.DATABASE_URL,
})

export default pool