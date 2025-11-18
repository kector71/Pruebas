/**
 * ==========================================================
 * CONFIGURACIÓN INICIAL Y ELEMENTOS DEL DOM
 * ==========================================================
 */

// 1. Configuración de Firebase (REEMPLAZA CON TUS PROPIAS CREDENCIALES)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inicializar Firebase y Firestore
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    console.log("Firebase y Firestore inicializados.");

    // Variable global para la colección de pastillas
    var padsCollection = db.collection("pastillas");
} else {
    console.error("Firebase SDK no cargado. Revisa la inclusión de los scripts en index.html.");
}


// 2. Mapeo de Elementos del DOM (els = elements)
const els = {
    // Menu & Modals
    menuBtn: document.getElementById('menuBtn'),
    menuCloseBtn: document.getElementById('menuCloseBtn'),
    sideMenu: document.getElementById('side-menu'),
    sideMenuOverlay: document.getElementById('side-menu-overlay'),
    guideModal: document.getElementById('guide-modal'),
    openGuideLink: document.getElementById('open-guide-link'),
    cardModal: document.getElementById('card-modal'),
    modalCloseBtns: document.querySelectorAll('.modal-close-btn'),
    modalRef: document.getElementById('modal-ref'),
    modalDetailsWrapper: document.getElementById('modalDetailsWrapper'),
    modalDetailsContent: document.getElementById('modalDetailsContent'),
    modalCounterWrapper: document.getElementById('modalCounterWrapper'),

    // Floating Buttons
    upBtn: document.getElementById('upBtn'),
    darkBtn: document.getElementById('darkBtn'),
    orbitalBtn: document.getElementById('orbitalBtn'),

    // Filters
    busquedaRapida: document.getElementById('busquedaRapida'),
    filtroMarca: document.getElementById('filtroMarca'),
    filtroModelo: document.getElementById('filtroModelo'),
    filtroAnio: document.getElementById('filtroAnio'),
    positionDelantera: document.getElementById('positionDelantera'),
    positionTrasera: document.getElementById('positionTrasera'),
    filtroOem: document.getElementById('filtroOem'),
    filtroFmsi: document.getElementById('filtroFmsi'),
    medidasAncho: document.getElementById('medidasAncho'),
    medidasAlto: document.getElementById('medidasAlto'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),
    brandTagsContainer: document.getElementById('brand-tags-container'),
    manufacturerTagsContainer: document.getElementById('manufacturer-tags-container'),

    // Results
    resultCountContainer: document.getElementById('result-count-container'),
    resultsContainer: document.getElementById('results-container'),
    paginationContainer: document.getElementById('pagination-container'),
    filtroFavoritosBtn: document.getElementById('filtroFavoritosBtn'),
    historialBtn: document.getElementById('historialBtn'),
    searchHistoryCard: document.getElementById('searchHistoryCard'),
    searchHistoryContainer: document.getElementById('searchHistoryContainer'),
};

// 3. Estado Global
const state = {
    currentFilters: {}, // Filtros activos (marca, año, pos, etc.)
    currentSearch: '', // Texto de búsqueda rápida
    currentPage: 1,
    pageSize: 10,
    isFavoritesMode: false,
    isHistoryMode: false,
    favoritePads: new Set(JSON.parse(localStorage.getItem('favoritePads') || '[]')),
    searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
    activePosition: null, // 'Delantera' o 'Trasera'
};


/**
 * ==========================================================
 * UI - MENÚS Y MODALES
 * ==========================================================
 */

