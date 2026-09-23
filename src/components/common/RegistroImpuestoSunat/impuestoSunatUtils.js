// src/components/common/RegistroImpuestoSunat/impuestoSunatUtils.js

/**
 * ════════════════════════════════════════════════════════════
 * UTILIDADES PARA COMPONENTES DE IMPUESTOS SUNAT
 * ════════════════════════════════════════════════════════════
 * Funciones auxiliares para manejo de Detracción, Retención y Percepción
 */

/**
 * Obtiene la configuración de colores según el tipo de impuesto
 * @param {string} tipo - 'DETRACCION' | 'RETENCION' | 'PERCEPCION'
 * @returns {object} Configuración de colores
 */
export const getColorConfig = (tipo) => {
  switch(tipo) {
    case 'DETRACCION':
      return {
        tipo: { bg: '#cfe2ff', border: '#b6d4fe' },      // Azul claro
        tasa: { bg: '#e7d6f5', border: '#d4b9e8' },      // Morado claro
        fecha: { bg: '#d1ecf1', border: '#bee5eb' },     // Cyan claro
        total: { bg: '#e7d6f5', border: '#d4b9e8' },     // Morado claro
        requerido: { bg: '#fff3cd', border: '#ffeaa7' }, // Amarillo claro
        pagado: { bg: '#d1e7dd', border: '#badbcc' },    // Verde claro
        saldo: { bg: '#f8d7da', border: '#f5c6cb' },     // Rojo claro
        icon: 'pi-percentage',
        label: 'Detracción'
      };
    
    case 'RETENCION':
      return {
        tipo: { bg: '#e7d6f5', border: '#d4b9e8' },      // Morado claro
        tasa: { bg: '#cfe2ff', border: '#b6d4fe' },      // Azul claro
        fecha: { bg: '#d1ecf1', border: '#bee5eb' },     // Cyan claro
        total: { bg: '#e7d6f5', border: '#d4b9e8' },     // Morado claro
        requerido: { bg: '#fff3cd', border: '#ffeaa7' }, // Amarillo claro
        pagado: { bg: '#d1e7dd', border: '#badbcc' },    // Verde claro
        saldo: { bg: '#f8d7da', border: '#f5c6cb' },     // Rojo claro
        icon: 'pi-minus-circle',
        label: 'Retención'
      };
    
    case 'PERCEPCION':
      return {
        tipo: { bg: '#d1f4e0', border: '#b8e6cc' },      // Verde menta claro
        tasa: { bg: '#fff3cd', border: '#ffeaa7' },      // Amarillo claro
        fecha: { bg: '#d1ecf1', border: '#bee5eb' },     // Cyan claro
        total: { bg: '#e7d6f5', border: '#d4b9e8' },     // Morado claro
        requerido: { bg: '#fff3cd', border: '#ffeaa7' }, // Amarillo claro
        pagado: { bg: '#d1e7dd', border: '#badbcc' },    // Verde claro
        saldo: { bg: '#f8d7da', border: '#f5c6cb' },     // Rojo claro
        icon: 'pi-plus-circle',
        label: 'Percepción'
      };
    
    default:
      return {
        tipo: { bg: '#e9ecef', border: '#dee2e6' },
        tasa: { bg: '#e9ecef', border: '#dee2e6' },
        fecha: { bg: '#e9ecef', border: '#dee2e6' },
        total: { bg: '#e9ecef', border: '#dee2e6' },
        requerido: { bg: '#e9ecef', border: '#dee2e6' },
        pagado: { bg: '#e9ecef', border: '#dee2e6' },
        saldo: { bg: '#e9ecef', border: '#dee2e6' },
        icon: 'pi-file',
        label: 'Impuesto'
      };
  }
};

/**
 * Obtiene la configuración de campos según el tipo de impuesto
 * @param {string} tipo - 'DETRACCION' | 'RETENCION' | 'PERCEPCION'
 * @param {object} registro - Objeto del registro de impuesto
 * @returns {object} Configuración de campos
 */
