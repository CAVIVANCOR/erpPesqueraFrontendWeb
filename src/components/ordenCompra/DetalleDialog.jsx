// src/components/ordenCompra/DetalleDialog.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import ProductoSelectorDialog from "../movimientoAlmacen/ProductoSelectorDialog";
import {
  crearDetalleOrdenCompra,
  actualizarDetalleOrdenCompra,
} from "../../api/detalleOrdenCompra";

export default function DetalleDialog({
  visible,
  onHide,
  detalle,
  ordenCompraId,
  productos,
  empresaId,
  datosGenerales,
  empresas,
  puedeEditarDetalles,
  onSaveSuccess,
  toast,
}) {
  const [formData, setFormData] = useState({
    productoId: null,
    cantidad: 0,
    precioUnitario: 0,
    subtotal: 0,
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Obtener entidadComercialId de la empresa seleccionada
  const empresaSeleccionada = empresas?.find(
    (e) => Number(e.id) === Number(empresaId)
  );
  const entidadComercialId = empresaSeleccionada?.entidadComercialId;

  // Obtener código de moneda de la cabecera (datosGenerales.moneda)
  const codigoMoneda = datosGenerales?.moneda?.codigoSunat || "PEN";

  useEffect(() => {
    if (detalle) {
      setFormData({
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal,
        observaciones: detalle.observaciones || "",
      });
      // Buscar el producto seleccionado
      const producto = productos.find(
        (p) => Number(p.id) === Number(detalle.productoId)
      );
      setProductoSeleccionado(producto || null);
    } else {
      setFormData({
        productoId: null,
        cantidad: 0,
        precioUnitario: 0,
        subtotal: 0,
        observaciones: "",
      });
      setProductoSeleccionado(null);
    }
    setShowProductoSelector(false);
  }, [detalle, visible, productos]);

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    // Calcular subtotal automáticamente
    if (field === "cantidad" || field === "precioUnitario") {
      const cantidad = field === "cantidad" ? value : newFormData.cantidad;
      const precio =
        field === "precioUnitario" ? value : newFormData.precioUnitario;
      newFormData.subtotal = cantidad * precio;
    }

    setFormData(newFormData);
  };

  const handleProductoSelect = (data) => {
    if (data) {
      // ProductoSelectorDialog retorna un objeto con estructura {tipo, productoId, producto}
      const producto = data.producto || data; // Compatibilidad con ambos formatos
      setProductoSeleccionado(producto);
      handleChange("productoId", Number(producto.id));
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

    setSaving(true);
    try {
      if (detalle) {
        await actualizarDetalleOrdenCompra(detalle.id, formData);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        await crearDetalleOrdenCompra({
          ...formData,
          ordenCompraId,
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
      style={{ width: "800px" }}
      onHide={onHide}
      modal
    >
      <div className="p-fluid">
        {/* Selección de Producto */}
        {productoSeleccionado ? (
          <Panel
            header="Producto/Servicio Seleccionado"
            style={{ marginBottom: "1rem" }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 4 }}>
                {/* Descripción Armada en grande */}
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#1976d2",
                    fontSize: "1.4em",
                    lineHeight: "1.3",
                  }}
                >
                  {productoSeleccionado.descripcionArmada}
                </div>

                {/* Unidad de Empaque */}
                <div>
                  <strong>Unidad:</strong>{" "}
                  {productoSeleccionado.unidadMedida?.nombre || "-"}
                  {/* Factor de Conversión */}
                  {productoSeleccionado.unidadMedida?.factorConversion && (
                    <div>
                      <strong>Factor Conv.:</strong>{" "}
                      {productoSeleccionado.unidadMedida.factorConversion}
                    </div>
                  )}
                </div>
              </div>
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
          <Panel header="Seleccionar Producto" style={{ marginBottom: "1rem" }}>
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
          </Panel>
        )}

        <ProductoSelectorDialog
          visible={showProductoSelector}
          onHide={() => setShowProductoSelector(false)}
          onSelect={handleProductoSelect}
          modo="ingreso"
          empresaId={empresaId}
          clienteId={entidadComercialId}
          esCustodia={false}
        />
        {/* Primera fila: Cantidad y Unidad */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="cantidad">Cantidad *</label>
            <InputNumber
              id="cantidad"
              value={formData.cantidad}
              onValueChange={(e) => handleChange("cantidad", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              required
              disabled={saving || !puedeEditarDetalles}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="unidad">Unidad/Empaque</label>
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

        {/* Segunda fila: Precio Compra y Precio Unit. Compra */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="precioUnitario">Precio Unit. Compra *</label>
            <InputNumber
              id="precioUnitario"
              value={formData.precioUnitario}
              onValueChange={(e) => handleChange("precioUnitario", e.value)}
              mode="currency"
              currency={codigoMoneda}
              locale="es-PE"
              min={0}
              disabled={saving || !puedeEditarDetalles}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="subtotal">Precio Compra</label>
            <InputNumber
              id="subtotal"
              value={formData.subtotal}
              mode="currency"
              currency={codigoMoneda}
              locale="es-PE"
              disabled
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
        </div>

        <Divider />

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={2}
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