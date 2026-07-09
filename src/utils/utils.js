/**
 * Constante con los meses del año para dropdowns
 */
export const MESES = [
  { label: "Enero", value: 1 },
  { label: "Febrero", value: 2 },
  { label: "Marzo", value: 3 },
  { label: "Abril", value: 4 },
  { label: "Mayo", value: 5 },
  { label: "Junio", value: 6 },
  { label: "Julio", value: 7 },
  { label: "Agosto", value: 8 },
  { label: "Septiembre", value: 9 },
  { label: "Octubre", value: 10 },
  { label: "Noviembre", value: 11 },
  { label: "Diciembre", value: 12 },
];
/**
 * Constante global con las series de documentos estándar del sistema
 * Usar en todos los módulos que manejen series: RequerimientoCompra, OrdenCompra, 
 * CotizacionVentas, PreFactura, MovimientoAlmacen, etc.
 */
export const SERIES_DOCUMENTO = [
  { value: "001", label: "001 - MATERIA PRIMA" },
  { value: "002", label: "002 - PRODUCTO FINAL - SERVICIOS" }
];

/**
 * Función helper para obtener la descripción de una serie
 * @param {string} serie - Número de serie (ej: "001")
 * @returns {string} Descripción completa (ej: "001 - MATERIA PRIMA")
 */
export const getDescripcionSerie = (serie) => {
  const serieEncontrada = SERIES_DOCUMENTO.find(s => s.value === serie);
  return serieEncontrada ? serieEncontrada.label : serie;
};

export const getResponsiveFontSize = () => {
    const width = window.innerWidth;
    if (width < 768) return '10px';      // Móvil
    if (width < 1024) return '11px';     // Tablet
    return '12px';                       // Desktop
};

  /**
   * Función auxiliar para convertir strings a mayúsculas de forma segura
   */
export const toUpperCaseSafe = (value) => {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.toUpperCase() : null;
};

/**
 * Función para formatear números con comas para miles y apóstrofes para millones
 * @param {number|string} numero - Número a formatear
 * @param {number} numeroDecimales - Cantidad de decimales a mostrar (por defecto 2)
 * @returns {string} Número formateado con decimales, comas para miles y apóstrofes para millones
 */
export const formatearNumero = (numero, numeroDecimales = 2) => {
    const num = Number(numero);
    if (isNaN(num)) return "";
    
    const partes = num.toFixed(numeroDecimales).split(".");
    const entero = partes[0];
    const decimal = partes[1];
    
    // Formatear parte entera con comas y apóstrofes
    let enteroFormateado = "";
    let contador = 0;
    
    for (let i = entero.length - 1; i >= 0; i--) {
        if (contador === 3) {
            enteroFormateado = "," + enteroFormateado;
            contador = 0;
        }
        if (contador === 6) {
            enteroFormateado = "'" + enteroFormateado;
            contador = 0;
        }
        enteroFormateado = entero[i] + enteroFormateado;
        contador++;
    }
    
    // Agregar apóstrofe para millones si es necesario
    if (enteroFormateado.length > 7) {
        const partesMiles = enteroFormateado.split(",");
        if (partesMiles.length > 1) {
            enteroFormateado = partesMiles[0] + "'" + partesMiles.slice(1).join(",");
        }
    }
    
    return `${enteroFormateado}.${decimal}`;
};

/**
 * Función para formatear solo fecha (sin hora) de forma consistente en todo el ERP
 * @param {Date|string|null} fecha - Fecha a formatear (Date, string ISO, o null)
 * @param {string} mensajePorDefecto - Mensaje a mostrar si no hay fecha (opcional)
 * @returns {string} Fecha formateada en formato DD/MM/YYYY o mensaje por defecto
 */
