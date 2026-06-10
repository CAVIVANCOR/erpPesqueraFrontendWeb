/**
 * Hook personalizado para cargar datos necesarios en GenerarKardexDialog
 * Carga: almacenes, conceptos, estados de mercadería, estados de calidad, direcciones
 */

import { useState, useEffect } from "react";
import { getAlmacenes } from "../../../api/almacen";
import { getConceptosMovAlmacen } from "../../../api/conceptoMovAlmacen";
import { getEstadosMultiFuncion } from "../../../api/estadoMultiFuncion";
import { obtenerDireccionesPorEntidad } from "../../../api/direccionEntidad";

export const useKardexConfig = (
  empresaId,
  tipoConceptoId,
  tipoMovimientoId,
  tipoMovimiento, // "INGRESO" o "SALIDA"
  entidadComercialId, // Proveedor o Cliente
  empresaEntidadComercialId, // Mi empresa
  enabled = true
) => {
  const [almacenes, setAlmacenes] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [estadosMercaderia, setEstadosMercaderia] = useState([]);
  const [estadosCalidad, setEstadosCalidad] = useState([]);
  const [direccionesOrigen, setDireccionesOrigen] = useState([]);
  const [direccionesDestino, setDireccionesDestino] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !empresaId) return;

    const cargarDatos = async () => {
      setLoading(true);
      try {
        // 1. Cargar almacenes (sin parámetro empresaId, se filtra después si es necesario)
        const almacenesData = await getAlmacenes();
        setAlmacenes(almacenesData || []);

        // 2. Cargar conceptos (FILTRADO DOBLE: tipoConceptoId + tipoMovimientoId)
        const conceptosData = await getConceptosMovAlmacen();
        const conceptosFiltrados = (conceptosData || []).filter(
          (c) =>
            c.tipoConceptoId === tipoConceptoId &&
            c.tipoMovimientoId === tipoMovimientoId
        );
        setConceptos(conceptosFiltrados);

        // 3. Cargar estados de mercadería (tipoProvieneDeId = 2: PRODUCTOS)
        const { getEstadosMultiFuncionPorTipoProviene } = await import("../../../api/estadoMultiFuncion");
        const estadosMercaderiaData = await getEstadosMultiFuncionPorTipoProviene(2);
        setEstadosMercaderia(estadosMercaderiaData || []);

        // 4. Cargar estados de calidad (tipoProvieneDeId = 10: PRODUCTOS CALIDAD)
        const estadosCalidadData = await getEstadosMultiFuncionPorTipoProviene(10);
        setEstadosCalidad(estadosCalidadData || []);

        // 5. Cargar direcciones según tipo de movimiento
        if (tipoMovimiento === "INGRESO") {
          // INGRESO: Origen = Proveedor, Destino = Mi Empresa
          if (entidadComercialId) {
            const direccionesProveedorData = await obtenerDireccionesPorEntidad(
              entidadComercialId
            );
            setDireccionesOrigen(direccionesProveedorData || []);
          }

          if (empresaEntidadComercialId) {
            const direccionesEmpresaData = await obtenerDireccionesPorEntidad(
              empresaEntidadComercialId
            );
            setDireccionesDestino(direccionesEmpresaData || []);
          }
        } else if (tipoMovimiento === "SALIDA") {
          // SALIDA: Origen = Mi Empresa, Destino = Cliente
          if (empresaEntidadComercialId) {
            const direccionesEmpresaData = await obtenerDireccionesPorEntidad(
              empresaEntidadComercialId
            );
            setDireccionesOrigen(direccionesEmpresaData || []);
          }

          if (entidadComercialId) {
            const direccionesClienteData = await obtenerDireccionesPorEntidad(
              entidadComercialId
            );
            setDireccionesDestino(direccionesClienteData || []);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos para kardex:", error);
        setAlmacenes([]);
        setConceptos([]);
        setEstadosMercaderia([]);
        setEstadosCalidad([]);
        setDireccionesOrigen([]);
        setDireccionesDestino([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [
    empresaId,
    tipoConceptoId,
    tipoMovimientoId,
    tipoMovimiento,
    entidadComercialId,
    empresaEntidadComercialId,
    enabled,
  ]);

  return {
    almacenes,
    conceptos,
    estadosMercaderia,
    estadosCalidad,
    direccionesOrigen,
    direccionesDestino,
    loading,
  };
};