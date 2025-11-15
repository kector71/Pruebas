document.addEventListener('DOMContentLoaded', () => {
    // === Firebase ya está conectado (no tocamos tu config) ===
    const db = firebase.firestore();

    // === MEJORA #4: AppState (Favoritos persistentes) ===
    class AppState {
        constructor() {
            this.data = [];
            this.filtered = [];
            this.currentPage = 1;
            this._favorites = new Set();
            this.isFavoritesMode = false;
            this.activeManufacturer = null;
            this._loadFavorites();
        }

        _loadFavorites() {
            try {
                const favs = localStorage.getItem('brakeXFavorites');
                if (favs) this._favorites = new Set(JSON.parse(favs).map(Number));
            } catch (e) {
                console.error("Error al cargar favoritos:", e);
                this._favorites = new Set();
            }
        }

        _saveFavorites() {
            try {
                localStorage.setItem('brakeXFavorites', JSON.stringify([...this._favorites]));
            } catch (e) {
                console.error("Error al guardar favoritos:", e);
            }
        }

        toggleFavorite(itemId) {
            if (this._favorites.has(itemId)) {
                this._favorites.delete(itemId);
            } else {
                this._favorites.add(itemId);
            }
            this._saveFavorites();
        }

        isFavorite(itemId) {
            return this._favorites.has(itemId);
        }

        get favorites() {
            return this._favorites;
        }
    }

    const appState = new AppState();

    const itemsPerPage = 24;
    const MAX_HISTORY = 5;
    let lastFocusedElement = null;

    // === DOM Elements ===
    const els = {
        body: document.body,
        headerX: document.querySelector('.header-x'),
        darkBtn: document.getElementById('darkBtn'),
        orbitalBtn: document.getElementById('orbitalBtn'),
        upBtn: document.getElementById('upBtn'),
        menuBtn: document.getElementById('menuBtn'),
        sideMenu: document.getElementById('side-menu'),
        sideMenuOverlay: document.getElementById('side-menu-overlay'),
        menuCloseBtn: document.getElementById('menuCloseBtn'),
        openGuideLink: document.getElementById('open-guide-link'),
        busqueda: document.getElementById('busquedaRapida'),
        marca: document.getElementById('filtroMarca'),
        modelo: document.getElementById('filtroModelo'),
        anio: document.getElementById('filtroAnio'),
        oem: document.getElementById('filtroOem'),
        fmsi: document.getElementById('filtroFmsi'),
        medidasAncho: document.getElementById('medidasAncho'),
        medidasAlto: document.getElementById('medidasAlto'),
        posDel: document.getElementById('positionDelantera'),
        posTras: document.getElementById('positionTrasera'),
        clearBtn: document.getElementById('clearFiltersBtn'),
        datalistMarca: document.getElementById('marcas'),
        datalistModelo: document.getElementById('modelos'),
        datalistAnio: document.getElementById('anios'),
        datalistOem: document.getElementById('oemList'),
        datalistFmsi: document.getElementById('fmsiList'),
        results: document.getElementById('results-container'),
        countContainer: document.getElementById('result-count-container'),
        paginationContainer: document.getElementById('pagination-container'),
        resultsHeaderCard: document.getElementById('results-header-card'),
        brandTagsContainer: document.getElementById('brand-tags-container'),
        footer: document.getElementById('footerBanner'),
        modal: document.getElementById('card-modal'),
        modalContent: document.querySelector('#card-modal .modal-content'),
        modalCloseBtn: document.querySelector('#card-modal .modal-close-btn'),
        modalCarousel: document.querySelector('#card-modal .modal-image-carousel'),
        modalRef: document.querySelector('#card-modal .modal-ref'),
        modalPosition: document.querySelector('#card-modal .modal-position'),
        searchContainer: document.getElementById('searchContainer'),
        modalAppsSpecs: document.querySelector('#card-modal .modal-apps-specs'),
        modalDetailsWrapper: document.getElementById('modalDetailsWrapper'),
        modalDetailsContent: document.getElementById('modalDetailsContent'),
        modalCounterWrapper: document.getElementById('modalCounterWrapper'),
        guideModal: document.getElementById('guide-modal'),
        guideModalCloseBtn: document.querySelector('#guide-modal .modal-close-btn'),
        filtroFavoritosBtn: document.getElementById('filtroFavoritosBtn'),
        historialBtn: document.getElementById('historialBtn'),
        searchHistoryContainer: document.getElementById('searchHistoryContainer'),
        searchHistoryCard: document.getElementById('searchHistoryCard'),
        manufacturerTagsContainer: document.getElementById('manufacturer-tags-container')
    };

    // === Historial de búsqueda ===
    function addToSearchHistory(query) {
        if (!query.trim()) return;
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        history = history.slice(0, MAX_HISTORY);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }

    function deleteFromSearchHistory(query) {
        let history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        history = history.filter(q => q !== query);
        localStorage.setItem('brakeXSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }

    function renderSearchHistory() {
        const history = JSON.parse(localStorage.getItem('brakeXSearchHistory') || '[]');
        const container = els.searchHistoryContainer;
        if (!container) return;
        container.innerHTML = history.map(q =>
            `<button class="search-history-item" data-query="${q}">
                ${q}
                <span class="delete-history-item" data-query-delete="${q}" role="button" aria-label="Eliminar ${q}">×</span>
            </button>`
        ).join('');
    }

    // === Favoritos ===
    const toggleFavorite = (e) => {
        e.stopPropagation();
        const button = e.currentTarget;
        const card = button.closest('.result-card');
        if (!card) return;
        const itemId = parseInt(card.dataset.id);
        if (isNaN(itemId)) return;

        appState.toggleFavorite(itemId);
        const isNowFavorite = appState.isFavorite(itemId);
        button.classList.toggle('active', isNowFavorite);
        button.setAttribute('aria-pressed', isNowFavorite);

        if (appState.isFavoritesMode) filterData();
    };

    // === Utilidades ===
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const normalizeText = (text = '') => 
        String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const showGlobalError = (title, message) => {
        els.results.innerHTML = `<div class="no-results-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>${title}</p>
            <span>${message}</span>
        </div>`;
        els.paginationContainer.innerHTML = '';
        els.countContainer.innerHTML = '0 resultados';
    };

    const fillDatalist = (datalist, values) => {
        datalist.innerHTML = values.map(v => `<option value="${v}">`).join('');
    };

    const getPositionFilter = () => {
        const activePositions = [];
        if (els.posDel.classList.contains('active')) activePositions.push('Delantera');
        if (els.posTras.classList.contains('active')) activePositions.push('Trasera');
        return activePositions;
    };

    // === BADGES ===
    const BADGE_CONFIG = {
        'K':   { class: 'ref-k',   test: (ref) => ref.startsWith('K') },
        'INC': { class: 'ref-inc', test: (ref) => ref.endsWith('INC') },
        'BP':  { class: 'ref-bp',  test: (ref) => ref.endsWith('BP') },
        'BEX': { class: 'ref-bex', test: (ref) => ref.endsWith('BEX') },
    };
    const getRefBadgeClass = (ref) => {
        if (typeof ref !== 'string') return 'ref-default';
        const upperRef = ref.toUpperCase();
        for (const key in BADGE_CONFIG) {
            if (BADGE_CONFIG[key].test(upperRef)) return BADGE_CONFIG[key].class;
        }
        return 'ref-default';
    };

    const getSortableRefNumber = (refArray) => {
        if (!Array.isArray(refArray) || refArray.length === 0) return Infinity;
        let primaryRef = refArray.find(ref => typeof ref === 'string' && ref.toUpperCase().startsWith('K-'));
        if (!primaryRef) primaryRef = refArray[0];
        const match = String(primaryRef).match(/(\d+)/);
        return match ? parseInt(match[0], 10) : Infinity;
    };

    // === FILTROS ===
    const getActiveFilters = () => {
        const activePos = getPositionFilter();
        return {
            busqueda: normalizeText(els.busqueda.value),
            marca: normalizeText(els.marca.value),
            modelo: normalizeText(els.modelo.value),
            anio: normalizeText(els.anio.value),
            oem: normalizeText(els.oem.value),
            fmsi: normalizeText(els.fmsi.value),
            ancho: parseFloat(els.medidasAncho.value) || null,
            alto: parseFloat(els.medidasAlto.value) || null,
            pos: activePos,
            manufacturer: appState.activeManufacturer,
            favorites: appState.isFavoritesMode
        };
    };

    const FILTER_STRATEGIES = {
        busqueda: (item, value) => {
            if (!item._searchableText) {
                const safeAplicaciones = Array.isArray(item.aplicaciones) ? item.aplicaciones : [];
                const itemVehicles = safeAplicaciones.map(app => `${app.marca} ${app.serie} ${app.litros} ${app.año} ${app.especificacion}`).join(' ');
                const allRefs = [...(item.ref || []), ...(item.oem || []), ...(item.fmsi || [])].join(' ');
                item._searchableText = normalizeText(`${allRefs} ${itemVehicles}`);
            }
            return item._searchableText.includes(value);
        },
        marca: (item, value) => (item.aplicaciones || []).some(app => normalizeText(app.marca).includes(value)),
        modelo: (item, value) => (item.aplicaciones || []).some(app => normalizeText(app.serie).includes(value)),
        anio: (item, value) => (item.aplicaciones || []).some(app => normalizeText(app.año).includes(value)),
        oem: (item, value) => (item.oem || []).some(o => normalizeText(o).includes(value)),
        fmsi: (item, value) => (item.fmsi || []).some(f => normalizeText(f).includes(value)),
        ancho: (item, value) => {
            const TOLERANCIA = 1.0;
            return (item.anchoNum >= value - TOLERANCIA && item.anchoNum <= value + TOLERANCIA);
        },
        alto: (item, value) => {
            const TOLERANCIA = 1.0;
            return (item.altoNum >= value - TOLERANCIA && item.altoNum <= value + TOLERANCIA);
        },
        pos: (item, activePositions) => activePositions.length === 0 || activePositions.includes(item.posición),
        manufacturer: (item, manuf) => {
            const allRefParts = (item.ref || []).flatMap(refStr => String(refStr).toUpperCase().split(' '));
            return allRefParts.some(refPart => {
                if (manuf === 'K') return refPart.startsWith('K');
                if (manuf === 'INC') return refPart.endsWith('INC');
                if (manuf === 'BP') return refPart.endsWith('BP');
                if (manuf === 'B') return refPart.endsWith('BEX');
                return false;
            });
        },
        favorites: (item, isFavoritesMode) => !isFavoritesMode || appState.isFavorite(item._appId)
    };

    const filterData = () => {
        if (!appState.data.length) return;

        const filters = getActiveFilters();
        if (filters.busqueda) addToSearchHistory(els.busqueda.value.trim());

        const isFiltered = Object.values(filters).some(v => 
            v !== null && v !== false && (!Array.isArray(v) || v.length > 0) && (typeof v !== 'string' || v.trim() !== '')
        );

        appState.filtered = appState.data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return true;
                return FILTER_STRATEGIES[key] ? FILTER_STRATEGIES[key](item, value) : true;
            });
        });

        appState.currentPage = 1;
        renderCurrentPage();
        renderDynamicBrandTags(appState.filtered, isFiltered);
    };

    // === RENDER ===
    const renderApplicationsList = (aplicaciones) => {
        const safeAplicaciones = Array.isArray(aplicaciones) ? aplicaciones : [];
        const groupedApps = safeAplicaciones.reduce((acc, app) => {
            const marca = app.marca || 'N/A';
            if (!acc[marca]) acc[marca] = [];
            acc[marca].push(app);
            return acc;
        }, {});
        Object.keys(groupedApps).forEach(marca => {
            groupedApps[marca].sort((a, b) => {
                const serieA = a.serie || ''; const serieB = b.serie || '';
                if (serieA !== serieB) return serieA < serieB ? -1 : 1;
                const anioA = a.año || ''; const anioB = b.año || '';
                return anioA < anioB ? -1 : anioA > anioB ? 1 : 0;
            });
        });
        let appListHTML = '';
        for (const marca in groupedApps) {
            appListHTML += `<div class="app-brand-header">${marca.toUpperCase()}</div>`;
            groupedApps[marca].forEach(app => {
                appListHTML += `<div class="app-detail-row"><div>${app.serie || ''}</div><div>${app.litros || ''}</div><div>${app.año || ''}</div></div>`;
            });
        }
        return appListHTML;
    };

    const renderSpecs = (item) => {
        let specsHTML = `<div class="app-brand-header">ESPECIFICACIONES</div><div class="spec-details-grid">`;
        const refsSpecsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap(ref => String(ref).split(' '))
                .map(part => `<span class="ref-badge spec-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na spec-ref-badge">N/A</span>';
        specsHTML += `<div class="spec-label"><strong>Referencias</strong></div><div class="spec-value modal-ref-container">${refsSpecsHTML}</div>`;
        specsHTML += `<div class="spec-label"><strong>OEM</strong></div><div class="spec-value">${(Array.isArray(item.oem) && item.oem.length > 0) ? item.oem.join(', ') : 'N/A'}</div>`;
        specsHTML += `<div class="spec-label"><strong>Platina FMSI</strong></div><div class="spec-value">${(Array.isArray(item.fmsi) && item.fmsi.length > 0) ? item.fmsi.join(', ') : 'N/A'}</div>`;
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
        specsHTML += `<div class="spec-label"><strong>Medidas (mm)</strong></div><div class="spec-value">${medidasHTML}</div>`;
        specsHTML += `</div>`;
        return specsHTML;
    };

    const showSkeletonLoader = (count = 6) => {
        let skeletonHTML = '';
        for (let i = 0; i < count; i++) {
            skeletonHTML += `<div class="skeleton-card"><div class="skeleton-line long"></div><div class="skeleton-line short"></div><div class="skeleton-box"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>`;
        }
        els.results.innerHTML = skeletonHTML;
        els.paginationContainer.innerHTML = '';
    };

    function setupPagination(totalItems) {
        els.paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return;
        let paginationHTML = '';
        paginationHTML += `<button class="page-btn" data-page="${appState.currentPage - 1}" ${appState.currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
        const maxPagesToShow = 5;
        const halfPages = Math.floor(maxPagesToShow / 2);
        let startPage, endPage;
        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else if (appState.currentPage <= halfPages + 1) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (appState.currentPage >= totalPages - halfPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = appState.currentPage - halfPages;
            endPage = appState.currentPage + halfPages;
        }
        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) paginationHTML += `<button class="page-btn" disabled>...</button>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="page-btn ${i === appState.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationHTML += `<button class="page-btn" disabled>...</button>`;
            paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        paginationHTML += `<button class="page-btn" data-page="${appState.currentPage + 1}" ${appState.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`;
        els.paginationContainer.innerHTML = paginationHTML;
    }

    const renderCurrentPage = () => {
        const totalResults = appState.filtered.length;
        const startIndex = (appState.currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = appState.filtered.slice(startIndex, endIndex);
        const startNum = totalResults === 0 ? 0 : startIndex + 1;
        const endNum = Math.min(endIndex, totalResults);
        els.countContainer.innerHTML = `Mostrando <strong>${startNum}–${endNum}</strong> de <strong>${totalResults}</strong> resultados`;

        if (totalResults === 0) {
            const message = appState.isFavoritesMode ? 'No tienes favoritos guardados' : 'No se encontraron pastillas';
            const subMessage = appState.isFavoritesMode ? 'Haz clic en el corazón de una pastilla para guardarla.' : 'Intenta ajustar tus filtros de búsqueda.';
            els.results.innerHTML = `<div class="no-results-container"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"></path><path d="M21 21L16.65 16.65"></path><path d="M11 8V11L13 13"></path></svg><p>${message}</p><span>${subMessage}</span></div>`;
            els.paginationContainer.innerHTML = '';
            return;
        }

        els.results.innerHTML = paginatedData.map((item, index) => {
            const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
            const posBadge = `<span class="position-badge ${posBadgeClass}">${item.posición}</span>`;
            const refsHTML = (Array.isArray(item.ref) && item.ref.length > 0)
                ? item.ref.flatMap(ref => String(ref).split(' '))
                    .map(part => `<span class="ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                    .join('')
                : '<span class="ref-badge ref-badge-na">N/A</span>';
            let firstImageSrc = 'https://via.placeholder.com/300x200.png?text=No+Img';
            if (item.imagenes && item.imagenes.length > 0) {
                firstImageSrc = item.imagenes[0];
            } else if (item.imagen) {
                firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`);
            }
            const appSummaryItems = [];
            for (let i = 0; i < 3; i++) {
                const app = item.aplicaciones?.[i];
                if (app) appSummaryItems.push(`${app.marca} ${app.serie}`);
            }
            const appSummaryHTML = appSummaryItems.length > 0
                ? `<div class="card-app-summary">${appSummaryItems.join(', ')}${item.aplicaciones?.length > 3 ? ', ...' : ''}</div>`
                : '';
            const primaryRefForData = (Array.isArray(item.ref) && item.ref.length > 0) ? String(item.ref[0]).split(' ')[0] : 'N/A';
            const isFavorite = appState.isFavorite(item._appId);
            const favoriteBtnHTML = `
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${item._appId}" aria-label="Marcar como favorito" aria-pressed="${isFavorite}">
                    <svg class="heart-icon" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>
            `;
            return `
                <div class="result-card" data-id="${item._appId}" style="animation-delay: ${index * 50}ms" tabindex="0" role="button" aria-haspopup="dialog">
                    ${favoriteBtnHTML}
                    <div class="card-thumbnail"><img src="${firstImageSrc}" alt="Referencia ${primaryRefForData}" class="result-image" loading="lazy"></div>
                    <div class="card-content-wrapper">
                        <div class="card-details">
                            <div class="card-ref-container">${refsHTML}</div>
                            ${posBadge}
                        </div>
                        ${appSummaryHTML}
                    </div>
                </div>`;
        }).join('');

        els.results.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', toggleFavorite);
        });
        setupPagination(totalResults);
    };

    function renderDynamicBrandTags(data, isFiltered) {
        if (!els.brandTagsContainer) return;
        const allBrandsList = data.flatMap(item => (item.aplicaciones || []).map(app => app.marca)).filter(Boolean);
        const brandFrequencies = allBrandsList.reduce((counts, brand) => {
            counts[brand] = (counts[brand] || 0) + 1;
            return counts;
        }, {});
        let brandsToShow = [];
        if (isFiltered) {
            brandsToShow = Object.entries(brandFrequencies)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([brand]) => brand);
        } else {
            const allUniqueBrands = Object.keys(brandFrequencies);
            const shuffled = [...allUniqueBrands].sort(() => 0.5 - Math.random());
            brandsToShow = shuffled.slice(0, 10);
        }
        const activeBrandFilter = els.marca.value.trim().toLowerCase();
        els.brandTagsContainer.innerHTML = brandsToShow.map(brand => {
            const isActive = brand.toLowerCase() === activeBrandFilter;
            return `<button class="brand-tag ${isActive ? 'active' : ''}" data-brand="${brand}">${brand}</button>`;
        }).join('');
        els.brandTagsContainer.style.display = brandsToShow.length ? 'flex' : 'none';
    }

    // === MODAL CON BOTÓN COPIAR ===
    function openModal(item) {
        const refsHeaderHTML = (Array.isArray(item.ref) && item.ref.length > 0)
            ? item.ref.flatMap(ref => String(ref).split(' '))
                .map(part => `<span class="ref-badge header-ref-badge ${getRefBadgeClass(part)}">${part}</span>`)
                .join('')
            : '<span class="ref-badge ref-badge-na header-ref-badge">N/A</span>';

        // === BOTÓN COPIAR REFERENCIA ===
        els.modalRef.innerHTML = `
            <div class="modal-ref-wrapper">
                <div class="modal-header-ref-container">${refsHeaderHTML}</div>
                <button id="copyRefBtn" class="copy-ref-btn" aria-label="Copiar referencias">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span class="copy-text">Copiar</span>
                </button>
            </div>
        `;

        // === EVENTO COPIAR ===
        document.getElementById('copyRefBtn')?.addEventListener('click', async () => {
            const btn = document.getElementById('copyRefBtn');
            const refs = item.ref?.filter(Boolean).join(' ') || 'N/A';

            try {
                await navigator.clipboard.writeText(refs);
            } catch {
                const textArea = document.createElement('textarea');
                textArea.value = refs;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 1500);
        });

        const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
        els.modalPosition.innerHTML = `<span class="position-badge ${posBadgeClass}">${item.posición}</span>`;

        let images = [];
        if (item.imagenes && item.imagenes.length > 0) {
            images = item.imagenes;
        } else if (item.imagen) {
            images = [
                item.imagen.replace("text=", `text=Vista+1+`),
                item.imagen.replace("text=", `text=Vista+2+`),
                item.imagen.replace("text=", `text=Vista+3+`)
            ];
        } else {
            images = ['https://via.placeholder.com/300x200.png?text=No+Img'];
        }

        const imageTrackHTML = images.map((imgSrc, i) =>
            `<img src="${imgSrc}" alt="Referencia ${item.ref?.[0] || 'N/A'} Vista ${i + 1}" class="result-image">`
        ).join('');

        els.modalCarousel.innerHTML = `
            <div class="image-track" style="display:flex;" data-current-index="0">${imageTrackHTML}</div>
            ${images.length > 1 ? `
                <button class="carousel-nav-btn" data-direction="-1" aria-label="Imagen anterior">‹</button>
                <button class="carousel-nav-btn" data-direction="1" aria-label="Siguiente imagen">›</button>
            ` : ''}
        `;

        els.modalCarousel.querySelectorAll('.carousel-nav-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const direction = parseInt(e.currentTarget.dataset.direction);
                navigateCarousel(els.modalCarousel, direction);
            };
        });

        if (images.length > 1) {
            els.modalCounterWrapper.innerHTML = `<span class="carousel-counter">1/${images.length}</span>`;
        } else {
            els.modalCounterWrapper.innerHTML = '';
        }

        els.modalAppsSpecs.innerHTML = `<div class="applications-list-container">${renderApplicationsList(item.aplicaciones)}${renderSpecs(item)}</div>`;
        els.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        lastFocusedElement = document.activeElement;
        els.modalCloseBtn.focus();
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
        if (counter) counter.textContent = `${newIndex + 1}/${totalImages}`;
    }

    function closeModal() {
        els.modal.style.display = 'none';
        document.body.style.overflow = '';
        els.modalCarousel.innerHTML = '';
        els.modalRef.innerHTML = '';
        els.modalPosition.innerHTML = '';
        els.modalAppsSpecs.innerHTML = '';
        els.modalCounterWrapper.innerHTML = '';
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    // === INICIALIZACIÓN CON FIREBASE ===
    async function inicializarApp() {
        showSkeletonLoader();
        renderSearchHistory();
        els.searchHistoryCard.style.display = 'none';

        try {
            const snapshot = await db.collection('pastillas').get();
            if (snapshot.empty) throw new Error("No hay datos en 'pastillas'");

            let data = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));

            data = data.map((item, index) => {
                let medidaString = null;
                if (Array.isArray(item.medidas) && item.medidas.length > 0) {
                    medidaString = String(item.medidas[0]);
                } else if (typeof item.medidas === 'string') {
                    medidaString = item.medidas;
                }
                const partes = medidaString ? medidaString.split(/x/i).map(s => parseFloat(s.trim())) : [0, 0];
                return {
                    ...item,
                    _appId: item.id || index,
                    ref: Array.isArray(item.ref) ? item.ref.map(String) : [],
                    oem: Array.isArray(item.oem) ? item.oem.map(String) : [],
                    fmsi: Array.isArray(item.fmsi) ? item.fmsi.map(String) : [],
                    aplicaciones: Array.isArray(item.aplicaciones) ? item.aplicaciones : [],
                    anchoNum: partes[0] || 0,
                    altoNum: partes[1] || 0
                };
            });

            data.sort((a, b) => getSortableRefNumber(a.ref) - getSortableRefNumber(b.ref));
            appState.data = data;

            const getAllApplicationValues = (key) => {
                const allValues = new Set();
                appState.data.forEach(item => {
                    item.aplicaciones.forEach(app => {
                        const prop = key === 'modelo' ? 'serie' : key;
                        if (app[prop]) allValues.add(String(app[prop]));
                    });
                });
                return [...allValues].sort();
            };

            fillDatalist(els.datalistMarca, getAllApplicationValues('marca'));
            fillDatalist(els.datalistModelo, getAllApplicationValues('modelo'));
            fillDatalist(els.datalistAnio, getAllApplicationValues('año'));

            const allOems = [...new Set(appState.data.flatMap(i => i.oem || []))].filter(Boolean).sort();
            const allFmsis = [...new Set(appState.data.flatMap(i => i.fmsi || []))].filter(Boolean).sort();
            fillDatalist(els.datalistOem, allOems);
            fillDatalist(els.datalistFmsi, allFmsis);

            filterData();
            setupEventListeners();
        } catch (error) {
            console.error("Error Firebase:", error);
            showGlobalError('Error de conexión', 'No se pudieron cargar los datos. Verifica tu conexión.');
        }
    }

    // === EVENTOS ===
    function setupEventListeners() {
        els.darkBtn.addEventListener('click', () => {
            els.body.classList.toggle('lp-dark');
            localStorage.setItem('theme', els.body.classList.contains('lp-dark') ? 'dark' : 'light');
        });

        els.orbitalBtn?.addEventListener('click', () => {
            els.body.classList.toggle('modo-orbital');
            localStorage.setItem('theme', 'orbital');
        });

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') els.body.classList.add('lp-dark');
        if (savedTheme === 'orbital') els.body.classList.add('modo-orbital');

        els.upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', () => {
            els.upBtn.classList.toggle('show', window.scrollY > 300);
        });

        els.menuBtn.addEventListener('click', () => {
            els.sideMenu.classList.add('open');
            els.sideMenuOverlay.style.display = 'block';
            setTimeout(() => els.sideMenuOverlay.classList.add('visible'), 10);
        });

        els.menuCloseBtn.addEventListener('click', () => {
            els.sideMenu.classList.remove('open');
            els.sideMenuOverlay.classList.remove('visible');
            setTimeout(() => els.sideMenuOverlay.style.display = 'none', 300);
        });

        els.sideMenuOverlay.addEventListener('click', () => els.menuCloseBtn.click());

        els.results.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) return;
            const card = e.target.closest('.result-card');
            if (card) {
                const item = appState.data.find(i => i._appId == card.dataset.id);
                if (item) openModal(item);
            }
        });

        els.modalCloseBtn.addEventListener('click', closeModal);
        els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });

        const debouncedFilter = debounce(filterData, 300);
        els.busqueda.addEventListener('input', debouncedFilter);
        [els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto].forEach(input =>
            input.addEventListener('input', debouncedFilter)
        );

        [els.posDel, els.posTras].forEach(btn => btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            filterData();
        }));

        els.clearBtn.addEventListener('click', () => {
            [els.busqueda, els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto].forEach(i => i.value = '');
            els.posDel.classList.remove('active');
            els.posTras.classList.remove('active');
            appState.isFavoritesMode = false;
            els.filtroFavoritosBtn.classList.remove('active');
            filterData();
        });

        els.filtroFavoritosBtn.addEventListener('click', () => {
            appState.isFavoritesMode = !appState.isFavoritesMode;
            els.filtroFavoritosBtn.classList.toggle('active');
            filterData();
        });

        els.paginationContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.page-btn');
            if (!btn || btn.disabled) return;
            const page = parseInt(btn.dataset.page);
            if (page) {
                appState.currentPage = page;
                renderCurrentPage();
                els.resultsHeaderCard.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    inicializarApp();
});