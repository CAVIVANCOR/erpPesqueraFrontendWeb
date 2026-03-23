import { ESTADOS, ESTADO_COLORS, MONEDA_DEFAULT } from "./constants";

// Formatear moneda según código
export const formatearMoneda = (monto, codigoMoneda = MONEDA_DEFAULT) => {
  if (!monto || monto === 0) return "-";
  
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: codigoMoneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(monto));
  } catch (error) {
    console.error("Error formateando moneda:", error);
    return `${codigoMoneda} ${Number(monto).toFixed(2)}`;
  }
};

// Formatear fecha
export const formatearFecha = (fecha, options = {}) => {
  if (!fecha) return "-";
  
  try {
    const fechaObj = new Date(fecha);
    const defaultOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...options
    };
    
    return fechaObj.toLocaleString("es-PE", defaultOptions);
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return fecha.toString();
  }
};

// Obtener color de estado
export const getColorEstado = (estadoId) => {
  return ESTADO_COLORS[estadoId] || "secondary";
};

// Validar si un movimiento está aprobado
export const estaAprobado = (movimiento) => {
  return movimiento?.aprobadoPorId != null;
};

// Validar si un movimiento está rechazado
export const estaRechazado = (movimiento) => {
  return movimiento?.rechazadoPorId != null;
};

// Validar si un movimiento es una reversión
export const esReversion = (movimiento) => {
  return movimiento?.esReversion === true;
};

// Validar si un movimiento está validado
export const estaValidado = (movimiento) => {
  return Number(movimiento?.estadoId) === ESTADOS.VALIDADO;
};

// Obtener texto del estado
export const getTextoEstado = (movimiento) => {
  if (esReversion(movimiento)) return "REVERSIÓN";
  if (estaAprobado(movimiento)) return "APROBADO";
  if (estaRechazado(movimiento)) return "RECHAZADO";
  if (estaValidado(movimiento)) return "VALIDADO";
  return movimiento?.estado?.descripcion || "PENDIENTE";
};

// Validar si se pueden mostrar botones de workflow
export const puedeMostrarWorkflow = (movimiento) => {
  return !esReversion(movimiento);
};

// Validar si se puede aprobar un movimiento
export const puedeAprobar = (movimiento, permisos) => {
  return (
    permisos?.puedeAprobarDocs &&
    estaValidado(movimiento) &&
    !estaAprobado(movimiento) &&
    !estaRechazado(movimiento)
  );
};

// Validar si se puede rechazar un movimiento
export const puedeRechazar = (movimiento, permisos) => {
  return (
    permisos?.puedeRechazarDocs &&
    estaValidado(movimiento) &&
    !estaAprobado(movimiento) &&
    !estaRechazado(movimiento)
  );
};

// Validar si se puede revertir un movimiento
export const puedeRevertir = (movimiento, permisos) => {
  return (
    permisos?.puedeReactivarDocs &&
    estaAprobado(movimiento)
  );
};

// Validar si se puede editar un movimiento
export const puedeEditar = (movimiento, permisos) => {
  return (
    permisos?.puedeEditar &&
    !estaAprobado(movimiento) &&
    !estaRechazado(movimiento)
  );
};

// Validar si se puede eliminar un movimiento
export const puedeEliminar = (movimiento, permisos) => {
  return (
    permisos?.puedeEliminar &&
    !estaAprobado(movimiento) &&
    !estaRechazado(movimiento)
  );
};

// Calcular totales de un array de movimientos
export const calcularTotales = (movimientos) => {
  if (!movimientos || movimientos.length === 0) {
    return {
      total: 0,
      count: 0,
      porMoneda: {}
    };
  }

  const totales = movimientos.reduce((acc, movimiento) => {
    const monto = Number(movimiento.monto) || 0;
    const moneda = movimiento.moneda?.codigoSunat || MONEDA_DEFAULT;
    
    acc.total += monto;
    acc.count += 1;
    
    if (!acc.porMoneda[moneda]) {
      acc.porMoneda[moneda] = 0;
    }
    acc.porMoneda[moneda] += monto;
    
    return acc;
  }, {
    total: 0,
    count: 0,
    porMoneda: {}
  });

  return totales;
};

