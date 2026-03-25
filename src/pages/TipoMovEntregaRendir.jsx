// src/pages/TipoMovEntregaRendir.jsx
// Pantalla CRUD profesional para TipoMovEntregaRendir. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";

import ReportFormatSelector from "../components/reports/ReportFormatSelector";
import TemporaryPDFViewer from "../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../components/reports/TemporaryExcelViewer";
import { generarTipoMovEntregaRendirPDF } from "../components/tipoMovEntregaRendir/reports/generarTipoMovEntregaRendirPDF";
import { generarTipoMovEntregaRendirExcel } from "../components/tipoMovEntregaRendir/reports/generarTipoMovEntregaRendirExcel";

import TipoMovEntregaRendirForm from "../components/tipoMovEntregaRendir/TipoMovEntregaRendirForm";
import {
  getAllTipoMovEntregaRendir,
  crearTipoMovEntregaRendir,
  actualizarTipoMovEntregaRendir,
  deleteTipoMovEntregaRendir,
} from "../api/tipoMovEntregaRendir";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { getAllCategoriaTipoMovEntregaRendir } from "../api/categoriaTipoMovEntregaRendir";

export default function TipoMovEntregaRendir() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [todosLosItems, setTodosLosItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [categorias, setCategorias] = useState([]);
  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [transferenciaFiltro, setTransferenciaFiltro] = useState("TODOS");
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    cargarItems();
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (todosLosItems.length > 0) {
      aplicarFiltros();
    }
  }, [categoriaFiltro, tipoFiltro, transferenciaFiltro]);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllTipoMovEntregaRendir();
      setTodosLosItems(data);
      aplicarFiltros(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista.",
      });
    }
    setLoading(false);
  };

  const cargarCategorias = async () => {
    try {
      const data = await getAllCategoriaTipoMovEntregaRendir();
      setCategorias(data);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  const aplicarFiltros = (itemsBase = todosLosItems) => {
    let itemsFiltrados = [...itemsBase];

    // Aplicar filtro por categoría
    if (categoriaFiltro) {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => Number(item.categoriaId) === Number(categoriaFiltro),
      );
    }

    // Aplicar filtro por tipo (Ingreso/Egreso)
    if (tipoFiltro === "INGRESO") {
      itemsFiltrados = itemsFiltrados.filter((item) => item.esIngreso === true);
    } else if (tipoFiltro === "EGRESO") {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => item.esIngreso === false,
      );
    }

    // Aplicar filtro por transferencia
    if (transferenciaFiltro === "SI") {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => item.esTransferencia === true,
      );
    } else if (transferenciaFiltro === "NO") {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => item.esTransferencia === false,
      );
    }

    setItems(itemsFiltrados);

    // Mostrar mensaje con cantidad de registros
    if (
      categoriaFiltro ||
      tipoFiltro !== "TODOS" ||
      transferenciaFiltro !== "TODOS"
    ) {
      toast.current.show({
        severity: "info",
        summary: "Filtros Aplicados",
        detail: `Se encontraron ${itemsFiltrados.length} registro(s)`,
        life: 2000,
      });
    }
  };

  const handleLimpiarFiltros = () => {
    setCategoriaFiltro(null);
    setTipoFiltro("TODOS");
    setTransferenciaFiltro("TODOS");
    toast.current.show({
      severity: "success",
      summary: "Filtros Limpiados",
      detail: `Mostrando todos los registros (${todosLosItems.length})`,
      life: 2000,
    });
  };

  const handleTipoFiltroClick = () => {
    if (tipoFiltro === "TODOS") {
      setTipoFiltro("INGRESO");
    } else if (tipoFiltro === "INGRESO") {
      setTipoFiltro("EGRESO");
    } else {
      setTipoFiltro("TODOS");
    }
  };

  const handleTransferenciaFiltroClick = () => {
    if (transferenciaFiltro === "TODOS") {
      setTransferenciaFiltro("SI");
    } else if (transferenciaFiltro === "SI") {
      setTransferenciaFiltro("NO");
    } else {
      setTransferenciaFiltro("TODOS");
    }
  };

  const handleGenerarReporte = () => {
    const data = {
      items: items,
      categorias: categorias,
      fechaGeneracion: new Date(),
      titulo: "Listado de Tipos de Movimiento Caja",
    };
    setReportData(data);
    setShowFormatSelector(true);
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
      await deleteTipoMovEntregaRendir(toDelete.id);
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
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarTipoMovEntregaRendir(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearTipoMovEntregaRendir(data);
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
        detail: "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    // Construir defaultValues con los valores de los filtros activos
    const defaultValues = {};

    // Si hay un tipo seleccionado (no TODOS), precargar esIngreso
    if (tipoFiltro !== "TODOS") {
      defaultValues.esIngreso = tipoFiltro === "INGRESO";
    }

    // Si hay una categoría seleccionada, precargarla
    if (categoriaFiltro) {
      defaultValues.categoriaId = categoriaFiltro;
    }

    setEditing(defaultValues);
    setShowDialog(true);
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

  const esIngresoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esIngreso ? "INGRESO" : "EGRESO"}
        severity={rowData.esIngreso ? "success" : "danger"}
        icon={rowData.esIngreso ? "pi pi-arrow-down" : "pi pi-arrow-up"}
      />
    );
  };

  const esTransferenciaBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esTransferencia ? "SÍ" : "NO"}
        severity={rowData.esTransferencia ? "info" : "secondary"}
        icon={rowData.esTransferencia ? "pi pi-arrows-h" : "pi pi-times"}
      />
    );
  };

  const activoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
        icon={rowData.activo ? "pi pi-check-circle" : "pi pi-times-circle"}
      />
    );
  };

  // Filtrar categorías dinámicamente según tipo seleccionado
  const getCategoriasDisponibles = () => {
    if (tipoFiltro === "TODOS") {
      return categorias;
    }
    // tipoFiltro puede ser "INGRESO" o "EGRESO"
    // categoria.tipo: false=INGRESO, true=EGRESO
    const tipoCategoria = tipoFiltro === "EGRESO";
    return categorias.filter((c) => c.tipo === tipoCategoria);
  };

  // Options para filtros
  const categoriasOptions = getCategoriasDisponibles()
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((c) => ({
      label: `${c.nombre} - ${c.tipo ? "EGRESO" : "INGRESO"}`,
      value: Number(c.id),
    }));

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
        rows={40}
        rowsPerPageOptions={[40, 80, 160, 500]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Tipos Movimiento"
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
              alignItems: "end",
              marginBottom: "1rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>Tipos de Movimiento Caja</h2>
              <span
                style={{
                  marginRight: "1rem",
                  fontSize: "small",
                  fontWeight: "bold",
                }}
              >
                <i className="pi pi-list" /> Registros mostrados {items.length}
              </span>
              {(categoriaFiltro ||
                tipoFiltro !== "TODOS" ||
                transferenciaFiltro !== "TODOS") && (
                <Tag
                  severity="info"
                  value={`Total sin filtros: ${todosLosItems.length}`}
                  icon="pi pi-filter"
                />
              )}
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                severity="success"
                onClick={handleAdd}
                disabled={loading}
                style={{ width: "100%", fontWeight: "bold" }}
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
                  marginTop: "1.8rem",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Filtrar por Tipo</label>
              <Button
                label={
                  tipoFiltro === "TODOS"
                    ? "TODOS"
                    : tipoFiltro === "INGRESO"
                      ? "INGRESO"
                      : "EGRESO"
                }
                icon={
                  tipoFiltro === "TODOS"
                    ? "pi pi-filter"
                    : tipoFiltro === "INGRESO"
                      ? "pi pi-arrow-down"
                      : "pi pi-arrow-up"
                }
                className={
                  tipoFiltro === "TODOS"
                    ? "p-button-secondary"
                    : tipoFiltro === "INGRESO"
                      ? "p-button-success"
                      : "p-button-danger"
                }
                onClick={handleTipoFiltroClick}
                style={{ width: "100%", fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="categoriaFiltro">Filtrar por Categoría</label>
              <Dropdown
                id="categoriaFiltro"
                value={categoriaFiltro}
                options={categoriasOptions}
                onChange={(e) => setCategoriaFiltro(e.value)}
                placeholder="Seleccionar categoría"
                style={{ width: "100%", fontWeight: "bold" }}
                filter
                showClear
              />
            </div>

            <div style={{ flex: 0.5 }}>
              <label>Filtrar por Transferencia</label>
              <Button
                label={
                  transferenciaFiltro === "TODOS"
                    ? "TODOS"
                    : transferenciaFiltro === "SI"
                      ? "SÍ"
                      : "NO"
                }
                icon={
                  transferenciaFiltro === "TODOS"
                    ? "pi pi-filter"
                    : transferenciaFiltro === "SI"
                      ? "pi pi-arrows-h"
                      : "pi pi-times"
                }
                className={
                  transferenciaFiltro === "TODOS"
                    ? "p-button-secondary"
                    : transferenciaFiltro === "SI"
                      ? "p-button-info"
                      : "p-button-secondary"
                }
                onClick={handleTransferenciaFiltroClick}
                style={{ width: "100%", fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 0.1 }}>
              <Button
                icon="pi pi-filter-slash"
                onClick={handleLimpiarFiltros}
                severity="secondary"
                tooltip="Limpiar todos los filtros"
                tooltipOptions={{ position: "top" }}
              />
            </div>
            <div style={{ flex: 0.1 }}>
              <Button
                icon="pi pi-refresh"
                onClick={cargarItems}
                severity="info"
                tooltip="Actualizar"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          field="esIngreso"
          header="Tipo"
          body={esIngresoBodyTemplate}
          style={{ width: 130, textAlign: "center" }}
          sortable
        />

        <Column
          field="categoria.nombre"
          header="Categoría"
          sortable
          body={(rowData) => rowData.categoria?.nombre || "-"}
        />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="esTransferencia"
          header="Transferencia"
          body={esTransferenciaBodyTemplate}
          style={{ width: 150, textAlign: "center" }}
          sortable
        />
        <Column
          field="activo"
          header="Estado"
          body={activoBodyTemplate}
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
        header={editing ? "Editar Tipo Movimiento" : "Nuevo Tipo Movimiento"}
        visible={showDialog}
        style={{ width: 800 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <TipoMovEntregaRendirForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          categorias={categorias}
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
        title="Listado de Tipos de Movimiento Caja"
      />

      <TemporaryPDFViewer
        visible={showPDFViewer}
        onHide={() => {
          setShowPDFViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generatePDF={generarTipoMovEntregaRendirPDF}
        fileName="tipos_movimiento_caja.pdf"
      />

      <TemporaryExcelViewer
        visible={showExcelViewer}
        onHide={() => {
          setShowExcelViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generateExcel={generarTipoMovEntregaRendirExcel}
        fileName="tipos_movimiento_caja.xlsx"
      />
    </div>
  );
}
