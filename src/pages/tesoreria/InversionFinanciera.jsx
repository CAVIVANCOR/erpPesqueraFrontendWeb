// src/pages/tesoreria/InversionFinanciera.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import {
  getInversionFinanciera,
  deleteInversionFinanciera,
  getInversionFinancieraById,
} from "../../api/tesoreria/inversionFinanciera";
import InversionFinancieraForm from "../../components/tesoreria/InversionFinancieraForm";
import { usePermissions } from "../../hooks/usePermissions";

export default function InversionFinanciera() {
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedInversion, setSelectedInversion] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const toast = useRef(null);

  const { canCreate, canEdit, canDelete } = usePermissions("INVERSION_FINANCIERA");

  useEffect(() => {
    cargarInversiones();
  }, []);

  const cargarInversiones = async () => {
    setLoading(true);
    try {
      const data = await getInversionFinanciera();
      setInversiones(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar inversiones financieras",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setSelectedInversion(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (inversion) => {
    setSelectedInversion(inversion);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedInversion(null);
    setIsEdit(false);
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    try {
      await cargarInversiones();
      hideDialog();
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: isEdit
          ? "Inversión financiera actualizada correctamente"
          : "Inversión financiera creada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: isEdit
          ? "Error al actualizar inversión financiera"
          : "Error al crear inversión financiera",
        life: 3000,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (inversion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la inversión ${inversion.numeroInversion}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => handleDelete(inversion.id),
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteInversionFinanciera(id);
      await cargarInversiones();
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Inversión financiera eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar inversión financiera",
        life: 3000,
      });
    }
  };

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <h2 style={{ margin: 0 }}>Inversiones Financieras</h2>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            style={{ width: "300px" }}
          />
        </span>
        {canCreate && (
          <Button
            label="Nueva Inversión"
            icon="pi pi-plus"
            onClick={openNew}
            severity="success"
            raised
          />
        )}
      </div>
    </div>
  );

  const empresaBodyTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "N/A";
  };

  const bancoBodyTemplate = (rowData) => {
    return rowData.banco?.nombreBanco || "N/A";
  };

  const tipoInversionBodyTemplate = (rowData) => {
    const tipos = {
      DEPOSITO_PLAZO_FIJO: "DEPÓSITO A PLAZO FIJO",
      CUENTA_AHORROS: "CUENTA DE AHORROS",
      FONDO_MUTUO: "FONDO MUTUO",
      BONOS: "BONOS",
      ACCIONES: "ACCIONES",
      CERTIFICADO_DEPOSITO: "CERTIFICADO DE DEPÓSITO",
    };
    return tipos[rowData.tipoInversion] || rowData.tipoInversion;
  };

  const fechaBodyTemplate = (rowData, field) => {
    const fecha = rowData[field];
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    const monto = rowData[field];
    if (!monto && monto !== 0) return "N/A";
    const moneda = rowData.moneda?.codigoSunat || "PEN";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const tasaBodyTemplate = (rowData) => {
    return `${rowData.tasaRendimiento?.toFixed(2) || 0}%`;
  };

  const periodicidadBodyTemplate = (rowData) => {
    const periodicidades = {
      VENCIMIENTO: "AL VENCIMIENTO",
      MENSUAL: "MENSUAL",
      TRIMESTRAL: "TRIMESTRAL",
      SEMESTRAL: "SEMESTRAL",
      ANUAL: "ANUAL",
    };
    return periodicidades[rowData.periodicidadPago] || rowData.periodicidadPago;
  };

  const renovacionBodyTemplate = (rowData) => {
    return rowData.renovacionAutomatica ? (
      <Tag value="SÍ" severity="success" />
    ) : (
      <Tag value="NO" severity="danger" />
    );
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = rowData.estado;
    if (!estado) return "N/A";

    const severityMap = {
      SUCCESS: "success",
      DANGER: "danger",
      WARNING: "warning",
      INFO: "info",
      SECONDARY: "secondary",
      CONTRAST: "contrast",
    };

    return (
      <Tag
        value={estado.estado}
        severity={severityMap[estado.color] || "info"}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "5px" }}>
        {canEdit && (
          <Button
            icon="pi pi-pencil"
            rounded
            outlined
            severity="info"
            onClick={() => openEdit(rowData)}
            tooltip="Editar"
            tooltipOptions={{ position: "top" }}
          />
        )}
        {canDelete && (
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            onClick={() => confirmDelete(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={inversiones}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron inversiones financieras"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        tableStyle={{ minWidth: "60rem" }}
        sortMode="multiple"
        removableSort
        stripedRows
        showGridlines
      >
        <Column
          field="numeroInversion"
          header="Número Inversión"
          sortable
          filter
          filterPlaceholder="Buscar por número"
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Empresa"
          body={empresaBodyTemplate}
          sortable
          sortField="empresa.razonSocial"
          filter
          filterField="empresa.razonSocial"
          filterPlaceholder="Buscar por empresa"
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Banco"
          body={bancoBodyTemplate}
          sortable
          sortField="banco.nombreBanco"
          filter
          filterField="banco.nombreBanco"
          filterPlaceholder="Buscar por banco"
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Tipo Inversión"
          body={tipoInversionBodyTemplate}
          sortable
          sortField="tipoInversion"
          filter
          filterField="tipoInversion"
          filterPlaceholder="Buscar por tipo"
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Fecha Inicio"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaInicio")}
          sortable
          sortField="fechaInicio"
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Fecha Vencimiento"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaVencimiento")}
          sortable
          sortField="fechaVencimiento"
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Monto Inicial"
          body={(rowData) => montoBodyTemplate(rowData, "montoInicial")}
          sortable
          sortField="montoInicial"
          style={{ minWidth: "140px", textAlign: "right" }}
        />
        <Column
          header="Monto Actual"
          body={(rowData) => montoBodyTemplate(rowData, "montoActual")}
          sortable
          sortField="montoActual"
          style={{ minWidth: "140px", textAlign: "right" }}
        />
        <Column
          header="Tasa %"
          body={tasaBodyTemplate}
          sortable
          sortField="tasaRendimiento"
          style={{ minWidth: "100px", textAlign: "right" }}
        />
        <Column
          header="Periodicidad"
          body={periodicidadBodyTemplate}
          sortable
          sortField="periodicidadPago"
          style={{ minWidth: "140px" }}
        />
        <Column
          header="Renovación Auto"
          body={renovacionBodyTemplate}
          sortable
          sortField="renovacionAutomatica"
          style={{ minWidth: "140px", textAlign: "center" }}
        />
        <Column
          header="Estado"
          body={estadoBodyTemplate}
          sortable
          sortField="estado.estado"
          filter
          filterField="estado.estado"
          filterPlaceholder="Buscar por estado"
          style={{ minWidth: "140px" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "120px", textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "1200px" }}
        header={isEdit ? "Editar Inversión Financiera" : "Nueva Inversión Financiera"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <InversionFinancieraForm
          isEdit={isEdit}
          defaultValues={selectedInversion}
          onSubmit={handleSubmit}
          onCancel={hideDialog}
          loading={formLoading}
        />
      </Dialog>
    </div>
  );
}