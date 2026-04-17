/**
 * usePlataformasRecepcion.js
 * 
 * Custom Hook para gestionar la lógica de negocio de plataformas de recepción.
 * Maneja estado, carga de datos, CRUD y puertos de pesca.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import {
  obtenerPlataformasPorEntidad,
  crearPlataformaRecepcion,
  actualizarPlataformaRecepcion,
  eliminarPlataformaRecepcion,
} from "../../../api/detPlataformaRecepcionPesca";
import { getPuertosActivos } from "../../../api/puertoPesca";

export const usePlataformasRecepcion = (entidadComercialId, toast) => {
  const usuario = useAuthStore((state) => state.usuario);
  
  // Estados
  const [plataformasData, setPlataformasData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [puertos, setPuertos] = useState([]);
  const [loadingPuertos, setLoadingPuertos] = useState(false);

  // Opciones normalizadas para dropdowns
  const puertosOptions = puertos.map((p) => ({
    label: p.nombre || "",
    value: Number(p.id),
  }));

  /**
   * Carga puertos de pesca activos
   */
  const cargarPuertos = useCallback(async () => {
    try {
      setLoadingPuertos(true);
      const puertosData = await getPuertosActivos();
      setPuertos(puertosData || []);
    } catch (error) {
      console.error("Error al cargar puertos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar puertos de pesca",
        life: 3000,
      });
      setPuertos([]);
    } finally {
      setLoadingPuertos(false);
    }
  }, [toast]);

  /**
   * Carga plataformas de recepción desde la API
   */
  const cargarPlataformas = useCallback(async () => {
    if (!entidadComercialId) return;

    try {
      setLoading(true);
      const response = await obtenerPlataformasPorEntidad(entidadComercialId);

      // Validar estructura de respuesta
      if (!response) {
        setPlataformasData([]);
        toast.current?.show({
          severity: "warn",
          summary: "Sin Plataformas",
          detail: "No se encontraron plataformas de recepción para esta entidad",
          life: 3000,
        });
        return;
      }

      // Validar que sea un array
      if (!Array.isArray(response)) {
        setPlataformasData([]);
        toast.current?.show({
          severity: "error",
          summary: "Error de Datos",
          detail: "Formato de respuesta inesperado del servidor",
          life: 4000,
        });
        return;
      }

      setPlataformasData(response);
    } catch (error) {
      console.error("Error al cargar plataformas de recepción:", error);
      setPlataformasData([]);
      toast.current?.show({
        severity: "error",
        summary: "Error al Cargar",
        detail:
          error.response?.data?.message ||
          "Error al cargar las plataformas de recepción desde el servidor",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [entidadComercialId, toast]);

  /**
   * Crea una nueva plataforma de recepción
   */
  const crear = async (data) => {
    try {
      setLoading(true);

      const plataformaNormalizada = {
        entidadComercialId: Number(entidadComercialId),
        puertoPescaId: Number(data.puertoPescaId),
        nombre: data.nombre?.trim().toUpperCase() || "",
        latitud: data.latitud ? Number(data.latitud) : null,
        longitud: data.longitud ? Number(data.longitud) : null,
        activo: Boolean(data.activo),
      };

      await crearPlataformaRecepcion(plataformaNormalizada);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Plataforma de recepción creada correctamente",
        life: 3000,
      });

      await cargarPlataformas();
      return true;
    } catch (error) {
      console.error("Error al crear plataforma:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al crear la plataforma de recepción",
        life: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza una plataforma de recepción existente
   */
  const actualizar = async (id, data, plataformaOriginal) => {
    try {
      setLoading(true);

      const plataformaNormalizada = {
        entidadComercialId: Number(entidadComercialId),
        puertoPescaId: Number(data.puertoPescaId),
        nombre: data.nombre?.trim().toUpperCase() || "",
        latitud: data.latitud ? Number(data.latitud) : null,
        longitud: data.longitud ? Number(data.longitud) : null,
        activo: Boolean(data.activo),
      };

      await actualizarPlataformaRecepcion(id, plataformaNormalizada);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Plataforma de recepción actualizada correctamente",
        life: 3000,
      });

      await cargarPlataformas();
      return true;
    } catch (error) {
      console.error("Error al actualizar plataforma:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar la plataforma de recepción",
        life: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una plataforma de recepción
   */
  const eliminar = async (id) => {
    try {
      setLoading(true);
      await eliminarPlataformaRecepcion(id);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Plataforma de recepción eliminada correctamente",
        life: 3000,
      });

      await cargarPlataformas();
      return true;
    } catch (error) {
      console.error("Error al eliminar plataforma:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar la plataforma de recepción",
        life: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarPuertos();
    cargarPlataformas();
  }, [cargarPuertos, cargarPlataformas]);

  return {
    plataformasData,
    loading,
    puertos,
    puertosOptions,
    loadingPuertos,
    crear,
    actualizar,
    eliminar,
    recargar: cargarPlataformas,
  };
};