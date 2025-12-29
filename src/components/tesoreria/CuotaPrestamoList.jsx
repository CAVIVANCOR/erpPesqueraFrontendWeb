// src/components/tesoreria/CuotaPrestamoList.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import CuotaPrestamoForm from "./CuotaPrestamoForm";
import {
  getCuotasPorPrestamo,
  deleteCuotaPrestamo,
  createCuotaPrestamo,
  updateCuotaPrestamo,
  registrarPagoCuota,
} from "../../api/tesoreria/cuotaPrestamo";

export default function CuotaPrestamoList({ prestamoBancarioId, readOnly = false }) {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogPagoVisible, setDialogPagoVisible] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const toast = useRef(null);

  useEffect(() => {
    if (prestamoBancarioId) {
      cargarCuotas();
    }
  }, [prestamoBancarioId]);

  const cargarCuotas = async () => {
    try {
      setLoading(true);
      const data = await getCuotasPorPrestamo(prestamoBancarioId);
      setCuotas(data);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar cuotas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const openNew = () => {
    setSelectedCuota(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (cuota) => {
    setSelectedCuota(cuota);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const openPago = (cuota) => {
    setSelectedCuota(cuota);
    setDialogPagoVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setDialogPagoVisible(false);
    setSelectedCuota(null);
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit && selectedCuota) {
        await updateCuotaPrestamo(selectedCuota.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuota actualizada correctamente",
          life: 3000,
        });
      } else {
        await createCuotaPrestamo({ ...data, prestamoBancarioId: Number(prestamoBancarioId) });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuota creada correctamente",
          life: 3000,
        });
      }
      hideDialog();
      await cargarCuotas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar cuota",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePago = async (data) => {
    try {
      setLoading(true);
      await registrarPagoCuota(selectedCuota.id, data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago registrado correctamente",
        life: 3000,
      });
      hideDialog();
      await cargarCuotas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al registrar pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (cuota) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cuota ${cuota.numeroCuota}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => handleDelete(cuota.id),
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteCuotaPrestamo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cuota eliminada correctamente",
        life: 3000,
      });
      await cargarCuotas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar cuota",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nueva Cuota"
          icon="pi pi-plus"
          severity="success"
          onClick={openNew}
          disabled={readOnly}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Buscar..."
        />
      </span>
    );
  };

  const estadoBodyTemplate = (rowData) => {
    const severity = rowData.estado === "PAGADA" ? "success" : rowData.estado === "VENCIDA" ? "danger" : "warning";
    return <Tag value={rowData.estado} severity={severity} />;
  };

  const fechaBodyTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleDateString("es-PE") : "-";
  };

  const montoBodyTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData[field] || 0);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.estado === "PENDIENTE" && (
          <Button
            icon="pi pi-dollar"
            rounded
            outlined
            severity="success"
            onClick={() => openPago(rowData)}
            tooltip="Registrar Pago"
            tooltipOptions={{ position: "top" }}
            disabled={readOnly}
          />
        )}
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="info"
          onClick={() => openEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          disabled={readOnly}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={readOnly}
        />
      </div>
    );
  };

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

        <DataTable
          value={cuotas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={["numeroCuota", "estado"]}
          emptyMessage="No se encontraron cuotas"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuotas"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        >
          <Column field="numeroCuota" header="N° Cuota" sortable style={{ minWidth: "8rem" }} />
          <Column
            field="fechaVencimiento"
            header="Fecha Vencimiento"
            body={(rowData) => fechaBodyTemplate(rowData, "fechaVencimiento")}
            sortable
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="saldoInicial"
            header="Saldo Inicial"
            body={(rowData) => montoBodyTemplate(rowData, "saldoInicial")}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="capital"
            header="Capital"
            body={(rowData) => montoBodyTemplate(rowData, "capital")}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="interes"
            header="Interés"
            body={(rowData) => montoBodyTemplate(rowData, "interes")}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="cuota"
            header="Cuota Total"
            body={(rowData) => montoBodyTemplate(rowData, "cuota")}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="saldoFinal"
            header="Saldo Final"
            body={(rowData) => montoBodyTemplate(rowData, "saldoFinal")}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: "10rem" }} />
          <Column
            field="fechaPago"
            header="Fecha Pago"
            body={(rowData) => fechaBodyTemplate(rowData, "fechaPago")}
            sortable
            style={{ minWidth: "12rem" }}
          />
          <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: "12rem" }} />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "80vw" }}
        header={isEdit ? "Editar Cuota" : "Nueva Cuota"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <CuotaPrestamoForm
          isEdit={isEdit}
          defaultValues={selectedCuota}
          prestamoBancarioId={prestamoBancarioId}
          onSubmit={handleSubmit}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={dialogPagoVisible}
        style={{ width: "40vw" }}
        header="Registrar Pago"
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <CuotaPrestamoForm
          isPago={true}
          defaultValues={selectedCuota}
          onSubmit={handlePago}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}