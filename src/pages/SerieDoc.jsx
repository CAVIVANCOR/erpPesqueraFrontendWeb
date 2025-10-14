import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import SerieDocForm from "../components/serieDoc/SerieDocForm";
import {
  getSeriesDoc,
  crearSerieDoc,
  actualizarSerieDoc,
  eliminarSerieDoc,
} from "../api/serieDoc";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getTiposAlmacen } from "../api/tipoAlmacen";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página CRUD para SerieDoc
 * Cumple la regla transversal ERP Megui.
 * Documentado en español.
 */
export default function SerieDoc() {
  const { user } = useAuthStore();
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposAlmacen, setTiposAlmacen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState(null);
  const [tipoAlmacenSeleccionado, setTipoAlmacenSeleccionado] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState("todos"); // 'todos', 'si', 'no'

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [seriesData, tiposDocData, tiposAlmData] = await Promise.all([
        getSeriesDoc(),
        getTiposDocumento(),
        getTiposAlmacen(),
      ]);
      setItems(seriesData);
      setTiposDocumento(tiposDocData);
      setTiposAlmacen(tiposAlmData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  // Filtrar series por todos los criterios
  const seriesFiltradas = React.useMemo(() => {
    let filtradas = items;

    // Filtrar por tipo documento
    if (tipoDocumentoSeleccionado) {
      filtradas = filtradas.filter((serie) => {
        return Number(serie.tipoDocumentoId) === Number(tipoDocumentoSeleccionado);
      });
    }

    // Filtrar por tipo almacén
    if (tipoAlmacenSeleccionado) {
      filtradas = filtradas.filter((serie) => {
        return Number(serie.tipoAlmacenId) === Number(tipoAlmacenSeleccionado);
      });
    }

    // Filtrar por activo
    if (filtroActivo === "si") {
      filtradas = filtradas.filter((serie) => serie.activo === true);
    } else if (filtroActivo === "no") {
      filtradas = filtradas.filter((serie) => serie.activo === false);
    }

    return filtradas;
  }, [items, tipoDocumentoSeleccionado, tipoAlmacenSeleccionado, filtroActivo]);

  const limpiarFiltros = () => {
    setTipoDocumentoSeleccionado(null);
    setTipoAlmacenSeleccionado(null);
    setFiltroActivo("todos");
  };

  const handleNew = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing) {
        await actualizarSerieDoc(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serie de Documento actualizada correctamente.",
        });
      } else {
        await crearSerieDoc(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serie de Documento creada correctamente.",
        });
      }
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "Error al guardar.",
      });
    }
    setLoading(false);
  };

  const handleDelete = (rowData) => {
    // Validar permisos
    const canDelete = user?.rol === "superusuario" || user?.rol === "admin";

    if (!canDelete) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail:
          "No tiene permisos para eliminar registros. Solo superusuarios y administradores pueden realizar esta acción.",
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar la serie "${rowData.serie}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        setLoading(true);
        try {
          await eliminarSerieDoc(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Serie de Documento eliminada correctamente.",
          });
          cargarDatos();
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              err.response?.data?.mensaje ||
              err.response?.data?.message ||
              "No se pudo eliminar.",
          });
        }
        setLoading(false);
      },
    });
  };

  const tipoDocumentoNombre = (rowData) => {
    const tipo = tiposDocumento.find(t => Number(t.id) === Number(rowData.tipoDocumentoId));
    return tipo ? tipo.nombre : '';
  };

  const tipoAlmacenNombre = (rowData) => {
    const tipo = tiposAlmacen.find(t => Number(t.id) === Number(rowData.tipoAlmacenId));
    return tipo ? tipo.nombre : '';
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-green-600" : "text-red-600"}>
      {rowData[field] ? "Sí" : "No"}
    </span>
  );

  const actionBody = (rowData) => {
    const canDelete = user?.rol === "superusuario" || user?.rol === "admin";
    return (
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(rowData);
          }}
        />
        {canDelete && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-text"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(rowData);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <DataTable
        value={seriesFiltradas}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h1>Series de Documento</h1>
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={handleNew}
                  style={{ marginTop: "1.8rem" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-outlined p-button-secondary"
                  onClick={limpiarFiltros}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoDocumentoFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo Documento:
                </label>
                <Dropdown
                  id="tipoDocumentoFilter"
                  value={tipoDocumentoSeleccionado}
                  options={tiposDocumento}
                  onChange={(e) => setTipoDocumentoSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoAlmacenFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo Almacén:
                </label>
                <Dropdown
                  id="tipoAlmacenFilter"
                  value={tipoAlmacenSeleccionado}
                  options={tiposAlmacen}
                  onChange={(e) => setTipoAlmacenSeleccionado(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Activo:
                </label>
                <Button
                  label={
                    filtroActivo === "todos"
                      ? "Todos"
                      : filtroActivo === "si"
                      ? "Activos"
                      : "Inactivos"
                  }
                  icon={
                    filtroActivo === "todos"
                      ? "pi pi-list"
                      : filtroActivo === "si"
                      ? "pi pi-check"
                      : "pi pi-times"
                  }
                  className={
                    filtroActivo === "todos"
                      ? "p-button-secondary"
                      : filtroActivo === "si"
                      ? "p-button-success"
                      : "p-button-danger"
                  }
                  onClick={() => {
                    if (filtroActivo === "todos") setFiltroActivo("si");
                    else if (filtroActivo === "si") setFiltroActivo("no");
                    else setFiltroActivo("todos");
                  }}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column
          field="tipoDocumentoId"
          header="Tipo Documento"
          body={tipoDocumentoNombre}
        />
        <Column
          field="tipoAlmacenId"
          header="Tipo Almacén"
          body={tipoAlmacenNombre}
        />
        <Column field="serie" header="Serie" />
        <Column field="correlativo" header="Correlativo" />
        <Column field="numCerosIzqCorre" header="Ceros Correlativo" />
        <Column field="numCerosIzqSerie" header="Ceros Serie" />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => booleanTemplate(rowData, "activo")}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing ? "Editar Serie de Documento" : "Nueva Serie de Documento"
        }
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <SerieDocForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          tiposDocumento={tiposDocumento}
          tiposAlmacen={tiposAlmacen}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