export const getFieldConfig = (tipo, registro) => {
  if (!registro) return null;

  const baseConfig = {
    tipo: {
      label: '',
      value: ''
    },
    tasa: {
      label: 'Tasa',
      value: 0
    },
    fecha: {
      label: '',
      value: null
    },
    total: {
      label: 'Total',
      value: registro.importeTotal || 0
    },
    requerido: {
      label: '',
      value: 0
    },
    pagado: {
      label: 'Pagado',
      value: registro.importePagado || 0
    },
    saldo: {
      label: 'Saldo',
      value: registro.saldoPendiente || 0
    }
  };

  switch(tipo) {
    case 'DETRACCION':
      return {
        ...baseConfig,
        tipo: {
          label: 'Tipo Detracción',
          value: registro.tipoDetraccion 
            ? `${registro.tipoDetraccion.codigo} - ${registro.tipoDetraccion.nombre}`
            : 'N/A'
        },
        tasa: {
          label: 'Tasa',
          value: registro.tasaDetraccion || 0
        },
        fecha: {
          label: 'F.Emisión',
          value: registro.fechaEmision
        },
        requerido: {
          label: 'Requerido',
          value: registro.importeRequerido || 0
        }
      };
    
    case 'RETENCION':
      return {
        ...baseConfig,
        tipo: {
          label: 'Tipo Retención',
          value: registro.tipoRetencion 
            ? `${registro.tipoRetencion.codigo} - ${registro.tipoRetencion.descripcion}`
            : 'N/A'
        },
        tasa: {
          label: 'Tasa',
          value: registro.tasaRetencion || 0
        },
        fecha: {
          label: 'F.Emisión',
          value: registro.fechaEmision
        },
        requerido: {
          label: 'Retenido',
          value: registro.importeRetenido || 0
        }
      };
    
    case 'PERCEPCION':
      return {
        ...baseConfig,
        tipo: {
          label: 'Tipo Percepción',
          value: registro.tipoPercepcion 
            ? `${registro.tipoPercepcion.codigo} - ${registro.tipoPercepcion.descripcion}`
            : 'N/A'
        },
        tasa: {
          label: 'Tasa',
          value: registro.tasaPercepcion || 0
        },
        fecha: {
          label: 'F.Emisión',
          value: registro.fechaEmision
        },
        requerido: {
          label: 'Percibido',
          value: registro.importePercibido || 0
        }
      };
    
    default:
      return baseConfig;
  }
};

/**
 * Detecta el tipo de impuesto desde un documento (CxC o CxP)
 * @param {object} documento - Objeto de CuentaPorCobrar o CuentaPorPagar
 * @returns {object|null} { tipo, registro, estados } o null si no hay impuesto
 */
export const detectarImpuesto = (documento, estadosDetraccion, estadosRetencion, estadosPercepcion) => {
  if (!documento) return null;

  // ✅ Para CuentaPorCobrar: usa preFactura
  // ✅ Para CuentaPorPagar: usa ordenCompra
  const origen = documento.preFactura || documento.ordenCompra;

  if (!origen) return null;

  // Prioridad: Detracción > Retención > Percepción
  if (origen.aplicaDetraccion && origen.detraccion) {
    return {
      tipo: 'DETRACCION',
      registro: origen.detraccion,
      estados: estadosDetraccion || []
    };
  }

  if (origen.aplicaRetencion && origen.retencion) {
    return {
      tipo: 'RETENCION',
      registro: origen.retencion,
      estados: estadosRetencion || []
    };
  }

  if (origen.aplicaPercepcion && origen.percepcion) {
    return {
      tipo: 'PERCEPCION',
      registro: origen.percepcion,
      estados: estadosPercepcion || []
    };
  }

  return null;
};

/**
 * Formatea un número con separadores de miles y decimales
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
export const formatearNumero = (num) => {
  return new Intl.NumberFormat('es-PE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(num || 0);
};

/**
 * Formatea una fecha en formato dd/mm/yyyy
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-PE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};
