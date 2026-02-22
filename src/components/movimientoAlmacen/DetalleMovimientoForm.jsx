// src/components/movimientoAlmacen/DetalleMovimientoForm.jsx
// Formulario completo para detalles de movimiento con lógica inteligente según tipo de movimiento
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import ProductoSelectorDialog from "./ProductoSelectorDialog";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import {
  crearDetalleMovimiento,
  actualizarDetalleMovimiento,
} from "../../api/movimientoAlmacen";

/**
 * Formulario para agregar/editar detalles de movimiento
 * Maneja automáticamente la lógica según tipo de movimiento (ingreso/egreso/transferencia)
 *
 * @param {boolean} visible - Visibilidad del diálogo
 * @param {function} onHide - Callback al cerrar
 * @param {function} onSave - Callback al guardar (data) => void
 * @param {object} detalle - Detalle a editar (null para nuevo)
 * @param {object} movimientoAlmacen - Datos completos del movimiento (con empresa y conceptoMovAlmacen)
 * @param {array} estadosMercaderia - Estados de mercadería (tipoProvieneDeId=2)
 * @param {array} estadosCalidad - Estados de calidad (tipoProvieneDeId=10)
 * @param {boolean} loading - Estado de carga
 * @param {boolean} readOnly - Si es true, deshabilita todos los campos (documento cerrado)
 */
