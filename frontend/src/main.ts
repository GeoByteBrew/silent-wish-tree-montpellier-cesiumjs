import './style.css'
import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  ConstantProperty,
  GeoJsonDataSource,
  HeadingPitchRoll,
  Ion,
  IonImageryProvider,
  IonResource,
  JulianDate,
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
  const setStatus = (msg: string) => {
    status.textContent = msg
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
      const ds = await GeoJsonDataSource.load(await IonResource.fromAssetId(env.ionTreeGeojsonAssetId))
      viewer.dataSources.add(ds)
      // Hide billboards/labels if any; we only need the coordinate.
      for (const e of ds.entities.values) {
        if (e.billboard) e.billboard.show = new ConstantProperty(false)
        if (e.label) e.label.show = new ConstantProperty(false)
        if (e.point) e.point.show = new ConstantProperty(false)
      }
      const now = JulianDate.now()
      const firstWithPos = ds.entities.values.find((e) => e.position?.getValue(now))
      const p = firstWithPos?.position?.getValue(now)
      if (p) {
        const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(p)
        if (carto) {
          treeLatDeg = CesiumMath.toDegrees(carto.latitude)
          treeLonDeg = CesiumMath.toDegrees(carto.longitude)

          // Re-validate (also protects against accidental swapped coords in the GeoJSON).
          if (!inMontpellier(treeLatDeg, treeLonDeg) && inMontpellier(treeLonDeg, treeLatDeg)) {
            ;[treeLatDeg, treeLonDeg] = [treeLonDeg, treeLatDeg]
          }
          if (!inMontpellier(treeLatDeg, treeLonDeg)) {
            treeLatDeg = 43.6119
            treeLonDeg = 3.8730
            setStatus('Ion GeoJSON coords invalid; falling back to Peyrou.')
          } else {
            setStatus('Tree location loaded from ion GeoJSON.')
          }
        }
      } else {
        setStatus('Ion GeoJSON loaded but no point position found; using env/default coordinates.')
      }
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
