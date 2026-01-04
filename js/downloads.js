const fetchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function cachedFetch(url, options = {}) {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = fetchCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.response.clone();
  }
  
  const response = await fetch(url, {
    ...options,
    cache: options.cache || 'default'
  });
  
  if (response.ok) {
    fetchCache.set(cacheKey, {
      response: response.clone(),
      timestamp: now
    });
  }
  
  return response;
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.downloads-grid');
  const loading = document.querySelector('.loading-state');

  // Updated Data Source: AfterlifeOS GitHub Repo
  const DATA_URL = 'https://raw.githubusercontent.com/AfterlifeOS/device_afterlife_ota/refs/heads/16/devices.json';

  try {
    if(loading) loading.style.display = 'flex';

    const deviceInfoRes = await cachedFetch(DATA_URL, {
      cache: 'default'
    });
    
    if (!deviceInfoRes.ok) {
      throw new Error(`Failed to fetch device info: ${deviceInfoRes.status}`);
    }
    
    const deviceData = await deviceInfoRes.json();
    // processDevices expects an array. In our new devices.json, it's { "devices": [...] }
    const processedDevices = processDevices(deviceData.devices || []);
    
    const loadDevices = async () => {
      const deviceElements = await createDeviceElements(processedDevices);
      
      if(grid) {
          grid.innerHTML = '';
          const fragment = document.createDocumentFragment();
          if (deviceElements.length === 0) {
             grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;"><p>No devices found.</p></div>';
          } else {
             deviceElements.forEach(element => {
               element.style.display = 'block';
               fragment.appendChild(element);
             });
             grid.appendChild(fragment);

             // Attempt to detect and highlight user's device
             detectAndHighlightDevice(processedDevices, grid);
          }
      }

      initFilters();
      initSearch();
      initModalLogic();
      if(loading) loading.style.display = 'none';
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadDevices, { timeout: 2000 });
    } else {
      setTimeout(loadDevices, 0);
    }
  } catch (error) {
    console.error('Error loading devices:', error);
    if(grid) {
        grid.innerHTML = `
        <div class="error" style="text-align:center; color: var(--error-red); padding: 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Failed to load devices. Please try again later.</p>
        </div>
        `;
    }
    if(loading) loading.style.display = 'none';
  }
});

function processDevices(devices) {
  return devices.map(device => {
    // Our generate_devices_json.py creates 'name', 'codename', 'brand', 'maintainer'
    const brandName = getDeviceBrand(device.name); // Using name for brand detection if brand field is generic
    const originalCodename = device.codename;
    
    // Use the external image URL provided in the JSON (merged from device_images.json)
    // If empty, it will fall back to onerror in HTML
    const imageUrl = device.image_url || '';
    
    const statusValue = device.status || 'Active';
    const isActive = String(statusValue).toLowerCase() === 'active';
    
    return {
      name: device.name,
      codename: device.codename,
      brand: device.brand || brandName,
      maintainer: device.maintainer,
      github_username: device.github_username || device.maintainer.split(' ')[0], // simple heuristic
      support_group: device.support_group || '',
      image_url: imageUrl,
      pling_id: device.pling_id, // Added missing field
      status: isActive ? 'active' : 'inactive'
    };
  });
}

