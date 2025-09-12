// src/utils/gpsUtils.js
// Utilidades genéricas para manejo de GPS y coordenadas
// Extraído de DetalleCalasForm.jsx para reutilización en múltiples componentes
// ERP Megui - Sistema de coordenadas GPS

/**
 * Opciones por defecto para la captura de GPS
 */
export const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

/**
 * Convierte coordenadas decimales a formato DMS (Grados, Minutos, Segundos)
 * @param {number} decimal - Coordenada en formato decimal
 * @param {boolean} isLatitude - true para latitud, false para longitud
 * @returns {string} Coordenada en formato DMS
 */
export const convertirDecimalADMS = (decimal, isLatitude = true) => {
  if (!decimal || decimal === 0) return "0° 0' 0.00\"";
  
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  
  let dir;
  if (isLatitude) {
    dir = decimal >= 0 ? "N" : "S";
  } else {
    dir = decimal >= 0 ? "E" : "O";
  }
  
  return `${deg}° ${min}' ${sec.toFixed(2)}" ${dir}`;
};

/**
 * Obtiene la posición GPS actual del dispositivo
 * @param {Object} options - Opciones para la geolocalización
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const obtenerPosicionGPS = (options = GPS_OPTIONS) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS no disponible en este dispositivo"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({ latitude, longitude, accuracy });
      },
      (error) => {
        let message = "Error desconocido";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permiso GPS denegado. Active la ubicación.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Señal GPS no disponible.";
            break;
          case error.TIMEOUT:
            message = "Timeout GPS. Intente nuevamente.";
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
};

/**
 * Maneja la captura de GPS con callbacks para éxito y error
 * @param {Function} onSuccess - Callback para éxito (latitude, longitude, accuracy)
 * @param {Function} onError - Callback para error (message)
 * @param {Object} options - Opciones para la geolocalización
 */
export const capturarGPS = async (onSuccess, onError, options = GPS_OPTIONS) => {
  try {
    const { latitude, longitude, accuracy } = await obtenerPosicionGPS(options);
    
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(latitude, longitude, accuracy);
    }
    
    return { latitude, longitude, accuracy };
  } catch (error) {
    if (onError && typeof onError === 'function') {
      onError(error.message);
    }
    throw error;
  }
};

/**
 * Formatea coordenadas para mostrar en la UI
 * @param {number} latitud - Latitud en formato decimal
 * @param {number} longitud - Longitud en formato decimal
 * @param {number} decimales - Número de decimales a mostrar (default: 8)
 * @returns {Object} Objeto con coordenadas formateadas
 */
export const formatearCoordenadas = (latitud, longitud, decimales = 8) => {
  const latitudFormateada = latitud ? parseFloat(latitud).toFixed(decimales) : "0.00000000";
  const longitudFormateada = longitud ? parseFloat(longitud).toFixed(decimales) : "0.00000000";
  
  return {
    latitud: latitudFormateada,
    longitud: longitudFormateada,
    latitudDMS: convertirDecimalADMS(latitud, true),
    longitudDMS: convertirDecimalADMS(longitud, false),
  };
};

/**
 * Valida si las coordenadas están en rangos válidos
 * @param {number} latitud - Latitud a validar
 * @param {number} longitud - Longitud a validar
 * @returns {Object} Objeto con resultado de validación
 */
export const validarCoordenadas = (latitud, longitud) => {
  const errors = [];
  
  if (latitud < -90 || latitud > 90) {
    errors.push("La latitud debe estar entre -90 y 90 grados");
  }
  
  if (longitud < -180 || longitud > 180) {
    errors.push("La longitud debe estar entre -180 y 180 grados");
  }
  
  return {
    esValido: errors.length === 0,
    errores: errors,
  };
};

/**
 * Componente de input para coordenadas GPS reutilizable
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} Componente de coordenadas
 */
export const crearInputCoordenadas = ({
  latitud,
  longitud,
  onLatitudChange,
  onLongitudChange,
  disabled = false,
  mostrarDMS = true,
}) => {
  const coordenadas = formatearCoordenadas(latitud, longitud);
  
  return {
    inputLatitud: {
      type: "number",
      value: latitud || "",
      onChange: (e) => onLatitudChange && onLatitudChange(parseFloat(e.target.value) || 0),
      disabled,
      step: "0.000001",
      placeholder: "Ej: -12.345678",
      style: {
        width: "100%",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "14px",
      },
    },
    inputLongitud: {
      type: "number",
      value: longitud || "",
      onChange: (e) => onLongitudChange && onLongitudChange(parseFloat(e.target.value) || 0),
      disabled,
      step: "0.000001",
      placeholder: "Ej: -77.123456",
      style: {
        width: "100%",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "14px",
      },
    },
    formatoDMS: mostrarDMS ? coordenadas : null,
  };
};
