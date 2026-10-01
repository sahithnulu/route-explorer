import Redis from 'ioredis'

// Redis client for caching the road graph
// The road graph (18,187 nodes) is loaded from PostgreSQL once and cached here
// Subsequent route requests read from Redis in microseconds instead of hitting the DB
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

redis.on('connect', () => console.log('Connected to Redis'))
redis.on('error', (err) => console.error('Redis error:', err))

export default redis