/**
 * Card de Detalle de Productos para Cotización de Ventas
 * 
 * Funcionalidades:
 * - DataTable con productos cotizados
 * - Agregar/Editar/Eliminar productos
 * - Cálculo automático de precios con factor de exportación
 * - Cálculo de totales
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { confirmDialog } from "primereact/confirmdialog";
import { getProductos } from "../../api/producto";

const DetCotizacionVentasCard = ({
  cotizacionId,
  detalles,
  setDetalles,
  toast,
}) => {
  const [productos, setProductos] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados del formulario de detalle
  const [productoId, setProductoId] = useState(null);
  const [cantidad, setCantidad] = useState(0);
  const [pesoNeto, setPesoNeto] = useState(0);
  const [costoUnitarioEstimado, setCostoUnitarioEstimado] = useState(0);
  const [factorExportacionAplicado, setFactorExportacionAplicado] = useState(1.0);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [precioUnitarioFinal, setPrecioUnitarioFinal] = useState(0);
  const [descripcionAdicional, setDescripcionAdicional] = useState("");
  const [loteProduccion, setLoteProduccion] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  // Calcular precio unitario cuando cambian costo o factor
  useEffect(() => {
    const precio = costoUnitarioEstimado * factorExportacionAplicado;
    setPrecioUnitario(precio);
    setPrecioUnitarioFinal(precio); // Aquí se aplicaría margen de utilidad
  }, [costoUnitarioEstimado, factorExportacionAplicado]);

  const cargarProductos = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar productos",
        life: 3000,
      });
    }
  };

  const abrirDialogoNuevo = () => {
    limpiarFormulario();
    setEditingDetalle(null);
    setShowDialog(true);
  };

  const abrirDialogoEditar = (detalle) => {
    setEditingDetalle(detalle);
    setProductoId(detalle.productoId);
    setCantidad(detalle.cantidad);
    setPesoNeto(detalle.pesoNeto || 0);
    setCostoUnitarioEstimado(detalle.costoUnitarioEstimado || 0);
    setFactorExportacionAplicado(detalle.factorExportacionAplicado || 1.0);
    setPrecioUnitario(detalle.precioUnitario);
    setPrecioUnitarioFinal(detalle.precioUnitarioFinal);
    setDescripcionAdicional(detalle.descripcionAdicional || "");
    setLoteProduccion(detalle.loteProduccion || "");
    setObservaciones(detalle.observaciones || "");
    setShowDialog(true);
  };

  const limpiarFormulario = () => {
    setProductoId(null);
    setCantidad(0);
    setPesoNeto(0);
    setCostoUnitarioEstimado(0);
    setFactorExportacionAplicado(1.0);
    setPrecioUnitario(0);
    setPrecioUnitarioFinal(0);
    setDescripcionAdicional("");
    setLoteProduccion("");
    setObservaciones("");
  };

  const handleGuardarDetalle = () => {
    if (!productoId || cantidad <= 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un producto y cantidad mayor a 0",
        life: 3000,
      });
      return;
    }

    const producto = productos.find((p) => Number(p.id) === Number(productoId));
    
    const nuevoDetalle = {
      id: editingDetalle?.id || Date.now(),
      item: editingDetalle?.item || detalles.length + 1,
      productoId: Number(productoId),
      producto: producto,
      cantidad: Number(cantidad),
      pesoNeto: Number(pesoNeto),
      costoUnitarioEstimado: Number(costoUnitarioEstimado),
      factorExportacionAplicado: Number(factorExportacionAplicado),
      precioUnitario: Number(precioUnitario),
      precioUnitarioFinal: Number(precioUnitarioFinal),
      descripcionAdicional: descripcionAdicional?.trim() || null,
      loteProduccion: loteProduccion?.trim() || null,
      observaciones: observaciones?.trim() || null,
    };

    if (editingDetalle) {
      // Actualizar existente
      const nuevosDetalles = detalles.map((d) =>
        d.id === editingDetalle.id ? nuevoDetalle : d
      );
      setDetalles(nuevosDetalles);
      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Detalle actualizado correctamente",
        life: 3000,
      });
    } else {
      // Agregar nuevo
      setDetalles([...detalles, nuevoDetalle]);
      toast.current?.show({
        severity: "success",
        summary: "Agregado",
        detail: "Detalle agregado correctamente",
        life: 3000,
      });
    }

    setShowDialog(false);
    limpiarFormulario();
  };

  const confirmarEliminar = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el producto ${detalle.producto?.nombre}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarDetalle(detalle),
    });
  };

  const eliminarDetalle = (detalle) => {
    const nuevosDetalles = detalles.filter((d) => d.id !== detalle.id);
    // Reordenar items
    const detallesReordenados = nuevosDetalles.map((d, index) => ({
      ...d,
      item: index + 1,
    }));
    setDetalles(detallesReordenados);
    toast.current?.show({
      severity: "success",
      summary: "Eliminado",
      detail: "Detalle eliminado correctamente",
      life: 3000,
    });
  };

  // Templates para columnas
  const itemTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.item}</span>;
  };

  const productoTemplate = (rowData) => {
    return <span>{rowData.producto?.nombre || "N/A"}</span>;
  };

  const cantidadTemplate = (rowData) => {
    return <span>{rowData.cantidad.toFixed(3)}</span>;
  };

  const precioTemplate = (rowData) => {
    return <span>$ {rowData.precioUnitarioFinal.toFixed(2)}</span>;
  };

  const subtotalTemplate = (rowData) => {
    const subtotal = rowData.cantidad * rowData.precioUnitarioFinal;
    return <span style={{ fontWeight: "bold" }}>$ {subtotal.toFixed(2)}</span>;
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => abrirDialogoEditar(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "bottom" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminar(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "bottom" }}
        />
      </div>
    );
  };

  // Calcular totales
  const calcularTotales = () => {
    const subtotal = detalles.reduce(
      (sum, d) => sum + d.cantidad * d.precioUnitarioFinal,
      0
    );
    return {
      subtotal: subtotal.toFixed(2),
      cantidadItems: detalles.length,
    };
  };

  const totales = calcularTotales();

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-secondary"
        onClick={() => setShowDialog(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-success"
        onClick={handleGuardarDetalle}
        loading={loading}
      />
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Detalle de Productos</h3>
        <Button
          label="Agregar Producto"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirDialogoNuevo}
          disabled={!cotizacionId}
        />
      </div>

      {!cotizacionId && (
        <div className="p-message p-message-info" style={{ marginBottom: "1rem" }}>
          <span>Debe guardar primero los datos generales para agregar productos</span>
        </div>
      )}

      <DataTable
        value={detalles}
        emptyMessage="No hay productos agregados"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="item" header="Item" body={itemTemplate} style={{ width: "80px" }} />
        <Column field="producto.nombre" header="Producto" body={productoTemplate} />
        <Column field="cantidad" header="Cantidad" body={cantidadTemplate} style={{ width: "120px" }} />
        <Column field="pesoNeto" header="Peso Neto" style={{ width: "120px" }} />
        <Column field="precioUnitarioFinal" header="Precio Unit." body={precioTemplate} style={{ width: "120px" }} />
        <Column header="Subtotal" body={subtotalTemplate} style={{ width: "130px" }} />
        <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
      </DataTable>

      {/* Totales */}
      {detalles.length > 0 && (
        <div style={{ marginTop: "1rem", textAlign: "right", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
          <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            <strong>Items:</strong> {totales.cantidadItems}
          </div>
          <div style={{ fontSize: "1.3rem", color: "#2196F3", fontWeight: "bold" }}>
            <strong>SUBTOTAL:</strong> $ {totales.subtotal}
          </div>
        </div>
      )}

      {/* Dialog para agregar/editar detalle */}
      <Dialog
        visible={showDialog}
        style={{ width: "900px" }}
        header={editingDetalle ? "Editar Producto" : "Agregar Producto"}
        modal
        footer={dialogFooter}
        onHide={() => setShowDialog(false)}
      >
        <div className="grid">
          <div className="col-12">
            <label htmlFor="productoId" style={{ fontWeight: "bold" }}>
              Producto *
            </label>
            <Dropdown
              id="productoId"
              value={productoId}
              options={productos.map((p) => ({
                label: p.nombre,
                value: Number(p.id),
              }))}
              onChange={(e) => setProductoId(e.value)}
              placeholder="Seleccionar producto"
              filter
              showClear
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="cantidad" style={{ fontWeight: "bold" }}>
              Cantidad *
            </label>
            <InputNumber
              id="cantidad"
              value={cantidad}
              onValueChange={(e) => setCantidad(e.value)}
              minFractionDigits={3}
              maxFractionDigits={3}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="pesoNeto" style={{ fontWeight: "bold" }}>
              Peso Neto (Kg)
            </label>
            <InputNumber
              id="pesoNeto"
              value={pesoNeto}
              onValueChange={(e) => setPesoNeto(e.value)}
              minFractionDigits={3}
              maxFractionDigits={3}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="costoUnitarioEstimado" style={{ fontWeight: "bold" }}>
              Costo Unitario
            </label>
            <InputNumber
              id="costoUnitarioEstimado"
              value={costoUnitarioEstimado}
              onValueChange={(e) => setCostoUnitarioEstimado(e.value)}
              mode="currency"
              currency="USD"
              minFractionDigits={2}
              maxFractionDigits={6}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="factorExportacionAplicado" style={{ fontWeight: "bold" }}>
              Factor Exportación
            </label>
            <InputNumber
              id="factorExportacionAplicado"
              value={factorExportacionAplicado}
              onValueChange={(e) => setFactorExportacionAplicado(e.value)}
              minFractionDigits={4}
              maxFractionDigits={6}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="precioUnitario" style={{ fontWeight: "bold" }}>
              Precio Unitario
            </label>
            <InputNumber
              id="precioUnitario"
              value={precioUnitario}
              mode="currency"
              currency="USD"
              disabled
              className="w-full"
              style={{ backgroundColor: "#f0f0f0" }}
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="precioUnitarioFinal" style={{ fontWeight: "bold" }}>
              Precio Final
            </label>
            <InputNumber
              id="precioUnitarioFinal"
              value={precioUnitarioFinal}
              onValueChange={(e) => setPrecioUnitarioFinal(e.value)}
              mode="currency"
              currency="USD"
              minFractionDigits={2}
              maxFractionDigits={6}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="loteProduccion" style={{ fontWeight: "bold" }}>
              Lote Producción
            </label>
            <InputTextarea
              id="loteProduccion"
              value={loteProduccion}
              onChange={(e) => setLoteProduccion(e.target.value.toUpperCase())}
              rows={2}
              className="w-full"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="descripcionAdicional" style={{ fontWeight: "bold" }}>
              Descripción Adicional
            </label>
            <InputTextarea
              id="descripcionAdicional"
              value={descripcionAdicional}
              onChange={(e) => setDescripcionAdicional(e.target.value.toUpperCase())}
              rows={2}
              className="w-full"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="col-12">
            <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
              Observaciones
            </label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value.toUpperCase())}
              rows={2}
              className="w-full"
              style={{ textTransform: "uppercase" }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DetCotizacionVentasCard;