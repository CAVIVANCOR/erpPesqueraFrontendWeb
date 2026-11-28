/**
 * ReemplazarProductoMasivoButton.jsx
 *
 * Botón autónomo (botón + diálogo + toast + API) para reemplazar un producto por otro y así poder dar de baja productos
 * obsoletos (p. ej. los marcados con XXX). Sigue el patrón de AsignarCampoMasaProductoButton y ReasignarTipoMovimientoMasivo.
 *
 * Dos modos:
 *  - "GLOBAL" (maestro de productos): se reemplaza el producto seleccionado en TODOS los registros del sistema y queda cesado.
 *    Requiere exactamente un producto marcado en la lista.
 *  - "DOCUMENTOS" (listas de ventas, compras, rendiciones): solo en los documentos marcados. El producto a retirar se elige en el
 *    diálogo (debe estar en esos documentos).
 *
 * Siempre hay una VISTA PREVIA antes de ejecutar: filas que cambian por tabla, movimientos de almacén que se reprocesan, avisos y
 * bloqueos (período contable cerrado, etc.); la unidad distinta solo avisa. Los precios, cantidades e importes de los documentos NO cambian:
 * solo cambia el producto vinculado. El kardex se reprocesa con el mismo código que lo genera.
 *
 * Props:
 *  - modo: "GLOBAL" | "DOCUMENTOS"
 *  - productoOrigen: { id, descripcion } (GLOBAL) producto marcado en la lista del maestro
 *  - totalSeleccionados: (GLOBAL) cantidad de productos marcados; si no es 1 se avisa
 *  - alcanceDocumentos: { preFacturaIds, ordenCompraIds, rendicionIds, movimientoAlmacenIds, otMantenimientoIds } (DOCUMENTOS)
 *  - disabled, label, icon, className, onExito
 */
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ProductoSelector from "./ProductoSelector";
import { previsualizarReemplazoProducto, ejecutarReemplazoProducto } from "../../api/reemplazoProducto";
import { mensajeDeError } from "../../utils/mensajeError";

