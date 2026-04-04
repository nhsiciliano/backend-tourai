import type { FastifyInstance } from 'fastify'
import authRoutes from './modules/auth/routes.js'
import devRoutes from './modules/dev/routes.js'
import guidesRoutes from './modules/guides/routes.js'
import healthRoutes from './modules/health/routes.js'
import locationRoutes from './modules/location/routes.js'
import placesRoutes from './modules/places/routes.js'
import rootRoutes from './modules/root/routes.js'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes)
  await app.register(rootRoutes)
  await app.register(healthRoutes)
  await app.register(devRoutes)
  await app.register(locationRoutes)
  await app.register(placesRoutes)
  await app.register(guidesRoutes)
}
