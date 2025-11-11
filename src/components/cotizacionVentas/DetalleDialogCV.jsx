// src/components/cotizacionVentas/DetalleDialogCV.jsx
/**
 * Diálogo para agregar/editar detalles de Cotización de Ventas
 * Incluye TODOS los campos del modelo DetCotizacionVentas
 * 
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import ProductoSelectorDialog from "../movimientoAlmacen/ProductoSelectorDialog";
import {
  crearDetalleCotizacionVentas,
  actualizarDetalleCotizacionVentas,
} from "../../api/detalleCotizacionVentas";

export default function DetalleDialogCV({
  visible,
  onHide,
  detalle,
  cotizacionId,
  productos,
  empresaId,
  datosGenerales,
  empresas,
  centrosCosto = [],
  puedeEditarDetalles,
  onSaveSuccess,
  toast,
}) {
  const [formData, setFormData] = useState({
    productoId: null,
    cantidad: 0,
    pesoNeto: 0,
    costoUnitarioEstimado: 0,
    factorExportacionAplicado: 1,
    precioUnitario: 0,
    precioUnitarioFinal: 0,
    loteProduccion: "",
    fechaProduccion: null,
    fechaVencimiento: null,
    temperaturaAlmacenamiento: "",
    centroCostoId: null,
    descripcionAdicional: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Obtener entidadComercialId de la empresa seleccionada
  const empresaSeleccionada = empresas?.find((e) => Number(e.id) === Number(empresaId));
  const entidadComercialId = empresaSeleccionada?.entidadComercialId;

  useEffect(() => {
    if (detalle) {
      setFormData({
        productoId: detalle.productoId,
        cantidad: detalle.cantidad || 0,
        pesoNeto: detalle.pesoNeto || 0,
        costoUnitarioEstimado: detalle.costoUnitarioEstimado || 0,
        factorExportacionAplicado: detalle.factorExportacionAplicado || 1,
        precioUnitario: detalle.precioUnitario || 0,
        precioUnitarioFinal: detalle.precioUnitarioFinal || 0,
        loteProduccion: detalle.loteProduccion || "",
        fechaProduccion: detalle.fechaProduccion ? new Date(detalle.fechaProduccion) : null,
        fechaVencimiento: detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento) : null,
        temperaturaAlmacenamiento: detalle.temperaturaAlmacenamiento || "",
        centroCostoId: detalle.centroCostoId,
        descripcionAdicional: detalle.descripcionAdicional || "",
        observaciones: detalle.observaciones || "",
      });
      // Buscar el producto seleccionado
      const producto = productos.find((p) => Number(p.id) === Number(detalle.productoId));
      setProductoSeleccionado(producto || null);
    } else {
      setFormData({
        productoId: null,
        cantidad: 0,
        pesoNeto: 0,
        costoUnitarioEstimado: 0,
        factorExportacionAplicado: 1,
        precioUnitario: 0,
        precioUnitarioFinal: 0,
        loteProduccion: "",
        fechaProduccion: null,
        fechaVencimiento: null,
        temperaturaAlmacenamiento: "",
        centroCostoId: datosGenerales?.centroCostoId || null,
        descripcionAdicional: "",
        observaciones: "",
      });
      setProductoSeleccionado(null);
    }
    setShowProductoSelector(false);
  }, [detalle, visible, productos, datosGenerales]);

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    // Calcular peso automáticamente si hay producto seleccionado
    if (field === "cantidad" && productoSeleccionado && productoSeleccionado.unidadMedida) {
      const factorConversion = productoSeleccionado.unidadMedida.factorConversion;
      if (factorConversion) {
        const pesoCalculado = value * factorConversion;
        newFormData.pesoNeto = pesoCalculado;
      }
    }

    // Calcular precioUnitarioFinal automáticamente (cantidad × precioUnitario)
    if (field === "cantidad" || field === "precioUnitario") {
      const cantidad = field === "cantidad" ? value : newFormData.cantidad;
      const precio = field === "precioUnitario" ? value : newFormData.precioUnitario;
      newFormData.precioUnitarioFinal = cantidad * precio;
    }

    setFormData(newFormData);
  };

  const handleProductoSelect = (data) => {
    if (data) {
      const producto = data.producto || data;
      setProductoSeleccionado(producto);
      
      // Obtener costo del saldo (SaldosProductoCliente)
      const costoUnitario = data.saldo?.costoUnitarioPromedio || data.costoUnitarioPromedio || 0;
      
      // Actualizar formData con el producto y su costo del kardex
      setFormData(prev => ({
        ...prev,
        productoId: Number(producto.id),
        costoUnitarioEstimado: costoUnitario,
      }));
      
      setShowProductoSelector(false);
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (!formData.productoId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un producto",
      });
      return;
    }

    if (formData.cantidad <= 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "La cantidad debe ser mayor a 0",
      });
      return;
    }

    if (formData.precioUnitario <= 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "El precio unitario debe ser mayor a 0",
      });
      return;
    }

    if (!formData.centroCostoId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un centro de costo",
      });
      return;
    }

    setSaving(true);
    try {
      if (detalle) {
        await actualizarDetalleCotizacionVentas(detalle.id, formData);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        await crearDetalleCotizacionVentas({
          ...formData,
          cotizacionVentasId: cotizacionId,
        });
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Detalle creado correctamente",
        });
      }
      onSaveSuccess();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo guardar el detalle",
      });
    }
    setSaving(false);
  };

  return (
    <Dialog
      header={detalle ? "Editar Detalle" : "Nuevo Detalle"}
      visible={visible}
      style={{ width: "900px", maxHeight: "90vh" }}
      onHide={onHide}
      modal
    >
      <div className="p-fluid">
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
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#1976d2",
                      fontSize: "1.4em",
                      marginBottom: "12px",
                      lineHeight: "1.3",
                    }}
                  >
                    {productoSeleccionado.descripcionArmada ||
                      productoSeleccionado.nombre}
                  </div>
                  <div
                    style={{
                      fontSize: "1em",
                      color: "#333",
                      marginBottom: "6px",
                      fontWeight: "500",
                    }}
                  >
                    <strong>Unidad:</strong>{" "}
                    {productoSeleccionado.unidadMedida?.nombre || "-"}
                  </div>
                  {productoSeleccionado.unidadMedida?.factorConversion && (
                    <div
                      style={{
                        fontSize: "1em",
                        color: "#333",
                        fontWeight: "500",
                      }}
                    >
                      <strong>Factor Conv.:</strong>{" "}
                      {productoSeleccionado.unidadMedida.factorConversion}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex" }}>
                <div style={{ flex: 1 }}>
                  <Button
                    type="button"
                    label="Cambiar"
                    icon="pi pi-sync"
                    className="p-button-primary"
                    severity="primary"
                    raised
                    onClick={() => setShowProductoSelector(true)}
                    disabled={saving || !puedeEditarDetalles}
                  />
                </div>
              </div>
            </Panel>
          ) : (
            <Button
              type="button"
              label="Seleccionar Producto"
              icon="pi pi-search"
              className="p-button-primary"
              severity="primary"
              raised
              onClick={() => setShowProductoSelector(true)}
              disabled={saving || !puedeEditarDetalles}
            />
          )}
        </div>

        <ProductoSelectorDialog
          visible={showProductoSelector}
          onHide={() => setShowProductoSelector(false)}
          onSelect={handleProductoSelect}
          modo="transferencia"
          empresaId={empresaId}
          clienteId={entidadComercialId}
          esCustodia={false}
        />

        <Divider />

        {/* SECCIÓN: CANTIDADES Y PESOS */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="cantidad" style={{ fontWeight: "bold" }}>Cantidad *</label>
            <InputNumber
              id="cantidad"
              value={formData.cantidad}
              onValueChange={(e) => handleChange("cantidad", e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              min={0}
              required
              disabled={saving || !puedeEditarDetalles}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="pesoNeto" style={{ fontWeight: "bold" }}>Peso Neto (Kg) (Calculado automáticamente)</label>
            <InputNumber
              id="pesoNeto"
              value={formData.pesoNeto}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              min={0}
              disabled={true}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="unidad" style={{ fontWeight: "bold" }}>Unidad/Empaque</label>
            <InputText
              id="unidad"
              value={productoSeleccionado?.unidadMedida?.nombre || "-"}
              disabled
              style={{
                fontWeight: "bold",
                backgroundColor: "#f5f5f5",
              }}
            />
          </div>
        </div>

        <Divider />

        {/* SECCIÓN: PRECIOS */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="costoUnitarioEstimado" style={{ fontWeight: "bold" }}>Costo Unit. Estimado (Del Kardex)</label>
            <InputNumber
              id="costoUnitarioEstimado"
              value={formData.costoUnitarioEstimado}
              mode="currency"
              currency="PEN"
              locale="es-PE"
              min={0}
              disabled={true}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="factorExportacionAplicado" style={{ fontWeight: "bold" }}>Factor Exportación (Calculado)</label>
            <InputNumber
              id="factorExportacionAplicado"
              value={formData.factorExportacionAplicado}
              mode="decimal"
              minFractionDigits={6}
              maxFractionDigits={6}
              min={0}
              disabled={true}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="precioUnitario" style={{ fontWeight: "bold" }}>Precio Unit. Venta *</label>
            <InputNumber
              id="precioUnitario"
              value={formData.precioUnitario}
              onValueChange={(e) => handleChange("precioUnitario", e.value)}
              mode="currency"
              currency="PEN"
              locale="es-PE"
              min={0}
              disabled={saving || !puedeEditarDetalles}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="precioUnitarioFinal" style={{ fontWeight: "bold" }}>Precio Total Venta</label>
            <InputNumber
              id="precioUnitarioFinal"
              value={formData.precioUnitarioFinal}
              mode="currency"
              currency="PEN"
              locale="es-PE"
              disabled
              inputStyle={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
            />
          </div>
        </div>

        <Divider />

        {/* SECCIÓN: TRAZABILIDAD */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="loteProduccion" style={{ fontWeight: "bold" }}>Lote Producción</label>
            <InputText
              id="loteProduccion"
              value={formData.loteProduccion}
              onChange={(e) => handleChange("loteProduccion", e.target.value)}
              maxLength={50}
              disabled={saving || !puedeEditarDetalles}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="temperaturaAlmacenamiento" style={{ fontWeight: "bold" }}>Temperatura Almacenamiento</label>
            <InputText
              id="temperaturaAlmacenamiento"
              value={formData.temperaturaAlmacenamiento}
              onChange={(e) => handleChange("temperaturaAlmacenamiento", e.target.value)}
              maxLength={50}
              placeholder="Ej: -18°C"
              disabled={saving || !puedeEditarDetalles}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaProduccion" style={{ fontWeight: "bold" }}>Fecha Producción</label>
            <Calendar
              id="fechaProduccion"
              value={formData.fechaProduccion}
              onChange={(e) => handleChange("fechaProduccion", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={saving || !puedeEditarDetalles}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>Fecha Vencimiento</label>
            <Calendar
              id="fechaVencimiento"
              value={formData.fechaVencimiento}
              onChange={(e) => handleChange("fechaVencimiento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={saving || !puedeEditarDetalles}
            />
          </div>
        </div>

        <Divider />

        {/* SECCIÓN: CENTRO DE COSTO */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="centroCostoId" style={{ fontWeight: "bold" }}>Centro de Costo *</label>
          <Dropdown
            id="centroCostoId"
            value={formData.centroCostoId}
            options={centrosCosto.map((c) => ({
              label: c.nombre || c.descripcion,
              value: Number(c.id),
            }))}
            onChange={(e) => handleChange("centroCostoId", e.value)}
            placeholder="Seleccionar centro de costo"
            filter
            showClear
            disabled={saving || !puedeEditarDetalles}
          />
        </div>

        <Divider />

        {/* SECCIÓN: DESCRIPCIONES */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="descripcionAdicional" style={{ fontWeight: "bold" }}>
            Descripción Adicional
          </label>
          <InputTextarea
            id="descripcionAdicional"
            value={formData.descripcionAdicional}
            onChange={(e) => handleChange("descripcionAdicional", e.target.value)}
            rows={2}
            disabled={saving || !puedeEditarDetalles}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={3}
            disabled={saving}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={onHide}
            disabled={saving}
            className="p-button-warning"
            severity="warning"
            size="small"
            outlined
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving}
            disabled={!puedeEditarDetalles}
            className="p-button-success"
            severity="success"
            size="small"
            outlined
          />
        </div>
      </div>
    </Dialog>
  );
}