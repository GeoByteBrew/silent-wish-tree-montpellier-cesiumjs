import './style.css'
import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  HeadingPitchRoll,
  Ion,
  IonImageryProvider,
  IonResource,
  Math as CesiumMath,
  Matrix4,
  Model,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  Viewer,
} from 'cesium'

type Lang = 'fr' | 'en'

const I18N: Record<Lang, Record<string, string>> = {
  fr: {
    title: 'Montpellier – Arbre des vœux silencieux',
    subtitle: "Choisis une décoration et accroche un vœu (140 caractères max). Le texte ne sera jamais affiché.",
    language: 'Langue',
    ornament: 'Décoration',
    wish: 'Vœu (max 140)',
    hang: 'Accrocher',
    hanging: 'Accrochage…',
    done: 'C’est accroché. Télécharge ton souvenir.',
    download: 'Télécharger l’image',
    total: 'Vœux au total',
    camera: 'Caméra',
    camCity: 'Ville',
    camTree: 'Arbre',
    errorMissing: 'Ajoute un vœu et complète le captcha.',
    errorServer: 'Erreur serveur. Réessaie.',
    reveal: 'Révélation',
    revealNotYet: 'Pas encore. Rendez-vous le 6 janvier 2026.',
    openLinkedIn: 'Partager sur LinkedIn',
  },
  en: {
    title: 'Montpellier – Silent Wish Tree',
    subtitle: 'Pick an ornament and hang a wish (max 140 chars). The text is never displayed.',
    language: 'Language',
    ornament: 'Ornament',
    wish: 'Wish (max 140)',
    hang: 'Hang',
    hanging: 'Hanging…',
    done: 'Hung. Download your memory.',
    download: 'Download image',
    total: 'Total wishes',
    camera: 'Camera',
    camCity: 'City',
    camTree: 'Tree',
    errorMissing: 'Please write a wish and complete the captcha.',
    errorServer: 'Server error. Try again.',
    reveal: 'Reveal',
    revealNotYet: 'Not yet. See you on Jan 6, 2026.',
    openLinkedIn: 'Share on LinkedIn',
  },
}

const env = {
  ionToken: (import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined)?.trim(),
  photorealisticAssetId: Number((import.meta.env.VITE_ION_PHOTOREALISTIC_ASSET_ID as string | undefined)?.trim() ?? ''),
  imageryAssetId: Number((import.meta.env.VITE_ION_IMAGERY_ASSET_ID as string | undefined)?.trim() ?? ''),
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim(),
  turnstileSiteKey: (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim(),
  apiBase: (import.meta.env.VITE_API_BASE as string | undefined)?.trim(), // optional override
  revealDateIso: (import.meta.env.VITE_REVEAL_AT_ISO as string | undefined)?.trim() ?? '2026-01-06T00:00:00+01:00',
  demoKey: (import.meta.env.VITE_DEMO_KEY as string | undefined)?.trim(), // used only for local testing
  treeLat: Number((import.meta.env.VITE_TREE_LAT as string | undefined)?.trim() ?? ''),
  treeLon: Number((import.meta.env.VITE_TREE_LON as string | undefined)?.trim() ?? ''),
  treeHeight: Number((import.meta.env.VITE_TREE_HEIGHT as string | undefined)?.trim() ?? ''),
  treeGroundOffsetM: Number((import.meta.env.VITE_TREE_GROUND_OFFSET_M as string | undefined)?.trim() ?? ''),
  treeGroundSampleRadiusM: Number((import.meta.env.VITE_TREE_GROUND_SAMPLE_RADIUS_M as string | undefined)?.trim() ?? ''),
  treeScale: Number((import.meta.env.VITE_TREE_SCALE as string | undefined)?.trim() ?? ''),
  treeHeadingDeg: Number((import.meta.env.VITE_TREE_HEADING_DEG as string | undefined)?.trim() ?? ''),
  ionTreeAssetId: Number((import.meta.env.VITE_ION_TREE_ASSET_ID as string | undefined)?.trim() ?? ''),
  ionTreeGeojsonAssetId: Number((import.meta.env.VITE_ION_TREE_GEOJSON_ASSET_ID as string | undefined)?.trim() ?? ''),

  ionExtraTreesModelAssetId: Number((import.meta.env.VITE_ION_EXTRA_TREES_MODEL_ASSET_ID as string | undefined)?.trim() ?? ''),
  ionExtraTreesGeojsonAssetId: Number((import.meta.env.VITE_ION_EXTRA_TREES_GEOJSON_ASSET_ID as string | undefined)?.trim() ?? ''),
  extraTreesScale: Number((import.meta.env.VITE_EXTRA_TREES_SCALE as string | undefined)?.trim() ?? ''),
  extraTreesGroundOffsetM: Number((import.meta.env.VITE_EXTRA_TREES_GROUND_OFFSET_M as string | undefined)?.trim() ?? ''),
  extraTreesSampleRadiusM: Number((import.meta.env.VITE_EXTRA_TREES_GROUND_SAMPLE_RADIUS_M as string | undefined)?.trim() ?? ''),
  extraTreesLimit: Number((import.meta.env.VITE_EXTRA_TREES_LIMIT as string | undefined)?.trim() ?? ''),
  extraTreesOffsetEastM: Number((import.meta.env.VITE_EXTRA_TREES_OFFSET_EAST_M as string | undefined)?.trim() ?? ''),
  extraTreesOffsetNorthM: Number((import.meta.env.VITE_EXTRA_TREES_OFFSET_NORTH_M as string | undefined)?.trim() ?? ''),

  cameraLat: Number((import.meta.env.VITE_CAMERA_LAT as string | undefined)?.trim() ?? ''),
  cameraLon: Number((import.meta.env.VITE_CAMERA_LON as string | undefined)?.trim() ?? ''),
}

const ORNAMENTS = [
  { id: 'star', label: { fr: 'Étoile', en: 'Star' } },
  { id: 'ball_red', label: { fr: 'Boule rouge', en: 'Red ball' } },
  { id: 'ball_gold', label: { fr: 'Boule dorée', en: 'Gold ball' } },
  { id: 'bell', label: { fr: 'Cloche', en: 'Bell' } },
  { id: 'candy', label: { fr: 'Sucre d’orge', en: 'Candy cane' } },
] as const

type OrnamentId = (typeof ORNAMENTS)[number]['id']

function $(sel: string) {
  const el = document.querySelector(sel)
  if (!el) throw new Error(`Missing element: ${sel}`)
  return el as HTMLElement
}

function createClientId(): string {
  const key = 'silentwish_client_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}

function formatLocalTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} · ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

function injectTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile]')
    if (existing) return resolve()
    const s = document.createElement('script')
    s.dataset.turnstile = '1'
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(s)
  })
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; theme?: string }) => string
      reset: (widgetId: string) => void
    }
  }
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function screenshotWithCaption(viewer: Viewer, captionLines: string[]): Promise<string> {
  // ensure a frame is rendered
  viewer.render()
  const srcCanvas = viewer.scene.canvas
  const w = srcCanvas.width
  const h = srcCanvas.height
  const pad = Math.max(16, Math.floor(Math.min(w, h) * 0.02))
  const footerH = Math.max(90, Math.floor(h * 0.14))

  const out = document.createElement('canvas')
  out.width = w
  out.height = h + footerH
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('No 2D context')

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, out.width, out.height)

  // draw 3D
  ctx.drawImage(srcCanvas, 0, 0)

  // footer
  ctx.fillStyle = '#0b0f14'
  ctx.fillRect(0, h, w, footerH)

  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${Math.max(16, Math.floor(footerH * 0.22))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  ctx.textBaseline = 'top'

  const lineH = Math.max(18, Math.floor(footerH * 0.28))
  let y = h + pad
  for (const line of captionLines.slice(0, 3)) {
    ctx.fillText(line, pad, y)
    y += lineH
  }

  return out.toDataURL('image/png')
}

