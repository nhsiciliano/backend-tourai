import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import type { AppConfig } from '../config/env.js'

type ConfigPluginOptions = {
  config: AppConfig
}

const configPlugin: FastifyPluginAsync<ConfigPluginOptions> = async (fastify, options) => {
  fastify.decorate('config', options.config)
}

export default fp(configPlugin, {
  name: 'config',
})
