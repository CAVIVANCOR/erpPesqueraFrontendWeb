/**
 * useComisionesFidelizacion.js
 * Hook personalizado para gestionar las comisiones de fidelización
 * Incluye generación y carga de comisiones
 */

import { useState, useEffect, useCallback } from "react";
import {
  generarComisionesFidelizacion,
  getComisionesPorTemporada,
} from "../../../../api/comisionFidelizacion";

export const useComisionesFidelizacion = (temporadaId, descargasData = [], toast) => {
  const [comisionesGeneradas, setComisionesGeneradas] = useState([]);
  const [generandoComisiones, setGenerandoComisiones] = useState(false);
  const [loadingComisionesGeneradas, setLoadingComisionesGeneradas] = useState(false);

  // Cargar comisiones generadas cuando cambia el ID de la temporada
  const cargarComisiones = useCallback(async () => {
    if (!temporadaId) {
      setComisionesGeneradas([]);
      return;
    }

    setLoadingComisionesGeneradas(true);
    try {
      const comisiones = await getComisionesPorTemporada(temporadaId);
      setComisionesGeneradas(comisiones || []);
    } catch (error) {
      console.error("Error al cargar comisiones generadas:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar comisiones generadas",
        life: 3000,
      });
      setComisionesGeneradas([]);
    } finally {
      setLoadingComisionesGeneradas(false);
    }
  }, [temporadaId, toast]);

  // Efecto para cargar comisiones automáticamente
  useEffect(() => {
    cargarComisiones();
  }, [cargarComisiones]);

  // Generar comisiones de fidelización
  const generarComisiones = useCallback(async () => {
    if (!temporadaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de generar comisiones",
        life: 3000,
      });
      return;
    }

    if (!descargasData || descargasData.length === 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay descargas en esta temporada para generar comisiones",
        life: 3000,
      });
      return;
    }

    setGenerandoComisiones(true);
    try {
      const resultado = await generarComisionesFidelizacion(temporadaId);

      const detalles = [];
      if (resultado.comisionesEliminadas > 0) {
        detalles.push(`${resultado.comisionesEliminadas} comisión(es) eliminada(s)`);
      }
      if (resultado.comisionesGeneradas > 0) {
        detalles.push(`${resultado.comisionesGeneradas} comisión(es) generada(s)`);
      }
      if (
        resultado.clientesSinConfiguracion &&
        resultado.clientesSinConfiguracion.length > 0
      ) {
        detalles.push(
          `${resultado.clientesSinConfiguracion.length} cliente(s) sin configuración`
        );
      }
      if (resultado.descargasSinPrecio > 0) {
        detalles.push(`${resultado.descargasSinPrecio} descarga(s) sin precio`);
      }

      toast?.current?.show({
        severity: "success",
        summary: "Comisiones Generadas",
        detail: detalles.join(", "),
        life: 5000,
      });

      if (
        resultado.clientesSinConfiguracion &&
        resultado.clientesSinConfiguracion.length > 0
      ) {
        setTimeout(() => {
          toast?.current?.show({
            severity: "warn",
            summary: "Clientes sin Configuración",
            detail: `Los siguientes clientes no tienen personal configurado: ${resultado.clientesSinConfiguracion.join(", ")}`,
            life: 8000,
          });
        }, 1000);
      }

      // Recargar comisiones generadas
      await cargarComisiones();
    } catch (error) {
      console.error("Error al generar comisiones:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al generar comisiones de fidelización",
        life: 5000,
      });
    } finally {
      setGenerandoComisiones(false);
    }
  }, [temporadaId, descargasData, toast, cargarComisiones]);

  return {
    comisionesGeneradas,
    generandoComisiones,
    loadingComisionesGeneradas,
    generarComisiones,
    cargarComisiones,
  };
};