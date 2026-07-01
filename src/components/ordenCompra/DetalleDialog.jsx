// src/components/ordenCompra/DetalleDialog.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import {
  ProductoSelectorDialog,
  ProductoSelectedDisplay,
} from "../common/productoSelectorConStock";
import {
  crearDetalleOrdenCompra,
  actualizarDetalleOrdenCompra,
} from "../../api/detalleOrdenCompra";

export default function DetalleDialog({
  visible,
  onHide,
  detalle,
  ordenCompraId,
  empresaId,
  entidadComercialId,
  productos,
  datosGenerales,
  empresas,
  porcentajeIGV = 0,        // ⭐ NUEVO: Recibir como prop separado
  esExoneradoIGV = false,   // ⭐ NUEVO: Recibir como prop separado
  puedeEditarDetalles,
  onSaveSuccess,
  toast,
}) {
  const [formData, setFormData] = useState({
    productoId: null,
    cantidad: 1,
    valorUnitarioSinIGV: 0,
    precioUnitarioConIGV: 0,
    precioUnitario: 0,
    subtotal: 0,
    observaciones: "",
    cantidadCompra: null,
    precioUnitarioCompra: null,
  });

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usarUnidadComercial, setUsarUnidadComercial] = useState(false);

  useEffect(() => {
    if (visible) {
      if (detalle) {
        // EDICIÓN: Cargar datos existentes
        const tieneUnidadComercial = !!(detalle.cantidadCompra && detalle.precioUnitarioCompra);
        const valorSinIGV = Number(detalle.precioUnitario || 0); // ⭐ BD guarda SIN IGV
        const precioConIGV = esExoneradoIGV
          ? valorSinIGV
          : valorSinIGV * (1 + porcentajeIGV / 100);

        setFormData({
          productoId: detalle.productoId,
          cantidad: Number(detalle.cantidad || 1),
          valorUnitarioSinIGV: valorSinIGV,
          precioUnitarioConIGV: precioConIGV,
          precioUnitario: valorSinIGV, // ⭐ Para consistencia
          subtotal: Number(detalle.cantidad || 1) * valorSinIGV,
          observaciones: detalle.observaciones || "",
          cantidadCompra: detalle.cantidadCompra ? Number(detalle.cantidadCompra) : null,
          precioUnitarioCompra: detalle.precioUnitarioCompra ? Number(detalle.precioUnitarioCompra) : null,
        });

        setUsarUnidadComercial(tieneUnidadComercial);

        // Buscar producto seleccionado
        const producto = productos.find(
          (p) => Number(p.id) === Number(detalle.productoId)
        );
        setProductoSeleccionado(producto || null);
      } else {
        // NUEVO: Resetear formulario
        setFormData({
          productoId: null,
          cantidad: 1,
          valorUnitarioSinIGV: 0,
          precioUnitarioConIGV: 0,
          precioUnitario: 0,
          subtotal: 0,
          observaciones: "",
          cantidadCompra: null,
          precioUnitarioCompra: null,
        });
        setProductoSeleccionado(null);
        setUsarUnidadComercial(false);
      }
    }
  }, [visible, detalle, productos, porcentajeIGV, esExoneradoIGV]);

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    // ⭐ LÓGICA DE RECÁLCULO SEGÚN MODO
    if (usarUnidadComercial) {
      // Modo comercial: solo actualizar el campo, el subtotal se calcula en render
      // No hay cálculos adicionales necesarios
    } else {
      // Modo almacén: lógica bidireccional con IGV
      if (field === "valorUnitarioSinIGV") {
        // Usuario cambió VALOR SIN IGV → Calcular PRECIO CON IGV
        const valorSinIGV = Number(value || 0);
        const precioConIGV = esExoneradoIGV
          ? valorSinIGV
          : valorSinIGV * (1 + porcentajeIGV / 100);

        newFormData.precioUnitarioConIGV = precioConIGV;
        newFormData.precioUnitario = precioConIGV; // Este se guarda en BD
        newFormData.subtotal = newFormData.cantidad * precioConIGV;
      } else if (field === "precioUnitarioConIGV") {
        // Usuario cambió PRECIO CON IGV → Calcular VALOR SIN IGV
        const precioConIGV = Number(value || 0);
        const valorSinIGV = esExoneradoIGV
          ? precioConIGV
          : precioConIGV / (1 + porcentajeIGV / 100);

        newFormData.valorUnitarioSinIGV = valorSinIGV;
        newFormData.precioUnitario = precioConIGV; // Este se guarda en BD
        newFormData.subtotal = newFormData.cantidad * precioConIGV;
      } else if (field === "cantidad") {
        // Usuario cambió CANTIDAD → Recalcular SUBTOTAL
        const cantidad = Number(value || 0);
        const precio = newFormData.precioUnitarioConIGV;
        newFormData.subtotal = cantidad * precio;
      }
    }

    setFormData(newFormData);
  };

  const handleProductoSelect = (data) => {
    if (data) {
      // ProductoSelectorDialog retorna {tipo, productoId, producto}
      const productoId = Number(data.productoId);
      const producto = data.producto;

      // El producto ya viene con todas las relaciones (familia, subfamilia, etc.)
      setProductoSeleccionado(producto);
      handleChange("productoId", productoId);
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
        life: 3000,
      });
      return;
    }

    // Validar según modo
    if (usarUnidadComercial) {
      if (!formData.cantidadCompra || formData.cantidadCompra <= 0) {
        toast.current.show({
          severity: "warn",
          summary: "Validación",
          detail: "La cantidad comercial debe ser mayor a 0",
          life: 3000,
        });
        return;
      }

      if (!formData.precioUnitarioCompra || formData.precioUnitarioCompra <= 0) {
        toast.current.show({
          severity: "warn",
          summary: "Validación",
          detail: "El precio comercial debe ser mayor a 0",
          life: 3000,
        });
        return;
      }
    } else {
      if (!formData.cantidad || formData.cantidad <= 0) {
        toast.current.show({
          severity: "warn",
          summary: "Validación",
          detail: "La cantidad debe ser mayor a 0",
          life: 3000,
        });
        return;
      }

      if (!formData.valorUnitarioSinIGV || formData.valorUnitarioSinIGV <= 0) {
        toast.current.show({
          severity: "warn",
          summary: "Validación",
          detail: "El precio debe ser mayor a 0",
          life: 3000,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const dataToSave = {
        ordenCompraId: Number(ordenCompraId),
        productoId: Number(formData.productoId),
        observaciones: formData.observaciones || null,
      };

      // Agregar datos según modo
      if (usarUnidadComercial) {
        dataToSave.cantidadCompra = Number(formData.cantidadCompra);
        dataToSave.precioUnitarioCompra = Number(formData.precioUnitarioCompra);
      } else {
        dataToSave.cantidad = Number(formData.cantidad);
        dataToSave.precioUnitario = Number(formData.valorUnitarioSinIGV);
      }

      if (detalle) {
        await actualizarDetalleOrdenCompra(detalle.id, dataToSave);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        await crearDetalleOrdenCompra(dataToSave);
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
        life: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Obtener código de moneda
  const getCodigoMoneda = () => {
    if (!datosGenerales?.monedaId || !empresas) return "";
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(datosGenerales.empresaId)
    );
    return empresa?.moneda?.codigo || "";
  };

  const codigoMoneda = getCodigoMoneda();

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
        <ProductoSelectedDisplay
          producto={productoSeleccionado}
          onChangeClick={() => setShowProductoSelector(true)}
          disabled={saving || !puedeEditarDetalles}
          label="Producto *"
        />

        <ProductoSelectorDialog
          visible={showProductoSelector}
          onHide={() => setShowProductoSelector(false)}
          onSelect={handleProductoSelect}
          modo="ingreso"
          empresaId={empresaId}
          propietarioStockId={entidadComercialId}
          almacenId={null}
          esCustodia={false}
          soloConSaldo={false}
          productoIdSeleccionado={formData.productoId} // ⭐ NUEVO: Pasar producto seleccionado
        />
        {/* Checkbox para usar unidad comercial */}
        {formData.productoId && productoSeleccionado?.unidadMedidaComercialId && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Checkbox
              inputId="usarComercial"
              checked={usarUnidadComercial}
              onChange={(e) => setUsarUnidadComercial(e.checked)}
              disabled={saving || !puedeEditarDetalles}
            />
            <label htmlFor="usarComercial" style={{ fontWeight: "bold" }}>
              Usar Unidad Comercial ({productoSeleccionado?.unidadMedidaComercial?.simbolo})
            </label>
          </div>
        )}
        {/* Cantidad y Unidad */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {usarUnidadComercial ? (
            <>
              <div style={{ flex: 1 }}>
                <label htmlFor="cantidadCompra">
                  Cantidad ({productoSeleccionado?.unidadMedidaComercial?.simbolo}) *
                </label>
                <InputNumber
                  id="cantidadCompra"
                  value={formData.cantidadCompra}
                  onValueChange={(e) => handleChange("cantidadCompra", e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={3}
                  min={0}
                  disabled={saving || !puedeEditarDetalles}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="unidadComercial">Unidad Comercial</label>
                <InputText
                  id="unidadComercial"
                  value={productoSeleccionado?.unidadMedidaComercial?.nombre || "-"}
                  disabled
                  style={{ textTransform: "uppercase" }}
                />
              </div>
            </>
          ) : (
            <>
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
                  disabled={saving || !puedeEditarDetalles}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="unidad">Unidad/Empaque</label>
                <InputText
                  id="unidad"
                  value={productoSeleccionado?.unidadMedida?.nombre || "-"}
                  disabled
                  style={{ textTransform: "uppercase" }}
                />
              </div>
            </>
          )}
        </div>

        {/* Campos de Precio según modo */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {usarUnidadComercial ? (
            <>
              <div style={{ flex: 1 }}>
                <label htmlFor="precioUnitarioCompra">
                  Precio Unitario ({productoSeleccionado?.unidadMedidaComercial?.simbolo}) *
                </label>
                <InputNumber
                  id="precioUnitarioCompra"
                  value={formData.precioUnitarioCompra}
                  onValueChange={(e) => handleChange("precioUnitarioCompra", e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={6}
                  min={0}
                  prefix={codigoMoneda ? `${codigoMoneda} ` : ""}
                  disabled={saving || !puedeEditarDetalles}
                  style={{
                    backgroundColor: "#e3f2fd",
                    fontWeight: "bold"
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="subtotalComercial">📊 Subtotal</label>
                <InputNumber
                  id="subtotalComercial"
                  value={formData.cantidadCompra && formData.precioUnitarioCompra
                    ? Number(formData.cantidadCompra) * Number(formData.precioUnitarioCompra)
                    : 0}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  prefix={codigoMoneda ? `${codigoMoneda} ` : ""}
                  disabled
                  style={{
                    backgroundColor: "#f5f5f5",
                    fontWeight: "bold",
                    fontSize: "1.1em"
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <label htmlFor="valorUnitarioSinIGV">
                  💰 V.C.Unit.
                </label>
                <InputNumber
                  id="valorUnitarioSinIGV"
                  value={formData.valorUnitarioSinIGV}
                  onValueChange={(e) => handleChange("valorUnitarioSinIGV", e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={6}
                  min={0}
                  prefix={codigoMoneda ? `${codigoMoneda} ` : ""}
                  disabled={saving || !puedeEditarDetalles}
                  style={{
                    backgroundColor: esExoneradoIGV ? "#fff3cd" : "#e3f2fd",
                    fontWeight: "bold"
                  }}
                />
              </div>
              {/* ⭐ NUEVO: Precio Unitario CON IGV */}
              {!esExoneradoIGV && (
                <div style={{ flex: 1 }}>
                  <label htmlFor="precioUnitarioConIGV">
                    💵 P.C.Unit.
                  </label>
                  <InputNumber
                    id="precioUnitarioConIGV"
                    value={formData.precioUnitarioConIGV}
                    onValueChange={(e) => handleChange("precioUnitarioConIGV", e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={6}
                    min={0}
                    prefix={codigoMoneda ? `${codigoMoneda} ` : ""}
                    disabled={saving || !puedeEditarDetalles}
                    style={{
                      backgroundColor: "#e8f5e9",
                      fontWeight: "bold"
                    }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label htmlFor="subtotal">📊 P.Venta</label>
                <InputNumber
                  id="subtotal"
                  value={formData.subtotal}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  prefix={codigoMoneda ? `${codigoMoneda} ` : ""}
                  disabled
                  style={{
                    backgroundColor: "#f5f5f5",
                    fontWeight: "bold",
                    fontSize: "1.1em"
                  }}
                />
              </div>
            </>
          )}
        </div>

        <Divider />

        {/* Observaciones */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="observaciones">Observaciones</label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={3}
            disabled={saving || !puedeEditarDetalles}
          />
        </div>

        {/* Botones */}
        <div className="p-d-flex p-jc-end" style={{ gap: "0.5rem" }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={onHide}
            disabled={saving}
            className="p-button-secondary"
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving}
            disabled={!puedeEditarDetalles}
            className="p-button-success"
          />
        </div>
      </div>
    </Dialog>
  );
}