function createDeviceElements(devices) {
  const usedCodenames = new Set();

  return Promise.all(
    devices.map(async (device) => {
      try {
        if (usedCodenames.has(device.codename)) return null;
        usedCodenames.add(device.codename);

        const element = document.createElement('div');
        element.className = 'device-card'; // Matches style.css
        element.dataset.brand = device.brand.toLowerCase();

        // Fetch ONE updates.json containing all variants
        const buildData = await fetchUpdateJson(device.codename);
        
        let gms = null;
        let vanilla = null;
        let gmsLabel = 'GApps'; // Default label
        
        if (buildData && buildData.variants) {
            // Priority logic for GApps variants
            if (buildData.variants.gapps) {
                gms = buildData.variants.gapps;
                gmsLabel = 'GApps';
            } else if (buildData.variants.basicgapps) {
                gms = buildData.variants.basicgapps;
                gmsLabel = 'BasicGApps';
            } else if (buildData.variants.coregapps) {
                gms = buildData.variants.coregapps;
                gmsLabel = 'CoreGApps';
            }
            
            vanilla = buildData.variants.vanilla || null;
        }

        let variantsHtml = '';
        if (buildData && buildData.variants) {
            if (buildData.variants.gapps) variantsHtml += '<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(0,194,255,0.2); color: var(--color-secondary); margin-right: 4px;">Full</span>';
            if (buildData.variants.basicgapps) variantsHtml += '<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(0,194,255,0.2); color: var(--color-secondary); margin-right: 4px;">Basic</span>';
            if (buildData.variants.coregapps) variantsHtml += '<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(0,194,255,0.2); color: var(--color-secondary); margin-right: 4px;">Core</span>';
            if (buildData.variants.vanilla) variantsHtml += '<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,165,0,0.2); color: orange; margin-right: 4px;">Vanilla</span>';
        }

        const imageUrl = device.image_url;
        const fallbackImageUrl = '/img/fallback.webp';

        element.dataset.deviceName = device.name;
        element.dataset.codename = device.codename;
        element.dataset.maintainer = device.maintainer;
        element.dataset.githubUsername = device.github_username;
        element.dataset.imageUrl = imageUrl;
        element.dataset.supportGroup = device.support_group || '';
        element.dataset.plingId = device.pling_id || ''; // Store Pling ID
        
        // Store all variants raw for the modal to process
        element.dataset.variants = (buildData && buildData.variants) ? JSON.stringify(buildData.variants) : '{}';
        
        element.innerHTML = `
          <div style="text-align: center;">
            <img 
              src="${imageUrl}"
              alt="${device.name}"
              style="width: 100%; height: 160px; object-fit: contain; margin-bottom: 15px; filter: drop-shadow(0 0 15px var(--color-primary));"
              onerror="this.src='${fallbackImageUrl}'"
            />
            <h3 style="font-size: 1.1rem; margin-bottom: 5px;">${device.name}</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; font-family: monospace; margin-bottom: 10px;">${device.codename}</p>
            
            <div style="display: flex; justify-content: center; gap: 5px; margin-bottom: 15px; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${device.status === 'active' ? 'rgba(0,255,157,0.2); color: var(--color-primary)' : 'rgba(255, 77, 77, 0.2); color: #ff4d4d'}">
                    ${device.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                ${variantsHtml}
            </div>

            <p style="font-size: 0.9rem; color: var(--text-muted);">
                <i class="fas fa-user"></i> ${device.maintainer}
            </p>
          </div>
        `;

        return element;
      } catch (error) {
        return null;
      }
    })
  ).then(elements => elements.filter(Boolean));
}