// Lógica para abrir/cerrar el menú lateral
function toggleSideMenu(isOpen) {
    els.sideMenu.classList.toggle('active', isOpen);
    els.sideMenuOverlay.classList.toggle('active', isOpen);
    els.sideMenu.setAttribute('aria-hidden', !isOpen);
    els.menuBtn.setAttribute('aria-expanded', isOpen);
    // Bloquear scroll del body cuando el menú está abierto
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

// Lógica para abrir cualquier modal
function openModal(modalEl) {
    modalEl.classList.add('active');
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Lógica para cerrar cualquier modal
function closeModal(modalEl) {
    modalEl.classList.remove('active');
    // Esperar a que termine la transición para ocultar el modal
    setTimeout(() => {
        modalEl.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

// ------------------- EVENT LISTENERS DE UI -------------------

// Abrir Menú
els.menuBtn.addEventListener('click', () => toggleSideMenu(true));

// Cerrar Menú
els.menuCloseBtn.addEventListener('click', () => toggleSideMenu(false));
els.sideMenuOverlay.addEventListener('click', () => toggleSideMenu(false));

// Abrir Modal de Guía desde el menú
els.openGuideLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSideMenu(false); // Cerrar el menú
    openModal(els.guideModal);
});

// Cerrar Modales (Producto y Guía)
els.modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Asume que el botón de cierre está dentro del modal-content
        const modal = e.target.closest('.modal-overlay');
        if (modal) {
            closeModal(modal);
        }
    });
});

// Cerrar Modales al hacer click en el overlay (fuera del contenido)
[els.guideModal, els.cardModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        // Si el click fue en el overlay y no en el modal-content
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});


/**
 * ==========================================================
 * LÓGICA DE FILTROS Y BÚSQUEDA (CORE DE FIRESTORE)
 * ==========================================================
 */

// Función placeholder para la lógica de búsqueda en Firestore
async function runSearch(filters, search, isFavoritesMode) {
    // 1. Mostrar estado de carga
    els.resultsContainer.innerHTML = '<div class="loading-spinner">Cargando resultados...</div>';
    els.resultCountContainer.textContent = 'Buscando...';

    // 2. Construir la consulta de Firestore
    let query = padsCollection;
    
    // Si estamos en modo Favoritos, la consulta es diferente
    if (isFavoritesMode && state.favoritePads.size > 0) {
        // En Firestore no podemos hacer un query `where in` para más de 10 elementos.
        // La implementación real requeriría múltiples consultas o indexación avanzada.
        // Aquí simulamos un 'where in' simple:
        const favoriteRefs = Array.from(state.favoritePads);
        if (favoriteRefs.length > 0) {
            console.log(`Buscando ${favoriteRefs.length} favoritos...`);
            // Simulación: La consulta real de favoritos se hará en la UI
        } else {
            console.log("No hay favoritos para mostrar.");
            els.resultsContainer.innerHTML = '<p class="glass" style="text-align: center;">No tienes pastillas marcadas como favoritas.</p>';
            els.resultCountContainer.textContent = '0 resultados';
            els.paginationContainer.innerHTML = '';
            return { data: [], total: 0 };
        }
    }
    
    // Aplicar filtros de texto (busquedaRapida)
    if (search) {
        console.log(`Filtro por texto: ${search}`);
        // Nota: La búsqueda "like" o "contains" en Firestore requiere indexación 
        // o servicios externos (como Algolia). Aquí, asumimos que 'busquedaRapida' 
        // se usa para buscar por campos específicos indexados como 'ref' o 'oem'.
        // Una implementación real puede usar un array-contains-any.
        
        //query = query.where('ref', '==', search.toUpperCase()); // Ejemplo de coincidencia exacta
    }

    // Aplicar filtros de vehículo y posición
    if (filters.Marca) {
        query = query.where('vehiculos.Marca', '==', filters.Marca);
    }
    if (filters.Posicion) {
        query = query.where('posicion', '==', filters.Posicion);
    }
    // ... aplicar otros filtros (Modelo, Año, OEM, FMSI, Ancho, Alto)

    
    // 3. Ejecutar la consulta (simulada)
    // En una implementación real, aquí se usarían los métodos `limit` y `startAfter` para paginación.
    
    try {
        const snapshot = await query.get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 4. Lógica de filtrado de Favoritos/Historial Post-Query (Si es necesario)
        let finalResults = results;
        if (isFavoritesMode) {
             finalResults = results.filter(pad => state.favoritePads.has(pad.id));
        }

        // 5. Renderizar
        renderResults(finalResults);
        updatePagination(finalResults.length);
        els.resultCountContainer.textContent = `${finalResults.length} resultados`;
        
        return { data: finalResults, total: finalResults.length };

    } catch (error) {
        console.error("Error al ejecutar la búsqueda en Firestore:", error);
        els.resultsContainer.innerHTML = '<p class="glass" style="text-align: center; color: #e53935;">Error al cargar los datos. Inténtalo más tarde.</p>';
        els.resultCountContainer.textContent = 'Error';
        return { data: [], total: 0 };
    }
}


