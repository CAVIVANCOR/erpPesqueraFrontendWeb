// src/pages/PagoCuotaPrestamo.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { ConfirmDialog } from "primereact/confirmdialog";
import { formatearNumero, formatearFecha } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import {
  getPagosCuotaPrestamo,
  updatePagoCuotaPrestamo,
  deletePagoCuotaPrestamo,
} from "../api/tesoreria/pagoCuotaPrestamo";
import PagoCuotaPrestamoForm from "../components/pagoCuotaPrestamo/PagoCuotaPrestamoForm";

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

  const permisos = usePermissions(ruta);

  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);

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
  const rightToolbarTemplate = () => (
    <Button label="Exportar" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Pagos de Cuotas de Préstamos</h4>
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
        <Toolbar className="mb-4" right={rightToolbarTemplate} />

        <DataTable
          ref={dt}
          value={pagos}
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
