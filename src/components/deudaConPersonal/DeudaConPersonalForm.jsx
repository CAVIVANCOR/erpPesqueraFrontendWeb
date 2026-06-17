// src/components/deudaConPersonal/DeudaConPersonalForm.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import BooleanToggleButton from "../common/BooleanToggleButton"
import {
  getDeudaConPersonalById,
} from "../../api/tesoreria/deudaConPersonal";
import {
  getPagosDeudaPersonalByDeuda,
  createPagoDeudaPersonal,
  updatePagoDeudaPersonal,
  deletePagoDeudaPersonal,
} from "../../api/tesoreria/pagoDeudaPersonal";
import PagoDeudaPersonalDialog from "./PagoDeudaPersonalDialog";

const DeudaConPersonalForm = forwardRef((props, ref) => {
  const {
    isEdit,
    defaultValues,
    empresas,
    personal,
    tiposDeuda,
    monedas,
    estados,
    periodosContables,
    mediosPago,
    onSubmit,
    onCancel,
    loading,
    readOnly,
    permisos,
    toast,
  } = props;

  const { usuario } = useAuthStore();

  // Estados principales
  const [empresaId, setEmpresaId] = useState(defaultValues?.empresaId || null);
  const [personalId, setPersonalId] = useState(defaultValues?.personalId || null);
  const [tipoDeudaId, setTipoDeudaId] = useState(defaultValues?.tipoDeudaId || null);
  const [numeroDocumento, setNumeroDocumento] = useState(defaultValues?.numeroDocumento || "");
  const [fecha, setFecha] = useState(
    defaultValues?.fecha ? new Date(defaultValues.fecha) : new Date()
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : new Date()
  );
  const [monedaId, setMonedaId] = useState(defaultValues?.monedaId || null);
  const [montoOriginal, setMontoOriginal] = useState(defaultValues?.montoOriginal || 0);
  const [montoPagado, setMontoPagado] = useState(defaultValues?.montoPagado || 0);
  const [saldoPendiente, setSaldoPendiente] = useState(defaultValues?.saldoPendiente || 0);
  const [estadoId, setEstadoId] = useState(defaultValues?.estadoId || 100);
  const [observaciones, setObservaciones] = useState(defaultValues?.observaciones || "");
  const [esSaldoInicial, setEsSaldoInicial] = useState(defaultValues?.esSaldoInicial || false);
  const [esGerencial, setEsGerencial] = useState(defaultValues?.esGerencial || false);

  // Estados contabilidad
  const [fechaContable, setFechaContable] = useState(
    defaultValues?.fechaContable ? new Date(defaultValues.fechaContable) : new Date()
  );
  const [periodoContableId, setPeriodoContableId] = useState(
    defaultValues?.periodoContableId ? Number(defaultValues.periodoContableId) : null
  );

  // Estados auditoría
  const [creadoPor, setCreadoPor] = useState(defaultValues?.creadoPor || null);
  const [actualizadoPor, setActualizadoPor] = useState(defaultValues?.actualizadoPor || null);

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

  // Obtener color de moneda
  const getColorPorMoneda = () => {
    if (!monedaId) return "#ffffff";
    const moneda = monedas?.find((m) => Number(m.id) === Number(monedaId));
    return moneda?.colorFondo || "#ffffff";
  };

  const getColorPorMonedaPago = (monedaPagoId) => {
    const moneda = monedas?.find((m) => Number(m.id) === Number(monedaPagoId));
    return moneda?.colorFondo || "#ffffff";
  };

  // Recalcular montoPagado y saldoPendiente cuando cambien los pagos
  useEffect(() => {
    const totalPagado = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoAplicadoDeuda || 0),
      0
    );
    setMontoPagado(totalPagado);
    setSaldoPendiente(Number(montoOriginal) - totalPagado);
  }, [pagos, montoOriginal]);

  const cargarPagos = async () => {
    try {
      setLoadingPagos(true);
      const data = await getPagosDeudaPersonalByDeuda(defaultValues.id);
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

  const recargarDeudaDesdeBackend = async () => {
    if (!isEdit || !defaultValues?.id) return;

    try {
      const deudaActualizada = await getDeudaConPersonalById(defaultValues.id);
      setMontoOriginal(deudaActualizada.montoOriginal || 0);
      setMontoPagado(deudaActualizada.montoPagado || 0);
      setSaldoPendiente(deudaActualizada.saldoPendiente || 0);
      setEstadoId(deudaActualizada.estadoId || 100);
    } catch (error) {
      console.error("Error al recargar deuda desde backend:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    recargarDeudaDesdeBackend,
  }));

  const handleSubmit = () => {
    const data = {
      empresaId: Number(empresaId),
      personalId: Number(personalId),
      tipoDeudaId: Number(tipoDeudaId),
      numeroDocumento,
      fecha,
      fechaVencimiento,
      monedaId: Number(monedaId),
      montoOriginal: Number(montoOriginal),
      montoPagado: Number(montoPagado),
      saldoPendiente: Number(saldoPendiente),
      estadoId: Number(estadoId),
      observaciones,
      esSaldoInicial,
      esGerencial,
      fechaContable,
      periodoContableId: periodoContableId ? Number(periodoContableId) : null,
      creadoPor: isEdit ? creadoPor : usuario?.personalId ? Number(usuario.personalId) : null,
      actualizadoPor: isEdit && usuario?.personalId ? Number(usuario.personalId) : null,
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
      message: `¿Está seguro de eliminar el pago de ${formatearNumero(pago.montoPagado, 2)}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deletePagoDeudaPersonal(pago.id);
          toast?.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Pago eliminado correctamente",
            life: 3000,
          });
          await cargarPagos();
          await recargarDeudaDesdeBackend();
        } catch (error) {
          console.error("Error al eliminar pago:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "No se pudo eliminar el pago",
            life: 3000,
          });
        }
      },
    });
  };

  const handleSubmitPago = async (dataPago) => {
    try {
      if (isEditPago) {
        await updatePagoDeudaPersonal(pagoSeleccionado.id, dataPago);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoDeudaPersonal({
          ...dataPago,
          deudaConPersonalId: Number(defaultValues.id),
        });
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }
      setShowPagoDialog(false);
      await cargarPagos();
      await recargarDeudaDesdeBackend();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo guardar el pago",
        life: 3000,
      });
    }
  };

  // Templates para DataTable
  const montoTemplate = (rowData) => {
    return (
      <span
        style={{
          backgroundColor: getColorPorMonedaPago(rowData.monedaPagoId),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {formatearNumero(rowData.montoPagado, 2)}
      </span>
    );
  };

  const monedaPagoTemplate = (rowData) => {
    const moneda = monedas?.find((m) => Number(m.id) === Number(rowData.monedaPagoId));
    const codigo = moneda?.codigoSunat || "-";
    return (
      <span
        style={{
          backgroundColor: getColorPorMonedaPago(rowData.monedaPagoId),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        {codigo}
      </span>
    );
  };

  const montoAplicadoTemplate = (rowData) => {
    return (
      <span
        style={{
          backgroundColor: getColorPorMoneda(),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {formatearNumero(rowData.montoAplicadoDeuda || rowData.montoPagado, 2)}
      </span>
    );
  };

  const fechaPagoTemplate = (rowData) => {
    return rowData.fechaPago
      ? new Date(rowData.fechaPago).toLocaleDateString("es-PE")
      : "-";
  };

  const medioPagoTemplate = (rowData) => {
    const medio = mediosPago?.find((m) => Number(m.id) === Number(rowData.medioPagoId));
    return medio?.descripcion || "-";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => handleEditarPago(rowData)}
          disabled={readOnly || !permisos?.puedeEditar}
          tooltip="Editar pago"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => handleEliminarPago(rowData)}
          disabled={readOnly || !permisos?.puedeEliminar}
          tooltip="Eliminar pago"
        />
      </div>
    );
  };

  return (
    <>
      <ConfirmDialog />
      <TabView>
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <div className="p-fluid">

            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Empresa */}
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaId">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="empresaId"
                  value={empresaId}
                  options={empresas}
                  onChange={(e) => setEmpresaId(e.value)}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Seleccione empresa"
                  filter
                  disabled={readOnly || loading}
                />
              </div>

              {/* Personal */}
              <div style={{ flex: 1 }}>
                <label htmlFor="personalId">
                  Personal <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="personalId"
                  value={personalId}
                  options={personal}
                  onChange={(e) => setPersonalId(e.value)}
                  optionLabel="nombreCompleto"
                  optionValue="id"
                  placeholder="Seleccione personal"
                  filter
                  disabled={readOnly || loading}
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
              {/* Tipo Deuda */}
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoDeudaId">
                  Tipo de Deuda <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="tipoDeudaId"
                  value={tipoDeudaId}
                  options={tiposDeuda}
                  onChange={(e) => setTipoDeudaId(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione tipo de deuda"
                  filter
                  disabled={readOnly || loading}
                />
              </div>

              {/* Número Documento */}
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroDocumento">Número de Documento</label>
                <InputText
                  id="numeroDocumento"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Ej: 001-12345"
                  disabled={readOnly || loading}
                />
              </div>

              {/* Fecha */}
              <div style={{ flex: 1 }}>
                <label htmlFor="fecha">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <Calendar
                  id="fecha"
                  value={fecha}
                  onChange={(e) => setFecha(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly || loading}
                />
              </div>

              {/* Fecha Vencimiento */}
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaVencimiento">
                  Fecha Vencimiento <span className="text-red-500">*</span>
                </label>
                <Calendar
                  id="fechaVencimiento"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly || loading}
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

              {/* Moneda */}
              <div style={{ flex: 1 }}>
                <label htmlFor="monedaId">
                  Moneda <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="monedaId"
                  value={monedaId}
                  options={monedas}
                  onChange={(e) => setMonedaId(e.value)}
                  optionLabel="codigoSunat"
                  optionValue="id"
                  placeholder="Seleccione moneda"
                  disabled={readOnly || loading}
                />
              </div>

              {/* Monto Original */}
              <div style={{ flex: 1 }}>
                <label htmlFor="montoOriginal">
                  Monto Original <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  id="montoOriginal"
                  value={montoOriginal}
                  onValueChange={(e) => setMontoOriginal(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly || loading}
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>

              {/* Monto Pagado */}
              <div style={{ flex: 1 }}>
                <label htmlFor="montoPagado">Monto Pagado</label>
                <InputNumber
                  id="montoPagado"
                  value={montoPagado}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>

              {/* Saldo Pendiente */}
              <div style={{ flex: 1 }}>
                <label htmlFor="saldoPendiente">Saldo Pendiente</label>
                <InputNumber
                  id="saldoPendiente"
                  value={saldoPendiente}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
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
              {/* Estado */}
              <div style={{ flex: 1 }}>
                <label htmlFor="estadoId">Estado</label>
                <Dropdown
                  id="estadoId"
                  value={estadoId}
                  options={estados}
                  onChange={(e) => setEstadoId(e.value)}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Seleccione estado"
                  disabled={readOnly || loading}
                />
              </div>

              {/* Período Contable */}
              <div style={{ flex: 1 }}>
                <label htmlFor="periodoContableId">Período Contable</label>
                <Dropdown
                  id="periodoContableId"
                  value={periodoContableId}
                  options={periodosContables}
                  onChange={(e) => setPeriodoContableId(e.value)}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Seleccione período"
                  filter
                  showClear
                  disabled={readOnly || loading}
                />
              </div>

              {/* Checkboxes */}
              <div style={{ flex: 1 }}>
                <BooleanToggleButton
                  value={esSaldoInicial}
                  onChange={(val) => setEsSaldoInicial(val)}
                  labelTrue="SALDO INICIAL"
                  labelFalse="SALDO INICIAL"
                  severityTrue="primary"
                  severityFalse="secondary"
                  size="large"
                />
              </div>

              <div style={{ flex: 1 }}>
                <BooleanToggleButton
                  value={esGerencial}
                  onChange={(val) => setEsGerencial(val)}
                  labelTrue="GERENCIAL"
                  labelFalse="FISCAL"
                  severityTrue="success"
                  severityFalse="info"
                  size="large"
                />

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
              {/* Observaciones */}
              <div style={{ flex: 1 }}>
                <label htmlFor="observaciones">Observaciones</label>
                <InputTextarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  disabled={readOnly || loading}
                />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <Button
              label="Registrar Pago"
              icon="pi pi-plus"
              className="p-button-success"
              onClick={handleRegistrarPago}
              disabled={readOnly || !permisos?.puedeCrear || loading}
            />
          </div>

          <DataTable
            value={pagos}
            loading={loadingPagos}
            emptyMessage="No hay pagos registrados"
            size="small"
            stripedRows
            showGridlines
          >
            <Column field="id" header="ID" style={{ width: "80px" }} />
            <Column header="Fecha Pago" body={fechaPagoTemplate} />
            <Column header="Medio Pago" body={medioPagoTemplate} />
            <Column header="Moneda Pago" body={monedaPagoTemplate} />
            <Column header="Monto Pagado" body={montoTemplate} />
            <Column header="Monto Aplicado" body={montoAplicadoTemplate} />
            <Column field="numeroOperacion" header="N° Operación" />
            <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
          </DataTable>
        </TabPanel>
      </TabView>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-warning"
          onClick={onCancel}
          disabled={loading}
          outlined
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleSubmit}
          loading={loading}
          disabled={readOnly || loading}
        />
      </div>

      {/* Dialog para pagos */}
      <Dialog
        visible={showPagoDialog}
        style={{ width: "600px" }}
        header={isEditPago ? "Editar Pago" : "Registrar Pago"}
        modal
        onHide={() => setShowPagoDialog(false)}
      >
        <PagoDeudaPersonalDialog
          pago={pagoSeleccionado}
          deudaId={defaultValues?.id}
          monedaDeudaId={monedaId}
          saldoPendiente={saldoPendiente}
          monedas={monedas}
          mediosPago={mediosPago}
          onSubmit={handleSubmitPago}
          onCancel={() => setShowPagoDialog(false)}
        />
      </Dialog>
    </>
  );
});

export default DeudaConPersonalForm;