# Brake X - Catálogo de Pastillas de Freno

## 📋 Descripción

**Brake X** es una plataforma web moderna y funcional para consultar información técnica de pastillas de freno. Diseñada con un enfoque en la **rapidez de consulta** y **claridad de información técnica**, esta aplicación ofrece una experiencia de usuario premium con tema AMOLED oscuro y acentos dinámicos sutiles.

## ✨ Características Principales

### 🎨 Diseño Visual Premium
- **Modo Oscuro AMOLED**: Fondo negro puro (#000000) para máxima comodidad visual
- **Modo Claro**: Alternativa con fondo blanco limpio
- **Acentos Dinámicos**: 4 esquemas de colores (Turquesa, Azul, Morado, Naranja)
- **Colores Fijos de Posición**: 
  - 🔵 Azul cian para pastillas **Delanteras**
  - 🔴 Rojo para pastillas **Traseras**
- **Animaciones Suaves**: Transiciones de 0.2-0.3s en todas las interacciones
- **Tipografía Moderna**: Fuentes Inter y Outfit de Google Fonts
- **Glassmorphism**: Efectos de vidrio esmerilado en componentes clave

### 🔍 Sistema de Filtros Avanzado
- **Búsqueda Rápida**: Campo de búsqueda instantánea en catálogo
- **Filtros Múltiples**:
  - Marca del fabricante
  - Modelo de vehículo
  - Año
  - Posición (Delantera/Trasera) con botones de selección múltiple
  - Medidas (Ancho y Altura en mm)
  - Referencia de producto
  - Código FMSI
- **Filtros Guardados**: Guarda combinaciones frecuentes de filtros
- **Borrado Rápido**: Botón para limpiar todos los filtros instantáneamente

### 📦 Tarjetas de Producto
- **Diseño Minimalista**: Información clara y concisa
- **Datos Mostrados**:
  - Imagen de la pastilla
  - Referencia del producto
  - Posición (con indicador de color)
  - Vehículos principales compatibles
- **Acciones Rápidas**:
  - ❤️ Favoritos (con persistencia en localStorage)
  - 🔄 Comparación (hasta 3 productos)

### 🔔 Sistema de Notificaciones
- **Icono de Campana**: En el banner superior con badge de cantidad
- **Dropdown Interactivo**: Últimas 3-5 notificaciones
- **Tipos de Notificaciones**:
  - Nuevas referencias disponibles
  - Actualizaciones de medidas técnicas
  - Productos agregados a favoritos
- **Estado de Lectura**: Diferenciación visual entre leídas/no leídas

###  Personalización de Tema
- **Cambio Instantáneo**: Los colores se aplican al hacer clic, sin botón "Guardar"
- **4 Esquemas de Acento**:
  1. **Turquesa** (predeterminado): #14b8a6
  2. **Azul**: #3b82f6
  3. **Morado**: #a855f7
  4. **Naranja**: #f97316
- **Persistencia**: Preferencias guardadas en localStorage

### 📱 Diseño Responsivo
- **Desktop**: Sidebar fijo con grid de 3-4 columnas
- **Tablet**: Grid adaptativo de 2-3 columnas
- **Mobile**: Sidebar desplegable y grid de 1 columna

### 🔧 Modal de Detalles
- **Información Técnica Completa**:
  - Marca y referencia
  - Posición
  - Medidas (Ancho × Altura)
  - Código FMSI
  - Referencias equivalentes de otras marcas
  - Lista completa de vehículos compatibles
- **Suscripción a Alertas**: Botón para recibir notificaciones sobre la referencia

## 🚀 Cómo Usar

### Inicio Rápido
1. Abre `index.html` en tu navegador web
2. La aplicación carga automáticamente en modo oscuro AMOLED
3. Explora el catálogo con 8 productos de ejemplo

### Filtrado de Productos
1. Usa los filtros de la barra lateral izquierda:
   - Selecciona marca del dropdown
   - Escribe modelo o año del vehículo
   - Haz clic en "Delantera" o "Trasera" (o ambos)
   - Introduce medidas exactas si las conoces
2. Los resultados se actualizan automáticamente
3. Haz clic en "Borrar Todos los Filtros" para resetear

### Gestión de Favoritos
1. Haz clic en el icono de corazón ❤️ en cualquier tarjeta
2. Los favoritos se guardan automáticamente
3. Accede a la página de favoritos (funcionalidad futura)

### 🔄 Comparación de Productos
- **Vista Dedicada**: Tabla técnica lado a lado
- **Capacidad**: Hasta 3 productos simultáneos
- **Datos Comparados**: Marca, Posición, Medidas, FMSI, Aplicaciones y Equivalencias
- **Gestión Fácil**: Añade/quita productos con un solo clic

### ⭐ Gestión de Favoritos
- **Galería Personalizada**: Vista exclusiva de tus productos guardados
- **Persistencia**: Los favoritos se mantienen al cerrar el navegador
- **Acceso Rápido**: Botón dedicado en el encabezado

### 📜 Historial de Búsquedas
- **Registro Automático**: Guarda tus últimas búsquedas
- **Reutilización**: Repite búsquedas anteriores con un clic
- **Limpieza**: Opción para borrar todo el historial

## 🔮 Funcionalidades Futuras

### Páginas Adicionales
- [ ] **Configuración de Perfil**: Gestión de cuenta y preferencias
- [ ] **Guía de Inicio Rápido**: Tutorial interactivo paso a paso
- [ ] **Página de Notificaciones**: Vista completa con historial

### Mejoras Técnicas
- [ ] Integración con API real de catálogo
- [ ] Exportación de comparaciones a PDF
- [ ] Compartir productos vía URL
- [ ] Modo offline con Service Worker
- [ ] Análisis de uso con métricas

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Variables personalizadas, Grid, Flexbox, Animaciones
- **JavaScript ES6+**: Módulos, Arrow Functions, Template Literals, Sets
- **Google Fonts**: Inter y Outfit
- **LocalStorage API**: Persistencia de datos
- **SVG Icons**: Iconografía escalable

## 📝 Notas Técnicas

### Variables CSS Principales
```css
--bg-primary: #000000        /* AMOLED Black */
--text-primary: #e5e5e5      /* Light Gray */
--accent-primary: #14b8a6    /* Turquoise */
--position-front: #38bdf8    /* Fixed Blue */
--position-rear: #ef4444     /* Fixed Red */
--spacing-md: 16px           /* Base spacing */
```

### Estado de la Aplicación
El estado global incluye:
- Tema actual (dark/light)
- Acento actual (turquoise/blue/purple/orange)
- Filtros activos
- Set de favoritos
- Set de productos a comparar
- Historial de búsquedas
- Datos filtrados

## 📄 Licencia

Este proyecto es un prototipo de demostración creado para **Brake X**.

---

**Desarrollado con** ⚡ **por Antigravity AI** | **Diseño Premium** 🎨 **AMOLED Dark Theme**
