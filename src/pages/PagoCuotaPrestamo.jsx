// src/pages/PagoCuotaPrestamo.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Navigate } from "react-router-dom";
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
import { ConfirmDialog } from "primereact/confirmdialog";
import { formatearNumero, formatearFecha } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import {
  getPagosCuotaPrestamo,
  updatePagoCuotaPrestamo,
  deletePagoCuotaPrestamo,
} from "../api/tesoreria/pagoCuotaPrestamo";
import PagoCuotaPrestamoForm from "../components/pagoCuotaPrestamo/PagoCuotaPrestamoForm";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Lista de pagos de cuotas de préstamo.
 *
 * Los pagos NO se crean aquí: se registran únicamente desde Caja y Bancos (pago especializado de
 * cuotas), que genera movimientos, saldos y asientos. Esta pantalla sirve para consultarlos,
 * completar sus observaciones y adjuntos (voucher consolidado y comprobante del banco) mediante
 * PagoCuotaPrestamoForm y, con el derecho de eliminar, borrar un pago erróneo. Al editar o
 * eliminar, el backend recalcula la cuota y el préstamo desde los pagos que quedan.
 */
const PagoCuotaPrestamo = ({ ruta }) => {
  const toast = useRef(null);
  const dt = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  const permisos = usePermissions(ruta);

  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // ESTADOS DE FILTROS
  // ═══════════════════════════════════════════════════════════
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [nroOperacionBusqueda, setNroOperacionBusqueda] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const pagosData = await getPagosCuotaPrestamo();
      setPagos(pagosData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // OPCIONES ÚNICAS DINÁMICAS PARA FILTROS
  // ═══════════════════════════════════════════════════════════
  const bancosUnicos = useMemo(() => {
    const mapa = new Map();
    pagos.forEach((p) => {
      const banco = p.cuotaPrestamo?.prestamo?.banco;
      if (banco) mapa.set(Number(banco.id), banco);
    });
    return [...mapa.values()].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [pagos]);

  const prestamosUnicos = useMemo(() => {
    let datos = pagos;
    if (empresaSeleccionada) {
      datos = datos.filter((p) => Number(p.cuotaPrestamo?.prestamo?.empresaId) === Number(empresaSeleccionada));
    }
    if (bancoSeleccionado) {
      datos = datos.filter((p) => Number(p.cuotaPrestamo?.prestamo?.bancoId) === Number(bancoSeleccionado));
    }
    const mapa = new Map();
    datos.forEach((p) => {
      const prestamo = p.cuotaPrestamo?.prestamo;
      if (prestamo) mapa.set(Number(prestamo.id), prestamo);
    });
    return [...mapa.values()].sort((a, b) => (a.numeroPrestamo || "").localeCompare(b.numeroPrestamo || ""));
  }, [pagos, empresaSeleccionada, bancoSeleccionado]);

  const monedasUnicas = useMemo(() => {
    const mapa = new Map();
    pagos.forEach((p) => {
      const moneda = p.cuotaPrestamo?.prestamo?.moneda;
      if (moneda) mapa.set(Number(moneda.id), moneda);
    });
    return [...mapa.values()].sort((a, b) => (a.codigoSunat || "").localeCompare(b.codigoSunat || ""));
  }, [pagos]);

  // ═══════════════════════════════════════════════════════════
  // APLICAR FILTROS
  // ═══════════════════════════════════════════════════════════
  const pagosFiltrados = useMemo(() => {
    let filtrados = pagos;

    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (p) => Number(p.cuotaPrestamo?.prestamo?.empresaId) === Number(empresaSeleccionada),
      );
    }

    if (bancoSeleccionado) {
      filtrados = filtrados.filter(
        (p) => Number(p.cuotaPrestamo?.prestamo?.bancoId) === Number(bancoSeleccionado),
      );
    }

    if (prestamoSeleccionado) {
      filtrados = filtrados.filter(
        (p) => Number(p.cuotaPrestamo?.prestamoId) === Number(prestamoSeleccionado),
      );
    }

    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((p) => {
        const fecha = new Date(p.fechaPago);
        const desde = new Date(rangoFechas[0]);
        desde.setHours(0, 0, 0, 0);
        if (rangoFechas[1]) {
          const hasta = new Date(rangoFechas[1]);
          hasta.setHours(23, 59, 59, 999);
          return fecha >= desde && fecha <= hasta;
        }
        return fecha >= desde;
      });
    }

    if (monedaSeleccionada) {
      filtrados = filtrados.filter(
        (p) => Number(p.cuotaPrestamo?.prestamo?.monedaId) === Number(monedaSeleccionada),
      );
    }

    if (nroOperacionBusqueda && nroOperacionBusqueda.trim() !== "") {
      const busqueda = nroOperacionBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter((p) => {
        const ref = String(p.refOperacionEspecializadaMovCaja || "");
        return ref.toLowerCase().includes(busqueda);
      });
    }

    return filtrados;
  }, [pagos, empresaSeleccionada, bancoSeleccionado, prestamoSeleccionado, rangoFechas, monedaSeleccionada, nroOperacionBusqueda]);

  // Limpiar selecciones downstream al cambiar banco/empresa
  useEffect(() => {
    if (prestamoSeleccionado && !prestamosUnicos.find((p) => Number(p.id) === Number(prestamoSeleccionado))) {
      setPrestamoSeleccionado(null);
    }
  }, [prestamosUnicos, prestamoSeleccionado]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setBancoSeleccionado(null);
    setPrestamoSeleccionado(null);
    setRangoFechas(null);
    setMonedaSeleccionada(null);
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
      await updatePagoCuotaPrestamo(pagoSeleccionado.id, data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago actualizado correctamente",
        life: 3000,
      });
      hideDialog();
      await cargarDatos();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo guardar el pago",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar no revierte los movimientos de caja ni los asientos que el pago haya generado
  const confirmDelete = (pago) => {
    if (!permisos.puedeEliminar) return;
    setPagoAEliminar(pago);
  };

  const handleDelete = async () => {
    const pago = pagoAEliminar;
    if (!pago) return;
    setPagoAEliminar(null);
    try {
      setLoading(true);
      await deletePagoCuotaPrestamo(pago.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago eliminado correctamente. La cuota y el préstamo se recalcularon.",
        life: 4000,
      });
      await cargarDatos();
    } catch (error) {
      console.error("Error al eliminar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo eliminar el pago",
        life: 4000,
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
    <Button label="Exportar" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />
  );

  const filtroDropdown = (id, etiqueta, value, onChange, opciones, placeholder = "Todos") => (
    <div style={{ flex: 2 }}>
      <label htmlFor={id} style={{ fontWeight: "bold" }}>
        {etiqueta}
      </label>
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

  const prestamoDe = (rowData) => rowData.cuotaPrestamo?.prestamo;

  const empresaTemplate = (rowData) => prestamoDe(rowData)?.empresa?.razonSocial || "-";
  const prestamoTemplate = (rowData) => prestamoDe(rowData)?.numeroPrestamo || "-";
  const bancoTemplate = (rowData) => prestamoDe(rowData)?.banco?.nombre || "-";

  const cuotaTemplate = (rowData) =>
    rowData.cuotaPrestamo
      ? `${rowData.cuotaPrestamo.numeroCuota} / ${prestamoDe(rowData)?.numeroCuotas ?? "-"}`
      : "-";

  const fechaPagoTemplate = (rowData) => formatearFecha(rowData.fechaPago, "-");

  // El pago siempre está en la moneda del préstamo (PagoCuotaPrestamo no tiene moneda propia)
  const montoTemplate = (valor, resaltar = false) => (rowData) => {
    const moneda = prestamoDe(rowData)?.moneda;
    return (
      <span
        style={{
          backgroundColor: resaltar ? moneda?.colorFondo || "#ffffff" : "transparent",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: resaltar ? "bold" : "normal",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {moneda?.simbolo} {formatearNumero(valor(rowData), 2)}
      </span>
    );
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

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon={permisos.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        className="p-button-rounded p-button-warning p-button-sm"
        onClick={() => verPago(rowData)}
        tooltip={permisos.puedeEditar ? "Ver / Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-sm"
        onClick={() => confirmDelete(rowData)}
        disabled={!permisos.puedeEliminar}
        tooltip="Eliminar"
      />
    </div>
  );

  // Sin acceso se redirige; va después de los hooks y de las funciones para respetar el orden de hooks
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return (
    <div className="datatable-crud">
      <Toast ref={toast} />

      {/* Confirmación controlada por estado: un ConfirmDialog con `message` no escucha a
          confirmDialog() global, así que no se abre junto a los de otras pantallas */}
      <ConfirmDialog
        visible={!!pagoAEliminar}
        onHide={() => setPagoAEliminar(null)}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        message={
          <span>
            ¿Está seguro de eliminar el pago de{" "}
            <b>
              {pagoAEliminar
                ? `${prestamoDe(pagoAEliminar)?.moneda?.simbolo || ""} ${formatearNumero(pagoAEliminar.montoTotal, 2)}`
                : ""}
            </b>
            ?
            <br />
            <small>
              Se recalcularán la cuota y el préstamo.
              {pagoAEliminar?.movimientoCajaId &&
                " Este pago se generó desde Caja y Bancos: NO se revierten sus movimientos de caja ni sus asientos contables; deberá eliminarlos aparte."}
            </small>
          </span>
        }
        acceptLabel="Sí, eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
        accept={handleDelete}
        reject={() => setPagoAEliminar(null)}
        style={{ width: "30rem" }}
        breakpoints={{ "640px": "90vw" }}
      />

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
              <h2>Pagos de Cuotas de Préstamos</h2>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontWeight: "bold" }}>Empresa</label>
              <EmpresaSelector
                empresaId={usuario?.empresaId}
                onEmpresaChange={(id) => setEmpresaSeleccionada(id)}
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
              "bancoFiltro",
              "Banco",
              bancoSeleccionado,
              setBancoSeleccionado,
              bancosUnicos.map((b) => ({ label: b.nombre, value: Number(b.id) }))
            )}
            {filtroDropdown(
              "prestamoFiltro",
              "Préstamo",
              prestamoSeleccionado,
              setPrestamoSeleccionado,
              prestamosUnicos.map((p) => ({ label: p.numeroPrestamo, value: Number(p.id) }))
            )}
            <div style={{ flex: 2 }}>
              <label htmlFor="rangoFechas" style={{ fontWeight: "bold" }}>
                Rango de Fechas (Pago)
              </label>
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
              "monedaFiltro",
              "Moneda",
              monedaSeleccionada,
              setMonedaSeleccionada,
              monedasUnicas.map((m) => ({ label: m.codigoSunat, value: Number(m.id) })),
              "Todas"
            )}
            <div style={{ flex: 2 }}>
              <label htmlFor="nroOperacionInput" style={{ fontWeight: "bold" }}>
                N° Operación
              </label>
              <InputText
                id="nroOperacionInput"
                value={nroOperacionBusqueda}
                onChange={(e) => setNroOperacionBusqueda(e.target.value)}
                placeholder="Buscar por N° Operación..."
                style={{ width: "100%" }}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

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
            "cuotaPrestamo.prestamo.numeroPrestamo",
            "cuotaPrestamo.prestamo.banco.nombre",
            "cuotaPrestamo.prestamo.empresa.razonSocial",
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
          <Column header="Empresa" body={empresaTemplate} sortable sortField="cuotaPrestamo.prestamo.empresa.razonSocial" />
          <Column header="Préstamo" body={prestamoTemplate} sortable sortField="cuotaPrestamo.prestamo.numeroPrestamo" />
          <Column header="Banco" body={bancoTemplate} sortable sortField="cuotaPrestamo.prestamo.banco.nombre" />
          <Column header="Cuota" body={cuotaTemplate} style={{ minWidth: "5rem" }} />
          <Column header="Fecha Pago" body={fechaPagoTemplate} sortable sortField="fechaPago" />
          <Column header="Capital" body={montoTemplate((r) => r.montoCapital)} />
          <Column header="Interés" body={montoTemplate((r) => r.montoInteres)} />
          <Column
            header="Seg. / Com."
            body={montoTemplate((r) => Number(r.montoSeguro || 0) + Number(r.montoComision || 0))}
          />
          <Column header="Mora" body={montoTemplate((r) => r.montoMora)} />
          <Column header="Total Pagado" body={montoTemplate((r) => r.montoTotal, true)} sortable sortField="montoTotal" />
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
        header="Editar Pago de Cuota"
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        {pagoSeleccionado && (
          <PagoCuotaPrestamoForm
            key={pagoSeleccionado.id}
            isEdit={true}
            defaultValues={pagoSeleccionado}
            onSubmit={handleSubmit}
            onCancel={hideDialog}
            onAdjuntosCambiados={cargarDatos}
            readOnly={!permisos.puedeEditar}
            loading={loading}
            toast={toast}
          />
        )}
      </Dialog>
    </div>
  );
};

export default PagoCuotaPrestamo;
