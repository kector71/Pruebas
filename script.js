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

    // ===== Mapeo de Códigos/Sufijos de Marca a Variables CSS =====
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
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
    const fillDatalist = (datalist, values) => { datalist.innerHTML = values.map(v => `<option value="${v}">`).join(''); };
    const getPositionFilter = () => { const activePositions = []; if (els.posDel.classList.contains('active')) activePositions.push('Delantera'); if (els.posTras.classList.contains('active')) activePositions.push('Trasera'); return activePositions; };
    const hasVehicleFilters = () => { return els.busqueda.value.trim() !== '' || els.marca.value.trim() !== '' || els.modelo.value.trim() !== '' || els.anio.value.trim() !== '' || getPositionFilter().length > 0 || els.oem.value.trim() !== '' || els.fmsi.value.trim() !== '' || els.medidasAncho.value.trim() !== '' || els.medidasAlto.value.trim() !== ''; };

    const filterData = () => {
        // ... (sin cambios aquí) ...
        if (!brakePadsData.length) return;
        const fbusq = (val) => val.toLowerCase().trim(); const activePos = getPositionFilter();
        const filters = { busqueda: fbusq(els.busqueda.value), marca: fbusq(els.marca.value), modelo: fbusq(els.modelo.value), anio: fbusq(els.anio.value), oem: fbusq(els.oem.value), fmsi: fbusq(els.fmsi.value), ancho: parseFloat(els.medidasAncho.value), alto: parseFloat(els.medidasAlto.value), pos: activePos };

        const filtered = brakePadsData.filter(item => {
            const itemVehicles = item.aplicaciones.map(app => `${app.marca} ${app.serie} ${app.litros} ${app.año} ${app.especificacion}`).join(' ').toLowerCase();
            const itemPosicion = item.posición;
            const busqMatch = !filters.busqueda ||
                item.ref?.some(r => r.toLowerCase().includes(filters.busqueda)) ||
                item.oem?.some(o => o.toLowerCase().includes(filters.busqueda)) ||
                item.fmsi?.some(f => f.toLowerCase().includes(filters.busqueda)) ||
                itemVehicles.includes(filters.busqueda);
            const appMatch = !filters.marca && !filters.modelo && !filters.anio || item.aplicaciones.some(app => (!filters.marca || app.marca.toLowerCase().includes(filters.marca)) && (!filters.modelo || app.serie.toLowerCase().includes(filters.modelo)) && (!filters.anio || app.año.toLowerCase().includes(filters.anio)));
            const oemMatch = !filters.oem || (item.oem && item.oem.some(o => o.toLowerCase().includes(filters.oem)));
            const fmsiMatch = !filters.fmsi || (item.fmsi && item.fmsi.some(f => f.toLowerCase().includes(filters.fmsi)));
            let posMatch = true; if (filters.pos.length > 0) { posMatch = filters.pos.includes(itemPosicion); }
            const TOLERANCIA = 1.0;
            const anchoMatchTolerancia = !filters.ancho || (item.anchoNum >= (filters.ancho - TOLERANCIA) && item.anchoNum <= (filters.ancho + TOLERANCIA));
            const altoMatchTolerancia = !filters.alto || (item.altoNum >= (filters.alto - TOLERANCIA) && item.altoNum <= (filters.alto + TOLERANCIA));
            return busqMatch && appMatch && oemMatch && fmsiMatch && posMatch && anchoMatchTolerancia && altoMatchTolerancia;
        });

        filteredDataCache = filtered;
        currentPage = 1;
        renderCurrentPage();
        updateURLWithFilters();
    };

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
            let brandCodeFound = 'default'; // Código por defecto
            const references = item.ref || []; // Asegurar que sea un array

            // 1. Buscar SUFIJOS primero (prioridad)
            for (const code of knownBrandCodes) {
                // Saltar el código 'k' en esta pasada de sufijos
                if (code === 'k') continue;

                for (const refStr of references) {
                    // Convertir a minúsculas para comparar y ver si termina con el código
                    if (refStr && typeof refStr === 'string' && refStr.toLowerCase().endsWith(code)) {
                        brandCodeFound = code; // Encontramos el código
                        break; // Salir del bucle interno (referencias)
                    }
                }
                if (brandCodeFound !== 'default') {
                    break; // Salir del bucle externo (códigos) si ya encontramos un sufijo
                }
            }

            // 2. Si NO se encontró sufijo Y existe la clave 'k', buscar PREFIJO 'K'
            if (brandCodeFound === 'default' && brandCodeColorVariables.hasOwnProperty('k')) {
                 for (const refStr of references) {
                    // Convertir a minúsculas y verificar si empieza con 'k'
                    if (refStr && typeof refStr === 'string' && refStr.toLowerCase().startsWith('k')) {
                        brandCodeFound = 'k'; // Asignar 'k' si empieza con K
                        break; // Salir del bucle interno (referencias)
                    }
                }
            }

            // Obtener la variable de color CSS usando el código encontrado ('inc', 'bp', 'k', 'bex' o 'default')
            const borderColorVar = brandCodeColorVariables[brandCodeFound];

            return `
                <div class="result-card"
                     data-ref="${primaryRef}"
                     style="animation-delay: ${index * 50}ms; border-left-color: ${borderColorVar};"
                     tabindex="0" role="button" aria-haspopup="dialog">
                    <div class="card-thumbnail"><img src="${firstImageSrc}" alt="Referencia ${primaryRef}" class="result-image" loading="lazy"></div>
                    <div class="card-content-wrapper">
                        <div class="card-details">
                            <div class="card-ref">${primaryRef}</div>
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
    function handleCardClick(event) { /* ... */ }
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
    function setupEventListeners() {
        // ... (SIN CAMBIOS aquí) ...
        [els.darkBtn, els.upBtn, els.menuBtn, els.netlifyBtn].forEach(btn => btn?.addEventListener('click', createRippleEffect));

        const iconAnimation = (iconToShow, iconToHide) => {
            if (!iconToShow) return;
            const showKeyframes = [ { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6) rotate(-90deg)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' } ];
            const hideKeyframes = [ { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6) rotate(90deg)' } ];
            const options = { duration: 400, fill: 'forwards', easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' };
            iconToShow.animate(showKeyframes, options);
            if (iconToHide) { iconToHide.animate(hideKeyframes, options); }
        };

        const applyOriginalTheme = (theme) => {
            els.body.classList.remove('lp-dark', 'netlify-dark');
            if (theme === 'dark') {
                els.body.classList.add('lp-dark');
                iconAnimation(els.moonIcon, els.sunIcon);
                els.darkBtn.setAttribute('aria-pressed', 'true');
                els.darkBtn.setAttribute('aria-label', 'Cambiar a modo claro');
            } else {
                iconAnimation(els.sunIcon, els.moonIcon);
                els.darkBtn.setAttribute('aria-pressed', 'false');
                els.darkBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
            }
            if(els.netlifyBtn) {
                els.netlifyBtn.classList.remove('active'); // Remover clase active
                els.netlifyBtn.setAttribute('aria-pressed', 'false');
            }
            localStorage.setItem('themePreference', theme);
        };

        els.darkBtn.addEventListener('click', () => {
            const isCurrentlyDark = els.body.classList.contains('lp-dark');
            applyOriginalTheme(isCurrentlyDark ? 'light' : 'dark');
            els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
            setTimeout(() => { els.headerX.style.animation = ''; }, 600);
        });

        const applyNetlifyTheme = () => {
            els.body.classList.remove('lp-dark');
            els.body.classList.add('netlify-dark');
            els.netlifyBtn.classList.add('active'); // Añadir clase active
            els.netlifyBtn.setAttribute('aria-pressed', 'true');
            iconAnimation(els.sunIcon, els.moonIcon);
            els.darkBtn.setAttribute('aria-pressed', 'false');
            localStorage.setItem('themePreference', 'netlify');
        };

        if(els.netlifyBtn) {
            els.netlifyBtn.addEventListener('click', () => {
                const isCurrentlyNetlify = els.body.classList.contains('netlify-dark');
                if (isCurrentlyNetlify) {
                    applyOriginalTheme('light');
                } else {
                    applyNetlifyTheme();
                }
                els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                setTimeout(() => { els.headerX.style.animation = ''; }, 600);
                const themeIcon = els.netlifyBtn.querySelector('.lp-icon-palette');
                if (themeIcon) {
                    themeIcon.animate([ { transform: 'translate(-50%, -50%) scale(0.8) rotate(0deg)', opacity: 0.7 }, { transform: 'translate(-50%, -50%) scale(1.2) rotate(30deg)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 } ], { duration: 400, easing: 'ease-out' });
                }
            });
        }

        const savedTheme = localStorage.getItem('themePreference');
        if (savedTheme === 'netlify' && els.netlifyBtn) {
            applyNetlifyTheme();
            iconAnimation(els.sunIcon, null);
        } else if (savedTheme === 'dark') {
            applyOriginalTheme('dark');
        } else {
            applyOriginalTheme('light');
        }

        els.upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', () => { els.upBtn.classList.toggle('show', window.scrollY > 300); });
        els.menuBtn.addEventListener('click', openSideMenu);
        els.menuCloseBtn.addEventListener('click', closeSideMenu);
        els.sideMenuOverlay.addEventListener('click', closeSideMenu);
        els.openGuideLink.addEventListener('click', () => { closeSideMenu(); setTimeout(openGuideModal, 50); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && els.sideMenu.classList.contains('open')) { closeSideMenu(); } });

        const debouncedFilter = debounce(filterData, 300);

        const savedView = localStorage.getItem('viewMode');
        if (savedView === 'list') { els.results.classList.add('list-view'); els.viewGridBtn.classList.remove('active'); els.viewGridBtn.setAttribute('aria-checked', 'false'); els.viewListBtn.classList.add('active'); els.viewListBtn.setAttribute('aria-checked', 'true'); } else { els.results.classList.remove('list-view'); els.viewGridBtn.classList.add('active'); els.viewGridBtn.setAttribute('aria-checked', 'true'); els.viewListBtn.classList.remove('active'); els.viewListBtn.setAttribute('aria-checked', 'false'); }
        els.viewGridBtn.addEventListener('click', () => { if (els.results.classList.contains('list-view')) { els.results.classList.remove('list-view'); els.viewGridBtn.classList.add('active'); els.viewGridBtn.setAttribute('aria-checked', 'true'); els.viewListBtn.classList.remove('active'); els.viewListBtn.setAttribute('aria-checked', 'false'); localStorage.setItem('viewMode', 'grid'); } });
        els.viewListBtn.addEventListener('click', () => { if (!els.results.classList.contains('list-view')) { els.results.classList.add('list-view'); els.viewGridBtn.classList.remove('active'); els.viewGridBtn.setAttribute('aria-checked', 'false'); els.viewListBtn.classList.add('active'); els.viewListBtn.setAttribute('aria-checked', 'true'); localStorage.setItem('viewMode', 'list'); } });

        const restartSearchIconAnimation = () => { const oldIcon = els.searchContainer.querySelector('.search-icon'); if (oldIcon) { const newIcon = oldIcon.cloneNode(true); oldIcon.parentNode.replaceChild(newIcon, oldIcon); if (els.busqueda.value.trim() !== '') { newIcon.style.animation = 'none'; void newIcon.offsetWidth; newIcon.style.animation = ''; } } };
        els.busqueda.addEventListener('input', (e) => { if (e.target.value.trim() !== '') { els.searchContainer.classList.add('active'); restartSearchIconAnimation(); } else { els.searchContainer.classList.remove('active'); } debouncedFilter(); });
        els.busqueda.addEventListener('blur', () => { if (els.busqueda.value.trim() === '') { els.searchContainer.classList.remove('active'); } });
        els.busqueda.addEventListener('focus', () => { if (els.busqueda.value.trim() !== '') { els.searchContainer.classList.add('active'); restartSearchIconAnimation(); } });

        const otherFilterInputs = [els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto];
        otherFilterInputs.forEach(input => input.addEventListener('input', debouncedFilter));

        [els.posDel, els.posTras].forEach(btn => btn.addEventListener('click', (e) => { e.currentTarget.classList.toggle('active'); filterData(); }));

        const trashLid = els.clearBtn.querySelector('.trash-lid'); const trashBody = els.clearBtn.querySelector('.trash-body'); const NUM_SPARKS = 10; const SPARK_COLORS = ['#00ffff', '#ff00ff', '#00ff7f', '#ffc700', '#ff5722'];
        function createSparks(button) { for (let i = 0; i < NUM_SPARKS; i++) { const spark = document.createElement('div'); spark.classList.add('spark'); const size = Math.random() * 4 + 3; spark.style.width = `${size}px`; spark.style.height = `${size}px`; spark.style.backgroundColor = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]; spark.style.left = `calc(50% + ${Math.random() * 20 - 10}px)`; spark.style.top = `calc(50% + ${Math.random() * 20 - 10}px)`; const angle = Math.random() * Math.PI * 2; const distance = Math.random() * 25 + 20; const sparkX = Math.cos(angle) * distance; const sparkY = Math.sin(angle) * distance; spark.style.setProperty('--spark-x', `${sparkX}px`); spark.style.setProperty('--spark-y', `${sparkY}px`); button.appendChild(spark); spark.addEventListener('animationend', () => spark.remove(), { once: true }); } }
        els.clearBtn.addEventListener('click', (e) => { if (els.clearBtn.disabled) return; els.clearBtn.disabled = true; const rect = e.currentTarget.getBoundingClientRect(); createRippleEffect({ currentTarget: e.currentTarget, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, target: e.currentTarget, preventDefault: () => {} }); els.clearBtn.classList.add('animate-button'); if (trashLid) trashLid.classList.add('animate-lid'); if (trashBody) trashBody.classList.add('animate-body'); createSparks(els.clearBtn); clearAllFilters(); setTimeout(() => { els.clearBtn.classList.remove('animate-button'); if (trashLid) trashLid.classList.remove('animate-lid'); if (trashBody) trashBody.classList.remove('animate-body'); els.clearBtn.disabled = false; }, 900); });

        if (els.brandTagsContainer) { els.brandTagsContainer.addEventListener('click', (e) => { const tag = e.target.closest('.brand-tag'); if (!tag) return; const brand = tag.dataset.brand; const isActive = tag.classList.contains('active'); els.brandTagsContainer.querySelectorAll('.brand-tag.active').forEach(activeTag => { if (activeTag !== tag) { activeTag.classList.remove('active'); activeTag.style.borderColor = ''; activeTag.style.color = ''; } }); if (isActive) { tag.classList.remove('active'); tag.style.borderColor = ''; tag.style.color = ''; els.marca.value = ''; } else { tag.classList.add('active'); const colorVar = brandColorMap[brand]; if (colorVar) { const activeColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim(); tag.style.borderColor = activeColor; tag.style.color = activeColor; } els.marca.value = brand; } filterData(); }); }

        els.paginationContainer.addEventListener('click', (e) => { const btn = e.target.closest('.page-btn'); if (!btn || btn.disabled || btn.classList.contains('active')) { return; } const newPage = parseInt(btn.dataset.page); if (newPage) { currentPage = newPage; renderCurrentPage(); els.resultsHeaderCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });

        els.modalCloseBtn.addEventListener('click', closeModal);
        els.modal.addEventListener('click', (event) => { if (event.target === els.modal) { closeModal(); } });

        els.guideModalCloseBtn.addEventListener('click', closeGuideModal);
        els.guideModal.addEventListener('click', (event) => { if (event.target === els.guideModal) { closeGuideModal(); } });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && els.guideModal.style.display === 'flex') { closeGuideModal(); } });

    }

    async function inicializarApp() {
        showSkeletonLoader();
        try {
            const response = await fetch('data.json');
            if (!response.ok) { throw new Error(`Error HTTP! estado: ${response.status}`); }
            let data = await response.json();
            data = data.map(item => {
                 // No es necesario añadir marcaPastilla aquí si usamos sufijos
                if (item.imagen && (!item.imagenes || item.imagenes.length === 0)) {
                    item.imagenes = [ item.imagen.replace("text=", `text=Vista+1+`), item.imagen.replace("text=", `text=Vista+2+`), item.imagen.replace("text=", `text=Vista+3+`) ];
                }
                const partes = item.medidas ? item.medidas.split('x').map(s => parseFloat(s.trim())) : [0,0];
                return { ...item, anchoNum: partes[0] || 0, altoNum: partes[1] || 0 };
            });
            brakePadsData = data;
            const getAllApplicationValues = (key) => { const allValues = new Set(); brakePadsData.forEach(item => { item.aplicaciones.forEach(app => { const prop = (key === 'modelo') ? 'serie' : key; if (app[prop]) allValues.add(app[prop]); }); }); return [...allValues].sort(); };
            fillDatalist(els.datalistMarca, getAllApplicationValues('marca'));
            fillDatalist(els.datalistModelo, getAllApplicationValues('modelo'));
            fillDatalist(els.datalistAnio, getAllApplicationValues('año'));
            const allOems = [...new Set(brakePadsData.flatMap(i => i.oem || []))].filter(Boolean).sort();
            const allFmsis = [...new Set(brakePadsData.flatMap(i => i.fmsi || []))].filter(Boolean).sort();
            fillDatalist(els.datalistOem, allOems);
            fillDatalist(els.datalistFmsi, allFmsis);
            const allBrandsList = brakePadsData.flatMap(item => item.aplicaciones.map(app => app.marca)).filter(Boolean);
            const brandFrequencies = allBrandsList.reduce((counts, brand) => { counts[brand] = (counts[brand] || 0) + 1; return counts; }, {});
            const sortedBrands = Object.entries(brandFrequencies).sort(([, countA], [, countB]) => countB - countA).slice(0, 10).map(([brand]) => brand);
            const brandColorsCSS = [ '--brand-color-1', '--brand-color-2', '--brand-color-3', '--brand-color-4', '--brand-color-5', '--brand-color-6', '--brand-color-7', '--brand-color-8', '--brand-color-9', '--brand-color-10' ];
            brandColorMap = {}; // Reset for tag colors
            sortedBrands.forEach((brand, index) => { brandColorMap[brand] = brandColorsCSS[index % brandColorsCSS.length]; });
            if (els.brandTagsContainer) { els.brandTagsContainer.innerHTML = sortedBrands.map(brand => `<button class="brand-tag" data-brand="${brand}">${brand}</button>`).join(''); }
            applyFiltersFromURL();
            filterData();
        } catch (error) {
            console.error("Error al cargar los datos:", error);
            els.results.innerHTML = `<div class="no-results-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line><line x1="12" y1="22" x2="12" y2="22"></line></svg><p>Error al cargar datos</p><span>No se pudo conectar con la base de datos (data.json). Asegúrate que el archivo exista y tenga el formato correcto.</span></div>`;
            els.countContainer.innerHTML = "Error";
            els.paginationContainer.innerHTML = '';
        }
    }

    setupEventListeners();
    inicializarApp();
});
