// src/pages/PagoDeudaPersonal.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { formatearNumero, formatearFecha } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import {
  getPagosDeudaPersonal,
  updatePagoDeudaPersonal,
  deletePagoDeudaPersonal,
} from "../api/tesoreria/pagoDeudaPersonal";
import { getMediosPago } from "../api/medioPago";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import PagoDeudaPersonalForm from "../components/deudaConPersonal/PagoDeudaPersonalForm";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Lista de pagos de deudas con personal.
 *
 * Los pagos NO se crean aquí: se registran únicamente desde Caja y Bancos (pago especializado),
 * que genera movimientos, saldos y asientos. Esta pantalla sirve para consultarlos, completar
 * sus observaciones y adjuntos (voucher consolidado y comprobante de la entidad recaudadora)
 * mediante PagoDeudaPersonalForm y, con el derecho de eliminar, borrar un pago erróneo.
 */
const obtenerOpcionesUnicas = (datos, obtener) => [
  ...new Map(
    datos
      .map(obtener)
      .filter(Boolean)
      .map((item) => [Number(item.id), item]),
  ).values(),
];

const PagoDeudaPersonal = () => {
  const toast = useRef(null);
  const dt = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  const permisos = usePermissions("PAGO_DEUDA_PERSONAL");

  const [pagos, setPagos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [tipoDeudaSeleccionado, setTipoDeudaSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [medioPagoSeleccionado, setMedioPagoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [nroOperacionBusqueda, setNroOperacionBusqueda] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pagosData, mediosPagoData, periodosData] = await Promise.all([
        getPagosDeudaPersonal(),
        getMediosPago(),
        getPeriodosContables(),
      ]);
      setPagos(pagosData || []);
      setMediosPago(mediosPagoData || []);
      setPeriodosContables(periodosData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const pagosDeEmpresa = useMemo(
    () => empresaSeleccionada
      ? pagos.filter((p) => Number(p.deudaConPersonal?.empresaId) === Number(empresaSeleccionada))
      : pagos,
    [pagos, empresaSeleccionada],
  );

  const personalUnico = useMemo(
    () => obtenerOpcionesUnicas(pagosDeEmpresa, (p) => p.deudaConPersonal?.personal)
      .sort((a, b) => `${a.nombres || ""} ${a.apellidos || ""}`.localeCompare(`${b.nombres || ""} ${b.apellidos || ""}`)),
    [pagosDeEmpresa],
  );

  const tiposDeudaUnicos = useMemo(
    () => obtenerOpcionesUnicas(pagosDeEmpresa, (p) => p.deudaConPersonal?.tipoDeuda)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")),
    [pagosDeEmpresa],
  );

  const mediosPagoUnicos = useMemo(
    () => obtenerOpcionesUnicas(pagosDeEmpresa, (p) => p.medioPago)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")),
    [pagosDeEmpresa],
  );

  const monedasUnicas = useMemo(
    () => obtenerOpcionesUnicas(pagosDeEmpresa, (p) => p.deudaConPersonal?.moneda)
      .sort((a, b) => (a.codigoSunat || "").localeCompare(b.codigoSunat || "")),
    [pagosDeEmpresa],
  );

  const periodosUnicos = useMemo(
    () => obtenerOpcionesUnicas(pagosDeEmpresa, (p) => p.periodoContable)
      .sort((a, b) => (a.nombrePeriodo || "").localeCompare(b.nombrePeriodo || "")),
    [pagosDeEmpresa],
  );

  const pagosFiltrados = useMemo(() => {
    let filtrados = pagosDeEmpresa;

    if (personalSeleccionado) {
      filtrados = filtrados.filter((p) => Number(p.deudaConPersonal?.personalId) === Number(personalSeleccionado));
    }
    if (tipoDeudaSeleccionado) {
      filtrados = filtrados.filter((p) => Number(p.deudaConPersonal?.tipoDeudaId) === Number(tipoDeudaSeleccionado));
    }
    if (rangoFechas?.[0]) {
      const desde = new Date(rangoFechas[0]);
      desde.setHours(0, 0, 0, 0);
      const hasta = rangoFechas[1] ? new Date(rangoFechas[1]) : null;
      hasta?.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter((p) => {
        const fecha = new Date(p.fechaPago);
        return fecha >= desde && (!hasta || fecha <= hasta);
      });
    }
    if (medioPagoSeleccionado) {
      filtrados = filtrados.filter((p) => Number(p.medioPagoId) === Number(medioPagoSeleccionado));
    }
    if (monedaSeleccionada) {
      filtrados = filtrados.filter((p) => Number(p.deudaConPersonal?.monedaId) === Number(monedaSeleccionada));
    }
    if (periodoSeleccionado) {
      filtrados = filtrados.filter((p) => Number(p.periodoContableId) === Number(periodoSeleccionado));
    }
    if (nroOperacionBusqueda.trim()) {
      const busqueda = nroOperacionBusqueda.trim().toLowerCase();
      filtrados = filtrados.filter((p) =>
        String(p.numeroOperacion || "").toLowerCase().includes(busqueda) ||
        String(p.refOperacionEspecializadaMovCaja || "").toLowerCase().includes(busqueda),
      );
    }

    return filtrados;
  }, [pagosDeEmpresa, personalSeleccionado, tipoDeudaSeleccionado, rangoFechas, medioPagoSeleccionado, monedaSeleccionada, periodoSeleccionado, nroOperacionBusqueda]);

  useEffect(() => {
    if (personalSeleccionado && !personalUnico.some((p) => Number(p.id) === Number(personalSeleccionado))) {
      setPersonalSeleccionado(null);
    }
    if (tipoDeudaSeleccionado && !tiposDeudaUnicos.some((t) => Number(t.id) === Number(tipoDeudaSeleccionado))) {
      setTipoDeudaSeleccionado(null);
    }
  }, [personalUnico, tiposDeudaUnicos, personalSeleccionado, tipoDeudaSeleccionado]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setPersonalSeleccionado(null);
    setTipoDeudaSeleccionado(null);
    setRangoFechas(null);
    setMedioPagoSeleccionado(null);
    setMonedaSeleccionada(null);
    setPeriodoSeleccionado(null);
    setNroOperacionBusqueda("");
  };

  const verPago = (pago) => {
    setPagoSeleccionado(pago);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setPagoSeleccionado(null);
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      await updatePagoDeudaPersonal(pagoSeleccionado.id, data);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago actualizado correctamente",
        life: 3000,
      });
      hideDialog();
      await cargarDatos();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo guardar el pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (pago) => {
    // Eliminar no revierte los movimientos de caja ni los asientos que el pago haya generado
    const advertenciaCaja = pago.movimientoCajaId
      ? " Este pago se generó desde Caja y Bancos: al eliminarlo NO se revierten sus movimientos de caja ni sus asientos contables."
      : "";
    confirmDialog({
      message: `¿Está seguro de eliminar el pago de ${formatearNumero(pago.montoPago, 2)}?${advertenciaCaja}`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () => handleDelete(pago),
    });
  };

  const handleDelete = async (pago) => {
    try {
      setLoading(true);
      await deletePagoDeudaPersonal(pago.id);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago eliminado correctamente",
        life: 3000,
      });
      await cargarDatos();
    } catch (error) {
      console.error("Error al eliminar pago:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo eliminar el pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    dt.current.exportCSV();
  };

  // Templates
  const leftToolbarTemplate = () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        label="Actualizar"
        icon="pi pi-refresh"
        className="p-button-info"
        onClick={cargarDatos}
        loading={loading}
      />
      <Button
        label="Limpiar Filtros"
        icon="pi pi-filter-slash"
        className="p-button-secondary"
        outlined
        onClick={limpiarFiltros}
        disabled={loading}
      />
    </div>
  );

  const rightToolbarTemplate = () => (
    <Button
      label="Exportar"
      icon="pi pi-upload"
      className="p-button-help"
      onClick={exportCSV}
    />
  );

  const filtroDropdown = (id, etiqueta, value, onChange, opciones, placeholder = "Todos") => (
    <div style={{ flex: 2 }}>
      <label htmlFor={id} style={{ fontWeight: "bold" }}>{etiqueta}</label>
      <Dropdown
        id={id}
        value={value}
        options={opciones}
        onChange={(e) => onChange(e.value)}
        placeholder={placeholder}
        optionLabel="label"
        optionValue="value"
        showClear
        filter
        disabled={loading}
        style={{ width: "100%" }}
      />
    </div>
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-end">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </span>
    </div>
  );

  const empresaTemplate = (rowData) => rowData.deudaConPersonal?.empresa?.razonSocial || "-";

  const personalTemplate = (rowData) => {
    const personal = rowData.deudaConPersonal?.personal;
    return personal ? `${personal.nombres || ""} ${personal.apellidos || ""}`.trim() : "-";
  };

  const tipoDeudaTemplate = (rowData) => rowData.deudaConPersonal?.tipoDeuda?.nombre || "-";

  const fechaPagoTemplate = (rowData) => formatearFecha(rowData.fechaPago, "-");

  const medioPagoTemplate = (rowData) => {
    const medio =
      rowData.medioPago ||
      mediosPago.find((m) => Number(m.id) === Number(rowData.medioPagoId));
    return medio?.nombre || "-";
  };

  // El pago siempre está en la moneda de la deuda (PagoDeudaPersonal no tiene moneda propia)
  const montoTemplate = (rowData) => {
    const moneda = rowData.deudaConPersonal?.moneda;
    return (
      <span
        style={{
          backgroundColor: moneda?.colorFondo || "#ffffff",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {moneda?.simbolo} {formatearNumero(rowData.montoPago, 2)}
      </span>
    );
  };

  const periodoContableTemplate = (rowData) => {
    const periodo =
      rowData.periodoContable ||
      periodosContables.find((p) => Number(p.id) === Number(rowData.periodoContableId));
    return periodo?.nombrePeriodo || "-";
  };

  // Indica si el pago ya tiene cada adjunto cargado
  const adjuntosTemplate = (rowData) => (
    <div className="flex gap-2 justify-content-center">
      <i
        className={`pi pi-file-pdf ${rowData.urlVoucherOperacionConsolidado ? "text-green-500" : "text-300"}`}
        title={rowData.urlVoucherOperacionConsolidado ? "Voucher consolidado cargado" : "Sin voucher consolidado"}
      />
      <i
        className={`pi pi-paperclip ${rowData.urlComprobanteOperacion ? "text-green-500" : "text-300"}`}
        title={rowData.urlComprobanteOperacion ? "Comprobante cargado" : "Sin comprobante"}
      />
    </div>
  );

  const origenTemplate = (rowData) =>
    rowData.movimientoCajaId ? (
      <Tag severity="success" value="Caja y Bancos" />
    ) : (
      <Tag severity="warning" value="Sin caja" />
    );

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={permisos?.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => verPago(rowData)}
          tooltip={permisos?.puedeEditar ? "Ver / Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDelete(rowData)}
          disabled={!permisos?.puedeEliminar}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  return (
    <div className="datatable-crud">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Pagos de Deudas con Personal</h2>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontWeight: "bold" }}>Empresa</label>
              <EmpresaSelector
                empresaId={usuario?.empresaId}
                onEmpresaChange={setEmpresaSeleccionada}
              />
            </div>
          </div>
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              marginTop: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {filtroDropdown(
              "personalFiltro",
              "Personal",
              personalSeleccionado,
              setPersonalSeleccionado,
              personalUnico.map((p) => ({
                label: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
                value: Number(p.id),
              })),
            )}
            {filtroDropdown(
              "tipoDeudaFiltro",
              "Tipo de Deuda",
              tipoDeudaSeleccionado,
              setTipoDeudaSeleccionado,
              tiposDeudaUnicos.map((t) => ({ label: t.nombre, value: Number(t.id) })),
            )}
            <div style={{ flex: 2 }}>
              <label htmlFor="rangoFechas" style={{ fontWeight: "bold" }}>Rango de Fechas (Pago)</label>
              <Calendar
                id="rangoFechas"
                value={rangoFechas}
                onChange={(e) => setRangoFechas(e.value)}
                selectionMode="range"
                dateFormat="dd/mm/yy"
                showIcon
                placeholder="Seleccionar rango..."
                style={{ width: "100%" }}
                disabled={loading}
                readOnlyInput
              />
            </div>
          </div>
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              marginTop: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {filtroDropdown(
              "medioPagoFiltro",
              "Medio de Pago",
              medioPagoSeleccionado,
              setMedioPagoSeleccionado,
              mediosPagoUnicos.map((m) => ({ label: m.nombre, value: Number(m.id) })),
            )}
            {filtroDropdown(
              "monedaFiltro",
              "Moneda",
              monedaSeleccionada,
              setMonedaSeleccionada,
              monedasUnicas.map((m) => ({ label: m.codigoSunat, value: Number(m.id) })),
              "Todas",
            )}
            {filtroDropdown(
              "periodoFiltro",
              "Período Contable",
              periodoSeleccionado,
              setPeriodoSeleccionado,
              periodosUnicos.map((p) => ({ label: p.nombrePeriodo, value: Number(p.id) })),
            )}
            <div style={{ flex: 2 }}>
              <label htmlFor="nroOperacionInput" style={{ fontWeight: "bold" }}>N° Operación</label>
              <InputText
                id="nroOperacionInput"
                value={nroOperacionBusqueda}
                onChange={(e) => setNroOperacionBusqueda(e.target.value)}
                placeholder="Buscar por N° de operación..."
                style={{ width: "100%" }}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

        <DataTable
          ref={dt}
          value={pagosFiltrados}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pagos"
          globalFilter={globalFilter}
          globalFilterFields={[
            "refOperacionEspecializadaMovCaja",
            "numeroOperacion",
            "deudaConPersonal.personal.nombres",
            "deudaConPersonal.personal.apellidos",
            "deudaConPersonal.tipoDeuda.nombre",
            "deudaConPersonal.empresa.razonSocial",
          ]}
          header={header}
          loading={loading}
          emptyMessage="No se encontraron pagos"
          size="small"
          stripedRows
          showGridlines
        >
          <Column field="id" header="ID" sortable style={{ minWidth: "4rem" }} />
          <Column
            field="refOperacionEspecializadaMovCaja"
            header="Operación"
            sortable
            style={{ minWidth: "6rem" }}
          />
          <Column header="Empresa" body={empresaTemplate} sortable sortField="deudaConPersonal.empresa.razonSocial" />
          <Column header="Personal" body={personalTemplate} sortable sortField="deudaConPersonal.personal.apellidos" />
          <Column header="Tipo de Deuda" body={tipoDeudaTemplate} sortable sortField="deudaConPersonal.tipoDeuda.nombre" />
          <Column header="Fecha Pago" body={fechaPagoTemplate} field="fechaPago" sortable />
          <Column header="Medio Pago" body={medioPagoTemplate} sortable sortField="medioPago.nombre" />
          <Column header="Monto Pagado" body={montoTemplate} field="montoPago" sortable />
          <Column field="numeroOperacion" header="N° Operación Bancaria" sortable />
          <Column header="Período Contable" body={periodoContableTemplate} sortable sortField="periodoContable.nombrePeriodo" />
          <Column header="Origen" body={origenTemplate} />
          <Column header="Adjuntos" body={adjuntosTemplate} exportable={false} />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "6rem" }}
            header="Acciones"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "1200px" }}
        header="Editar Pago"
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        {pagoSeleccionado && (
          <PagoDeudaPersonalForm
            key={pagoSeleccionado.id}
            isEdit={true}
            defaultValues={pagoSeleccionado}
            mediosPago={mediosPago}
            periodosContables={periodosContables}
            onSubmit={handleSubmit}
            onCancel={hideDialog}
            onAdjuntosCambiados={cargarDatos}
            readOnly={!permisos?.puedeEditar}
            loading={loading}
            toast={toast}
          />
        )}
      </Dialog>
    </div>
  );
};

export default PagoDeudaPersonal;
