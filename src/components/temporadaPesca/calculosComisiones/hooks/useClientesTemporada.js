/**
 * useClientesTemporada.js
 * Hook personalizado para gestionar clientes y entidades comerciales
 */

import { useState, useEffect, useCallback } from "react";
import {
  getClientesPorEmpresa,
  getEntidadesComerciales,
} from "../../../../api/entidadComercial";

export const useClientesTemporada = (empresaId) => {
  const [clientes, setClientes] = useState([]);
  const [entidades, setEntidades] = useState([]);

  // Cargar clientes filtrados por empresa
  const cargarClientes = useCallback(async () => {
    if (!empresaId) {
      setClientes([]);
      return;
    }

    try {
      const clientesData = await getClientesPorEmpresa(empresaId);
      setClientes(clientesData || []);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setClientes([]);
    }
  }, [empresaId]);

  // Cargar entidades comerciales
  const cargarEntidades = useCallback(async () => {
    try {
      const entidadesData = await getEntidadesComerciales();
      setEntidades(
        entidadesData.map((e) => ({
          ...e,
          label: e.razonSocial || e.nombreComercial,
          value: Number(e.id),
        }))
      );
    } catch (error) {
      console.error("Error al cargar entidades comerciales:", error);
      setEntidades([]);
    }
  }, []);

  // Efecto para cargar clientes cuando cambia la empresa
  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Efecto para cargar entidades al montar
  useEffect(() => {
    cargarEntidades();
  }, [cargarEntidades]);

  return {
    clientes,
    entidades,
    cargarClientes,
    cargarEntidades,
  };
};