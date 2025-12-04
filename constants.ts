import { Product, SearchHistoryItem, FavoriteList } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    reference: 'D1391',
    name: 'D1391',
    position: 'Delantera',
    applications: ['Toyota Corolla', 'RAV4', 'Camry'],
    rating: 4.5,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGX4UJ3G-_vfwwyedO7pkZVKKxBYGaKb_LxOUJve8KZ8GIagrtCNKR-oTVQsO7NXWBzJS_qL2qNzyZveh1tOGdyBir2jSJR-6gM1VAE-t96zJTCDFwEjmpAOruy1Ajk96HPERV4JTh_-lu-GIoVH0Z22sLwnULXAg3PtC2g-HpSXHO6GM6KmaqUzB3mEJelQFdHv92MX-XVXU4elVN2UsQDQrO5K7SKpz2rPKJalm3LKpP2jEJtWdfi30az4l6Nk0dZeYJuP8BPBg',
    specs: { width: '146.5mm', height: '58.5mm', fmsi: 'D1391-8567', brand: 'Toyota' }
  },
  {
    id: '2',
    reference: 'D1083',
    name: 'D1083',
    position: 'Trasera',
    applications: ['Honda Civic', 'Accord', 'CR-V'],
    rating: 4.8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-xGv15rBbwgv2M54fL6wjYIVnIfj3t8icWiSuLhfuhix4fORH18OxiWJimHyJVcS7kP6G9Q_j3NjlLmfIlKkanF-SgxLKDTqqlSxFgiIR78aERC8DGc4oQcmNWZWlbjGiZ4PeJ7y1CxOEQkk7YBZr1nYf4xh2AiUIUwx6Sxv98iEe-UWipXn_oJbXCOLlwkpes6_bVWRCTgsEbCeMVQR_TiUwRzTmNh158eSh1SfjqCyTv_7rikpSYueTMtk8ULSfFwOSta1QBfc',
    specs: { width: '108.9mm', height: '45.2mm', fmsi: 'D1083-7982', brand: 'Honda' }
  },
  {
    id: '3',
    reference: 'D1044',
    name: 'D1044',
    position: 'Delantera',
    applications: ['Ford F-150', 'Explorer', 'Mustang'],
    rating: 4.2,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXSflX6dLB57JdVki0l5bKKVrcrjonlgllEP7iaBEWbBf3PxQtQ8g1iLDDYA5NPTd9AwrR_Sm6e6SeZuGakZ_VjwrZwX4lYbGvPwUPmT2hXt183X4pxfpXZoWIGGntDMQPYogXPmVueDs35FULUIn3NWWYxbsalapKQ4T-X9KFp75strRFll1keuNqWISW0OeYw0wl_3JNF6ggdvxyfH4_lCaDQVt0GESuzy2DDNqSW3KLPVuHFYTQQ0C3qH9PVA9YpGbHGdLLBmY',
    specs: { width: '156.4mm', height: '62.1mm', fmsi: 'D1044-8341', brand: 'Ford' }
  },
  {
    id: '4',
    reference: 'D1414',
    name: 'D1414',
    position: 'Delantera',
    applications: ['Chevrolet Silverado', 'Tahoe'],
    rating: 4.6,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChh2YZzj8b_nW_8TYzi200bxOaDQjJsH8EAwLN8N4gAMD5uPdMtHDJ4_Ajnfghtk5siKhUYqd1Oe-cFPolkoaQIrV0EfaKisCqUSN0zV_jm3WZLVtWK0MZmUwXmww8UrPbUv-t1M7sj9PKkgz2eG6F7atYHTyxSh3IDsUvU7DFgr4LfJae0e2Iq6nNrw6UCq6mGMgu7Q9Ny-wmkdpJqzsnvG1ZXWfzPoHsdZWBM4li3EKD6-3Fw6eLQAjzRMrSEgI9-vufCJgbpHg',
    specs: { width: '160.2mm', height: '65.4mm', fmsi: 'D1414-8765', brand: 'Chevrolet' }
  }
];

export const MOCK_HISTORY: SearchHistoryItem[] = [
  { id: '1', query: 'Toyota Camry 2020', date: 'hace 1 hora', type: 'search', saved: true },
  { id: '2', query: 'BX-MET-3305', date: 'hace 1 hora', type: 'product', saved: true },
  { id: '3', query: 'Nissan Sentra', date: 'hace 3 horas', type: 'search', saved: false },
  { id: '4', query: 'Ford F-150 2022', date: 'hace 2 días', type: 'search', saved: false },
  { id: '5', query: 'BX-CER-2401', date: 'hace 2 días', type: 'product', saved: true },
];

export const MOCK_FAVORITES: FavoriteList[] = [
  {
    id: '1',
    name: 'Vehículos de Alto Rendimiento',
    itemCount: 3,
    color: 'bg-green-500',
    items: [PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]
  },
  {
    id: '2',
    name: 'Mantenimiento Cliente X',
    itemCount: 2,
    color: 'bg-yellow-500',
    items: [PRODUCTS[3], PRODUCTS[1]]
  }
];