// ---- Coordinate helpers (WGS84 + Lambert-93 EPSG:2154) ----
// Many French open-data sets are in Lambert-93 meters. If GeoJSON coordinates look like (x ~ 700000, y ~ 6.2e6),
// we convert them to WGS84 degrees.
function lambert93ToWgs84(x: number, y: number): { lon: number; lat: number } {
  // Constants for Lambert-93 (EPSG:2154)
  const e = 0.0818191910428158
  const n = 0.725607765053267
  const C = 11754255.426096
  const xs = 700000.0
  const ys = 12655612.049876
  const lon0 = 3.0 * Math.PI / 180.0 // central meridian

  const dx = x - xs
  const dy = ys - y
  const R = Math.sqrt(dx * dx + dy * dy)
  const gamma = Math.atan2(dx, dy)
  const lon = lon0 + gamma / n
  const latIso = -1 / n * Math.log(R / C)

  // Iterative solve for latitude from isometric latitude
  let lat = 2 * Math.atan(Math.exp(latIso)) - Math.PI / 2
  for (let i = 0; i < 8; i++) {
    const sinLat = Math.sin(lat)
    const next =
      2 *
        Math.atan(
          Math.pow((1 + e * sinLat) / (1 - e * sinLat), e / 2) * Math.exp(latIso),
        ) -
      Math.PI / 2
    if (Math.abs(next - lat) < 1e-11) {
      lat = next
      break
    }
    lat = next
  }

  return { lon: (lon * 180) / Math.PI, lat: (lat * 180) / Math.PI }
}

function looksLikeLambert93(a: number, b: number): boolean {
  // a,b are likely x,y in meters
  return Math.abs(a) > 1000 && Math.abs(b) > 1000 && Math.abs(a) < 2e7 && Math.abs(b) < 2e7
}

function normalizeLonLat(a: number, b: number): { lon: number; lat: number; note?: string } {
  // If it already looks like lon/lat degrees:
  if (Math.abs(a) <= 180 && Math.abs(b) <= 90) return { lon: a, lat: b }
  // If swapped:
  if (Math.abs(b) <= 180 && Math.abs(a) <= 90) return { lon: b, lat: a, note: 'swapped' }
  // Lambert-93 meters (x,y)
  if (looksLikeLambert93(a, b)) {
    const { lon, lat } = lambert93ToWgs84(a, b)
    return { lon, lat, note: 'lambert93' }
  }
  return { lon: a, lat: b, note: 'unknown' }
}

