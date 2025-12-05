// ============================================
// BRAKE X - INTERACTIVE FUNCTIONALITY
// ============================================

// Sample Data (Mock Catalog)
// Firebase Configuration
// IMPORTANTE: Reemplaza estos valores con tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCha4S_wLxI_CZY1Tc9FOJNA3cUTggISpU",
    authDomain: "brakexadmin.firebaseapp.com",
    projectId: "brakexadmin",
    storageBucket: "brakexadmin.firebasestorage.app",
    messagingSenderId: "799264562947",
    appId: "1:799264562947:web:52d860ae41a5c4b8f75336"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Data Storage
let catalogData = [];

// State Management
let state = {
    currentTheme: 'theme-dark',
    currentAccent: 'accent-turquoise',
    filters: {
        quickSearch: '',
        brand: '',
        model: '',
        year: '',
        position: [],
        width: '',
        height: '',
        reference: '',
        fmsi: ''
    },
    favorites: new Set(),
    compareList: new Set(),
    searchHistory: [],
    filteredData: [...catalogData]
};

// DOM Elements
const elements = {
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    themePaletteBtn: document.getElementById('themePaletteBtn'),
    themeModal: document.getElementById('themeModal'),
    closeThemeModal: document.getElementById('closeThemeModal'),

    // Search
    searchIconBtn: document.getElementById('searchIconBtn'),
    searchContainer: document.getElementById('searchContainer'),
    globalSearch: document.getElementById('globalSearch'),

    // Notifications
    notificationBtn: document.getElementById('notificationBtn'),
    notificationDropdown: document.getElementById('notificationDropdown'),

    // Filters
    quickSearch: document.getElementById('quickSearch'),
    brandFilter: document.getElementById('brandFilter'),
    brandList: document.getElementById('brandList'),
    modelFilter: document.getElementById('modelFilter'),
    yearFilter: document.getElementById('yearFilter'),
    positionFront: document.getElementById('positionFront'),
    positionRear: document.getElementById('positionRear'),
    widthFilter: document.getElementById('widthFilter'),
    heightFilter: document.getElementById('heightFilter'),
    referenceFilter: document.getElementById('referenceFilter'),
    fmsiFilter: document.getElementById('fmsiFilter'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),

    // Results
    productGrid: document.getElementById('productGrid'),
    totalReferences: document.getElementById('totalReferences'),
    totalApplications: document.getElementById('totalApplications'),

    // Actions
    historyBtn: document.getElementById('historyBtn'),
    favoritesBtn: document.getElementById('favoritesBtn'),
    compareBtn: document.getElementById('compareBtn'),
    compareCount: document.getElementById('compareCount'),

    // Modal
    detailModal: document.getElementById('detailModal'),
    closeDetailModal: document.getElementById('closeDetailModal'),
    modalBody: document.getElementById('modalBody')
};

// ============================================
// DATA FETCHING
// ============================================
function fetchData() {
    // Show loading state initially
    if (catalogData.length === 0) {
        elements.productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div class="loader" style="margin: 0 auto 20px; border: 4px solid var(--surface-tertiary); border-top: 4px solid var(--accent-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                <h3 style="color: var(--text-primary);">Cargando catálogo...</h3>
            </div>
        `;
    }

    // Listen for real-time updates
    db.collection('pastillas').onSnapshot((snapshot) => {
        let changes = snapshot.docChanges();
        let isInitialLoad = catalogData.length === 0;

        // Process changes for notifications
        if (!isInitialLoad) {
            changes.forEach(change => {
                const data = change.doc.data();
                const refName = Array.isArray(data.ref) ? data.ref[0] : (data.ref || 'Referencia');

                if (change.type === 'added') {
                    addNotification('Nueva Referencia', `Se ha agregado ${refName} al catálogo.`);
                }
                if (change.type === 'modified') {
                    addNotification('Actualización', `La referencia ${refName} ha sido actualizada.`);
                }
            });
        }

        // Update catalog data
        const products = [];
        snapshot.forEach(doc => {
            products.push(mapProductData(doc.id, doc.data()));
        });

        catalogData = products;

        // Re-apply filters and render
        applyFilters();
        updateStats();
        populateBrandFilter();

    }, (error) => {
        console.error("Error fetching data:", error);
        elements.productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <h3 style="color: var(--status-error);">Error al cargar datos</h3>
                <p style="color: var(--text-secondary);">Por favor verifica tu conexión o configuración.</p>
                <p style="font-size: 12px; color: var(--text-tertiary); margin-top: 10px;">${error.message}</p>
            </div>
        `;
    });
}

