// Custom AI-assisted logic

// ============================================================
// ELEMENT REFERENCES
// ============================================================

const searchInput = document.getElementById("search-input");
const results = document.getElementById("search-results");

// ============================================================
// STATE
// ============================================================

let currentCountry = "";

// ============================================================
// API FUNCTIONS
// ============================================================

async function fetchCountry(query) {
  const response = await fetch(
    `/.netlify/functions/country?name=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "Country not found — check the spelling and try again"
        : `API error (${response.status})`,
    );
  }

  const data = await response.json();

  // Log the full v5 structure on first load so field names can be verified
  console.log("v5 raw response:", JSON.stringify(data, null, 2));

  const objects = data?.data?.objects ?? [];

  if (objects.length === 0) {
    throw new Error("Country not found — check the spelling and try again");
  }

  return objects[0];
}

async function fetchBorders(codes) {
  if (!codes || codes.length === 0) return [];

  const response = await fetch(
    `/.netlify/functions/borders?codes=${codes.join(",")}`,
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data?.data?.objects ?? [];
}

// ============================================================
// HELPERS
// ============================================================

function formatPopulation(pop) {
  if (!pop) return "N/A";
  if (pop >= 1_000_000_000) return (pop / 1_000_000_000).toFixed(1) + "B";
  if (pop >= 1_000_000) return (pop / 1_000_000).toFixed(1) + "M";
  if (pop >= 1_000) return (pop / 1_000).toFixed(1) + "K";
  return pop.toLocaleString();
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

function renderLoading() {
  results.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 gap-4">
      <div class="w-8 h-8 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin"></div>
      <p class="font-label-caps text-[10px] text-outline tracking-widest">FETCHING_DATA...</p>
    </div>
  `;
}

function renderError(message) {
  results.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 gap-3">
      <p class="font-label-caps text-[10px] text-error tracking-widest">⚠ QUERY_FAILED</p>
      <p class="font-label-caps text-[10px] text-on-surface-variant">${message}</p>
    </div>
  `;
}

function renderProfile(country, borders) {
  // ── Extract all data with optional chaining ──────────────────────────────
  // Names
  const commonName = country.names?.common ?? "Unknown";
  const officialName = country.names?.official ?? commonName;
  const nativeName = country.names?.native
    ? Object.values(country.names.native)[0]
        ?.official?.toUpperCase()
        .replace(/ /g, "_")
    : officialName.toUpperCase().replace(/ /g, "_");

  // Codes
  const alpha2 = country.codes?.alpha_2 ?? "";
  const alpha3 = country.codes?.alpha_3 ?? "";
  const ccn3 = country.codes?.ccn3 ?? "000";
  const fifa = country.codes?.fifa ?? "N/A";

  // Visuals
  const flagUrl = country.flag?.png ?? "";
  const flagAlt = country.flag?.alt ?? `Flag of ${commonName}`;
  const coatUrl = country.coatOfArms?.png ?? "";

  // Geography
  const capital = country.capitals?.[0] ?? country.capital?.[0] ?? "N/A";
  const region = country.region ?? "N/A";
  const subregion = country.subregion ?? region;
  const landlocked = country.landlocked ? "YES" : "NO";
  const lat = country.latlng?.[0] ?? 0;
  const lng = country.latlng?.[1] ?? 0;
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  const coordDisplay = `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;

  // Stats
  const population = country.population ?? 0;
  const area = country.area ?? 0;
  const popDisplay = formatPopulation(population);
  const popBarWidth = Math.min(
    100,
    Math.round((population / 1_500_000_000) * 100),
  );
  const areaBarWidth = Math.min(100, Math.round((area / 17_000_000) * 100));

  // Membership — v5 field path uncertain; fallback chain covers both formats
  const isUnMember = country.memberships?.un ?? country.unMember ?? false;
  const unStatus = isUnMember ? "UN_MEMBER" : "OBSERVER";
  const isIndependent = country.independent ?? true;

  // Practical info
  const currency = country.currencies
    ? Object.values(country.currencies)
        .map((c) => `${c.name} (${c.symbol})`)
        .join(", ")
    : "N/A";
  const drivingSide = country.car?.side
    ? country.car.side.charAt(0).toUpperCase() +
      country.car.side.slice(1) +
      "_Steer"
    : "N/A";
  const tld = country.tlds?.[0] ?? country.tld?.[0] ?? "N/A";
  const dialCode =
    country.idd?.root && country.idd?.suffixes?.[0]
      ? `${country.idd.root}${country.idd.suffixes[0]}`
      : (country.idd?.root ?? "N/A");
  const language = country.languages
    ? Object.values(country.languages).join(", ").toUpperCase()
    : "N/A";
  const startOfWeek = country.startOfWeek
    ? country.startOfWeek.toUpperCase() + "_0000"
    : "N/A";

  // Links
  const googleMaps = country.maps?.googleMaps ?? "#";
  const osmLink = country.maps?.openStreetMaps ?? "#";

  // Demonym — used for "class" display
  const demonym = country.demonyms?.eng?.m ?? commonName;
  const citizenClass = `${demonym.toUpperCase().replace(/ /g, "_")}_CITIZEN`;

  // Borders — rendered as badge chips
  const borderBadges =
    borders.length > 0
      ? borders
          .map((b) => {
            const bCode =
              b.codes?.alpha_3 ??
              b.names?.common?.substring(0, 3).toUpperCase() ??
              "???";
            return `<span class="text-[10px] font-label-caps border border-outline/20 px-2 py-1 rounded bg-surface-container-high">${bCode}</span>`;
          })
          .join("")
      : `<span class="text-[10px] font-label-caps text-on-surface-variant">NONE — ISLAND_NATION</span>`;

  // Map embed using real coordinates
  const bbox = 10;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bbox},${lat - bbox},${lng + bbox},${lat + bbox}&layer=mapnik`;

  // ── Render ───────────────────────────────────────────────────────────────
  results.innerHTML = `
    <div class="flex items-center gap-2 mb-4">
      <span class="w-2 h-2 bg-tertiary-fixed rounded-full animate-pulse"></span>
      <span class="font-label-caps text-[10px] text-tertiary-fixed tracking-[0.2em]">QUERY_SUCCESS: RESULT_FOUND</span>
    </div>

    <!-- Header -->
    <section class="relative bg-surface-container-low border-l-4 border-primary-container p-6 clipped-header shadow-[0_0_12px_rgba(0,240,255,0.05)]">
      <div class="flex flex-col md:flex-row justify-between items-start gap-6">
        <div class="flex gap-6 items-center">
          <div class="flex flex-col gap-2">
            <!-- Flag -->
            <div class="w-24 h-16 rounded border-2 border-primary overflow-hidden shadow-[0_0_12px_rgba(0,240,255,0.2)] bg-black relative">
              ${
                flagUrl
                  ? `<img alt="${flagAlt}" class="w-full h-full object-cover" src="${flagUrl}" />`
                  : `<div class="w-full h-full flex items-center justify-center text-outline text-[10px] font-label-caps">NO_FLAG</div>`
              }
            </div>
            <!-- Coat of arms -->
            <div class="w-12 h-12 self-center rounded border border-outline/30 bg-surface-container-highest p-1 flex items-center justify-center">
              ${
                coatUrl
                  ? `<img alt="Coat of arms of ${commonName}" class="w-8 h-8 object-contain" src="${coatUrl}" />`
                  : `<span class="text-[8px] font-label-caps text-outline text-center leading-tight">NO_CREST</span>`
              }
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-label-caps text-[10px] text-primary opacity-70 tracking-widest">REGISTRY_${alpha2}_${ccn3.padStart(3, "0")}</span>
              <span class="font-label-caps text-[10px] text-tertiary-fixed opacity-60">${nativeName}</span>
            </div>
            <h2 class="font-headline-lg-mobile text-headline-lg text-primary uppercase tracking-widest leading-none">
              ${commonName.toUpperCase()}
            </h2>
            <div class="font-label-caps text-on-surface-variant text-[14px] mt-1 tracking-tight">
              ${officialName}
            </div>
            <div class="flex items-center gap-4 mt-3">
              <span class="bg-secondary-container text-on-secondary-container font-label-caps text-[10px] px-2 py-0.5 rounded">
                ${isUnMember ? "RANK: ALLIED_MEMBER" : "RANK: INDEPENDENT"}
              </span>
              <span class="text-primary-fixed-dim font-stat-value text-stat-value">LVL ${ccn3.padStart(3, "0")}</span>
            </div>
          </div>
        </div>
        <div class="text-left md:text-right space-y-1">
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Registry IDs</span>
          <div class="flex md:justify-end gap-2">
            <span class="text-[10px] font-label-caps bg-surface-container-highest px-2 py-1 rounded text-primary/80 border border-primary/20">ISO: ${alpha3} / ${ccn3}</span>
            ${fifa !== "N/A" ? `<span class="text-[10px] font-label-caps bg-surface-container-highest px-2 py-1 rounded text-primary/80 border border-primary/20">FIFA: ${fifa}</span>` : ""}
          </div>
          <div class="pt-2">
            <span class="font-label-caps text-label-caps text-on-surface-variant">Class</span>
            <div class="text-primary font-bold text-xl tracking-tighter">${citizenClass}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats grid -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Population -->
      <div class="bg-surface-container border border-outline-variant/30 p-4 rounded-lg space-y-2">
        <div class="flex justify-between items-center">
          <span class="font-label-caps text-label-caps text-secondary-fixed">POWER LEVEL (UNIT COUNT)</span>
          <span class="font-stat-value text-stat-value text-secondary-fixed">${popDisplay}</span>
        </div>
        <div class="h-2 bg-surface-container-lowest border border-outline-variant/20 rounded-full overflow-hidden">
          <div class="h-full bg-secondary-fixed shadow-[0_0_8px_rgba(255,225,109,0.5)]" style="width: ${popBarWidth}%"></div>
        </div>
        <p class="text-[10px] font-label-caps text-on-surface-variant uppercase">Total Population Density Score</p>
      </div>
      <!-- Area -->
      <div class="bg-surface-container border border-outline-variant/30 p-4 rounded-lg space-y-2">
        <div class="flex justify-between items-center">
          <span class="font-label-caps text-label-caps text-primary">TERRITORY SIZE (SQ KM)</span>
          <span class="font-stat-value text-stat-value text-primary">${area.toLocaleString()}</span>
        </div>
        <div class="h-2 bg-surface-container-lowest border border-outline-variant/20 rounded-full overflow-hidden">
          <div class="h-full bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.5)]" style="width: ${areaBarWidth}%"></div>
        </div>
        <p class="text-[10px] font-label-caps text-on-surface-variant uppercase">Land Mass Engagement Area</p>
      </div>
      <!-- Membership -->
      <div class="bg-surface-container border border-outline-variant/30 p-4 rounded-lg space-y-2">
        <div class="flex justify-between items-center">
          <span class="font-label-caps text-label-caps text-tertiary-fixed">GUILD MEMBERSHIP</span>
          <span class="font-stat-value text-stat-value text-tertiary-fixed">${unStatus}</span>
        </div>
        <div class="flex gap-2">
          ${
            isUnMember
              ? `<span class="text-[9px] font-label-caps bg-tertiary/10 text-tertiary px-1 border border-tertiary/30 rounded">UN_MEMBER</span>`
              : `<span class="text-[9px] font-label-caps bg-outline/10 text-outline px-1 border border-outline/30 rounded">NON_MEMBER</span>`
          }
          ${
            isIndependent
              ? `<span class="text-[9px] font-label-caps bg-tertiary/10 text-tertiary px-1 border border-tertiary/30 rounded">SOVEREIGN</span>`
              : ""
          }
        </div>
        <p class="text-[10px] font-label-caps text-on-surface-variant uppercase">
          Independent: ${isIndependent ? "Verified" : "Unverified"}
        </p>
      </div>
    </section>

    <!-- Two column -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Geography -->
      <section class="space-y-4">
        <h3 class="font-label-caps text-label-caps text-primary tracking-widest pl-2 border-l-2 border-primary-container">ADJACENT_SECTORS</h3>
        <div class="bg-surface-container border border-outline-variant/20 rounded-lg p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">REGION_SECTOR</span>
              <div class="text-primary font-bold text-sm">${subregion.toUpperCase().replace(/ /g, "_")}</div>
            </div>
            <div>
              <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">CAPITAL_NODE</span>
              <div class="text-primary font-bold text-sm uppercase">${capital}</div>
            </div>
          </div>
          <div>
            <span class="font-label-caps text-[10px] text-on-surface-variant block mb-2">NEIGHBORING_NODES</span>
            <div class="flex flex-wrap gap-2">${borderBadges}</div>
          </div>
          <div class="pt-2 border-t border-outline-variant/10">
            <span class="font-label-caps text-[10px] text-tertiary-fixed block mb-2 tracking-widest">ENVIRONMENTAL_MODIFIERS</span>
            <div class="flex gap-4">
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-on-surface-variant" data-icon="water_drop">water_drop</span>
                <span class="text-[10px] font-label-caps text-on-surface-variant">LANDLOCKED: ${landlocked}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-on-surface-variant" data-icon="my_location">my_location</span>
                <span class="text-[10px] font-label-caps text-on-surface-variant">COORD: ${coordDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Global Protocols -->
        <h3 class="font-label-caps text-label-caps text-secondary-fixed tracking-widest pl-2 border-l-2 border-secondary-container mt-8">GLOBAL_PROTOCOLS</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-surface-container p-3 rounded border border-outline-variant/20 neon-glow transition-all">
            <span class="font-label-caps text-[9px] text-on-surface-variant block">CURRENCY</span>
            <div class="text-secondary-fixed font-bold">${currency.toUpperCase()}</div>
          </div>
          <div class="bg-surface-container p-3 rounded border border-outline-variant/20 neon-glow transition-all">
            <span class="font-label-caps text-[9px] text-on-surface-variant block">DRIVING_SIDE</span>
            <div class="text-secondary-fixed font-bold uppercase">${drivingSide}</div>
          </div>
          <div class="bg-surface-container p-3 rounded border border-outline-variant/20 neon-glow transition-all">
            <span class="font-label-caps text-[9px] text-on-surface-variant block">NETWORK_DOMAIN</span>
            <div class="text-secondary-fixed font-bold">${tld}</div>
          </div>
          <div class="bg-surface-container p-3 rounded border border-outline-variant/20 neon-glow transition-all">
            <span class="font-label-caps text-[9px] text-on-surface-variant block">DIALING_PREFIX</span>
            <div class="text-secondary-fixed font-bold">${dialCode}</div>
          </div>
        </div>
      </section>

      <!-- People & Map -->
      <section class="space-y-4">
        <h3 class="font-label-caps text-label-caps text-primary tracking-widest pl-2 border-l-2 border-primary-container">SYSTEM_ATTRIBUTES</h3>
        <div class="bg-surface-container border border-outline-variant/20 rounded-lg p-5 space-y-4">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">PRIMARY_COMMUNICATIONS</span>
              <div class="flex gap-2 flex-wrap">
                <span class="text-primary font-bold text-sm bg-primary/10 px-2 rounded">${language}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">SERVER_REFRESH</span>
              <div class="text-tertiary-fixed font-bold text-sm">${startOfWeek}</div>
            </div>
          </div>
        </div>

        <h3 class="font-label-caps text-label-caps text-primary tracking-widest pl-2 border-l-2 border-primary-container mt-8">TACTICAL_LOCATION</h3>
        <div class="relative w-full aspect-video rounded-xl overflow-hidden border border-primary-container/30 bg-surface-container-lowest">
          <iframe
            title="Map of ${commonName}"
            src="${mapSrc}"
            class="w-full h-full opacity-70 grayscale contrast-125"
            style="border:none"
            loading="lazy"
          ></iframe>
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#00f0ff]"></div>
            </div>
          </div>
          <div class="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
            <span class="font-label-caps text-[10px] bg-surface-container-lowest/80 text-primary px-2 py-0.5 rounded backdrop-blur-sm border border-primary/20">
              TARGET_LOCK: ${capital.toUpperCase()}
            </span>
            <div class="flex gap-2 pointer-events-auto">
              <a class="font-label-caps text-[9px] bg-primary/20 hover:bg-primary/40 text-primary px-2 py-1 rounded backdrop-blur-sm transition-all border border-primary/30 flex items-center gap-1"
                href="${googleMaps}" target="_blank" rel="noopener noreferrer">
                <span class="material-symbols-outlined text-[12px]" data-icon="map">map</span>
                GOOGLE_MAPS
              </a>
              <a class="font-label-caps text-[9px] bg-primary/20 hover:bg-primary/40 text-primary px-2 py-1 rounded backdrop-blur-sm transition-all border border-primary/30 flex items-center gap-1"
                href="${osmLink}" target="_blank" rel="noopener noreferrer">
                <span class="material-symbols-outlined text-[12px]" data-icon="open_in_new">open_in_new</span>
                OSM_WAYPOINT
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

// ============================================================
// SEARCH
// ============================================================

async function search() {
  const query = searchInput.value.trim();

  if (!query) return;
  if (query === currentCountry) return;

  currentCountry = query;
  renderLoading();

  try {
    const country = await fetchCountry(query);
    const borders = await fetchBorders(country.borders ?? []);
    renderProfile(country, borders);
  } catch (error) {
    renderError(error.message);
    currentCountry = "";
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") search();
});

// ============================================================
// MICRO-INTERACTIONS (Stitch-generated — run after render)
// Attached via event delegation so they work on dynamic cards
// ============================================================

results.addEventListener(
  "mouseenter",
  (event) => {
    const card = event.target.closest(
      ".bg-surface-container, .bg-surface-container-high",
    );
    if (!card) return;
    card.style.transform = "translateY(-2px)";
    card.style.borderColor = "rgba(0, 240, 255, 0.4)";
  },
  true,
);

results.addEventListener(
  "mouseleave",
  (event) => {
    const card = event.target.closest(
      ".bg-surface-container, .bg-surface-container-high",
    );
    if (!card) return;
    card.style.transform = "translateY(0)";
    card.style.borderColor = "rgba(59, 73, 75, 0.2)";
  },
  true,
);

// CRT flicker effect
setInterval(() => {
  document.querySelectorAll(".animate-pulse, .neon-glow").forEach((el) => {
    if (Math.random() > 0.99) {
      el.style.opacity = "0.5";
      setTimeout(() => (el.style.opacity = "1"), 50);
    }
  });
}, 200);
