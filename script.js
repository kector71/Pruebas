document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM Cargado. Iniciando script (Versión SIN color de marca)..."); // <-- Mensaje versión

    let brakePadsData = [];
    let currentPage = 1;
    const itemsPerPage = 24;
    let filteredDataCache = [];
    let brandColorMap = {}; // Para etiquetas de marca (si las usas)

    const els = { // Asegúrate que todos estos IDs existen en tu HTML
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
    // console.log("Elementos del DOM seleccionados:", els);

    // --- FUNCIONES ---
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
    const fillDatalist = (datalist, values) => { if(datalist) datalist.innerHTML = values.map(v => `<option value="${v}">`).join(''); };
    const getPositionFilter = () => { const activePositions = []; if (els.posDel?.classList.contains('active')) activePositions.push('Delantera'); if (els.posTras?.classList.contains('active')) activePositions.push('Trasera'); return activePositions; };
    const getAllApplicationValues = (key) => { /* ... (Definición completa de esta función) ... */
        const allValues = new Set();
        if (!brakePadsData || brakePadsData.length === 0) return [];
        brakePadsData.forEach(item => {
            const prop = (key === 'modelo') ? 'serie' : key;
            if (item.aplicaciones && Array.isArray(item.aplicaciones)) {
                item.aplicaciones.forEach(app => {
                    if (app && app.hasOwnProperty(prop) && app[prop]) {
                        allValues.add(app[prop]);
                    }
                });
            }
        });
        return [...allValues].sort();
    };
    const hasVehicleFilters = () => { /* ... (sin cambios) ... */ };

    const filterData = () => {
        // console.log("Filtrando datos...");
        if (!brakePadsData || brakePadsData.length === 0) return;
        try {
            const fbusq = (val) => (val || '').toLowerCase().trim();
            const activePos = getPositionFilter();
            const filters = {
                busqueda: fbusq(els.busqueda?.value),
                marca: fbusq(els.marca?.value),
                modelo: fbusq(els.modelo?.value),
                anio: fbusq(els.anio?.value),
                oem: fbusq(els.oem?.value),
                fmsi: fbusq(els.fmsi?.value),
                ancho: parseFloat(els.medidasAncho?.value) || null,
                alto: parseFloat(els.medidasAlto?.value) || null,
                pos: activePos
            };

            filteredDataCache = brakePadsData.filter(item => {
                const aplicaciones = item.aplicaciones || [];
                const itemVehicles = aplicaciones.map(app => `${app.marca || ''} ${app.serie || ''} ${app.litros || ''} ${app.año || ''} ${app.especificacion || ''}`).join(' ').toLowerCase();
                const itemPosicion = item.posición || '';
                const itemRefs = item.ref || [];
                const itemOems = item.oem || [];
                const itemFmsis = item.fmsi || [];

                const busqMatch = !filters.busqueda ||
                    itemRefs.some(r => r && typeof r === 'string' && r.toLowerCase().includes(filters.busqueda)) ||
                    itemOems.some(o => o && typeof o === 'string' && o.toLowerCase().includes(filters.busqueda)) ||
                    itemFmsis.some(f => f && typeof f === 'string' && f.toLowerCase().includes(filters.busqueda)) ||
                    itemVehicles.includes(filters.busqueda);

                const appMatch = !filters.marca && !filters.modelo && !filters.anio || aplicaciones.some(app =>
                    (!filters.marca || (app.marca && typeof app.marca === 'string' && app.marca.toLowerCase().includes(filters.marca))) &&
                    (!filters.modelo || (app.serie && typeof app.serie === 'string' && app.serie.toLowerCase().includes(filters.modelo))) &&
                    (!filters.anio || (app.año && typeof app.año === 'string' && app.año.toLowerCase().includes(filters.anio)))
                );

                const oemMatch = !filters.oem || itemOems.some(o => o && typeof o === 'string' && o.toLowerCase().includes(filters.oem));
                const fmsiMatch = !filters.fmsi || itemFmsis.some(f => f && typeof f === 'string' && f.toLowerCase().includes(filters.fmsi));

                let posMatch = true;
                if (filters.pos.length > 0) {
                    posMatch = filters.pos.includes(itemPosicion);
                }

                const TOLERANCIA = 1.0;
                const anchoNum = item.anchoNum || 0;
                const altoNum = item.altoNum || 0;
                const filterAncho = filters.ancho;
                const filterAlto = filters.alto;

                const anchoMatchTolerancia = !filterAncho || (anchoNum >= (filterAncho - TOLERANCIA) && anchoNum <= (filterAncho + TOLERANCIA));
                const altoMatchTolerancia = !filterAlto || (altoNum >= (filterAlto - TOLERANCIA) && altoNum <= (filterAlto + TOLERANCIA));

                return busqMatch && appMatch && oemMatch && fmsiMatch && posMatch && anchoMatchTolerancia && altoMatchTolerancia;
            });

            // console.log(`Filtrado completado. Resultados: ${filteredDataCache.length}`);
            currentPage = 1;
            renderCurrentPage();
            updateURLWithFilters();
        } catch (error) {
            console.error("Error durante el filtrado:", error);
            if(els.results) els.results.innerHTML = `<div class="no-results-container"><p>Error al filtrar datos.</p></div>`;
            if(els.paginationContainer) els.paginationContainer.innerHTML = '';
        }
    };

    function navigateCarousel(carouselContainer, direction) { /* ... */ }
    const renderApplicationsList = (aplicaciones) => { /* ... */ };
    const renderSpecs = (item) => { /* ... */ };
    const showSkeletonLoader = (count = 6) => { /* ... */ };
    function setupPagination(totalItems) { /* ... */ }

    const renderCurrentPage = () => {
        // console.log(`Renderizando página ${currentPage}...`);
        if (!els.results || !els.countContainer || !els.paginationContainer) return;
        if (!filteredDataCache) filteredDataCache = [];

        const totalResults = filteredDataCache.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredDataCache.slice(startIndex, endIndex);

        const startNum = totalResults === 0 ? 0 : startIndex + 1;
        const endNum = Math.min(endIndex, totalResults);
        els.countContainer.innerHTML = `Mostrando <strong>${startNum}–${endNum}</strong> de <strong>${totalResults}</strong> resultados`;

        if (totalResults === 0) {
            els.results.innerHTML = `<div class="no-results-container">...</div>`; // Mensaje no resultados
            els.paginationContainer.innerHTML = '';
            return;
        }

        try {
            els.results.innerHTML = paginatedData.map((item, index) => {
                const posBadgeClass = (item.posición === 'Delantera') ? 'delantera' : 'trasera';
                const posBadge = `<span class="position-badge ${posBadgeClass}">${item.posición || ''}</span>`;
                const references = item.ref || [];
                const primaryRef = references.length > 0 ? references[0] : 'N/A';

                let firstImageSrc = 'https://via.placeholder.com/300x200.png?text=No+Img';
                const images = item.imagenes || [];
                 if (images.length > 0) { firstImageSrc = images[0]; }
                 else if (item.imagen) { firstImageSrc = item.imagen.replace("text=", `text=Vista+1+`); }

                const aplicaciones = item.aplicaciones || [];
                const appSummaryItems = aplicaciones.slice(0, 3).map(app => `${app.marca || ''} ${app.serie || ''}`).filter((value, index, self) => self.indexOf(value) === index && value.trim() !== '');
                let appSummaryHTML = '';
                if (appSummaryItems.length > 0) {
                    appSummaryHTML = `<div class="card-app-summary">${appSummaryItems.join(', ')}${aplicaciones.length > 3 ? ', ...' : ''}</div>`;
                }

                // ===== SIN LÓGICA DE COLOR AQUÍ =====
                // const textColorVar = 'var(--text-color)'; // <-- Simplemente usa el color de texto normal

                return `
                    <div class="result-card"
                         data-ref="${primaryRef}"
                         style="animation-delay: ${index * 50}ms;" {/* <-- SIN border-left-color */}
                         tabindex="0" role="button" aria-haspopup="dialog">
                        <div class="card-thumbnail"><img src="${firstImageSrc}" alt="Referencia ${primaryRef}" class="result-image" loading="lazy"></div>
                        <div class="card-content-wrapper">
                            <div class="card-details">
                                {/* Usamos el color de texto normal, sin style="color:..." */}
                                <div class="card-ref">${primaryRef}</div>
                                ${posBadge}
                            </div>
                            ${appSummaryHTML}
                        </div>
                    </div>`;
            }).join('');

            els.results.removeEventListener('click', handleCardClick);
            els.results.addEventListener('click', handleCardClick); // Asegurar que el listener está
            setupPagination(totalResults);
            // console.log("Renderizado completado (versión sin color marca).");

        } catch (error) {
            console.error("Error durante renderizado (versión sin color marca):", error);
            els.results.innerHTML = `<div class="no-results-container"><p>Error al mostrar resultados.</p></div>`;
            els.paginationContainer.innerHTML = '';
        }
    };

    function handleCardClick(event) {
        // console.log('Handling card click...');
        const card = event.target.closest('.result-card');
        if (card) {
            // console.log('Card found:', card);
            const primaryRef = card.dataset.ref;
            // console.log('Data ref:', primaryRef);
            if (primaryRef && primaryRef !== 'N/A') {
                const itemData = brakePadsData.find(item =>
                    item.ref && Array.isArray(item.ref) && item.ref.includes(primaryRef)
                );
                // console.log('Item data found:', itemData);
                if (itemData) {
                    // console.log("Abriendo modal para:", primaryRef);
                    openModal(itemData);
                } else {
                    console.warn('No matching data found for ref:', primaryRef);
                }
            } else {
                 console.warn('Card clicked but data-ref is missing or N/A');
            }
        }
    }
    const updateScrollIndicator = () => { /* ... */ };
    function openModal(item) { /* ... (Sin cambios aquí) ... */ }
    function closeModal() { /* ... (Sin cambios aquí) ... */ }
    function openGuideModal() { /* ... (Sin cambios aquí) ... */ }
    function closeGuideModal() { /* ... (Sin cambios aquí) ... */ }
    function openSideMenu() { /* ... (Sin cambios aquí) ... */ }
    function closeSideMenu() { /* ... (Sin cambios aquí) ... */ }
    function setupSwipe(carouselElement) { /* ... (Sin cambios aquí) ... */ }
    const clearAllFilters = () => { /* ... (Sin cambios aquí) ... */ };
    const createRippleEffect = (event) => { /* ... (Sin cambios aquí) ... */ };
    const updateURLWithFilters = () => { /* ... (Sin cambios aquí) ... */ };
    const applyFiltersFromURL = () => { /* ... (Sin cambios aquí) ... */ };

    // --- SETUP EVENT LISTENERS ---
    function setupEventListeners() {
        // console.log("Configurando event listeners...");
        try {
            [els.darkBtn, els.upBtn, els.menuBtn, els.netlifyBtn].forEach(btn => {
                if (btn) { btn.addEventListener('click', createRippleEffect); }
                else { /* console.warn("...") */ }
            });

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
                    els.netlifyBtn.classList.remove('active');
                    els.netlifyBtn.setAttribute('aria-pressed', 'false');
                }
                localStorage.setItem('themePreference', theme);
            };

            if (els.darkBtn) {
                els.darkBtn.addEventListener('click', () => {
                    const isCurrentlyDark = els.body.classList.contains('lp-dark');
                    applyOriginalTheme(isCurrentlyDark ? 'light' : 'dark');
                    if(els.headerX) els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                    setTimeout(() => { if(els.headerX) els.headerX.style.animation = ''; }, 600);
                });
            } else { /* console.warn("darkBtn no encontrado."); */ }

            const applyNetlifyTheme = () => {
                 els.body.classList.remove('lp-dark');
                 els.body.classList.add('netlify-dark');
                 els.netlifyBtn.classList.add('active');
                 els.netlifyBtn.setAttribute('aria-pressed', 'true');
                 iconAnimation(els.sunIcon, els.moonIcon);
                 els.darkBtn.setAttribute('aria-pressed', 'false');
                 localStorage.setItem('themePreference', 'netlify');
            };

            if(els.netlifyBtn) {
                els.netlifyBtn.addEventListener('click', () => {
                    const isCurrentlyNetlify = els.body.classList.contains('netlify-dark');
                    if (isCurrentlyNetlify) { applyOriginalTheme('light'); }
                    else { applyNetlifyTheme(); }
                    if(els.headerX) els.headerX.style.animation = 'bounceHeader 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
                    setTimeout(() => { if(els.headerX) els.headerX.style.animation = ''; }, 600);
                    const themeIcon = els.netlifyBtn.querySelector('.lp-icon-palette');
                    if (themeIcon) { themeIcon.animate([/*...*/], { duration: 400, easing: 'ease-out' }); }
                });
            } else { /* console.warn("netlifyBtn no encontrado."); */ }

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
             if(els.results && els.viewGridBtn && els.viewListBtn) { /* ... (sin cambios) ... */ }

            const restartSearchIconAnimation = () => { /* ... */ };
            if(els.busqueda && els.searchContainer) { /* ... (sin cambios) ... */ }

            const otherFilterInputs = [els.marca, els.modelo, els.anio, els.oem, els.fmsi, els.medidasAncho, els.medidasAlto];
            otherFilterInputs.forEach(input => { if(input) input.addEventListener('input', debouncedFilter); });

            [els.posDel, els.posTras].forEach(btn => {
                if(btn) {
                    btn.addEventListener('click', (e) => {
                        e.currentTarget.classList.toggle('active');
                        filterData(); // Asegurar que filterData se llama
                    });
                } else { /* console.warn("posDel o posTras no encontrado."); */ }
            });


            const trashLid = els.clearBtn?.querySelector('.trash-lid'); const trashBody = els.clearBtn?.querySelector('.trash-body'); /* ... */
            function createSparks(button) { /* ... */ }
             if(els.clearBtn) { els.clearBtn.addEventListener('click', (e) => { /* ... */ }); }
             else { /* console.warn("clearBtn no encontrado."); */ }

             if (els.brandTagsContainer) { els.brandTagsContainer.addEventListener('click', (e) => { /* ... */ }); }

             if (els.paginationContainer) { els.paginationContainer.addEventListener('click', (e) => { /* ... */ }); }
             else { /* console.warn("paginationContainer no encontrado."); */ }

             if(els.modalCloseBtn) els.modalCloseBtn.addEventListener('click', closeModal);
             if(els.modal) els.modal.addEventListener('click', (event) => { if (event.target === els.modal) { closeModal(); } });

             if(els.guideModalCloseBtn) els.guideModalCloseBtn.addEventListener('click', closeGuideModal);
             if(els.guideModal) els.guideModal.addEventListener('click', (event) => { if (event.target === els.guideModal) { closeGuideModal(); } });
             window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && els.guideModal?.style.display === 'flex') { closeGuideModal(); } });

            // console.log("Event listeners configurados.");

        } catch (error) {
            console.error("Error configurando event listeners:", error);
        }
    }


    async function inicializarApp() {
        // console.log("Inicializando aplicación...");
        showSkeletonLoader();
        try {
            // console.log("Cargando data.json...");
            const response = await fetch('data.json');
            if (!response.ok) { throw new Error(`Error HTTP! estado: ${response.status}`); }
            let data = await response.json();
            // console.log(`data.json cargado. ${data.length} items.`);
            data = data.map(item => {
                 if (item.imagen && (!item.imagenes || item.imagenes.length === 0)) {
                    item.imagenes = [ /*...*/ ];
                 }
                 const partes = item.medidas ? item.medidas.split('x').map(s => parseFloat(s.trim())) : [0,0];
                 return { ...item, anchoNum: partes[0] || 0, altoNum: partes[1] || 0 };
            });
            brakePadsData = data;
            // console.log("Datos procesados. Llenando datalists...");
            fillDatalist(els.datalistMarca, getAllApplicationValues('marca'));
            fillDatalist(els.datalistModelo, getAllApplicationValues('modelo'));
            fillDatalist(els.datalistAnio, getAllApplicationValues('año'));
            const allOems = [...new Set(brakePadsData.flatMap(i => i.oem || []))].filter(Boolean).sort();
            const allFmsis = [...new Set(brakePadsData.flatMap(i => i.fmsi || []))].filter(Boolean).sort();
            fillDatalist(els.datalistOem, allOems);
            fillDatalist(els.datalistFmsi, allFmsis);
            // ... (lógica brandColorMap) ...
             const allBrandsList = brakePadsData.flatMap(item => item.aplicaciones?.map(app => app.marca) || []).filter(Boolean); // Añadir chequeo aplicaciones
            const brandFrequencies = allBrandsList.reduce((counts, brand) => { counts[brand] = (counts[brand] || 0) + 1; return counts; }, {});
            const sortedBrands = Object.entries(brandFrequencies).sort(([, countA], [, countB]) => countB - countA).slice(0, 10).map(([brand]) => brand);
            const brandColorsCSS = [ '--brand-color-1', '--brand-color-2', '--brand-color-3', '--brand-color-4', '--brand-color-5', '--brand-color-6', '--brand-color-7', '--brand-color-8', '--brand-color-9', '--brand-color-10' ];
            brandColorMap = {}; // Reset for tag colors
            sortedBrands.forEach((brand, index) => { brandColorMap[brand] = brandColorsCSS[index % brandColorsCSS.length]; });
            if (els.brandTagsContainer) { els.brandTagsContainer.innerHTML = sortedBrands.map(brand => `<button class="brand-tag" data-brand="${brand}">${brand}</button>`).join(''); }

            // console.log("Aplicando filtros desde URL y filtrando...");
            applyFiltersFromURL();
            filterData();
            // console.log("Inicialización completada.");
        } catch (error) {
            console.error("Error fatal durante la inicialización:", error);
            if (els.results) els.results.innerHTML = `<div class="no-results-container"><p>Error al cargar datos</p><span>No se pudo conectar o procesar la base de datos (data.json). Revisa la consola (F12).</span></div>`;
            if (els.countContainer) els.countContainer.innerHTML = "Error";
            if (els.paginationContainer) els.paginationContainer.innerHTML = '';
        }
    }

    setupEventListeners();
    inicializarApp();

} catch (e) { // <-- CATCH general
    console.error("Error inesperado en el script principal:", e);
    const resultsContainer = document.getElementById('results-container'); // Intenta seleccionar de nuevo
    if (resultsContainer) {
         resultsContainer.innerHTML = "<p style='color:red; text-align:center; margin-top: 2rem;'>Ocurrió un error grave al cargar la página. Por favor, recarga.</p>";
    }
}
});