async function fetchIonGeoJson(assetId: number): Promise<any> {
  const res = await IonResource.fromAssetId(assetId)
  const r = await fetch(res as unknown as RequestInfo)
  if (!r.ok) throw new Error(`GeoJSON HTTP ${r.status}`)
  return await r.json()
}

function extractLonLatPointsFromGeoJson(geo: any): Array<{ lon: number; lat: number; note?: string }> {
  const pts: Array<{ lon: number; lat: number; note?: string }> = []
  if (!geo) return pts

  const addCoord = (coord: any) => {
    if (!Array.isArray(coord) || coord.length < 2) return
    const a = Number(coord[0])
    const b = Number(coord[1])
    if (!Number.isFinite(a) || !Number.isFinite(b)) return
    pts.push(normalizeLonLat(a, b))
  }

  const walkGeom = (geom: any) => {
    if (!geom) return
    if (geom.type === 'Point') addCoord(geom.coordinates)
    else if (geom.type === 'MultiPoint') {
      for (const c of geom.coordinates ?? []) addCoord(c)
    }
  }

  if (geo.type === 'FeatureCollection') {
    for (const f of geo.features ?? []) walkGeom(f?.geometry)
  } else if (geo.type === 'Feature') {
    walkGeom(geo.geometry)
  } else {
    walkGeom(geo)
  }

  return pts
}

