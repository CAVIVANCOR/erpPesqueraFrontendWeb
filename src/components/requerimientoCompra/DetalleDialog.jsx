// src/components/requerimientoCompra/DetalleDialog.jsx
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
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
  empresas,
  proveedores = [],
  puedeEditarDetalles,
  onSaveSuccess,
  toast,
}) {
  const [formData, setFormData] = useState({
    productoId: null,
    proveedorId: null,
    cantidad: 0,
    costoUnitario: 0,
    subtotal: 0,
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const costoUnitarioInputRef = useRef(null);

  // Obtener entidadComercialId de la empresa seleccionada
  const empresaSeleccionada = empresas?.find(
    (e) => Number(e.id) === Number(empresaId),
  );
  const entidadComercialId = empresaSeleccionada?.entidadComercialId;

  // Obtener código de moneda de la cabecera (datosGenerales.moneda)
  const codigoMoneda = datosGenerales?.moneda?.codigoSunat || "PEN";

  // Obtener familiaId desde la relación completa tipoProducto.subfamilia.familia
  const familiaProductoId =
    datosGenerales?.tipoProducto?.subfamilia?.familiaId || null;

  // ✅ NUEVO: Determinar si se debe mostrar el dropdown de Proveedor
  // Solo se muestra si esConCotizacion = true (Con Cotización)
  const mostrarDropdownProveedor = datosGenerales?.esConCotizacion === true;

  // Crear lista de opciones de proveedores
  const proveedoresOptions = React.useMemo(() => {
    const opciones = proveedores.map((p) => ({
      label: `${p.razonSocial} - ${p.empresa?.razonSocial || 'Sin Empresa'}`,
      value: Number(p.id),
    }));

    // Si hay un detalle con proveedor y ese proveedor no está en la lista
    if (detalle?.proveedor) {
      const proveedorId = Number(detalle.proveedor.id);
      const yaExiste = opciones.some((opt) => opt.value === proveedorId);
      
      if (!yaExiste) {
        opciones.unshift({
          label: `${detalle.proveedor.razonSocial} - ${detalle.proveedor.empresa?.razonSocial || 'Sin Empresa'}`,
          value: proveedorId,
        });
      }
    }

    return opciones;
  }, [proveedores, detalle]);

  useEffect(() => {
    if (detalle) {
      const proveedorIdNumber = detalle.proveedorId ? Number(detalle.proveedorId) : null;
      
      setFormData({
        productoId: detalle.productoId,
        proveedorId: proveedorIdNumber,
        cantidad: detalle.cantidad,
        costoUnitario: detalle.costoUnitario,
        subtotal: detalle.subtotal,
        observaciones: detalle.observaciones || "",
      });
      // Buscar el producto seleccionado
      const producto = productos.find(
        (p) => Number(p.id) === Number(detalle.productoId),
      );
      setProductoSeleccionado(producto || null);
    } else {
      setFormData({
        productoId: null,
        proveedorId: null,
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
      const producto = data.producto || data;

      setProductoSeleccionado(producto);

      // Auto-poner cantidad = 1 cuando es un servicio
      const esFamiliaServicios =
        Number(producto.subfamilia?.familiaId) === 5 ||
        Number(producto.familia?.id) === 5;

      if (esFamiliaServicios) {
        setFormData((prev) => ({
          ...prev,
          productoId: Number(producto.id),
          cantidad: 1,
          subtotal: 1 * prev.costoUnitario,
        }));

        // Posicionar foco en Precio Unit. Compra
        setTimeout(() => {
          if (costoUnitarioInputRef.current) {
            const inputElement = costoUnitarioInputRef.current.getInput();
            if (inputElement) {
              inputElement.focus();
              inputElement.select();
            }
          }
        }, 100);
      } else {
        handleChange("productoId", Number(producto.id));
      }

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
          <Panel
            header="Seleccionar Producto ó Servicio"
            style={{ marginBottom: "1rem" }}
          >
            <Button
              type="button"
              label="Seleccionar Producto / Servicio"
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
          familiaProductoId={familiaProductoId}
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
            <label htmlFor="costoUnitario">Precio Unit. Compra *</label>
            <InputNumber
              ref={costoUnitarioInputRef}
              id="costoUnitario"
              value={formData.costoUnitario}
              onValueChange={(e) => handleChange("costoUnitario", e.value)}
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

        {/* ✅ NUEVO: Campo Proveedor - Solo se muestra si esConCotizacion = true */}
        {mostrarDropdownProveedor && (
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="proveedorId" style={{ fontWeight: "bold" }}>
              Proveedor (Asignado desde Cotizaciones)
            </label>
            <Dropdown
              id="proveedorId"
              value={formData.proveedorId}
              options={proveedoresOptions}
              onChange={(e) => handleChange("proveedorId", e.value)}
              placeholder="Sin proveedor asignado"
              disabled={true} // SIEMPRE deshabilitado - se asigna desde Card Cotizaciones
              style={{
                fontWeight: "bold",
                backgroundColor: "#f0f0f0", // Fondo gris para indicar campo bloqueado
              }}
            />
            <small style={{ color: "#666", fontStyle: "italic", display: "block", marginTop: "4px" }}>
              El proveedor se asigna automáticamente al concluir las cotizaciones
            </small>
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
            Descripcion Detallada
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