function addNotification(title, message) {
    const list = document.querySelector('.notification-list');
    const badge = document.getElementById('notificationBadge');

    if (!list || !badge) return;

    const item = document.createElement('div');
    item.className = 'notification-item unread';
    item.innerHTML = `
        <div class="notification-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M2 12h20"></path>
            </svg>
        </div>
        <div class="notification-content">
            <p class="notification-text"><strong>${title}</strong>: ${message}</p>
            <span class="notification-time">Justo ahora</span>
        </div>
    `;

    // Add to top
    list.insertBefore(item, list.firstChild);

    // Update badge
    let count = parseInt(badge.textContent) || 0;
    badge.textContent = count + 1;
    badge.style.display = 'flex';

    // Optional: Show toast or visual cue
    const btn = document.getElementById('notificationBtn');
    btn.classList.add('shake-animation');
    setTimeout(() => btn.classList.remove('shake-animation'), 500);
}

function mapProductData(id, data) {
    // Helper to extract width/height from "medidas" string (e.g., "104.4 x 56.3")
    let width = 0;
    let height = 0;

    if (data.medidas) {
        let medidasStr = Array.isArray(data.medidas) ? data.medidas[0] : data.medidas;
        if (medidasStr) {
            const parts = medidasStr.toLowerCase().split('x').map(s => parseFloat(s.trim()));
            if (parts.length >= 2) {
                width = parts[0] || 0;
                height = parts[1] || 0;
            }
        }
    }

    // Map vehicles from aplicaciones array
    const vehicles = data.aplicaciones ? data.aplicaciones.map(app => {
        return `${app.marca} ${app.serie} ${app.año}`;
    }) : [];

    // Extract unique vehicle brands
    const vehicleBrands = data.aplicaciones ? [...new Set(data.aplicaciones.map(app => app.marca))] : [];

    // Determine brand (using first application brand as fallback or generic)
    // In the original mock data, 'brand' was the part manufacturer. 
    // Here we might not have it, so we'll use a placeholder or derive it.
    // For now, let's use "Brake X" as the brand if not specified.
    const brand = "Brake X";

    return {
        id: id, // Firestore Doc ID
        reference: Array.isArray(data.ref) ? data.ref.join(' / ') : (data.ref || 'N/A'),
        position: (data.posición || 'Desconocida').toLowerCase(),
        brand: brand,
        vehicleBrands: vehicleBrands,
        width: width,
        height: height,
        fmsi: Array.isArray(data.fmsi) ? data.fmsi.join(', ') : (data.fmsi || ''),
        vehicles: vehicles,
        image: (data.imagenes && data.imagenes.length > 0) ? data.imagenes[0] : 'https://via.placeholder.com/300x200/333333/ffffff?text=Sin+Imagen',
        equivalences: data.oem || []
    };
}