const ReemplazarProductoMasivoButton = ({
  modo = "GLOBAL",
  productoOrigen = null,
  totalSeleccionados = 0,
  alcanceDocumentos = null,
  disabled = false,
  label = "Reemplazar producto",
  icon = "pi pi-arrow-right-arrow-left",
  className = "p-button-danger",
  onExito,
}) => {
  const toast = useRef(null);
  const [visible, setVisible] = useState(false);
  const [origenId, setOrigenId] = useState(null);
  const [destinoId, setDestinoId] = useState(null);
  const [vista, setVista] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [eliminarOrigen, setEliminarOrigen] = useState(false);

  const esGlobal = modo === "GLOBAL";
  const cantidadDocumentos = alcanceDocumentos
    ? (alcanceDocumentos.preFacturaIds?.length || 0) + (alcanceDocumentos.ordenCompraIds?.length || 0) + (alcanceDocumentos.rendicionIds?.length || 0) + (alcanceDocumentos.movimientoAlmacenIds?.length || 0) + (alcanceDocumentos.otMantenimientoIds?.length || 0)
    : 0;

  // En modo GLOBAL el producto a retirar es el marcado en la lista
  useEffect(() => {
    if (visible && esGlobal) setOrigenId(productoOrigen?.id ? Number(productoOrigen.id) : null);
  }, [visible, esGlobal, productoOrigen]);

  // Cualquier cambio de producto invalida la vista previa
  useEffect(() => {
    setVista(null);
  }, [origenId, destinoId]);

  const construirDatos = () => ({
    productoOrigenId: Number(origenId),
    productoDestinoId: Number(destinoId),
    alcance: esGlobal ? { tipo: "GLOBAL" } : { tipo: "DOCUMENTOS", ...alcanceDocumentos },
    eliminarOrigen: esGlobal && eliminarOrigen,
  });

  const abrir = () => {
    if (esGlobal && totalSeleccionados !== 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Seleccione un producto",
        detail: "Marque exactamente un producto en la lista: el reemplazo se hace producto por producto.",
        life: 5000,
      });
      return;
    }
    if (!esGlobal && cantidadDocumentos === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Seleccione documentos",
        detail: "Marque al menos un documento de la lista para reemplazar el producto en ellos.",
        life: 5000,
      });
      return;
    }
    setOrigenId(esGlobal ? Number(productoOrigen?.id) : null);
    setDestinoId(null);
    setVista(null);
    setEliminarOrigen(false);
    setVisible(true);
  };

  const cerrar = () => {
    if (cargando) return;
    setVisible(false);
  };

  const previsualizar = async () => {
    setCargando(true);
    try {
      setVista(await previsualizarReemplazoProducto(construirDatos()));
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "No se pudo analizar el reemplazo", detail: mensajeDeError(error, "No se pudo analizar el reemplazo"), life: 8000 });
    } finally {
      setCargando(false);
    }
  };

  const ejecutar = async () => {
    setCargando(true);
    try {
      const reporte = await ejecutarReemplazoProducto(construirDatos());
      const total = (reporte.filasActualizadas || []).reduce((acc, f) => acc + Number(f.filas || 0), 0);
      toast.current?.show({
        severity: "success",
        summary: "Producto reemplazado",
        detail: `${total} registro(s) actualizados${reporte.movimientosAlmacenReprocesados ? `, ${reporte.movimientosAlmacenReprocesados} movimiento(s) de almacén reprocesados` : ""}${
          reporte.productoOrigenEliminado
            ? ". El producto retirado fue eliminado."
            : reporte.productoOrigenCesado
              ? ". El producto retirado quedó cesado."
              : "."
        }`,
        life: 8000,
      });
      setVisible(false);
      if (onExito) await onExito(reporte);
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "No se reemplazó el producto", detail: mensajeDeError(error, "No se pudo reemplazar el producto"), life: 10000 });
    } finally {
      setCargando(false);
    }
  };

  const puedeAnalizar = Boolean(origenId) && Boolean(destinoId) && !cargando;

  return (
    <>
      <Toast ref={toast} />
      <Button
        type="button"
        label={label}
        icon={icon}
        className={className}
        onClick={abrir}
        disabled={disabled}
        tooltip={
          esGlobal
            ? "Reemplaza el producto marcado por otro en todo el sistema y lo da de baja"
            : "Reemplaza un producto por otro en los documentos marcados de la lista"
        }
        tooltipOptions={{ position: "top" }}
        style={{ width: "100%" }}
      />
      <Dialog header="Reemplazar producto" visible={visible} style={{ width: "min(900px, 96vw)" }} onHide={cerrar} modal>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "#f1f3f5", padding: "0.75rem", borderRadius: 6, fontSize: "0.9rem" }}>
            {esGlobal ? (
              <>
                <strong>Alcance:</strong> todos los registros del sistema que usan el producto a retirar (ventas, compras, rendiciones,
                cotizaciones, almacén, precios). Al terminar el producto retirado queda <strong>cesado</strong> o, si lo indica, <strong>eliminado</strong>.
              </>
            ) : (
              <>
                <strong>Alcance:</strong> solo los {cantidadDocumentos} documento(s) marcados en la lista.
              </>
            )}
            <br />
            Los precios, cantidades e importes de los documentos <strong>no cambian</strong>: solo cambia el producto vinculado. El kardex y
            los saldos de almacén se reprocesan con el mismo código que los genera.
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <label style={{ fontWeight: "bold" }}>Producto a retirar *</label>
              <ProductoSelector value={origenId} onChange={setOrigenId} disabled={esGlobal || cargando} soloLectura={esGlobal} placeholder="Seleccione el producto a retirar" />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <label style={{ fontWeight: "bold" }}>Producto correcto (reemplazo) *</label>
              <ProductoSelector value={destinoId} onChange={setDestinoId} disabled={cargando} placeholder="Seleccione el producto de reemplazo" />
            </div>
          </div>

          {esGlobal && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Checkbox inputId="eliminarOrigen" checked={eliminarOrigen} onChange={(e) => setEliminarOrigen(e.checked)} disabled={cargando} />
              <label htmlFor="eliminarOrigen">
                <strong>Eliminar el producto retirado al terminar</strong> (solo si no queda ninguna relación; si no, no se reemplaza nada). Sin marcar,
                el producto retirado queda cesado.
              </label>
            </div>
          )}

          {vista && (
            <>
              <DataTable value={vista.impacto || []} size="small" emptyMessage="Sin registros para reemplazar" stripedRows>
                <Column field="tabla" header="Tabla" />
                <Column field="columna" header="Columna" />
                <Column field="filas" header="Registros" style={{ textAlign: "right" }} />
              </DataTable>
              {vista.movimientosAlmacen > 0 && (
                <Message
                  severity="info"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  text={`Se reprocesarán ${vista.movimientosAlmacen} movimiento(s) de almacén (kardex y saldos) con el código que los genera.`}
                />
              )}
              {(vista.avisos || []).map((aviso, i) => (
                <Message key={`a${i}`} severity="warn" style={{ width: "100%", justifyContent: "flex-start" }} text={aviso} />
              ))}
              {(vista.bloqueos || []).map((bloqueo, i) => (
                <Message key={`b${i}`} severity="error" style={{ width: "100%", justifyContent: "flex-start" }} text={bloqueo} />
              ))}
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={cerrar} disabled={cargando} />
            <Button type="button" label="Vista previa" icon="pi pi-search" className="p-button-outlined" onClick={previsualizar} disabled={!puedeAnalizar} loading={cargando && !vista} />
            <Button
              type="button"
              label="Confirmar reemplazo"
              icon="pi pi-check"
              className="p-button-danger"
              onClick={ejecutar}
              disabled={!vista?.puedeEjecutar || cargando}
              loading={cargando && Boolean(vista)}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ReemplazarProductoMasivoButton;
