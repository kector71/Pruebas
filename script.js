// ================== CLASES PRINCIPALES ==================
class AppStateManager {
    constructor() {
        this.state = {
            data: [],
            filtered: [],
            currentPage: 1,
            favorites: new Set(),
            isFavoritesMode: false,
            isLoading: false,
            activeFilters: new Map()
        };
        this.subscribers = new Set();
    }

    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.notifySubscribers(this.state, oldState);
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(newState, oldState) {
        this.subscribers.forEach(callback => callback(newState, oldState));
    }

    getState() {
        return { ...this.state };
    }
}

class SearchIndex {
    constructor(data = []) {
        this.data = data;
        this.index = new Map();
        this.buildIndex();
    }

    buildIndex() {
        this.index.clear();
        
        this.data.forEach((item, index) => {
            const searchableText = this.getSearchableText(item);
            const terms = this.tokenize(searchableText);
            
            terms.forEach(term => {
                if (!this.index.has(term)) {
                    this.index.set(term, new Set());
                }
                this.index.get(term).add(index);
            });
        });
    }

    tokenize(text) {
        return text.toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 2)
            .map(term => term.replace(/[^a-z0-9]/g, ''));
    }

    getSearchableText(item) {
        const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
        const vehicleText = safeAplicaciones.map(app => 
            `${app.marca || ''} ${app.serie || ''} ${app.litros || ''} ${app.año || ''} ${app.especificacion || ''}`
        ).join(' ');

        return [
            ...(item.ref || []),
            ...(item.oem || []),
            ...(item.fmsi || []),
            vehicleText,
            item.posición || ''
        ].join(' ').toLowerCase();
    }

    search(query) {
        if (!query.trim()) return this.data;
        
        const terms = this.tokenize(query);
        if (terms.length === 0) return this.data;

        const results = new Set();
        terms.forEach(term => {
            const matches = this.index.get(term);
            if (matches) {
                matches.forEach(index => results.add(index));
            }
        });

        return Array.from(results).map(index => this.data[index]);
    }

    updateData(newData) {
        this.data = newData;
        this.buildIndex();
    }
}

