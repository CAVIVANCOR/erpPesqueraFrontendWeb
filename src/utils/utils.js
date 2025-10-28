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
 * @returns {string} Número formateado con 2 decimales, comas para miles y apóstrofes para millones
 */
export const formatearNumero = (numero) => {
    const num = Number(numero);
    if (isNaN(num)) return "";
    
    const partes = num.toFixed(2).split(".");
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