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