function populateBrandFilter() {
    // Extract all unique brands from catalogData
    const allBrands = new Set();
    catalogData.forEach(product => {
        if (product.vehicleBrands) {
            product.vehicleBrands.forEach(brand => allBrands.add(brand));
        }
    });

    // Sort brands alphabetically
    const sortedBrands = Array.from(allBrands).sort();

    // Populate datalist element
    const brandList = elements.brandList;
    if (!brandList) return;

    brandList.innerHTML = '';

    sortedBrands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        brandList.appendChild(option);
    });
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    setupEventListeners();
    applyTheme();
    loadFromLocalStorage();

    // Start fetching data
    fetchData();
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.themePaletteBtn.addEventListener('click', () => openModal(elements.themeModal));
    elements.closeThemeModal.addEventListener('click', () => closeModal(elements.themeModal));

    // Theme Palette Selection
    document.querySelectorAll('.palette-option').forEach(option => {
        option.addEventListener('click', function () {
            const accent = this.dataset.accent;
            changeAccentColor(accent);
        });
    });

    // Search
    elements.searchIconBtn.addEventListener('click', toggleSearch);
    elements.globalSearch.addEventListener('input', debounce(handleGlobalSearch, 300));

    // Notifications
    elements.notificationBtn.addEventListener('click', toggleNotifications);

    // Filters
    elements.quickSearch.addEventListener('input', debounce(handleQuickSearch, 300));
    elements.brandFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.modelFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.yearFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.positionFront.addEventListener('click', () => togglePosition('delantera'));
    elements.positionRear.addEventListener('click', () => togglePosition('trasera'));
    elements.widthFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.heightFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.referenceFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.fmsiFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.clearFiltersBtn.addEventListener('click', clearAllFilters);

    // Modal Close
    elements.closeDetailModal.addEventListener('click', () => closeModal(elements.detailModal));

    // Click outside to close modals
    elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) {
            closeModal(elements.detailModal);
        }
    });

    elements.themeModal.addEventListener('click', (e) => {
        if (e.target === elements.themeModal) {
            closeModal(elements.themeModal);
        }
    });

    // Click outside to close notifications
    document.addEventListener('click', (e) => {
        if (!elements.notificationBtn.contains(e.target) && !elements.notificationDropdown.contains(e.target)) {
            elements.notificationDropdown.classList.remove('active');
        }
    });
}

// ============================================
// THEME MANAGEMENT
// ============================================
function toggleTheme() {
    state.currentTheme = state.currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
    applyTheme();
    saveToLocalStorage();
}

function applyTheme() {
    document.body.className = `${state.currentTheme} ${state.currentAccent}`;
}

function changeAccentColor(accent) {
    state.currentAccent = `accent-${accent}`;
    applyTheme();
    saveToLocalStorage();

    // Update active state
    document.querySelectorAll('.palette-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.accent === accent) {
            option.classList.add('active');
        }
    });
}

// ============================================
// SEARCH & FILTERS
// ============================================
function toggleSearch() {
    elements.searchContainer.classList.toggle('expanded');
    if (elements.searchContainer.classList.contains('expanded')) {
        elements.globalSearch.focus();
    }
}

function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();
    state.filters.quickSearch = query;
    applyFilters();
}

function handleQuickSearch(e) {
    const query = e.target.value.toLowerCase();
    state.filters.quickSearch = query;
    applyFilters();
}

function handleFilterChange() {
    state.filters.brand = elements.brandFilter.value;
    state.filters.model = elements.modelFilter.value.toLowerCase();
    state.filters.year = elements.yearFilter.value;
    state.filters.width = elements.widthFilter.value;
    state.filters.height = elements.heightFilter.value;
    state.filters.reference = elements.referenceFilter.value.toLowerCase();
    state.filters.fmsi = elements.fmsiFilter.value.toLowerCase();

    applyFilters();
}

function togglePosition(position) {
    const index = state.filters.position.indexOf(position);

    if (index === -1) {
        state.filters.position.push(position);
    } else {
        state.filters.position.splice(index, 1);
    }

    // Update button states
    if (position === 'delantera') {
        elements.positionFront.classList.toggle('active');
    } else {
        elements.positionRear.classList.toggle('active');
    }

    applyFilters();
}

