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
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import {
  getMovimientosPorInversion,
  createMovimientoInversion,
  updateMovimientoInversion,
  deleteMovimientoInversion,
  getResumenMovimientos,
} from "../../api/tesoreria/movimientoInversion";
import { getResponsiveFontSize } from "../../utils/utils";

export default function MovimientoInversionCard({
  inversionFinancieraId,
  readOnly = false,
}) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [resumen, setResumen] = useState(null);
  const toast = useRef(null);

  const tiposMovimiento = [
    { label: "Inversión", value: "INVERSION" },
    { label: "Rendimiento", value: "RENDIMIENTO" },
    { label: "Retiro", value: "RETIRO" },
    { label: "Ajuste", value: "AJUSTE" },
    { label: "Liquidación", value: "LIQUIDACION" },
  ];

  const [formData, setFormData] = useState({
    tipoMovimiento: "INVERSION",
    fechaMovimiento: new Date(),
    monto: 0,
    descripcion: "",
    movimientoCajaId: null,
    asientoContableId: null,
  });

  useEffect(() => {
    if (inversionFinancieraId) {
      cargarMovimientos();
      cargarResumen();
    }
  }, [inversionFinancieraId]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const data = await getMovimientosPorInversion(inversionFinancieraId);
      setMovimientos(data);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar movimientos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarResumen = async () => {
    try {
      const data = await getResumenMovimientos(inversionFinancieraId);
      setResumen(data);
    } catch (error) {
      console.error("Error al cargar resumen:", error);
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
    setFormData({
      tipoMovimiento: "INVERSION",
      fechaMovimiento: new Date(),
      monto: 0,
      descripcion: "",
      movimientoCajaId: null,
      asientoContableId: null,
    });
    setSelectedMovimiento(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (movimiento) => {
    setFormData({
      tipoMovimiento: movimiento.tipoMovimiento,
      fechaMovimiento: new Date(movimiento.fechaMovimiento),
      monto: Number(movimiento.monto),
      descripcion: movimiento.descripcion,
      movimientoCajaId: movimiento.movimientoCajaId,
      asientoContableId: movimiento.asientoContableId,
    });
    setSelectedMovimiento(movimiento);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedMovimiento(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.descripcion || !formData.monto || formData.monto <= 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Complete los campos obligatorios",
          life: 3000,
        });
        return;
      }

      setLoading(true);

      const dataToSend = {
        inversionFinancieraId: BigInt(inversionFinancieraId),
        tipoMovimiento: formData.tipoMovimiento,
        fechaMovimiento: formData.fechaMovimiento,
        monto: Number(formData.monto),
        descripcion: formData.descripcion,
        movimientoCajaId: formData.movimientoCajaId ? BigInt(formData.movimientoCajaId) : null,
        asientoContableId: formData.asientoContableId ? BigInt(formData.asientoContableId) : null,
      };

      if (isEdit && selectedMovimiento) {
        await updateMovimientoInversion(selectedMovimiento.id, dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
          life: 3000,
        });
      } else {
        await createMovimientoInversion(dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      cargarMovimientos();
      cargarResumen();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar movimiento",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (movimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar este movimiento?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleDelete(movimiento.id),
      acceptLabel: "Sí",
      rejectLabel: "No",
      acceptClassName: "p-button-danger",
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteMovimientoInversion(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento eliminado correctamente",
        life: 3000,
      });
      cargarMovimientos();
      cargarResumen();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar movimiento",
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
            label="Nuevo Movimiento"
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
      <div className="flex align-items-center gap-3">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </span>
        {resumen && (
          <div className="flex flex-column gap-1" style={{ fontSize: getResponsiveFontSize() }}>
            <div className="font-bold">Total Inversiones: S/ {resumen.totalInversiones?.toFixed(2) || '0.00'}</div>
            <div className="font-bold text-green-600">Total Rendimientos: S/ {resumen.totalRendimientos?.toFixed(2) || '0.00'}</div>
          </div>
        )}
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

  const tipoBodyTemplate = (rowData) => {
    const tipoMap = {
      INVERSION: { label: "Inversión", severity: "info" },
      RENDIMIENTO: { label: "Rendimiento", severity: "success" },
      RETIRO: { label: "Retiro", severity: "warning" },
      AJUSTE: { label: "Ajuste", severity: "secondary" },
      LIQUIDACION: { label: "Liquidación", severity: "danger" },
    };
    const tipo = tipoMap[rowData.tipoMovimiento] || { label: rowData.tipoMovimiento, severity: "secondary" };
    return <Tag value={tipo.label} severity={tipo.severity} />;
  };

  const montoBodyTemplate = (rowData) => {
    const monto = Number(rowData.monto);
    const color = ['INVERSION', 'RENDIMIENTO'].includes(rowData.tipoMovimiento) 
      ? 'text-green-600' 
      : 'text-red-600';
    return <span className={color}>S/ {monto.toFixed(2)}</span>;
  };

  const fechaBodyTemplate = (rowData) => {
    return new Date(rowData.fechaMovimiento).toLocaleDateString("es-PE");
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

      <h3 style={{ fontSize: getResponsiveFontSize() }}>Movimientos de la Inversión</h3>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={movimientos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        dataKey="id"
        filters={filters}
        globalFilterFields={["descripcion", "tipoMovimiento"]}
        emptyMessage="No se encontraron movimientos"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="fechaMovimiento"
          header="Fecha"
          body={fechaBodyTemplate}
          sortable
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="tipoMovimiento"
          header="Tipo"
          body={tipoBodyTemplate}
          sortable
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ minWidth: "15rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="monto"
          header="Monto"
          body={montoBodyTemplate}
          sortable
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "8rem", fontSize: getResponsiveFontSize() }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "500px" }}
        header={isEdit ? "Editar Movimiento" : "Nuevo Movimiento"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="tipoMovimiento" style={{ fontSize: getResponsiveFontSize() }}>
            Tipo de Movimiento *
          </label>
          <Dropdown
            id="tipoMovimiento"
            value={formData.tipoMovimiento}
            options={tiposMovimiento}
            onChange={(e) => setFormData({ ...formData, tipoMovimiento: e.value })}
            placeholder="Seleccione tipo"
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>

        <div className="field">
          <label htmlFor="fechaMovimiento" style={{ fontSize: getResponsiveFontSize() }}>
            Fecha de Movimiento *
          </label>
          <Calendar
            id="fechaMovimiento"
            value={formData.fechaMovimiento}
            onChange={(e) =>
              setFormData({ ...formData, fechaMovimiento: e.value })
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
          <label htmlFor="descripcion" style={{ fontSize: getResponsiveFontSize() }}>
            Descripción *
          </label>
          <InputTextarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            rows={3}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>
      </Dialog>
    </div>
  );
}