function summarizePointNotes(pts: Array<{ lon: number; lat: number; note?: string }>): string {
  const counts = new Map<string, number>()
  for (const p of pts) {
    const k = p.note ?? 'wgs84'
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const parts = Array.from(counts.entries()).map(([k, v]) => `${k}:${v}`)
  return parts.join(', ')
}

function getNumberParam(name: string): number | null {
  const v = new URLSearchParams(window.location.search).get(name)
  if (v == null || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function getStoredNumber(key: string): number | null {
  const v = localStorage.getItem(key)
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function setStoredNumber(key: string, n: number) {
  localStorage.setItem(key, String(n))
}

async function init() {
  let lang: Lang = (localStorage.getItem('lang') as Lang) || 'fr'
  let selectedOrnament: OrnamentId = 'star'
  let turnstileToken = ''
  let turnstileWidgetId: string | null = null

  const clientId = createClientId()

  $('#app').innerHTML = `
    <div class="layout">
      <div class="scene">
        <div id="cesium"></div>
        <div class="hud">
          <div class="hud-row">
            <span class="badge" id="totalBadge">…</span>
            <button class="ghost" id="revealBtn"></button>
          </div>
        </div>
      </div>
      <aside class="panel">
        <div class="panel-header">
          <div class="kicker">2026</div>
          <h1 id="title"></h1>
          <p id="subtitle" class="muted"></p>
        </div>

        <div class="section">
          <div class="label-row">
            <label class="label" id="langLabel"></label>
            <div class="segmented">
              <button class="seg" id="langFr">FR</button>
              <button class="seg" id="langEn">EN</button>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="label-row">
            <div class="label" id="ornLabel"></div>
          </div>
          <div class="orn-grid" id="ornGrid"></div>
        </div>

        <div class="section">
          <label class="label" id="wishLabel" for="wishInput"></label>
          <textarea id="wishInput" rows="3" maxlength="140" placeholder="…"></textarea>
          <div class="row">
            <div class="turnstile" id="turnstileBox"></div>
          </div>
          <div class="row">
            <button class="primary" id="hangBtn"></button>
          </div>
          <div class="row">
            <button class="secondary" id="downloadBtn" disabled></button>
          </div>
          <div id="status" class="status muted"></div>
        </div>

        <div class="section">
          <div class="label-row">
            <div class="label" id="camLabel"></div>
          </div>
          <div class="row">
            <button class="ghost" id="camCityBtn"></button>
            <button class="ghost" id="camTreeBtn"></button>
          </div>
        </div>

        <div class="footer muted">
          No account · No email · Individual wishes are never displayed
    </div>
      </aside>
  </div>
`

  const t = (k: string) => I18N[lang][k] ?? k
  const status = $('#status') as HTMLDivElement
  const statusLines: string[] = []
  const setStatus = (msg: string) => {
    const m = msg.trim()
    if (!m) {
      statusLines.length = 0
      status.textContent = ''
      return
    }
    // Keep last ~6 lines so debug messages don't get overwritten by later status updates.
    statusLines.push(m)
    while (statusLines.length > 6) statusLines.shift()
    status.textContent = statusLines.join('\n')
  }

  const renderTexts = () => {
    $('#title').textContent = t('title')
    $('#subtitle').textContent = t('subtitle')
    $('#langLabel').textContent = t('language')
    $('#ornLabel').textContent = t('ornament')
    $('#wishLabel').textContent = t('wish')
    ;($('#hangBtn') as HTMLButtonElement).textContent = t('hang')
    ;($('#downloadBtn') as HTMLButtonElement).textContent = t('download')
    ;($('#camLabel') as HTMLDivElement).textContent = t('camera')
    ;($('#camCityBtn') as HTMLButtonElement).textContent = t('camCity')
    ;($('#camTreeBtn') as HTMLButtonElement).textContent = t('camTree')
    ;($('#revealBtn') as HTMLButtonElement).textContent = t('reveal')

    ;($('#langFr') as HTMLButtonElement).classList.toggle('active', lang === 'fr')
    ;($('#langEn') as HTMLButtonElement).classList.toggle('active', lang === 'en')
  }

  const renderOrnaments = () => {
    const grid = $('#ornGrid')
    grid.innerHTML = ''
    for (const orn of ORNAMENTS) {
      const btn = document.createElement('button')
      btn.className = 'orn'
      btn.dataset.id = orn.id
      btn.textContent = orn.label[lang]
      if (orn.id === selectedOrnament) btn.classList.add('active')
      btn.onclick = () => {
        selectedOrnament = orn.id
        renderOrnaments()
      }
      grid.appendChild(btn)
    }
  }

  ;($('#langFr') as HTMLButtonElement).onclick = () => {
    lang = 'fr'
    localStorage.setItem('lang', lang)
    renderTexts()
    renderOrnaments()
  }
  ;($('#langEn') as HTMLButtonElement).onclick = () => {
    lang = 'en'
    localStorage.setItem('lang', lang)
    renderTexts()
    renderOrnaments()
  }

  renderTexts()
  renderOrnaments()

  // Cesium init
  if (!env.ionToken) {
    setStatus('Missing VITE_CESIUM_ION_TOKEN (check Vercel env vars + redeploy)')
    return
  }
  const has3DTiles = Number.isFinite(env.photorealisticAssetId) && env.photorealisticAssetId > 0
  const hasImagery = Number.isFinite(env.imageryAssetId) && env.imageryAssetId > 0
  if (!has3DTiles && !hasImagery) {
    setStatus('Missing VITE_ION_PHOTOREALISTIC_ASSET_ID (3D Tiles) or VITE_ION_IMAGERY_ASSET_ID (Imagery)')
    return
  }

  Ion.defaultAccessToken = env.ionToken

  const viewer = new Viewer('cesium', {
    animation: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    shouldAnimate: true,
  })

  viewer.scene.globe.show = !has3DTiles
  if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true
  viewer.scene.backgroundColor = undefined as any

  if (has3DTiles) {
    try {
      const tileset = await Cesium3DTileset.fromIonAssetId(env.photorealisticAssetId)
      viewer.scene.primitives.add(tileset)
    } catch (e) {
      // Typical causes: wrong asset id, token missing scopes, token revoked, or value contains quotes.
      viewer.scene.globe.show = true
      setStatus(
        `Failed to load Photorealistic 3D Tiles. Check VITE_CESIUM_ION_TOKEN + VITE_ION_PHOTOREALISTIC_ASSET_ID. Details: ${
          e instanceof Error ? e.message : String(e)
        }`,
      )
    }
  } else if (hasImagery) {
    try {
      // Clean default imagery (Bing) and use the provided ion imagery asset.
      viewer.imageryLayers.removeAll()
      const provider = await IonImageryProvider.fromAssetId(env.imageryAssetId)
      viewer.imageryLayers.addImageryProvider(provider)
    } catch (e) {
      setStatus(
        `Failed to load ion imagery. Check VITE_CESIUM_ION_TOKEN + VITE_ION_IMAGERY_ASSET_ID. Details: ${
          e instanceof Error ? e.message : String(e)
        }`,
      )
    }
  }

  // Helper: sample "ground" height from rendered photorealistic 3D tiles.
  // In cities you can have stacked surfaces (roof/terrace/ground). We sample a small grid and take the MIN height
  // to bias toward the ground.
  async function sampleGroundHeightMinMeters(lonDeg: number, latDeg: number, radiusM: number): Promise<number | null> {
    const center = Cartesian3.fromDegrees(lonDeg, latDeg, 0)
    const enu = Transforms.eastNorthUpToFixedFrame(center)
    const offsets = [-radiusM, 0, radiusM]
    const cartos: Cartographic[] = []

    for (const e of offsets) {
      for (const n of offsets) {
        const p = Matrix4.multiplyByPoint(enu, new Cartesian3(e, n, 0), new Cartesian3())
        const c = viewer.scene.globe.ellipsoid.cartesianToCartographic(p)
        if (c) {
          c.height = 0
          cartos.push(c)
        }
      }
    }

    try {
      const updated = await viewer.scene.sampleHeightMostDetailed(cartos)
      const heights = updated
        .map((c) => c?.height)
        .filter((h): h is number => typeof h === 'number' && Number.isFinite(h))
      if (!heights.length) return null
      return Math.min(...heights)
    } catch {
      return null
    }
  }

  async function sampleGroundHeightMinForPoints(
    pointsLonLat: Array<{ lon: number; lat: number }>,
    radiusM: number,
  ): Promise<Array<number | null>> {
    if (!pointsLonLat.length) return []
    const offsets = [-radiusM, 0, radiusM]
    const cartos: Cartographic[] = []
    const meta: Array<{ pointIdx: number; sampleIdx: number }> = []

    for (let i = 0; i < pointsLonLat.length; i++) {
      const { lon, lat } = pointsLonLat[i]
      const center = Cartesian3.fromDegrees(lon, lat, 0)
      const enu = Transforms.eastNorthUpToFixedFrame(center)
      let sampleIdx = 0
      for (const e of offsets) {
        for (const n of offsets) {
          const p = Matrix4.multiplyByPoint(enu, new Cartesian3(e, n, 0), new Cartesian3())
          const c = viewer.scene.globe.ellipsoid.cartesianToCartographic(p)
          if (c) {
            c.height = 0
            cartos.push(c)
            meta.push({ pointIdx: i, sampleIdx })
          }
          sampleIdx++
        }
      }
    }

    const result = new Array<number | null>(pointsLonLat.length).fill(null)
    const mins = new Array<number>(pointsLonLat.length).fill(Number.POSITIVE_INFINITY)

    try {
      const updated = await viewer.scene.sampleHeightMostDetailed(cartos)
      for (let i = 0; i < updated.length; i++) {
        const h = updated[i]?.height
        if (typeof h === 'number' && Number.isFinite(h)) {
          const idx = meta[i]?.pointIdx
          if (idx != null) mins[idx] = Math.min(mins[idx], h)
        }
      }
      for (let i = 0; i < mins.length; i++) {
        if (mins[i] !== Number.POSITIVE_INFINITY) result[i] = mins[i]
      }
      return result
    } catch {
      return result
    }
  }

  // Tree (placeholder: you will drop models into /public/models/)
  const hasIonTree = Number.isFinite(env.ionTreeAssetId) && env.ionTreeAssetId > 0
  const hasIonTreeGeojson = Number.isFinite(env.ionTreeGeojsonAssetId) && env.ionTreeGeojsonAssetId > 0
  const treeUrl = '/models/tree.glb'

  // Default: L’Écusson, 34000 Montpellier
  let treeLatDeg = Number.isFinite(env.treeLat) ? env.treeLat : 43.61136111111111 // 43°36'40.9"N
  let treeLonDeg = Number.isFinite(env.treeLon) ? env.treeLon : 3.8695555555555557 // 3°52'10.4"E

  // If the user accidentally swapped lat/lon in env vars, auto-fix using a Montpellier bounding box heuristic.
  // Correct: lat ≈ 43-44, lon ≈ 3-4. Swapped commonly becomes lat ≈ 3-4, lon ≈ 43-44 (ocean).
  const inMontpellier = (lat: number, lon: number) => lat >= 43 && lat <= 44 && lon >= 3 && lon <= 4
  if (!inMontpellier(treeLatDeg, treeLonDeg) && inMontpellier(treeLonDeg, treeLatDeg)) {
    ;[treeLatDeg, treeLonDeg] = [treeLonDeg, treeLatDeg]
    setStatus('Tree coordinates looked swapped; auto-corrected (lat/lon).')
  }

  // If still invalid, place the tree at Peyrou by default.
  if (!inMontpellier(treeLatDeg, treeLonDeg)) {
    treeLatDeg = 43.6119
    treeLonDeg = 3.8730
    setStatus('Tree coordinates invalid; placing tree at Peyrou defaults.')
  }

  // Optional: load tree location from an ion-hosted GeoJSON point.
  // This is great to avoid manual lat/lon and keep placement centralized in ion.
  if (hasIonTreeGeojson) {
    try {
      const geo = await fetchIonGeoJson(env.ionTreeGeojsonAssetId)
      const pts = extractLonLatPointsFromGeoJson(geo)
      const first = pts[0]
      if (first) {
        treeLonDeg = first.lon
        treeLatDeg = first.lat
        if (!inMontpellier(treeLatDeg, treeLonDeg) && inMontpellier(treeLonDeg, treeLatDeg)) {
          ;[treeLatDeg, treeLonDeg] = [treeLonDeg, treeLatDeg]
        }
        if (!inMontpellier(treeLatDeg, treeLonDeg)) {
          treeLatDeg = 43.6119
          treeLonDeg = 3.8730
          setStatus('Ion GeoJSON coords invalid; falling back to Peyrou.')
        } else {
          setStatus(`Tree location loaded from ion GeoJSON${first.note ? ` (${first.note})` : ''}.`)
        }
      } else setStatus('Ion GeoJSON loaded but no Point found; using env/default coordinates.')
    } catch (e) {
      setStatus(`Failed to load ion GeoJSON for tree location. Details: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Camera focus (defaults to the tree location)
  // You can override via Vercel env vars if needed.
  let camLatDeg = Number.isFinite(env.cameraLat) ? env.cameraLat : treeLatDeg
  let camLonDeg = Number.isFinite(env.cameraLon) ? env.cameraLon : treeLonDeg

  // Auto-fix swapped camera coords (common mistake in env vars).
  const inMontpellierCam = (lat: number, lon: number) => lat >= 43 && lat <= 44 && lon >= 3 && lon <= 4
  if (!inMontpellierCam(camLatDeg, camLonDeg) && inMontpellierCam(camLonDeg, camLatDeg)) {
    ;[camLatDeg, camLonDeg] = [camLonDeg, camLatDeg]
    setStatus('Camera coordinates looked swapped; auto-corrected (lat/lon).')
  }

  // If still invalid, fall back to the tree location.
  if (!inMontpellierCam(camLatDeg, camLonDeg)) {
    camLatDeg = treeLatDeg
    camLonDeg = treeLonDeg
    setStatus('Camera coordinates invalid; falling back to tree location.')
  }

  const controller = viewer.scene.screenSpaceCameraController
  controller.enableLook = true
  controller.enableRotate = true
  controller.enableTilt = true
  controller.enableZoom = true
  controller.enableTranslate = true

  // Tree height:
  // - If photorealistic 3D tiles are enabled, compute the ground height at (lon,lat) and add a small offset.
  // - Otherwise, fall back to the legacy "absolute height above ellipsoid" behavior.
  const groundOffsetM = Number.isFinite(env.treeGroundOffsetM)
    ? env.treeGroundOffsetM
    : Number.isFinite(env.treeHeight)
      ? env.treeHeight // fallback: treat VITE_TREE_HEIGHT as offset if the new var isn't provided
      : 1.5
  const sampleRadiusM = Number.isFinite(env.treeGroundSampleRadiusM) ? env.treeGroundSampleRadiusM : 6

  let treeAltM: number
  if (has3DTiles) {
    const ground = await sampleGroundHeightMinMeters(treeLonDeg, treeLatDeg, sampleRadiusM)
    if (ground != null) {
      treeAltM = ground + groundOffsetM
      setStatus(`Tree grounded (min height) +${groundOffsetM.toFixed(2)}m offset.`)
    } else {
      treeAltM = 25
      setStatus('Failed to sample ground height; using fallback altitude 25m.')
    }
  } else {
    treeAltM = Number.isFinite(env.treeHeight) ? env.treeHeight : 25
  }

  const treeScale = Number.isFinite(env.treeScale) ? env.treeScale : 2.0
  const headingDeg = Number.isFinite(env.treeHeadingDeg) ? env.treeHeadingDeg : 0

  const treePosition = Cartesian3.fromDegrees(treeLonDeg, treeLatDeg, treeAltM)
  const treeHeading = CesiumMath.toRadians(headingDeg)
  const treePitch = 0
  const treeRoll = 0
  const treeHPR = Transforms.headingPitchRollQuaternion(treePosition, new HeadingPitchRoll(treeHeading, treePitch, treeRoll))
  const treeModelMatrix = Matrix4.fromTranslationQuaternionRotationScale(
    treePosition,
    treeHPR,
    new Cartesian3(treeScale, treeScale, treeScale),
    new Matrix4(),
  )

  let treeModel: Model | null = null
  try {
    treeModel = await Model.fromGltfAsync({
      url: hasIonTree ? await IonResource.fromAssetId(env.ionTreeAssetId) : treeUrl,
      modelMatrix: treeModelMatrix,
      scale: 1.0,
    })
    viewer.scene.primitives.add(treeModel)
  } catch (e) {
    setStatus(
      `Failed to load tree model. ${
        hasIonTree ? `Check VITE_ION_TREE_ASSET_ID (${env.ionTreeAssetId}).` : `Check that ${treeUrl} exists and is a valid GLB.`
      } Details: ${
        e instanceof Error ? e.message : String(e)
      }`,
    )
  }

  // Optional: extra trees (single model instanced at many points from ion GeoJSON)
  const hasExtraTrees = Number.isFinite(env.ionExtraTreesModelAssetId) && env.ionExtraTreesModelAssetId > 0
  const hasExtraTreesGeo = Number.isFinite(env.ionExtraTreesGeojsonAssetId) && env.ionExtraTreesGeojsonAssetId > 0
  if (hasExtraTrees && hasExtraTreesGeo) {
    try {
      const geo = await fetchIonGeoJson(env.ionExtraTreesGeojsonAssetId)
      const ptsRaw = extractLonLatPointsFromGeoJson(geo)
      const pts: Array<{ lon: number; lat: number }> = ptsRaw.map((p) => ({ lon: p.lon, lat: p.lat }))
      if (ptsRaw.length) {
        const first = ptsRaw[0]
        setStatus(
          `Extra trees GeoJSON parsed: ${ptsRaw.length} points (${summarizePointNotes(ptsRaw)}). First: lon=${first.lon.toFixed(
            6,
          )}, lat=${first.lat.toFixed(6)}${first.note ? ` (${first.note})` : ''}`,
        )
      } else {
        setStatus('Extra trees GeoJSON parsed: 0 points found.')
      }

      const limit = Number.isFinite(env.extraTreesLimit) ? Math.max(1, Math.min(500, env.extraTreesLimit)) : 80
      const usePts = pts.slice(0, limit)

      const scale = Number.isFinite(env.extraTreesScale) ? env.extraTreesScale : 1.2
      const offset = Number.isFinite(env.extraTreesGroundOffsetM) ? env.extraTreesGroundOffsetM : 0.8
      const radius = Number.isFinite(env.extraTreesSampleRadiusM) ? env.extraTreesSampleRadiusM : 4
      // Allow tuning without redeploy:
      // - URL params: ?extraEast=-3&extraNorth=2 (meters)
      // - URL params: ?extraScale=0.6
      // - localStorage: silentwish_extraEastM / silentwish_extraNorthM
      const baseOffEast = Number.isFinite(env.extraTreesOffsetEastM) ? env.extraTreesOffsetEastM : 0
      const baseOffNorth = Number.isFinite(env.extraTreesOffsetNorthM) ? env.extraTreesOffsetNorthM : 0
      let offEast =
        getNumberParam('extraEast') ?? getStoredNumber('silentwish_extraEastM') ?? baseOffEast
      let offNorth =
        getNumberParam('extraNorth') ?? getStoredNumber('silentwish_extraNorthM') ?? baseOffNorth
      let extraScale =
        getNumberParam('extraScale') ?? getStoredNumber('silentwish_extraScale') ?? scale

      // Apply optional ENU offset in meters before sampling heights (fixes systematic drift from reprojection).
      const computeShiftedPts = (eM: number, nM: number) => {
        const out: Array<{ lon: number; lat: number }> = []
        for (const { lon, lat } of usePts) {
          if (eM === 0 && nM === 0) {
            out.push({ lon, lat })
            continue
          }
          const base = Cartesian3.fromDegrees(lon, lat, 0)
          const enu = Transforms.eastNorthUpToFixedFrame(base)
          const shifted = Matrix4.multiplyByPoint(enu, new Cartesian3(eM, nM, 0), new Cartesian3())
          const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(shifted)
          if (carto) out.push({ lon: CesiumMath.toDegrees(carto.longitude), lat: CesiumMath.toDegrees(carto.latitude) })
          else out.push({ lon, lat })
        }
        return out
      }

      const shiftedPtsInitial = computeShiftedPts(offEast, offNorth)

      // Sample ground initially. If offsets change, we will re-sample (debounced) to keep trees on the surface.
      let heights =
        has3DTiles ? await sampleGroundHeightMinForPoints(shiftedPtsInitial, radius) : new Array(shiftedPtsInitial.length).fill(0)

      const url = await IonResource.fromAssetId(env.ionExtraTreesModelAssetId)
      const extraTreeEntities: string[] = []

      const renderExtraTrees = async (eM: number, nM: number, opts: { resample: boolean }) => {
        // Remove previous
        for (const id of extraTreeEntities) {
          const ent = viewer.entities.getById(id)
          if (ent) viewer.entities.remove(ent)
        }
        extraTreeEntities.length = 0

        const shiftedPts = computeShiftedPts(eM, nM)
        if (has3DTiles && opts.resample) {
          heights = await sampleGroundHeightMinForPoints(shiftedPts, radius)
        }
        for (let i = 0; i < shiftedPts.length; i++) {
          const { lon, lat } = shiftedPts[i]
          const h = heights[i]
          const alt = typeof h === 'number' && Number.isFinite(h) ? h + offset : 0 + offset
          const pos = Cartesian3.fromDegrees(lon, lat, alt)
          const id = `extraTree:${i}`
          viewer.entities.add({
            id,
            position: pos,
            model: {
              uri: url,
              scale: extraScale,
              minimumPixelSize: 24,
            },
          })
          extraTreeEntities.push(id)
        }
        setStoredNumber('silentwish_extraEastM', eM)
        setStoredNumber('silentwish_extraNorthM', nM)
        setStoredNumber('silentwish_extraScale', extraScale)
        setStatus(
          `Loaded ${shiftedPts.length} extra trees. Offset east=${eM.toFixed(1)}m north=${nM.toFixed(1)}m scale=${extraScale.toFixed(
            2,
          )}${opts.resample ? ' (resampled)' : ''}`,
        )
      }

      await renderExtraTrees(offEast, offNorth, { resample: true })

      // Keyboard tuning: arrows move the whole set.
      // - arrows: 1m
      // - shift+arrows: 5m
      // - alt+arrows: 0.2m
      // - g: force resample ground at current offset
      // - - / = : scale down / up (shift = bigger step)
      let resampleTimer: number | null = null
      const scheduleResample = () => {
        if (!has3DTiles) return
        if (resampleTimer != null) window.clearTimeout(resampleTimer)
        resampleTimer = window.setTimeout(() => {
          void renderExtraTrees(offEast, offNorth, { resample: true })
        }, 250)
      }

      window.addEventListener('keydown', (ev) => {
        if (ev.key === 'g' || ev.key === 'G') {
          void renderExtraTrees(offEast, offNorth, { resample: true })
          ev.preventDefault()
          return
        }

        // Scale tuning
        if (ev.key === '-' || ev.key === '_') {
          extraScale = Math.max(0.05, extraScale - (ev.shiftKey ? 0.1 : 0.05))
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }
        if (ev.key === '=' || ev.key === '+') {
          extraScale = Math.min(10, extraScale + (ev.shiftKey ? 0.1 : 0.05))
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }

        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) return
        const step = ev.shiftKey ? 5 : ev.altKey ? 0.2 : 1
        if (ev.key === 'ArrowLeft') offEast -= step
        if (ev.key === 'ArrowRight') offEast += step
        if (ev.key === 'ArrowUp') offNorth += step
        if (ev.key === 'ArrowDown') offNorth -= step
        void renderExtraTrees(offEast, offNorth, { resample: false })
        scheduleResample()
        ev.preventDefault()
      })
    } catch (e) {
      setStatus(`Failed to load extra trees from ion. Details: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Camera presets
  const flyToCity = async () => {
    await viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(camLonDeg, camLatDeg, 350),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-35), roll: 0 },
      duration: 1.2,
    })
  }
  const flyToTree = async () => {
    await viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(camLonDeg, camLatDeg, 120),
      orientation: { heading: CesiumMath.toRadians(25), pitch: CesiumMath.toRadians(-25), roll: 0 },
      duration: 1.0,
    })
  }
  ;($('#camCityBtn') as HTMLButtonElement).onclick = () => void flyToCity()
  ;($('#camTreeBtn') as HTMLButtonElement).onclick = () => void flyToTree()
  void flyToTree()

  // Local ornament placement (simple "drop near tree" for MVP)
  const localOrnaments: Model[] = []
  async function placeLocalOrnament(anchorIndex: number, ornamentId: OrnamentId) {
    const url = `/models/ornaments/${ornamentId}.glb`
    const angle = (anchorIndex % 360) * (Math.PI / 180)
    const radius = 6 + ((anchorIndex % 13) / 13) * 6
    const height = 18 + ((anchorIndex % 25) / 25) * 18

    const east = radius * Math.cos(angle)
    const north = radius * Math.sin(angle)

    // Approximate ENU offset around treePosition (good enough for "local feeling")
    const enu = Transforms.eastNorthUpToFixedFrame(treePosition)
    const offset = new Cartesian3(east, north, height)
    const m = Matrix4.multiplyByPoint(enu, offset, new Cartesian3())
    const modelMatrix = Matrix4.fromTranslation(m)
    try {
      const model = await Model.fromGltfAsync({ url, modelMatrix, scale: 1.0 })
      viewer.scene.primitives.add(model)
      localOrnaments.push(model)
    } catch {
      // fallback: no model available yet
    }
  }

  // Stats + Reveal
  async function fetchStats() {
    if (!env.supabaseUrl || !env.supabaseAnonKey) return
    try {
      const r = await fetch(`${env.supabaseUrl}/functions/v1/stats`, {
        headers: {
          Authorization: `Bearer ${env.supabaseAnonKey}`,
          apikey: env.supabaseAnonKey,
        },
      })
      if (!r.ok) return
      const j = (await r.json()) as { totalWishes: number }
      ;($('#totalBadge') as HTMLSpanElement).textContent = `${t('total')}: ${j.totalWishes}`
    } catch {
      // ignore
    }
  }
  void fetchStats()
  setInterval(fetchStats, 20_000)

  ;($('#revealBtn') as HTMLButtonElement).onclick = async () => {
    // Open the reveal page (it will handle "not yet" gating via the backend).
    window.open('/reveal.html', '_blank', 'noopener,noreferrer')
  }

  // Turnstile
  const hangBtn = $('#hangBtn') as HTMLButtonElement
  const downloadBtn = $('#downloadBtn') as HTMLButtonElement
  const wishInput = $('#wishInput') as HTMLTextAreaElement

  if (env.turnstileSiteKey) {
    await injectTurnstileScript()
    if (!window.turnstile) throw new Error('Turnstile unavailable')
    const box = $('#turnstileBox')
    turnstileWidgetId = window.turnstile.render(box, {
      sitekey: env.turnstileSiteKey,
      theme: 'dark',
      callback: (tok) => {
        turnstileToken = tok
      },
    })
  } else {
    setStatus('Missing VITE_TURNSTILE_SITE_KEY (captcha disabled)')
  }

  // Optional: click tree to refocus
  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction(() => void flyToTree(), ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

  hangBtn.onclick = async () => {
    const text = wishInput.value.trim()
    if (!text || (env.turnstileSiteKey && !turnstileToken)) {
      setStatus(t('errorMissing'))
      return
    }
    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      setStatus('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
      return
    }

    setStatus('')
    hangBtn.disabled = true
    hangBtn.textContent = t('hanging')
    downloadBtn.disabled = true

    try {
      const payload = {
        text,
        language: lang,
        ornament_type: selectedOrnament,
        client_id: clientId,
        turnstile_token: turnstileToken || null,
      }
      const r = await fetch(`${env.supabaseUrl}/functions/v1/wish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.supabaseAnonKey}`,
          apikey: env.supabaseAnonKey,
        },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = (await r.json()) as { ok: boolean; anchor_index: number }
      await placeLocalOrnament(j.anchor_index, selectedOrnament)
      void fetchStats()

      const stamp = formatLocalTimestamp()
      const caption = [
        'Montpellier – Sessiz Dilekler Ağacı – 2026',
        `Shared: ${stamp} (Montpellier)`,
      ]
      const dataUrl = await screenshotWithCaption(viewer, caption)
      downloadBtn.disabled = false
      downloadBtn.onclick = () => downloadDataUrl('silent-wish-montpellier.png', dataUrl)

      status.textContent = t('done')
      wishInput.value = ''
    } catch {
      setStatus(t('errorServer'))
    } finally {
      hangBtn.disabled = false
      hangBtn.textContent = t('hang')
      if (turnstileWidgetId && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId)
        turnstileToken = ''
      }
    }
  }
}

void init()