function applyFilters() {
    state.filteredData = catalogData.filter(product => {
        // Quick search
        if (state.filters.quickSearch) {
            const searchLower = state.filters.quickSearch;
            const matchesSearch =
                product.reference.toLowerCase().includes(searchLower) ||
                product.brand.toLowerCase().includes(searchLower) ||
                product.vehicles.some(v => v.toLowerCase().includes(searchLower)) ||
                product.fmsi.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;
        }

        // Brand (Vehicle Brand)
        if (state.filters.brand) {
            // Check if the product has this brand in its applications
            if (!product.vehicleBrands.some(b => b.toLowerCase() === state.filters.brand.toLowerCase())) {
                return false;
            }
        }

        // Model
        if (state.filters.model) {
            const hasModel = product.vehicles.some(v => v.toLowerCase().includes(state.filters.model));
            if (!hasModel) return false;
        }

        // Year
        if (state.filters.year) {
            const hasYear = product.vehicles.some(v => v.includes(state.filters.year));
            if (!hasYear) return false;
        }

        // Position
        if (state.filters.position.length > 0) {
            if (!state.filters.position.includes(product.position)) {
                return false;
            }
        }

        // Width
        if (state.filters.width && product.width.toString() !== state.filters.width) {
            return false;
        }

        // Height
        if (state.filters.height && product.height.toString() !== state.filters.height) {
            return false;
        }

        // Reference
        if (state.filters.reference && !product.reference.toLowerCase().includes(state.filters.reference)) {
            return false;
        }

        // FMSI
        if (state.filters.fmsi && !product.fmsi.toLowerCase().includes(state.filters.fmsi)) {
            return false;
        }

        return true;
    });

    renderProducts();
    updateStats();
}

function clearAllFilters() {
    // Reset state
    state.filters = {
        quickSearch: '',
        brand: '',
        model: '',
        year: '',
        position: [],
        width: '',
        height: '',
        reference: '',
        fmsi: ''
    };

    // Reset form elements
    elements.quickSearch.value = '';
    elements.brandFilter.value = '';
    elements.modelFilter.value = '';
    elements.yearFilter.value = '';
    elements.widthFilter.value = '';
    elements.heightFilter.value = '';
    elements.referenceFilter.value = '';
    elements.fmsiFilter.value = '';
    elements.positionFront.classList.remove('active');
    elements.positionRear.classList.remove('active');

    applyFilters();
}