class DataManager {
    constructor(db) {
        this.db = db;
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    async getDataWithCache(collection, forceRefresh = false) {
        const cacheKey = collection;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        const request = this.fetchData(collection);
        this.pendingRequests.set(cacheKey, request);

        try {
            const data = await request;
            this.cache.set(cacheKey, data);
            return data;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    async fetchData(collection) {
        const snapshot = await this.db.collection(collection).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    clearCache() {
        this.cache.clear();
        this.pendingRequests.clear();
    }
}

class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        
        const key = `${event}-${Math.random().toString(36).substr(2, 9)}`;
        this.listeners.set(key, { element, event, handler, options });
        
        return () => this.removeEventListener(key);
    }

    removeEventListener(key) {
        const listener = this.listeners.get(key);
        if (listener) {
            const { element, event, handler, options } = listener;
            element.removeEventListener(event, handler, options);
            this.listeners.delete(key);
        }
    }

    removeAll() {
        this.listeners.forEach((listener, key) => {
            this.removeEventListener(key);
        });
    }
}

class AnimationManager {
    static fadeIn(element, duration = 300) {
        return element.animate([
            { opacity: 0, transform: 'translateY(20px) scale(0.98)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'both'
        });
    }

    static fadeOut(element, duration = 300) {
        return element.animate([
            { opacity: 1, transform: 'translateY(0) scale(1)' },
            { opacity: 0, transform: 'translateY(-20px) scale(0.98)' }
        ], {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'both'
        });
    }

    static shake(element) {
        return element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 500,
            easing: 'ease-in-out'
        });
    }
}

class ErrorHandler {
    static setupGlobalErrorHandling() {
        window.addEventListener('error', this.handleRuntimeError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    static handleRuntimeError(event) {
        console.error('Error de runtime:', event.error);
        this.showUserFriendlyError('Ocurrió un error inesperado');
    }

    static handlePromiseRejection(event) {
        console.error('Promise rechazada:', event.reason);
        this.showUserFriendlyError('Error al cargar datos');
        event.preventDefault();
    }

    static showUserFriendlyError(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 100000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            font-family: inherit;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// ================== CONSTANTES Y CONFIGURACIÓN ==================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCha4S_wLxI_CZY1Tc9FOJNA3cUTggISpU",
    authDomain: "brakexadmin.firebaseapp.com",
    projectId: "brakexadmin",
    storageBucket: "brakexadmin.firebasestorage.app",
    messagingSenderId: "799264562947",
    appId: "1:799264562947:web:52d860ae41a5c4b8f75336"
};

const APP_CONFIG = {
    itemsPerPage: 24,
    maxHistory: 5,
    searchDebounceDelay: 300,
    animationDurations: {
        fast: 150,
        base: 300,
        slow: 500
    }
};

// ================== VARIABLES GLOBALES ==================
let appState;
let searchIndex;
let dataManager;
let eventManager;
let brandColorMap = {};

// Cache de elementos DOM
const els = {};

// ================== FUNCIONES DE INICIALIZACIÓN ==================
function initializeApp() {
    try {
        // Inicializar Firebase
        firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.firestore();

        // Inicializar managers
        appState = new AppStateManager();
        dataManager = new DataManager(db);
        eventManager = new EventManager();
        searchIndex = new SearchIndex();

        // Configurar manejo de errores global
        ErrorHandler.setupGlobalErrorHandling();

        // Cargar elementos DOM
        initializeDOMElements();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Cargar estado inicial
        loadInitialState();
        
        // Cargar datos
        loadAppData();

    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showErrorState('Error al inicializar la aplicación');
    }
}

function initializeDOMElements() {
    // Elementos principales
    els.body = document.body;
    els.mainContent = document.getElementById('main-content');
    
    // Header y controles
    els.headerX = document.querySelector('.header-x');
    els.darkBtn = document.getElementById('darkBtn');
    els.sunIcon = document.querySelector('.lp-icon-sun');
    els.moonIcon = document.querySelector('.lp-icon-moon');
    els.orbitalBtn = document.getElementById('orbitalBtn');
    els.upBtn = document.getElementById('upBtn');
    els.menuBtn = document.getElementById('menuBtn');
    els.sideMenu = document.getElementById('side-menu');
    els.sideMenuOverlay = document.getElementById('side-menu-overlay');
    els.menuCloseBtn = document.getElementById('menuCloseBtn');
    els.openGuideLink = document.getElementById('open-guide-link');

    // Filtros
    els.busqueda = document.getElementById('busquedaRapida');
    els.marca = document.getElementById('filtroMarca');
    els.modelo = document.getElementById('filtroModelo');
    els.anio = document.getElementById('filtroAnio');
    els.oem = document.getElementById('filtroOem');
    els.fmsi = document.getElementById('filtroFmsi');
    els.medidasAncho = document.getElementById('medidasAncho');
    els.medidasAlto = document.getElementById('medidasAlto');
    els.posDel = document.getElementById('positionDelantera');
    els.posTras = document.getElementById('positionTrasera');
    els.clearBtn = document.getElementById('clearFiltersBtn');

    // Datalists
    els.datalistMarca = document.getElementById('marcas');
    els.datalistModelo = document.getElementById('modelos');
    els.datalistAnio = document.getElementById('anios');
    els.datalistOem = document.getElementById('oemList');
    els.datalistFmsi = document.getElementById('fmsiList');

    // Resultados
    els.results = document.getElementById('results-container');
    els.countContainer = document.getElementById('result-count-container');
    els.paginationContainer = document.getElementById('pagination-container');
    els.resultsHeaderCard = document.getElementById('results-header-card');
    els.brandTagsContainer = document.getElementById('brand-tags-container');

    // Historial
    els.searchHistoryContainer = document.getElementById('searchHistoryContainer');
    els.historyPanel = document.getElementById('historyPanel');
    els.historyListContainer = document.getElementById('historyListContainer');

    // Modales
    els.modal = document.getElementById('card-modal');
    els.modalContent = document.querySelector('#card-modal .modal-content');
    els.modalCloseBtn = document.querySelector('#card-modal .modal-close-btn');
    els.modalCarousel = document.querySelector('#card-modal .modal-image-carousel');
    els.modalRef = document.querySelector('#card-modal .modal-ref');
    els.modalPosition = document.querySelector('#card-modal .modal-position');
    els.modalAppsSpecs = document.querySelector('#card-modal .modal-apps-specs');
    els.modalDetailsWrapper = document.getElementById('modalDetailsWrapper');
    els.modalDetailsContent = document.getElementById('modalDetailsContent');
    els.modalCounterWrapper = document.getElementById('modalCounterWrapper');

    // Guía
    els.guideModal = document.getElementById('guide-modal');
    els.guideModalContent = document.querySelector('#guide-modal .modal-content');
    els.guideModalCloseBtn = document.querySelector('#guide-modal .modal-close-btn');

    // Vistas
    els.filtroFavoritosBtn = document.getElementById('filtroFavoritosBtn');
    els.historialBtn = document.getElementById('historialBtn');
    els.searchContainer = document.getElementById('searchContainer');
}

function loadInitialState() {
    loadFavorites();
    loadThemePreference();
    renderSearchHistory();
    applyFiltersFromURL();
}

// ================== FUNCIONES DE BÚSQUEDA Y FILTRADO ==================
const optimizedDebounce = (func, wait, immediate = false) => {
    let timeout;
    let lastArgs;
    let lastThis;
    
    return function executedFunction(...args) {
        lastArgs = args;
        lastThis = this;
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = null;
            if (!immediate) {
                func.apply(lastThis, lastArgs);
            }
        }, wait);
        
        if (callNow) {
            func.apply(lastThis, lastArgs);
        }
    };
};

const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
};

const getRefBadgeClass = memoize((ref) => {
    if (typeof ref !== 'string') return 'ref-default';
    const upperRef = ref.toUpperCase();
    if (upperRef.endsWith('INC')) return 'ref-inc';
    if (upperRef.endsWith('BP')) return 'ref-bp';
    if (upperRef.startsWith('K')) return 'ref-k';
    if (upperRef.endsWith('BEX')) return 'ref-bex';
    return 'ref-default';
});

const getSortableRefNumber = memoize((refArray) => {
    if (!Array.isArray(refArray) || refArray.length === 0) return Infinity;
    let primaryRef = refArray.find(ref => typeof ref === 'string' && ref.toUpperCase().startsWith('K-'));
    if (!primaryRef) primaryRef = refArray[0];
    const match = String(primaryRef).match(/(\d+)/);
    if (match && match[0]) return parseInt(match[0], 10);
    return Infinity;
});

function filterData() {
    const state = appState.getState();
    if (!state.data.length) return;

    appState.setState({ isLoading: true });

    // Usar requestAnimationFrame para no bloquear el UI
    requestAnimationFrame(() => {
        try {
            const filters = getCurrentFilters();
            let filteredData = state.data;

            // Aplicar modo favoritos primero
            if (state.isFavoritesMode) {
                filteredData = filteredData.filter(item => state.favorites.has(item._appId));
            }

            // Aplicar búsqueda de texto usando el índice
            if (filters.busqueda) {
                filteredData = searchIndex.search(filters.busqueda);
                if (state.isFavoritesMode) {
                    filteredData = filteredData.filter(item => state.favorites.has(item._appId));
                }
            }

            // Aplicar filtros restantes
            filteredData = applyRemainingFilters(filteredData, filters);

            appState.setState({
                filtered: filteredData,
                currentPage: 1,
                isLoading: false
            });

            renderCurrentPage();
            updateURLWithFilters();

        } catch (error) {
            console.error('Error en filterData:', error);
            appState.setState({ isLoading: false });
        }
    });
}

function getCurrentFilters() {
    const fbusq = (val) => val.toLowerCase().trim();
    const activePos = getPositionFilter();

    return {
        busqueda: fbusq(els.busqueda.value),
        marca: fbusq(els.marca.value),
        modelo: fbusq(els.modelo.value),
        anio: fbusq(els.anio.value),
        oem: fbusq(els.oem.value),
        fmsi: fbusq(els.fmsi.value),
        ancho: parseFloat(els.medidasAncho.value),
        alto: parseFloat(els.medidasAlto.value),
        pos: activePos
    };
}

function applyRemainingFilters(data, filters) {
    return data.filter(item => {
        const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
        const itemPosicion = item.posición;

        const appMatch = !filters.marca && !filters.modelo && !filters.anio ||
            safeAplicaciones.some(app =>
                (!filters.marca || (app.marca && app.marca.toLowerCase().includes(filters.marca))) &&
                (!filters.modelo || (app.serie && app.serie.toLowerCase().includes(filters.modelo))) &&
                (!filters.anio || (app.año && String(app.año).toLowerCase().includes(filters.anio)))
            );

        const oemMatch = !filters.oem || (Array.isArray(item.oem) && item.oem.some(o => 
            typeof o === 'string' && o.toLowerCase().includes(filters.oem)));

        const fmsiMatch = !filters.fmsi || (Array.isArray(item.fmsi) && item.fmsi.some(f => 
            typeof f === 'string' && f.toLowerCase().includes(filters.fmsi)));

        let posMatch = true;
        if (filters.pos.length > 0) {
            posMatch = filters.pos.includes(itemPosicion);
        }

        const TOLERANCIA = 1.0;
        const anchoMatch = !filters.ancho || (
            item.anchoNum >= filters.ancho - TOLERANCIA && 
            item.anchoNum <= filters.ancho + TOLERANCIA
        );

        const altoMatch = !filters.alto || (
            item.altoNum >= filters.alto - TOLERANCIA && 
            item.altoNum <= filters.alto + TOLERANCIA
        );

        return appMatch && oemMatch && fmsiMatch && posMatch && anchoMatch && altoMatch;
    });
}

function getPositionFilter() {
    const activePositions = [];
    if (els.posDel.classList.contains('active')) activePositions.push('Delantera');
    if (els.posTras.classList.contains('active')) activePositions.push('Trasera');
    return activePositions;
}

// ================== RENDERIZADO Y PAGINACIÓN ==================
function showSkeletonLoader(count = 6) {
    const skeletonHTML = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-box"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
        </div>
    `).join('');

    els.results.innerHTML = skeletonHTML;
    els.paginationContainer.innerHTML = '';
}

function renderCurrentPage() {
    const state = appState.getState();
    const totalResults = state.filtered.length;
    const startIndex = (state.currentPage - 1) * APP_CONFIG.itemsPerPage;
    const endIndex = startIndex + APP_CONFIG.itemsPerPage;
    const paginatedData = state.filtered.slice(startIndex, endIndex);

    // Actualizar contador
    const startNum = totalResults === 0 ? 0 : startIndex + 1;
    const endNum = Math.min(endIndex, totalResults);
    els.countContainer.innerHTML = `Mostrando <strong>${startNum}–${endNum}</strong> de <strong>${totalResults}</strong> resultados`;

    // Manejar estado vacío
    if (totalResults === 0) {
        renderEmptyState();
        return;
    }

    // Renderizar resultados
    renderResults(paginatedData, startIndex);
    setupPagination(totalResults);
}

function renderEmptyState() {
    const state = appState.getState();
    const message = state.isFavoritesMode
        ? 'No tienes favoritos guardados'
        : 'No se encontraron pastillas';
    const subMessage = state.isFavoritesMode
        ? 'Haz clic en el corazón de una pastilla para guardarla.'
        : 'Intenta ajustar tus filtros de búsqueda.';

    els.results.innerHTML = `
        <div class="no-results-container">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"></path>
                <path d="M21 21L16.65 16.65"></path>
                <path d="M11 8V11L13 13"></path>
            </svg>
            <p>${message}</p>
            <span>${subMessage}</span>
        </div>
    `;
    els.paginationContainer.innerHTML = '';
}

function renderResults(data, startIndex) {
    const fragment = document.createDocumentFragment();
    
    data.forEach((item, index) => {
        const cardElement = createCardElement(item, startIndex + index);
        fragment.appendChild(cardElement);
    });

    els.results.innerHTML = '';
    els.results.appendChild(fragment);

    // Configurar event listeners para los botones de favoritos
    els.results.querySelectorAll('.favorite-btn').forEach(btn => {
        eventManager.addEventListener(btn, 'click', toggleFavorite);
    });
}

function createCardElement(item, index) {
    const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
    const posBadge = `<span class="position-badge ${posBadgeClass}">${item.posición}</span>`;
    
    const refsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
        ? item.ref.flatMap(ref => String(ref).split(' '))
            .map(part => `<span class="ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
            .join('')
        : '<span class="ref-badge ref-badge-na">N/A</span>';

    const firstImageSrc = getFirstImageSrc(item);
    const appSummaryHTML = generateAppSummaryHTML(item);
    const isFavorite = appState.getState().favorites.has(item._appId);

    const card = document.createElement('div');
    card.className = 'result-card';
    card.dataset.id = item._appId;
    card.style.animationDelay = `${index * 50}ms`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-haspopup', 'dialog');

    card.innerHTML = `
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                data-id="${item._appId}" 
                aria-label="Marcar como favorito" 
                aria-pressed="${isFavorite}">
            <svg class="heart-icon" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
        </button>
        <div class="card-thumbnail">
            <img src="${firstImageSrc}" 
                 alt="Referencia ${getPrimaryRef(item)}" 
                 class="result-image" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200.png?text=No+Img'">
        </div>
        <div class="card-content-wrapper">
            <div class="card-details">
                <div class="card-ref-container">${refsHTML}</div>
                ${posBadge}
            </div>
            ${appSummaryHTML}
        </div>
    `;

    return card;
}

function getFirstImageSrc(item) {
    if (item.imagenes && item.imagenes.length > 0) {
        return item.imagenes[0];
    } else if (item.imagen) {
        return item.imagen.replace("text=", `text=Vista+1+`);
    }
    return 'https://via.placeholder.com/300x200.png?text=No+Img';
}

function getPrimaryRef(item) {
    return (Array.isArray(item.ref) && item.ref.length > 0) 
        ? String(item.ref[0]).split(' ')[0] 
        : 'N/A';
}

function generateAppSummaryHTML(item) {
    const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
    const appSummaryItems = safeAplicaciones
        .slice(0, 3)
        .map(app => `${app.marca} ${app.serie}`)
        .filter((value, index, self) => self.indexOf(value) === index);

    if (appSummaryItems.length > 0) {
        return `<div class="card-app-summary">${appSummaryItems.join(', ')}${safeAplicaciones.length > 3 ? ', ...' : ''}</div>`;
    }
    return '';
}

function setupPagination(totalItems) {
    const state = appState.getState();
    const totalPages = Math.ceil(totalItems / APP_CONFIG.itemsPerPage);
    
    if (totalPages <= 1) {
        els.paginationContainer.innerHTML = '';
        return;
    }

    const paginationHTML = generatePaginationHTML(state.currentPage, totalPages);
    els.paginationContainer.innerHTML = paginationHTML;
}

function generatePaginationHTML(currentPage, totalPages) {
    let html = '';
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;

    const maxPagesToShow = 5;
    const halfPages = Math.floor(maxPagesToShow / 2);
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else if (currentPage <= halfPages + 1) {
        startPage = 1;
        endPage = maxPagesToShow;
    } else if (currentPage >= totalPages - halfPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
    } else {
        startPage = currentPage - halfPages;
        endPage = currentPage + halfPages;
    }

    if (startPage > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            html += `<button class="page-btn" disabled>...</button>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<button class="page-btn" disabled>...</button>`;
        }
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`;
    
    return html;
}

// ================== GESTIÓN DE FAVORITOS ==================
function loadFavorites() {
    try {
        const favs = localStorage.getItem('brakeXFavorites');
        if (favs) {
            const favoritesSet = new Set(JSON.parse(favs).map(Number));
            appState.setState({ favorites: favoritesSet });
        }
    } catch (e) {
        console.error("Error al cargar favoritos:", e);
        appState.setState({ favorites: new Set() });
    }
}

function saveFavorites() {
    try {
        const state = appState.getState();
        localStorage.setItem('brakeXFavorites', JSON.stringify([...state.favorites]));
    } catch (e) {
        console.error("Error al guardar favoritos:", e);
    }
}

function toggleFavorite(e) {
    e.stopPropagation();
    const button = e.currentTarget;
    const card = button.closest('.result-card');
    if (!card) return;

    const itemId = parseInt(card.dataset.id);
    if (isNaN(itemId)) return;

    const state = appState.getState();
    const newFavorites = new Set(state.favorites);

    if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
    } else {
        newFavorites.add(itemId);
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
    }

    appState.setState({ favorites: newFavorites });
    saveFavorites();

    // Si estamos en modo favoritos, actualizar la vista
    if (state.isFavoritesMode) {
        filterData();
    }
}

// ================== GESTIÓN DE HISTORIAL ==================
function addToSearchHistory(query) {
    if (!query.trim()) return;
    
    try {
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        history = history.filter(q => q !== query);
        history.unshift(query);
        history = history.slice(0, APP_CONFIG.maxHistory);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    } catch (error) {
        console.error('Error al guardar en el historial:', error);
    }
}

function renderSearchHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        const container = els.searchHistoryContainer;
        if (!container) return;

        container.innerHTML = history.map(q =>
            `<button class="search-history-item" data-query="${q}">${q}</button>`
        ).join('');
    } catch (error) {
        console.error('Error al renderizar historial:', error);
    }
}

function deleteFromSearchHistory(query) {
    try {
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        history = history.filter(q => q !== query);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
        renderHistoryPanel();
    } catch (error) {
        console.error('Error al eliminar del historial:', error);
    }
}

function renderHistoryPanel() {
    try {
        const history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        const container = els.historyListContainer;
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = '<div class="no-history-item">No hay historial de búsqueda.</div>';
            return;
        }

        container.innerHTML = history.map(q =>
            `<div class="history-list-item">
                <button class="history-term-btn" data-query="${q}">${q}</button>
                <button class="history-delete-btn" data-query="${q}" aria-label="Eliminar ${q} del historial">&times;</button>
            </div>`
        ).join('');
    } catch (error) {
        console.error('Error al renderizar panel de historial:', error);
    }
}

function toggleHistoryView(forceState) {
    const isActivating = typeof forceState !== 'undefined'
        ? forceState
        : els.historialBtn.getAttribute('aria-pressed') === 'false';

    if (isActivating) {
        renderHistoryPanel();
        els.historyPanel.style.display = 'block';
        els.results.style.display = 'none';
        els.paginationContainer.style.display = 'none';
        els.historialBtn.classList.add('active');
        els.historialBtn.setAttribute('aria-pressed', 'true');

        // Desactivar modo favoritos
        appState.setState({ isFavoritesMode: false });
        els.filtroFavoritosBtn.classList.remove('active');
        els.filtroFavoritosBtn.setAttribute('aria-pressed', 'false');
    } else {
        els.historyPanel.style.display = 'none';
        els.results.style.display = 'grid';
        els.paginationContainer.style.display = 'flex';
        els.historialBtn.classList.remove('active');
        els.historialBtn.setAttribute('aria-pressed', 'false');
    }
}

// ================== GESTIÓN DE MODALES ==================
function openModal(item) {
    renderModalContent(item);
    
    els.modalContent.classList.remove('closing');
    els.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Configurar event listeners del modal
    setupModalEventListeners(item);
}

function renderModalContent(item) {
    // Referencias
    const refsHeaderHTML = (Array.isArray(item.ref) && item.ref.length > 0)
        ? item.ref.flatMap(ref => String(ref).split(' '))
            .map(part => `<span class="ref-badge header-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
            .join('')
        : '<span class="ref-badge ref-badge-na header-ref-badge">N/A</span>';
    
    els.modalRef.innerHTML = `<div class="modal-header-ref-container">${refsHeaderHTML}</div>`;

    // Posición
    const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
    els.modalPosition.innerHTML = `<span class="position-badge ${posBadgeClass}">${item.posición}</span>`;

    // Imágenes
    renderModalImages(item);

    // Especificaciones y aplicaciones
    els.modalAppsSpecs.innerHTML = `
        <div class="applications-list-container">
            ${renderApplicationsList(item.aplicaciones)}
            ${renderSpecs(item)}
        </div>
        <button class="qr-btn" data-ref="${getPrimaryRef(item)}">Ver QR</button>
    `;
}

function renderModalImages(item) {
    const images = getModalImages(item);
    const imageCount = images.length;
    const altRef = getPrimaryRef(item);

    let imageTrackHTML = '';
    images.forEach((imgSrc, i) => {
        imageTrackHTML += `<img src="${imgSrc}" alt="Referencia ${altRef} Vista ${i + 1}" class="result-image" loading="lazy">`;
    });

    els.modalCarousel.innerHTML = `
        <div class="image-track" style="display:flex;" data-current-index="0">
            ${imageTrackHTML}
        </div>
        ${imageCount > 1 ? `
            <button class="carousel-nav-btn" data-direction="-1" aria-label="Imagen anterior">‹</button>
            <button class="carousel-nav-btn" data-direction="1" aria-label="Siguiente imagen">›</button>
        ` : ''}
    `;

    // Contador
    if (imageCount > 1) {
        els.modalCounterWrapper.innerHTML = `<span class="carousel-counter">1/${imageCount}</span>`;
    } else {
        els.modalCounterWrapper.innerHTML = '';
    }
}

function getModalImages(item) {
    if (item.imagenes && item.imagenes.length > 0) {
        return item.imagenes;
    } else if (item.imagen) {
        return [
            item.imagen.replace("text=", `text=Vista+1+`),
            item.imagen.replace("text=", `text=Vista+2+`),
            item.imagen.replace("text=", `text=Vista+3+`)
        ];
    }
    return ['https://via.placeholder.com/300x200.png?text=No+Img'];
}

function setupModalEventListeners(item) {
    // Navegación del carrusel
    els.modalCarousel.querySelectorAll('.carousel-nav-btn').forEach(btn => {
        eventManager.addEventListener(btn, 'click', (e) => {
            e.stopPropagation();
            const direction = parseInt(e.currentTarget.dataset.direction);
            navigateCarousel(els.modalCarousel, direction);
        });
    });

    // Indicador de scroll
    updateScrollIndicator();
    eventManager.addEventListener(els.modalDetailsContent, 'scroll', updateScrollIndicator);

    // QR Code
    eventManager.addEventListener(els.modalAppsSpecs, 'click', handleQRCodeClick);
}

function navigateCarousel(carouselContainer, direction) {
    const track = carouselContainer.querySelector('.image-track');
    const images = carouselContainer.querySelectorAll('.result-image');
    const counter = els.modalCounterWrapper.querySelector('.carousel-counter');
    
    if (!track || images.length <= 1) return;

    let currentIndex = parseInt(track.dataset.currentIndex) || 0;
    const totalImages = images.length;
    let newIndex = currentIndex + direction;

    if (newIndex >= totalImages) newIndex = 0;
    else if (newIndex < 0) newIndex = totalImages - 1;

    track.style.transform = `translateX(-${newIndex * 100}%)`;
    track.dataset.currentIndex = newIndex;

    if (counter) {
        counter.textContent = `${newIndex + 1}/${totalImages}`;
    }
}

function updateScrollIndicator() {
    const wrapper = els.modalDetailsWrapper;
    const content = els.modalDetailsContent;
    
    if (wrapper && content) {
        const isScrollable = content.scrollHeight > content.clientHeight;
        const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 5;
        
        if (isScrollable && !isAtBottom) {
            wrapper.classList.add('scrollable');
        } else {
            wrapper.classList.remove('scrollable');
        }
    }
}

function closeModal() {
    els.modalContent.classList.add('closing');
    
    // Limpiar event listeners del modal
    eventManager.removeAll();
    els.modalDetailsWrapper.classList.remove('scrollable');

    setTimeout(() => {
        els.modal.style.display = 'none';
        document.body.style.overflow = '';
        els.modalCarousel.innerHTML = '';
        els.modalRef.innerHTML = '';
        els.modalPosition.innerHTML = '';
        els.modalAppsSpecs.innerHTML = '';
        els.modalCounterWrapper.innerHTML = '';
        els.modalContent.classList.remove('closing');
    }, 220);
}

// ================== RENDERIZADO DE DATOS ==================
function renderApplicationsList(aplicaciones) {
    const safeAplicaciones = Array.isArray(aplicaciones) ? aplicaciones : [];
    const groupedApps = safeAplicaciones.reduce((acc, app) => {
        const marca = app.marca || 'N/A';
        if (!acc[marca]) acc[marca] = [];
        acc[marca].push(app);
        return acc;
    }, {});

    // Ordenar aplicaciones
    Object.keys(groupedApps).forEach(marca => {
        groupedApps[marca].sort((a, b) => {
            const serieA = a.serie || '';
            const serieB = b.serie || '';
            if (serieA < serieB) return -1;
            if (serieA > serieB) return 1;
            
            const anioA = a.año || '';
            const anioB = b.año || '';
            if (anioA < anioB) return -1;
            if (anioA > anioB) return 1;
            return 0;
        });
    });

    let appListHTML = '';
    for (const marca in groupedApps) {
        appListHTML += `<div class="app-brand-header">${marca.toUpperCase()}</div>`;
        groupedApps[marca].forEach(app => {
            appListHTML += `
                <div class="app-detail-row">
                    <div>${app.serie || ''}</div>
                    <div>${app.litros || ''}</div>
                    <div>${app.año || ''}</div>
                </div>
            `;
        });
    }
    return appListHTML;
}

function renderSpecs(item) {
    let specsHTML = `<div class="app-brand-header">ESPECIFICACIONES</div>`;
    specsHTML += `<div class="spec-details-grid">`;

    // Referencias
    const refsSpecsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
        ? item.ref.flatMap(ref => String(ref).split(' '))
            .map(part => `<span class="ref-badge spec-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
            .join('')
        : '<span class="ref-badge ref-badge-na spec-ref-badge">N/A</span>';
    
    specsHTML += `
        <div class="spec-label"><strong>Referencias</strong></div>
        <div class="spec-value modal-ref-container">${refsSpecsHTML}</div>
    `;

    // OEM
    const oemText = (Array.isArray(item.oem) && item.oem.length > 0 ? item.oem.join(', ') : 'N/A');
    specsHTML += `
        <div class="spec-label"><strong>OEM</strong></div>
        <div class="spec-value">${oemText}</div>
    `;

    // FMSI
    const fmsiText = (Array.isArray(item.fmsi) && item.fmsi.length > 0 ? item.fmsi.join(', ') : 'N/A');
    specsHTML += `
        <div class="spec-label"><strong>Platina FMSI</strong></div>
        <div class="spec-value">${fmsiText}</div>
    `;

    // Medidas
    let medidasHTML = '';
    if (Array.isArray(item.medidas) && item.medidas.length > 0) {
        medidasHTML = item.medidas.map(medida => {
            const partes = String(medida).split(/x/i).map(s => s.trim());
            const ancho = partes[0] || 'N/A';
            const alto = partes[1] || 'N/A';
            return `<div>Ancho: ${ancho} x Alto: ${alto}</div>`;
        }).join('');
    } else {
        const anchoVal = item.anchoNum || 'N/A';
        const altoVal = item.altoNum || 'N/A';
        medidasHTML = `<div>Ancho: ${anchoVal} x Alto: ${altoVal}</div>`;
    }
    
    specsHTML += `
        <div class="spec-label"><strong>Medidas (mm)</strong></div>
        <div class="spec-value">${medidasHTML}</div>
    `;

    specsHTML += `</div>`;
    return specsHTML;
}

// ================== GESTIÓN DE TEMAS ==================
function loadThemePreference() {
    const savedTheme = localStorage.getItem('themePreference');
    switch (savedTheme) {
        case 'orbital':
            applyOrbitalTheme();
            break;
        case 'dark':
            applyAmoledDarkTheme();
            break;
        case 'light':
            applyLightTheme();
            break;
        default:
            applyLightTheme();
            break;
    }
}

function applyLightTheme() {
    els.body.classList.remove('lp-dark', 'modo-orbital');
    animateIconTransition(els.sunIcon, els.moonIcon);
    updateThemeButtonState(false, 'Activar modo oscuro');
    localStorage.setItem('themePreference', 'light');
}

function applyAmoledDarkTheme() {
    els.body.classList.remove('modo-orbital');
    els.body.classList.add('lp-dark');
    animateIconTransition(els.moonIcon, els.sunIcon);
    updateThemeButtonState(true, 'Activar modo claro');
    localStorage.setItem('themePreference', 'dark');
}

function applyOrbitalTheme() {
    els.body.classList.remove('lp-dark');
    els.body.classList.add('modo-orbital');
    animateIconTransition(els.sunIcon, els.moonIcon);
    updateThemeButtonState(false, 'Activar modo claro', true);
    localStorage.setItem('themePreference', 'orbital');
}

function animateIconTransition(iconToShow, iconToHide) {
    if (!iconToShow) return;

    const showKeyframes = [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6) rotate(-90deg)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' }
    ];

    const hideKeyframes = [
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6) rotate(90deg)' }
    ];

    const options = { 
        duration: 400, 
        fill: 'forwards', 
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
    };

    iconToShow.animate(showKeyframes, options);
    if (iconToHide) {
        iconToHide.animate(hideKeyframes, options);
    }
}

function updateThemeButtonState(isDark, label, isOrbital = false) {
    els.darkBtn.setAttribute('aria-pressed', isDark.toString());
    els.darkBtn.setAttribute('aria-label', label);

    if (els.orbitalBtn) {
        if (isOrbital) {
            els.orbitalBtn.classList.add('active');
            els.orbitalBtn.setAttribute('aria-pressed', 'true');
        } else {
            els.orbitalBtn.classList.remove('active');
            els.orbitalBtn.setAttribute('aria-pressed', 'false');
        }
    }
}

// ================== GESTIÓN DE DATOS ==================
async function loadAppData() {
    showSkeletonLoader();
    
    try {
        const data = await dataManager.getDataWithCache('pastillas');
        
        if (!data || data.length === 0) {
            throw new Error("No se encontraron datos en la colección 'pastillas'.");
        }

        const processedData = processData(data);
        appState.setState({ data: processedData });
        searchIndex.updateData(processedData);

        updateDatalists(processedData);
        updateBrandTags(processedData);
        
        applyFiltersFromURL();
        filterData();

    } catch (error) {
        console.error("Error al cargar datos:", error);
        showErrorState('Error al cargar los datos. Por favor, intenta nuevamente.');
    }
}

function processData(data) {
    return data.map((item, index) => {
        // Procesar imágenes
        if (item.imagen && (!item.imagenes || item.imagenes.length === 0)) {
            item.imagenes = [
                item.imagen.replace("text=", `text=Vista+1+`),
                item.imagen.replace("text=", `text=Vista+2+`),
                item.imagen.replace("text=", `text=Vista+3+`)
            ];
        }

        // Procesar medidas
        let medidaString = null;
        if (Array.isArray(item.medidas) && item.medidas.length > 0) {
            medidaString = String(item.medidas[0]);
        } else if (typeof item.medidas === 'string') {
            medidaString = item.medidas;
        }

        const partes = medidaString ? medidaString.split(/x/i).map(s => parseFloat(s.trim())) : [0, 0];
        
        // Normalizar arrays
        const safeRefs = Array.isArray(item.ref) ? item.ref.map(String) : [];
        const safeOems = Array.isArray(item.oem) ? item.oem.map(String) : [];
        const safeFmsis = Array.isArray(item.fmsi) ? item.fmsi.map(String) : [];
        const aplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];

        return {
            ...item,
            aplicaciones: aplicaciones,
            _appId: index,
            ref: safeRefs,
            oem: safeOems,
            fmsi: safeFmsis,
            anchoNum: partes[0] || 0,
            altoNum: partes[1] || 0
        };
    }).sort((a, b) => {
        const refA = getSortableRefNumber(a.ref);
        const refB = getSortableRefNumber(b.ref);
        return refA - refB;
    });
}

function updateDatalists(data) {
    fillDatalist(els.datalistMarca, getAllApplicationValues(data, 'marca'));
    fillDatalist(els.datalistModelo, getAllApplicationValues(data, 'modelo'));
    fillDatalist(els.datalistAnio, getAllApplicationValues(data, 'año'));

    const allOems = [...new Set(data.flatMap(i => i.oem || []))].filter(Boolean).sort();
    const allFmsis = [...new Set(data.flatMap(i => i.fmsi || []))].filter(Boolean).sort();
    
    fillDatalist(els.datalistOem, allOems);
    fillDatalist(els.datalistFmsi, allFmsis);
}

function getAllApplicationValues(data, key) {
    const allValues = new Set();
    data.forEach(item => {
        item.aplicaciones.forEach(app => {
            const prop = (key === 'modelo') ? 'serie' : key;
            if (app[prop]) allValues.add(String(app[prop]));
        });
    });
    return [...allValues].sort();
}

function fillDatalist(datalist, values) {
    if (datalist) {
        datalist.innerHTML = values.map(v => `<option value="${v}">`).join('');
    }
}

function updateBrandTags(data) {
    if (!els.brandTagsContainer) return;

    const allBrandsList = data.flatMap(item => 
        item.aplicaciones.map(app => app.marca)
    ).filter(Boolean);

    const brandFrequencies = allBrandsList.reduce((counts, brand) => {
        counts[brand] = (counts[brand] || 0) + 1;
        return counts;
    }, {});

    const sortedBrands = Object.entries(brandFrequencies)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 10)
        .map(([brand]) => brand);

    const brandColors = [
        '--brand-color-1', '--brand-color-2', '--brand-color-3', '--brand-color-4',
        '--brand-color-5', '--brand-color-6', '--brand-color-7', '--brand-color-8',
        '--brand-color-9', '--brand-color-10'
    ];

    brandColorMap = {};
    sortedBrands.forEach((brand, index) => {
        brandColorMap[brand] = brandColors[index % brandColors.length];
    });

    els.brandTagsContainer.innerHTML = sortedBrands.map(brand => {
        const colorVar = brandColorMap[brand] || '--brand-color-10';
        return `<button class="brand-tag" data-brand="${brand}" style="--tag-brand-color: var(${colorVar});">${brand}</button>`;
    }).join('');
}

// ================== GESTIÓN DE URL Y ESTADO ==================
function updateURLWithFilters() {
    const params = new URLSearchParams();
    const filters = {
        busqueda: els.busqueda.value.trim(),
        marca: els.marca.value.trim(),
        modelo: els.modelo.value.trim(),
        anio: els.anio.value.trim(),
        oem: els.oem.value.trim(),
        fmsi: els.fmsi.value.trim(),
        ancho: els.medidasAncho.value.trim(),
        alto: els.medidasAlto.value.trim(),
    };

    for (const key in filters) {
        if (filters[key]) {
            params.set(key, filters[key]);
        }
    }

    const activePositions = getPositionFilter();
    if (activePositions.length > 0) {
        params.set('pos', activePositions.join(','));
    }

    const state = appState.getState();
    if (state.isFavoritesMode) {
        params.set('favorites', 'true');
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState({}, '', newUrl);
}

function applyFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Aplicar filtros básicos
    els.busqueda.value = params.get('busqueda') || '';
    els.marca.value = params.get('marca') || '';
    els.modelo.value = params.get('modelo') || '';
    els.anio.value = params.get('anio') || '';
    els.oem.value = params.get('oem') || '';
    els.fmsi.value = params.get('fmsi') || '';
    els.medidasAncho.value = params.get('ancho') || '';
    els.medidasAlto.value = params.get('alto') || '';

    // Aplicar posición
    const posParam = params.get('pos');
    if (posParam) {
        if (posParam.includes('Delantera')) els.posDel.classList.add('active');
        if (posParam.includes('Trasera')) els.posTras.classList.add('active');
    }

    // Aplicar modo favoritos
    if (params.get('favorites') === 'true') {
        appState.setState({ isFavoritesMode: true });
        els.filtroFavoritosBtn.classList.add('active');
        els.filtroFavoritosBtn.setAttribute('aria-pressed', 'true');
    }

    // Aplicar etiquetas de marca
    const brandFromURL = params.get('marca');
    if (brandFromURL && els.brandTagsContainer) {
        const tagToActivate = els.brandTagsContainer.querySelector(`.brand-tag[data-brand="${brandFromURL}"]`);
        if (tagToActivate) {
            tagToActivate.classList.add('active');
        }
    }
}

// ================== UTILIDADES ==================
function clearAllFilters() {
    // Limpiar inputs
    const inputsToClear = [
        els.busqueda, els.marca, els.modelo, els.anio, 
        els.oem, els.fmsi, els.medidasAncho, els.medidasAlto
    ];
    inputsToClear.forEach(input => input.value = '');

    // Limpiar posiciones
    els.posDel.classList.remove('active');
    els.posTras.classList.remove('active');

    // Limpiar etiquetas de marca
    if (els.brandTagsContainer) {
        els.brandTagsContainer.querySelectorAll('.brand-tag.active').forEach(activeTag => {
            activeTag.classList.remove('active');
        });
    }

    // Resetear estado
    appState.setState({ 
        isFavoritesMode: false,
        currentPage: 1
    });

    // Actualizar UI
    els.filtroFavoritosBtn.classList.remove('active');
    els.filtroFavoritosBtn.setAttribute('aria-pressed', 'false');
    els.historialBtn.classList.remove('active');
    els.historialBtn.setAttribute('aria-pressed', 'false');
    
    toggleHistoryView(false);
    filterData();
}

function createRippleEffect(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - (rect.left + radius)}px`;
    circle.style.top = `${event.clientY - (rect.top + radius)}px`;
    circle.classList.add('ripple');
    
    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) ripple.remove();
    
    button.appendChild(circle);
}

function showErrorState(message) {
    els.results.innerHTML = `
        <div class="no-results-container">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <path d="M12 9v4l-1.5 1.5"></path>
                <path d="M12 3v1"></path>
                <path d="M21 12h-1"></path>
                <path d="M3 12H2"></path>
                <path d="m18.36 17.36-.7.7"></path>
                <path d="m6.34 6.34-.7-.7"></path>
            </svg>
            <p>Error al cargar datos</p>
            <span>${message}</span>
        </div>
    `;
}

// ================== EVENT LISTENERS ==================
function setupEventListeners() {
    setupThemeListeners();
    setupNavigationListeners();
    setupFilterListeners();
    setupModalListeners();
    setupHistoryListeners();
    setupKeyboardNavigation();
}

function setupThemeListeners() {
    // Botón tema oscuro/claro
    eventManager.addEventListener(els.darkBtn, 'click', () => {
        AnimationManager.shake(els.headerX);
        if (els.body.classList.contains('modo-orbital') || els.body.classList.contains('lp-dark')) {
            applyLightTheme();
        } else {
            applyAmoledDarkTheme();
        }
    });

    // Botón modo orbital
    if (els.orbitalBtn) {
        eventManager.addEventListener(els.orbitalBtn, 'click', () => {
            AnimationManager.shake(els.headerX);
            const themeIcon = els.orbitalBtn.querySelector('.lp-icon-palette');
            if (themeIcon) {
                themeIcon.animate([
                    { transform: 'translate(-50%, -50%) scale(0.8) rotate(0deg)', opacity: 0.7 },
                    { transform: 'translate(-50%, -50%) scale(1.2) rotate(30deg)', opacity: 1 },
                    { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }
                ], { duration: 400, easing: 'ease-out' });
            }

            if (els.body.classList.contains('modo-orbital')) {
                applyLightTheme();
            } else {
                applyOrbitalTheme();
            }
        });
    }
}

function setupNavigationListeners() {
    // Botón subir
    eventManager.addEventListener(els.upBtn, 'click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mostrar/ocultar botón subir
    eventManager.addEventListener(window, 'scroll', () => {
        els.upBtn.classList.toggle('show', window.scrollY > 300);
    });

    // Menú lateral
    eventManager.addEventListener(els.menuBtn, 'click', openSideMenu);
    eventManager.addEventListener(els.menuCloseBtn, 'click', closeSideMenu);
    eventManager.addEventListener(els.sideMenuOverlay, 'click', closeSideMenu);
    eventManager.addEventListener(els.openGuideLink, 'click', () => {
        closeSideMenu();
        setTimeout(openGuideModal, 50);
    });
}

function setupFilterListeners() {
    // Búsqueda con debounce
    const debouncedFilter = optimizedDebounce(filterData, APP_CONFIG.searchDebounceDelay);
    
    eventManager.addEventListener(els.busqueda, 'input', (e) => {
        if (e.target.value.trim() !== '') {
            els.searchContainer.classList.add('active');
        } else {
            els.searchContainer.classList.remove('active');
        }
        addToSearchHistory(e.target.value);
        debouncedFilter();
    });

    // Otros filtros
    const otherFilterInputs = [
        els.marca, els.modelo, els.anio, els.oem, els.fmsi, 
        els.medidasAncho, els.medidasAlto
    ];

    otherFilterInputs.forEach(input => {
        eventManager.addEventListener(input, 'input', debouncedFilter);
    });

    // Botones de posición
    [els.posDel, els.posTras].forEach(btn => {
        eventManager.addEventListener(btn, 'click', (e) => {
            e.currentTarget.classList.toggle('active');
            filterData();
        });
    });

    // Botón limpiar filtros
    eventManager.addEventListener(els.clearBtn, 'click', handleClearFilters);

    // Etiquetas de marca
    if (els.brandTagsContainer) {
        eventManager.addEventListener(els.brandTagsContainer, 'click', (e) => {
            const tag = e.target.closest('.brand-tag');
            if (!tag) return;

            const brand = tag.dataset.brand;
            const isActive = tag.classList.contains('active');

            // Desactivar otras etiquetas
            els.brandTagsContainer.querySelectorAll('.brand-tag.active').forEach(activeTag => {
                if (activeTag !== tag) {
                    activeTag.classList.remove('active');
                }
            });

            if (isActive) {
                tag.classList.remove('active');
                els.marca.value = '';
            } else {
                tag.classList.add('active');
                els.marca.value = brand;
            }

            filterData();
        });
    }
}

function setupModalListeners() {
    // Clicks en tarjetas
    eventManager.addEventListener(els.results, 'click', handleCardClick);

    // Cerrar modales
    eventManager.addEventListener(els.modalCloseBtn, 'click', closeModal);
    eventManager.addEventListener(els.modal, 'click', (event) => {
        if (event.target === els.modal) closeModal();
    });

    eventManager.addEventListener(els.guideModalCloseBtn, 'click', closeGuideModal);
    eventManager.addEventListener(els.guideModal, 'click', (event) => {
        if (event.target === els.guideModal) closeGuideModal();
    });
}

function setupHistoryListeners() {
    // Botones de vista
    eventManager.addEventListener(els.filtroFavoritosBtn, 'click', () => {
        const state = appState.getState();
        const newFavoritesMode = !state.isFavoritesMode;
        
        appState.setState({ isFavoritesMode: newFavoritesMode });
        
        if (newFavoritesMode) {
            els.filtroFavoritosBtn.classList.add('active');
            els.filtroFavoritosBtn.setAttribute('aria-pressed', 'true');
            toggleHistoryView(false);
        } else {
            els.filtroFavoritosBtn.classList.remove('active');
            els.filtroFavoritosBtn.setAttribute('aria-pressed', 'false');
        }
        
        filterData();
    });

    eventManager.addEventListener(els.historialBtn, 'click', () => {
        toggleHistoryView();
    });

    // Historial de búsqueda
    eventManager.addEventListener(els.searchHistoryContainer, 'click', (e) => {
        if (e.target.matches('.search-history-item')) {
            els.busqueda.value = e.target.dataset.query;
            filterData();
            els.busqueda.focus();
        }
    });

    setupHistoryPanelListeners();
}

function setupHistoryPanelListeners() {
    eventManager.addEventListener(els.historyListContainer, 'click', (e) => {
        const termBtn = e.target.closest('.history-term-btn');
        const deleteBtn = e.target.closest('.history-delete-btn');

        if (termBtn) {
            const query = termBtn.dataset.query;
            els.busqueda.value = query;
            toggleHistoryView(false);
            filterData();
            els.busqueda.focus();
        }

        if (deleteBtn) {
            const query = deleteBtn.dataset.query;
            deleteFromSearchHistory(query);
        }
    });
}

function setupKeyboardNavigation() {
    eventManager.addEventListener(document, 'keydown', (e) => {
        // Escape para cerrar modales y menús
        if (e.key === 'Escape') {
            if (els.sideMenu.classList.contains('open')) {
                closeSideMenu();
            } else if (els.modal.style.display === 'flex') {
                closeModal();
            } else if (els.guideModal.style.display === 'flex') {
                closeGuideModal();
            }
        }

        // Navegación del carrusel con teclado
        if (e.key === 'ArrowLeft' && els.modal.style.display === 'flex') {
            navigateCarousel(els.modalCarousel, -1);
        } else if (e.key === 'ArrowRight' && els.modal.style.display === 'flex') {
            navigateCarousel(els.modalCarousel, 1);
        }

        // Atajo de búsqueda (/)
        if (e.key === '/' && e.target === document.body) {
            e.preventDefault();
            els.busqueda.focus();
        }
    });
}

// ================== HANDLERS DE EVENTOS ==================
function handleCardClick(event) {
    if (event.target.closest('.favorite-btn')) return;
    
    const card = event.target.closest('.result-card');
    if (card) {
        const itemId = card.dataset.id;
        const state = appState.getState();
        const itemData = state.data.find(item => item._appId == itemId);
        
        if (itemData) {
            openModal(itemData);
        }
    }
}

function handleClearFilters(e) {
    if (els.clearBtn.disabled) return;
    
    els.clearBtn.disabled = true;
    const trashLid = els.clearBtn.querySelector('.trash-lid');
    const trashBody = els.clearBtn.querySelector('.trash-body');

    // Animación
    if (trashLid) trashLid.classList.add('animate-lid');
    if (trashBody) trashBody.classList.add('animate-body');
    
    createClearAnimationSparks();
    clearAllFilters();

    setTimeout(() => {
        if (trashLid) trashLid.classList.remove('animate-lid');
        if (trashBody) trashBody.classList.remove('animate-body');
        els.clearBtn.disabled = false;
    }, 900);
}

function createClearAnimationSparks() {
    const NUM_SPARKS = 10;
    const SPARK_COLORS = ['#00ffff', '#ff00ff', '#00ff7f', '#ffc700', '#ff5722'];

    for (let i = 0; i < NUM_SPARKS; i++) {
        const spark = document.createElement('div');
        spark.classList.add('spark');
        const size = Math.random() * 4 + 3;
        spark.style.width = `${size}px`;
        spark.style.height = `${size}px`;
        spark.style.backgroundColor = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
        spark.style.left = `calc(50% + ${Math.random() * 20 - 10}px)`;
        spark.style.top = `calc(50% + ${Math.random() * 20 - 10}px)`;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 25 + 20;
        const sparkX = Math.cos(angle) * distance;
        const sparkY = Math.sin(angle) * distance;
        
        spark.style.setProperty('--spark-x', `${sparkX}px`);
        spark.style.setProperty('--spark-y', `${sparkY}px`);
        
        els.clearBtn.appendChild(spark);
        spark.addEventListener('animationend', () => spark.remove(), { once: true });
    }
}

function handleQRCodeClick(e) {
    if (e.target.matches('.qr-btn')) {
        const ref = e.target.dataset.ref;
        const url = `${window.location.origin}${window.location.pathname}?busqueda=${encodeURIComponent(ref)}`;
        
        generateQRCode(url, ref);
    }
}

async function generateQRCode(url, ref) {
    try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, url, { width: 200 });
        
        const modal = document.getElementById('card-modal');
        const content = modal.querySelector('.modal-content');
        
        content.innerHTML = `
            <button class="modal-close-btn" aria-label="Cerrar">&times;</button>
            <h2 style="margin-bottom:1rem;">Compartir: ${ref}</h2>
            <div style="text-align:center; padding:1rem;">
                ${canvas.outerHTML}
                <p style="margin-top:1rem; font-size:0.85rem;">Escanea para abrir esta pastilla</p>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        const closeBtn = content.querySelector('.modal-close-btn');
        eventManager.addEventListener(closeBtn, 'click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
        
    } catch (error) {
        console.error('Error al generar QR:', error);
    }
}

// ================== FUNCIONES DE UI ==================
function openSideMenu() {
    els.sideMenu.classList.add('open');
    els.sideMenu.setAttribute('aria-hidden', 'false');
    els.sideMenuOverlay.style.display = 'block';
    
    requestAnimationFrame(() => {
        els.sideMenuOverlay.classList.add('visible');
    });
    
    els.menuBtn.setAttribute('aria-expanded', 'true');
    els.menuCloseBtn.focus();
}

function closeSideMenu() {
    els.sideMenu.classList.remove('open');
    els.sideMenu.setAttribute('aria-hidden', 'true');
    els.sideMenuOverlay.classList.remove('visible');
    els.menuBtn.setAttribute('aria-expanded', 'false');
    els.menuBtn.focus();
    
    els.sideMenuOverlay.addEventListener('transitionend', () => {
        if (!els.sideMenuOverlay.classList.contains('visible')) {
            els.sideMenuOverlay.style.display = 'none';
        }
    }, { once: true });
}

function openGuideModal() {
    els.guideModalContent.classList.remove('closing');
    els.guideModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeGuideModal() {
    els.guideModalContent.classList.add('closing');
    setTimeout(() => {
        els.guideModal.style.display = 'none';
        document.body.style.overflow = '';
        els.guideModalContent.classList.remove('closing');
    }, 220);
}

// ================== INICIALIZACIÓN ==================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Cleanup global para evitar memory leaks
window.addEventListener('beforeunload', () => {
    if (eventManager) {
        eventManager.removeAll();
    }
});