// ------------------- RENDERIZADO DE RESULTADOS -------------------

/**
 * Función que crea la tarjeta (card) de una pastilla.
 * @param {Object} pad - Objeto de datos de la pastilla.
 */
function createResultCard(pad) {
    const isFavorite = state.favoritePads.has(pad.id);
    const card = document.createElement('div');
    card.className = 'result-card';
    card.dataset.id = pad.id;
    card.style.animationDelay = `${Math.random() * 0.2}s`; // Efecto de carga escalonada

    const manufacturer = pad.Fabricante || 'N/A';
    const position = pad.posicion || 'N/A';

    card.innerHTML = `
        <div class="card-image-placeholder">
            ${pad.imagen_url ? `<img src="${pad.imagen_url}" alt="Pastilla ${pad.Referencia}" style="max-width: 100%; max-height: 100%; border-radius: var(--border-radius);">` : '<span>[Imagen No Disponible]</span>'}
        </div>
        <div class="card-header-info">
            <div class="card-ref">${pad.Referencia}</div>
            <div class="card-specs">
                <strong>Posición:</strong> ${position}<br>
                <strong>Fabricante:</strong> ${manufacturer}
            </div>
        </div>
        <div class="card-buttons">
            <button type="button" class="material-btn card-favorite-btn ${isFavorite ? 'active' : ''}" data-id="${pad.id}" aria-label="Añadir a favoritos">
                <svg class="heart-icon" viewBox="0 0 24 24" fill="${isFavorite ? '#e53935' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
        </div>
    `;

    // Evento para abrir el modal de detalles
    card.addEventListener('click', (e) => {
        // Asegurarse de que el click no fue en el botón de favoritos
        if (!e.target.closest('.card-favorite-btn')) {
            openProductModal(pad);
        }
    });

    // Evento para el botón de favoritos
    card.querySelector('.card-favorite-btn').addEventListener('click', toggleFavorite);

    return card;
}

/**
 * Renderiza la lista de resultados.
 * @param {Array} results - Array de objetos de pastillas.
 */
function renderResults(results) {
    els.resultsContainer.innerHTML = '';
    if (results.length === 0) {
        els.resultsContainer.innerHTML = '<p class="glass" style="text-align: center;">No se encontraron resultados que coincidan con los filtros.</p>';
        return;
    }

    results.forEach(pad => {
        els.resultsContainer.appendChild(createResultCard(pad));
    });
}

/**
 * Actualiza la paginación (función placeholder).
 * @param {number} totalResults - Número total de resultados.
 */
function updatePagination(totalResults) {
    // Lógica para calcular y renderizar los botones de página
    els.paginationContainer.innerHTML = '';
    
    if (totalResults > state.pageSize) {
         // Implementación de paginación real
         // for (let i = 1; i <= totalPages; i++) { ... }
         els.paginationContainer.innerHTML = `<button class="page-btn active">1</button><button class="page-btn disabled">...</button><button class="page-btn">Fin</button>`;
    }
}

/**
 * Abre y rellena el modal de detalles del producto.
 * @param {Object} pad - Objeto de datos de la pastilla.
 */