// Replaces fetchFlavorData. Fetches the single updates.json
async function fetchUpdateJson(codename) {
  try {
    const url = `https://raw.githubusercontent.com/AfterlifeOS/device_afterlife_ota/refs/heads/16/${codename}/updates.json`;
    const res = await cachedFetch(url, { cache: 'default' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response && data.response[0] ? data.response[0] : null;
  } catch (error) {
    return null;
  }
}

function formatBytes(bytes, decimals = 1) {
    if (!bytes) return 'Unknown Size';
    // If bytes is a string (some JSONs have string sizes), try parsing it
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(numBytes) || numBytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown Date';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function renderVariantInfo(variants) {
  if (!variants || Object.keys(variants).length === 0) {
      return '<p style="text-align: center; color: var(--text-muted);">No build details available.</p>';
  }

  let html = '<div class="variant-list" style="display: flex; flex-direction: column; gap: 15px;">';
  
  // Define display order and labels
  const typeMap = {
      'gapps': 'Full', // Changed from GApps to Full
      'basicgapps': 'BasicGApps',
      'coregapps': 'CoreGApps',
      'vanilla': 'Vanilla'
  };

  // Iterate through keys to find available variants
  for (const [key, build] of Object.entries(variants)) {
      if (!build) continue;
      
      const label = typeMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
      
      html += `
        <div class="variant-item" style="background: var(--bg-card); padding: 15px; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                <strong style="color: var(--color-primary); font-size: 1.1rem;">${label}</strong>
                <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;">v${build.version}</span>
            </div>
            
            <div style="font-size: 0.9rem; display: grid; grid-template-columns: 85px minmax(0, 1fr); gap: 5px; align-items: baseline;">
                <span style="color: var(--text-muted);">Filename:</span>
                <span style="word-break: break-all;">${build.filename}</span>
                
                <span style="color: var(--text-muted);">Size:</span>
                <span>${formatBytes(build.size)}</span>
                
                <span style="color: var(--text-muted);">Date:</span>
                <span>${formatDate(build.timestamp || build.datetime)}</span>
                
                <span style="color: var(--text-muted);">MD5:</span>
                <span style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">${build.md5}</span>
            </div>
        </div>
      `;
  }
  
  html += '</div>';
  return html;
}

async function fetchDeviceChangelog(codename) {
  try {
    // Try plural 'changelogs.md' first (seen in devonf)
    const urlMdPlural = `https://raw.githubusercontent.com/AfterlifeOS/device_afterlife_ota/refs/heads/16/${codename}/changelogs.md`;
    const resMdPlural = await cachedFetch(urlMdPlural, { cache: 'default' });
    if (resMdPlural.ok) return await resMdPlural.text();

    // Try singular 'changelog.md'
    const urlMd = `https://raw.githubusercontent.com/AfterlifeOS/device_afterlife_ota/refs/heads/16/${codename}/changelog.md`;
    const resMd = await cachedFetch(urlMd, { cache: 'default' });
    if (resMd.ok) return await resMd.text();

    // Try text file 'changelog.txt'
    const urlTxt = `https://raw.githubusercontent.com/AfterlifeOS/device_afterlife_ota/refs/heads/16/${codename}/changelog.txt`;
    const resTxt = await cachedFetch(urlTxt, { cache: 'default' });
    if (resTxt.ok) return await resTxt.text();
    
    return null;
  } catch (error) {
    return null;
  }
}

function initModalLogic() {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Event Delegation for Card Clicks
  document.querySelector('.downloads-grid')?.addEventListener('click', async (event) => {
    const deviceCard = event.target.closest('.device-card');
    if (!deviceCard) return;

    const codename = deviceCard.dataset.codename;
    const deviceName = deviceCard.dataset.deviceName;
    const maintainer = deviceCard.dataset.maintainer;
    const plingId = deviceCard.dataset.plingId;
    const variants = deviceCard.dataset.variants ? JSON.parse(deviceCard.dataset.variants) : {};
    
    // Check if any variants exist
    const hasVariants = Object.keys(variants).length > 0;

    if (!hasVariants && !plingId) {
      alert("No builds available for this device yet.");
      return;
    }

    const changelog = await fetchDeviceChangelog(codename);
    
    // Build Modal Content
    let content = `
        <h2 style="margin-bottom: 5px;">${deviceName}</h2>
        <p style="color: var(--text-muted); margin-bottom: 20px;">${codename} • by ${maintainer}</p>
        
        <!-- Main Download Action -->
        <div style="margin-bottom: 30px; text-align: center;">
            ${plingId ? 
                `<a href="https://www.pling.com/p/${plingId}" target="_blank" class="btn btn-primary" style="padding: 12px 20px; font-size: 1.1rem; width: 100%; display: inline-block; max-width: 350px; margin: 0 auto; box-sizing: border-box;">
                    <i class="fas fa-download"></i> Download from Pling
                 </a>` : 
                `<button disabled class="btn" style="opacity: 0.5; cursor: not-allowed; width: 100%; max-width: 350px;">Download link unavailable</button>`
            }
        </div>

        <div class="modal-tabs">
            <button class="tab-btn active" data-target="builds">Build Details</button>
            ${changelog ? '<button class="tab-btn" data-target="changelog">Changelog</button>' : ''}
        </div>

        <div id="view-builds">
            ${renderVariantInfo(variants)}
        </div>

        ${changelog ? `
            <div id="view-changelog" style="display: none; max-height: 300px; overflow-y: auto; background: var(--bg-surface); padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.9rem; line-height: 1.5;">
                <div style="white-space: normal;">${formatChangelog(changelog)}</div>
            </div>
        ` : ''}
    `;
    
    modalBody.innerHTML = content;

    // Modal Tab Logic
    const tabs = modalBody.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.dataset.target;
            const buildsView = modalBody.querySelector('#view-builds');
            const changelogView = modalBody.querySelector('#view-changelog');

            if(target === 'builds') {
                buildsView.style.display = 'block';
                if(changelogView) changelogView.style.display = 'none';
            } else {
                buildsView.style.display = 'none';
                if(changelogView) changelogView.style.display = 'block';
            }
        });
    });

    modalOverlay.style.display = 'flex';
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    modalOverlay.classList.add('closing');
    
    // Wait for animation to finish (300ms matches CSS transition)
    setTimeout(() => {
        modalOverlay.classList.remove('closing');
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
        modalBody.innerHTML = '';
    }, 300);
  };

  closeModalBtn?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

function initSearch() {
  const searchInput = document.getElementById('deviceSearch');
  if (!searchInput) return;

  // 1. Event Listener for Input Changes
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filterDevices(query);
    
    // Update URL without reloading
    const url = new URL(window.location);
    if (query) {
        url.searchParams.set('search', query);
    } else {
        url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url);
  });

  // 2. Check URL for existing search param on load
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  
  if (searchParam) {
      searchInput.value = searchParam;
      // Trigger filtering immediately
      filterDevices(searchParam.toLowerCase());
  }
}

function filterDevices(query) {
    const cards = document.querySelectorAll('.device-card');
    let hasVisible = false;

    cards.forEach(card => {
        const name = card.dataset.deviceName.toLowerCase();
        const codename = card.dataset.codename.toLowerCase();
        // Check if query matches name or codename
        if(name.includes(query) || codename.includes(query)) {
            card.style.display = 'block';
            hasVisible = true;
        } else {
            card.style.display = 'none';
        }
    });

    // Optional: Handle "No results" state if needed
    // const grid = document.querySelector('.downloads-grid');
    // ...
}