export default function DetalleMovimientoForm({
  visible,
  onHide,
  onSave,
  detalle = null,
  movimientoAlmacen,
  estadosMercaderia = [],
  estadosCalidad = [],
  ubicacionesFisicas = [], // ← AGREGAR AQUÍ
  loading = false,
  readOnly = false,
}) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  
  // DEBUG: Verificar ubicacionesFisicas
  console.log('ubicacionesFisicas recibidas:', ubicacionesFisicas);
  
  // Estados del formulario
  const [productoId, setProductoId] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(0);
  const [peso, setPeso] = useState(null);
  const [lote, setLote] = useState("");
  const [ubicacionFisicaId, setUbicacionFisicaId] = useState(1); // Por defecto: ubicación física ID 1
  const [fechaProduccion, setFechaProduccion] = useState(null);
  const [fechaVencimiento, setFechaVencimiento] = useState(null);
  const [fechaIngreso, setFechaIngreso] = useState(null);
  const [nroSerie, setNroSerie] = useState("");
  const [nroContenedor, setNroContenedor] = useState("");
  const [estadoMercaderiaId, setEstadoMercaderiaId] = useState(6); // LIBERADO por defecto
  const [estadoCalidadId, setEstadoCalidadId] = useState(10); // CALIDAD A por defecto
  const [observaciones, setObservaciones] = useState("");
  const [costoUnitario, setCostoUnitario] = useState(null);
  const [saldoOriginal, setSaldoOriginal] = useState(null);
  // Control del selector de productos
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  // Determinar tipo de movimiento
  const conceptoMovAlmacen = movimientoAlmacen?.conceptoMovAlmacen;
  const llevaKardexOrigen = conceptoMovAlmacen?.llevaKardexOrigen || false;
  const llevaKardexDestino = conceptoMovAlmacen?.llevaKardexDestino || false;
  const esCustodia = movimientoAlmacen?.esCustodia || false;

  // Determinar modo
  let modo = "ingreso";
  if (llevaKardexOrigen && !llevaKardexDestino) {
    modo = "egreso";
  } else if (llevaKardexOrigen && llevaKardexDestino) {
    modo = "transferencia";
  }

  // Determinar si los campos son editables
  const esIngreso = modo === "ingreso";
  const camposEditables = esIngreso;

  useEffect(() => {
    if (detalle) {
      // Modo edición
      setProductoId(detalle.productoId);
      setProductoSeleccionado(detalle.producto);
      setCantidad(detalle.cantidad || 0);
      setPeso(detalle.peso || null);
      setLote(detalle.lote || "");
      setUbicacionFisicaId(
        detalle.ubicacionFisicaId ? Number(detalle.ubicacionFisicaId) : null,
      ); // ← AGREGAR AQUÍ
      setFechaProduccion(
        detalle.fechaProduccion ? new Date(detalle.fechaProduccion) : null,
      );
      setFechaVencimiento(
        detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento) : null,
      );
      setFechaIngreso(
        detalle.fechaIngreso ? new Date(detalle.fechaIngreso) : null,
      );
      setNroSerie(detalle.nroSerie || "");
      setNroContenedor(detalle.nroContenedor || "");
      // Convertir a números para que los Dropdown los reconozcan
      setEstadoMercaderiaId(
        detalle.estadoMercaderiaId ? Number(detalle.estadoMercaderiaId) : 6,
      );
      setEstadoCalidadId(
        detalle.estadoCalidadId ? Number(detalle.estadoCalidadId) : 10,
      );
      setObservaciones(detalle.observaciones || "");
      setCostoUnitario(detalle.costoUnitario || null);
    } else {
      limpiarFormulario();
    }
  }, [detalle, visible]);

  const limpiarFormulario = () => {
    setProductoId(null);
    setProductoSeleccionado(null);
    setCantidad(0);
    setPeso(null);
    setLote("");
    setFechaProduccion(null);
    setFechaVencimiento(null);
    setFechaIngreso(null);
    setNroSerie("");
    setNroContenedor("");
    setEstadoMercaderiaId(6); // LIBERADO
    setEstadoCalidadId(10); // CALIDAD A
    setObservaciones("");
    setCostoUnitario(null);
    setSaldoOriginal(null);
    setUbicacionFisicaId(1); // Por defecto: ubicación física ID 1
  };

  const handleProductoSeleccionado = (data) => {
    if (data.tipo === "producto") {
      // INGRESO: Producto seleccionado
      setProductoId(data.productoId);
      setProductoSeleccionado(data.producto);

      // Limpiar campos para ingreso manual
      setCantidad(0);
      setPeso(null);
      setLote("");
      setUbicacionFisicaId(1); // Por defecto: ubicación física ID 1
      setFechaProduccion(null);
      setFechaVencimiento(null);
      // fechaIngreso = fechaDocumento del movimiento
      if (movimientoAlmacen?.fechaDocumento) {
        const fechaDoc = new Date(movimientoAlmacen.fechaDocumento);
        fechaDoc.setHours(0, 0, 0, 0);
        setFechaIngreso(fechaDoc);
      }
      setNroSerie("");
      setNroContenedor("");
      // Usar estados por defecto que vienen del selector o valores por defecto
      setEstadoMercaderiaId(data.estadoMercaderiaId || 6); // LIBERADO
      setEstadoCalidadId(data.estadoCalidadId || 10); // CALIDAD A

      toast.current?.show({
        severity: "success",
        summary: "Producto Seleccionado",
        detail: data.producto.descripcionArmada,
      });
    } else if (data.tipo === "saldo") {
      // EGRESO/TRANSFERENCIA: Saldo seleccionado
      const saldo = data.saldo;
      setProductoId(data.productoId);
      setProductoSeleccionado(data.producto);
      setSaldoOriginal(saldo);

      // Cargar datos del saldo
      setCantidad(Number(saldo.saldoCantidad));
      setPeso(Number(saldo.saldoPeso) || null);
      setLote(saldo.lote || "");
      setUbicacionFisicaId(saldo.ubicacionFisicaId ? Number(saldo.ubicacionFisicaId) : null);
      setFechaProduccion(
        saldo.fechaProduccion ? new Date(saldo.fechaProduccion) : null,
      );
      setFechaVencimiento(
        saldo.fechaVencimiento ? new Date(saldo.fechaVencimiento) : null,
      );
      setFechaIngreso(saldo.fechaIngreso ? new Date(saldo.fechaIngreso) : null);
      setNroSerie(saldo.nroSerie || "");
      setNroContenedor(saldo.numContenedor || "");
      setEstadoMercaderiaId(saldo.estadoId || 6);
      setEstadoCalidadId(saldo.estadoCalidadId || 10);

      toast.current?.show({
        severity: "success",
        summary: "Saldo Seleccionado",
        detail: `${data.producto.descripcionArmada} - Saldo: ${Number(saldo.saldoCantidad).toFixed(2)}`,
      });
    }
  };

  const handleCantidadChange = (value) => {
    setCantidad(value);

    // Calcular peso automáticamente si hay producto seleccionado
    if (productoSeleccionado && productoSeleccionado.unidadMedida) {
      const factorConversion =
        productoSeleccionado.unidadMedida.factorConversion;
      if (factorConversion) {
        const pesoCalculado = value * factorConversion;
        setPeso(pesoCalculado);
      } else {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "La unidad de medida no tiene factor de conversión definido",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!productoId) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Debe seleccionar un producto",
      });
      return;
    }

    if (!cantidad || cantidad <= 0) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "La cantidad debe ser mayor a cero",
      });
      return;
    }

    // Validar que cantidad no exceda saldo (para egresos/transferencias)
    if (!esIngreso && saldoOriginal) {
      if (cantidad > Number(saldoOriginal.saldoCantidad)) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: `La cantidad no puede exceder el saldo disponible (${Number(saldoOriginal.saldoCantidad).toFixed(2)})`,
        });
        return;
      }
    }

    // Validar factor de conversión
    if (
      productoSeleccionado?.unidadMedida &&
      !productoSeleccionado.unidadMedida.factorConversion
    ) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          "El producto no tiene factor de conversión definido en su unidad de medida",
      });
      return;
    }

    // Normalizar fechas a medianoche (00:00:00)
    const fechaProduccionNormalizada = fechaProduccion
      ? new Date(fechaProduccion)
      : null;
    if (fechaProduccionNormalizada) {
      fechaProduccionNormalizada.setHours(0, 0, 0, 0);
    }

    const fechaVencimientoNormalizada = fechaVencimiento
      ? new Date(fechaVencimiento)
      : null;
    if (fechaVencimientoNormalizada) {
      fechaVencimientoNormalizada.setHours(0, 0, 0, 0);
    }

    const fechaIngresoNormalizada = fechaIngreso
      ? new Date(fechaIngreso)
      : null;
    if (fechaIngresoNormalizada) {
      fechaIngresoNormalizada.setHours(0, 0, 0, 0);
    }

    const detalleData = {
      ...(detalle?.id && { id: detalle.id }),
      // movimientoAlmacenId NO se incluye - se asigna automáticamente en el backend al crear el movimiento
      productoId: Number(productoId),
      cantidad: Number(cantidad),
      peso: peso ? Number(peso) : null,
      lote: lote || null,
      ubicacionFisicaId: ubicacionFisicaId ? Number(ubicacionFisicaId) : null, // ← AGREGAR AQUÍ
      fechaProduccion: fechaProduccionNormalizada,
      fechaVencimiento: fechaVencimientoNormalizada,
      fechaIngreso: fechaIngresoNormalizada,
      nroSerie: nroSerie || null,
      nroContenedor: nroContenedor || null,
      estadoMercaderiaId: estadoMercaderiaId
        ? Number(estadoMercaderiaId)
        : null,
      estadoCalidadId: estadoCalidadId ? Number(estadoCalidadId) : null,
      entidadComercialId: esCustodia
        ? Number(movimientoAlmacen?.entidadComercialId)
        : Number(movimientoAlmacen?.empresa?.entidadComercialId),
      esCustodia: esCustodia,
      empresaId: Number(movimientoAlmacen?.empresaId),
      observaciones: observaciones || null,
      costoUnitario: costoUnitario ? Number(costoUnitario) : null,
      creadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      actualizadoPor: usuario?.personalId ? Number(usuario.personalId) : null,
      // Incluir producto para mostrar en la tabla
      producto: productoSeleccionado,
    };

    // Si el movimiento ya existe (tiene ID), guardar directamente en BD
    if (movimientoAlmacen?.id) {
      handleGuardarEnBD(detalleData);
    } else {
      // Movimiento nuevo - Solo notificar al padre (se guardará con el movimiento)
      onSave(detalleData);
      limpiarFormulario();
      onHide();
    }
  };

  const handleGuardarEnBD = async (detalleData) => {
    try {
      // Agregar movimientoAlmacenId
      const detalleConMovimiento = {
        ...detalleData,
        movimientoAlmacenId: movimientoAlmacen.id,
      };

      // Verificar si es edición: detalle.id debe existir y ser un número válido
      const esEdicion = detalle?.id && !isNaN(Number(detalle.id));

      if (esEdicion) {
        // Actualizar detalle existente en BD
        await actualizarDetalleMovimiento(
          Number(detalle.id),
          detalleConMovimiento,
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        // Crear nuevo detalle en BD
        await crearDetalleMovimiento(detalleConMovimiento);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detalle guardado correctamente",
        });
      }

      // Notificar al padre para que recargue los detalles
      onSave(detalleData);
      limpiarFormulario();
      onHide();
    } catch (error) {
      console.error("Error al guardar detalle:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "No se pudo guardar el detalle",
      });
    }
  };

  const estadosMercaderiaOptions = estadosMercaderia.map((e) => ({
    label: e.descripcion || e.nombre,
    value: Number(e.id),
  }));

  const estadosCalidadOptions = estadosCalidad.map((e) => ({
    label: e.descripcion || e.nombre,
    value: Number(e.id),
  }));

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleSubmit}
        disabled={
          loading || !productoId || !cantidad || cantidad <= 0 || readOnly
        }
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        style={{ width: "900px", maxWidth: "95vw" }}
        header={detalle ? "Editar Detalle" : "Agregar Detalle"}
        modal
        footer={dialogFooter}
        onHide={onHide}
      >
        <form onSubmit={handleSubmit} className="p-fluid">
          {/* Información del movimiento */}
          <Panel header="Información del Movimiento" className="p-mb-3">
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Tag
                value={modo.toUpperCase()}
                severity={
                  modo === "ingreso"
                    ? "success"
                    : modo === "egreso"
                      ? "danger"
                      : "info"
                }
              />
              <Tag
                value={esCustodia ? "CUSTODIA" : "PROPIA"}
                severity={esCustodia ? "warning" : "info"}
              />
              <Tag
                value={movimientoAlmacen?.empresa?.razonSocial || "Sin empresa"}
                severity="info"
              />
            </div>
          </Panel>

          <Divider />

          {/* Selección de Producto */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Producto *
            </label>
            {productoSeleccionado ? (
              <Panel>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#1976d2",
                        fontSize: "1.1em",
                      }}
                    >
                      {productoSeleccionado.descripcionArmada}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9em",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      <strong>Unidad:</strong>{" "}
                      {productoSeleccionado.unidadMedida?.nombre || "-"}
                      {productoSeleccionado.unidadMedida?.factorConversion && (
                        <span style={{ marginLeft: "16px" }}>
                          <strong>Factor Conv.:</strong>{" "}
                          {productoSeleccionado.unidadMedida.factorConversion}
                        </span>
                      )}
                    </div>
                    {saldoOriginal && (
                      <div
                        style={{
                          fontSize: "0.9em",
                          color: "#d32f2f",
                          marginTop: "4px",
                        }}
                      >
                        <strong>Saldo Disponible:</strong>{" "}
                        {Number(saldoOriginal.saldoCantidad).toFixed(2)}{" "}
                        {productoSeleccionado.unidadMedida?.nombre || ""}
                        {saldoOriginal.saldoPeso && (
                          <span style={{ marginLeft: "8px" }}>
                            ({Number(saldoOriginal.saldoPeso).toFixed(2)} kg)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    label="Cambiar"
                    icon="pi pi-sync"
                    className="p-button-sm p-button-outlined"
                    onClick={() => setShowProductoSelector(true)}
                    disabled={loading || readOnly}
                  />
                </div>
              </Panel>
            ) : (
              <Button
                type="button"
                label="Seleccionar Producto"
                icon="pi pi-search"
                className="p-button-outlined"
                onClick={() => setShowProductoSelector(true)}
                disabled={loading}
              />
            )}
          </div>

          <Divider />

          {/* Cantidad y Peso */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label htmlFor="cantidad" style={{ fontWeight: "bold" }}>
                Cantidad *
              </label>
              <InputNumber
                id="cantidad"
                value={cantidad}
                onValueChange={(e) => handleCantidadChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={
                  saldoOriginal
                    ? Number(saldoOriginal.saldoCantidad)
                    : undefined
                }
                required
                disabled={loading || readOnly}
              />
              {saldoOriginal && (
                <small style={{ color: "#666" }}>
                  Máximo: {Number(saldoOriginal.saldoCantidad).toFixed(2)}
                </small>
              )}
            </div>

            <div>
              <label htmlFor="peso" style={{ fontWeight: "bold" }}>
                Peso (kg) {esIngreso && "(Calculado automáticamente)"}
              </label>
              <InputNumber
                id="peso"
                value={peso}
                onValueChange={(e) => setPeso(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                disabled={true || readOnly} // Siempre calculado automáticamente
              />
            </div>
          </div>

          {/* Variables de Control */}
          <Panel header="Variables de Control" toggleable collapsed={false}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label htmlFor="lote" style={{ fontWeight: "bold" }}>
                  Lote
                </label>
                <InputText
                  id="lote"
                  value={lote}
                  onChange={(e) => setLote(e.target.value.toUpperCase())}
                  disabled={!camposEditables || readOnly}
                  style={{ width: "100%", textTransform: "uppercase" }}
                />
              </div>

              <div>
                <label htmlFor="nroSerie" style={{ fontWeight: "bold" }}>
                  Nro. Serie
                </label>
                <InputText
                  id="nroSerie"
                  value={nroSerie}
                  onChange={(e) => setNroSerie(e.target.value.toUpperCase())}
                  disabled={!camposEditables || readOnly}
                  style={{ width: "100%", textTransform: "uppercase" }}
                />
              </div>
              <div>
                <label
                  htmlFor="ubicacionFisicaId"
                  style={{ fontWeight: "bold" }}
                >
                  Ubicación Física
                </label>
                <Dropdown
                  id="ubicacionFisicaId"
                  value={ubicacionFisicaId ? Number(ubicacionFisicaId) : null}
                  options={ubicacionesFisicas.map((u) => ({
                    label: u.descripcion,
                    value: Number(u.id),
                  }))}
                  onChange={(e) => setUbicacionFisicaId(e.value)}
                  placeholder="Seleccione ubicación"
                  disabled={!camposEditables || readOnly}
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label htmlFor="nroContenedor" style={{ fontWeight: "bold" }}>
                  Nro. Contenedor
                </label>
                <InputText
                  id="nroContenedor"
                  value={nroContenedor}
                  onChange={(e) =>
                    setNroContenedor(e.target.value.toUpperCase())
                  }
                  disabled={!camposEditables || readOnly}
                  style={{ width: "100%", textTransform: "uppercase" }}
                />
              </div>

              <div>
                <label htmlFor="fechaProduccion" style={{ fontWeight: "bold" }}>
                  Fecha Producción
                </label>
                <Calendar
                  id="fechaProduccion"
                  value={fechaProduccion}
                  onChange={(e) => setFechaProduccion(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading || !camposEditables || readOnly}
                />
              </div>

              <div>
                <label
                  htmlFor="fechaVencimiento"
                  style={{ fontWeight: "bold" }}
                >
                  Fecha Vencimiento
                </label>
                <Calendar
                  id="fechaVencimiento"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading || !camposEditables || readOnly}
                />
              </div>

              <div>
                <label htmlFor="fechaIngreso" style={{ fontWeight: "bold" }}>
                  Fecha Ingreso
                </label>
                <Calendar
                  id="fechaIngreso"
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading || !camposEditables || readOnly}
                />
              </div>
            </div>
          </Panel>

          <Divider />

          {/* Estados */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                htmlFor="estadoMercaderiaId"
                style={{ fontWeight: "bold" }}
              >
                Estado Mercadería
              </label>
              <Dropdown
                id="estadoMercaderiaId"
                value={estadoMercaderiaId}
                options={estadosMercaderiaOptions}
                onChange={(e) => setEstadoMercaderiaId(e.value)}
                placeholder="Seleccionar estado"
                disabled={loading || !camposEditables}
              />
            </div>

            <div>
              <label htmlFor="estadoCalidadId" style={{ fontWeight: "bold" }}>
                Estado Calidad
              </label>
              <Dropdown
                id="estadoCalidadId"
                value={estadoCalidadId}
                options={estadosCalidadOptions}
                onChange={(e) => setEstadoCalidadId(e.value)}
                placeholder="Seleccionar estado"
                disabled={loading || !camposEditables}
              />
            </div>
          </div>

          {/* Costo Unitario y Observaciones */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label htmlFor="costoUnitario" style={{ fontWeight: "bold" }}>
                Costo Unitario
              </label>
              <InputNumber
                id="costoUnitario"
                value={costoUnitario}
                onValueChange={(e) => setCostoUnitario(e.value)}
                mode="currency"
                currency="PEN"
                locale="es-PE"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
                Observaciones
              </label>
              <InputText
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value.toUpperCase())}
                style={{ width: "100%", textTransform: "uppercase" }}
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* Selector de Productos */}
      <ProductoSelectorDialog
        visible={showProductoSelector}
        onHide={() => setShowProductoSelector(false)}
        modo={modo}
        esCustodia={esCustodia}
        empresaId={movimientoAlmacen?.empresaId}
        clienteId={
          esCustodia
            ? movimientoAlmacen?.entidadComercialId
            : movimientoAlmacen?.empresa?.entidadComercialId
        }
        almacenId={
          modo === "ingreso"
            ? conceptoMovAlmacen?.almacenDestinoId
            : conceptoMovAlmacen?.almacenOrigenId
        }
        estadoMercaderiaDefault={6}
        estadoCalidadDefault={10}
        onSelect={handleProductoSeleccionado}
      />
    </>
  );
}