function openProductModal(pad) {
    els.modalRef.textContent = pad.Referencia || 'Detalles del Producto';
    els.cardModal.querySelector('.modal-position').textContent = pad.posicion ? `Posición: ${pad.posicion}` : '';

    const detailsHtml = `
        <h3>Especificaciones Técnicas</h3>
        <ul>
            <li><strong>FMSI:</strong> ${pad.fmsi || 'N/A'}</li>
            <li><strong>OEM:</strong> ${pad.OEM || 'N/A'}</li>
            <li><strong>Ancho (mm):</strong> ${pad.Ancho || 'N/A'}</li>
            <li><strong>Alto (mm):</strong> ${pad.Alto || 'N/A'}</li>
            <li><strong>Espesor (mm):</strong> ${pad.Espesor || 'N/A'}</li>
            <li><strong>Material:</strong> ${pad.Material || 'N/A'}</li>
        </ul>
        
        <h3>Aplicaciones (Vehículos)</h3>
        <ul>
            ${pad.vehiculos && Array.isArray(pad.vehiculos) 
                ? pad.vehiculos.map(v => `
                    <li>
                        <strong>${v.Marca} ${v.Modelo}</strong> (${v.Ano}) - 
                        ${v.Descripcion || 'N/A'}
                    </li>
                `).join('')
                : '<li>No hay aplicaciones detalladas.</li>'
            }
        </ul>
    `;

    els.modalDetailsContent.querySelector('.modal-apps-specs').innerHTML = detailsHtml;

    // Lógica del carrusel (Placeholder)
    const carouselEl = els.cardModal.querySelector('.modal-image-carousel');
    carouselEl.innerHTML = pad.imagen_url 
        ? `<img src="${pad.imagen_url}" alt="Pastilla ${pad.Referencia}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: var(--border-radius);">`
        : '<span>IMAGEN NO DISPONIBLE</span>';

    openModal(els.cardModal);
}

// ------------------- EVENTOS DE FILTRADO -------------------

/**
 * Centraliza la aplicación de filtros y la ejecución de la búsqueda.
 */
function applyFiltersAndSearch() {
    // 1. Recoger valores de inputs
    const search = els.busquedaRapida.value.trim().toUpperCase();
    
    // 2. Construir el objeto de filtros
    const filters = {
        Marca: els.filtroMarca.value.trim(),
        Modelo: els.filtroModelo.value.trim(),
        Ano: els.filtroAnio.value.trim(),
        Posicion: state.activePosition,
        OEM: els.filtroOem.value.trim(),
        FMSI: els.filtroFmsi.value.trim(),
        Ancho: els.medidasAncho.value,
        Alto: els.medidasAlto.value,
    };
    
    state.currentSearch = search;
    state.currentFilters = filters;
    state.currentPage = 1;
    
    // 3. Ejecutar la búsqueda
    runSearch(filters, search, state.isFavoritesMode);

    // 4. Guardar en historial si la búsqueda principal no está vacía
    if (search || Object.values(filters).some(val => val && val.length > 0)) {
        updateSearchHistory(search || JSON.stringify(filters));
    }
}

// Eventos de Input (disparo después de un retraso - debounce)
let searchDebounceTimeout;
const debounceDelay = 500;

function setupFilterListeners() {
    [
        els.busquedaRapida, els.filtroMarca, els.filtroModelo, els.filtroAnio,
        els.filtroOem, els.filtroFmsi, els.medidasAncho, els.medidasAlto
    ].forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(applyFiltersAndSearch, debounceDelay);
        });
    });
}

// Eventos de Posición
function togglePosition(position) {
    if (state.activePosition === position) {
        state.activePosition = null; // Desactivar
        els.positionDelantera.classList.remove('active');
        els.positionTrasera.classList.remove('active');
    } else {
        state.activePosition = position; // Activar
        els.positionDelantera.classList.toggle('active', position === 'Delantera');
        els.positionTrasera.classList.toggle('active', position === 'Trasera');
    }
    applyFiltersAndSearch();
}

els.positionDelantera.addEventListener('click', () => togglePosition('Delantera'));
els.positionTrasera.addEventListener('click', () => togglePosition('Trasera'));

