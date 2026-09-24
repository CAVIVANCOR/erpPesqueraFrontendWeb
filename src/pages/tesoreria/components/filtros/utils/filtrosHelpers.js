/**
 * Utilidades para manejo de filtros
 */

/**
 * Cuenta el número de filtros activos
 * @param {object} filtros - Objeto de filtros
 * @returns {number} Cantidad de filtros activos
 */
export const contarFiltrosActivos = (filtros) => {
  let count = 0;
  
  if (filtros.fechaDesde || filtros.fechaHasta) count++;
  if (filtros.clienteIds?.length > 0) count += filtros.clienteIds.length;
  if (filtros.proveedorIds?.length > 0) count += filtros.proveedorIds.length;
  if (filtros.entidadComercialIds?.length > 0) count += filtros.entidadComercialIds.length;
  if (filtros.tipoDocumentoIds?.length > 0) count += filtros.tipoDocumentoIds.length;
  if (filtros.numeroDocumento) count++;
  if (filtros.monedaIds?.length > 0) count += filtros.monedaIds.length;
  if (filtros.estadoIds?.length > 0) count += filtros.estadoIds.length;
  if (filtros.personalIds?.length > 0) count += filtros.personalIds.length;
  if (filtros.montoDesde !== null || filtros.montoHasta !== null) count++;
  
  return count;
};

/**
 * Genera un resumen textual de los filtros activos
 * @param {object} filtros - Objeto de filtros
 * @param {object} opciones - Opciones disponibles con datos
 * @returns {Array} Array de objetos con tipo y descripción de filtros
 */
export const generarResumenFiltros = (filtros, opciones) => {
  const resumen = [];

  // Rango de fechas
  if (filtros.fechaDesde || filtros.fechaHasta) {
    const desde = filtros.fechaDesde ? new Date(filtros.fechaDesde).toLocaleDateString('es-PE') : '...';
    const hasta = filtros.fechaHasta ? new Date(filtros.fechaHasta).toLocaleDateString('es-PE') : '...';
    resumen.push({
      tipo: 'fecha',
      icono: '📅',
      descripcion: `${desde} - ${hasta}`,
      campo: 'fechas'
    });
  }

  // Clientes
  if (filtros.clienteIds?.length > 0 && opciones.clientes) {
    const clientes = opciones.clientes
      .filter(c => filtros.clienteIds.includes(c.id))
      .map(c => c.razonSocial || c.nombre);
    
    clientes.forEach(nombre => {
      resumen.push({
        tipo: 'cliente',
        icono: '👤',
        descripcion: nombre,
        campo: 'clienteIds'
      });
    });
  }

  // Proveedores
  if (filtros.proveedorIds?.length > 0 && opciones.proveedores) {
    const proveedores = opciones.proveedores
      .filter(p => filtros.proveedorIds.includes(p.id))
      .map(p => p.razonSocial || p.nombre);
    
    proveedores.forEach(nombre => {
      resumen.push({
        tipo: 'proveedor',
        icono: '🏭',
        descripcion: nombre,
        campo: 'proveedorIds'
      });
    });
  }

  // Entidades comerciales
  if (filtros.entidadComercialIds?.length > 0 && opciones.entidadesComerciales) {
    const entidades = opciones.entidadesComerciales
      .filter(e => filtros.entidadComercialIds.includes(e.id))
      .map(e => e.razonSocial || e.nombre);
    
    entidades.forEach(nombre => {
      resumen.push({
        tipo: 'entidad',
        icono: '🏢',
        descripcion: nombre,
        campo: 'entidadComercialIds'
      });
    });
  }

  // Tipos de documento
  if (filtros.tipoDocumentoIds?.length > 0 && opciones.tiposDocumento) {
    const tipos = opciones.tiposDocumento
      .filter(t => filtros.tipoDocumentoIds.includes(t.id))
      .map(t => t.codigo || t.descripcion);
    
    tipos.forEach(tipo => {
      resumen.push({
        tipo: 'tipoDoc',
        icono: '📄',
        descripcion: tipo,
        campo: 'tipoDocumentoIds'
      });
    });
  }

  // Número de documento
  if (filtros.numeroDocumento) {
    resumen.push({
      tipo: 'numero',
      icono: '🔢',
      descripcion: filtros.numeroDocumento,
      campo: 'numeroDocumento'
    });
  }

  // Monedas
  if (filtros.monedaIds?.length > 0 && opciones.monedas) {
    const monedas = opciones.monedas
      .filter(m => filtros.monedaIds.includes(m.id))
      .map(m => m.simbolo || m.descripcion);
    
    monedas.forEach(moneda => {
      resumen.push({
        tipo: 'moneda',
        icono: '💰',
        descripcion: moneda,
        campo: 'monedaIds'
      });
    });
  }

  // Estados
  if (filtros.estadoIds?.length > 0 && opciones.estados) {
    const estados = opciones.estados
      .filter(e => filtros.estadoIds.includes(e.id))
      .map(e => e.descripcion);
    
    estados.forEach(estado => {
      resumen.push({
        tipo: 'estado',
        icono: '📊',
        descripcion: estado,
        campo: 'estadoIds'
      });
    });
  }

  // Personal
  if (filtros.personalIds?.length > 0 && opciones.personal) {
    const personal = opciones.personal
      .filter(p => filtros.personalIds.includes(p.id))
      .map(p => p.nombreCompleto || p.nombre);
    
    personal.forEach(nombre => {
      resumen.push({
        tipo: 'personal',
        icono: '👤',
        descripcion: nombre,
        campo: 'personalIds'
      });
    });
  }

  // Rango de montos
  if (filtros.montoDesde !== null || filtros.montoHasta !== null) {
    const desde = filtros.montoDesde !== null ? `S/. ${Number(filtros.montoDesde).toFixed(2)}` : '...';
    const hasta = filtros.montoHasta !== null ? `S/. ${Number(filtros.montoHasta).toFixed(2)}` : '...';
    resumen.push({
      tipo: 'monto',
      icono: '💵',
      descripcion: `${desde} - ${hasta}`,
      campo: 'montos'
    });
  }

  return resumen;
};

/**
 * Valida que los filtros sean correctos
 * @param {object} filtros - Objeto de filtros
 * @returns {object} { valido: boolean, errores: Array }
 */
export const validarFiltros = (filtros) => {
  const errores = [];

  // Validar rango de fechas
  if (filtros.fechaDesde && filtros.fechaHasta) {
    const desde = new Date(filtros.fechaDesde);
    const hasta = new Date(filtros.fechaHasta);
    if (desde > hasta) {
      errores.push('La fecha desde no puede ser mayor que la fecha hasta');
    }
  }

  // Validar rango de montos
  if (filtros.montoDesde !== null && filtros.montoHasta !== null) {
    if (Number(filtros.montoDesde) > Number(filtros.montoHasta)) {
      errores.push('El monto desde no puede ser mayor que el monto hasta');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
};
