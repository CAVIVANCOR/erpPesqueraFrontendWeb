import { useMemo } from 'react';

/**
 * Hook para extraer opciones dinámicas de filtros basadas en los documentos actuales
 * @param {Array} documentos - Array de documentos
 * @param {string} tipo - Tipo de filtro activo
 * @returns {object} Opciones disponibles con contadores
 */
export const useFiltrosOpciones = (documentos = [], tipo) => {
  
  const opciones = useMemo(() => {
    if (!documentos || documentos.length === 0) {
      return {
        clientes: [],
        proveedores: [],
        entidadesComerciales: [],
        tiposDocumento: [],
        monedas: [],
        estados: [],
        personal: [],
        rangoMontos: { min: 0, max: 0 },
        totalDocumentos: 0
      };
    }

    // Extraer clientes únicos con contadores
    const clientesMap = new Map();
    const proveedoresMap = new Map();
    const entidadesMap = new Map();
    const tiposDocMap = new Map();
    const monedasMap = new Map();
    const estadosMap = new Map();
    const personalMap = new Map();
    
    let montoMin = Infinity;
    let montoMax = -Infinity;

    documentos.forEach(doc => {
      // Clientes (para CxC)
      if (doc.entidadComercial && doc.tipo === 'INGRESO') {
        const key = doc.entidadComercial.id;
        if (!clientesMap.has(key)) {
          clientesMap.set(key, {
            ...doc.entidadComercial,
            cantidad: 0,
            totalSoles: 0,
            totalDolares: 0
          });
        }
        const cliente = clientesMap.get(key);
        cliente.cantidad++;
        if (doc.moneda?.codigoSunat === 'PEN') {
          cliente.totalSoles += Number(doc.saldoPendiente || 0);
        } else if (doc.moneda?.codigoSunat === 'USD') {
          cliente.totalDolares += Number(doc.saldoPendiente || 0);
        }
      }

      // Proveedores (para CxP)
      if (doc.entidadComercial && doc.tipo === 'EGRESO') {
        const key = doc.entidadComercial.id;
        if (!proveedoresMap.has(key)) {
          proveedoresMap.set(key, {
            ...doc.entidadComercial,
            cantidad: 0,
            totalSoles: 0,
            totalDolares: 0
          });
        }
        const proveedor = proveedoresMap.get(key);
        proveedor.cantidad++;
        if (doc.moneda?.codigoSunat === 'PEN') {
          proveedor.totalSoles += Number(doc.saldoPendiente || 0);
        } else if (doc.moneda?.codigoSunat === 'USD') {
          proveedor.totalDolares += Number(doc.saldoPendiente || 0);
        }
      }

      // Entidades comerciales (para TODOS)
      if (doc.entidadComercial) {
        const key = doc.entidadComercial.id;
        if (!entidadesMap.has(key)) {
          entidadesMap.set(key, {
            ...doc.entidadComercial,
            cantidad: 0,
            totalSoles: 0,
            totalDolares: 0
          });
        }
        const entidad = entidadesMap.get(key);
        entidad.cantidad++;
        if (doc.moneda?.codigoSunat === 'PEN') {
          entidad.totalSoles += Number(doc.saldoPendiente || 0);
        } else if (doc.moneda?.codigoSunat === 'USD') {
          entidad.totalDolares += Number(doc.saldoPendiente || 0);
        }
      }

      // Tipos de documento
      if (doc.tipoDocumento) {
        const key = doc.tipoDocumento.id;
        if (!tiposDocMap.has(key)) {
          tiposDocMap.set(key, {
            ...doc.tipoDocumento,
            cantidad: 0,
            totalSoles: 0,
            totalDolares: 0
          });
        }
        const tipoDoc = tiposDocMap.get(key);
        tipoDoc.cantidad++;
        if (doc.moneda?.codigoSunat === 'PEN') {
          tipoDoc.totalSoles += Number(doc.saldoPendiente || 0);
        } else if (doc.moneda?.codigoSunat === 'USD') {
          tipoDoc.totalDolares += Number(doc.saldoPendiente || 0);
        }
      }

      // Monedas
      if (doc.moneda) {
        const key = doc.moneda.id;
        if (!monedasMap.has(key)) {
          monedasMap.set(key, {
            ...doc.moneda,
            cantidad: 0,
            total: 0
          });
        }
        const moneda = monedasMap.get(key);
        moneda.cantidad++;
        moneda.total += Number(doc.saldoPendiente || 0);
      }

      // Estados
      if (doc.estado) {
        const key = doc.estado.id;
        if (!estadosMap.has(key)) {
          estadosMap.set(key, {
            ...doc.estado,
            cantidad: 0,
            totalSoles: 0,
            totalDolares: 0
          });
        }
        const estado = estadosMap.get(key);
        estado.cantidad++;
        if (doc.moneda?.codigoSunat === 'PEN') {
          estado.totalSoles += Number(doc.saldoPendiente || 0);
        } else if (doc.moneda?.codigoSunat === 'USD') {
          estado.totalDolares += Number(doc.saldoPendiente || 0);
        }
      }

      // Personal (para asignaciones)
      if (doc.personal) {
        const key = doc.personal.id;
        if (!personalMap.has(key)) {
          personalMap.set(key, {
            ...doc.personal,
            cantidad: 0,
            totalSoles: 0,
            totalDolares: 0
          });
        }
        const pers = personalMap.get(key);
        pers.cantidad++;
        if (doc.moneda?.codigoSunat === 'PEN') {
          pers.totalSoles += Number(doc.saldoPendiente || 0);
        } else if (doc.moneda?.codigoSunat === 'USD') {
          pers.totalDolares += Number(doc.saldoPendiente || 0);
        }
      }

      // Rango de montos
      const monto = Number(doc.saldoPendiente || 0);
      if (monto < montoMin) montoMin = monto;
      if (monto > montoMax) montoMax = monto;
    });

    return {
      clientes: Array.from(clientesMap.values()).sort((a, b) => b.cantidad - a.cantidad),
      proveedores: Array.from(proveedoresMap.values()).sort((a, b) => b.cantidad - a.cantidad),
      entidadesComerciales: Array.from(entidadesMap.values()).sort((a, b) => b.cantidad - a.cantidad),
      tiposDocumento: Array.from(tiposDocMap.values()).sort((a, b) => b.cantidad - a.cantidad),
      monedas: Array.from(monedasMap.values()).sort((a, b) => b.cantidad - a.cantidad),
      estados: Array.from(estadosMap.values()).sort((a, b) => b.cantidad - a.cantidad),
      personal: Array.from(personalMap.values()).sort((a, b) => b.cantidad - a.cantidad),
      rangoMontos: {
        min: montoMin === Infinity ? 0 : montoMin,
        max: montoMax === -Infinity ? 0 : montoMax
      },
      totalDocumentos: documentos.length
    };
  }, [documentos, tipo]);

  return opciones;
};