// Botón de Borrar Filtros
els.clearFiltersBtn.addEventListener('click', () => {
    // Limpiar todos los inputs y estados
    els.busquedaRapida.value = '';
    els.filtroMarca.value = '';
    els.filtroModelo.value = '';
    els.filtroAnio.value = '';
    els.filtroOem.value = '';
    els.filtroFmsi.value = '';
    els.medidasAncho.value = '';
    els.medidasAlto.value = '';
    
    if (state.activePosition) {
        togglePosition(state.activePosition); // Desactiva y llama a applyFiltersAndSearch
    } else {
        applyFiltersAndSearch(); // Ejecutar búsqueda con filtros vacíos
    }
});

// Evento para los tags de Fabricante (Delegación de eventos)
els.manufacturerTagsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.brand-tag');
    if (!btn) return;
    
    const manufacturer = btn.dataset.manufacturer;
    const isActive = btn.classList.contains('active');
    
    // Simple toggle: activar/desactivar la etiqueta
    if (isActive) {
        btn.classList.remove('active');
        delete state.currentFilters.Fabricante;
    } else {
        // Desactivar otros tags si solo se permite uno
        els.manufacturerTagsContainer.querySelectorAll('.brand-tag').forEach(tag => tag.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilters.Fabricante = manufacturer;
    }
    
    applyFiltersAndSearch();
});


/**
 * ==========================================================
 * FAVORITOS Y HISTORIAL
 * ==========================================================
 */

// ------------------- FAVORITOS -------------------

/**
 * Alterna el estado de favorito de una pastilla.
 * @param {Event} e - Evento del click.
 */
function toggleFavorite(e) {
    const btn = e.currentTarget;
    const padId = btn.dataset.id;
    const isCurrentlyFavorite = state.favoritePads.has(padId);

    if (isCurrentlyFavorite) {
        state.favoritePads.delete(padId);
        btn.classList.remove('active');
        btn.querySelector('.heart-icon').setAttribute('fill', 'none');
    } else {
        state.favoritePads.add(padId);
        btn.classList.add('active');
        btn.querySelector('.heart-icon').setAttribute('fill', '#e53935');
    }

    // Actualizar localStorage
    localStorage.setItem('favoritePads', JSON.stringify(Array.from(state.favoritePads)));
    
    // Si estamos en modo favoritos, actualizar la vista
    if (state.isFavoritesMode) {
        applyFiltersAndSearch();
    }
}

// Botón de Alternar Modo Favoritos
els.filtroFavoritosBtn.addEventListener('click', () => {
    state.isFavoritesMode = !state.isFavoritesMode;
    els.filtroFavoritosBtn.classList.toggle('active', state.isFavoritesMode);
    els.filtroFavoritosBtn.setAttribute('aria-pressed', state.isFavoritesMode);
    
    // Desactivar modo historial si estaba activo
    if (state.isHistoryMode) toggleHistoryMode(false);
    
    // Alternar la visualización del historial si se sale de favoritos
    els.searchHistoryCard.style.display = 'none';

    applyFiltersAndSearch();
});


// ------------------- HISTORIAL -------------------

/**
 * Añade o actualiza una entrada en el historial de búsqueda.
 * @param {string} searchTerm - El término de búsqueda o filtros usados.
 */
function updateSearchHistory(searchTerm) {
    if (!searchTerm) return;
    
    // Eliminar el término si ya existe (lo movemos al inicio)
    state.searchHistory = state.searchHistory.filter(item => item !== searchTerm);
    
    // Añadir al inicio
    state.searchHistory.unshift(searchTerm);
    
    // Limitar el historial a 5 elementos
    state.searchHistory = state.searchHistory.slice(0, 5);
    
    // Guardar en localStorage
    localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
    
    if (state.isHistoryMode) {
        renderSearchHistory();
    }
}

/**
 * Renderiza los elementos del historial en la tarjeta correspondiente.
 */
