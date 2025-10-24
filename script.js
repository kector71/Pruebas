document.addEventListener('DOMContentLoaded', () => {

    let brakePadsData = [];
    let currentPage = 1;
    const itemsPerPage = 24;
    let filteredDataCache = [];
    let brandColorMap = {}; // Para etiquetas de marca (si las usas)

    const els = {
        // ... (element references remain the same) ...
        body: document.body, headerX: document.querySelector('.header-x'), darkBtn: document.getElementById('darkBtn'),
        sunIcon: document.querySelector('.lp-icon-sun'), moonIcon: document.querySelector('.lp-icon-moon'),
        netlifyBtn: document.getElementById('netlifyBtn'),
        upBtn: document.getElementById('upBtn'),
        menuBtn: document.getElementById('menuBtn'),
        sideMenu: document.getElementById('side-menu'),
        sideMenuOverlay: document.getElementById('side-menu-overlay'),
        menuCloseBtn: document.getElementById('menuCloseBtn'),
        openGuideLink: document.getElementById('open-guide-link'),
        busqueda: document.getElementById('busquedaRapida'), marca: document.getElementById('filtroMarca'),
        modelo: document.getElementById('filtroModelo'), anio: document.getElementById('filtroAnio'),
        oem: document.getElementById('filtroOem'), fmsi: document.getElementById('filtroFmsi'),
        medidasAncho: document.getElementById('medidasAncho'), medidasAlto: document.getElementById('medidasAlto'),
        posDel: document.getElementById('positionDelantera'), posTras: document.getElementById('positionTrasera'),
        clearBtn: document.getElementById('clearFiltersBtn'),
        datalistMarca: document.getElementById('marcas'), datalistModelo: document.getElementById('modelos'),
        datalistAnio: document.getElementById('anios'), datalistOem: document.getElementById('oemList'),
        datalistFmsi: document.getElementById('fmsiList'),
        results: document.getElementById('results-container'),
        viewGridBtn: document.getElementById('viewGridBtn'),
        viewListBtn: document.getElementById('viewListBtn'),
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
        guideModalContent: document.querySelector('#guide-modal .modal-content'),
        guideModalCloseBtn: document.querySelector('#guide-modal .modal-close-btn')
    };

    // Mapeo de Códigos/Sufijos de Marca a Variables CSS
    const brandCodeColorVariables = {
        // Claves: Códigos/Sufijos exactos en MINÚSCULAS
        'inc': 'var(--brand-color-inc)', // Azul Oscuro
        'bp': 'var(--brand-color-bp)',   // Negro
        'k': 'var(--brand-color-k)',     // Rojo (para prefijo)
        'bex': 'var(--brand-color-bex)', // Azul Claro
        // Añade más sufijos si es necesario
        'default': 'var(--brand-color-default)' // Fallback
    };
    // Lista de códigos/sufijos conocidos (excluyendo 'default')
    const knownBrandCodes = Object.keys(brandCodeColorVariables).filter(k => k !== 'default');

    // --- FUNCIONES ---
    const debounce = (func, delay) => { /* ... (sin cambios) ... */ };
    const fillDatalist = (datalist, values) => { /* ... (sin cambios) ... */ };
    const getPositionFilter = () => { /* ... (sin cambios) ... */ };
    const hasVehicleFilters = () => { /* ... (sin cambios) ... */ };
    const filterData = () => { /* ... (sin cambios) ... */ };
    function navigateCarousel(carouselContainer, direction) { /* ... (sin cambios) ... */ }
    const renderApplicationsList = (aplicaciones) => { /* ... (sin cambios) ... */ };
    const renderSpecs = (item) => { /* ... (sin cambios) ... */ };
    const showSkeletonLoader = (count = 6) => { /* ... (sin cambios) ... */ };
    function setupPagination(totalItems) { /* ... (sin cambios) ... */ }

    const renderCurrentPage = () => {
        const totalResults = filteredDataCache.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredDataCache.slice(startIndex, endIndex);

        const startNum = totalResults === 0 ? 0 : startIndex + 1;
        const endNum = Math.min(endIndex, totalResults);
        els.countContainer.innerHTML = `Mostrando <strong>${startNum}–${endNum}</strong> de <strong>${totalResults}</strong> resultados`;

        if (totalResults === 0) {
            els.results.innerHTML = `<div class="no-results-container">...</div>`; // Sin cambios
            els.paginationContainer.innerHTML = '';
            return;
        }

        els.results.innerHTML = paginatedData.map((item, index) => {
            const posBadgeClass = item.posición === 'Delantera' ? 'delantera' : 'trasera';
            const posBadge = `<span class="position-badge ${posBadgeClass}">${item.posición}</span>`;
            const primaryRef = item.ref && item.ref.length > 0 ? item.ref[0] : 'N/A';

            let firstImageSrc = 'https://via.placeholder.com/300x200.png?text=No+Img';
            // ... (lógica imágenes sin cambios) ...
             if (item.imagenes && item.imagenes.length > 0) {
                firstImageSrc = item.imagenes[0];
            } else if (item.imagen) {
                firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`);
            }


            const appSummaryItems = item.aplicaciones.slice(0, 3).map(app => `${app.marca} ${app.serie}`).filter((value, index, self) => self.indexOf(value) === index);
            let appSummaryHTML = '';
             if (appSummaryItems.length > 0) {
                appSummaryHTML = `<div class="card-app-summary">${appSummaryItems.join(', ')}${item.aplicaciones.length > 3 ? ', ...' : ''}</div>`;
            }

            // ===== Buscar código (sufijo O prefijo 'K') =====
            let brandCodeFound = 'default';
            const references = item.ref || [];

            // 1. Buscar SUFIJOS
            for (const code of knownBrandCodes) {
                if (code === 'k') continue; // Saltar prefijo K
                for (const refStr of references) {
                    if (refStr && typeof refStr === 'string' && refStr.toLowerCase().endsWith(code)) {
                        brandCodeFound = code;
                        break;
                    }
                }
                if (brandCodeFound !== 'default') break;
            }

            // 2. Buscar PREFIJO 'K' si no se encontró sufijo
            if (brandCodeFound === 'default' && brandCodeColorVariables.hasOwnProperty('k')) {
                 for (const refStr of references) {
                    if (refStr && typeof refStr === 'string' && refStr.toLowerCase().startsWith('k')) {
                        brandCodeFound = 'k';
                        break;
                    }
                }
            }

            // Obtener la variable de color CSS
            const textColorVar = brandCodeColorVariables[brandCodeFound]; // <-- Cambiamos nombre de variable

            // ===== Aplicar color al TEXTO de la referencia =====
            return `
                <div class="result-card"
                     data-ref="${primaryRef}"
                     style="animation-delay: ${index * 50}ms;" {/* <-- Quitamos border-left-color */}
                     tabindex="0" role="button" aria-haspopup="dialog">
                    <div class="card-thumbnail"><img src="${firstImageSrc}" alt="Referencia ${primaryRef}" class="result-image" loading="lazy"></div>
                    <div class="card-content-wrapper">
                        <div class="card-details">
                            {/* Aplicamos el estilo de color aquí 👇 */}
                            <div class="card-ref" style="color: ${textColorVar};">${primaryRef}</div>
                            ${posBadge}
                        </div>
                        ${appSummaryHTML}
                    </div>
                </div>`;
        }).join('');

        els.results.removeEventListener('click', handleCardClick);
        els.results.addEventListener('click', handleCardClick);
        setupPagination(totalResults);
    };

    // ... (resto de funciones SIN CAMBIOS) ...
    function handleCardClick(event) {
        // console.log('Handling card click...'); // <-- Puedes añadir esto para depurar
        const card = event.target.closest('.result-card');
        if (card) {
            // console.log('Card found:', card); // <-- Depuración
            const primaryRef = card.dataset.ref;
            // console.log('Data ref:', primaryRef); // <-- Depuración
            if (primaryRef && primaryRef !== 'N/A') {
                const itemData = brakePadsData.find(item => item.ref && item.ref.length > 0 && item.ref[0] === primaryRef);
                // console.log('Item data found:', itemData); // <-- Depuración
                if (itemData) {
                    openModal(itemData);
                } else {
                    console.warn('No matching data found for ref:', primaryRef); // Aviso si no encuentra datos
                }
            } else {
                 console.warn('Card clicked but data-ref is missing or N/A');
            }
        }
    }
    const updateScrollIndicator = () => { /* ... */ };
    function openModal(item) { /* ... */ }
    function closeModal() { /* ... */ }
    function openGuideModal() { /* ... */ }
    function closeGuideModal() { /* ... */ }
    function openSideMenu() { /* ... */ }
    function closeSideMenu() { /* ... */ }
    function setupSwipe(carouselElement) { /* ... */ }
    const clearAllFilters = () => { /* ... */ };
    const createRippleEffect = (event) => { /* ... */ };
    const updateURLWithFilters = () => { /* ... */ };
    const applyFiltersFromURL = () => { /* ... */ };


    // --- SETUP EVENT LISTENERS ---
    function setupEventListeners() { /* ... (SIN CAMBIOS aquí) ... */ }

    async function inicializarApp() { /* ... (SIN CAMBIOS aquí) ... */ }

    setupEventListeners();
    inicializarApp();
});
