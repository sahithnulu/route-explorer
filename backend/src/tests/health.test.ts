import request from 'supertest';
import app from '../index'

describe('GET /health', () => {
    it('responds with json', async () => {
        await request(app).get('/health').expect(200).expect({ status:'ok'});
    })
})

afterAll(async () => {
    const { httpServer } = await import('../index')
    const redis = (await import('../redis')).default
    httpServer.close()
    await redis.disconnect()
})