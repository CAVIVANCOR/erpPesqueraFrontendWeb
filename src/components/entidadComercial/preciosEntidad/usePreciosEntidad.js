/**
 * usePreciosEntidad.js
 * 
 * Custom Hook para gestionar la lógica de negocio de precios especiales.
 * Maneja estado, carga de datos, CRUD y productos/monedas.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import {
  obtenerPreciosPorEntidad,
  crearPrecioEntidad,
  actualizarPrecioEntidad,
  eliminarPrecioEntidad,
} from "../../../api/precioEntidad";
import { getProductosPorEntidadYEmpresa } from "../../../api/producto";

export const usePreciosEntidad = (entidadComercialId, empresaId, monedas, toast) => {
  const usuario = useAuthStore((state) => state.usuario);
  
  // Estados
  const [preciosData, setPreciosData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Opciones normalizadas para dropdowns
  const productosOptions = productos.map((p) => ({
    label: p.descripcionArmada || p.descripcionBase || p.codigo || "",
    value: Number(p.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    label: `${m.simbolo} - ${m.codigoSunat}`,
    value: Number(m.id),
  }));

  /**
   * Carga productos por entidad y empresa
   */
  const cargarProductos = useCallback(async () => {
    if (!entidadComercialId || !empresaId) return;

    try {
      setLoadingProductos(true);
      const productosData = await getProductosPorEntidadYEmpresa(
        entidadComercialId,
        empresaId
      );
      setProductos(productosData || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar productos",
        life: 3000,
      });
      setProductos([]);
    } finally {
      setLoadingProductos(false);
    }
  }, [entidadComercialId, empresaId, toast]);

  /**
   * Carga precios especiales desde la API
   */
  const cargarPrecios = useCallback(async () => {
    if (!entidadComercialId) return;

    try {
      setLoading(true);
      const response = await obtenerPreciosPorEntidad(entidadComercialId);

      // Validar estructura de respuesta
      if (!response) {
        setPreciosData([]);
        toast.current?.show({
          severity: "warn",
          summary: "Sin Precios Especiales",
          detail: "No se encontraron precios especiales para esta entidad",
          life: 3000,
        });
        return;
      }

      // Validar que sea un array
      if (!Array.isArray(response)) {
        setPreciosData([]);
        toast.current?.show({
          severity: "error",
          summary: "Error de Datos",
          detail: "Formato de respuesta inesperado del servidor",
          life: 4000,
        });
        return;
      }

      setPreciosData(response);
    } catch (error) {
      console.error("Error al cargar precios especiales:", error);
      setPreciosData([]);
      toast.current?.show({
        severity: "error",
        summary: "Error al Cargar",
        detail:
          error.response?.data?.message ||
          "Error al cargar los precios especiales desde el servidor",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [entidadComercialId, toast]);

  /**
   * Crea un nuevo precio especial
   */
  const crear = async (data) => {
    try {
      setLoading(true);

      const precioNormalizado = {
        entidadComercialId: Number(entidadComercialId),
        productoId: Number(data.productoId),
        monedaId: Number(data.monedaId),
        precioUnitario: Number(data.precioUnitario),
        vigenteDesde: data.vigenteDesde,
        vigenteHasta: data.vigenteHasta || null,
        observaciones: data.observaciones?.trim().toUpperCase() || null,
        activo: Boolean(data.activo),
        fechaCreacion: new Date(),
        creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
        fechaActualizacion: new Date(),
        actualizadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      };

      await crearPrecioEntidad(precioNormalizado);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Precio creado correctamente",
        life: 3000,
      });

      await cargarPrecios();
      return true;
    } catch (error) {
      console.error("Error al crear precio:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al crear el precio",
        life: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza un precio especial existente
   */
  const actualizar = async (id, data, precioOriginal) => {
    try {
      setLoading(true);

      const precioNormalizado = {
        entidadComercialId: Number(entidadComercialId),
        productoId: Number(data.productoId),
        monedaId: Number(data.monedaId),
        precioUnitario: Number(data.precioUnitario),
        vigenteDesde: data.vigenteDesde,
        vigenteHasta: data.vigenteHasta || null,
        observaciones: data.observaciones?.trim().toUpperCase() || null,
        activo: Boolean(data.activo),
        fechaCreacion: precioOriginal.fechaCreacion || new Date(),
        creadoPor:
          precioOriginal.creadoPor ||
          (usuario?.personalId ? Number(usuario.personalId) : null),
        fechaActualizacion: new Date(),
        actualizadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      };

      await actualizarPrecioEntidad(id, precioNormalizado);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Precio actualizado correctamente",
        life: 3000,
      });

      await cargarPrecios();
      return true;
    } catch (error) {
      console.error("Error al actualizar precio:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar el precio",
        life: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina un precio especial
   */
  const eliminar = async (id) => {
    try {
      setLoading(true);
      await eliminarPrecioEntidad(id);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Precio eliminado correctamente",
        life: 3000,
      });

      await cargarPrecios();
      return true;
    } catch (error) {
      console.error("Error al eliminar precio:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar el precio",
        life: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarProductos();
    cargarPrecios();
  }, [cargarProductos, cargarPrecios]);

  return {
    preciosData,
    loading,
    productos,
    productosOptions,
    monedasOptions,
    loadingProductos,
    crear,
    actualizar,
    eliminar,
    recargar: cargarPrecios,
  };
};