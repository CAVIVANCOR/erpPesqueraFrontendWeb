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
  almacenId, // ⭐ NUEVO: ID del almacén seleccionado
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
        // 2. Cargar conceptos (FILTRADO: tipoConceptoId + tipoMovimientoId + almacén)
        const conceptosData = await getConceptosMovAlmacen();
        let conceptosFiltrados = (conceptosData || []).filter(
          (c) => {
            const coincideTipoConcepto = Number(c.tipoConceptoId) === Number(tipoConceptoId);
            const coincideTipoMovimiento = Number(c.tipoMovimientoId) === Number(tipoMovimientoId);
            const estaActivo = c.activo === true;
            return coincideTipoConcepto && coincideTipoMovimiento && estaActivo;
          }
        );
        // Filtrar por almacén si está seleccionado
        if (almacenId) {
          conceptosFiltrados = conceptosFiltrados.filter((c) => {
            if (tipoMovimiento === "INGRESO") {
              // Para INGRESO: almacenDestinoId debe coincidir o ser NULL (genérico)
              return c.almacenDestinoId === null || Number(c.almacenDestinoId) === Number(almacenId);
            } else if (tipoMovimiento === "SALIDA") {
              // Para SALIDA: almacenOrigenId debe coincidir o ser NULL (genérico)
              return c.almacenOrigenId === null || Number(c.almacenOrigenId) === Number(almacenId);
            }
            return true;
          });
        }
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
    almacenId,
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