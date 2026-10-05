// src/pages/PagoDeudaPersonal.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
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

/**
 * Lista de pagos de deudas con personal.
 *
 * Los pagos NO se crean aquí: se registran únicamente desde Caja y Bancos (pago especializado),
 * que genera movimientos, saldos y asientos. Esta pantalla sirve para consultarlos, completar
 * sus observaciones y adjuntos (voucher consolidado y comprobante de la entidad recaudadora)
 * mediante PagoDeudaPersonalForm y, con el derecho de eliminar, borrar un pago erróneo.
 */
const PagoDeudaPersonal = () => {
  const toast = useRef(null);
  const dt = useRef(null);

  const permisos = usePermissions("PAGO_DEUDA_PERSONAL");

  const [pagos, setPagos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

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
  const rightToolbarTemplate = () => {
    return (
      <Button
        label="Exportar"
        icon="pi pi-upload"
        className="p-button-help"
        onClick={exportCSV}
      />
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Pagos de Deudas con Personal</h4>
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
          <Column header="Personal" body={personalTemplate} sortable />
          <Column header="Tipo de Deuda" body={tipoDeudaTemplate} sortable />
          <Column header="Fecha Pago" body={fechaPagoTemplate} sortable />
          <Column header="Medio Pago" body={medioPagoTemplate} sortable />
          <Column header="Monto Pagado" body={montoTemplate} sortable />
          <Column field="numeroOperacion" header="N° Operación Bancaria" sortable />
          <Column header="Período Contable" body={periodoContableTemplate} sortable />
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
