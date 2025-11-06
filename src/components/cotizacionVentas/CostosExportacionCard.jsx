/**
 * Card de Costos de Exportación para Cotización de Ventas
 * 
 * Funcionalidades:
 * - DataTable con costos de exportación
 * - Agregar/Editar/Eliminar costos
 * - Montos estimados vs reales
 * - Cálculo de factor de exportación
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
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { confirmDialog } from "primereact/confirmdialog";
import { getProductos } from "../../api/producto";
import { getMonedas } from "../../api/moneda";
import { getEntidadesComerciales } from "../../api/entidadComercial";

const CostosExportacionCard = ({
  cotizacionId,
  costos,
  setCostos,
  toast,
}) => {
  const [productosGastos, setProductosGastos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCosto, setEditingCosto] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [productoId, setProductoId] = useState(null);
  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [montoEstimado, setMontoEstimado] = useState(0);
  const [monedaId, setMonedaId] = useState(null);
  const [tipoCambioAplicado, setTipoCambioAplicado] = useState(3.75);
  const [montoEstimadoMonedaBase, setMontoEstimadoMonedaBase] = useState(0);
  const [montoReal, setMontoReal] = useState(null);
  const [proveedorId, setProveedorId] = useState(null);
  const [aplicaSegunIncoterm, setAplicaSegunIncoterm] = useState(true);
  const [responsableSegunIncoterm, setResponsableSegunIncoterm] = useState("VENDEDOR");
  const [esObligatorio, setEsObligatorio] = useState(true);
  const [orden, setOrden] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Calcular monto en moneda base cuando cambia monto estimado o tipo cambio
  useEffect(() => {
    const montoBase = montoEstimado * tipoCambioAplicado;
    setMontoEstimadoMonedaBase(montoBase);
  }, [montoEstimado, tipoCambioAplicado]);

  const cargarDatos = async () => {
    try {
      const [productosData, monedasData, proveedoresData] = await Promise.all([
        getProductos(),
        getMonedas(),
        getEntidadesComerciales(),
      ]);

      // Filtrar solo productos de familia 7 (Gastos Exportación)
      const gastosExportacion = productosData.filter(
        (p) => Number(p.familiaProductoId) === 7
      );
      setProductosGastos(gastosExportacion);
      setMonedas(monedasData);
      setProveedores(proveedoresData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    }
  };

  const abrirDialogoNuevo = () => {
    limpiarFormulario();
    setEditingCosto(null);
    setOrden(costos.length + 1);
    setShowDialog(true);
  };

  const abrirDialogoEditar = (costo) => {
    setEditingCosto(costo);
    setProductoId(costo.productoId);
    setConcepto(costo.concepto);
    setDescripcion(costo.descripcion || "");
    setMontoEstimado(costo.montoEstimado);
    setMonedaId(costo.monedaId);
    setTipoCambioAplicado(costo.tipoCambioAplicado || 3.75);
    setMontoEstimadoMonedaBase(costo.montoEstimadoMonedaBase);
    setMontoReal(costo.montoReal);
    setProveedorId(costo.proveedorId);
    setAplicaSegunIncoterm(costo.aplicaSegunIncoterm);
    setResponsableSegunIncoterm(costo.responsableSegunIncoterm || "VENDEDOR");
    setEsObligatorio(costo.esObligatorio);
    setOrden(costo.orden);
    setShowDialog(true);
  };

  const limpiarFormulario = () => {
    setProductoId(null);
    setConcepto("");
    setDescripcion("");
    setMontoEstimado(0);
    setMonedaId(null);
    setTipoCambioAplicado(3.75);
    setMontoEstimadoMonedaBase(0);
    setMontoReal(null);
    setProveedorId(null);
    setAplicaSegunIncoterm(true);
    setResponsableSegunIncoterm("VENDEDOR");
    setEsObligatorio(true);
    setOrden(0);
  };

  const handleGuardarCosto = () => {
    if (!productoId || !concepto || montoEstimado <= 0 || !monedaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Complete los campos obligatorios",
        life: 3000,
      });
      return;
    }

    const producto = productosGastos.find((p) => Number(p.id) === Number(productoId));
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    const proveedor = proveedorId
      ? proveedores.find((p) => Number(p.id) === Number(proveedorId))
      : null;

    const nuevoCosto = {
      id: editingCosto?.id || Date.now(),
      productoId: Number(productoId),
      producto: producto,
      concepto: concepto.trim().toUpperCase(),
      descripcion: descripcion?.trim().toUpperCase() || null,
      montoEstimado: Number(montoEstimado),
      monedaId: Number(monedaId),
      moneda: moneda,
      tipoCambioAplicado: Number(tipoCambioAplicado),
      montoEstimadoMonedaBase: Number(montoEstimadoMonedaBase),
      montoReal: montoReal ? Number(montoReal) : null,
      proveedorId: proveedorId ? Number(proveedorId) : null,
      proveedor: proveedor,
      aplicaSegunIncoterm: aplicaSegunIncoterm,
      responsableSegunIncoterm: responsableSegunIncoterm,
      esObligatorio: esObligatorio,
      orden: Number(orden),
    };

    if (editingCosto) {
      const nuevosCostos = costos.map((c) =>
        c.id === editingCosto.id ? nuevoCosto : c
      );
      setCostos(nuevosCostos);
      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Costo actualizado correctamente",
        life: 3000,
      });
    } else {
      setCostos([...costos, nuevoCosto]);
      toast.current?.show({
        severity: "success",
        summary: "Agregado",
        detail: "Costo agregado correctamente",
        life: 3000,
      });
    }

    setShowDialog(false);
    limpiarFormulario();
  };

  const confirmarEliminar = (costo) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el costo ${costo.concepto}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarCosto(costo),
    });
  };

  const eliminarCosto = (costo) => {
    const nuevosCostos = costos.filter((c) => c.id !== costo.id);
    setCostos(nuevosCostos);
    toast.current?.show({
      severity: "success",
      summary: "Eliminado",
      detail: "Costo eliminado correctamente",
      life: 3000,
    });
  };

  // Templates
  const ordenTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.orden}</span>;
  };

  const montoTemplate = (rowData) => {
    return (
      <span>
        {rowData.moneda?.codigo || ""} {rowData.montoEstimado.toFixed(2)}
      </span>
    );
  };

  const montoRealTemplate = (rowData) => {
    if (rowData.montoReal) {
      return <span style={{ color: "#4CAF50" }}>$ {rowData.montoReal.toFixed(2)}</span>;
    }
    return <span style={{ color: "#999" }}>Pendiente</span>;
  };

  const responsableTemplate = (rowData) => {
    const color = rowData.responsableSegunIncoterm === "VENDEDOR" ? "#2196F3" : "#FF9800";
    return (
      <span style={{ color: color, fontWeight: "bold" }}>
        {rowData.responsableSegunIncoterm}
      </span>
    );
  };

  const obligatorioTemplate = (rowData) => {
    return rowData.esObligatorio ? (
      <i className="pi pi-check-circle" style={{ color: "#4CAF50", fontSize: "1.2rem" }} />
    ) : (
      <i className="pi pi-times-circle" style={{ color: "#999", fontSize: "1.2rem" }} />
    );
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
    const totalEstimado = costos.reduce((sum, c) => sum + c.montoEstimadoMonedaBase, 0);
    const totalReal = costos.reduce((sum, c) => sum + (c.montoReal || 0), 0);
    return {
      totalEstimado: totalEstimado.toFixed(2),
      totalReal: totalReal.toFixed(2),
      cantidadCostos: costos.length,
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
        onClick={handleGuardarCosto}
        loading={loading}
      />
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Costos de Exportación</h3>
        <Button
          label="Agregar Costo"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirDialogoNuevo}
          disabled={!cotizacionId}
        />
      </div>

      {!cotizacionId && (
        <div className="p-message p-message-info" style={{ marginBottom: "1rem" }}>
          <span>Debe guardar primero los datos generales para agregar costos</span>
        </div>
      )}

      <DataTable
        value={costos}
        emptyMessage="No hay costos agregados"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="orden" header="Orden" body={ordenTemplate} style={{ width: "80px" }} />
        <Column field="concepto" header="Concepto" />
        <Column field="montoEstimado" header="Monto Estimado" body={montoTemplate} style={{ width: "150px" }} />
        <Column field="montoReal" header="Monto Real" body={montoRealTemplate} style={{ width: "130px" }} />
        <Column field="responsableSegunIncoterm" header="Responsable" body={responsableTemplate} style={{ width: "130px" }} />
        <Column field="esObligatorio" header="Obligatorio" body={obligatorioTemplate} style={{ width: "110px" }} />
        <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
      </DataTable>

      {/* Totales y Factor */}
      {costos.length > 0 && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
          <div className="grid">
            <div className="col-12 md:col-4">
              <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                <strong>Cantidad Costos:</strong> {totales.cantidadCostos}
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div style={{ fontSize: "1.1rem", color: "#2196F3", fontWeight: "bold" }}>
                <strong>Total Estimado:</strong> $ {totales.totalEstimado}
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div style={{ fontSize: "1.1rem", color: "#4CAF50", fontWeight: "bold" }}>
                <strong>Total Real:</strong> $ {totales.totalReal}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para agregar/editar costo */}
      <Dialog
        visible={showDialog}
        style={{ width: "900px" }}
        header={editingCosto ? "Editar Costo" : "Agregar Costo"}
        modal
        footer={dialogFooter}
        onHide={() => setShowDialog(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <label htmlFor="productoId" style={{ fontWeight: "bold" }}>
              Producto (Gasto) *
            </label>
            <Dropdown
              id="productoId"
              value={productoId}
              options={productosGastos.map((p) => ({
                label: p.nombre,
                value: Number(p.id),
              }))}
              onChange={(e) => setProductoId(e.value)}
              placeholder="Seleccionar gasto"
              filter
              showClear
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="concepto" style={{ fontWeight: "bold" }}>
              Concepto *
            </label>
            <InputText
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value.toUpperCase())}
              placeholder="CONCEPTO DEL COSTO"
              className="w-full"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="col-12">
            <label htmlFor="descripcion" style={{ fontWeight: "bold" }}>
              Descripción
            </label>
            <InputTextarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.toUpperCase())}
              rows={2}
              className="w-full"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="montoEstimado" style={{ fontWeight: "bold" }}>
              Monto Estimado *
            </label>
            <InputNumber
              id="montoEstimado"
              value={montoEstimado}
              onValueChange={(e) => setMontoEstimado(e.value)}
              minFractionDigits={2}
              maxFractionDigits={2}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="monedaId" style={{ fontWeight: "bold" }}>
              Moneda *
            </label>
            <Dropdown
              id="monedaId"
              value={monedaId}
              options={monedas.map((m) => ({
                label: `${m.codigo} - ${m.nombre}`,
                value: Number(m.id),
              }))}
              onChange={(e) => setMonedaId(e.value)}
              placeholder="Seleccionar moneda"
              filter
              showClear
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="tipoCambioAplicado" style={{ fontWeight: "bold" }}>
              Tipo Cambio
            </label>
            <InputNumber
              id="tipoCambioAplicado"
              value={tipoCambioAplicado}
              onValueChange={(e) => setTipoCambioAplicado(e.value)}
              minFractionDigits={2}
              maxFractionDigits={6}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="montoEstimadoMonedaBase" style={{ fontWeight: "bold" }}>
              Monto en Moneda Base
            </label>
            <InputNumber
              id="montoEstimadoMonedaBase"
              value={montoEstimadoMonedaBase}
              mode="currency"
              currency="USD"
              disabled
              className="w-full"
              style={{ backgroundColor: "#f0f0f0" }}
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="montoReal" style={{ fontWeight: "bold" }}>
              Monto Real
            </label>
            <InputNumber
              id="montoReal"
              value={montoReal}
              onValueChange={(e) => setMontoReal(e.value)}
              mode="currency"
              currency="USD"
              minFractionDigits={2}
              maxFractionDigits={2}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="orden" style={{ fontWeight: "bold" }}>
              Orden
            </label>
            <InputNumber
              id="orden"
              value={orden}
              onValueChange={(e) => setOrden(e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="proveedorId" style={{ fontWeight: "bold" }}>
              Proveedor
            </label>
            <Dropdown
              id="proveedorId"
              value={proveedorId}
              options={proveedores.map((p) => ({
                label: p.razonSocial,
                value: Number(p.id),
              }))}
              onChange={(e) => setProveedorId(e.value)}
              placeholder="Seleccionar proveedor"
              filter
              showClear
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="responsableSegunIncoterm" style={{ fontWeight: "bold" }}>
              Responsable según Incoterm
            </label>
            <Dropdown
              id="responsableSegunIncoterm"
              value={responsableSegunIncoterm}
              options={[
                { label: "VENDEDOR", value: "VENDEDOR" },
                { label: "COMPRADOR", value: "COMPRADOR" },
              ]}
              onChange={(e) => setResponsableSegunIncoterm(e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <div className="field-checkbox">
              <Checkbox
                inputId="aplicaSegunIncoterm"
                checked={aplicaSegunIncoterm}
                onChange={(e) => setAplicaSegunIncoterm(e.checked)}
              />
              <label htmlFor="aplicaSegunIncoterm" style={{ fontWeight: "bold", marginLeft: "0.5rem" }}>
                Aplica según Incoterm
              </label>
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field-checkbox">
              <Checkbox
                inputId="esObligatorio"
                checked={esObligatorio}
                onChange={(e) => setEsObligatorio(e.checked)}
              />
              <label htmlFor="esObligatorio" style={{ fontWeight: "bold", marginLeft: "0.5rem" }}>
                Es Obligatorio
              </label>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CostosExportacionCard;