function renderSearchHistory() {
    els.searchHistoryContainer.innerHTML = '';
    
    if (state.searchHistory.length === 0) {
        els.searchHistoryContainer.innerHTML = '<p style="font-size: 0.9rem; color: var(--color-text-placeholder);">Tu historial está vacío.</p>';
        return;
    }

    state.searchHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.term = item;
        
        historyItem.innerHTML = `
            <span class="history-item-text">${item}</span>
            <button class="history-remove-btn" aria-label="Eliminar de historial">&times;</button>
        `;

        // Evento para repetir la búsqueda
        historyItem.querySelector('.history-item-text').addEventListener('click', () => {
            // Aquí se necesitaría una lógica para parsear si 'item' es un JSON de filtros o un simple string
            els.busquedaRapida.value = item;
            applyFiltersAndSearch();
            toggleHistoryMode(false);
        });

        // Evento para eliminar del historial
        historyItem.querySelector('.history-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se active el evento de repetición
            removeSearchHistoryItem(item);
        });
        
        els.searchHistoryContainer.appendChild(historyItem);
    });
}

/**
 * Elimina un elemento del historial.
 * @param {string} term - El término a eliminar.
 */
function removeSearchHistoryItem(term) {
    state.searchHistory = state.searchHistory.filter(item => item !== term);
    localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
    renderSearchHistory();
}


// Botón de Alternar Modo Historial
function toggleHistoryMode(activate) {
    state.isHistoryMode = activate === undefined ? !state.isHistoryMode : activate;
    
    // Desactivar modo favoritos si se activa el historial
    if (state.isHistoryMode) {
        state.isFavoritesMode = false;
        els.filtroFavoritosBtn.classList.remove('active');
        els.filtroFavoritosBtn.setAttribute('aria-pressed', false);
        renderSearchHistory();
        els.searchHistoryCard.style.display = 'block';
    } else {
        els.searchHistoryCard.style.display = 'none';
    }

    els.historialBtn.classList.toggle('active', state.isHistoryMode);
    els.historialBtn.setAttribute('aria-pressed', state.isHistoryMode);
    
    // Si se desactiva el historial, volver a ejecutar la búsqueda de filtros
    if (!state.isHistoryMode) {
        applyFiltersAndSearch();
    }
}

els.historialBtn.addEventListener('click', () => toggleHistoryMode());


/**
 * ==========================================================
 * UTILITIES (DARK/ORBIT MODE & SCROLL)
 * ==========================================================
 */

// Lógica para alternar el modo oscuro
els.darkBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    els.darkBtn.setAttribute('aria-pressed', isLight);
});

// Lógica para alternar el modo orbital
els.orbitalBtn.addEventListener('click', () => {
    els.orbitalBtn.classList.toggle('active');
    document.body.classList.toggle('orbital-mode');
    localStorage.setItem('orbitalMode', els.orbitalBtn.classList.contains('active'));
});

// Lógica para el botón de 'Volver Arriba'
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        els.upBtn.style.display = 'flex';
    } else {
        els.upBtn.style.display = 'none';
    }
});

els.upBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


/**
 * ==========================================================
 * INICIALIZACIÓN DE LA APLICACIÓN
 * ==========================================================
 */

function initializeApp() {
    // 1. Cargar el tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        els.darkBtn.setAttribute('aria-pressed', true);
    }

    // 2. Cargar el modo orbital
    const savedOrbitalMode = localStorage.getItem('orbitalMode');
    if (savedOrbitalMode === 'true') {
        els.orbitalBtn.classList.add('active');
        document.body.classList.add('orbital-mode');
    }

    // 3. Configurar listeners de filtros
    setupFilterListeners();
    
    // 4. Cargar datos iniciales
    // Iniciar la búsqueda con todos los filtros vacíos al cargar la página.
    applyFiltersAndSearch(); 
}

// Ejecutar la inicialización
document.addEventListener('DOMContentLoaded', initializeApp);
