// Map initialization
let map;
let markers = [];
let currentMarker = null;

// Map layer configuration (multiple backup sources)
const mapLayers = [
    {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },
    {
        name: 'CartoDB Positron',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '© OpenStreetMap contributors © CARTO'
    },
    {
        name: 'CartoDB Voyager',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '© OpenStreetMap contributors © CARTO'
    },
    {
        name: 'Esri World Street Map',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri'
    }
];

let currentLayerIndex = 0;

// Initialize map
function initMap() {
    // Create map, center set to cover Slovenia, Northern Italy, Dolomites, Switzerland, Austria, and France
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([46.3, 9.0], 7);
    
    // Try to add map layer, if fails try next one
    addMapLayer(0);
    
    // Ensure map renders with correct size
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
    
    // Add all location markers
    addLocationMarkers();
    
    // Render location list
    renderLocationList();
}

// Add map layer (with error handling)
function addMapLayer(index) {
    if (index >= mapLayers.length) {
        console.error('All map sources failed to load');
        // Show error message
        const mapDiv = document.getElementById('map');
        mapDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:16px;font-family:\'Outfit\',sans-serif;">Map loading failed, please check your network connection</div>';
        return;
    }
    
    const layerConfig = mapLayers[index];
    currentLayerIndex = index;
    
    try {
        const tileLayer = L.tileLayer(layerConfig.url, {
            attribution: layerConfig.attribution,
            maxZoom: 19,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });
        
        // Listen for load errors
        tileLayer.on('tileerror', function(error, tile) {
            console.warn('Map tile loading failed, trying next source...', error);
            // Try next map source
            if (index < mapLayers.length - 1) {
                map.removeLayer(tileLayer);
                addMapLayer(index + 1);
            }
        });
        
        tileLayer.addTo(map);
        console.log('Successfully loaded map source:', layerConfig.name);
    } catch (error) {
        console.error('Map layer creation failed:', error);
        // Try next map source
        if (index < mapLayers.length - 1) {
            addMapLayer(index + 1);
        }
    }
}

// Add location markers
function addLocationMarkers() {
    locations.forEach(location => {
        // Create custom icon based on region
        let markerClass = 'custom-marker'; // default Slovenia
        if (location.region === 'italy') {
            markerClass = 'custom-marker-italy';
        } else if (location.region === 'dolomites') {
            markerClass = 'custom-marker-dolomites';
        } else if (location.region === 'switzerland') {
            markerClass = 'custom-marker-switzerland';
        } else if (location.region === 'austria') {
            markerClass = 'custom-marker-austria';
        } else if (location.region === 'france') {
            markerClass = 'custom-marker-france';
        } else if (location.region === 'germany') {
            markerClass = 'custom-marker-germany';
        }
        
        const customIcon = L.divIcon({
            className: markerClass,
            html: '',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        // Create marker
        const marker = L.marker([location.lat, location.lng], {
            icon: customIcon
        }).addTo(map);
        
        // Add click event
        marker.on('click', () => {
            showLocationDetails(location);
            highlightLocation(location.id);
        });
        
        // Add hover tooltip
        marker.bindTooltip(location.name, {
            permanent: false,
            direction: 'top',
            offset: [0, -10]
        });
        
        markers.push({
            marker: marker,
            location: location
        });
    });
}

// Render location list
function renderLocationList() {
    const listContainer = document.getElementById('locationList');
    listContainer.innerHTML = '';
    
    locations.forEach(location => {
        const item = document.createElement('div');
        item.className = 'location-item';
        item.dataset.id = location.id;
        
        let regionBadge = '<span class="region-badge region-slovenia">Slovenia</span>';
        if (location.region === 'italy') {
            regionBadge = '<span class="region-badge region-italy">Italy</span>';
        } else if (location.region === 'dolomites') {
            regionBadge = '<span class="region-badge region-dolomites">Dolomites</span>';
        } else if (location.region === 'switzerland') {
            regionBadge = '<span class="region-badge region-switzerland">Switzerland</span>';
        } else if (location.region === 'austria') {
            regionBadge = '<span class="region-badge region-austria">Austria</span>';
        } else if (location.region === 'france') {
            regionBadge = '<span class="region-badge region-france">France</span>';
        } else if (location.region === 'germany') {
            regionBadge = '<span class="region-badge region-germany">Germany</span>';
        }
        
        item.innerHTML = `
            <div class="location-name">${location.name} ${regionBadge}</div>
            <div class="location-meta">
                <span>${location.distance}</span>
                <span>${location.duration}</span>
                <span>${location.bestSeason}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            showLocationDetails(location);
            highlightLocation(location.id);
            // Center map on this location
            map.setView([location.lat, location.lng], 12);
        });
        
        listContainer.appendChild(item);
    });
}

// Show location details
function showLocationDetails(location) {
    const modal = document.getElementById('locationModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2 class="modal-title">${location.name}</h2>
        <div class="modal-meta">
            <div class="modal-meta-item">
                <strong>Distance:</strong> ${location.distance}
            </div>
            <div class="modal-meta-item">
                <strong>Duration:</strong> ${location.duration}
            </div>
            <div class="modal-meta-item">
                <strong>Best Season:</strong> ${location.bestSeason}
            </div>
        </div>
        <div class="modal-description">${location.description.replace(/\|/g, '<br><br>')}</div>
    `;
    
    modal.classList.add('show');
}

// Highlight selected location
function highlightLocation(locationId) {
    // Remove all highlights
    document.querySelectorAll('.location-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add current highlight
    const activeItem = document.querySelector(`.location-item[data-id="${locationId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('locationModal');
    modal.classList.remove('show');
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// Close sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if Leaflet loaded successfully
    if (typeof L === 'undefined') {
        console.error('Leaflet.js not loaded, please check network connection');
        const mapDiv = document.getElementById('map');
        mapDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:16px;flex-direction:column;gap:10px;font-family:\'Outfit\',sans-serif;"><div>Map library failed to load</div><div style="font-size:14px;">Please check your network connection or refresh the page</div></div>';
        return;
    }
    
    // Check if data loaded successfully
    if (typeof locations === 'undefined') {
        console.error('Location data not loaded, please check data.js file');
    }
    
    // Initialize map
    try {
        initMap();
    } catch (error) {
        console.error('Map initialization failed:', error);
        const mapDiv = document.getElementById('map');
        mapDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:16px;font-family:\'Outfit\',sans-serif;">Map initialization failed, please refresh and try again</div>';
    }
    
    // Modal close button
    document.getElementById('closeModal').addEventListener('click', closeModal);
    
    // Click outside modal to close
    document.getElementById('locationModal').addEventListener('click', (e) => {
        if (e.target.id === 'locationModal') {
            closeModal();
        }
    });
    
    // Sidebar toggle button
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    
    // Sidebar close button
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
    
    // ESC key to close modal and sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeSidebar();
        }
    });
});