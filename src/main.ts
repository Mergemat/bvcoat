import './style.css'

const REPOSITORY = 'Mergemat/bvcoat'
const RELEASES_URL = `https://github.com/${REPOSITORY}/releases/latest`

interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

interface Release {
  tag_name: string
  published_at: string
  assets: ReleaseAsset[]
}

type Platform = 'windows' | 'macos'

function detectedPlatform(): Platform {
  return /Mac|iPhone|iPad/i.test(navigator.userAgent) ? 'macos' : 'windows'
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function assetFor(release: Release, platform: Platform): ReleaseAsset | undefined {
  const extension = platform === 'windows' ? '.exe' : '.dmg'
  return release.assets.find(({ name }) => name.toLowerCase().endsWith(extension))
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="BVCOAT home">
      <img src="/bvcoat.svg" alt="" width="42" height="42">
      <span>BVCOAT</span>
    </a>
    <a class="github-link" href="https://github.com/${REPOSITORY}" target="_blank" rel="noreferrer">
      GitHub <span aria-hidden="true">↗</span>
    </a>
  </header>

  <main>
    <section class="hero">
      <div class="signal" aria-hidden="true">
        <svg viewBox="0 0 1440 180" preserveAspectRatio="none">
          <path class="signal-ghost" d="M0 93h170l28-10 27 35 30-103 32 153 36-77 29 9 30-59 32 96 31-44h161l30-8 27 25 29-80 35 129 37-70 31 10 35-42 33 70 30-34h290"/>
          <path class="signal-live" pathLength="1" d="M0 93h170l28-10 27 35 30-103 32 153 36-77 29 9 30-59 32 96 31-44h161l30-8 27 25 29-80 35 129 37-70 31 10 35-42 33 70 30-34h290"/>
        </svg>
      </div>

      <div class="hero-copy">
        <p class="eyebrow">Realtime voice conversion</p>
        <h1>Your voice,<br><em>recut live.</em></h1>
        <p class="lede">BVCOAT changes your voice during calls with a locally running neural model. No audio leaves your computer.</p>
      </div>

      <aside class="download-panel" aria-labelledby="download-title">
        <div class="panel-topline">
          <span id="download-title">Get BVCOAT</span>
          <span class="status"><i></i><span id="release-status">Checking release</span></span>
        </div>
        <div class="platform-switch" role="group" aria-label="Choose operating system">
          <button type="button" data-platform="windows">Windows</button>
          <button type="button" data-platform="macos">macOS</button>
        </div>
        <a class="download-button" id="primary-download" href="${RELEASES_URL}">
          <span>Download for <b id="platform-label">Windows</b></span>
          <span class="arrow" aria-hidden="true">↓</span>
        </a>
        <p class="release-meta" id="release-meta">Latest GitHub release</p>
        <div class="requirements">
          <p id="requirement-main">Windows 10/11 · x64 · NVIDIA GPU recommended</p>
          <p>First launch installs the audio cable and model runtime.</p>
        </div>
      </aside>
    </section>

    <section class="facts" aria-label="Product details">
      <div><span>01 / Route</span><p>Works as a microphone in calling apps through a bundled virtual audio cable.</p></div>
      <div><span>02 / Process</span><p>Inference stays local. Your microphone audio is never uploaded.</p></div>
      <div><span>03 / Adjust</span><p>Shape stability, similarity, and style while the voice is running.</p></div>
    </section>
  </main>

  <footer>
    <span>BVCOAT ${new Date().getFullYear()}</span>
    <span>Built for live conversation.</span>
  </footer>
`

const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-platform]')]
const primary = document.querySelector<HTMLAnchorElement>('#primary-download')!
const label = document.querySelector<HTMLElement>('#platform-label')!
const meta = document.querySelector<HTMLElement>('#release-meta')!
const requirement = document.querySelector<HTMLElement>('#requirement-main')!
const status = document.querySelector<HTMLElement>('#release-status')!
let release: Release | undefined
let platform = detectedPlatform()

function renderPlatform(): void {
  for (const button of buttons) button.classList.toggle('active', button.dataset.platform === platform)
  label.textContent = platform === 'windows' ? 'Windows' : 'macOS'
  requirement.textContent = platform === 'windows'
    ? 'Windows 10/11 · x64 · NVIDIA GPU recommended'
    : 'macOS 12+ · Apple Silicon'
  const asset = release ? assetFor(release, platform) : undefined
  primary.href = asset?.browser_download_url ?? RELEASES_URL
  meta.textContent = asset && release
    ? `${release.tag_name.replace(/^v/, '')} · ${formatBytes(asset.size)} · GitHub Release`
    : 'Latest GitHub release'
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    platform = button.dataset.platform as Platform
    renderPlatform()
  })
}

renderPlatform()

fetch(`https://api.github.com/repos/${REPOSITORY}/releases/latest`, {
  headers: { Accept: 'application/vnd.github+json' },
})
  .then(async (response) => {
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
    release = await response.json() as Release
    status.textContent = 'Release ready'
    renderPlatform()
  })
  .catch(() => {
    status.textContent = 'Open GitHub release'
  })
