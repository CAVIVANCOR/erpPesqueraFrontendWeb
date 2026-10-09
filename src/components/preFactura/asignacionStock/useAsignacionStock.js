// src/components/preFactura/asignacionStock/useAsignacionStock.js
// Estado autónomo de la asignación de stock de una PreFactura.
// Las asignaciones viven SOLO en memoria (un JSON) y se descartan al cargar otra PreFactura o al salir.
// Al generar, se envían al backend, que crea un movimiento por almacén, su kardex y actualiza los saldos.
import { useState, useEffect, useMemo, useCallback } from "react";
import { getConceptosMovAlmacen } from "../../../api/conceptoMovAlmacen";
import { despacharStockPreFactura } from "../../../api/preFactura";

const TIPO_CONCEPTO_VENTA = 2;
const TIPO_MOVIMIENTO_SALIDA = 3;
const TOLERANCIA = 0.0005;

export const redondear3 = (valor) => Math.round(Number(valor || 0) * 1000) / 1000;

/**
 * Estructura del JSON en memoria:
 *   asignaciones = {
 *     [detallePreFacturaId]: [
 *       { saldoId, productoId, almacenId, almacenNombre, lote, fechaVencimiento, ubicacion, cantidad }
 *     ]
 *   }
 */
export default function useAsignacionStock({
  preFacturaId,
  detalles = [],
  empresaId,
  kardexGenerado = false,
  puedeDespachar = false,
  motivoNoDespachar = "",
  toast,
  onGenerado,
}) {
  const [asignaciones, setAsignaciones] = useState({});
  const [conceptos, setConceptos] = useState([]);
  const [conceptoElegido, setConceptoElegido] = useState({}); // { [almacenId]: conceptoId }
  const [lineaActiva, setLineaActiva] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [generadoLocal, setGeneradoLocal] = useState(false);

  // El JSON se limpia al cargar otra PreFactura y al salir de la actual
  useEffect(() => {
    setAsignaciones({});
    setConceptoElegido({});
    setLineaActiva(null);
    setMostrarConfirmacion(false);
    setGeneradoLocal(false);
    return () => setAsignaciones({});
  }, [preFacturaId]);

  // Si una línea cambia (producto o cantidad) o desaparece, su asignación ya no es válida
  useEffect(() => {
    setAsignaciones((prev) => {
      let cambio = false;
      const siguiente = {};
      Object.entries(prev).forEach(([detalleId, lista]) => {
        const detalle = detalles.find((d) => String(d.id) === detalleId);
        const total = redondear3(lista.reduce((suma, a) => suma + a.cantidad, 0));
        const productoCambio = detalle && lista.some((a) => Number(a.productoId) !== Number(detalle.productoId));
        if (!detalle || productoCambio || total - redondear3(detalle.cantidad) > TOLERANCIA) {
          cambio = true;
          return;
        }
        siguiente[detalleId] = lista;
      });
      return cambio ? siguiente : prev;
    });
  }, [detalles]);

  // Conceptos de salida por venta: definen de qué almacén se puede retirar
  useEffect(() => {
    if (!preFacturaId || kardexGenerado) return;
    let activo = true;
    getConceptosMovAlmacen()
      .then((data) => activo && setConceptos(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Error al cargar conceptos de movimiento de almacén:", error);
        if (activo) setConceptos([]);
      });
    return () => {
      activo = false;
    };
  }, [preFacturaId, kardexGenerado]);

  const conceptosPorAlmacen = useMemo(() => {
    const mapa = new Map();
    conceptos
      .filter(
        (c) =>
          c.activo !== false &&
          Number(c.tipoConceptoId) === TIPO_CONCEPTO_VENTA &&
          Number(c.tipoMovimientoId) === TIPO_MOVIMIENTO_SALIDA &&
          c.llevaKardexOrigen &&
          !c.esCustodia &&
          c.almacenOrigenId
      )
      .sort((x, y) => Number(x.id) - Number(y.id))
      .forEach((c) => {
        const clave = Number(c.almacenOrigenId);
        if (!mapa.has(clave)) mapa.set(clave, []);
        mapa.get(clave).push(c);
      });
    return mapa;
  }, [conceptos]);

  const tieneConcepto = useCallback((almacenId) => conceptosPorAlmacen.has(Number(almacenId)), [conceptosPorAlmacen]);

  const conceptoDe = useCallback(
    (almacenId) => {
      const lista = conceptosPorAlmacen.get(Number(almacenId)) || [];
      const elegido = conceptoElegido[Number(almacenId)];
      return lista.find((c) => Number(c.id) === Number(elegido)) || lista[0] || null;
    },
    [conceptosPorAlmacen, conceptoElegido]
  );

  // ----- Consultas de estado -----
  const asignacionesDe = useCallback((detalleId) => asignaciones[detalleId] || [], [asignaciones]);

  const estadoLinea = useCallback(
    (detalle) => {
      const requerido = redondear3(detalle.cantidad);
      const asignado = redondear3(asignacionesDe(detalle.id).reduce((suma, a) => suma + a.cantidad, 0));
      let estado = "PARCIAL";
      if (asignado <= TOLERANCIA) estado = "SIN_ASIGNAR";
      else if (Math.abs(asignado - requerido) <= TOLERANCIA) estado = "COMPLETA";
      return { estado, asignado, requerido };
    },
    [asignacionesDe]
  );

  const todasCompletas = useMemo(
    () => detalles.length > 0 && detalles.every((d) => estadoLinea(d).estado === "COMPLETA"),
    [detalles, estadoLinea]
  );

  // Cantidad que otras líneas ya tomaron de cada saldo (para no usar dos veces el mismo stock)
  const tomadoPorOtras = useCallback(
    (detalleId) => {
      const mapa = new Map();
      Object.entries(asignaciones).forEach(([id, lista]) => {
        if (String(id) === String(detalleId)) return;
        lista.forEach((a) => mapa.set(Number(a.saldoId), (mapa.get(Number(a.saldoId)) || 0) + a.cantidad));
      });
      return mapa;
    },
    [asignaciones]
  );

  // Resumen por almacén de lo que se generaría
  const resumenPorAlmacen = useMemo(() => {
    const grupos = new Map();
    Object.values(asignaciones).forEach((lista) =>
      lista.forEach((a) => {
        const clave = Number(a.almacenId);
        if (!grupos.has(clave)) {
          grupos.set(clave, { almacenId: clave, almacenNombre: a.almacenNombre, cantidad: 0, lineas: 0 });
        }
        const grupo = grupos.get(clave);
        grupo.cantidad = redondear3(grupo.cantidad + a.cantidad);
        grupo.lineas += 1;
      })
    );
    return [...grupos.values()].sort((x, y) => String(x.almacenNombre).localeCompare(String(y.almacenNombre)));
  }, [asignaciones]);

  // ----- Acciones -----
  const guardarLinea = useCallback((detalleId, lista) => {
    setAsignaciones((prev) => {
      const siguiente = { ...prev };
      if (lista.length > 0) siguiente[detalleId] = lista;
      else delete siguiente[detalleId];
      return siguiente;
    });
  }, []);

  const abrirLinea = useCallback((detalle) => setLineaActiva(detalle), []);
  const cerrarLinea = useCallback(() => setLineaActiva(null), []);
  const pedirConfirmacion = useCallback(() => setMostrarConfirmacion(true), []);
  const cerrarConfirmacion = useCallback(() => setMostrarConfirmacion(false), []);
  const elegirConcepto = useCallback(
    (almacenId, conceptoId) => setConceptoElegido((prev) => ({ ...prev, [Number(almacenId)]: conceptoId })),
    []
  );

  const mostrarError = (detalle) =>
    toast?.current?.show({ severity: "error", summary: "No se pudo generar el kardex", detail: detalle, life: 9000 });

  const generar = async () => {
    const payloadConceptos = {};
    for (const grupo of resumenPorAlmacen) {
      const concepto = conceptoDe(grupo.almacenId);
      if (!concepto) {
        mostrarError(`El almacén "${grupo.almacenNombre}" no tiene un concepto de salida por venta.`);
        return null;
      }
      payloadConceptos[grupo.almacenId] = Number(concepto.id);
    }
    const lineas = [];
    Object.entries(asignaciones).forEach(([detalleId, lista]) =>
      lista.forEach((a) =>
        lineas.push({
          detallePreFacturaId: Number(detalleId),
          saldoDetProductoClienteId: Number(a.saldoId),
          cantidad: a.cantidad,
        })
      )
    );

    setGenerando(true);
    try {
      const resultado = await despacharStockPreFactura(preFacturaId, { conceptosPorAlmacen: payloadConceptos, lineas });
      setAsignaciones({});
      setMostrarConfirmacion(false);
      setGeneradoLocal(true);
      toast?.current?.show({
        severity: "success",
        summary: "Kardex generado",
        detail: `${resultado?.movimientos?.length || 0} movimiento(s) de almacén generados y saldos actualizados`,
        life: 6000,
      });
      if (onGenerado) await onGenerado(resultado);
      return resultado;
    } catch (error) {
      console.error("Error al despachar stock:", error);
      mostrarError(
        error.response?.data?.mensaje || error.response?.data?.message || error.message || "Error desconocido"
      );
      return null;
    } finally {
      setGenerando(false);
    }
  };

  return {
    // datos
    json: asignaciones,
    empresaId,
    preFacturaId,
    detalles,
    kardexGenerado: kardexGenerado || generadoLocal,
    puedeDespachar,
    motivoNoDespachar,
    generando,
    lineaActiva,
    mostrarConfirmacion,
    conceptosPorAlmacen,
    resumenPorAlmacen,
    todasCompletas,
    // consultas
    asignacionesDe,
    estadoLinea,
    tomadoPorOtras,
    tieneConcepto,
    conceptoDe,
    // acciones
    guardarLinea,
    abrirLinea,
    cerrarLinea,
    pedirConfirmacion,
    cerrarConfirmacion,
    elegirConcepto,
    generar,
  };
}
