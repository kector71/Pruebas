// ============================================
// BRAKE X - INTERACTIVE FUNCTIONALITY
// ============================================

// Sample Data (Mock Catalog)
const catalogData = [
    {
        id: 1,
        reference: 'BX-1234',
        position: 'delantera',
        brand: 'Bendix',
        width: 120,
        height: 52,
        fmsi: 'D1234',
        vehicles: ['Toyota Corolla 2018-2023', 'Honda Civic 2019-2024', 'Mazda 3 2020-2024'],
        image: 'https://via.placeholder.com/300x200/14b8a6/ffffff?text=BX-1234',
        equivalences: ['ATE-4561', 'Brembo-P83042', 'Bosch-BP1234']
    },
    {
        id: 2,
        reference: 'BX-5678',
        position: 'trasera',
        brand: 'Brembo',
        width: 95,
        height: 41,
        fmsi: 'D5678',
        vehicles: ['Ford Focus 2017-2022', 'Chevrolet Cruze 2016-2021'],
        image: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=BX-5678',
        equivalences: ['Bendix-DB2345', 'ATE-1362', 'Pagid-T1234']
    },
    {
        id: 3,
        reference: 'BX-9012',
        position: 'delantera',
        brand: 'Akebono',
        width: 135,
        height: 58,
        fmsi: 'D9012',
        vehicles: ['Nissan Altima 2019-2024', 'Hyundai Sonata 2020-2024', 'Kia Optima 2018-2023'],
        image: 'https://via.placeholder.com/300x200/38bdf8/ffffff?text=BX-9012',
        equivalences: ['Bosch-BP9012', 'Brembo-P28042', 'ATE-9123']
    },
    {
        id: 4,
        reference: 'BX-3456',
        position: 'trasera',
        brand: 'Bosch',
        width: 88,
        height: 38,
        fmsi: 'D3456',
        vehicles: ['Volkswagen Jetta 2015-2021', 'Audi A3 2017-2023'],
        image: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=BX-3456',
        equivalences: ['ATE-3421', 'Bendix-DB3456', 'Pagid-T5123']
    },
    {
        id: 5,
        reference: 'BX-7890',
        position: 'delantera',
        brand: 'ATE',
        width: 145,
        height: 61,
        fmsi: 'D7890',
        vehicles: ['BMW 3 Series 2018-2024', 'Mercedes C-Class 2019-2024'],
        image: 'https://via.placeholder.com/300x200/14b8a6/ffffff?text=BX-7890',
        equivalences: ['Brembo-P06042', 'Pagid-T4321', 'Bosch-BP7890']
    },
    {
        id: 6,
        reference: 'BX-2468',
        position: 'delantera',
        brand: 'Pagid',
        width: 128,
        height: 55,
        fmsi: 'D2468',
        vehicles: ['Subaru WRX 2020-2024', 'Mazda CX-5 2019-2024'],
        image: 'https://via.placeholder.com/300x200/38bdf8/ffffff?text=BX-2468',
        equivalences: ['Bendix-DB2468', 'ATE-2457', 'Bosch-BP2468']
    },
    {
        id: 7,
        reference: 'BX-1357',
        position: 'trasera',
        brand: 'Bendix',
        width: 92,
        height: 42,
        fmsi: 'D1357',
        vehicles: ['Toyota RAV4 2016-2023', 'Honda CR-V 2017-2023'],
        image: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=BX-1357',
        equivalences: ['Brembo-P28058', 'ATE-1358', 'Bosch-BP1357']
    },
    {
        id: 8,
        reference: 'BX-8024',
        position: 'delantera',
        brand: 'Brembo',
        width: 151,
        height: 64,
        fmsi: 'D8024',
        vehicles: ['Ford F-150 2018-2024', 'Chevrolet Silverado 2019-2024'],
        image: 'https://via.placeholder.com/300x200/14b8a6/ffffff?text=BX-8024',
        equivalences: ['Bosch-BP8024', 'ATE-8025', 'Pagid-T8024']
    }
];

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
// INITIALIZATION
// ============================================
function init() {
    setupEventListeners();
    applyTheme();
    renderProducts();
    updateStats();
    loadFromLocalStorage();
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
    elements.brandFilter.addEventListener('change', handleFilterChange);
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

        // Brand
        if (state.filters.brand && product.brand.toLowerCase() !== state.filters.brand.toLowerCase()) {
            return false;
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
