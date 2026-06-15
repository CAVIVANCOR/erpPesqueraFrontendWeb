// src/pages/PagoDeudaTributaria.jsx
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
import { formatearNumero } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import {
  getPagosDeudaTributaria,
  createPagoDeudaTributaria,
  updatePagoDeudaTributaria,
  deletePagoDeudaTributaria,
} from "../api/tesoreria/pagoDeudaTributaria";
import { getDeudasTributarias } from "../api/tesoreria/deudaTributaria";
import { getAllMonedas } from "../api/moneda";
import { getMediosPago } from "../api/medioPago";
import PagoDeudaTributariaDialog from "../components/deudaTributaria/PagoDeudaTributariaDialog";

const PagoDeudaTributaria = () => {
  const toast = useRef(null);
  const dt = useRef(null);

  const permisos = usePermissions("PAGO_DEUDA_TRIBUTARIA");

  const [pagos, setPagos] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pagosData, deudasData, monedasData, mediosPagoData] = await Promise.all([
        getPagosDeudaTributaria(),
        getDeudasTributarias(),
        getAllMonedas(),
        getMediosPago(),
      ]);
      setPagos(pagosData || []);
      setDeudas(deudasData || []);
      setMonedas(monedasData || []);
      setMediosPago(mediosPagoData || []);
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

  const openNew = () => {
    setPagoSeleccionado(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const editPago = (pago) => {
    setPagoSeleccionado(pago);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setPagoSeleccionado(null);
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) {
        await updatePagoDeudaTributaria(pagoSeleccionado.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoDeudaTributaria(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }
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
    confirmDialog({
      message: `¿Está seguro de eliminar el pago de ${formatearNumero(pago.montoPagado, 2)}?`,
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
      await deletePagoDeudaTributaria(pago.id);
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
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nuevo Pago"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNew}
          disabled={!permisos?.puedeCrear}
        />
      </div>
    );
  };

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
      <h4 className="m-0">Gestión de Pagos de Deuda Tributaria</h4>
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

  const deudaTemplate = (rowData) => {
    const deuda = deudas.find((d) => Number(d.id) === Number(rowData.deudaTributariaId));
    if (!deuda) return "-";
    return `${deuda.periodo || ""} - ${deuda.tipoDeuda?.nombre || ""} (${deuda.numeroDeclaracion || "S/N"})`;
  };

  const fechaPagoTemplate = (rowData) => {
    return rowData.fechaPago
      ? new Date(rowData.fechaPago).toLocaleDateString("es-PE")
      : "-";
  };

  const medioPagoTemplate = (rowData) => {
    const medio = mediosPago.find((m) => Number(m.id) === Number(rowData.medioPagoId));
    return medio?.descripcion || "-";
  };

  const monedaPagoTemplate = (rowData) => {
    const moneda = monedas.find((m) => Number(m.id) === Number(rowData.monedaPagoId));
    const codigo = moneda?.codigoSunat || "-";
    return (
      <Tag
        value={codigo}
        style={{
          backgroundColor: moneda?.colorFondo || "#ffffff",
          color: "#000000",
        }}
      />
    );
  };

  const montoTemplate = (rowData) => {
    const moneda = monedas.find((m) => Number(m.id) === Number(rowData.monedaPagoId));
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
        {formatearNumero(rowData.montoPagado, 2)}
      </span>
    );
  };

  const montoAplicadoTemplate = (rowData) => {
    const deuda = deudas.find((d) => Number(d.id) === Number(rowData.deudaTributariaId));
    const moneda = monedas.find((m) => Number(m.id) === Number(deuda?.monedaId));
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
        {formatearNumero(rowData.montoAplicadoDeuda, 2)}
      </span>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => editPago(rowData)}
          disabled={!permisos?.puedeEditar}
          tooltip="Editar"
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
        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

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
          <Column header="Deuda" body={deudaTemplate} sortable />
          <Column header="Fecha Pago" body={fechaPagoTemplate} sortable />
          <Column header="Medio Pago" body={medioPagoTemplate} sortable />
          <Column header="Moneda" body={monedaPagoTemplate} sortable />
          <Column header="Monto Pagado" body={montoTemplate} sortable />
          <Column header="Monto Aplicado" body={montoAplicadoTemplate} sortable />
          <Column field="numeroOperacion" header="N° Operación" sortable />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "8rem" }}
            header="Acciones"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "600px" }}
        header={isEdit ? "Editar Pago" : "Registrar Pago"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <PagoDeudaTributariaDialog
          pago={pagoSeleccionado}
          deudaId={pagoSeleccionado?.deudaTributariaId}
          monedaDeudaId={
            deudas.find((d) => Number(d.id) === Number(pagoSeleccionado?.deudaTributariaId))
              ?.monedaId
          }
          saldoPendiente={
            deudas.find((d) => Number(d.id) === Number(pagoSeleccionado?.deudaTributariaId))
              ?.saldoPendiente || 0
          }
          monedas={monedas}
          mediosPago={mediosPago}
          onSubmit={handleSubmit}
          onCancel={hideDialog}
        />
      </Dialog>
    </div>
  );
};

export default PagoDeudaTributaria;