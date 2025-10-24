document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Iniciando script..."); // <-- Depuración

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
    console.log("Elementos del DOM seleccionados:", els); // <-- Depuración

    // Mapeo de Códigos/Sufijos de Marca a Variables CSS
    const brandCodeColorVariables = {
        'inc': 'var(--brand-color-inc)',
        'bp': 'var(--brand-color-bp)',
        'k': 'var(--brand-color-k)',
        'bex': 'var(--brand-color-bex)',
        'default': 'var(--brand-color-default)'
    };
    const knownBrandCodes = Object.keys(brandCodeColorVariables).filter(k => k !== 'default');
    console.log("Códigos de marca definidos:", knownBrandCodes); // <-- Depuración

    // --- FUNCIONES ---
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
    const fillDatalist = (datalist, values) => { if(datalist) datalist.innerHTML = values.map(v => `<option value="${v}">`).join(''); };
    const getPositionFilter = () => { const activePositions = []; if (els.posDel?.classList.contains('active')) activePositions.push('Delantera'); if (els.posTras?.classList.contains('active')) activePositions.push('Trasera'); return activePositions; };
    const hasVehicleFilters = () => { /* ... (sin cambios) ... */ };

    const filterData = () => {
        console.log("Filtrando datos..."); // <-- Depuración
        if (!brakePadsData || brakePadsData.length === 0) {
            console.warn("No hay datos cargados para filtrar."); // <-- Depuración
            return;
        }
        try { // <-- Añadido try...catch para errores de filtrado
            const fbusq = (val) => (val || '').toLowerCase().trim(); // Añadir chequeo por si val es undefined
            const activePos = getPositionFilter();
            const filters = {
                busqueda: fbusq(els.busqueda?.value),
                marca: fbusq(els.marca?.value),
                modelo: fbusq(els.modelo?.value),
                anio: fbusq(els.anio?.value),
                oem: fbusq(els.oem?.value),
                fmsi: fbusq(els.fmsi?.value),
                ancho: parseFloat(els.medidasAncho?.value) || null, // Usar null si no es número
                alto: parseFloat(els.medidasAlto?.value) || null,   // Usar null si no es número
                pos: activePos
            };
            // console.log("Filtros aplicados:", filters); // <-- Depuración (opcional, puede ser mucho output)

            filteredDataCache = brakePadsData.filter(item => {
                // Añadir chequeos por si item no tiene las propiedades esperadas
                const aplicaciones = item.aplicaciones || [];
                const itemVehicles = aplicaciones.map(app => `${app.marca || ''} ${app.serie || ''} ${app.litros || ''} ${app.año || ''} ${app.especificacion || ''}`).join(' ').toLowerCase();
                const itemPosicion = item.posición || '';
                const itemRefs = item.ref || [];
                const itemOems = item.oem || [];
                const itemFmsis = item.fmsi || [];

                const busqMatch = !filters.busqueda ||
                    itemRefs.some(r => r && r.toLowerCase().includes(filters.busqueda)) ||
                    itemOems.some(o => o && o.toLowerCase().includes(filters.busqueda)) ||
                    itemFmsis.some(f => f && f.toLowerCase().includes(filters.busqueda)) ||
                    itemVehicles.includes(filters.busqueda);

                const appMatch = !filters.marca && !filters.modelo && !filters.anio || aplicaciones.some(app =>
                    (!filters.marca || (app.marca && app.marca.toLowerCase().includes(filters.marca))) &&
                    (!filters.modelo || (app.serie && app.serie.toLowerCase().includes(filters.modelo))) &&
                    (!filters.anio || (app.año && app.año.toLowerCase().includes(filters.anio)))
                );

                const oemMatch = !filters.oem || itemOems.some(o => o && o.toLowerCase().includes(filters.oem));
                const fmsiMatch = !filters.fmsi || itemFmsis.some(f => f && f.toLowerCase().includes(filters.fmsi));

                let posMatch = true;
                if (filters.pos.length > 0) {
                    posMatch = filters.pos.includes(itemPosicion);
                }

                const TOLERANCIA = 1.0;
                const anchoNum = item.anchoNum || 0;
                const altoNum = item.altoNum || 0;

                const anchoMatchTolerancia = !filters.ancho || (anchoNum >= (filters.ancho - TOLERANCIA) && anchoNum <= (filters.ancho + TOLERANCIA));
                const altoMatchTolerancia = !filters.alto || (altoNum >= (filters.alto - TOLERANCIA) && altoNum <= (filters.alto + TOLERANCIA));

                return busqMatch && appMatch && oemMatch && fmsiMatch && posMatch && anchoMatchTolerancia && altoMatchTolerancia;
            });

            console.log(`Filtrado completado. Resultados encontrados: ${filteredDataCache.length}`); // <-- Depuración
            currentPage = 1;
            renderCurrentPage();
            updateURLWithFilters();
        } catch (error) {
            console.error("Error durante el filtrado:", error); // <-- Captura de error
            els.results.innerHTML = `<div class="no-results-container"><p>Error al filtrar los datos.</p><span>Revisa la consola para más detalles.</span></div>`;
            els.paginationContainer.innerHTML = '';
        }
    };

    function navigateCarousel(carouselContainer, direction) { /* ... (sin cambios) ... */ }
    const renderApplicationsList = (aplicaciones) => { /* ... (sin cambios) ... */ };
    const renderSpecs = (item) => { /* ... (sin cambios) ... */ };
    const showSkeletonLoader = (count = 6) => { /* ... (sin cambios) ... */ };
    function setupPagination(totalItems) { /* ... (sin cambios) ... */ }

    const renderCurrentPage = () => {
        console.log(`Renderizando página ${currentPage}...`); // <-- Depuración
        if (!els.results || !els.countContainer || !els.paginationContainer) {
            console.error("Error: Elementos clave del DOM para renderizar no encontrados.");
            return;
        }
         if (!filteredDataCache) {
             console.error("Error: filteredDataCache no está definido.");
             filteredDataCache = []; // Prevenir error mayor
         }

        const totalResults = filteredDataCache.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredDataCache.slice(startIndex, endIndex);

        const startNum = totalResults === 0 ? 0 : startIndex + 1;
        const endNum = Math.min(endIndex, totalResults);
        els.countContainer.innerHTML = `Mostrando <strong>${startNum}–${endNum}</strong> de <strong>${totalResults}</strong> resultados`;

        if (totalResults === 0) {
            console.log("No hay resultados para mostrar."); // <-- Depuración
            els.results.innerHTML = `<div class="no-results-container"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"></path><path d="M21 21L16.65 16.65"></path><path d="M11 8V11L13 13"></path></svg><p>No se encontraron pastillas</p><span>Intenta ajustar tus filtros de búsqueda.</span></div>`;
            els.paginationContainer.innerHTML = '';
            return;
        }

        try { // <-- Añadido try...catch para errores de renderizado
            els.results.innerHTML = paginatedData.map((item, index) => {
                const posBadgeClass = (item.posición === 'Delantera') ? 'delantera' : 'trasera';
                const posBadge = `<span class="position-badge ${posBadgeClass}">${item.posición || ''}</span>`; // Añadido chequeo por si no hay posición
                const references = item.ref || []; // Asegurar que sea array
                const primaryRef = references.length > 0 ? references[0] : 'N/A';

                let firstImageSrc = 'https://via.placeholder.com/300x200.png?text=No+Img';
                const images = item.imagenes || []; // Asegurar array
                if (images.length > 0) {
                    firstImageSrc = images[0];
                } else if (item.imagen) { // Fallback
                    firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`);
                }

                const aplicaciones = item.aplicaciones || []; // Asegurar array
                const appSummaryItems = aplicaciones.slice(0, 3).map(app => `${app.marca || ''} ${app.serie || ''}`).filter((value, index, self) => self.indexOf(value) === index && value.trim() !== '');
                let appSummaryHTML = '';
                if (appSummaryItems.length > 0) {
                    appSummaryHTML = `<div class="card-app-summary">${appSummaryItems.join(', ')}${aplicaciones.length > 3 ? ', ...' : ''}</div>`;
                }

                // ===== Buscar código (sufijo O prefijo 'K') =====
                let brandCodeFound = 'default';
                for (const code of knownBrandCodes) {
                    if (code === 'k') continue; // Saltar prefijo K aquí
                    for (const refStr of references) {
                        if (refStr && typeof refStr === 'string' && refStr.toLowerCase().endsWith(code)) {
                            brandCodeFound = code; break;
                        }
                    }
                    if (brandCodeFound !== 'default') break;
                }
                if (brandCodeFound === 'default' && brandCodeColorVariables.hasOwnProperty('k')) {
                    for (const refStr of references) {
                        if (refStr && typeof refStr === 'string' && refStr.toLowerCase().startsWith('k')) {
                            brandCodeFound = 'k'; break;
                        }
                    }
                }
                const textColorVar = brandCodeColorVariables[brandCodeFound] || brandCodeColorVariables['default']; // Asegurar fallback

                return `
                    <div class="result-card"
                         data-ref="${primaryRef}"
                         style="animation-delay: ${index * 50}ms;"
                         tabindex="0" role="button" aria-haspopup="dialog">
                        <div class="card-thumbnail"><img src="${firstImageSrc}" alt="Referencia ${primaryRef}" class="result-image" loading="lazy"></div>
                        <div class="card-content-wrapper">
                            <div class="card-details">
                                <div class="card-ref" style="color: ${textColorVar};">${primaryRef}</div>
                                ${posBadge}
                            </div>
                            ${appSummaryHTML}
                        </div>
                    </div>`;
            }).join('');

            // Asegurarse de que el listener se añade después de actualizar el HTML
            els.results.removeEventListener('click', handleCardClick);
            els.results.addEventListener('click', handleCardClick);
            setupPagination(totalResults);
            console.log("Renderizado completado."); // <-- Depuración

        } catch (error) {
            console.error("Error durante el renderizado de tarjetas:", error); // <-- Captura error
             els.results.innerHTML = `<div class="no-results-container"><p>Error al mostrar los resultados.</p><span>Revisa la consola para más detalles.</span></div>`;
            els.paginationContainer.innerHTML = '';
        }
    };

    function handleCardClick(event) {
        console.log('Clic detectado en results-container'); // <-- Depuración
        const card = event.target.closest('.result-card');
        if (card) {
            console.log('Tarjeta clickeada:', card); // <-- Depuración
            const primaryRef = card.dataset.ref;
            console.log('Buscando datos para ref:', primaryRef); // <-- Depuración
            if (primaryRef && primaryRef !== 'N/A') {
                // CORRECCIÓN: Buscar en CUALQUIER referencia, no solo la primera
                 const itemData = brakePadsData.find(item =>
                    item.ref && Array.isArray(item.ref) && item.ref.includes(primaryRef)
                );
                // console.log('Item data found:', itemData); // <-- Depuración
                if (itemData) {
                    console.log("Abriendo modal para:", primaryRef); // <-- Depuración
                    openModal(itemData);
                } else {
                    console.warn('No matching data found for ref:', primaryRef);
                }
            } else {
                 console.warn('Card clicked but data-ref is missing or N/A');
            }
        } else {
             console.log("Clic no fue en una tarjeta."); // <-- Depuración
        }
    }
    const updateScrollIndicator = () => { /* ... (sin cambios) ... */ };
    function openModal(item) { /* ... (sin cambios, verificar si se llama) ... */ }
    function closeModal() { /* ... (sin cambios) ... */ }
    function openGuideModal() { /* ... (sin cambios) ... */ }
    function closeGuideModal() { /* ... (sin cambios) ... */ }
    function openSideMenu() { /* ... (sin cambios) ... */ }
    function closeSideMenu() { /* ... (sin cambios) ... */ }
    function setupSwipe(carouselElement) { /* ... (sin cambios) ... */ }
    const clearAllFilters = () => { /* ... (sin cambios) ... */ };
    const createRippleEffect = (event) => { /* ... (sin cambios) ... */ };
    const updateURLWithFilters = () => { /* ... (sin cambios) ... */ };
    const applyFiltersFromURL = () => { /* ... (sin cambios) ... */ };

    // --- SETUP EVENT LISTENERS ---
    function setupEventListeners() {
        console.log("Configurando event listeners..."); // <-- Depuración
        try { // <-- Añadir try...catch aquí también
            [els.darkBtn, els.upBtn, els.menuBtn, els.netlifyBtn].forEach(btn => {
                if (btn) { // <-- Verificar si el botón existe
                    btn.addEventListener('click', createRippleEffect);
                } else {
                     console.warn("Un botón (dark, up, menu, netlify) no fue encontrado.");
                }
            });

            const iconAnimation = (iconToShow, iconToHide) => { /* ... (sin cambios) ... */ };
            const applyOriginalTheme = (theme) => { /* ... (sin cambios) ... */ };

            if (els.darkBtn) { // <-- Verificar si el botón existe
                els.darkBtn.addEventListener('click', () => {
                     console.log("Clic en darkBtn"); // <-- Depuración
                    const isCurrentlyDark = els.body.classList.contains('lp-dark');
                    applyOriginalTheme(isCurrentlyDark ? 'light' : 'dark');
                    if(els.headerX) els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                    setTimeout(() => { if(els.headerX) els.headerX.style.animation = ''; }, 600);
                });
            } else { console.warn("darkBtn no encontrado."); }

            const applyNetlifyTheme = () => { /* ... (sin cambios) ... */ };

            if(els.netlifyBtn) { // <-- Verificar si el botón existe
                els.netlifyBtn.addEventListener('click', () => {
                    console.log("Clic en netlifyBtn"); // <-- Depuración
                    const isCurrentlyNetlify = els.body.classList.contains('netlify-dark');
                    if (isCurrentlyNetlify) {
                        applyOriginalTheme('light');
                    } else {
                        applyNetlifyTheme();
                    }
                    if(els.headerX) els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                    setTimeout(() => { if(els.headerX) els.headerX.style.animation = ''; }, 600);
                    const themeIcon = els.netlifyBtn.querySelector('.lp-icon-palette');
                    if (themeIcon) {
                        themeIcon.animate([ { transform: 'translate(-50%, -50%) scale(0.8) rotate(0deg)', opacity: 0.7 }, { transform: 'translate(-50%, -50%) scale(1.2) rotate(30deg)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 } ], { duration: 400, easing: 'ease-out' });
                    }
                });
            } else { console.warn("netlifyBtn no encontrado."); }

            // ... (resto de listeners sin cambios, pero con chequeos añadidos) ...
            const savedTheme = localStorage.getItem('themePreference');
            if (savedTheme === 'netlify' && els.netlifyBtn) { applyNetlifyTheme(); iconAnimation(els.sunIcon, null); }
            else if (savedTheme === 'dark') { applyOriginalTheme('dark'); }
            else { applyOriginalTheme('light'); }

            if(els.upBtn) els.upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            window.addEventListener('scroll', () => { if(els.upBtn) els.upBtn.classList.toggle('show', window.scrollY > 300); });
            if(els.menuBtn) els.menuBtn.addEventListener('click', openSideMenu);
            if(els.menuCloseBtn) els.menuCloseBtn.addEventListener('click', closeSideMenu);
            if(els.sideMenuOverlay) els.sideMenuOverlay.addEventListener('click', closeSideMenu);
            if(els.openGuideLink) els.openGuideLink.addEventListener('click', () => { closeSideMenu(); setTimeout(openGuideModal, 50); });
            window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && els.sideMenu?.classList.contains('open')) { closeSideMenu(); } });

            const debouncedFilter = debounce(filterData, 300);

            const savedView = localStorage.getItem('viewMode');
             if(els.results && els.viewGridBtn && els.viewListBtn) { // Check elements exist
                if (savedView === 'list') { els.results.classList.add('list-view'); els.viewGridBtn.classList.remove('active'); els.viewGridBtn.setAttribute('aria-checked', 'false'); els.viewListBtn.classList.add('active'); els.viewListBtn.setAttribute('aria-checked', 'true'); }
                else { els.results.classList.remove('list-view'); els.viewGridBtn.classList.add('active'); els.viewGridBtn.setAttribute('aria-checked', 'true'); els.viewListBtn.classList.remove('active'); els.viewListBtn.setAttribute('aria-checked', 'false'); }
                els.viewGridBtn.addEventListener('click', () => { if (els.results.classList.contains('list-view')) { els.results.classList.remove('list-view'); els.viewGridBtn.classList.add('active'); els.viewGridBtn.setAttribute('aria-checked', 'true'); els.viewListBtn.classList.remove('active'); els.viewListBtn.setAttribute('aria-checked', 'false'); localStorage.setItem('viewMode', 'grid'); } });
                els.viewListBtn.addEventListener('click', () => { if (!els.results.classList.contains('list-view')) { els.results.classList.add('list-view'); els.viewGridBtn.classList.remove('active'); els.viewGridBtn.setAttribute('aria-checked', 'false'); els.viewListBtn.classList.add('active'); els.viewListBtn.setAttribute('aria-checked', 'true'); localStorage.setItem('viewMode', 'list'); } });
            }

            const restartSearchIconAnimation = () => { /* ... (sin cambios) ... */ };
            if(els.busqueda && els.searchContainer) {
                 els.busqueda.addEventListener('input', (e) => { if (e.target.value.trim() !== '') { els.searchContainer.classList.add('active'); restartSearchIconAnimation(); } else { els.searchContainer.classList.remove('active'); } debouncedFilter(); });
                 els.busqueda.addEventListener('blur', () => { if (els.busqueda.value.trim() === '') { els.searchContainer.classList.remove('active'); } });
                 els.busqueda.addEventListener('focus', () => { if (els.busqueda.value.trim() !== '') { els.searchContainer.classList.add('active'); restartSearchIconAnimation(); } });
            }

            const otherFilterInputs = [els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto];
            otherFilterInputs.forEach(input => { if(input) input.addEventListener('input', debouncedFilter); });

            [els.posDel, els.posTras].forEach(btn => {
                if(btn) { // <-- Verificar si el botón existe
                    btn.addEventListener('click', (e) => {
                        console.log(`Clic en ${e.currentTarget.id}`); // <-- Depuración
                        e.currentTarget.classList.toggle('active');
                        filterData(); // Llamar a filterData
                    });
                } else { console.warn("Botón posDel o posTras no encontrado."); }
            });


            const trashLid = els.clearBtn?.querySelector('.trash-lid'); const trashBody = els.clearBtn?.querySelector('.trash-body'); /* ... */
            function createSparks(button) { /* ... (sin cambios) ... */ }
             if(els.clearBtn) { // <-- Verificar si el botón existe
                els.clearBtn.addEventListener('click', (e) => { /* ... (sin cambios en la lógica interna) ... */ });
            } else { console.warn("clearBtn no encontrado."); }

             if (els.brandTagsContainer) { els.brandTagsContainer.addEventListener('click', (e) => { /* ... (sin cambios) ... */ }); }

             if (els.paginationContainer) { // <-- Verificar
                els.paginationContainer.addEventListener('click', (e) => { /* ... (sin cambios) ... */ });
             } else { console.warn("paginationContainer no encontrado."); }

             if(els.modalCloseBtn) els.modalCloseBtn.addEventListener('click', closeModal);
             if(els.modal) els.modal.addEventListener('click', (event) => { if (event.target === els.modal) { closeModal(); } });

             if(els.guideModalCloseBtn) els.guideModalCloseBtn.addEventListener('click', closeGuideModal);
             if(els.guideModal) els.guideModal.addEventListener('click', (event) => { if (event.target === els.guideModal) { closeGuideModal(); } });
             window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && els.guideModal?.style.display === 'flex') { closeGuideModal(); } });

             console.log("Event listeners configurados."); // <-- Depuración

        } catch (error) {
             console.error("Error configurando event listeners:", error); // <-- Captura de error
        }
    }


    async function inicializarApp() {
        console.log("Inicializando aplicación..."); // <-- Depuración
        showSkeletonLoader();
        try {
            console.log("Cargando data.json..."); // <-- Depuración
            const response = await fetch('data.json');
            if (!response.ok) { throw new Error(`Error HTTP! estado: ${response.status}`); }
            let data = await response.json();
             console.log(`data.json cargado. ${data.length} items.`); // <-- Depuración
            data = data.map(item => { /* ... (sin cambios en map) ... */ });
            brakePadsData = data;
             console.log("Datos procesados. Llenando datalists..."); // <-- Depuración
            // ... (llenado de datalists sin cambios) ...
             fillDatalist(els.datalistMarca, getAllApplicationValues('marca'));
            fillDatalist(els.datalistModelo, getAllApplicationValues('modelo'));
            fillDatalist(els.datalistAnio, getAllApplicationValues('año'));
            const allOems = [...new Set(brakePadsData.flatMap(i => i.oem || []))].filter(Boolean).sort();
            const allFmsis = [...new Set(brakePadsData.flatMap(i => i.fmsi || []))].filter(Boolean).sort();
            fillDatalist(els.datalistOem, allOems);
            fillDatalist(els.datalistFmsi, allFmsis);
            // ... (lógica brandColorMap sin cambios) ...
             const allBrandsList = brakePadsData.flatMap(item => item.aplicaciones.map(app => app.marca)).filter(Boolean);
            const brandFrequencies = allBrandsList.reduce((counts, brand) => { counts[brand] = (counts[brand] || 0) + 1; return counts; }, {});
            const sortedBrands = Object.entries(brandFrequencies).sort(([, countA], [, countB]) => countB - countA).slice(0, 10).map(([brand]) => brand);
            const brandColorsCSS = [ '--brand-color-1', '--brand-color-2', '--brand-color-3', '--brand-color-4', '--brand-color-5', '--brand-color-6', '--brand-color-7', '--brand-color-8', '--brand-color-9', '--brand-color-10' ];
            brandColorMap = {}; // Reset for tag colors
            sortedBrands.forEach((brand, index) => { brandColorMap[brand] = brandColorsCSS[index % brandColorsCSS.length]; });
            if (els.brandTagsContainer) { els.brandTagsContainer.innerHTML = sortedBrands.map(brand => `<button class="brand-tag" data-brand="${brand}">${brand}</button>`).join(''); }

             console.log("Aplicando filtros desde URL y filtrando..."); // <-- Depuración
            applyFiltersFromURL();
            filterData(); // Llama a filterData después de cargar todo
             console.log("Inicialización completada."); // <-- Depuración
        } catch (error) {
            console.error("Error fatal durante la inicialización:", error); // <-- Depuración
            if (els.results) els.results.innerHTML = `<div class="no-results-container"><p>Error al cargar datos</p><span>No se pudo conectar o procesar la base de datos (data.json). Revisa la consola (F12).</span></div>`;
            if (els.countContainer) els.countContainer.innerHTML = "Error";
            if (els.paginationContainer) els.paginationContainer.innerHTML = '';
        }
    }

    setupEventListeners(); // Llama a la configuración de listeners
    inicializarApp();    // Llama a la inicialización
});