export const formatearFecha = (fecha, mensajePorDefecto = "Sin fecha") => {
    if (!fecha) return mensajePorDefecto;
    
    let fechaObj;
    
    // Si es un objeto Date, usarlo directamente
    if (fecha instanceof Date) {
        fechaObj = fecha;
    }
    // Si es string, intentar parsearlo
    else if (typeof fecha === "string") {
        try {
            fechaObj = new Date(fecha);
            // Verificar si la fecha es válida
            if (isNaN(fechaObj.getTime())) {
                return fecha; // Si no se puede parsear, devolver el string original
            }
        } catch {
            return fecha; // Si hay error, devolver el string original
        }
    }
    // Si no es Date ni string, devolver mensaje por defecto
    else {
        return mensajePorDefecto;
    }
    
    // Formatear solo la fecha usando toLocaleDateString con configuración española
    return fechaObj.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
    });
};

/**
 * Función para formatear fechas y horas de forma consistente en todo el ERP
 * @param {Date|string|null} fechaHora - Fecha a formatear (Date, string ISO, o null)
 * @param {string} mensajePorDefecto - Mensaje a mostrar si no hay fecha (opcional)
 * @returns {string} Fecha formateada en formato DD/MM/YYYY HH:MM o mensaje por defecto
 */
export const formatearFechaHora = (fechaHora, mensajePorDefecto = "Sin fecha") => {
    if (!fechaHora) return mensajePorDefecto;
    
    let fecha;
    
    // Si es un objeto Date, usarlo directamente
    if (fechaHora instanceof Date) {
        fecha = fechaHora;
    }
    // Si es string, intentar parsearlo
    else if (typeof fechaHora === "string") {
        try {
            fecha = new Date(fechaHora);
            // Verificar si la fecha es válida
            if (isNaN(fecha.getTime())) {
                return fechaHora; // Si no se puede parsear, devolver el string original
            }
        } catch {
            return fechaHora; // Si hay error, devolver el string original
        }
    }
    // Si no es Date ni string, devolver mensaje por defecto
    else {
        return mensajePorDefecto;
    }
    
    // Formatear la fecha usando toLocaleString con configuración española
    return fecha.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/**
 * Función para formatear fecha y hora con formato AM/PM
 * @param {Date|string|null} fechaHora - Fecha a formatear
 * @param {string} mensajePorDefecto - Mensaje a mostrar si no hay fecha (opcional)
 * @returns {string} Fecha formateada en formato DD/MM/YYYY HH:MM AM/PM
 */
export const formatearFechaHoraAMPM = (fechaHora, mensajePorDefecto = "Sin fecha") => {
    if (!fechaHora) return mensajePorDefecto;
    
    let fecha;
    
    if (fechaHora instanceof Date) {
        fecha = fechaHora;
    } else if (typeof fechaHora === "string") {
        try {
            fecha = new Date(fechaHora);
            if (isNaN(fecha.getTime())) {
                return fechaHora;
            }
        } catch {
            return fechaHora;
        }
    } else {
        return mensajePorDefecto;
    }
    
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    
    let horas = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    
    horas = horas % 12;
    horas = horas ? horas : 12; // 0 se convierte en 12
    const horasStr = String(horas).padStart(2, '0');
    
    return `${dia}/${mes}/${anio} ${horasStr}:${minutos} ${ampm}`;
};

/**
 * Función genérica para crear templates de porcentaje con colores de fondo
 * @param {number} porcentaje - Valor del porcentaje
 * @param {Array} rangos - Array de objetos con {limite, color} ordenados de menor a mayor
 * @param {Object} opciones - Opciones de estilo adicionales
 * @returns {Object} Objeto con el valor y estilos para usar en JSX
 */
export const createPorcentajeTemplate = (porcentaje, rangos = null, opciones = {}) => {
    if (porcentaje === null || porcentaje === undefined || porcentaje === "") return null;
    
    const valor = Number(porcentaje);
    
    // Rangos por defecto para porcentaje de juveniles
    const rangosPorDefecto = [
        { limite: 10, color: "#2196F3" },  // Azul
        { limite: 25, color: "#4CAF50" },  // Verde
        { limite: 35, color: "#FF9800" },  // Naranja
        { limite: Infinity, color: "#F44336" } // Rojo
    ];
    
    const rangosAUsar = Array.isArray(rangos) ? rangos : rangosPorDefecto;
    
    // Encontrar el color correspondiente
    let backgroundColor = "#666"; // Color por defecto
    for (const rango of rangosAUsar) {
        if (valor <= rango.limite) {
            backgroundColor = rango.color;
            break;
        }
    }
    
    // Opciones de estilo por defecto
    const estilosPorDefecto = {
        color: "white",
        padding: "4px 8px",
        borderRadius: "4px",
        fontWeight: "bold",
        display: "inline-block",
        minWidth: "40px",
        textAlign: "center",
        fontSize: "0.9em"
    };
    
    const estilosFinales = {
        ...estilosPorDefecto,
        backgroundColor,
        ...opciones.estilos
    };
    
    const sufijo = opciones.sufijo || "%";
    const valorFormateado = opciones.decimales !== undefined ? valor.toFixed(opciones.decimales) : valor;
    
    return {
        valor: valorFormateado,
        estilos: estilosFinales,
        sufijo: sufijo
    };
};

/**
 * Obtiene los colores de fondo y texto según el severity
 * Centraliza los colores para mantener consistencia en toda la aplicación
 * @param {string} severity - El severity color (success, info, warning, danger, secondary, contrast)
 * @returns {object} - Objeto con bg (background) y text (color de texto)
 */
export const getSeverityColors = (severity) => {
    const severityColors = {
        success: { bg: "#22C55E", text: "#FFFFFF" },
        info: { bg: "#0EA5E9", text: "#FFFFFF" },
        warning: { bg: "#F97316", text: "#FFFFFF" },
        danger: { bg: "#EF4444", text: "#FFFFFF" },
        secondary: { bg: "#64748B", text: "#FFFFFF" },
        contrast: { bg: "#3B82F6", text: "#FFFFFF" },
        default: { bg: "#FFFFFF", text: "#000000" },
    };

    return severityColors[severity] || severityColors.default;
};


/**
 * Constante con los tipos de Dashboard disponibles en el ERP
 * Usada en formulario de Usuario para campo dashboardPorDefecto
 */
export const DASHBOARD_TYPES = [
  { label: "Dashboard por Módulos", value: "modular" },
  { label: "Dashboard por Unidades de Negocio", value: "unidades" }
];

/**
 * Estados OSE para ComprobanteElectronico
 * Representan el estado del comprobante en el OSE (Operador de Servicios Electrónicos)
 */
export const ESTADOS_OSE = {
  PENDIENTE: 50,   // Comprobante creado, pendiente de envío al OSE
  ENVIADO: 51,     // Enviado al OSE, esperando respuesta
  ACEPTADO: 52,    // Aceptado por el OSE
  RECHAZADO: 53,   // Rechazado por el OSE
  ERROR: 54        // Error en el proceso de envío
};

/**
 * Estados SUNAT para ComprobanteElectronico
 * Representan el estado del comprobante en SUNAT
 */
export const ESTADOS_SUNAT = {
  ACTIVO: 60,           // Comprobante activo y válido
  ANULADO: 61,          // Comprobante anulado
  BAJA: 62,             // Comprobante en proceso de baja
  BAJA_ACEPTADA: 63     // Baja aceptada por SUNAT
};



// ════════════════════════════════════════════════════════════════════════════
// ENUMS DEL SCHEMA PRISMA
// ════════════════════════════════════════════════════════════════════════════
// IMPORTANTE: Estos valores deben coincidir EXACTAMENTE con los ENUMs definidos
// en prisma/schema.prisma. Cualquier cambio en el Schema debe reflejarse aqui.
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// MODULO: PESCA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Zonas de pesca reconocidas
 * Schema: enum ZonaPesca
 */
export const ZONA_PESCA_OPTIONS = [
  { label: "NORTE", value: "NORTE" },
  { label: "SUR", value: "SUR" },
];

// ════════════════════════════════════════════════════════════════════════════
// MODULO: REUNIONES Y VIDEOCONFERENCIAS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Estados de reunion
 * Schema: enum EstadoReunion
 */
export const ESTADO_REUNION_OPTIONS = [
  { label: "PROGRAMADA", value: "PROGRAMADA" },
  { label: "EN CURSO", value: "EN_CURSO" },
  { label: "FINALIZADA", value: "FINALIZADA" },
  { label: "CANCELADA", value: "CANCELADA" },
];

/**
 * Roles de participantes en reuniones
 * Schema: enum RolParticipante
 */
export const ROL_PARTICIPANTE_OPTIONS = [
  { label: "MODERADOR", value: "MODERADOR" },
  { label: "PARTICIPANTE", value: "PARTICIPANTE" },
  { label: "INVITADO", value: "INVITADO" },
];

/**
 * Tipos de notificacion
 * Schema: enum TipoNotificacion
 */
export const TIPO_NOTIFICACION_OPTIONS = [
  { label: "INVITACION A VIDEOCONFERENCIA", value: "VIDEOCONFERENCIA_INVITACION" },
  { label: "RECORDATORIO 24 HORAS", value: "VIDEOCONFERENCIA_RECORDATORIO_24H" },
  { label: "RECORDATORIO 1 HORA", value: "VIDEOCONFERENCIA_RECORDATORIO_1H" },
];

// ════════════════════════════════════════════════════════════════════════════
// MODULO: CONTABILIDAD - PLAN DE CUENTAS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Niveles de cuenta contable segun PCGE
 * Schema: enum NivelCuentaContable
 */
export const NIVEL_CUENTA_CONTABLE_OPTIONS = [
  { label: "CLASE (NIVEL 1)", value: "CLASE" },
  { label: "CUENTA (NIVEL 2)", value: "CUENTA" },
  { label: "SUBCUENTA (NIVEL 3)", value: "SUBCUENTA" },
  { label: "DIVISIONARIA (NIVEL 4)", value: "DIVISIONARIA" },
  { label: "SUBDIVISIONARIA (NIVEL 5)", value: "SUBDIVISIONARIA" },
];

/**
 * Naturaleza de la cuenta contable
 * Schema: enum NaturalezaCuenta
 */
export const NATURALEZA_CUENTA_OPTIONS = [
  { label: "DEUDORA (AUMENTA CON DEBE)", value: "DEUDORA" },
  { label: "ACREEDORA (AUMENTA CON HABER)", value: "ACREEDORA" },
];

/**
 * Tipo de cuenta contable segun clasificacion financiera
 * Schema: enum TipoCuentaContable
 */
export const TIPO_CUENTA_CONTABLE_OPTIONS = [
  { label: "ACTIVO", value: "ACTIVO" },
  { label: "PASIVO", value: "PASIVO" },
  { label: "PATRIMONIO", value: "PATRIMONIO" },
  { label: "INGRESO", value: "INGRESO" },
  { label: "GASTO", value: "GASTO" },
];

// ════════════════════════════════════════════════════════════════════════════
// MODULO: CONTABILIDAD - ASIENTOS CONTABLES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tipo de libro contable
 * Schema: enum TipoLibroContable
 */
export const TIPO_LIBRO_CONTABLE_OPTIONS = [
  { label: "FISCAL (SUNAT)", value: "FISCAL" },
  { label: "GERENCIAL (INTERNO)", value: "GERENCIAL" },
];

/**
 * Origen del asiento contable
 * Schema: enum OrigenAsiento
 */
export const ORIGEN_ASIENTO_OPTIONS = [
  { label: "MANUAL", value: "MANUAL" },
  { label: "AUTOMATICO", value: "AUTOMATICO" },
];

// ════════════════════════════════════════════════════════════════════════════
// MODULO: TESORERIA - LETRAS DE CAMBIO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tipos de endoso de letra de cambio
 * Schema: enum TipoEndosoLetra
 */
export const TIPO_ENDOSO_LETRA_OPTIONS = [
  { label: "PLENO (EN PROPIEDAD)", value: "PLENO" },
  { label: "PROCURACION (PARA COBRANZA)", value: "PROCURACION" },
  { label: "GARANTIA", value: "GARANTIA" },
];

// ════════════════════════════════════════════════════════════════════════════
// MODULO: TESORERIA - GESTION FINANCIERA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Frecuencia de pago
 * Schema: enum FrecuenciaPago
 * IMPORTANTE: Usado en TipoDeudaPersonal y TipoDeudaTributaria
 */
export const FRECUENCIA_PAGO_OPTIONS = [
  { label: "DIARIO", value: "DIAS" },
  { label: "MENSUAL", value: "MENSUAL" },
  { label: "BIMESTRAL", value: "BIMESTRAL" },
  { label: "TRIMESTRAL", value: "TRIMESTRAL" },
  { label: "CUATRIMESTRAL", value: "CUATRIMESTRAL" },
  { label: "SEMESTRAL", value: "SEMESTRAL" },
  { label: "ANUAL", value: "ANUAL" },
];

/**
 * Tipo de amortizacion de prestamos
 * Schema: enum TipoAmortizacion
 */
export const TIPO_AMORTIZACION_OPTIONS = [
  { label: "FRANCES (CUOTAS FIJAS)", value: "FRANCES" },
  { label: "ALEMAN (AMORTIZACION CONSTANTE)", value: "ALEMAN" },
  { label: "AMERICANO (SOLO INTERESES)", value: "AMERICANO" },
];

/**
 * Tipo de garantia
 * Schema: enum TipoGarantia
 */
export const TIPO_GARANTIA_OPTIONS = [
  { label: "HIPOTECARIA", value: "HIPOTECARIA" },
  { label: "PRENDARIA", value: "PRENDARIA" },
  { label: "FIANZA", value: "FIANZA" },
  { label: "SIN GARANTIA", value: "SIN_GARANTIA" },
];

/**
 * Estado de pago de cuota
 * Schema: enum EstadoPagoCuota
 */
export const ESTADO_PAGO_CUOTA_OPTIONS = [
  { label: "PENDIENTE", value: "PENDIENTE" },
  { label: "PAGADO", value: "PAGADO" },
  { label: "VENCIDO", value: "VENCIDO" },
  { label: "PARCIAL", value: "PARCIAL" },
];

/**
 * Tipo de linea de credito
 * Schema: enum TipoLineaCredito
 */
export const TIPO_LINEA_CREDITO_OPTIONS = [
  { label: "REVOLVENTE", value: "REVOLVENTE" },
  { label: "CARTA DE CREDITO", value: "CARTA_CREDITO" },
  { label: "GARANTIA BANCARIA", value: "GARANTIA_BANCARIA" },
  { label: "SOBREGIRO", value: "SOBREGIRO" },
];

/**
 * Tipo de inversion
 * Schema: enum TipoInversion
 */
export const TIPO_INVERSION_OPTIONS = [
  { label: "PLAZO FIJO", value: "PLAZO_FIJO" },
  { label: "FONDO MUTUO", value: "FONDO_MUTUO" },
  { label: "BONOS", value: "BONOS" },
  { label: "ACCIONES", value: "ACCIONES" },
  { label: "CTS", value: "CTS" },
];

/**
 * Tipo de movimiento de inversion
 * Schema: enum TipoMovimientoInversion
 */
export const TIPO_MOVIMIENTO_INVERSION_OPTIONS = [
  { label: "INVERSION", value: "INVERSION" },
  { label: "RENDIMIENTO", value: "RENDIMIENTO" },
  { label: "RETIRO", value: "RETIRO" },
  { label: "RENOVACION", value: "RENOVACION" },
  { label: "LIQUIDACION", value: "LIQUIDACION" },
];

/**
 * Tipo de tasa de interes
 * Schema: enum TipoTasa
 */
export const TIPO_TASA_OPTIONS = [
  { label: "EFECTIVA ANUAL (TEA)", value: "EFECTIVA_ANUAL" },
  { label: "NOMINAL ANUAL (TNA)", value: "NOMINAL_ANUAL" },
  { label: "EFECTIVA MENSUAL (TEM)", value: "EFECTIVA_MENSUAL" },
  { label: "NOMINAL MENSUAL (TNM)", value: "NOMINAL_MENSUAL" },
  { label: "EFECTIVA DIARIA (TED)", value: "EFECTIVA_DIARIA" },
];

/**
 * Periodicidad de rendimiento
 * Schema: enum PeriodicidadRendimiento
 */
export const PERIODICIDAD_RENDIMIENTO_OPTIONS = [
  { label: "AL VENCIMIENTO", value: "VENCIMIENTO" },
  { label: "DIARIA", value: "DIARIA" },
  { label: "SEMANAL", value: "SEMANAL" },
  { label: "QUINCENAL", value: "QUINCENAL" },
  { label: "MENSUAL", value: "MENSUAL" },
  { label: "BIMESTRAL", value: "BIMESTRAL" },
  { label: "TRIMESTRAL", value: "TRIMESTRAL" },
  { label: "SEMESTRAL", value: "SEMESTRAL" },
  { label: "ANUAL", value: "ANUAL" },
];


/**
 * Tipo de garantia real
 * Schema: enum TipoGarantiaReal
 */
export const TIPO_GARANTIA_REAL_OPTIONS = [
  { label: "INMUEBLE", value: "INMUEBLE" },
  { label: "VEHICULO", value: "VEHICULO" },
  { label: "MAQUINARIA", value: "MAQUINARIA" },
  { label: "INVENTARIO", value: "INVENTARIO" },
  { label: "CUENTAS POR COBRAR", value: "CUENTAS_POR_COBRAR" },
  { label: "VALORES", value: "VALORES" },
  { label: "OTROS", value: "OTROS" },
];

/**
 * Estado de garantia
 * Schema: enum EstadoGarantia
 */
export const ESTADO_GARANTIA_OPTIONS = [
  { label: "VIGENTE", value: "VIGENTE" },
  { label: "LIBERADA", value: "LIBERADA" },
  { label: "EJECUTADA", value: "EJECUTADA" },
  { label: "VENCIDA", value: "VENCIDA" },
  { label: "RENOVADA", value: "RENOVADA" },
];

/**
 * Tipo de cobro
 * Schema: enum TipoCobro
 */
export const TIPO_COBRO_OPTIONS = [
  { label: "CUOTA NORMAL", value: "CUOTA_NORMAL" },
  { label: "PREPAGO PARCIAL", value: "PREPAGO_PARCIAL" },
  { label: "PREPAGO TOTAL", value: "PREPAGO_TOTAL" },
  { label: "MORA", value: "MORA" },
  { label: "COMISION", value: "COMISION" },
  { label: "SEGURO", value: "SEGURO" },
];

/**
 * Metodo de pago
 * Schema: enum MetodoPago
 */
export const METODO_PAGO_OPTIONS = [
  { label: "EFECTIVO", value: "EFECTIVO" },
  { label: "TRANSFERENCIA", value: "TRANSFERENCIA" },
  { label: "CHEQUE", value: "CHEQUE" },
  { label: "DEPOSITO", value: "DEPOSITO" },
  { label: "TARJETA DE CREDITO", value: "TARJETA_CREDITO" },
  { label: "TARJETA DE DEBITO", value: "TARJETA_DEBITO" },
];



/**
 * Tipo de renovacion
 * Schema: enum TipoRenovacion
 */
export const TIPO_RENOVACION_OPTIONS = [
  { label: "AUTOMATICA", value: "AUTOMATICA" },
  { label: "MANUAL", value: "MANUAL" },
  { label: "SIN RENOVACION", value: "SIN_RENOVACION" },
];

// ════════════════════════════════════════════════════════════════════════════
// HELPERS PARA OBTENER LABELS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Funcion helper generica para obtener el label de un valor de enum
 * @param {Array} options - Array de opciones del enum
 * @param {string} value - Valor a buscar
 * @returns {string} Label correspondiente o el valor original si no se encuentra
 */
export const getEnumLabel = (options, value) => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

/**
 * Funcion helper para obtener el label de frecuencia de pago
 * @param {string} value - Valor del enum FrecuenciaPago
 * @returns {string} Label correspondiente
 */
export const getFrecuenciaPagoLabel = (value) => {
  return getEnumLabel(FRECUENCIA_PAGO_OPTIONS, value);
};

/**
 * Funcion helper para obtener el label de tipo de cuenta contable
 * @param {string} value - Valor del enum TipoCuentaContable
 * @returns {string} Label correspondiente
 */
export const getTipoCuentaContableLabel = (value) => {
  return getEnumLabel(TIPO_CUENTA_CONTABLE_OPTIONS, value);
};

/**
 * Funcion helper para obtener el label de naturaleza de cuenta
 * @param {string} value - Valor del enum NaturalezaCuenta
 * @returns {string} Label correspondiente
 */
export const getNaturalezaCuentaLabel = (value) => {
  return getEnumLabel(NATURALEZA_CUENTA_OPTIONS, value);
};


// ════════════════════════════════════════════════════════════════════════════
// NOTA IMPORTANTE: CONSTANTES DE TESORERÍA
// ════════════════════════════════════════════════════════════════════════════
/**
 * Las constantes de Tesorería han sido movidas a un archivo dedicado para
 * mantener UNA SOLA FUENTE DE VERDAD compartida entre frontend y backend.
 * 
 * ⚠️ PROHIBIDO: Hardcodear valores de tesorería en cualquier archivo.
 * ✅ OBLIGATORIO: Importar siempre desde el archivo de constantes.
 * 
 * UBICACIÓN DE LA FUENTE DE VERDAD:
 * - Frontend: src/utils/tesoreria.constants.js
 * - Backend:  src/utils/tesoreria.constants.js
 * 
 * EJEMPLO DE IMPORTACIÓN:
 * ```javascript
 * import {
 *   TIPO_FILTRO_TESORERIA,
 *   TIPO_DEUDA_TESORERIA,
 *   TIPO_VENCIMIENTO_TESORERIA,
 *   TIPO_OPERACION_TESORERIA,
 *   ORIGEN_DOCUMENTO_TESORERIA,
 *   TIPO_ENTREGA_TESORERIA,
 *   LABELS_TIPO_FILTRO,
 *   LABELS_TIPO_DEUDA,
 *   LABELS_TIPO_ENTREGA,
 *   LABELS_TIPO_VENCIMIENTO,
 *   LABELS_TIPO_OPERACION,
 * } from '../utils/tesoreria.constants';
 * ```
 * 
 * CONSTANTES DISPONIBLES:
 * - TIPO_FILTRO_TESORERIA: Filtros principales (TODOS, COBRAR, PAGAR)
 * - TIPO_DEUDA_TESORERIA: Filtros de deudas (NINGUNO, DEUDAS_PERSONAL, DEUDAS_TRIBUTARIAS)
 * - TIPO_VENCIMIENTO_TESORERIA: Filtros de vencimiento (TODOS, VENCIDOS, HOY, SEMANA)
 * - TIPO_ENTREGA_TESORERIA: Tipos de entregas (ASIGNACIONES, GASTOS_DIRECTOS)
 * - TIPO_OPERACION_TESORERIA: Operaciones especiales (TRANSFERENCIA_INTERNA, etc.)
 * - ORIGEN_DOCUMENTO_TESORERIA: Orígenes de documentos (CUENTAS_POR_COBRAR, etc.)
 * - LABELS_TIPO_FILTRO: Labels y configuración UI para filtros
 * - LABELS_TIPO_DEUDA: Labels y configuración UI para deudas
 * - LABELS_TIPO_ENTREGA: Labels y configuración UI para entregas
 * - LABELS_TIPO_VENCIMIENTO: Labels y configuración UI para vencimiento
 * - LABELS_TIPO_OPERACION: Labels y configuración UI para operaciones
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */