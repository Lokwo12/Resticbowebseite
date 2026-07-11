import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  console.log('Fetching donations from Postgres...')
  const { data, error } = await supabase.from('donations').select('*')
  if (error) {
    console.error('Failed to fetch donations:', error)
    process.exit(2)
  }

  const rows = data || []
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.join(process.cwd(), 'backups')
  await fs.mkdir(outDir, { recursive: true })

  const jsonPath = path.join(outDir, `donations-${now}.json`)
  await fs.writeFile(jsonPath, JSON.stringify(rows, null, 2), 'utf8')
  console.log('Wrote', jsonPath)

  // Build CSV
  const headers = new Set()
  rows.forEach(r => Object.keys(r || {}).forEach(k => headers.add(k)))
  const headerList = Array.from(headers)
  const csvRows = [headerList.join(',')]
  for (const r of rows) {
    const vals = headerList.map(h => {
      const v = r[h]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') return '"' + JSON.stringify(v).replace(/"/g, '""') + '"'
      return '"' + String(v).replace(/"/g, '""') + '"'
    })
    csvRows.push(vals.join(','))
  }

  const csvPath = path.join(outDir, `donations-${now}.csv`)
  await fs.writeFile(csvPath, csvRows.join('\n'), 'utf8')
  console.log('Wrote', csvPath)

  console.log(`Export complete: ${rows.length} rows`) 
}

main().catch(err => {
  console.error(err)
  process.exit(99)
})
