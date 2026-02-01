// src/components/tesoreria/CuotaPrestamoList.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { getResponsiveFontSize } from "../../utils/utils";
import CronogramaImportTable from "./CronogramaImportTable";

export default function CuotaPrestamoList({
  prestamoBancarioId,
  readOnly = false,
}) {
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
  const [dialogImportVisible, setDialogImportVisible] = useState(false);

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

  // Calcular totales
  const totales = useMemo(() => {
    return {
      montoCapital: cuotas.reduce((sum, c) => sum + parseFloat(c.montoCapital || 0), 0),
      montoInteres: cuotas.reduce((sum, c) => sum + parseFloat(c.montoInteres || 0), 0),
      montoComision: cuotas.reduce((sum, c) => sum + parseFloat(c.montoComision || 0), 0),
      montoSeguro: cuotas.reduce((sum, c) => sum + parseFloat(c.montoSeguro || 0), 0),
      montoTotal: cuotas.reduce((sum, c) => sum + parseFloat(c.montoTotal || 0), 0),
    };
  }, [cuotas]);

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
        await createCuotaPrestamo({
          ...data,
          prestamoBancarioId: Number(prestamoBancarioId),
        });
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

  const handleImportarCuotas = async (cuotasImportadas) => {
    try {
      setLoading(true);

      let cuotasCreadas = 0;
      let errores = 0;

      for (const cuota of cuotasImportadas) {
        try {
          const cuotaData = {
            prestamoBancarioId: prestamoBancarioId,
            numeroCuota: cuota.numeroCuota,
            fechaVencimiento: cuota.fechaVencimiento,
            saldoCapitalAntes: cuota.saldoCapitalAntes,
            montoCapital: cuota.montoCapital,
            montoInteres: cuota.montoInteres,
            montoComision: cuota.montoComision || 0,
            montoSeguro: cuota.montoSeguro || 0,
            montoTotal: cuota.montoTotal,
            saldoCapitalDespues: cuota.saldoCapitalDespues,
            estadoPago: "PENDIENTE",
          };

          await createCuotaPrestamo(cuotaData);
          cuotasCreadas++;
        } catch (error) {
          console.error(`Error al crear cuota ${cuota.numeroCuota}:`, error);
          errores++;
        }
      }

      toast.current?.show({
        severity: errores === 0 ? "success" : "warn",
        summary: errores === 0 ? "Éxito" : "Importación Parcial",
        detail: `${cuotasCreadas} cuotas importadas correctamente${
          errores > 0 ? `, ${errores} con errores` : ""
        }`,
        life: 5000,
      });

      await cargarCuotas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al importar cuotas",
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

  const estadoBodyTemplate = (rowData) => {
    const severity =
      rowData.estadoPago === "PAGADA"
        ? "success"
        : rowData.estadoPago === "VENCIDA"
        ? "danger"
        : "warning";
    return <Tag value={rowData.estadoPago} severity={severity} />;
  };

  const fechaBodyTemplate = (rowData, field) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleDateString("es-PE")
      : "-";
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
        {rowData.estadoPago === "PENDIENTE" && (
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


  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />
          <div className="card">
        <DataTable
          value={cuotas}
          loading={loading}
          dataKey="id"
          showGridlines
          stripedRows
          size="small"
          paginator
          rows={20}
          rowsPerPageOptions={[20, 40, 80, 160]}
          filters={filters}
          globalFilterFields={["numeroCuota", "estadoPago"]}
          emptyMessage="No se encontraron cuotas"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuotas"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          style={{ fontSize: getResponsiveFontSize() }}
          selectionMode="single"
          onRowClick={(e) => !readOnly && openEdit(e.data)}
          rowClassName={() => !readOnly ? "cursor-pointer" : ""}
          header={
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Cuotas del Préstamo</h2>
              </div>
              <div style={{ flex: 1, display: "flex", gap: "10px" }}>
                <Button
                  label="Nueva Cuota"
                  icon="pi pi-plus"
                  severity="success"
                  onClick={openNew}
                  disabled={readOnly}
                />
                <Button
                  label="Importar desde PDF"
                  icon="pi pi-file-import"
                  severity="info"
                  onClick={() => setDialogImportVisible(true)}
                  disabled={readOnly}
                />
              </div>
            </div>
          }
        >
          <Column
            field="numeroCuota"
            header="N° Cuota"
            sortable
            style={{ minWidth: "8rem", textAlign:"center" }}
            footer="TOTALES:"
            footerStyle={{ textAlign: "right", fontWeight: "bold" }}
          />
          <Column
            field="fechaVencimiento"
            header="Vencimiento"
            body={(rowData) => fechaBodyTemplate(rowData, "fechaVencimiento")}
            sortable
            style={{ minWidth: "6rem", textAlign:"center" }}
          />
          <Column
            field="saldoCapitalAntes"
            header="Saldo Capital Antes"
            body={(rowData) => montoBodyTemplate(rowData, "saldoCapitalAntes")}
            sortable
            style={{ minWidth: "8rem", textAlign:"right" }}
          />
          <Column
            field="montoCapital"
            header="Monto Capital"
            body={(rowData) => montoBodyTemplate(rowData, "montoCapital")}
            sortable
            style={{ minWidth: "8rem", textAlign:"right" }}
            footer={formatCurrency(totales.montoCapital)}
            footerStyle={{ textAlign: "right", fontWeight: "bold", backgroundColor: "#f0f0f0" }}
          />
          <Column
            field="montoInteres"
            header="Monto Interés"
            body={(rowData) => montoBodyTemplate(rowData, "montoInteres")}
            sortable
            style={{ minWidth: "6rem", textAlign:"right" }}
            footer={formatCurrency(totales.montoInteres)}
            footerStyle={{ textAlign: "right", fontWeight: "bold", backgroundColor: "#f0f0f0" }}
          />
          <Column
            field="montoComision"
            header="Monto Comisión"
            body={(rowData) => montoBodyTemplate(rowData, "montoComision")}
            sortable
            style={{ minWidth: "6rem", textAlign:"right" }}
            footer={formatCurrency(totales.montoComision)}
            footerStyle={{ textAlign: "right", fontWeight: "bold", backgroundColor: "#f0f0f0" }}
          />
          <Column
            field="montoSeguro"
            header="Monto Seguro"
            body={(rowData) => montoBodyTemplate(rowData, "montoSeguro")}
            sortable
            style={{ minWidth: "6rem", textAlign:"right" }}
            footer={formatCurrency(totales.montoSeguro)}
            footerStyle={{ textAlign: "right", fontWeight: "bold", backgroundColor: "#f0f0f0" }}
          />
          <Column
            field="montoTotal"
            header="Monto Total"
            body={(rowData) => montoBodyTemplate(rowData, "montoTotal")}
            sortable
            style={{ minWidth: "8rem", textAlign:"right" }}
            footer={formatCurrency(totales.montoTotal)}
            footerStyle={{ textAlign: "right", fontWeight: "bold", backgroundColor: "#f0f0f0" }}
          />
          <Column
            field="saldoCapitalDespues"
            header="Saldo Capital Después"
            body={(rowData) =>
              montoBodyTemplate(rowData, "saldoCapitalDespues")
            }
            sortable
            style={{ minWidth: "8rem", textAlign:"right" }}
          />
          <Column
            field="estadoPago"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="fechaPago"
            header="Fecha Pago"
            body={(rowData) => fechaBodyTemplate(rowData, "fechaPago")}
            sortable
            style={{ minWidth: "12rem" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "12rem" }}
          />
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
      <CronogramaImportTable
        visible={dialogImportVisible}
        onHide={() => setDialogImportVisible(false)}
        onImport={handleImportarCuotas}
        prestamoBancarioId={prestamoBancarioId}
      />
    </div>
  );
}