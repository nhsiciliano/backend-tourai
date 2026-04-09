import 'dotenv/config'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config/env.js'
import { pregenerateFeaturedGuides } from '../src/modules/guides/pregeneration.js'

function parseArgs() {
  const args = process.argv.slice(2)

  return {
    dryRun: args.includes('--dry-run'),
    limit: (() => {
      const raw = args.find((arg) => arg.startsWith('--limit='))
      if (!raw) return undefined
      const parsed = Number(raw.split('=')[1])
      return Number.isFinite(parsed) ? parsed : undefined
    })(),
  }
}

async function main() {
  const config = loadConfig()
  const app = await buildApp(config)
  const args = parseArgs()

  try {
    const result = await pregenerateFeaturedGuides(app, {
      dryRun: args.dryRun,
      limit: args.limit,
    })

    app.log.info(result, 'Featured guide pre-generation completed')
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } finally {
    await app.close()
  }
}

void main()
