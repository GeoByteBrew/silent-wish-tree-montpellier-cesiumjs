import './reveal.css'

type Word = { text: string; value: number }

const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  demoKey: import.meta.env.VITE_DEMO_KEY as string | undefined,
}

function $(sel: string) {
  const el = document.querySelector(sel)
  if (!el) throw new Error(`Missing element: ${sel}`)
  return el as HTMLElement
}

function scaleFont(v: number, minV: number, maxV: number): number {
  if (maxV <= minV) return 28
  const t = (v - minV) / (maxV - minV)
  return Math.round(14 + t * 54)
}

function layoutWords(words: Word[]) {
  const wrap = document.createElement('div')
  wrap.className = 'cloud'

  const values = words.map((w) => w.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)

  for (const w of words) {
    const span = document.createElement('span')
    span.className = 'word'
    span.textContent = w.text
    span.style.fontSize = `${scaleFont(w.value, minV, maxV)}px`
    span.style.opacity = `${0.55 + (w.value - minV) / Math.max(1, maxV - minV) * 0.45}`
    span.style.transform = `rotate(${Math.random() < 0.18 ? (Math.random() < 0.5 ? -12 : 12) : 0}deg)`
    wrap.appendChild(span)
  }

  return wrap
}

async function main() {
  $('#revealApp').innerHTML = `
    <div class="page">
      <header class="header">
        <div class="kicker">Montpellier · 2026</div>
        <h1>Collective Wish Map</h1>
        <p class="muted">Individual wishes are never shown. This is an aggregate view.</p>
      </header>
      <div class="card" id="card">
        <div class="muted" id="status">Loading…</div>
      </div>
    </div>
  `

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    $('#status').textContent = 'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'
    return
  }

  const demoQuery = env.demoKey ? `?demoKey=${encodeURIComponent(env.demoKey)}` : ''
  const r = await fetch(`${env.supabaseUrl}/functions/v1/reveal${demoQuery}`, {
    headers: {
      Authorization: `Bearer ${env.supabaseAnonKey}`,
      apikey: env.supabaseAnonKey,
    },
  })
  const j = await r.json()

  if (j?.notYet) {
    $('#status').textContent = 'Not yet — see you on Jan 6, 2026 at 19:00.'
    return
  }
  const words = (j?.words ?? []) as Word[]
  if (!words.length) {
    $('#status').textContent = 'No data yet.'
    return
  }

  const card = $('#card')
  card.innerHTML = ''
  card.appendChild(layoutWords(words))
}

void main()


