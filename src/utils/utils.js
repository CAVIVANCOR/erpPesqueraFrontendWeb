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