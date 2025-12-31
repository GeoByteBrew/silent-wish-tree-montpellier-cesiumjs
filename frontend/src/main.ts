import './style.css'
import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Color,
  ConstantProperty,
  ConstantPositionProperty,
  HeadingPitchRoll,
  Ion,
  IonImageryProvider,
  IonResource,
  Math as CesiumMath,
  Matrix3,
  Matrix4,
  NearFarScalar,
  BillboardCollection,
  Model,
  Quaternion,
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
    postcard: 'Carte postale',
    total: 'Vœux au total',
    camera: 'Caméra',
    camCity: 'Promenade du Peyrou',
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
    postcard: 'Postcard',
    total: 'Total wishes',
    camera: 'Camera',
    camCity: 'Promenade du Peyrou',
    camTree: 'Tree',
    errorMissing: 'Please write a wish and complete the captcha.',
    errorServer: 'Server error. Try again.',
    reveal: 'Reveal',
    revealNotYet: 'Not yet. See you on Jan 6, 2026.',
    openLinkedIn: 'Share on LinkedIn',
  },
}

const envNum = (key: string): number => {
  const raw = (import.meta.env as any)?.[key]
  if (typeof raw !== 'string') return Number.NaN
  const s = raw.trim()
  if (!s) return Number.NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : Number.NaN
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
  cameraStartLon: envNum('VITE_CAMERA_START_LON'),
  cameraStartLat: envNum('VITE_CAMERA_START_LAT'),
  cameraStartHeight: envNum('VITE_CAMERA_START_HEIGHT'),
  cameraStartHeadingDeg: envNum('VITE_CAMERA_START_HEADING_DEG'),
  cameraStartPitchDeg: envNum('VITE_CAMERA_START_PITCH_DEG'),
  cameraStartRollDeg: envNum('VITE_CAMERA_START_ROLL_DEG'),

  // Optional: City camera preset (for the "City" button)
  cameraCityLon: envNum('VITE_CAMERA_CITY_LON'),
  cameraCityLat: envNum('VITE_CAMERA_CITY_LAT'),
  cameraCityHeight: envNum('VITE_CAMERA_CITY_HEIGHT'),
  cameraCityHeadingDeg: envNum('VITE_CAMERA_CITY_HEADING_DEG'),
  cameraCityPitchDeg: envNum('VITE_CAMERA_CITY_PITCH_DEG'),
  cameraCityRollDeg: envNum('VITE_CAMERA_CITY_ROLL_DEG'),
}

const ORNAMENTS = [
  { id: 'star', file: 'star', label: { fr: 'Étoile', en: 'Star' } },
  { id: 'red_ball', file: 'red_ball', label: { fr: 'Boule rouge', en: 'Red ball' } },
  { id: 'gold_ball', file: 'gold_ball', label: { fr: 'Boule dorée', en: 'Gold ball' } },
  { id: 'silver_ball', file: 'silver_ball', label: { fr: 'Boule argentée', en: 'Silver ball' } },
  { id: 'blue_ball', file: 'blue_ball', label: { fr: 'Boule bleue', en: 'Blue ball' } },
  { id: 'red_silver_ball', file: 'red_silver_ball', label: { fr: 'Boule rouge/argent', en: 'Red/silver ball' } },
  { id: 'blue_ball_snw', file: 'blue_ball_snw', label: { fr: 'Boule bleue (neige)', en: 'Blue ball (snow)' } },
  { id: 'heart', file: 'heart', label: { fr: 'Cœur', en: 'Heart' } },
  { id: 'snow', file: 'snow', label: { fr: 'Flocon', en: 'Snowflake' } },
  { id: 'tree_petit', file: 'tree_petit', label: { fr: 'Petit sapin', en: 'Small tree' } },
] as const

type OrnamentId = (typeof ORNAMENTS)[number]['id']
const ORNAMENT_ID_SET = new Set<string>(ORNAMENTS.map((o) => o.id))
function isOrnamentId(v: string): v is OrnamentId {
  return ORNAMENT_ID_SET.has(v)
}

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

