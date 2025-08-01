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