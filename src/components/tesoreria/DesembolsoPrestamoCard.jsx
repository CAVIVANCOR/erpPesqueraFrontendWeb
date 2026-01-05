import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { FilterMatchMode } from "primereact/api";
import {
  getDesembolsosPorPrestamo,
  createDesembolsoPrestamo,
  updateDesembolsoPrestamo,
  deleteDesembolsoPrestamo,
  getTotalDesembolsado,
} from "../../api/tesoreria/desembolsoPrestamo";
import { getResponsiveFontSize } from "../../utils/utils";

export default function DesembolsoPrestamoCard({
  prestamoBancarioId,
  readOnly = false,
}) {
  const [desembolsos, setDesembolsos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDesembolso, setSelectedDesembolso] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [totalDesembolsado, setTotalDesembolsado] = useState(0);
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    numeroDesembolso: 1,
    fechaDesembolso: new Date(),
    monto: 0,
    movimientoCajaId: null,
    asientoContableId: null,
    observaciones: "",
  });

  useEffect(() => {
    if (prestamoBancarioId) {
      cargarDesembolsos();
      cargarTotalDesembolsado();
    }
  }, [prestamoBancarioId]);

  const cargarDesembolsos = async () => {
    try {
      setLoading(true);
      const data = await getDesembolsosPorPrestamo(prestamoBancarioId);
      setDesembolsos(data);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar desembolsos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarTotalDesembolsado = async () => {
    try {
      const data = await getTotalDesembolsado(prestamoBancarioId);
      setTotalDesembolsado(data.total);
    } catch (error) {
      console.error("Error al cargar total desembolsado:", error);
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
    const nuevoNumero = desembolsos.length > 0 
      ? Math.max(...desembolsos.map(d => d.numeroDesembolso)) + 1 
      : 1;
    
    setFormData({
      numeroDesembolso: nuevoNumero,
      fechaDesembolso: new Date(),
      monto: 0,
      movimientoCajaId: null,
      asientoContableId: null,
      observaciones: "",
    });
    setSelectedDesembolso(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (desembolso) => {
    setFormData({
      numeroDesembolso: desembolso.numeroDesembolso,
      fechaDesembolso: new Date(desembolso.fechaDesembolso),
      monto: Number(desembolso.monto),
      movimientoCajaId: desembolso.movimientoCajaId,
      asientoContableId: desembolso.asientoContableId,
      observaciones: desembolso.observaciones || "",
    });
    setSelectedDesembolso(desembolso);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedDesembolso(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.monto || formData.monto <= 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "El monto debe ser mayor a cero",
          life: 3000,
        });
        return;
      }

      setLoading(true);
      
      const dataToSend = {
        prestamoBancarioId: BigInt(prestamoBancarioId),
        numeroDesembolso: Number(formData.numeroDesembolso),
        fechaDesembolso: formData.fechaDesembolso,
        monto: Number(formData.monto),
        movimientoCajaId: formData.movimientoCajaId ? BigInt(formData.movimientoCajaId) : null,
        asientoContableId: formData.asientoContableId ? BigInt(formData.asientoContableId) : null,
        observaciones: formData.observaciones || null,
      };

      if (isEdit && selectedDesembolso) {
        await updateDesembolsoPrestamo(selectedDesembolso.id, dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Desembolso actualizado correctamente",
          life: 3000,
        });
      } else {
        await createDesembolsoPrestamo(dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Desembolso creado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      cargarDesembolsos();
      cargarTotalDesembolsado();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar desembolso",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (desembolso) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el desembolso #${desembolso.numeroDesembolso}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleDelete(desembolso.id),
      acceptLabel: "Sí",
      rejectLabel: "No",
      acceptClassName: "p-button-danger",
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteDesembolsoPrestamo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Desembolso eliminado correctamente",
        life: 3000,
      });
      cargarDesembolsos();
      cargarTotalDesembolsado();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar desembolso",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {!readOnly && (
          <Button
            label="Nuevo Desembolso"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={openNew}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        )}
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </span>
        <div className="font-bold" style={{ fontSize: getResponsiveFontSize() }}>
          Total Desembolsado: S/ {totalDesembolsado.toFixed(2)}
        </div>
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {!readOnly && (
          <>
            <Button
              icon="pi pi-pencil"
              className="p-button-rounded p-button-warning"
              onClick={() => openEdit(rowData)}
              tooltip="Editar"
              tooltipOptions={{ position: "top" }}
              style={{ fontSize: getResponsiveFontSize() }}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-rounded p-button-danger"
              onClick={() => confirmDelete(rowData)}
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
              style={{ fontSize: getResponsiveFontSize() }}
            />
          </>
        )}
      </div>
    );
  };

  const montoBodyTemplate = (rowData) => {
    return `S/ ${Number(rowData.monto).toFixed(2)}`;
  };

  const fechaBodyTemplate = (rowData) => {
    return new Date(rowData.fechaDesembolso).toLocaleDateString("es-PE");
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDialog}
        style={{ fontSize: getResponsiveFontSize() }}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
        style={{ fontSize: getResponsiveFontSize() }}
      />
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h3 style={{ fontSize: getResponsiveFontSize() }}>Desembolsos del Préstamo</h3>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={desembolsos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        dataKey="id"
        filters={filters}
        globalFilterFields={["numeroDesembolso", "observaciones"]}
        emptyMessage="No se encontraron desembolsos"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="numeroDesembolso"
          header="N°"
          sortable
          style={{ minWidth: "8rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="fechaDesembolso"
          header="Fecha"
          body={fechaBodyTemplate}
          sortable
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="monto"
          header="Monto"
          body={montoBodyTemplate}
          sortable
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="observaciones"
          header="Observaciones"
          style={{ minWidth: "15rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "8rem", fontSize: getResponsiveFontSize() }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "450px" }}
        header={isEdit ? "Editar Desembolso" : "Nuevo Desembolso"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="numeroDesembolso" style={{ fontSize: getResponsiveFontSize() }}>
            Número de Desembolso *
          </label>
          <InputNumber
            id="numeroDesembolso"
            value={formData.numeroDesembolso}
            onValueChange={(e) =>
              setFormData({ ...formData, numeroDesembolso: e.value })
            }
            disabled={isEdit}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>

        <div className="field">
          <label htmlFor="fechaDesembolso" style={{ fontSize: getResponsiveFontSize() }}>
            Fecha de Desembolso *
          </label>
          <Calendar
            id="fechaDesembolso"
            value={formData.fechaDesembolso}
            onChange={(e) =>
              setFormData({ ...formData, fechaDesembolso: e.value })
            }
            dateFormat="dd/mm/yy"
            showIcon
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>

        <div className="field">
          <label htmlFor="monto" style={{ fontSize: getResponsiveFontSize() }}>
            Monto *
          </label>
          <InputNumber
            id="monto"
            value={formData.monto}
            onValueChange={(e) => setFormData({ ...formData, monto: e.value })}
            mode="currency"
            currency="PEN"
            locale="es-PE"
            minFractionDigits={2}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>

        <div className="field">
          <label htmlFor="observaciones" style={{ fontSize: getResponsiveFontSize() }}>
            Observaciones
          </label>
          <InputText
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) =>
              setFormData({ ...formData, observaciones: e.target.value })
            }
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>
      </Dialog>
    </div>
  );
}