// ============================================
// PRODUCT RENDERING
// ============================================
function renderProducts() {
    if (state.filteredData.length === 0) {
        elements.productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; color: var(--text-tertiary);">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3 style="color: var(--text-primary); margin-bottom: 10px; font-size: 20px;">No se encontraron resultados</h3>
                <p style="color: var(--text-secondary);">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    elements.productGrid.innerHTML = state.filteredData.map(product => {
        const isFavorite = state.favorites.has(product.id);
        const isCompare = state.compareList.has(product.id);

        return `
            <div class="product-card fade-in" data-id="${product.id}">
                <div class="card-actions">
                    <button class="card-action-icon ${isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite(${product.id})"
                            aria-label="Favorito">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <button class="card-action-icon ${isCompare ? 'active' : ''}" 
                            onclick="toggleCompare(${product.id})"
                            aria-label="Comparar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 7h-9M14 17H5"></path>
                            <circle cx="6" cy="7" r="2"></circle>
                            <circle cx="18" cy="17" r="2"></circle>
                        </svg>
                    </button>
                </div>
                
                <img src="${product.image}" alt="${product.reference}" class="product-image" onclick="showProductDetail(${product.id})">
                
                <div onclick="showProductDetail(${product.id})">
                    <h3 class="product-reference">${product.reference}</h3>
                    <span class="product-position ${product.position === 'delantera' ? 'front' : 'rear'}">
                        ${product.position === 'delantera' ? 'Delantera' : 'Trasera'}
                    </span>
                    
                    <div class="product-vehicles">
                        <strong>Aplicaciones principales:</strong><br>
                        ${product.vehicles.slice(0, 2).join(', ')}
                        ${product.vehicles.length > 2 ? ` +${product.vehicles.length - 2} más` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    elements.totalReferences.textContent = state.filteredData.length;

    const totalApps = state.filteredData.reduce((sum, product) => {
        return sum + product.vehicles.length;
    }, 0);

    elements.totalApplications.textContent = totalApps.toLocaleString();
}

// ============================================
// PRODUCT DETAIL MODAL
// ============================================
function showProductDetail(id) {
    const product = catalogData.find(p => p.id === id);
    if (!product) return;

    elements.modalBody.innerHTML = `
        <div style="margin-bottom: ${getComputedStyle(document.documentElement).getPropertyValue('--spacing-lg')};">
            <h2 style="font-family: var(--font-display); font-size: 28px; margin-bottom: 8px; color: var(--text-primary);">
                ${product.reference}
            </h2>
            <span class="product-position ${product.position === 'delantera' ? 'front' : 'rear'}" 
                  style="font-size: 14px; padding: 6px 12px;">
                ${product.position === 'delantera' ? 'Posición Delantera' : 'Posición Trasera'}
            </span>
        </div>
        
        <div class="detail-section">
            <h3>Marca</h3>
            <p>${product.brand}</p>
        </div>
        
        <div class="detail-section">
            <h3>Medidas</h3>
            <p>Ancho: <strong>${product.width} mm</strong> | Altura: <strong>${product.height} mm</strong></p>
        </div>
        
        <div class="detail-section">
            <h3>Código FMSI</h3>
            <p>${product.fmsi}</p>
        </div>
        
        <div class="detail-section">
            <h3>Referencias Equivalentes</h3>
            <ul>
                ${product.equivalences.map(eq => `<li>${eq}</li>`).join('')}
            </ul>
        </div>
        
        <div class="detail-section">
            <h3>Aplicaciones de Vehículos</h3>
            <ul>
                ${product.vehicles.map(vehicle => `<li>${vehicle}</li>`).join('')}
            </ul>
        </div>
        
        <div style="margin-top: ${getComputedStyle(document.documentElement).getPropertyValue('--spacing-xl')}; padding-top: ${getComputedStyle(document.documentElement).getPropertyValue('--spacing-lg')}; border-top: 1px solid var(--border-subtle);">
            <button class="save-current-filters-btn" onclick="alert('Funcionalidad de alertas próximamente')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span>Suscribirse a Alertas</span>
            </button>
        </div>
    `;

    openModal(elements.detailModal);
}

// ============================================
// FAVORITES & COMPARE
// ============================================
function toggleFavorite(id) {
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
    } else {
        state.favorites.add(id);
    }

    saveToLocalStorage();
    renderProducts();
}

function toggleCompare(id) {
    if (state.compareList.has(id)) {
        state.compareList.delete(id);
    } else {
        if (state.compareList.size >= 3) {
            alert('Máximo 3 productos para comparar');
            return;
        }
        state.compareList.add(id);
    }

    elements.compareCount.textContent = state.compareList.size;
    saveToLocalStorage();
    renderProducts();
}

// ============================================
// NOTIFICATIONS
// ============================================
function toggleNotifications() {
    elements.notificationDropdown.classList.toggle('active');
}

// ============================================
// MODAL UTILITIES
// ============================================
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveToLocalStorage() {
    localStorage.setItem('brakeXTheme', state.currentTheme);
    localStorage.setItem('brakeXAccent', state.currentAccent);
    localStorage.setItem('brakeXFavorites', JSON.stringify([...state.favorites]));
    localStorage.setItem('brakeXCompare', JSON.stringify([...state.compareList]));
}

function loadFromLocalStorage() {
    const savedTheme = localStorage.getItem('brakeXTheme');
    const savedAccent = localStorage.getItem('brakeXAccent');
    const savedFavorites = localStorage.getItem('brakeXFavorites');
    const savedCompare = localStorage.getItem('brakeXCompare');

    if (savedTheme) state.currentTheme = savedTheme;
    if (savedAccent) state.currentAccent = savedAccent;
    if (savedFavorites) state.favorites = new Set(JSON.parse(savedFavorites));
    if (savedCompare) state.compareList = new Set(JSON.parse(savedCompare));

    applyTheme();
    elements.compareCount.textContent = state.compareList.size;

    // Update palette active state
    const accentName = state.currentAccent.replace('accent-', '');
    document.querySelectorAll('.palette-option').forEach(option => {
        if (option.dataset.accent === accentName) {
            option.classList.add('active');
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// INITIALIZE ON DOM LOAD
// ============================================
document.addEventListener('DOMContentLoaded', init);
