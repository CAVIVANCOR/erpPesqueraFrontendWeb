/**
 * Formateadores para mostrar información de filtros
 */

/**
 * Formatea un cliente para mostrar en el filtro
 * @param {object} cliente - Objeto cliente con cantidad y totales
 * @returns {string} Texto formateado
 */
export const formatearFiltroCliente = (cliente) => {
  if (!cliente) return '';
  
  const nombre = cliente.razonSocial || cliente.nombre || 'Sin nombre';
  const cantidad = cliente.cantidad || 0;
  
  let texto = `${nombre} (${cantidad} doc${cantidad !== 1 ? 's' : ''})`;
  
  // Agregar totales si existen
  if (cliente.totalSoles > 0 || cliente.totalDolares > 0) {
    const totales = [];
    if (cliente.totalSoles > 0) {
      totales.push(`S/. ${formatearMonto(cliente.totalSoles)}`);
    }
    if (cliente.totalDolares > 0) {
      totales.push(`US$ ${formatearMonto(cliente.totalDolares)}`);
    }
    if (totales.length > 0) {
      texto += ` - ${totales.join(' | ')}`;
    }
  }
  
  return texto;
};

/**
 * Formatea un tipo de documento para mostrar en el filtro
 * @param {object} tipoDoc - Objeto tipo documento con cantidad y totales
 * @returns {string} Texto formateado
 */
export const formatearFiltroTipoDoc = (tipoDoc) => {
  if (!tipoDoc) return '';
  
  const descripcion = tipoDoc.descripcion || tipoDoc.codigo || 'Sin descripción';
  const cantidad = tipoDoc.cantidad || 0;
  
  return `${descripcion} (${cantidad} doc${cantidad !== 1 ? 's' : ''})`;
};

/**
 * Formatea una moneda para mostrar en el filtro
 * @param {object} moneda - Objeto moneda con cantidad y total
 * @returns {string} Texto formateado
 */
export const formatearFiltroMoneda = (moneda) => {
  if (!moneda) return '';
  
  const descripcion = moneda.descripcion || moneda.simbolo || 'Sin descripción';
  const cantidad = moneda.cantidad || 0;
  const total = moneda.total || 0;
  
  let texto = `${descripcion} (${cantidad} doc${cantidad !== 1 ? 's' : ''})`;
  
  if (total > 0) {
    texto += ` - ${moneda.simbolo || ''} ${formatearMonto(total)}`;
  }
  
  return texto;
};

/**
 * Formatea un estado para mostrar en el filtro
 * @param {object} estado - Objeto estado con cantidad y totales
 * @returns {string} Texto formateado
 */
export const formatearFiltroEstado = (estado) => {
  if (!estado) return '';
  
  const descripcion = estado.descripcion || 'Sin descripción';
  const cantidad = estado.cantidad || 0;
  
  return `${descripcion} (${cantidad} doc${cantidad !== 1 ? 's' : ''})`;
};

/**
 * Formatea un personal para mostrar en el filtro
 * @param {object} personal - Objeto personal con cantidad y totales
 * @returns {string} Texto formateado
 */
export const formatearFiltroPersonal = (personal) => {
  if (!personal) return '';
  
  const nombre = personal.nombreCompleto || personal.nombre || 'Sin nombre';
  const cantidad = personal.cantidad || 0;
  
  return `${nombre} (${cantidad} doc${cantidad !== 1 ? 's' : ''})`;
};

/**
 * Formatea un contador de documentos
 * @param {number} cantidad - Cantidad de documentos
 * @returns {string} Texto formateado
 */
export const formatearContador = (cantidad) => {
  if (!cantidad || cantidad === 0) return '0 documentos';
  if (cantidad === 1) return '1 documento';
  return `${cantidad} documentos`;
};

/**
 * Formatea un monto con separadores de miles
 * @param {number} monto - Monto a formatear
 * @returns {string} Monto formateado
 */
export const formatearMonto = (monto) => {
  if (!monto || monto === 0) return '0.00';
  
  const numero = Number(monto);
  
  // Formatear con separadores de miles
  return numero.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formatea un chip de resumen de filtro
 * @param {object} filtro - Objeto con tipo y descripción
 * @returns {string} Texto para el chip
 */
export const formatearResumenChip = (filtro) => {
  if (!filtro) return '';
  
  return `${filtro.icono || ''} ${filtro.descripcion || ''}`.trim();
};

/**
 * Formatea un rango de fechas
 * @param {Date} desde - Fecha desde
 * @param {Date} hasta - Fecha hasta
 * @returns {string} Rango formateado
 */
export const formatearRangoFechas = (desde, hasta) => {
  const formatoFecha = (fecha) => {
    if (!fecha) return '...';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return `${formatoFecha(desde)} - ${formatoFecha(hasta)}`;
};

/**
 * Formatea subtotales por moneda
 * @param {number} totalSoles - Total en soles
 * @param {number} totalDolares - Total en dólares
 * @returns {string} Subtotales formateados
 */
export const formatearSubtotales = (totalSoles, totalDolares) => {
  const subtotales = [];
  
  if (totalSoles > 0) {
    subtotales.push(`S/. ${formatearMonto(totalSoles)}`);
  }
  if (totalDolares > 0) {
    subtotales.push(`US$ ${formatearMonto(totalDolares)}`);
  }
  
  return subtotales.join(' | ') || 'S/. 0.00';
};
