// src/pages/CategoriaTipoMovEntregaRendir.jsx
// Pantalla CRUD profesional para CategoriaTipoMovEntregaRendir. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import CategoriaTipoMovEntregaRendirForm from "../components/categoriaTipoMovEntregaRendir/CategoriaTipoMovEntregaRendirForm";
import {
  getAllCategoriaTipoMovEntregaRendir,
  crearCategoriaTipoMovEntregaRendir,
  actualizarCategoriaTipoMovEntregaRendir,
  deleteCategoriaTipoMovEntregaRendir,
} from "../api/categoriaTipoMovEntregaRendir";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import ReportFormatSelector from "../components/reports/ReportFormatSelector";
import TemporaryPDFViewer from "../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../components/reports/TemporaryExcelViewer";
import { generarCategoriaTipoMovPDF } from "../components/categoriaTipoMovEntregaRendir/reports/generarCategoriaTipoMovPDF";
import { generarCategoriaTipoMovExcel } from "../components/categoriaTipoMovEntregaRendir/reports/generarCategoriaTipoMovExcel";

export default function CategoriaTipoMovEntregaRendir() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);

  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllCategoriaTipoMovEntregaRendir();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista.",
      });
    }
    setLoading(false);
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await deleteCategoriaTipoMovEntregaRendir(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.mensaje || "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarCategoriaTipoMovEntregaRendir(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearCategoriaTipoMovEntregaRendir(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.mensaje || "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const handleGenerarReporte = () => {
    const data = {
      items: items,
      fechaGeneracion: new Date(),
      titulo: "Listado de Categorías Tipos de Movimiento Caja",
    };
    setReportData(data);
    setShowFormatSelector(true);
  };

  const actionBody = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        aria-label="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          aria-label="Eliminar"
        />
      )}
    </>
  );

  const cesadoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "INACTIVO" : "ACTIVO"}
        severity={rowData.cesado ? "danger" : "success"}
        icon={rowData.cesado ? "pi pi-times-circle" : "pi pi-check-circle"}
      />
    );
  };

  const tipoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.tipo ? "EGRESO" : "INGRESO"}
        severity={rowData.tipo ? "danger" : "info"}
        icon={rowData.tipo ? "pi pi-arrow-up" : "pi pi-arrow-down"}
      />
    );
  };
  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar este registro?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={items}
        loading={loading}
        showGridlines
        stripedRows
        dataKey="id"
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Categorías"
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        size="small"
        sortField="id"
        sortOrder={1}
        header={
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>Categorías Tipos Movimiento Caja</h2>
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                severity="success"
                onClick={handleAdd}
                disabled={loading}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Reporte"
                icon="pi pi-file-pdf"
                severity="info"
                onClick={handleGenerarReporte}
                disabled={items.length === 0}
                style={{
                  width: "100%",
                  fontWeight: "bold",
                }}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          field="tipo"
          header="Tipo"
          body={tipoBodyTemplate}
          style={{ width: 120, textAlign: "center" }}
          sortable
        />
        <Column field="nombre" header="Nombre" sortable />
        <Column
          field="cesado"
          header="Estado"
          body={cesadoBodyTemplate}
          style={{ width: 120, textAlign: "center" }}
          sortable
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Categoría" : "Nueva Categoría"}
        visible={showDialog}
        style={{ width: 600 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <CategoriaTipoMovEntregaRendirForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
      <ReportFormatSelector
        visible={showFormatSelector}
        onHide={() => setShowFormatSelector(false)}
        onSelectPDF={() => {
          setShowFormatSelector(false);
          setShowPDFViewer(true);
        }}
        onSelectExcel={() => {
          setShowFormatSelector(false);
          setShowExcelViewer(true);
        }}
        title="Listado de Categorías Tipos de Movimiento Caja"
      />

      <TemporaryPDFViewer
        visible={showPDFViewer}
        onHide={() => {
          setShowPDFViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generatePDF={generarCategoriaTipoMovPDF}
        fileName="categorias_tipos_movimiento_caja.pdf"
      />

      <TemporaryExcelViewer
        visible={showExcelViewer}
        onHide={() => {
          setShowExcelViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generateExcel={generarCategoriaTipoMovExcel}
        fileName="categorias_tipos_movimiento_caja.xlsx"
      />
    </div>
  );
}
