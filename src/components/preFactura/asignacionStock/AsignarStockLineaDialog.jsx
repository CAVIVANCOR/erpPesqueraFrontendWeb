// src/components/preFactura/asignacionStock/AsignarStockLineaDialog.jsx
// Muestra el stock del producto (como Consulta de Stock, Saldos Detallados) y permite acumular
// cantidades de uno o varios almacenes hasta completar lo requerido en la unidad de medida del almacén.
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { getSaldosDetProductoCliente } from "../../../api/saldosDetProductoCliente";
import { redondear3 } from "./useAsignacionStock";

const TOLERANCIA = 0.0005;
const formatearNumero = (valor) =>
  Number(valor || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const formatearFecha = (valor) => (valor ? new Date(valor).toLocaleDateString("es-PE") : "-");

export default function AsignarStockLineaDialog({ a }) {
  const detalle = a.lineaActiva;
  const [saldos, setSaldos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [tomas, setTomas] = useState({}); // { [saldoId]: cantidad }
  const [filtroAlmacen, setFiltroAlmacen] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!detalle) return;
    const iniciales = {};
    a.asignacionesDe(detalle.id).forEach((x) => {
      iniciales[x.saldoId] = x.cantidad;
    });
    setTomas(iniciales);
    setFiltroAlmacen(null);
    setBusqueda("");
    cargarStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalle?.id]);

  const cargarStock = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getSaldosDetProductoCliente({
        empresaId: Number(a.empresaId),
        esCustodia: false,
        productoId: Number(detalle.productoId),
        soloConSaldo: true,
      });
      setSaldos(
        [...data].sort(
          (x, y) =>
            String(x.almacen?.nombre || "").localeCompare(String(y.almacen?.nombre || "")) ||
            new Date(x.fechaVencimiento || 8.64e15) - new Date(y.fechaVencimiento || 8.64e15)
        )
      );
    } catch (err) {
      console.error("Error al cargar el stock:", err);
      setError("No se pudo cargar el stock del producto");
      setSaldos([]);
    } finally {
      setCargando(false);
    }
  };

  const unidad = detalle?.producto?.unidadMedida?.simbolo || "";
  const requerido = redondear3(detalle?.cantidad);
  const asignado = redondear3(Object.values(tomas).reduce((suma, c) => suma + Number(c || 0), 0));
  const falta = redondear3(requerido - asignado);
  const completo = Math.abs(falta) <= TOLERANCIA;
  const porcentaje = requerido > 0 ? Math.min(100, Math.round((asignado / requerido) * 100)) : 0;

  const otras = detalle ? a.tomadoPorOtras(detalle.id) : new Map();

  const filas = useMemo(
    () =>
      saldos.map((s) => {
        const id = Number(s.id);
        return {
          ...s,
          _id: id,
          _disponible: Math.max(0, redondear3(redondear3(s.saldoCantidad) - (otras.get(id) || 0))),
          _habilitado: a.tieneConcepto(s.almacenId),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saldos, a.tieneConcepto, a.json, detalle?.id]
  );

  const filasVisibles = filas.filter((f) => {
    if (filtroAlmacen && Number(f.almacenId) !== Number(filtroAlmacen)) return false;
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return [f.lote, f.ubicacionFisica?.descripcion, f.ubicacionFisica?.nombre, f.almacen?.nombre]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(texto));
  });

  const almacenesOpciones = [...new Map(saldos.map((s) => [Number(s.almacenId), s.almacen?.nombre || `Almacén ${s.almacenId}`])).entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((x, y) => x.label.localeCompare(y.label));

  const maximoFila = (fila) => Math.max(0, Math.min(fila._disponible, redondear3((tomas[fila._id] || 0) + Math.max(0, falta))));

  const fijarToma = (fila, valor) => {
    const cantidad = Math.max(0, Math.min(maximoFila(fila), redondear3(valor)));
    setTomas((prev) => {
      const siguiente = { ...prev };
      if (cantidad > TOLERANCIA) siguiente[fila._id] = cantidad;
      else delete siguiente[fila._id];
      return siguiente;
    });
  };

  const elegidos = Object.entries(tomas)
    .map(([id, cantidad]) => ({ fila: filas.find((f) => f._id === Number(id)), cantidad }))
    .filter((x) => x.fila && x.cantidad > TOLERANCIA);

  const confirmar = () => {
    const lista = elegidos.map(({ fila, cantidad }) => ({
      saldoId: fila._id,
      productoId: Number(fila.productoId),
      almacenId: Number(fila.almacenId),
      almacenNombre: fila.almacen?.nombre || `Almacén ${fila.almacenId}`,
      lote: fila.lote || "",
      fechaVencimiento: fila.fechaVencimiento,
      ubicacion: fila.ubicacionFisica?.descripcion || fila.ubicacionFisica?.nombre || "",
      cantidad: redondear3(cantidad),
    }));
    a.guardarLinea(detalle.id, lista);
    a.cerrarLinea();
  };

  const almacenTemplate = (fila) => (
    <div>
      <div style={{ fontWeight: "bold" }}>{fila.almacen?.nombre || `Almacén ${fila.almacenId}`}</div>
      {!fila._habilitado && (
        <Tag
          severity="danger"
          value="Sin concepto de venta"
          style={{ fontSize: "0.7rem" }}
          tooltip="Cree un concepto de salida por venta para este almacén (Conceptos de Movimiento de Almacén)"
        />
      )}
    </div>
  );

  const sacarTemplate = (fila) => (
    <InputNumber
      value={tomas[fila._id] ?? null}
      onValueChange={(e) => fijarToma(fila, e.value ?? 0)}
      min={0}
      max={maximoFila(fila)}
      minFractionDigits={0}
      maxFractionDigits={3}
      placeholder="0"
      disabled={!fila._habilitado || fila._disponible <= 0}
      inputStyle={{ width: "100px", textAlign: "right" }}
    />
  );

  const accionTemplate = (fila) => (
    <div style={{ display: "flex", gap: 4 }}>
      <Button
        type="button"
        icon="pi pi-angle-double-down"
        className="p-button-sm p-button-success p-button-outlined"
        tooltip="Completar lo que falta con este lote"
        disabled={!fila._habilitado || fila._disponible <= 0 || falta <= TOLERANCIA}
        onClick={() => fijarToma(fila, (tomas[fila._id] || 0) + falta)}
      />
      <Button
        type="button"
        icon="pi pi-times"
        className="p-button-sm p-button-danger p-button-outlined"
        tooltip="Quitar"
        disabled={!(tomas[fila._id] > 0)}
        onClick={() => fijarToma(fila, 0)}
      />
    </div>
  );

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={a.cerrarLinea} />
      <Button
        type="button"
        label={completo ? "Confirmar asignación" : `Confirmar asignación parcial (${formatearNumero(asignado)} de ${formatearNumero(requerido)})`}
        icon="pi pi-check"
        severity={completo ? "success" : "warning"}
        onClick={confirmar}
        disabled={elegidos.length === 0 && a.asignacionesDe(detalle?.id || 0).length === 0}
      />
    </div>
  );

  return (
    <Dialog
      header={`Asignar stock - ${detalle?.producto?.descripcionArmada || ""}`}
      visible={Boolean(detalle)}
      onHide={a.cerrarLinea}
      footer={footer}
      style={{ width: "1400px", maxWidth: "96vw" }}
      maximizable
      modal
    >
      {detalle && (
        <div className="p-fluid">
          {/* Resumen de la línea */}
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <small>Requerido</small>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                {formatearNumero(requerido)} {unidad}
              </div>
              {detalle.cantidadVenta ? (
                <small style={{ color: "#6c757d" }}>
                  Venta: {formatearNumero(detalle.cantidadVenta)} {detalle.producto?.unidadMedidaComercial?.simbolo || ""}
                </small>
              ) : null}
            </div>
            <div>
              <small>Asignado</small>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#2e7d32" }}>
                {formatearNumero(asignado)} {unidad}
              </div>
            </div>
            <div>
              <small>Falta</small>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: completo ? "#2e7d32" : "#d32f2f" }}>
                {formatearNumero(Math.max(0, falta))} {unidad}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <ProgressBar value={porcentaje} showValue />
            </div>
          </div>

          {a.conceptosPorAlmacen.size === 0 && (
            <Message
              severity="warn"
              style={{ width: "100%", marginBottom: 8 }}
              text="No hay conceptos de salida por venta configurados: no se puede retirar stock de ningún almacén."
            />
          )}
          {error && <Message severity="error" text={error} style={{ width: "100%", marginBottom: 8 }} />}

          {/* Filtros */}
          <div style={{ display: "flex", gap: 10, alignItems: "end", marginBottom: 8, flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 220 }}>
              <label htmlFor="filtroAlmacenStock" style={{ fontWeight: "bold" }}>
                Almacén
              </label>
              <Dropdown
                id="filtroAlmacenStock"
                value={filtroAlmacen}
                options={almacenesOpciones}
                onChange={(e) => setFiltroAlmacen(e.value)}
                placeholder="Todos los almacenes"
                showClear
              />
            </div>
            <div style={{ flex: 2, minWidth: 220 }}>
              <label htmlFor="busquedaStock" style={{ fontWeight: "bold" }}>
                Buscar lote / ubicación
              </label>
              <InputText id="busquedaStock" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Escriba para filtrar..." />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <Button type="button" label="Actualizar stock" icon="pi pi-refresh" className="p-button-outlined" onClick={cargarStock} loading={cargando} />
            </div>
          </div>

          {/* Stock disponible (igual que Consulta de Stock - Saldos Detallados) */}
          <DataTable
            value={filasVisibles}
            loading={cargando}
            dataKey="_id"
            size="small"
            stripedRows
            showGridlines
            cellMemo={false}
            scrollable
            scrollHeight="320px"
            emptyMessage="No hay stock disponible de este producto"
            rowClassName={(fila) => (tomas[fila._id] > 0 ? "p-highlight" : "")}
          >
            <Column header="Almacén" body={almacenTemplate} style={{ minWidth: "200px" }} />
            <Column header="Lote" field="lote" body={(f) => f.lote || "-"} style={{ minWidth: "90px" }} />
            <Column header="Vence" body={(f) => formatearFecha(f.fechaVencimiento)} style={{ minWidth: "90px" }} />
            <Column header="F. Ingreso" body={(f) => formatearFecha(f.fechaIngreso)} style={{ minWidth: "90px" }} />
            <Column
              header="Ubicación"
              body={(f) => f.ubicacionFisica?.descripcion || f.ubicacionFisica?.nombre || "-"}
              style={{ minWidth: "110px" }}
            />
            <Column header="Estado" body={(f) => f.estadoMercaderia?.descripcion || "-"} style={{ minWidth: "100px" }} />
            <Column header="Calidad" body={(f) => f.estadoCalidad?.descripcion || "-"} style={{ minWidth: "100px" }} />
            <Column
              header={`Saldo ${unidad}`}
              body={(f) => formatearNumero(f.saldoCantidad)}
              style={{ minWidth: "100px", textAlign: "right" }}
              bodyStyle={{ textAlign: "right" }}
            />
            <Column
              header="Disponible"
              body={(f) => (
                <span style={{ fontWeight: "bold", color: f._disponible > 0 ? "#2e7d32" : "#9e9e9e" }}>
                  {formatearNumero(f._disponible)}
                </span>
              )}
              style={{ minWidth: "100px", textAlign: "right" }}
              bodyStyle={{ textAlign: "right" }}
            />
            <Column header="Sacar" body={sacarTemplate} style={{ minWidth: "130px" }} />
            <Column header="" body={accionTemplate} style={{ minWidth: "100px" }} />
          </DataTable>

          {/* Acumulado */}
          <div style={{ marginTop: 12 }}>
            <strong>Lo que llevas elegido</strong>
            {elegidos.length === 0 ? (
              <div style={{ color: "#6c757d" }}>Aún no has elegido stock para esta línea.</div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {elegidos.map(({ fila, cantidad }) => (
                  <Tag
                    key={fila._id}
                    severity="info"
                    style={{ fontSize: "0.85rem" }}
                    value={`${fila.almacen?.nombre || `Almacén ${fila.almacenId}`} · Lote ${fila.lote || "-"} · ${formatearNumero(cantidad)} ${unidad}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
