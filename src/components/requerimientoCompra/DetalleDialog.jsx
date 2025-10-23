// src/components/requerimientoCompra/DetalleDialog.jsx
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
  crearDetalleReqCompra,
  actualizarDetalleReqCompra,
} from "../../api/detalleReqCompra";

export default function DetalleDialog({
  visible,
  onHide,
  detalle,
  requerimientoId,
  productos,
  empresaId,
  datosGenerales,
  onSaveSuccess,
  toast,
}) {
  const [formData, setFormData] = useState({
    productoId: null,
    cantidad: 0,
    costoUnitario: 0,
    subtotal: 0,
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  useEffect(() => {
    if (detalle) {
      setFormData({
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        costoUnitario: detalle.costoUnitario,
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
        costoUnitario: 0,
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
    if (field === "cantidad" || field === "costoUnitario") {
      const cantidad = field === "cantidad" ? value : newFormData.cantidad;
      const costo =
        field === "costoUnitario" ? value : newFormData.costoUnitario;
      newFormData.subtotal = cantidad * costo;
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

    if (formData.costoUnitario <= 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "El costo unitario debe ser mayor a 0",
      });
      return;
    }

    setSaving(true);
    try {
      if (detalle) {
        await actualizarDetalleReqCompra(detalle.id, formData);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        await crearDetalleReqCompra({
          ...formData,
          requerimientoCompraId: requerimientoId,
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
                  {/* Descripción Armada en grande */}
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

                  {/* Unidad de Empaque */}
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

                  {/* Factor de Conversión */}
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
              <div
                style={{
                  display: "flex",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Button
                    type="button"
                    label="Cambiar"
                    icon="pi pi-sync"
                    className="p-button-primary"
                    severity="primary"
                    raised
                    onClick={() => setShowProductoSelector(true)}
                    disabled={saving}
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
              disabled={saving}
            />
          )}
        </div>

        <ProductoSelectorDialog
          visible={showProductoSelector}
          onHide={() => setShowProductoSelector(false)}
          onSelect={handleProductoSelect}
          modo="ingreso"
          empresaId={empresaId}
          clienteId={datosGenerales.empresa?.entidadComercialId} // Productos de la empresa, no del proveedor
          esCustodia={false} // Requerimiento de compra siempre es mercadería propia
        />

        <Divider />

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
              disabled={saving}
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
            <label htmlFor="costoUnitario">Precio Unit. Compra *</label>
            <InputNumber
              id="costoUnitario"
              value={formData.costoUnitario}
              onValueChange={(e) => handleChange("costoUnitario", e.value)}
              mode="currency"
              currency="PEN"
              locale="es-PE"
              min={0}
              disabled={saving}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="subtotal">Precio Compra</label>
            <InputNumber
              id="subtotal"
              value={formData.subtotal}
              mode="currency"
              currency="PEN"
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