async function screenshotWithCaption(
  viewer: Viewer,
  captionLines: string[],
  opts?: { watermark?: string; frameLang?: 'fr' | 'en' },
): Promise<string> {
  // Ensure custom fonts are loaded before rendering canvas text (especially on first use).
  try {
    if (document?.fonts?.load) {
      await document.fonts.load('700 44px Tangerine')
    }
  } catch {
    // ignore
  }

  // Optional postcard frame overlay (transparent center)
  const loadFrame = async (lang: 'fr' | 'en'): Promise<HTMLImageElement | null> => {
    const src = lang === 'fr' ? '/frames/Frame_FR.png' : '/frames/Frame_EN.png'
    try {
      const img = new Image()
      img.decoding = 'async'
      img.src = src
      // decode() is supported in modern browsers; fall back to onload
      if ('decode' in img) await (img as any).decode()
      else {
        await new Promise<void>((resolve, reject) => {
          ;(img as HTMLImageElement).onload = () => resolve()
          ;(img as HTMLImageElement).onerror = () => reject(new Error(`Failed to load frame: ${src}`))
        })
      }
      return img
    } catch {
      return null
    }
  }

  // ensure a frame is rendered
  viewer.render()
  const srcCanvas = viewer.scene.canvas
  const w = srcCanvas.width
  const h = srcCanvas.height
  const pad = Math.max(16, Math.floor(Math.min(w, h) * 0.02))
  const footerH = Math.max(90, Math.floor(h * 0.14))

  // If a postcard frame is requested, output a single image sized like the Cesium canvas
  // and overlay the frame PNG (with transparent center) on top of the render.
  if (opts?.frameLang) {
    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    const ctx = out.getContext('2d')
    if (!ctx) throw new Error('No 2D context')
    ctx.drawImage(srcCanvas, 0, 0, w, h)
    const frame = await loadFrame(opts.frameLang)
    if (frame) ctx.drawImage(frame, 0, 0, w, h)
    return out.toDataURL('image/png')
  }

  const out = document.createElement('canvas')
  out.width = w
  out.height = h + footerH
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('No 2D context')

  // --- "Memory frame" ---
  // paper background
  ctx.fillStyle = '#0b0f14'
  ctx.fillRect(0, 0, out.width, out.height)
  // subtle border frame
  const framePad = Math.max(14, Math.floor(Math.min(w, h) * 0.018))
  ctx.fillStyle = '#f7f0e6'
  ctx.fillRect(framePad, framePad, w - framePad * 2, h - framePad * 2)
  // inner shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.20)'
  ctx.lineWidth = 2
  ctx.strokeRect(framePad + 1, framePad + 1, w - framePad * 2 - 2, h - framePad * 2 - 2)

  // draw 3D
  ctx.drawImage(srcCanvas, framePad, framePad, w - framePad * 2, h - framePad * 2)

  // footer
  ctx.fillStyle = '#0b0f14'
  ctx.fillRect(0, h, w, footerH)
  // footer top accent line
  const grad = ctx.createLinearGradient(0, h, w, h)
  grad.addColorStop(0, 'rgba(103,231,255,0.75)')
  grad.addColorStop(1, 'rgba(255,196,103,0.65)')
  ctx.fillStyle = grad
  ctx.fillRect(0, h, w, 3)

  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'

  // First line in Tangerine (memory vibe), rest in sans for readability.
  const title = captionLines[0] ?? ''
  const rest = captionLines.slice(1, 3)
  const titleSize = Math.max(34, Math.floor(footerH * 0.44))
  const bodySize = Math.max(12, Math.floor(footerH * 0.165))
  const titleLineH = Math.max(30, Math.floor(footerH * 0.42))
  const bodyLineH = Math.max(15, Math.floor(footerH * 0.22))
  let y = h + pad

  ctx.font = `700 ${titleSize}px Tangerine, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  ctx.fillText(title, pad, y)
  const yAfterTitle = y + titleLineH

  // Put the secondary lines closer to the bottom of the footer for a cleaner "card" look.
  const footerBottom = h + footerH
  const desiredBodyTop = footerBottom - pad - bodyLineH * Math.max(1, rest.length)
  const yBody = Math.max(yAfterTitle + Math.floor(bodyLineH * 0.2), desiredBodyTop)

  ctx.globalAlpha = 0.78
  ctx.font = `400 ${bodySize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  y = yBody
  for (const line of rest) {
    ctx.fillText(line, pad, y)
    y += bodyLineH
  }
  ctx.globalAlpha = 1
  // small watermark on the right
  ctx.globalAlpha = 0.65
  ctx.font = `400 ${Math.max(11, Math.floor(footerH * 0.145))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  const wm = opts?.watermark ?? 'GeoByteBrew · Montpellier'
  const tw = ctx.measureText(wm).width
  ctx.fillText(wm, w - pad - tw, h + pad)
  ctx.globalAlpha = 1

  // Subtle edge frame (doesn't cover the image)
  const fp = Math.max(10, Math.floor(Math.min(w, h) * 0.012))
  const rx = Math.max(14, Math.floor(Math.min(w, h) * 0.018))
  ctx.save()
  // soft vignette
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.15, w * 0.5, h * 0.45, Math.max(w, h) * 0.7)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
  // thin rounded border (gradient)
  const strokeGrad = ctx.createLinearGradient(0, 0, w, h)
  strokeGrad.addColorStop(0, 'rgba(103,231,255,0.55)')
  strokeGrad.addColorStop(1, 'rgba(255,196,103,0.45)')
  ctx.strokeStyle = strokeGrad
  ctx.lineWidth = Math.max(2, Math.floor(fp * 0.22))
  ctx.beginPath()
  // rounded rect path
  const x0 = fp
  const y0 = fp
  const x1 = w - fp
  const y1 = h - fp
  const r2 = Math.min(rx, (x1 - x0) / 2, (y1 - y0) / 2)
  ctx.moveTo(x0 + r2, y0)
  ctx.lineTo(x1 - r2, y0)
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r2)
  ctx.lineTo(x1, y1 - r2)
  ctx.quadraticCurveTo(x1, y1, x1 - r2, y1)
  ctx.lineTo(x0 + r2, y1)
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r2)
  ctx.lineTo(x0, y0 + r2)
  ctx.quadraticCurveTo(x0, y0, x0 + r2, y0)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()

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

function getStringParam(name: string): string | null {
  const v = new URLSearchParams(window.location.search).get(name)
  if (v == null) return null
  const s = v.trim()
  return s ? s : null
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

function getStoredJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    if (!s) return fallback
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

function setStoredJson(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v))
}

type LayoutV1 = {
  version: 1
  savedAt: string
  mainTree?: {
    eastM: number
    northM: number
    scale: number
    headingDeg: number
    groundTrimM: number
  }
  extraTrees?: {
    globals: {
      eastM: number
      northM: number
      scale: number
      groundTrimM: number
    }
    perTree: {
      dz: Record<string, number>
      scaleMult: Record<string, number>
      xy: Record<string, { e: number; n: number }>
    }
  }
}

function safeNumber(n: unknown, fallback = 0): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ---- GLB anchor helpers (read Orn.* / Light.* node names exported from Blender) ----
type GltfV2 = {
  scene?: number
  scenes?: Array<{ nodes?: number[] }>
  nodes?: Array<{
    name?: string
    children?: number[]
    matrix?: number[]
    translation?: number[]
    rotation?: number[]
    scale?: number[]
  }>
}

function matrixFromGltfNode(node: NonNullable<GltfV2['nodes']>[number]): Matrix4 {
  if (node.matrix && node.matrix.length === 16) {
    // glTF matrices are column-major, same as Cesium Matrix4 array layout.
    return Matrix4.fromArray(node.matrix as number[], 0, new Matrix4())
  }
  const t = node.translation?.length === 3 ? new Cartesian3(node.translation[0], node.translation[1], node.translation[2]) : Cartesian3.ZERO
  const r =
    node.rotation?.length === 4
      ? new Quaternion(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3])
      : Quaternion.IDENTITY
  const s = node.scale?.length === 3 ? new Cartesian3(node.scale[0], node.scale[1], node.scale[2]) : new Cartesian3(1, 1, 1)
  return Matrix4.fromTranslationQuaternionRotationScale(t, r, s, new Matrix4())
}

async function fetchGltfJsonFromGlb(glbUrl: string): Promise<GltfV2> {
  const res = await fetch(glbUrl, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  const dv = new DataView(buf)
  // GLB header: magic(4) version(4) length(4)
  const magic = dv.getUint32(0, true)
  // 0x46546C67 == 'glTF'
  if (magic !== 0x46546c67) throw new Error('Not a GLB (bad magic)')
  let off = 12
  while (off + 8 <= dv.byteLength) {
    const chunkLen = dv.getUint32(off, true)
    const chunkType = dv.getUint32(off + 4, true)
    off += 8
    if (off + chunkLen > dv.byteLength) break
    // JSON chunk type: 0x4E4F534A == 'JSON'
    if (chunkType === 0x4e4f534a) {
      const bytes = new Uint8Array(buf, off, chunkLen)
      const text = new TextDecoder('utf-8').decode(bytes)
      return JSON.parse(text) as GltfV2
    }
    off += chunkLen
  }
  throw new Error('GLB JSON chunk not found')
}

async function loadAnchorNames(glbUrl: string, prefix: string): Promise<string[]> {
  const gltf = await fetchGltfJsonFromGlb(glbUrl)
  const nodes = gltf.nodes ?? []
  if (!nodes.length) return []

  const sceneIndex = typeof gltf.scene === 'number' ? gltf.scene : 0
  const roots = gltf.scenes?.[sceneIndex]?.nodes ?? []
  const results: string[] = []

  const walk = (idx: number, parent: Matrix4) => {
    const n = nodes[idx]
    if (!n) return
    const local = matrixFromGltfNode(n)
    const world = Matrix4.multiply(parent, local, new Matrix4())
    if (n.name && n.name.startsWith(prefix)) {
      // We only return the name. The actual placement uses Cesium runtime node transforms (computedTransform)
      // to match the rendered model exactly.
      results.push(n.name)
    }
    const kids = n.children ?? []
    for (const k of kids) walk(k, world)
  }

  const I = Matrix4.IDENTITY
  for (const r of roots) walk(r, I)

  // Stable ordering: Orn.0000... so modulo mapping stays consistent.
  results.sort((a, b) => a.localeCompare(b, 'en'))
  return results
}

async function init() {
  let lang: Lang = (localStorage.getItem('lang') as Lang) || 'fr'
  let selectedOrnament: OrnamentId = 'star'
  let turnstileToken = ''
  let turnstileWidgetId: string | null = null

  const clientId = createClientId()
  const DEBUG_MODE =
    new URLSearchParams(window.location.search).get('debug') === '1' || window.location.hostname === 'localhost'
  let defaultLayout: LayoutV1 | null = null

  $('#app').innerHTML = `
    <div class="layout">
      <div class="scene">
        <div id="cesium"></div>
        <div class="loading" id="loadingOverlay" aria-live="polite">
          <div class="spinner" aria-hidden="true"></div>
          <div class="loading-title">Loading Montpellier…</div>
          <div class="loading-sub" id="loadingText">Starting…</div>
    </div>
        <div class="hud">
          <div class="hud-row">
            <span class="badge" id="totalBadge">…</span>
            <button class="ghost" id="revealBtn"></button>
          </div>
        </div>
        <div class="credits" id="credits">
          3D: Google Photorealistic 3D Tiles via Cesium ion · Powered by CesiumJS
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
            <button class="ghost" id="newSessionBtn" type="button">New session</button>
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
          <div class="row">
            <button class="secondary" id="postcardBtn" type="button"></button>
          </div>
          ${
            DEBUG_MODE
              ? `<div class="row">
            <button class="secondary" id="saveStartViewBtn" type="button">Copy start view (env)</button>
            <button class="ghost" id="resetStartViewBtn" type="button">Clear local view</button>
          </div>`
              : ''
          }
        </div>

        ${
          DEBUG_MODE
            ? `<div class="section">
          <div class="label-row">
            <div class="label">Layout</div>
          </div>
          <div class="row">
            <button class="secondary" id="exportLayoutBtn" type="button">Export</button>
            <button class="secondary" id="importLayoutBtn" type="button">Import</button>
            <button class="secondary" id="loadDefaultLayoutBtn" type="button">Default</button>
            <button class="ghost" id="resetLayoutBtn" type="button">Reset</button>
            <button class="secondary" id="previewLightAnchorBtn" type="button">Preview Light anchor</button>
            <button class="ghost" id="clearLightPreviewBtn" type="button">Clear preview</button>
            <button class="secondary" id="attachAnchorBallsBtn" type="button">Attach anchor balls</button>
            <button class="ghost" id="clearAnchorBallsBtn" type="button">Clear balls</button>
          </div>
          <div class="muted" style="font-size:12px;margin-top:8px">
            Export creates a JSON of your current tweaks. Import applies it. Reset clears local tweaks.
          </div>
        </div>`
            : ''
        }

        <div class="footer muted">
          No account · No email · Individual wishes are never displayed
    </div>
      </aside>
  </div>
`

  const t = (k: string) => I18N[lang][k] ?? k
  const status = $('#status') as HTMLDivElement
  const loadingOverlay = $('#loadingOverlay') as HTMLDivElement
  const loadingText = $('#loadingText') as HTMLDivElement
  const setLoading = (on: boolean, msg?: string) => {
    loadingOverlay.style.display = on ? 'flex' : 'none'
    if (msg) loadingText.textContent = msg
  }
  setLoading(true, 'Preparing 3D scene…')
  const statusLines: string[] = []
  // Keyboard focus: ensure only one editing mode reacts to shared keys.
  let mainTreeSelected = false
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

  // --- Layout persistence helpers ---
  const LAYOUT_SOURCE_KEY = 'silentwish_layout_source' // 'default' | 'custom'
  const DEFAULT_LAYOUT_URL = '/layout/default-layout.json'
  const BACKUP_KEY = 'silentwish_layout_backup'

  const mainKey = {
    e: 'silentwish_mainTreeEastM',
    n: 'silentwish_mainTreeNorthM',
    s: 'silentwish_mainTreeScale',
    h: 'silentwish_mainTreeHeadingDeg',
    g: 'silentwish_mainTreeGroundTrimM',
  }

  const extraKeys = {
    east: 'silentwish_extraEastM',
    north: 'silentwish_extraNorthM',
    scale: 'silentwish_extraScale',
    ground: 'silentwish_extraGroundM',
    dz: 'silentwish_extraTreeDeltas',
    scaleMult: 'silentwish_extraTreeScale',
    xy: 'silentwish_extraTreeXY',
  }

  function collectLayout(): LayoutV1 {
    const d = defaultLayout
    const layout: LayoutV1 = {
      version: 1,
      savedAt: new Date().toISOString(),
      mainTree: {
        eastM: (DEBUG_MODE ? getStoredNumber(mainKey.e) : null) ?? d?.mainTree?.eastM ?? 0,
        northM: (DEBUG_MODE ? getStoredNumber(mainKey.n) : null) ?? d?.mainTree?.northM ?? 0,
        scale: (DEBUG_MODE ? getStoredNumber(mainKey.s) : null) ?? d?.mainTree?.scale ?? 2,
        headingDeg: (DEBUG_MODE ? getStoredNumber(mainKey.h) : null) ?? d?.mainTree?.headingDeg ?? 0,
        groundTrimM: (DEBUG_MODE ? getStoredNumber(mainKey.g) : null) ?? d?.mainTree?.groundTrimM ?? 0,
      },
      extraTrees: {
        globals: {
          eastM: (DEBUG_MODE ? getStoredNumber(extraKeys.east) : null) ?? d?.extraTrees?.globals?.eastM ?? 0,
          northM: (DEBUG_MODE ? getStoredNumber(extraKeys.north) : null) ?? d?.extraTrees?.globals?.northM ?? 0,
          scale: (DEBUG_MODE ? getStoredNumber(extraKeys.scale) : null) ?? d?.extraTrees?.globals?.scale ?? 1,
          groundTrimM: (DEBUG_MODE ? getStoredNumber(extraKeys.ground) : null) ?? d?.extraTrees?.globals?.groundTrimM ?? 0,
        },
        perTree: {
          dz: (DEBUG_MODE ? getStoredJson(extraKeys.dz, {}) : d?.extraTrees?.perTree?.dz ?? {}) ?? {},
          scaleMult: (DEBUG_MODE ? getStoredJson(extraKeys.scaleMult, {}) : d?.extraTrees?.perTree?.scaleMult ?? {}) ?? {},
          xy: (DEBUG_MODE ? getStoredJson(extraKeys.xy, {}) : d?.extraTrees?.perTree?.xy ?? {}) ?? {},
        },
      },
    }
    return layout
  }

  function applyLayout(
    layout: LayoutV1,
    opts?: {
      source?: 'default' | 'custom'
    },
  ) {
    if (!layout || layout.version !== 1) throw new Error('Unsupported layout version')

    if (layout.mainTree) {
      setStoredNumber(mainKey.e, safeNumber(layout.mainTree.eastM))
      setStoredNumber(mainKey.n, safeNumber(layout.mainTree.northM))
      setStoredNumber(mainKey.s, safeNumber(layout.mainTree.scale, 2))
      setStoredNumber(mainKey.h, safeNumber(layout.mainTree.headingDeg))
      setStoredNumber(mainKey.g, safeNumber(layout.mainTree.groundTrimM))
    }

    if (layout.extraTrees) {
      setStoredNumber(extraKeys.east, safeNumber(layout.extraTrees.globals.eastM))
      setStoredNumber(extraKeys.north, safeNumber(layout.extraTrees.globals.northM))
      setStoredNumber(extraKeys.scale, safeNumber(layout.extraTrees.globals.scale, 1))
      setStoredNumber(extraKeys.ground, safeNumber(layout.extraTrees.globals.groundTrimM))
      setStoredJson(extraKeys.dz, layout.extraTrees.perTree.dz ?? {})
      setStoredJson(extraKeys.scaleMult, layout.extraTrees.perTree.scaleMult ?? {})
      setStoredJson(extraKeys.xy, layout.extraTrees.perTree.xy ?? {})
    }

    if (opts?.source) localStorage.setItem(LAYOUT_SOURCE_KEY, opts.source)
  }

  function resetLocalLayout() {
    for (const k of Object.values(mainKey)) localStorage.removeItem(k)
    for (const k of Object.values(extraKeys)) localStorage.removeItem(k)
    localStorage.removeItem(LAYOUT_SOURCE_KEY)
  }

  async function loadDefaultLayout(): Promise<LayoutV1 | null> {
    try {
      const r = await fetch(DEFAULT_LAYOUT_URL, { cache: 'no-store' })
      if (!r.ok) {
        setStatus(`Default layout fetch failed (HTTP ${r.status}).`)
        return null
      }
      const j = (await r.json()) as LayoutV1
      if (j?.version !== 1) {
        setStatus('Default layout invalid (wrong version).')
        return null
      }
      return j
    } catch (e) {
      setStatus(`Default layout fetch failed: ${e instanceof Error ? e.message : String(e)}`)
      return null
    }
  }

  async function maybeApplyDefaultLayout() {
    const force = new URLSearchParams(window.location.search).get('layout') === 'default'
    // Custom layouts are debug-only. In normal mode, always use the shared default baseline.
    const source = DEBUG_MODE ? ((localStorage.getItem(LAYOUT_SOURCE_KEY) as 'default' | 'custom' | null) ?? 'default') : 'default'
    // If user explicitly imported a custom layout, keep it unless forced.
    if (!force && source === 'custom') return
    try {
      const j = await loadDefaultLayout()
      if (!j) return
      // Shared baseline for everyone:
      // - We keep it in-memory (not localStorage) so different browsers always see the same scene.
      defaultLayout = j
      setStatus(`Default layout baseline loaded (${j.savedAt}).${DEBUG_MODE ? ' (debug mode)' : ''}`)
    } catch {
      // ignore
    }
  }

  if (DEBUG_MODE) {
    // Wire buttons (debug only)
    ;($('#exportLayoutBtn') as HTMLButtonElement).onclick = async () => {
      const layout = collectLayout()
      const json = JSON.stringify(layout, null, 2)
      try {
        await navigator.clipboard.writeText(json)
        setStatus('Layout copied to clipboard and downloaded.')
      } catch {
        setStatus('Layout downloaded (clipboard unavailable).')
      }
      downloadText('silent-wish-layout.json', json)
    }
    ;($('#importLayoutBtn') as HTMLButtonElement).onclick = async () => {
      const txt = prompt('Paste layout JSON here:')
      if (!txt) return
      try {
        const j = JSON.parse(txt) as LayoutV1
        // In debug mode, importing a custom layout becomes your local override.
        try {
          setStoredJson(BACKUP_KEY, collectLayout())
        } catch {
          // ignore
        }
        applyLayout(j, { source: 'custom' })
        setStatus('Layout imported (local). Reloading…')
        location.reload()
      } catch (e) {
        setStatus(`Import failed: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    ;($('#resetLayoutBtn') as HTMLButtonElement).onclick = async () => {
      if (!confirm('Reset all local tree tweaks (main + extra)?')) return
      resetLocalLayout()
      setStatus('Local layout reset. Reloading…')
      location.reload()
    }

    ;($('#loadDefaultLayoutBtn') as HTMLButtonElement).onclick = async () => {
      if (!confirm('Apply the shared default layout (clears your local tweaks)?')) return
      resetLocalLayout()
      localStorage.setItem(LAYOUT_SOURCE_KEY, 'default')
      setStatus('Default layout selected. Reloading…')
      location.reload()
    }

    // Expose a quick restore for debug iterations.
    const restoreBtn = document.createElement('button')
    restoreBtn.className = 'secondary'
    restoreBtn.type = 'button'
    restoreBtn.textContent = 'Restore'
    restoreBtn.onclick = () => {
      const b = getStoredJson<LayoutV1 | null>(BACKUP_KEY, null)
      if (!b) {
        setStatus('No backup found.')
        return
      }
      try {
        applyLayout(b, { source: 'custom' })
        setStatus('Backup restored. Reloading…')
        location.reload()
      } catch (e) {
        setStatus(`Restore failed: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    const resetBtn = $('#resetLayoutBtn')
    resetBtn.parentElement?.insertBefore(restoreBtn, resetBtn.nextSibling)
  }

  // Apply default layout if present and user layout not set (or ?layout=default)
  await maybeApplyDefaultLayout()

  const renderTexts = () => {
    $('#title').textContent = t('title')
    $('#subtitle').textContent = t('subtitle')
    $('#langLabel').textContent = t('language')
    $('#ornLabel').textContent = t('ornament')
    $('#wishLabel').textContent = t('wish')
    ;($('#hangBtn') as HTMLButtonElement).textContent = t('hang')
    ;($('#downloadBtn') as HTMLButtonElement).textContent = t('download')
    ;($('#postcardBtn') as HTMLButtonElement).textContent = t('postcard')
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

  // We'll set this once the tree is loaded; used for camera limits + debug.
  let treeModel: Model | null = null

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

  // Camera roam limit: keep the camera within a horizontal radius around the main tree.
  // Requested: 350m.
  const CAMERA_LIMIT_RADIUS_M = 350
  const scratchCenter = new Cartesian3()
  const scratchEnu = new Matrix4()
  const scratchInvEnu = new Matrix4()
  const scratchCamEnu = new Cartesian3()
  const scratchClampedEnu = new Cartesian3()
  const scratchClampedEcef = new Cartesian3()
  let farHide = false
  viewer.scene.preUpdate.addEventListener(() => {
    try {
      // Avoid fighting camera flights
      const camAny = viewer.camera as any
      if (camAny?._currentFlight) return

      // Dynamic center: actual tree model position if available, else camera focus point.
      const center = treeModel
        ? Matrix4.getTranslation(treeModel.modelMatrix, scratchCenter)
        : Cartesian3.fromDegrees(camLonDeg, camLatDeg, 0, viewer.scene.globe.ellipsoid, scratchCenter)

      Matrix4.clone(Transforms.eastNorthUpToFixedFrame(center), scratchEnu)
      Matrix4.inverse(scratchEnu, scratchInvEnu)

      // Camera position in ENU frame
      Matrix4.multiplyByPoint(scratchInvEnu, viewer.camera.position, scratchCamEnu)
      const e = scratchCamEnu.x
      const n = scratchCamEnu.y
      const h = scratchCamEnu.z
      const d = Math.hypot(e, n)
      if (!Number.isFinite(d)) return

      // Apply BOTH constraints every frame:
      // - horizontal roam limit (350m)
      // - height limit (<= 15m above the ENU origin) — robust even with 3D Tiles (no async sampling)
      let changed = false
      // horizontal clamp
      if (d > CAMERA_LIMIT_RADIUS_M) {
        const k = CAMERA_LIMIT_RADIUS_M / d
        scratchClampedEnu.x = e * k
        scratchClampedEnu.y = n * k
        scratchClampedEnu.z = h
        changed = true
      } else {
        scratchClampedEnu.x = e
        scratchClampedEnu.y = n
        scratchClampedEnu.z = h
      }

      // Camera height clamp:
      // With photorealistic 3D Tiles, globe.getHeight() is not a reliable “ground” (it can be null/0),
      // which can trap the camera “underground” inside tiles. Instead, clamp in the tree-local ENU frame:
      // - min: 1m above the ENU origin (tree center)
      // - max: 50m above the ENU origin
      const MAX_Z = 60
      if (scratchClampedEnu.z > MAX_Z) {
        scratchClampedEnu.z = MAX_Z
        changed = true
      }

      if (changed) {
        Matrix4.multiplyByPoint(scratchEnu, scratchClampedEnu, scratchClampedEcef)
        viewer.camera.position = Cartesian3.clone(scratchClampedEcef, viewer.camera.position)
      }

      // Visibility rule: if camera is >45m horizontally from the tree, hide ornaments and light halos.
      // Use horizontal distance (d) so small height changes don't flicker.
      const nextFar = d > 45
      if (nextFar !== farHide) {
        farHide = nextFar
        // Hide/show ornaments
        for (const o of localOrnaments) o.model.show = !farHide
        // Hide/show light halos (keep cores visible)
        for (const l of localLights) {
          if (!l.id.includes(':halo:')) continue
          const ent = viewer.entities.getById(l.id)
          if (ent?.point) (ent.point as any).show = new ConstantProperty(!farHide)
        }
        // Also hide debug anchor balls if they are attached
        for (const ent of viewer.entities.values) {
          const id = (ent as any)?.id
          if (typeof id === 'string' && id.startsWith('dbg:') && ent.point) {
            ;(ent.point as any).show = new ConstantProperty(!farHide)
          }
        }
      }
    } catch {
      // ignore
    }
  })

  viewer.scene.globe.show = !has3DTiles
  if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true
  viewer.scene.backgroundColor = undefined as any
  // Realistic day/night lighting + sky
  viewer.scene.globe.enableLighting = true
  if (viewer.scene.sun) viewer.scene.sun.show = true
  if (viewer.scene.moon) viewer.scene.moon.show = true

  // Camera start view:
  // - Production should be identical for every user: use env (or built-in defaults).
  // - Debug mode can copy the current camera to env vars for Vercel.
  type StartView = { lon: number; lat: number; height: number; heading: number; pitch: number; roll: number }
  const START_VIEW_KEY = 'silentwish_start_view_v1' // debug-only legacy local override

  const getLocalStartViewIfDebug = (): StartView | null => {
    if (!DEBUG_MODE) return null
    try {
      const raw = localStorage.getItem(START_VIEW_KEY)
      if (!raw) return null
      const j = JSON.parse(raw) as Partial<StartView>
      if (
        typeof j.lon !== 'number' ||
        typeof j.lat !== 'number' ||
        typeof j.height !== 'number' ||
        typeof j.heading !== 'number' ||
        typeof j.pitch !== 'number' ||
        typeof j.roll !== 'number'
      )
        return null
      return j as StartView
    } catch {
      return null
    }
  }

  const copyStartViewEnv = async () => {
    const carto = viewer.camera.positionCartographic
    const j: StartView = {
      lon: CesiumMath.toDegrees(carto.longitude),
      lat: CesiumMath.toDegrees(carto.latitude),
      height: carto.height,
      heading: CesiumMath.toDegrees(viewer.camera.heading),
      pitch: CesiumMath.toDegrees(viewer.camera.pitch),
      roll: CesiumMath.toDegrees(viewer.camera.roll),
    }
    const lines = [
      `VITE_CAMERA_START_LON=${j.lon}`,
      `VITE_CAMERA_START_LAT=${j.lat}`,
      `VITE_CAMERA_START_HEIGHT=${j.height}`,
      `VITE_CAMERA_START_HEADING_DEG=${j.heading}`,
      `VITE_CAMERA_START_PITCH_DEG=${j.pitch}`,
      `VITE_CAMERA_START_ROLL_DEG=${j.roll}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(lines)
      setStatus('Start view copied. Also downloading camera-start-view.env …')
    } catch {
      // Clipboard can fail due to permissions. We'll still provide it via a download.
      setStatus('Clipboard blocked. Downloading camera-start-view.env …')
    }
    downloadText('camera-start-view.env', lines)
    // Keep a local debug copy too (optional)
    localStorage.setItem(START_VIEW_KEY, JSON.stringify(j))
  }

  if (DEBUG_MODE) {
    const saveBtn = document.querySelector('#saveStartViewBtn') as HTMLButtonElement | null
    const resetBtn = document.querySelector('#resetStartViewBtn') as HTMLButtonElement | null
    if (saveBtn) saveBtn.onclick = () => void copyStartViewEnv()
    if (resetBtn)
      resetBtn.onclick = () => {
        localStorage.removeItem(START_VIEW_KEY)
        setStatus('Local debug start view cleared.')
      }
  }

  if (has3DTiles) {
    try {
      const tileset = await Cesium3DTileset.fromIonAssetId(env.photorealisticAssetId)
      viewer.scene.primitives.add(tileset)
      try {
        setLoading(true, 'Loading photorealistic Montpellier…')
        const rp = (tileset as any)?.readyPromise
        if (rp && typeof rp.then === 'function') await rp
      } catch {
        // ignore; we'll still proceed
      }
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

  // Shift a lon/lat coordinate by ENU meters (east/north) around that coordinate.
  // Useful for systematic drift correction and per-tree nudging without touching the original GeoJSON.
  const shiftLonLatByEnu = (lon: number, lat: number, eM: number, nM: number) => {
    if (eM === 0 && nM === 0) return { lon, lat }
    const base = Cartesian3.fromDegrees(lon, lat, 0)
    const enu = Transforms.eastNorthUpToFixedFrame(base)
    const shifted = Matrix4.multiplyByPoint(enu, new Cartesian3(eM, nM, 0), new Cartesian3())
    const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(shifted)
    if (!carto) return { lon, lat }
    return { lon: CesiumMath.toDegrees(carto.longitude), lat: CesiumMath.toDegrees(carto.latitude) }
  }

  // Tree model (served by Vercel from /public/models, with ion fallback)
  const hasIonTree = Number.isFinite(env.ionTreeAssetId) && env.ionTreeAssetId > 0
  const hasIonTreeGeojson = Number.isFinite(env.ionTreeGeojsonAssetId) && env.ionTreeGeojsonAssetId > 0
  // Single source of truth (avoid tree/tree2/tree3 confusion): always use tree3.glb.
  const treeUrlCandidates = ['/models/tree4.glb']

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

  // --- Lightweight clouds (Cesium-only) ---
  // We render a few subtle cloud billboards around the camera focus area.
  // No external assets required (we generate the sprite via canvas).
  const makeCloudDataUrl = (size = 256) => {
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')
    if (!ctx) return ''
    ctx.clearRect(0, 0, size, size)
    const blobs = [
      { x: 0.36, y: 0.55, r: 0.22 },
      { x: 0.52, y: 0.48, r: 0.28 },
      { x: 0.68, y: 0.58, r: 0.20 },
      { x: 0.50, y: 0.64, r: 0.26 },
    ]
    for (const b of blobs) {
      const x = b.x * size
      const y = b.y * size
      const r = b.r * size
      const g = ctx.createRadialGradient(x, y, r * 0.25, x, y, r)
      g.addColorStop(0, 'rgba(255,255,255,0.95)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // Fade edges
    ctx.globalCompositeOperation = 'destination-in'
    const fade = ctx.createRadialGradient(size * 0.5, size * 0.58, size * 0.2, size * 0.5, size * 0.58, size * 0.56)
    fade.addColorStop(0, 'rgba(255,255,255,0.95)')
    fade.addColorStop(1, 'rgba(255,255,255,0.0)')
    ctx.fillStyle = fade
    ctx.fillRect(0, 0, size, size)
    ctx.globalCompositeOperation = 'source-over'
    return c.toDataURL('image/png')
  }

  const cloudImg = makeCloudDataUrl(256)
  if (cloudImg) {
    const cloudCollection = new BillboardCollection()
    viewer.scene.primitives.add(cloudCollection)
    const center = Cartesian3.fromDegrees(camLonDeg, camLatDeg, 0)
    const enu = Transforms.eastNorthUpToFixedFrame(center)
    const state: Array<{ e: number; n: number; z: number; speed: number; wobble: number }> = []
    const count = 10
    for (let i = 0; i < count; i++) {
      const e = (Math.random() * 2 - 1) * 420
      const n = (Math.random() * 2 - 1) * 420
      const z = 160 + Math.random() * 140
      const speed = 0.5 + Math.random() * 1.1
      const wobble = Math.random() * Math.PI * 2
      state.push({ e, n, z, speed, wobble })
      const pos = Matrix4.multiplyByPoint(enu, new Cartesian3(e, n, z), new Cartesian3())
      cloudCollection.add({
        position: pos,
        image: cloudImg,
        width: 420 + Math.random() * 260,
        height: 240 + Math.random() * 160,
        color: Color.WHITE.withAlpha(0.14),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
    }
    const t0 = performance.now()
    viewer.scene.preUpdate.addEventListener(() => {
      const t = (performance.now() - t0) / 1000
      for (let i = 0; i < cloudCollection.length; i++) {
        const b = cloudCollection.get(i)
        const s = state[i]
        const e = s.e + t * s.speed * 6
        const n = s.n + Math.sin(t * 0.12 + s.wobble) * 18
        const ew = ((e + 700) % 1400) - 700
        b.position = Matrix4.multiplyByPoint(enu, new Cartesian3(ew, n, s.z), new Cartesian3())
      }
    })
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

  let loadedTreeUrl: string | null = null
  const prefer = new URLSearchParams(window.location.search).get('tree') // 'local' | 'ion' | null
  const tryLoadLocal = async () => {
    for (const candidate of treeUrlCandidates) {
      try {
        treeModel = await Model.fromGltfAsync({ url: candidate, modelMatrix: treeModelMatrix, scale: 1.0 })
        viewer.scene.primitives.add(treeModel)
        loadedTreeUrl = candidate
        setStatus(`Tree source: local (${candidate})${prefer === 'local' ? ' (forced)' : ''}`)
        return true
      } catch {
        // try next
      }
    }
    return false
  }
  const tryLoadIon = async () => {
    if (!hasIonTree) return false
    try {
      treeModel = await Model.fromGltfAsync({
        url: await IonResource.fromAssetId(env.ionTreeAssetId),
        modelMatrix: treeModelMatrix,
        scale: 1.0,
      })
      viewer.scene.primitives.add(treeModel)
      loadedTreeUrl = null
      setStatus(`Tree source: ion (asset ${env.ionTreeAssetId})${prefer === 'ion' ? ' (forced)' : ''}`)
      return true
    } catch (e) {
      setStatus(`Ion tree load failed (asset ${env.ionTreeAssetId}): ${e instanceof Error ? e.message : String(e)}`)
      return false
    }
  }

  // Desired behavior:
  // - Default: local first (fast + predictable) → if it fails, fallback to ion.
  // - Debug override: ?tree=ion forces ion; ?tree=local forces local.
  if (prefer === 'ion') {
    const ok = await tryLoadIon()
    if (!ok) {
      setStatus(`Ion forced but failed. Trying local…`)
      const okLocal = await tryLoadLocal()
      if (!okLocal) setStatus('Tree load failed (ion forced + local fallback).')
    }
  } else if (prefer === 'local') {
    const ok = await tryLoadLocal()
    if (!ok) {
      setStatus(`Local forced but failed. Trying ion…`)
      const okIon = await tryLoadIon()
      if (!okIon) setStatus('Tree load failed (local forced + ion fallback).')
    }
  } else {
    const okLocal = await tryLoadLocal()
    if (!okLocal) {
      setStatus('Local tree load failed. Falling back to ion…')
      const okIon = await tryLoadIon()
      if (!okIon) setStatus('Tree load failed (local + ion fallback).')
    }
  }

  // Anchors:
  // We only store the node NAMES from the GLB, and compute their actual transforms from Cesium runtime nodes.
  // This avoids all axis/root/sceneGraph transform mismatches between Blender/glTF and Cesium.
  const lightsEnabled = (getStringParam('lights') ?? '1') !== '0'
  let ornAnchorNames: string[] = []
  let lightAnchorNames: string[] = []
  const waitModelReady = async (m: Model) => {
    if (m.ready) return
    await new Promise<void>((resolve) => {
      // readyEvent listeners are passed the model instance, but we don't need it here.
      const remove = (m.readyEvent as any).addEventListener(() => {
        try {
          remove?.()
        } catch {
          // ignore
        }
        resolve()
      })
    })
  }
  const deriveAnchorNamesFromLoadedModel = (prefix: string): string[] => {
    // Cesium builds an internal node name map once the model is ready.
    const map = (treeModel as any)?._nodesByName as Record<string, unknown> | undefined
    if (!map) return []
    return Object.keys(map)
      .filter((n) => n.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, 'en'))
  }
  const anchorSourceUrl = loadedTreeUrl ?? treeUrlCandidates[0] ?? null

  if (treeModel) {
    await waitModelReady(treeModel)

    // IMPORTANT: Use the LOADED model (ion or local) as the source of truth.
    // If we read names from a different GLB, getNode(name) will fail and debug balls will be invisible.
    ornAnchorNames = deriveAnchorNamesFromLoadedModel('Orn.')
    if (DEBUG_MODE || lightsEnabled) lightAnchorNames = deriveAnchorNamesFromLoadedModel('Light.')

    if (ornAnchorNames.length || lightAnchorNames.length) {
      setStatus(
        `Anchors from loaded model: Orn.*=${ornAnchorNames.length}` +
          (DEBUG_MODE ? `, Light.*=${lightAnchorNames.length}` : ''),
      )
    } else if (anchorSourceUrl) {
      // Fallback (legacy): read anchor names from a GLB URL if Cesium internals are unavailable.
      try {
        ornAnchorNames = await loadAnchorNames(anchorSourceUrl, 'Orn.')
        if (DEBUG_MODE || lightsEnabled) lightAnchorNames = await loadAnchorNames(anchorSourceUrl, 'Light.')
        setStatus(
          `Anchors from ${anchorSourceUrl}: Orn.*=${ornAnchorNames.length}` +
            (DEBUG_MODE ? `, Light.*=${lightAnchorNames.length}` : ''),
        )
      } catch (e) {
        setStatus(`Failed to read anchors: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  // Keep ornaments attached to the main tree, even if the tree modelMatrix gets updated after placement.
  type LocalOrnInstance = { model: Model; anchorMatrix: Matrix4 }
  const localOrnaments: LocalOrnInstance[] = []
  const placedWishIds = new Set<string>()
  const recomputeLocalOrnaments = () => {
    if (!treeModel) return
    for (const o of localOrnaments) {
      o.model.modelMatrix = Matrix4.multiply(treeModel.modelMatrix, o.anchorMatrix, new Matrix4())
    }
  }

  // “Light.*” anchors: render as glowing bulbs (points) attached to the tree.
  type LocalLightInstance = { id: string; anchorMatrix: Matrix4 }
  const localLights: LocalLightInstance[] = []
  let lightsPhases = new Map<string, { phase: number; speed: number }>()
  let lightsTwinkleHooked = false
  const recomputeLocalLights = () => {
    if (!treeModel) return
    for (const l of localLights) {
      const world = Matrix4.multiply(treeModel.modelMatrix, l.anchorMatrix, new Matrix4())
      const pos = Matrix4.getTranslation(world, new Cartesian3())
      const ent = viewer.entities.getById(l.id)
      if (ent) {
        const p = ent.position as any
        if (p && typeof p.setValue === 'function') p.setValue(pos)
        else ent.position = new ConstantPositionProperty(pos)
      }
    }
  }
  const clearTreeLights = () => {
    for (const l of localLights) {
      const ent = viewer.entities.getById(l.id)
      if (ent) viewer.entities.remove(ent)
    }
    localLights.length = 0
  }
  const attachTreeLights = () => {
    if (!lightsEnabled) return
    if (!treeModel) return
    if (!lightAnchorNames.length) return
    clearTreeLights()

    const scaleByDistance = new NearFarScalar(80, 1.0, 900, 0.35)
    const haloScaleByDistance = new NearFarScalar(80, 1.2, 900, 0.4)

    // Disable a couple of problematic anchors (requested).
    // Be tolerant of suffixes like "Light.44.001" and leading zeros.
    const isLightIndex = (name: string, n: number) => new RegExp(`^Light\\.0*${n}(?:$|\\.)`).test(name)
    const enabledLightNames = lightAnchorNames.filter((n) => !isLightIndex(n, 44) && !isLightIndex(n, 45))

    // Requested tweaks:
    // - core size: -30%
    // - halo color: 40% lighter (move toward white)
    const warmCore = new Color(1.0, 0.9, 0.65, 0.95)
    const haloRgb = { r: 1.0, g: 0.9 + (1.0 - 0.9) * 0.4, b: 0.65 + (1.0 - 0.65) * 0.4 } // => (1, 0.94, 0.79)
    // Halo should be lighter/subtler: reduce opacity by 50%
    const warmHalo = new Color(haloRgb.r, haloRgb.g, haloRgb.b, 0.11)

    for (let i = 0; i < enabledLightNames.length; i++) {
      const name = enabledLightNames[i]
      const rel = getNodeAnchorRelativeToModelMatrix(name)
      if (!rel) continue
      const world = Matrix4.multiply(treeModel.modelMatrix, rel, new Matrix4())
      const pos = Matrix4.getTranslation(world, new Cartesian3())

      // Core (bright)
      const coreId = `treeLight:core:${i}`
      viewer.entities.add({
        id: coreId,
        position: pos,
        point: {
          pixelSize: 4.2,
          color: new ConstantProperty(warmCore),
          outlineColor: new ConstantProperty(Color.WHITE.withAlpha(0.18)),
          outlineWidth: 1,
          scaleByDistance: new ConstantProperty(scaleByDistance),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      localLights.push({ id: coreId, anchorMatrix: rel })

      // Halo (soft glow)
      const haloId = `treeLight:halo:${i}`
      viewer.entities.add({
        id: haloId,
        position: pos,
        point: {
          pixelSize: 16,
          color: new ConstantProperty(warmHalo),
          outlineWidth: 0,
          scaleByDistance: new ConstantProperty(haloScaleByDistance),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      localLights.push({ id: haloId, anchorMatrix: rel })
    }

    // Gentle twinkle (keeps it lively without “billboard lying down” issues).
    lightsPhases = new Map<string, { phase: number; speed: number }>()
    for (let i = 0; i < enabledLightNames.length; i++) {
      lightsPhases.set(`treeLight:core:${i}`, { phase: i * 0.73, speed: 0.9 + (i % 7) * 0.05 })
      lightsPhases.set(`treeLight:halo:${i}`, { phase: i * 0.73 + 1.2, speed: 0.85 + (i % 7) * 0.05 })
    }
    if (!lightsTwinkleHooked) {
      lightsTwinkleHooked = true
      const t0 = performance.now()
      viewer.scene.preUpdate.addEventListener(() => {
        const t = (performance.now() - t0) / 1000
        for (const l of localLights) {
          const ent = viewer.entities.getById(l.id)
          const g = ent?.point as any
          const c = g?.color
          const meta = lightsPhases.get(l.id)
          if (!c || !meta || typeof c.setValue !== 'function') continue
          const s = 0.6 + 0.4 * Math.pow(0.5 + 0.5 * Math.sin(t * meta.speed + meta.phase), 2)
          if (l.id.includes(':core:')) c.setValue(new Color(1.0, 0.9, 0.65, 0.75 + 0.25 * s))
          // Halo twinkle opacity reduced by 50% as well.
          else c.setValue(new Color(haloRgb.r, haloRgb.g, haloRgb.b, 0.06 + 0.11 * s))
        }
      })
    }

    setStatus(`Lights enabled: ${Math.floor(localLights.length / 2)} bulbs (excluded: Light.44, Light.45).`)
  }

  // Compute a node's WORLD matrix using Cesium runtime nodes, so it matches the rendered mesh exactly.
  const scratchNodeWorld = new Matrix4()
  const scratchInvModel = new Matrix4()
  const getNodeWorldMatrix = (nodeName: string): Matrix4 | null => {
    if (!treeModel) return null
    try {
      if (!(treeModel as any)._ready) return null
      const node = treeModel.getNode(nodeName)
      const runtimeNode = (node as any)?._runtimeNode
      const computedTransform = runtimeNode?.computedTransform ?? runtimeNode?._computedTransform
      const sceneGraph = (treeModel as any)?._sceneGraph
      const computedModelMatrix = sceneGraph?._computedModelMatrix
      if (!computedTransform || !computedModelMatrix) return null
      // This matches how Cesium builds drawCommand.modelMatrix = computedModelMatrix * transformToRoot
      return Matrix4.multiplyTransformation(computedModelMatrix as Matrix4, computedTransform as Matrix4, scratchNodeWorld)
    } catch {
      return null
    }
  }
  // Anchor matrix stored relative to treeModel.modelMatrix (so it stays attached when we update modelMatrix).
  const getNodeAnchorRelativeToModelMatrix = (nodeName: string): Matrix4 | null => {
    if (!treeModel) return null
    const world = getNodeWorldMatrix(nodeName)
    if (!world) return null
    Matrix4.inverse(treeModel.modelMatrix, scratchInvModel)
    return Matrix4.multiplyTransformation(scratchInvModel, world, new Matrix4())
  }

  // Once we can compute node-relative anchors, attach bulbs to Light.* anchors (production default).
  if (lightsEnabled) attachTreeLights()

  // Debug-only: preview ornaments at Light.* anchors (answers: “is it on the tree or floating outside?”)
  const lightPreview: LocalOrnInstance[] = []
  const clearLightPreview = () => {
    const models = lightPreview.map((p) => p.model)
    for (const p of lightPreview) {
      try {
        viewer.scene.primitives.remove(p.model)
      } catch {
        // ignore
      }
    }
    // also remove from the shared list
    for (let i = localOrnaments.length - 1; i >= 0; i--) {
      if (models.includes(localOrnaments[i].model)) localOrnaments.splice(i, 1)
    }
    lightPreview.length = 0
  }
  let lightPreviewIdx = 0
  const previewNextLightAnchor = async () => {
    if (!DEBUG_MODE) return
    if (!treeModel) {
      setStatus('Preview: treeModel not ready yet.')
      return
    }
    if (!lightAnchorNames.length) {
      setStatus('Preview: no Light.* anchors found in the loaded tree model.')
      return
    }
    const idx = lightPreviewIdx++ % lightAnchorNames.length
    const name = lightAnchorNames[idx]
    const orn = ORNAMENTS.find((o) => o.id === selectedOrnament)
    const file = orn?.file ?? selectedOrnament
    const url = `/models/ornaments/${file}.glb`
    try {
      const rel = getNodeAnchorRelativeToModelMatrix(name)
      if (!rel) {
        setStatus(`Preview: node not ready/unavailable: ${name}`)
        return
      }
      const worldMatrix = Matrix4.multiply(treeModel.modelMatrix, rel, new Matrix4())
      const model = await Model.fromGltfAsync({
        url,
        modelMatrix: worldMatrix,
        scale: 0.35,
        minimumPixelSize: 24,
        maximumScale: 10,
      })
      viewer.scene.primitives.add(model)
      const inst = { model, anchorMatrix: rel }
      localOrnaments.push(inst)
      lightPreview.push(inst)
      setStatus(`Preview: placed ${file} on ${name} (#${idx}).`)
    } catch (e) {
      setStatus(`Preview failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Debug-only: draw quick "anchor balls" (points) on every anchor.
  // - Orn.* anchors => blue
  // - Light.* anchors => red
  const anchorBallIds: string[] = []
  const clearAnchorBalls = () => {
    for (const id of anchorBallIds) {
      const ent = viewer.entities.getById(id)
      if (ent) viewer.entities.remove(ent)
    }
    anchorBallIds.length = 0
  }
  const attachAnchorBalls = () => {
    if (!DEBUG_MODE) return
    if (!treeModel) {
      setStatus('Anchor balls: treeModel not ready yet.')
      return
    }
    if (!ornAnchorNames.length && !lightAnchorNames.length) {
      setStatus('Anchor balls: no anchors loaded.')
      return
    }
    clearAnchorBalls()
    const addBall = (id: string, nodeName: string, color: Color) => {
      const worldM = getNodeWorldMatrix(nodeName)
      if (!worldM) return
      const world = Matrix4.getTranslation(worldM, new Cartesian3())
      viewer.entities.add({
        id,
        position: world,
        point: {
          pixelSize: 6,
          color,
          outlineColor: Color.BLACK.withAlpha(0.35),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      anchorBallIds.push(id)
    }

    const blue = new Color(0.3, 0.7, 1.0, 0.9)
    const red = new Color(1.0, 0.35, 0.35, 0.9)
    for (let i = 0; i < ornAnchorNames.length; i++) addBall(`dbg:ornBall:${i}`, ornAnchorNames[i], blue)
    for (let i = 0; i < lightAnchorNames.length; i++) addBall(`dbg:lightBall:${i}`, lightAnchorNames[i], red)
    setStatus(
      `Anchor balls attached: Orn.*=${ornAnchorNames.length} (blue), Light.*=${lightAnchorNames.length} (red).`,
    )
  }

  // Wire debug buttons
  if (DEBUG_MODE) {
    const prevBtn = document.querySelector('#previewLightAnchorBtn') as HTMLButtonElement | null
    const clearBtn = document.querySelector('#clearLightPreviewBtn') as HTMLButtonElement | null
    if (prevBtn) prevBtn.onclick = () => void previewNextLightAnchor()
    if (clearBtn) clearBtn.onclick = () => clearLightPreview()

    const attachBtn = document.querySelector('#attachAnchorBallsBtn') as HTMLButtonElement | null
    const clearBallsBtn = document.querySelector('#clearAnchorBallsBtn') as HTMLButtonElement | null
    if (attachBtn) attachBtn.onclick = () => attachAnchorBalls()
    if (clearBallsBtn) clearBallsBtn.onclick = () => clearAnchorBalls()
  }

  // ---- Main tree live edit (XY/scale/heading/ground trim) ----
  // Stored locally (per device) so you can fine-tune placement without redeploy loops.
  const mainDefaults = (defaultLayout as LayoutV1 | null)?.mainTree
  let mainEast = getNumberParam('treeEast') ?? (DEBUG_MODE ? getStoredNumber(mainKey.e) : null) ?? mainDefaults?.eastM ?? 0
  let mainNorth =
    getNumberParam('treeNorth') ?? (DEBUG_MODE ? getStoredNumber(mainKey.n) : null) ?? mainDefaults?.northM ?? 0
  let mainScale =
    getNumberParam('treeScale') ?? (DEBUG_MODE ? getStoredNumber(mainKey.s) : null) ?? mainDefaults?.scale ?? treeScale
  let mainHeadingDeg =
    getNumberParam('treeHeading') ??
    (DEBUG_MODE ? getStoredNumber(mainKey.h) : null) ??
    mainDefaults?.headingDeg ??
    headingDeg
  let mainGroundTrim =
    getNumberParam('treeGround') ?? (DEBUG_MODE ? getStoredNumber(mainKey.g) : null) ?? mainDefaults?.groundTrimM ?? 0
  const baseTreeLon = treeLonDeg
  const baseTreeLat = treeLatDeg
  let treeResampleTimer: number | null = null

  const shiftBaseTree = () => {
    const shifted = shiftLonLatByEnu(baseTreeLon, baseTreeLat, mainEast, mainNorth)
    return shifted
  }

  const updateMainTreeModelMatrix = async (opts: { resample: boolean }) => {
    if (!treeModel) return
    const shifted = shiftBaseTree()
    const lon = shifted.lon
    const lat = shifted.lat

    let alt = treeAltM
    if (has3DTiles && opts.resample) {
      const ground = await sampleGroundHeightMinMeters(lon, lat, sampleRadiusM)
      if (ground != null) alt = ground + groundOffsetM + mainGroundTrim
      else alt = treeAltM + mainGroundTrim
    } else {
      alt = treeAltM + mainGroundTrim
    }

    const pos = Cartesian3.fromDegrees(lon, lat, alt)
    const q = Transforms.headingPitchRollQuaternion(pos, new HeadingPitchRoll(CesiumMath.toRadians(mainHeadingDeg), 0, 0))
    const m = Matrix4.fromTranslationQuaternionRotationScale(pos, q, new Cartesian3(mainScale, mainScale, mainScale), new Matrix4())
    treeModel.modelMatrix = m
    // Keep attached objects aligned with the tree after any modelMatrix update.
    recomputeLocalOrnaments()
    recomputeLocalLights()

    if (DEBUG_MODE) {
      setStoredNumber(mainKey.e, mainEast)
      setStoredNumber(mainKey.n, mainNorth)
      setStoredNumber(mainKey.s, mainScale)
      setStoredNumber(mainKey.h, mainHeadingDeg)
      setStoredNumber(mainKey.g, mainGroundTrim)
    }
    setStatus(
      `Main tree${mainTreeSelected ? ' (selected)' : ''}: east=${mainEast.toFixed(1)}m north=${mainNorth.toFixed(
        1,
      )}m scale=${mainScale.toFixed(2)} heading=${mainHeadingDeg.toFixed(1)}° groundTrim=${mainGroundTrim.toFixed(2)}m${
        opts.resample ? ' (resampled)' : ''
      }`,
    )
  }

  // Apply any stored overrides once at startup.
  if (treeModel) {
    void updateMainTreeModelMatrix({ resample: true })
  }

  const scheduleMainTreeResample = () => {
    if (!has3DTiles) return
    if (treeResampleTimer != null) window.clearTimeout(treeResampleTimer)
    treeResampleTimer = window.setTimeout(() => void updateMainTreeModelMatrix({ resample: true }), 250)
  }

  // Click the main tree to toggle "selected" mode.
  if (treeModel) {
    const pickTreeHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    pickTreeHandler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position)
      const prim = (picked as any)?.primitive
      if (prim === treeModel) {
        mainTreeSelected = !mainTreeSelected
        void updateMainTreeModelMatrix({ resample: false })
      }
    }, ScreenSpaceEventType.LEFT_CLICK)
  }

  // Keyboard controls (only when main tree is selected):
  // - WASD: move north/west/south/east (shift=5m, alt=0.2m)
  // - [ / ]: ground trim down/up (shift=0.5m)
  // - - / = : scale down/up (shift=0.1)
  // - Q / E : heading rotate left/right (shift=15°, alt=1°)
  // - G : force resample
  window.addEventListener('keydown', (ev) => {
    if (!DEBUG_MODE) return
    if (!mainTreeSelected) return
    const step = ev.shiftKey ? 5 : ev.altKey ? 0.2 : 1
    const stepSmall = ev.shiftKey ? 0.1 : 0.05
    const stepDeg = ev.shiftKey ? 15 : ev.altKey ? 1 : 5

    if (ev.key === 'g' || ev.key === 'G') {
      void updateMainTreeModelMatrix({ resample: true })
      ev.preventDefault()
      return
    }
    if (ev.key === 'w' || ev.key === 'W') {
      mainNorth += step
      void updateMainTreeModelMatrix({ resample: false })
      scheduleMainTreeResample()
      ev.preventDefault()
      return
    }
    if (ev.key === 's' || ev.key === 'S') {
      mainNorth -= step
      void updateMainTreeModelMatrix({ resample: false })
      scheduleMainTreeResample()
      ev.preventDefault()
      return
    }
    if (ev.key === 'a' || ev.key === 'A') {
      mainEast -= step
      void updateMainTreeModelMatrix({ resample: false })
      scheduleMainTreeResample()
      ev.preventDefault()
      return
    }
    if (ev.key === 'd' || ev.key === 'D') {
      mainEast += step
      void updateMainTreeModelMatrix({ resample: false })
      scheduleMainTreeResample()
      ev.preventDefault()
      return
    }
    if (ev.key === '[') {
      mainGroundTrim -= ev.shiftKey ? 0.5 : 0.1
      void updateMainTreeModelMatrix({ resample: false })
      ev.preventDefault()
      return
    }
    if (ev.key === ']') {
      mainGroundTrim += ev.shiftKey ? 0.5 : 0.1
      void updateMainTreeModelMatrix({ resample: false })
      ev.preventDefault()
      return
    }
    if (ev.key === '-' || ev.key === '_') {
      mainScale = Math.max(0.05, mainScale - stepSmall)
      void updateMainTreeModelMatrix({ resample: false })
      ev.preventDefault()
      return
    }
    if (ev.key === '=' || ev.key === '+') {
      mainScale = Math.min(20, mainScale + stepSmall)
      void updateMainTreeModelMatrix({ resample: false })
      ev.preventDefault()
      return
    }
    if (ev.key === 'q' || ev.key === 'Q') {
      mainHeadingDeg -= stepDeg
      void updateMainTreeModelMatrix({ resample: false })
      ev.preventDefault()
      return
    }
    if (ev.key === 'e' || ev.key === 'E') {
      mainHeadingDeg += stepDeg
      void updateMainTreeModelMatrix({ resample: false })
      ev.preventDefault()
      return
    }
  })

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
      // - URL params: ?extraGround=-0.5 (meters, added on top of VITE_EXTRA_TREES_GROUND_OFFSET_M)
      // - localStorage: silentwish_extraEastM / silentwish_extraNorthM
      const extraDefaults = (defaultLayout as LayoutV1 | null)?.extraTrees?.globals
      const baseOffEast = extraDefaults?.eastM ?? (Number.isFinite(env.extraTreesOffsetEastM) ? env.extraTreesOffsetEastM : 0)
      const baseOffNorth = extraDefaults?.northM ?? (Number.isFinite(env.extraTreesOffsetNorthM) ? env.extraTreesOffsetNorthM : 0)
      const baseScale = extraDefaults?.scale ?? scale
      const baseGroundTrim = extraDefaults?.groundTrimM ?? 0
      let offEast = getNumberParam('extraEast') ?? (DEBUG_MODE ? getStoredNumber(extraKeys.east) : null) ?? baseOffEast
      let offNorth = getNumberParam('extraNorth') ?? (DEBUG_MODE ? getStoredNumber(extraKeys.north) : null) ?? baseOffNorth
      let extraScale = getNumberParam('extraScale') ?? (DEBUG_MODE ? getStoredNumber(extraKeys.scale) : null) ?? baseScale
      let extraGround = getNumberParam('extraGround') ?? (DEBUG_MODE ? getStoredNumber(extraKeys.ground) : null) ?? baseGroundTrim

      // Per-tree Z overrides (meters). Keyed by tree index.
      const perTreeKey = 'silentwish_extraTreeDeltas'
      const perTreeDeltas: Record<string, number> = DEBUG_MODE
        ? getStoredJson(perTreeKey, {})
        : (((defaultLayout as LayoutV1 | null)?.extraTrees?.perTree?.dz ?? {}) as Record<string, number>)
      // Per-tree scale multipliers (unitless). Keyed by tree index. Effective scale = extraScale * multiplier.
      const perTreeScaleKey = 'silentwish_extraTreeScale'
      const perTreeScaleMult: Record<string, number> = DEBUG_MODE
        ? getStoredJson(perTreeScaleKey, {})
        : (((defaultLayout as LayoutV1 | null)?.extraTrees?.perTree?.scaleMult ?? {}) as Record<string, number>)
      // Per-tree XY (ENU) offsets in meters. Keyed by tree index.
      const perTreeXYKey = 'silentwish_extraTreeXY'
      const perTreeXY: Record<string, { e: number; n: number }> = DEBUG_MODE
        ? getStoredJson(perTreeXYKey, {})
        : (((defaultLayout as LayoutV1 | null)?.extraTrees?.perTree?.xy ?? {}) as Record<string, { e: number; n: number }>)
      let selectedTreeIdx: number | null = null

      // Apply optional ENU offset in meters before sampling heights (fixes systematic drift).
      // Also applies per-tree ENU offsets (for manual fine-tuning).
      const computeShiftedPts = (globalE: number, globalN: number) => {
        const out: Array<{ lon: number; lat: number }> = []
        for (let i = 0; i < usePts.length; i++) {
          const { lon, lat } = usePts[i]
          const local = perTreeXY[String(i)] ?? { e: 0, n: 0 }
          const totalE = globalE + (Number.isFinite(local.e) ? local.e : 0)
          const totalN = globalN + (Number.isFinite(local.n) ? local.n : 0)
          out.push(shiftLonLatByEnu(lon, lat, totalE, totalN))
        }
        return out
      }

      const shiftedPtsInitial = computeShiftedPts(offEast, offNorth)

      // Sample ground initially. If offsets change, we will re-sample (debounced) to keep trees on the surface.
      let heights =
        has3DTiles ? await sampleGroundHeightMinForPoints(shiftedPtsInitial, radius) : new Array(shiftedPtsInitial.length).fill(0)

      const url = await IonResource.fromAssetId(env.ionExtraTreesModelAssetId)
      const extraTreeEntities: string[] = []

      // Estimate model "half height" for pivot compensation when scaling.
      // Many models have pivot around center; scaling then visually shifts ground contact.
      // We'll approximate using the bounding sphere radius.
      let modelRadiusM: number | null = null
      try {
        const tmp = await Model.fromGltfAsync({ url, modelMatrix: Matrix4.IDENTITY, scale: 1.0 })
        tmp.show = false
        viewer.scene.primitives.add(tmp)
        modelRadiusM = tmp.boundingSphere?.radius ?? null
        viewer.scene.primitives.remove(tmp)
      } catch {
        modelRadiusM = null
      }

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
          const localDelta = Number.isFinite(perTreeDeltas[String(i)]) ? perTreeDeltas[String(i)] : 0
          const localScaleMult = Number.isFinite(perTreeScaleMult[String(i)]) ? perTreeScaleMult[String(i)] : 1
          const alt = typeof h === 'number' && Number.isFinite(h) ? h + offset + extraGround + localDelta : 0 + offset + extraGround + localDelta
          const pos = Cartesian3.fromDegrees(lon, lat, alt)
          const id = `extraTree:${i}`
          viewer.entities.add({
            id,
            position: pos,
            model: {
              uri: url,
              scale: extraScale * localScaleMult,
              minimumPixelSize: 24,
            },
          })
          extraTreeEntities.push(id)
        }
        if (DEBUG_MODE) {
          setStoredNumber(extraKeys.east, eM)
          setStoredNumber(extraKeys.north, nM)
          setStoredNumber(extraKeys.scale, extraScale)
          setStoredNumber(extraKeys.ground, extraGround)
          setStoredJson(perTreeKey, perTreeDeltas)
          setStoredJson(perTreeScaleKey, perTreeScaleMult)
          setStoredJson(perTreeXYKey, perTreeXY)
        }
        setStatus(
          `Loaded ${shiftedPts.length} extra trees. Offset east=${eM.toFixed(1)}m north=${nM.toFixed(1)}m scale=${extraScale.toFixed(
            2,
          )} ground=${extraGround.toFixed(2)}m${opts.resample ? ' (resampled)' : ''}${
            selectedTreeIdx != null
              ? ` · selected #${selectedTreeIdx} Δz=${(perTreeDeltas[String(selectedTreeIdx)] ?? 0).toFixed(2)}m ×s=${(
                  perTreeScaleMult[String(selectedTreeIdx)] ?? 1
                ).toFixed(2)} Δe=${(perTreeXY[String(selectedTreeIdx)]?.e ?? 0).toFixed(1)} Δn=${(
                  perTreeXY[String(selectedTreeIdx)]?.n ?? 0
                ).toFixed(1)}`
              : ''
          }`,
        )
      }

      await renderExtraTrees(offEast, offNorth, { resample: true })

      const resetExtraTreesEdits = async () => {
        // Reset globals to base env defaults
        offEast = baseOffEast
        offNorth = baseOffNorth
        extraScale = scale
        extraGround = 0
        selectedTreeIdx = null

        // Clear per-tree overrides
        for (const k of Object.keys(perTreeDeltas)) delete perTreeDeltas[k]
        for (const k of Object.keys(perTreeScaleMult)) delete perTreeScaleMult[k]
        for (const k of Object.keys(perTreeXY)) delete perTreeXY[k]

        // Clear persisted values
        localStorage.removeItem('silentwish_extraEastM')
        localStorage.removeItem('silentwish_extraNorthM')
        localStorage.removeItem('silentwish_extraScale')
        localStorage.removeItem('silentwish_extraGroundM')
        localStorage.removeItem('silentwish_extraTreeDeltas')
        localStorage.removeItem('silentwish_extraTreeScale')
        localStorage.removeItem('silentwish_extraTreeXY')

        await renderExtraTrees(offEast, offNorth, { resample: true })
        setStatus('Extra trees edits reset (globals + per-tree overrides).')
      }

      // Click-to-select a single extra tree for per-tree Z adjustments.
      const pickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
      pickHandler.setInputAction((movement: any) => {
        const picked = viewer.scene.pick(movement.position)
        const id = (picked as any)?.id
        const eid = typeof id?.id === 'string' ? id.id : typeof id === 'string' ? id : null
        if (eid && eid.startsWith('extraTree:')) {
          const idx = Number(eid.split(':')[1])
          if (Number.isFinite(idx)) {
            selectedTreeIdx = idx
            void renderExtraTrees(offEast, offNorth, { resample: false })
          }
        } else {
          selectedTreeIdx = null
          void renderExtraTrees(offEast, offNorth, { resample: false })
        }
      }, ScreenSpaceEventType.LEFT_CLICK)

      // Keyboard tuning: arrows move the whole set.
      // - arrows: 1m
      // - shift+arrows: 5m
      // - alt+arrows: 0.2m
      // - g: force resample ground at current offset
      // - - / = : scale down / up (shift = bigger step)
      // - [ / ] : ground offset down/up (shift = bigger step)
      // - , / . : per-tree scale down/up when a tree is selected (shift = bigger step)
      // - I/J/K/L : move selected tree North/West/South/East (shift = bigger step, alt = smaller step)
      let resampleTimer: number | null = null
      const scheduleResample = () => {
        if (!has3DTiles) return
        if (resampleTimer != null) window.clearTimeout(resampleTimer)
        resampleTimer = window.setTimeout(() => {
          void renderExtraTrees(offEast, offNorth, { resample: true })
        }, 250)
      }

      let selectedResampleTimer: number | null = null
      const scheduleSelectedResample = () => {
        if (!has3DTiles) return
        if (selectedTreeIdx == null) return
        const idx = selectedTreeIdx
        if (selectedResampleTimer != null) window.clearTimeout(selectedResampleTimer)
        selectedResampleTimer = window.setTimeout(async () => {
          // Re-sample ONLY the selected tree ground height after XY move.
          const k = String(idx)
          const local = perTreeXY[k] ?? { e: 0, n: 0 }
          const p0 = usePts[idx]
          if (!p0) return
          const shifted = shiftLonLatByEnu(p0.lon, p0.lat, offEast + (local.e ?? 0), offNorth + (local.n ?? 0))
          const h = await sampleGroundHeightMinForPoints([shifted], radius)
          if (h?.length) heights[idx] = h[0]
          void renderExtraTrees(offEast, offNorth, { resample: false })
        }, 250)
      }

      window.addEventListener('keydown', (ev) => {
        if (!DEBUG_MODE) return
        // If main tree is in edit mode, ignore extra-trees hotkeys to avoid conflicts
        // BUT keep arrow-keys enabled so you can move all extra trees even while editing the main tree (WASD/QE).
        const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)
        if (mainTreeSelected && !isArrow) return

        // Reset extra trees edits (safety: requires Shift+R)
        if ((ev.key === 'r' || ev.key === 'R') && ev.shiftKey) {
          void resetExtraTreesEdits()
          ev.preventDefault()
          return
        }

        if (ev.key === 'g' || ev.key === 'G') {
          void renderExtraTrees(offEast, offNorth, { resample: true })
          ev.preventDefault()
          return
        }

        // Per-tree scale tuning (selected only)
        if ((ev.key === ',' || ev.key === '<') && selectedTreeIdx != null) {
          const step = ev.shiftKey ? 0.1 : 0.05
          const k = String(selectedTreeIdx)
          const cur = perTreeScaleMult[k] ?? 1
          const next = Math.max(0.1, cur - step)
          perTreeScaleMult[k] = next
          // Pivot compensation: adjust Δz so the base stays roughly in place when scaling.
          // Hold Alt to disable compensation.
          if (!ev.altKey && modelRadiusM != null) {
            const dz = (perTreeDeltas[k] ?? 0) + (cur - next) * modelRadiusM
            perTreeDeltas[k] = dz
          }
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }
        if ((ev.key === '.' || ev.key === '>') && selectedTreeIdx != null) {
          const step = ev.shiftKey ? 0.1 : 0.05
          const k = String(selectedTreeIdx)
          const cur = perTreeScaleMult[k] ?? 1
          const next = Math.min(5, cur + step)
          perTreeScaleMult[k] = next
          // Pivot compensation (Alt disables)
          if (!ev.altKey && modelRadiusM != null) {
            const dz = (perTreeDeltas[k] ?? 0) + (cur - next) * modelRadiusM
            perTreeDeltas[k] = dz
          }
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }

        // Global extra-trees scale tuning (only when no tree is selected)
        if ((ev.key === ',' || ev.key === '<') && selectedTreeIdx == null) {
          extraScale = Math.max(0.05, extraScale - (ev.shiftKey ? 0.1 : 0.05))
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }
        if ((ev.key === '.' || ev.key === '>') && selectedTreeIdx == null) {
          extraScale = Math.min(10, extraScale + (ev.shiftKey ? 0.1 : 0.05))
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }

        // Ground offset tuning (does not require resampling)
        if (ev.key === '[') {
          const step = ev.shiftKey ? 0.5 : 0.1
          if (selectedTreeIdx != null) {
            const k = String(selectedTreeIdx)
            perTreeDeltas[k] = (perTreeDeltas[k] ?? 0) - step
          } else {
            extraGround -= step
          }
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }
        if (ev.key === ']') {
          const step = ev.shiftKey ? 0.5 : 0.1
          if (selectedTreeIdx != null) {
            const k = String(selectedTreeIdx)
            perTreeDeltas[k] = (perTreeDeltas[k] ?? 0) + step
          } else {
            extraGround += step
          }
          void renderExtraTrees(offEast, offNorth, { resample: false })
          ev.preventDefault()
          return
        }

        // Per-tree XY tuning (selected only)
        if (selectedTreeIdx != null && ['i', 'j', 'k', 'l', 'I', 'J', 'K', 'L'].includes(ev.key)) {
          const step = ev.shiftKey ? 5 : ev.altKey ? 0.2 : 1
          const k = String(selectedTreeIdx)
          const cur = perTreeXY[k] ?? { e: 0, n: 0 }
          if (ev.key === 'j' || ev.key === 'J') cur.e -= step
          if (ev.key === 'l' || ev.key === 'L') cur.e += step
          if (ev.key === 'i' || ev.key === 'I') cur.n += step
          if (ev.key === 'k' || ev.key === 'K') cur.n -= step
          perTreeXY[k] = cur
          void renderExtraTrees(offEast, offNorth, { resample: false })
          scheduleSelectedResample()
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
  async function flyToStart() {
    const sv = getLocalStartViewIfDebug()
    const start: StartView = sv ?? {
      lon: Number.isFinite(env.cameraStartLon) ? env.cameraStartLon : camLonDeg,
      lat: Number.isFinite(env.cameraStartLat) ? env.cameraStartLat : camLatDeg,
      height: Number.isFinite(env.cameraStartHeight) ? env.cameraStartHeight : 180,
      heading: Number.isFinite(env.cameraStartHeadingDeg) ? env.cameraStartHeadingDeg : 25,
      pitch: Number.isFinite(env.cameraStartPitchDeg) ? env.cameraStartPitchDeg : -25,
      roll: Number.isFinite(env.cameraStartRollDeg) ? env.cameraStartRollDeg : 0,
    }
    await viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(start.lon, start.lat, start.height),
      orientation: {
        heading: CesiumMath.toRadians(start.heading),
        pitch: CesiumMath.toRadians(start.pitch),
        roll: CesiumMath.toRadians(start.roll),
      },
      duration: 0.9,
    })
  }

  const flyToCity = async () => {
    // Default City preset: if VITE_CAMERA_CITY_* is not set, fall back to the START view values.
    let lon = Number.isFinite(env.cameraCityLon)
      ? env.cameraCityLon
      : Number.isFinite(env.cameraStartLon)
        ? env.cameraStartLon
        : camLonDeg
    let lat = Number.isFinite(env.cameraCityLat)
      ? env.cameraCityLat
      : Number.isFinite(env.cameraStartLat)
        ? env.cameraStartLat
        : camLatDeg
    const height = Number.isFinite(env.cameraCityHeight)
      ? env.cameraCityHeight
      : Number.isFinite(env.cameraStartHeight)
        ? env.cameraStartHeight
        : 350
    const heading = Number.isFinite(env.cameraCityHeadingDeg)
      ? env.cameraCityHeadingDeg
      : Number.isFinite(env.cameraStartHeadingDeg)
        ? env.cameraStartHeadingDeg
        : 0
    const pitch = Number.isFinite(env.cameraCityPitchDeg)
      ? env.cameraCityPitchDeg
      : Number.isFinite(env.cameraStartPitchDeg)
        ? env.cameraStartPitchDeg
        : -35
    const roll = Number.isFinite(env.cameraCityRollDeg)
      ? env.cameraCityRollDeg
      : Number.isFinite(env.cameraStartRollDeg)
        ? env.cameraStartRollDeg
        : 0
    // Safety: if city coords end up invalid/outside Montpellier, fall back to camera focus.
    const inMontpellierCam = (la: number, lo: number) => la >= 43 && la <= 44 && lo >= 3 && lo <= 4
    if (!inMontpellierCam(lat, lon) && inMontpellierCam(lon, lat)) {
      // swapped
      ;[lat, lon] = [lon, lat]
    }
    if (!inMontpellierCam(lat, lon)) {
      // fallback to focus
      lon = camLonDeg
      lat = camLatDeg
    }

    await viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lon, lat, height),
      orientation: { heading: CesiumMath.toRadians(heading), pitch: CesiumMath.toRadians(pitch), roll: CesiumMath.toRadians(roll) },
      duration: 1.2,
    })
  }

  // Keep the old behavior as a "refocus the camera on the tree model" helper.
  const flyToTreeFocus = async () => {
    // Prefer flying to the actual main tree model position (after layout + live edits),
    // so camera always ends up near the tree even if env camera coords are wrong.
    try {
      if (treeModel) {
        const p = Matrix4.getTranslation(treeModel.modelMatrix, new Cartesian3())
        const carto = Cartographic.fromCartesian(p)
        if (Number.isFinite(carto.longitude) && Number.isFinite(carto.latitude)) {
          const lon = CesiumMath.toDegrees(carto.longitude)
          const lat = CesiumMath.toDegrees(carto.latitude)
          await viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(lon, lat, 120),
            orientation: { heading: CesiumMath.toRadians(25), pitch: CesiumMath.toRadians(-25), roll: 0 },
            duration: 1.0,
          })
          return
        }
      }
    } catch {
      // fallback below
    }
    await viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(camLonDeg, camLatDeg, 120),
      orientation: { heading: CesiumMath.toRadians(25), pitch: CesiumMath.toRadians(-25), roll: 0 },
      duration: 1.0,
    })
  }
  ;($('#camCityBtn') as HTMLButtonElement).onclick = () => void flyToCity()
  // Requested: Tree button should match the start camera view.
  ;($('#camTreeBtn') as HTMLButtonElement).onclick = () => void flyToStart()
  void flyToStart()

  // Local ornament placement
  async function placeLocalOrnament(anchorIndex: number, ornamentId: OrnamentId) {
    const orn = ORNAMENTS.find((o) => o.id === ornamentId)
    const file = orn?.file ?? ornamentId
    const url = `/models/ornaments/${file}.glb`

    // Some ornament exports end up “lying sideways”.
    // In this project we already had to apply an X -90° correction on the tree in Blender,
    // so ornaments need the same axis correction to hang upright.
    const ornamentTiltFixRot = Matrix3.fromRotationX(CesiumMath.toRadians(-90), new Matrix3())

    // If Orn.* anchors exist in the tree GLB, use them (exact placement).
    // Otherwise, fall back to the previous procedural placement.
    let worldMatrix: Matrix4 | null = null
    let anchorMatrix: Matrix4 | null = null
    if (treeModel && ornAnchorNames.length) {
      const name = ornAnchorNames[anchorIndex % ornAnchorNames.length]
      const rel = getNodeAnchorRelativeToModelMatrix(name)
      if (!rel) {
        setStatus(`Ornament: node not ready/unavailable: ${name}`)
        return
      }
      // Decompose rel = [R | t], then rebuild [R * fix | t]
      const t = Matrix4.getTranslation(rel, new Cartesian3())
      const r = Matrix4.getRotation(rel, new Matrix3())
      const rFixed = Matrix3.multiply(r, ornamentTiltFixRot, new Matrix3())
      anchorMatrix = Matrix4.fromRotationTranslation(rFixed, t, new Matrix4())
      worldMatrix = Matrix4.multiply(treeModel.modelMatrix, anchorMatrix, new Matrix4())
    } else if (treeModel) {
      // Fallback: drop near tree (kept as backup)
      const origin = Matrix4.getTranslation(treeModel.modelMatrix, new Cartesian3())
      const enu = Transforms.eastNorthUpToFixedFrame(origin)
      const angle = (anchorIndex % 360) * (Math.PI / 180)
      const radius = 4 + ((anchorIndex % 13) / 13) * 4
      const height = 10 + ((anchorIndex % 25) / 25) * 14
      const offset = new Cartesian3(radius * Math.cos(angle), radius * Math.sin(angle), height)
      const pos = Matrix4.multiplyByPoint(enu, offset, new Cartesian3())
      // Fallback: we don't have an anchor rotation, so just tilt in ENU space at the ornament position.
      const base = Matrix4.fromTranslation(pos, new Matrix4())
      const rot4 = Matrix4.fromRotationTranslation(ornamentTiltFixRot, Cartesian3.ZERO, new Matrix4())
      worldMatrix = Matrix4.multiply(base, rot4, new Matrix4())
    }
    try {
      if (!worldMatrix) return
      const model = await Model.fromGltfAsync({
        url,
        modelMatrix: worldMatrix,
        scale: 1.0,
        // Keep ornaments visible even if they're small or the camera is far.
        minimumPixelSize: 24,
        maximumScale: 10,
      })
      viewer.scene.primitives.add(model)
      // Store anchor matrix (if any) so ornaments stay attached when the tree is moved/rescaled later.
      if (anchorMatrix) localOrnaments.push({ model, anchorMatrix })
    } catch (e) {
      setStatus(`Failed to load ornament model: ${file}.glb (${e instanceof Error ? e.message : String(e)})`)
    }
  }

  // Load existing ornaments (global, for all users) from Supabase and render them.
  const loadExistingOrnaments = async () => {
    if (!env.supabaseUrl || !env.supabaseAnonKey) return
    if (!treeModel) return
    if (!ornAnchorNames.length) return
    try {
      const r = await fetch(`${env.supabaseUrl}/functions/v1/ornaments?limit=250`, {
        headers: {
          Authorization: `Bearer ${env.supabaseAnonKey}`,
          apikey: env.supabaseAnonKey,
        },
      })
      if (!r.ok) return
      const j = (await r.json()) as {
        ok: boolean
        items: Array<{ id: string; anchor_index: number; ornament_type: string }>
      }
      const items = Array.isArray(j?.items) ? j.items : []
      // Place oldest first so newer ornaments sit "on top" visually if there are collisions.
      items.reverse()

      let placed = 0
      for (const it of items) {
        if (!it?.id || typeof it.anchor_index !== 'number' || typeof it.ornament_type !== 'string') continue
        if (placedWishIds.has(it.id)) continue
        if (!isOrnamentId(it.ornament_type)) continue
        placedWishIds.add(it.id)
        placed++
        // Fire-and-forget-ish, but await to avoid spawning hundreds at once.
        await placeLocalOrnament(it.anchor_index, it.ornament_type)
      }
      if (placed) setStatus(`Loaded ${placed} ornaments from Supabase.`)
    } catch {
      // ignore
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

  // After initial tree + anchors are ready, load globally persisted ornaments for everyone.
  // (Safe to call multiple times; we dedupe by wish id.)
  void loadExistingOrnaments()
  // Keep refreshing so other users' ornaments appear (simple polling).
  setInterval(() => void loadExistingOrnaments(), 15_000)

  ;($('#revealBtn') as HTMLButtonElement).onclick = async () => {
    // Open the reveal page (it will handle "not yet" gating via the backend).
    window.open('/reveal.html', '_blank', 'noopener,noreferrer')
  }

  // Turnstile
  const hangBtn = $('#hangBtn') as HTMLButtonElement
  const downloadBtn = $('#downloadBtn') as HTMLButtonElement
  const postcardBtn = $('#postcardBtn') as HTMLButtonElement
  const wishInput = $('#wishInput') as HTMLTextAreaElement
  const newSessionBtn = $('#newSessionBtn') as HTMLButtonElement

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

  // Test helper: reset client_id to bypass rate limit during iteration.
  newSessionBtn.onclick = () => {
    if (!confirm('Reset session id for this browser? (Helps bypass rate limit while testing.)')) return
    localStorage.removeItem('silentwish_client_id')
    setStatus('Session reset. Reloading…')
    location.reload()
  }

  // Hide loading overlay once the app reached interactive state (tree loaded or failed).
  // We keep it simple: after first successful fly-to + next frame.
  // (Photorealistic tiles streaming continues in background.)
  setTimeout(() => setLoading(false), 1200)

  // Optional: click tree to refocus
  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction(() => void flyToTreeFocus(), ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

  // Postcard download (no wish required): use FR/EN transparent PNG frame.
  postcardBtn.onclick = async () => {
    try {
      postcardBtn.disabled = true
      const stamp = formatLocalTimestamp()
      const caption =
        lang === 'fr'
          ? ['Montpellier – Arbre à vœux silencieux – 2026', `Partagé : ${stamp} (Montpellier)`]
          : ['Montpellier – Silent Wish Tree – 2026', `Shared: ${stamp} (Montpellier)`]
      const dataUrl = await screenshotWithCaption(viewer, caption, { frameLang: lang })
      downloadDataUrl(`silent-wish-postcard-${lang}.png`, dataUrl)
    } catch (e) {
      setStatus(`Postcard failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      postcardBtn.disabled = false
    }
  }

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
      if (!r.ok) {
        let detail = ''
        try {
          const j = (await r.json()) as { error?: string; detail?: string }
          detail = [j?.error, j?.detail].filter(Boolean).join(': ')
        } catch {
          try {
            detail = (await r.text()).slice(0, 500)
          } catch {
            // ignore
          }
        }
        throw new Error(`HTTP ${r.status}${detail ? ` — ${detail}` : ''}`)
      }
      const j = (await r.json()) as { ok: boolean; id: string; anchor_index: number }
      if (j?.id) placedWishIds.add(j.id)
      await placeLocalOrnament(j.anchor_index, selectedOrnament)
      void fetchStats()

      const stamp = formatLocalTimestamp()
      const caption =
        lang === 'fr'
          ? ['Montpellier – Arbre à vœux silencieux – 2026', `Partagé : ${stamp} (Montpellier)`]
          : ['Montpellier – Silent Wish Tree – 2026', `Shared: ${stamp} (Montpellier)`]

      const dataUrl = await screenshotWithCaption(viewer, caption, {
        watermark: lang === 'fr' ? 'Souvenir de Montpellier' : 'Montpellier memory',
        frameLang: lang,
      })
      downloadBtn.disabled = false
      downloadBtn.onclick = () => downloadDataUrl('silent-wish-montpellier.png', dataUrl)

      status.textContent = t('done')
      wishInput.value = ''
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      let hint = ''
      if (msg.includes('captcha_failed')) {
        hint =
          ' (Turnstile: Cloudflare dashboard → widget → Allowed hostnames içine Vercel domainini ekle, sonra redeploy.)'
      } else if (msg.includes('rate_limited')) {
        hint = ' (Rate limit: 1 saat içinde çok fazla deneme.)'
      }
      setStatus(`${t('errorServer')} ${msg}${hint}`)
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
