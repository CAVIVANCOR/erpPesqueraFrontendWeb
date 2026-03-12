/**
 * useDescargasTemporada.js
 * Hook personalizado para gestionar las descargas de una temporada de pesca
 * Incluye carga, actualización individual y actualización masiva de precios
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getDescargasPorTemporada,
  actualizarDescargaFaenaPesca,
} from "../../../../api/descargaFaenaPesca";

export const useDescargasTemporada = (temporadaId, empresaId, clientes = [], toast) => {
  const [descargasData, setDescargasData] = useState([]);
  const [loadingDescargas, setLoadingDescargas] = useState(false);
  const [actualizandoPrecios, setActualizandoPrecios] = useState(false);

  // Cargar descargas cuando cambia el ID de la temporada
  const cargarDescargas = useCallback(async () => {
    if (!temporadaId) {
      setDescargasData([]);
      return;
    }

    try {
      setLoadingDescargas(true);
      const response = await getDescargasPorTemporada(temporadaId);
      setDescargasData(response || []);
    } catch (error) {
      console.error("Error al cargar descargas:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar descargas de la temporada",
        life: 4000,
      });
      setDescargasData([]);
    } finally {
      setLoadingDescargas(false);
    }
  }, [temporadaId, toast]);

  // Efecto para cargar descargas automáticamente
  useEffect(() => {
    cargarDescargas();
  }, [cargarDescargas]);

  // Actualizar una descarga individual
  const actualizarDescarga = useCallback(
    async (descargaId, dataActualizar) => {
      try {
        await actualizarDescargaFaenaPesca(descargaId, dataActualizar);

        // Actualizar estado local
        setDescargasData((prev) =>
          prev.map((d) =>
            d.id === descargaId ? { ...d, ...dataActualizar } : d
          )
        );

        toast?.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Descarga actualizada correctamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al actualizar descarga:", error);
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar la descarga",
          life: 4000,
        });
      }
    },
    [toast]
  );

  // Actualizar precios de TODAS las descargas desde sus clientes
  const actualizarTodosPrecios = useCallback(async () => {
    if (!descargasData || descargasData.length === 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Sin Descargas",
        detail: "No hay descargas para actualizar",
        life: 3000,
      });
      return;
    }

    setActualizandoPrecios(true);
    try {
      let actualizadas = 0;
      let sinCliente = 0;
      let sinPrecio = 0;
      let errores = 0;

      for (const descarga of descargasData) {
        if (!descarga.clienteId) {
          sinCliente++;
          continue;
        }

        const clienteSeleccionado = clientes.find(
          (c) => Number(c.value) === Number(descarga.clienteId)
        );

        if (!clienteSeleccionado) {
          sinCliente++;
          continue;
        }

        if (!clienteSeleccionado.precioPorTonComisionFidelizacion) {
          sinPrecio++;
          continue;
        }

        try {
          const dataActualizar = {
            clienteId: descarga.clienteId,
            precioPorTonComisionFidelizacion: Number(
              clienteSeleccionado.precioPorTonComisionFidelizacion
            ),
          };

          await actualizarDescargaFaenaPesca(descarga.id, dataActualizar);

          setDescargasData((prev) =>
            prev.map((d) =>
              d.id === descarga.id ? { ...d, ...dataActualizar } : d
            )
          );

          actualizadas++;
        } catch (error) {
          console.error(`Error al actualizar descarga ${descarga.id}:`, error);
          errores++;
        }
      }

      const mensajes = [];
      if (actualizadas > 0) mensajes.push(`${actualizadas} actualizadas`);
      if (sinCliente > 0) mensajes.push(`${sinCliente} sin cliente`);
      if (sinPrecio > 0) mensajes.push(`${sinPrecio} sin precio configurado`);
      if (errores > 0) mensajes.push(`${errores} con errores`);

      toast?.current?.show({
        severity: actualizadas > 0 ? "success" : "warn",
        summary: "Actualización Masiva Completada",
        detail: mensajes.join(", "),
        life: 5000,
      });
    } catch (error) {
      console.error("Error en actualización masiva:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al actualizar precios masivamente",
        life: 4000,
      });
    } finally {
      setActualizandoPrecios(false);
    }
  }, [descargasData, clientes, toast]);

  return {
    descargasData,
    loadingDescargas,
    actualizandoPrecios,
    cargarDescargas,
    actualizarDescarga,
    actualizarTodosPrecios,
  };
};