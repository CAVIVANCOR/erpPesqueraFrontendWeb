// src/components/cuentaPorCobrar/CuentaPorCobrarForm.jsx
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getResponsiveFontSize,
  formatearNumero,
  formatearFecha,
} from "../../utils/utils";
import CardAsientoContable from "../common/CardAsientoContable";
import PagoCuentaPorCobrarForm from "../pagoCuentaPorCobrar/PagoCuentaPorCobrarForm";
import {
  getPagosPorCuentaCobrar,
  deletePagoCuentaPorCobrar,
  createPagoCuentaPorCobrar,
  updatePagoCuentaPorCobrar,
} from "../../api/cuentasPorCobrarPagar/pagoCuentaPorCobrar";

export default function CuentaPorCobrarForm({
  isEdit,
  defaultValues,
  empresas,
  clientes,
  monedas,
  estados,
  mediosPago,
  bancos,
  cuentasCorrientes,
  onSubmit,
  onCancel,
  onGenerarAsiento,
  loading,
  readOnly = false,
  permisos = {},
  toast,
}) {
  const [activeTab, setActiveTab] = useState(0);

  // Estados principales
  const [preFacturaId, setPreFacturaId] = useState(
    defaultValues?.preFacturaId || null,
  );
  const [empresaId, setEmpresaId] = useState(defaultValues?.empresaId || null);
  const [clienteId, setClienteId] = useState(defaultValues?.clienteId || null);
  const [numeroPreFactura, setNumeroPreFactura] = useState(
    defaultValues?.numeroPreFactura || "",
  );
  const [fechaEmision, setFechaEmision] = useState(
    defaultValues?.fechaEmision
      ? new Date(defaultValues.fechaEmision)
      : new Date(),
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    defaultValues?.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : new Date(),
  );
  const [montoTotal, setMontoTotal] = useState(defaultValues?.montoTotal || 0);
  const [montoPagado, setMontoPagado] = useState(
    defaultValues?.montoPagado || 0,
  );
  const [saldoPendiente, setSaldoPendiente] = useState(
    defaultValues?.saldoPendiente || 0,
  );
  const [esSaldoInicial, setEsSaldoInicial] = useState(
    defaultValues?.esSaldoInicial || false,
  );
  const [esGerencial, setEsGerencial] = useState(
    defaultValues?.esGerencial || false,
  );
  const [monedaId, setMonedaId] = useState(defaultValues?.monedaId || null);
  const [esContado, setEsContado] = useState(defaultValues?.esContado || false);
  const [estadoId, setEstadoId] = useState(defaultValues?.estadoId || 100);
  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || "",
  );

  // Estados impuestos SUNAT
  const [tieneDetraccion, setTieneDetraccion] = useState(
    defaultValues?.tieneDetraccion || false,
  );
  const [montoDetraccion, setMontoDetraccion] = useState(
    defaultValues?.montoDetraccion || 0,
  );
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState(
    defaultValues?.porcentajeDetraccion || 0,
  );
  const [numeroConstanciaDetraccion, setNumeroConstanciaDetraccion] = useState(
    defaultValues?.numeroConstanciaDetraccion || "",
  );
  const [fechaDetraccion, setFechaDetraccion] = useState(
    defaultValues?.fechaDetraccion
      ? new Date(defaultValues.fechaDetraccion)
      : null,
  );
  const [tieneRetencion, setTieneRetencion] = useState(
    defaultValues?.tieneRetencion || false,
  );
  const [montoRetencion, setMontoRetencion] = useState(
    defaultValues?.montoRetencion || 0,
  );
  const [numeroComprobanteRetencion, setNumeroComprobanteRetencion] = useState(
    defaultValues?.numeroComprobanteRetencion || "",
  );
  const [fechaRetencion, setFechaRetencion] = useState(
    defaultValues?.fechaRetencion
      ? new Date(defaultValues.fechaRetencion)
      : null,
  );
  const [tienePercepcion, setTienePercepcion] = useState(
    defaultValues?.tienePercepcion || false,
  );
  const [montoPercepcion, setMontoPercepcion] = useState(
    defaultValues?.montoPercepcion || 0,
  );
  const [porcentajePercepcion, setPorcentajePercepcion] = useState(
    defaultValues?.porcentajePercepcion || 0,
  );
  const [numeroComprobantePercepcion, setNumeroComprobantePercepcion] =
    useState(defaultValues?.numeroComprobantePercepcion || "");
  const [fechaPercepcion, setFechaPercepcion] = useState(
    defaultValues?.fechaPercepcion
      ? new Date(defaultValues.fechaPercepcion)
      : null,
  );

  // Estados para CRUD de pagos
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isEditPago, setIsEditPago] = useState(false);

  // Cargar pagos si es edición
  useEffect(() => {
    if (isEdit && defaultValues?.id) {
      cargarPagos();
    }
  }, [isEdit, defaultValues?.id]);

  // Recalcular montoPagado y saldoPendiente cuando cambien los pagos
  useEffect(() => {
    const totalPagado = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoPago || 0),
      0,
    );
    setMontoPagado(totalPagado);
    setSaldoPendiente(Number(montoTotal) - totalPagado);
  }, [pagos, montoTotal]);

  const cargarPagos = async () => {
    try {
      setLoadingPagos(true);
      const data = await getPagosPorCuentaCobrar(defaultValues.id);
      setPagos(data || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los pagos",
        life: 3000,
      });
    } finally {
      setLoadingPagos(false);
    }
  };

  const handleSubmit = () => {
    const data = {
      preFacturaId: preFacturaId ? BigInt(preFacturaId) : null,
      empresaId: BigInt(empresaId),
      clienteId: BigInt(clienteId),
      numeroPreFactura,
      fechaEmision,
      fechaVencimiento,
      montoTotal: Number(montoTotal),
      montoPagado: Number(montoPagado),
      saldoPendiente: Number(saldoPendiente),
      esSaldoInicial,
      esGerencial,
      monedaId: BigInt(monedaId),
      esContado,
      estadoId: BigInt(estadoId),
      observaciones,
      tieneDetraccion,
      montoDetraccion: Number(montoDetraccion),
      porcentajeDetraccion: porcentajeDetraccion
        ? Number(porcentajeDetraccion)
        : null,
      numeroConstanciaDetraccion: numeroConstanciaDetraccion || null,
      fechaDetraccion: fechaDetraccion || null,
      tieneRetencion,
      montoRetencion: Number(montoRetencion),
      numeroComprobanteRetencion: numeroComprobanteRetencion || null,
      fechaRetencion: fechaRetencion || null,
      tienePercepcion,
      montoPercepcion: Number(montoPercepcion),
      porcentajePercepcion: porcentajePercepcion
        ? Number(porcentajePercepcion)
        : null,
      numeroComprobantePercepcion: numeroComprobantePercepcion || null,
      fechaPercepcion: fechaPercepcion || null,
    };
    onSubmit(data);
  };

  const handleRegistrarPago = () => {
    setPagoSeleccionado(null);
    setIsEditPago(false);
    setShowPagoDialog(true);
  };

  const handleEditarPago = (pago) => {
    setPagoSeleccionado(pago);
    setIsEditPago(true);
    setShowPagoDialog(true);
  };

  const handleEliminarPago = (pago) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el pago de ${formatearNumero(pago.montoPago, 2)}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deletePagoCuentaPorCobrar(pago.id);
          toast?.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Pago eliminado correctamente",
            life: 3000,
          });
          cargarPagos();
        } catch (error) {
          console.error("Error al eliminar pago:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.mensaje || "No se pudo eliminar el pago",
            life: 3000,
          });
        }
      },
    });
  };

  const handleSubmitPago = async (dataPago) => {
    try {
      if (isEditPago) {
        await updatePagoCuentaPorCobrar(pagoSeleccionado.id, dataPago);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoCuentaPorCobrar({
          ...dataPago,
          cuentaPorCobrarId: BigInt(defaultValues.id),
        });
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }
      setShowPagoDialog(false);
      cargarPagos();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "No se pudo guardar el pago",
        life: 3000,
      });
    }
  };

  // Templates para DataTable
  const montoTemplate = (rowData) => {
    const moneda = monedas?.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    return `${moneda?.codigo || ""} ${formatearNumero(rowData.montoPago, 2)}`;
  };

  const fechaTemplate = (rowData) => {
    return formatearFecha(rowData.fechaPago);
  };

  const medioPagoTemplate = (rowData) => {
    const medio = mediosPago?.find(
      (m) => Number(m.id) === Number(rowData.medioPagoId),
    );
    return medio?.descripcion || "-";
  };

  const bancoTemplate = (rowData) => {
    if (!rowData.bancoId) return "-";
    const banco = bancos?.find((b) => Number(b.id) === Number(rowData.bancoId));
    return banco?.nombre || "-";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => handleEditarPago(rowData)}
          tooltip="Ver detalle"
          disabled={readOnly || !permisos.puedeEditar}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => handleEliminarPago(rowData)}
          tooltip="Eliminar"
          disabled={readOnly || !permisos.puedeEliminar}
        />
      </div>
    );
  };

  // Preparar options
  const empresasOptions =
    empresas?.map((e) => ({
      label: e.razonSocial,
      value: Number(e.id),
    })) || [];

  const clientesOptions =
    clientes?.map((c) => ({
      label: c.razonSocial,
      value: Number(c.id),
    })) || [];

  const monedasOptions =
    monedas?.map((m) => ({
      label: `${m.codigo} - ${m.nombre}`,
      value: Number(m.id),
    })) || [];

  const estadosOptions =
    estados?.map((e) => ({
      label: e.descripcion,
      value: Number(e.id),
    })) || [];

  const puedeEditar = !readOnly && !loading;

  return (
    <div className="p-fluid">
      <ConfirmDialog />

      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          {/* INFORMACIÓN GENERAL */}
          <div className="p-fluid">
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaId">Empresa *</label>
                <Dropdown
                  id="empresaId"
                  value={empresaId}
                  options={empresasOptions}
                  onChange={(e) => setEmpresaId(e.value)}
                  placeholder="Seleccione empresa"
                  disabled={!puedeEditar || isEdit}
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="clienteId">Cliente *</label>
                <Dropdown
                  id="clienteId"
                  value={clienteId}
                  options={clientesOptions}
                  onChange={(e) => setClienteId(e.value)}
                  placeholder="Seleccione cliente"
                  disabled={!puedeEditar || isEdit}
                  filter
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="tipoDoc">Tipo Documento</label>
                <InputText
                  id="tipoDoc"
                  value={esSaldoInicial ? "SI-CXC" : "FACTURA"}
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="numeroPreFactura">Documento *</label>
                <InputText
                  id="numeroPreFactura"
                  value={numeroPreFactura}
                  onChange={(e) => setNumeroPreFactura(e.target.value)}
                  disabled={!puedeEditar}
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="origen">Origen PreFactura</label>
                <InputText
                  id="origen"
                  value={preFacturaId ? `PF-${preFacturaId}` : "Sin PreFactura"}
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaEmision">Fecha Emisión *</label>
                <Calendar
                  id="fechaEmision"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={!puedeEditar}
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="fechaVencimiento">Fecha Vencimiento *</label>
                <Calendar
                  id="fechaVencimiento"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={!puedeEditar}
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="monedaId">Moneda *</label>
                <Dropdown
                  id="monedaId"
                  value={monedaId}
                  options={monedasOptions}
                  onChange={(e) => setMonedaId(e.value)}
                  placeholder="Seleccione moneda"
                  disabled={!puedeEditar}
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="estadoId">Estado *</label>
                <Dropdown
                  id="estadoId"
                  value={estadoId}
                  options={estadosOptions}
                  onChange={(e) => setEstadoId(e.value)}
                  placeholder="Seleccione estado"
                  disabled={!puedeEditar}
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                label={tieneDetraccion ? "DETRACCIÓN" : "DETRACCIÓN"}
                icon={
                  tieneDetraccion ? "pi pi-check-circle" : "pi pi-times-circle"
                }
                severity={tieneDetraccion ? "warning" : "secondary"}
                onClick={() => setTieneDetraccion(!tieneDetraccion)}
                disabled={!puedeEditar}
                style={{
                  minWidth: "140px",
                  fontSize: getResponsiveFontSize(),
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tieneDetraccion" className="ml-2">
                Tiene Detracción
              </label>
              <InputNumber
                value={montoDetraccion}
                onValueChange={(e) => setMontoDetraccion(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={!puedeEditar || !tieneDetraccion}
                placeholder="Monto"
                className="ml-2"
                style={{ width: "120px", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputNumber
                value={porcentajeDetraccion}
                onValueChange={(e) => setPorcentajeDetraccion(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={!puedeEditar || !tieneDetraccion}
                placeholder="%"
                className="ml-2"
                style={{ width: "80px", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputText
                value={numeroConstanciaDetraccion}
                onChange={(e) => setNumeroConstanciaDetraccion(e.target.value)}
                disabled={!puedeEditar || !tieneDetraccion}
                placeholder="N° Constancia"
                className="ml-2"
                style={{ width: "150px", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label={tieneRetencion ? "RETENCIÓN" : "RETENCIÓN"}
                icon={
                  tieneRetencion ? "pi pi-check-circle" : "pi pi-times-circle"
                }
                severity={tieneRetencion ? "danger" : "secondary"}
                onClick={() => setTieneRetencion(!tieneRetencion)}
                disabled={!puedeEditar}
                style={{
                  minWidth: "140px",
                  fontSize: getResponsiveFontSize(),
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tieneRetencion" className="ml-2">
                Tiene Retención
              </label>
              <InputNumber
                value={montoRetencion}
                onValueChange={(e) => setMontoRetencion(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={!puedeEditar || !tieneRetencion}
                placeholder="Monto"
                className="ml-2"
                style={{ width: "120px", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputText
                value={numeroComprobanteRetencion}
                onChange={(e) => setNumeroComprobanteRetencion(e.target.value)}
                disabled={!puedeEditar || !tieneRetencion}
                placeholder="N° Comprobante"
                className="ml-2"
                style={{ width: "150px", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label={tienePercepcion ? "PERCEPCIÓN" : "PERCEPCIÓN"}
                icon={
                  tienePercepcion ? "pi pi-check-circle" : "pi pi-times-circle"
                }
                severity={tienePercepcion ? "info" : "secondary"}
                onClick={() => setTienePercepcion(!tienePercepcion)}
                disabled={!puedeEditar}
                style={{
                  minWidth: "140px",
                  fontSize: getResponsiveFontSize(),
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tienePercepcion" className="ml-2">
                Tiene Percepción
              </label>
              <InputNumber
                value={montoPercepcion}
                onValueChange={(e) => setMontoPercepcion(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={!puedeEditar || !tienePercepcion}
                placeholder="Monto"
                className="ml-2"
                style={{ width: "120px", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputNumber
                value={porcentajePercepcion}
                onValueChange={(e) => setPorcentajePercepcion(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled={!puedeEditar || !tienePercepcion}
                placeholder="%"
                className="ml-2"
                style={{ width: "80px", fontSize: getResponsiveFontSize() }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <InputText
                value={numeroComprobantePercepcion}
                onChange={(e) => setNumeroComprobantePercepcion(e.target.value)}
                disabled={!puedeEditar || !tienePercepcion}
                placeholder="N° Comprobante"
                className="ml-2"
                style={{ width: "150px", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* PAGOS RECIBIDOS */}
          {isEdit && (
            <div>
              <div className="col-12 flex justify-content-between align-items-center">
                <h6 style={{ margin: 0, fontWeight: "600" }}>
                  PAGOS RECIBIDOS
                </h6>
                <Button
                  label="Registrar Pago"
                  icon="pi pi-plus"
                  className="p-button-success p-button-sm"
                  onClick={handleRegistrarPago}
                  disabled={readOnly || !permisos.puedeEditar || loadingPagos}
                />
              </div>

              <div className="col-12">
                <DataTable
                  value={pagos}
                  loading={loadingPagos}
                  emptyMessage="No hay pagos registrados"
                  size="small"
                  style={{ fontSize: getResponsiveFontSize() }}
                >
                  <Column
                    field="fechaPago"
                    header="Fecha Pago"
                    body={fechaTemplate}
                    style={{ width: "120px" }}
                  />
                  <Column
                    field="montoPago"
                    header="Monto"
                    body={montoTemplate}
                    style={{ width: "120px" }}
                  />
                  <Column
                    field="medioPagoId"
                    header="Medio Pago"
                    body={medioPagoTemplate}
                    style={{ width: "150px" }}
                  />
                  <Column
                    field="numeroOperacion"
                    header="N° Operación"
                    style={{ width: "150px" }}
                  />
                  <Column
                    field="bancoId"
                    header="Banco"
                    body={bancoTemplate}
                    style={{ width: "150px" }}
                  />
                  <Column
                    header="Acciones"
                    body={accionesTemplate}
                    style={{ width: "100px" }}
                  />
                </DataTable>

                {/* TOTALES */}
                <div
                  className="grid mt-3"
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "1rem",
                    borderRadius: "4px",
                  }}
                >
                  <div className="col-12 md:col-4">
                    <strong>Monto Total CxC:</strong>{" "}
                    {monedasOptions
                      .find((m) => m.value === monedaId)
                      ?.label?.split(" - ")[0] || ""}{" "}
                    {formatearNumero(montoTotal, 2)}
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Monto Pagado:</strong>{" "}
                    {monedasOptions
                      .find((m) => m.value === monedaId)
                      ?.label?.split(" - ")[0] || ""}{" "}
                    {formatearNumero(montoPagado, 2)}
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Saldo Pendiente:</strong>{" "}
                    {monedasOptions
                      .find((m) => m.value === monedaId)
                      ?.label?.split(" - ")[0] || ""}{" "}
                    {formatearNumero(saldoPendiente, 2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OBSERVACIONES */}
          <div className="grid mb-3">
            <div className="col-12">
              <label htmlFor="observaciones">Observaciones</label>
              <InputTextarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                disabled={!puedeEditar}
                style={{ fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>
        </TabPanel>

        {/* TAB 2: ASIENTO CONTABLE */}
        {isEdit && (
          <TabPanel header="Asiento Contable" leftIcon="pi pi-book">
            <CardAsientoContable
              asientoContableId={defaultValues?.asientoContableId}
              onGenerarAsiento={() => onGenerarAsiento(defaultValues)}
              permisos={permisos}
              loading={loading}
              tituloCard="Asiento Contable"
            />
          </TabPanel>
        )}
      </TabView>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-content-end gap-2 mt-3">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          label="Guardar"
          icon="pi pi-save"
          onClick={handleSubmit}
          disabled={!puedeEditar}
          loading={loading}
        />
      </div>

      {/* DIALOG PARA REGISTRAR/EDITAR PAGO */}
      <Dialog
        header={isEditPago ? "Editar Pago" : "Registrar Pago"}
        visible={showPagoDialog}
        style={{ width: "600px" }}
        onHide={() => setShowPagoDialog(false)}
        modal
      >
        <PagoCuentaPorCobrarForm
          isEdit={isEditPago}
          defaultValues={{
            ...pagoSeleccionado,
            cuentaPorCobrarId: defaultValues.id, // ⭐ Pre-asignar la cuenta
          }}
          cuentasPorCobrar={[defaultValues]}
          monedas={monedas}
          mediosPago={mediosPago}
          bancos={bancos}
          cuentasCorrientes={cuentasCorrientes}
          onSubmit={handleSubmitPago}
          onCancel={() => setShowPagoDialog(false)}
          loading={false}
          readOnly={false}
          hideCuentaField={true} // ⭐ Ocultar el campo
        />
      </Dialog>
    </div>
  );
}
