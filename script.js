// Dentro de async function inicializarApp()

            data = data.map((item, index) => { // <--- Añadir 'index'
                if (item.imagen && (!item.imagenes || item.imagenes.length === 0)) {
                    item.imagenes = [
                        item.imagen.replace("text=", `text=Vista+1+`),
                        item.imagen.replace("text=", `text=Vista+2+`),
                        item.imagen.replace("text=", `text=Vista+3+`)
                    ];
                }
                const partes = item.medidas ? item.medidas.split('x').map(s => parseFloat(s.trim())) : [0,0];
                
                // --- CAMBIO: Asegurar que ref, oem, fmsi sean arrays de strings ---
                 const safeRefs = Array.isArray(item.ref) ? item.ref.map(String) : [];
                 const safeOems = Array.isArray(item.oem) ? item.oem.map(String) : [];
                 const safeFmsis = Array.isArray(item.fmsi) ? item.fmsi.map(String) : [];

                return { ...item,
                         _appId: index, // <--- AÑADIR ESTA LÍNEA
                         ref: safeRefs,
                         oem: safeOems,
                         fmsi: safeFmsis,
                         anchoNum: partes[0] || 0,
                         altoNum: partes[1] || 0 };
            });