function initFilters() {
  const container = document.querySelector('.brand-filters');
  if(!container) return;
  // Filters can be populated here if needed
}

function getDeviceBrand(name) {
    if(/Pixel/i.test(name)) return 'google';
    if(/Xiaomi|Redmi|Poco/i.test(name)) return 'xiaomi';
    if(/Samsung/i.test(name)) return 'samsung';
    if(/OnePlus/i.test(name)) return 'oneplus';
    if(/Nothing/i.test(name)) return 'nothing';
    if(/Motorola/i.test(name)) return 'motorola';
    if(/Asus/i.test(name)) return 'asus';
    if(/Realme/i.test(name)) return 'realme';
    return 'other';
}

function formatChangelog(text) {
  if (!text) return '';
  
  // 1. Sanitize HTML to prevent XSS
  let formatted = text.replace(/[&<>'"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });

  // 2. Hide lines starting with single # and consume the following newline
  formatted = formatted.replace(/^#\s+.*\n?/gm, '');

  // 3. Style ## (H2) - Large & Bold
  formatted = formatted.replace(/^##\s+(.*)$/gm, '<div style="font-size: 1.3rem; font-weight: bold; margin-top: 10px; margin-bottom: 10px; color: var(--color-primary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">$1</div>');

  // 4. Style ### (H3) - Medium & Bold
  formatted = formatted.replace(/^###\s+(.*)$/gm, '<div style="font-size: 1.1rem; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: var(--text-main);">$1</div>');

  // 5. Convert --- to Separator
  formatted = formatted.replace(/^---+\s*$/gm, '<hr style="border: 0; border-top: 1px dashed var(--text-muted); margin: 20px 0; opacity: 0.3;">');

  // 6. Handle Bullet Points (-) with Hanging Indent
  formatted = formatted.replace(/^-\s+(.*)$/gm, `
    <div style="display: flex; align-items: flex-start; margin-bottom: 1px;">
        <span style="flex-shrink: 0; margin-right: 10px; color: var(--text-muted); user-select: none;">-</span>
        <span>$1</span>
    </div>
  `);

  // 7. Replace **text** with blue bold text (#64b5f6)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<span style="color: #64b5f6; font-weight: bold;">$1</span>');
  
  // 8. Handle remaining newlines (convert to <br>) for non-list/header text
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Cleanup: Remove ALL <br> tags immediately following our block elements to prevent double spacing
  formatted = formatted.replace(/<\/div>(<br>\s*)+/g, '</div>');
  formatted = formatted.replace(/<hr(.*?)>(<br>\s*)+/g, '<hr$1>');

  return formatted;
}

// ---------------------------
// Auto Device Detection Logic
// ---------------------------
function detectAndHighlightDevice(devices, grid) {
  if (!navigator.userAgent) return;
  const ua = navigator.userAgent.toLowerCase();

  // Try to find a match
  // 1. Check if codename exists strictly in UA (rare but accurate)
  // 2. Check if device name parts exist in UA (e.g. "Pixel 5")
  
  const matchedDevice = devices.find(device => {
      // Clean checks
      const code = device.codename.toLowerCase();
      const name = device.name.toLowerCase();
      
      // Strict codename check (avoid short strings being false positives)
      if (code.length > 3 && ua.includes(code)) return true;
      
      // Name check: Check if key parts of name are in UA
      // Example: "Samsung Galaxy S20 FE" -> check if "S20 FE" or "Galaxy S20" is in UA
      // Simple include for now
      return ua.includes(name);
  });

  if (matchedDevice) {
      // Find the card in the DOM
      const card = grid.querySelector(`.device-card[data-codename="${matchedDevice.codename}"]`);
      
      if (card) {
          // Visual Enhancements
          card.style.borderColor = 'var(--color-primary)';
          card.style.boxShadow = '0 0 30px rgba(0, 255, 157, 0.2)';
          card.style.order = '-1'; // Flexbox trick to move to top!
          
          // Add "Your Device" Badge inside the card image area or top
          const badge = document.createElement('div');
          badge.innerHTML = '<i class="fas fa-mobile-alt"></i> Your Device';
          badge.style.cssText = `
              position: absolute;
              top: 10px;
              right: 10px;
              background: var(--color-primary);
              color: #000;
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 0.8rem;
              font-weight: bold;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              z-index: 10;
          `;
          
          // Ensure card is relative for absolute positioning
          card.style.position = 'relative';
          card.appendChild(badge);
          
          // Optional: Add a "Suggested" header above the grid?
          // Since we are using order: -1, it stays in the grid.
          // To add a header, we'd need to restructure the DOM. 
          // For now, the visual highlight + top position is sufficient and clean.
      }
  }
}