/**
 * Card de Entrega a Rendir para Cotización de Ventas
 * 
 * Funcionalidades:
 * - Registro de entregas a rendir
 * - Control de montos y fechas
 * - Estado de rendición
 * - Observaciones
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
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { confirmDialog } from "primereact/confirmdialog";
import { getPersonal } from "../../api/personal";
import { getMonedas } from "../../api/moneda";
import { getCentrosCosto } from "../../api/centroCosto";

const EntregaARendirCard = ({
  cotizacionId,
  entregas,
  setEntregas,
  toast,
}) => {
  const [personal, setPersonal] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntrega, setEditingEntrega] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [personalId, setPersonalId] = useState(null);
  const [centroCostoId, setCentroCostoId] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [montoEntregado, setMontoEntregado] = useState(0);
  const [monedaId, setMonedaId] = useState(null);
  const [tipoCambio, setTipoCambio] = useState(3.75);
  const [montoMonedaBase, setMontoMonedaBase] = useState(0);
  const [concepto, setConcepto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fechaRendicion, setFechaRendicion] = useState(null);
  const [montoRendido, setMontoRendido] = useState(null);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [estadoRendicion, setEstadoRendicion] = useState("PENDIENTE");
  const [esUrgente, setEsUrgente] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Calcular monto en moneda base
  useEffect(() => {
    const montoBase = montoEntregado * tipoCambio;
    setMontoMonedaBase(montoBase);
  }, [montoEntregado, tipoCambio]);

  // Calcular saldo pendiente
  useEffect(() => {
    const saldo = montoEntregado - (montoRendido || 0);
    setSaldoPendiente(saldo);
  }, [montoEntregado, montoRendido]);

  const cargarDatos = async () => {
    try {
      const [personalData, monedasData, centrosData] = await Promise.all([
        getPersonal(),
        getMonedas(),
        getCentrosCosto(),
      ]);

      setPersonal(personalData);
      setMonedas(monedasData);
      setCentrosCosto(centrosData);
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
    setEditingEntrega(null);
    setFechaEntrega(new Date());
    setEstadoRendicion("PENDIENTE");
    setShowDialog(true);
  };

  const abrirDialogoEditar = (entrega) => {
    setEditingEntrega(entrega);
    setPersonalId(entrega.personalId);
    setCentroCostoId(entrega.centroCostoId);
    setFechaEntrega(entrega.fechaEntrega ? new Date(entrega.fechaEntrega) : null);
    setMontoEntregado(entrega.montoEntregado);
    setMonedaId(entrega.monedaId);
    setTipoCambio(entrega.tipoCambio || 3.75);
    setMontoMonedaBase(entrega.montoMonedaBase);
    setConcepto(entrega.concepto || "");
    setObservaciones(entrega.observaciones || "");
    setFechaRendicion(entrega.fechaRendicion ? new Date(entrega.fechaRendicion) : null);
    setMontoRendido(entrega.montoRendido);
    setSaldoPendiente(entrega.saldoPendiente || 0);
    setEstadoRendicion(entrega.estadoRendicion || "PENDIENTE");
    setEsUrgente(entrega.esUrgente || false);
    setShowDialog(true);
  };

  const limpiarFormulario = () => {
    setPersonalId(null);
    setCentroCostoId(null);
    setFechaEntrega(null);
    setMontoEntregado(0);
    setMonedaId(null);
    setTipoCambio(3.75);
    setMontoMonedaBase(0);
    setConcepto("");
    setObservaciones("");
    setFechaRendicion(null);
    setMontoRendido(null);
    setSaldoPendiente(0);
    setEstadoRendicion("PENDIENTE");
    setEsUrgente(false);
  };

  const handleGuardarEntrega = () => {
    if (!personalId || !fechaEntrega || montoEntregado <= 0 || !monedaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Complete los campos obligatorios",
        life: 3000,
      });
      return;
    }

    const persona = personal.find((p) => Number(p.id) === Number(personalId));
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    const centroCosto = centroCostoId
      ? centrosCosto.find((c) => Number(c.id) === Number(centroCostoId))
      : null;

    const nuevaEntrega = {
      id: editingEntrega?.id || Date.now(),
      personalId: Number(personalId),
      personal: persona,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      centroCosto: centroCosto,
      fechaEntrega: fechaEntrega,
      montoEntregado: Number(montoEntregado),
      monedaId: Number(monedaId),
      moneda: moneda,
      tipoCambio: Number(tipoCambio),
      montoMonedaBase: Number(montoMonedaBase),
      concepto: concepto?.trim().toUpperCase() || null,
      observaciones: observaciones?.trim().toUpperCase() || null,
      fechaRendicion: fechaRendicion,
      montoRendido: montoRendido ? Number(montoRendido) : null,
      saldoPendiente: Number(saldoPendiente),
      estadoRendicion: estadoRendicion,
      esUrgente: esUrgente,
    };

    if (editingEntrega) {
      const nuevasEntregas = entregas.map((e) =>
        e.id === editingEntrega.id ? nuevaEntrega : e
      );
      setEntregas(nuevasEntregas);
      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Entrega actualizada correctamente",
        life: 3000,
      });
    } else {
      setEntregas([...entregas, nuevaEntrega]);
      toast.current?.show({
        severity: "success",
        summary: "Agregado",
        detail: "Entrega agregada correctamente",
        life: 3000,
      });
    }

    setShowDialog(false);
    limpiarFormulario();
  };

  const confirmarEliminar = (entrega) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la entrega a ${entrega.personal?.nombreCompleto}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarEntrega(entrega),
    });
  };

  const eliminarEntrega = (entrega) => {
    const nuevasEntregas = entregas.filter((e) => e.id !== entrega.id);
    setEntregas(nuevasEntregas);
    toast.current?.show({
      severity: "success",
      summary: "Eliminado",
      detail: "Entrega eliminada correctamente",
      life: 3000,
    });
  };

  // Templates
  const personalTemplate = (rowData) => {
    return <span>{rowData.personal?.nombreCompleto || "N/A"}</span>;
  };

  const fechaTemplate = (rowData) => {
    if (rowData.fechaEntrega) {
      return new Date(rowData.fechaEntrega).toLocaleDateString("es-PE");
    }
    return "-";
  };

  const montoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold" }}>
        {rowData.moneda?.codigo || ""} {rowData.montoEntregado.toFixed(2)}
      </span>
    );
  };

  const estadoTemplate = (rowData) => {
    const colores = {
      PENDIENTE: "#FF9800",
      PARCIAL: "#2196F3",
      RENDIDO: "#4CAF50",
      VENCIDO: "#F44336",
    };

    return (
      <span
        style={{
          color: colores[rowData.estadoRendicion] || "#999",
          fontWeight: "bold",
        }}
      >
        {rowData.estadoRendicion}
      </span>
    );
  };

  const saldoTemplate = (rowData) => {
    const color = rowData.saldoPendiente > 0 ? "#F44336" : "#4CAF50";
    return (
      <span style={{ color: color, fontWeight: "bold" }}>
        $ {rowData.saldoPendiente.toFixed(2)}
      </span>
    );
  };

  const urgenteTemplate = (rowData) => {
    return rowData.esUrgente ? (
      <i className="pi pi-exclamation-triangle" style={{ color: "#F44336", fontSize: "1.2rem" }} />
    ) : null;
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
    const totalEntregado = entregas.reduce((sum, e) => sum + e.montoMonedaBase, 0);
    const totalRendido = entregas.reduce((sum, e) => sum + (e.montoRendido || 0), 0);
    const totalPendiente = entregas.reduce((sum, e) => sum + e.saldoPendiente, 0);
    return {
      totalEntregado: totalEntregado.toFixed(2),
      totalRendido: totalRendido.toFixed(2),
      totalPendiente: totalPendiente.toFixed(2),
      cantidadEntregas: entregas.length,
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
        onClick={handleGuardarEntrega}
        loading={loading}
      />
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Entrega a Rendir</h3>
        <Button
          label="Agregar Entrega"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirDialogoNuevo}
          disabled={!cotizacionId}
        />
      </div>

      {!cotizacionId && (
        <div className="p-message p-message-info" style={{ marginBottom: "1rem" }}>
          <span>Debe guardar primero los datos generales para agregar entregas</span>
        </div>
      )}

      <DataTable
        value={entregas}
        emptyMessage="No hay entregas registradas"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="personal.nombreCompleto" header="Personal" body={personalTemplate} />
        <Column field="fechaEntrega" header="Fecha Entrega" body={fechaTemplate} style={{ width: "130px" }} />
        <Column field="montoEntregado" header="Monto" body={montoTemplate} style={{ width: "130px" }} />
        <Column field="estadoRendicion" header="Estado" body={estadoTemplate} style={{ width: "110px" }} />
        <Column field="saldoPendiente" header="Saldo" body={saldoTemplate} style={{ width: "120px" }} />
        <Column field="esUrgente" header="Urgente" body={urgenteTemplate} style={{ width: "90px" }} />
        <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
      </DataTable>

      {/* Totales */}
      {entregas.length > 0 && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
          <div className="grid">
            <div className="col-12 md:col-3">
              <div style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                <strong>Entregas:</strong> {totales.cantidadEntregas}
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div style={{ fontSize: "1rem", color: "#2196F3", fontWeight: "bold" }}>
                <strong>Total Entregado:</strong> $ {totales.totalEntregado}
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div style={{ fontSize: "1rem", color: "#4CAF50", fontWeight: "bold" }}>
                <strong>Total Rendido:</strong> $ {totales.totalRendido}
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div style={{ fontSize: "1rem", color: "#F44336", fontWeight: "bold" }}>
                <strong>Saldo Pendiente:</strong> $ {totales.totalPendiente}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para agregar/editar entrega */}
      <Dialog
        visible={showDialog}
        style={{ width: "900px" }}
        header={editingEntrega ? "Editar Entrega" : "Agregar Entrega"}
        modal
        footer={dialogFooter}
        onHide={() => setShowDialog(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <label htmlFor="personalId" style={{ fontWeight: "bold" }}>
              Personal *
            </label>
            <Dropdown
              id="personalId"
              value={personalId}
              options={personal.map((p) => ({
                label: p.nombreCompleto,
                value: Number(p.id),
              }))}
              onChange={(e) => setPersonalId(e.value)}
              placeholder="Seleccionar personal"
              filter
              showClear
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="centroCostoId" style={{ fontWeight: "bold" }}>
              Centro de Costo
            </label>
            <Dropdown
              id="centroCostoId"
              value={centroCostoId}
              options={centrosCosto.map((c) => ({
                label: c.nombre,
                value: Number(c.id),
              }))}
              onChange={(e) => setCentroCostoId(e.value)}
              placeholder="Seleccionar centro"
              filter
              showClear
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="fechaEntrega" style={{ fontWeight: "bold" }}>
              Fecha Entrega *
            </label>
            <Calendar
              id="fechaEntrega"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.value)}
              dateFormat="dd/mm/yy"
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="montoEntregado" style={{ fontWeight: "bold" }}>
              Monto Entregado *
            </label>
            <InputNumber
              id="montoEntregado"
              value={montoEntregado}
              onValueChange={(e) => setMontoEntregado(e.value)}
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
            <label htmlFor="tipoCambio" style={{ fontWeight: "bold" }}>
              Tipo Cambio
            </label>
            <InputNumber
              id="tipoCambio"
              value={tipoCambio}
              onValueChange={(e) => setTipoCambio(e.value)}
              minFractionDigits={2}
              maxFractionDigits={6}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="montoMonedaBase" style={{ fontWeight: "bold" }}>
              Monto en Moneda Base
            </label>
            <InputNumber
              id="montoMonedaBase"
              value={montoMonedaBase}
              mode="currency"
              currency="USD"
              disabled
              className="w-full"
              style={{ backgroundColor: "#f0f0f0" }}
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="estadoRendicion" style={{ fontWeight: "bold" }}>
              Estado Rendición
            </label>
            <Dropdown
              id="estadoRendicion"
              value={estadoRendicion}
              options={[
                { label: "PENDIENTE", value: "PENDIENTE" },
                { label: "PARCIAL", value: "PARCIAL" },
                { label: "RENDIDO", value: "RENDIDO" },
                { label: "VENCIDO", value: "VENCIDO" },
              ]}
              onChange={(e) => setEstadoRendicion(e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="concepto" style={{ fontWeight: "bold" }}>
              Concepto
            </label>
            <InputText
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value.toUpperCase())}
              placeholder="CONCEPTO DE LA ENTREGA"
              className="w-full"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="col-12 md:col-3">
            <label htmlFor="fechaRendicion" style={{ fontWeight: "bold" }}>
              Fecha Rendición
            </label>
            <Calendar
              id="fechaRendicion"
              value={fechaRendicion}
              onChange={(e) => setFechaRendicion(e.value)}
              dateFormat="dd/mm/yy"
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-3">
            <label htmlFor="montoRendido" style={{ fontWeight: "bold" }}>
              Monto Rendido
            </label>
            <InputNumber
              id="montoRendido"
              value={montoRendido}
              onValueChange={(e) => setMontoRendido(e.value)}
              mode="currency"
              currency="USD"
              minFractionDigits={2}
              maxFractionDigits={2}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="saldoPendiente" style={{ fontWeight: "bold" }}>
              Saldo Pendiente
            </label>
            <InputNumber
              id="saldoPendiente"
              value={saldoPendiente}
              mode="currency"
              currency="USD"
              disabled
              className="w-full"
              style={{ backgroundColor: "#f0f0f0" }}
            />
          </div>

          <div className="col-12 md:col-8">
            <div style={{ marginTop: "1.5rem" }}>
              <div className="field-checkbox">
                <Checkbox
                  inputId="esUrgente"
                  checked={esUrgente}
                  onChange={(e) => setEsUrgente(e.checked)}
                />
                <label htmlFor="esUrgente" style={{ fontWeight: "bold", marginLeft: "0.5rem" }}>
                  Es Urgente
                </label>
              </div>
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
              Observaciones
            </label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value.toUpperCase())}
              rows={3}
              className="w-full"
              style={{ textTransform: "uppercase" }}
              placeholder="OBSERVACIONES SOBRE LA ENTREGA..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default EntregaARendirCard;