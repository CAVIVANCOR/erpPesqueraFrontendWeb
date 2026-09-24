import { useMemo } from 'react';

/**
 * Hook para calcular vista previa de resultados según filtros seleccionados
 * @param {object} filtros - Filtros seleccionados
 * @param {Array} documentos - Array de documentos
 * @returns {object} Vista previa con totales y contadores
 */
export const useFiltrosPreview = (filtros, documentos = []) => {
  
  const preview = useMemo(() => {
    if (!documentos || documentos.length === 0) {
      return {
        totalDocumentos: 0,
        totalSoles: 0,
        totalDolares: 0,
        porcentaje: 0,
        distribucionEstados: {},
        distribucionMonedas: {}
      };
    }

    // Aplicar filtros localmente para calcular preview
    let docsFiltrados = [...documentos];

    // Filtro por fechas
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      docsFiltrados = docsFiltrados.filter(doc => {
        const fechaDoc = new Date(doc.fechaEmision);
        return fechaDoc >= fechaDesde;
      });
    }
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      docsFiltrados = docsFiltrados.filter(doc => {
        const fechaDoc = new Date(doc.fechaEmision);
        return fechaDoc <= fechaHasta;
      });
    }

    // Filtro por clientes
    if (filtros.clienteIds && filtros.clienteIds.length > 0) {
      docsFiltrados = docsFiltrados.filter(doc => 
        doc.entidadComercial && filtros.clienteIds.includes(doc.entidadComercial.id)
      );
    }

    // Filtro por proveedores
    if (filtros.proveedorIds && filtros.proveedorIds.length > 0) {
      docsFiltrados = docsFiltrados.filter(doc => 
        doc.entidadComercial && filtros.proveedorIds.includes(doc.entidadComercial.id)
      );
    }

    // Filtro por entidades comerciales (para TODOS)
    if (filtros.entidadComercialIds && filtros.entidadComercialIds.length > 0) {
      docsFiltrados = docsFiltrados.filter(doc => 
        doc.entidadComercial && filtros.entidadComercialIds.includes(doc.entidadComercial.id)
      );
    }

    // Filtro por tipos de documento
    if (filtros.tipoDocumentoIds && filtros.tipoDocumentoIds.length > 0) {
      docsFiltrados = docsFiltrados.filter(doc => 
        doc.tipoDocumento && filtros.tipoDocumentoIds.includes(doc.tipoDocumento.id)
      );
    }

    // Filtro por número de documento
    if (filtros.numeroDocumento) {
      const busqueda = filtros.numeroDocumento.toLowerCase();
      docsFiltrados = docsFiltrados.filter(doc => {
        const numero = `${doc.serie || ''}-${doc.numero || ''}`.toLowerCase();
        return numero.includes(busqueda);
      });
    }

    // Filtro por monedas
    if (filtros.monedaIds && filtros.monedaIds.length > 0) {
      docsFiltrados = docsFiltrados.filter(doc => 
        doc.moneda && filtros.monedaIds.includes(doc.moneda.id)
      );
    }

    // Filtro por estados
    if (filtros.estadoIds && filtros.estadoIds.length > 0) {
      docsFiltrados = docsFiltrados.filter(doc => 
        doc.estado && filtros.estadoIds.includes(doc.estado.id)
      );
    }

    // Filtro por personal
    if (filtros.personalIds && filtros.personalIds.length > 0) {
      docsFiltrados = docsFiltrados.filter(doc => 
        doc.personal && filtros.personalIds.includes(doc.personal.id)
      );
    }

    // Filtro por rango de montos
    if (filtros.montoDesde !== null && filtros.montoDesde !== undefined) {
      docsFiltrados = docsFiltrados.filter(doc => 
        Number(doc.saldoPendiente || 0) >= Number(filtros.montoDesde)
      );
    }
    if (filtros.montoHasta !== null && filtros.montoHasta !== undefined) {
      docsFiltrados = docsFiltrados.filter(doc => 
        Number(doc.saldoPendiente || 0) <= Number(filtros.montoHasta)
      );
    }

    // Calcular totales
    let totalSoles = 0;
    let totalDolares = 0;
    const distribucionEstados = {};
    const distribucionMonedas = {};

    docsFiltrados.forEach(doc => {
      const monto = Number(doc.saldoPendiente || 0);
      
      if (doc.moneda?.codigoSunat === 'PEN') {
        totalSoles += monto;
      } else if (doc.moneda?.codigoSunat === 'USD') {
        totalDolares += monto;
      }

      // Distribución por estado
      if (doc.estado) {
        const estadoKey = doc.estado.descripcion;
        if (!distribucionEstados[estadoKey]) {
          distribucionEstados[estadoKey] = { cantidad: 0, total: 0 };
        }
        distribucionEstados[estadoKey].cantidad++;
        distribucionEstados[estadoKey].total += monto;
      }

      // Distribución por moneda
      if (doc.moneda) {
        const monedaKey = doc.moneda.simbolo;
        if (!distribucionMonedas[monedaKey]) {
          distribucionMonedas[monedaKey] = { cantidad: 0, total: 0 };
        }
        distribucionMonedas[monedaKey].cantidad++;
        distribucionMonedas[monedaKey].total += monto;
      }
    });

    const porcentaje = documentos.length > 0 
      ? Math.round((docsFiltrados.length / documentos.length) * 100) 
      : 0;

    return {
      totalDocumentos: docsFiltrados.length,
      totalSoles,
      totalDolares,
      porcentaje,
      distribucionEstados,
      distribucionMonedas
    };
  }, [filtros, documentos]);

  return preview;
};
