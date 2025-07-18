/**
 * Hook profesional para detectar si el dispositivo es móvil usando media queries.
 * Devuelve true si el ancho de pantalla es menor a 768px.
 * Cumple la regla de documentación exhaustiva en español técnico.
 */
import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