// Agrupar movimientos por estado
export const agruparPorEstado = (movimientos) => {
  if (!movimientos || movimientos.length === 0) {
    return {};
  }

  return movimientos.reduce((acc, movimiento) => {
    const estado = getTextoEstado(movimiento);
    
    if (!acc[estado]) {
      acc[estado] = {
        count: 0,
        total: 0,
        movimientos: []
      };
    }
    
    acc[estado].count += 1;
    acc[estado].total += Number(movimiento.monto) || 0;
    acc[estado].movimientos.push(movimiento);
    
    return acc;
  }, {});
};

// Buscar movimiento por ID
export const buscarMovimientoPorId = (movimientos, id) => {
  if (!movimientos || !id) return null;
  
  return movimientos.find(movimiento => 
    Number(movimiento.id) === Number(id)
  );
};

// Filtrar movimientos por empresa
export const filtrarPorEmpresa = (movimientos, empresaId) => {
  if (!movimientos || !empresaId) return movimientos;
  
  return movimientos.filter(movimiento => 
    Number(movimiento.empresaOrigenId) === Number(empresaId) ||
    Number(movimiento.empresaDestinoId) === Number(empresaId)
  );
};

// Filtrar movimientos por rango de fechas
export const filtrarPorRangoFechas = (movimientos, fechaInicio, fechaFin) => {
  if (!movimientos) return [];
  
  return movimientos.filter(movimiento => {
    if (!movimiento.fecha) return false;
    
    const fechaMov = new Date(movimiento.fecha);
    const fechaIni = fechaInicio ? new Date(fechaInicio) : null;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : null;
    
    if (fechaIni) {
      fechaIni.setHours(0, 0, 0, 0);
      if (fechaMov < fechaIni) return false;
    }
    
    if (fechaFinDate) {
      fechaFinDate.setHours(23, 59, 59, 999);
      if (fechaMov > fechaFinDate) return false;
    }
    
    return true;
  });
};

// Generar referencia automática
export const generarReferencia = (tipoMovimiento, empresaId) => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  
  return `${tipoMovimiento}-${empresaId}-${año}${mes}${dia}-${hora}${minuto}`;
};

// Validar formulario de movimiento
export const validarMovimiento = (movimiento) => {
  const errores = [];

  // Validaciones básicas
  if (!movimiento.fecha) {
    errores.push("La fecha es obligatoria");
  }

  if (!movimiento.tipoMovimientoId) {
    errores.push("El tipo de movimiento es obligatorio");
  }

  if (!movimiento.empresaOrigenId) {
    errores.push("La empresa de origen es obligatoria");
  }

  if (!movimiento.monto || movimiento.monto <= 0) {
    errores.push("El monto debe ser mayor a 0");
  }

  if (!movimiento.monedaId) {
    errores.push("La moneda es obligatoria");
  }

  if (!movimiento.descripcion || movimiento.descripcion.trim().length === 0) {
    errores.push("La descripción es obligatoria");
  }

  // Validaciones específicas según tipo de movimiento
  if (movimiento.tipoMovimientoId === 1) { // Entrega a rendir
    if (!movimiento.cuentaCorrienteOrigenId) {
      errores.push("La cuenta de origen es obligatoria para entrega a rendir");
    }
  }

  if (movimiento.tipoMovimientoId === 5) { // Transferencia
    if (!movimiento.empresaDestinoId) {
      errores.push("La empresa de destino es obligatoria para transferencias");
    }
    if (!movimiento.cuentaCorrienteDestinoId) {
      errores.push("La cuenta de destino es obligatoria para transferencias");
    }
  }

  return errores;
};

// Exportar todas las funciones
export default {
  formatearMoneda,
  formatearFecha,
  getColorEstado,
  estaAprobado,
  estaRechazado,
  esReversion,
  estaValidado,
  getTextoEstado,
  puedeMostrarWorkflow,
  puedeAprobar,
  puedeRechazar,
  puedeRevertir,
  puedeEditar,
  puedeEliminar,
  calcularTotales,
  agruparPorEstado,
  buscarMovimientoPorId,
  filtrarPorEmpresa,
  filtrarPorRangoFechas,
  generarReferencia,
  validarMovimiento
};
