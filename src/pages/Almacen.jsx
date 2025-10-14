import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import AlmacenForm from "../components/almacen/AlmacenForm";
import {
  getAlmacenes,
  crearAlmacen,
  actualizarAlmacen,
  eliminarAlmacen,
} from "../api/almacen";
import { getCentrosAlmacen } from "../api/centrosAlmacen";
import { getTiposAlmacenamiento } from "../api/tipoAlmacenamiento";
import { getTiposAlmacen } from "../api/tipoAlmacen";
import { getEmpresas } from "../api/empresa";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página CRUD para Almacen
 * Cumple la regla transversal ERP Megui.
 * Documentado en español.
 */
export default function Almacen() {
  const { user } = useAuthStore();
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [centrosAlmacen, setCentrosAlmacen] = useState([]);
  const [tiposAlmacenamiento, setTiposAlmacenamiento] = useState([]);
  const [tiposAlmacen, setTiposAlmacen] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [centroAlmacenSeleccionado, setCentroAlmacenSeleccionado] =
    useState(null);
  const [tipoAlmacenamientoSeleccionado, setTipoAlmacenamientoSeleccionado] =
    useState(null);
  const [tipoAlmacenSeleccionado, setTipoAlmacenSeleccionado] = useState(null);
  const [filtroKardex, setFiltroKardex] = useState("todos"); // 'todos', 'si', 'no'
  const [filtroActivo, setFiltroActivo] = useState("todos"); // 'todos', 'si', 'no'

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        almacenesData,
        centrosData,
        tiposAlmacenamientoData,
        tiposAlmacenData,
        empresasData,
      ] = await Promise.all([
        getAlmacenes(),
        getCentrosAlmacen(),
        getTiposAlmacenamiento(),
        getTiposAlmacen(),
        getEmpresas(),
      ]);
      setItems(almacenesData);
      setCentrosAlmacen(centrosData);
      setTiposAlmacenamiento(tiposAlmacenamientoData);
      setTiposAlmacen(tiposAlmacenData);
      setEmpresas(empresasData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleNew = () => {
    if (!empresaSeleccionada) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero.",
      });
      return;
    }
    setEditing(null);
    setShowDialog(true);
  };

  // Filtrar centros de almacén por empresa seleccionada
  const centrosFiltrados = React.useMemo(() => {
    if (!empresaSeleccionada) return centrosAlmacen;
    return centrosAlmacen.filter(
      (centro) => Number(centro.empresaId) === Number(empresaSeleccionada)
    );
  }, [centrosAlmacen, empresaSeleccionada]);

  // Filtrar almacenes por todos los criterios
  const almacenesFiltrados = React.useMemo(() => {
    let filtrados = items;

    // Filtrar por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter((almacen) => {
        return (
          almacen.centroAlmacen &&
          Number(almacen.centroAlmacen.empresaId) ===
            Number(empresaSeleccionada)
        );
      });
    }

    // Filtrar por centro de almacén
    if (centroAlmacenSeleccionado) {
      filtrados = filtrados.filter((almacen) => {
        return (
          Number(almacen.centroAlmacenId) === Number(centroAlmacenSeleccionado)
        );
      });
    }

    // Filtrar por tipo de almacenamiento
    if (tipoAlmacenamientoSeleccionado) {
      filtrados = filtrados.filter((almacen) => {
        return (
          Number(almacen.tipoAlmacenamientoId) ===
          Number(tipoAlmacenamientoSeleccionado)
        );
      });
    }

    // Filtrar por tipo de almacén
    if (tipoAlmacenSeleccionado) {
      filtrados = filtrados.filter((almacen) => {
        return (
          Number(almacen.tipoAlmacenId) === Number(tipoAlmacenSeleccionado)
        );
      });
    }

    // Filtrar por kardex
    if (filtroKardex === "si") {
      filtrados = filtrados.filter((almacen) => almacen.seLlevaKardex === true);
    } else if (filtroKardex === "no") {
      filtrados = filtrados.filter(
        (almacen) => almacen.seLlevaKardex === false
      );
    }

    // Filtrar por activo
    if (filtroActivo === "si") {
      filtrados = filtrados.filter((almacen) => almacen.activo === true);
    } else if (filtroActivo === "no") {
      filtrados = filtrados.filter((almacen) => almacen.activo === false);
    }

    return filtrados;
  }, [
    items,
    empresaSeleccionada,
    centroAlmacenSeleccionado,
    tipoAlmacenamientoSeleccionado,
    tipoAlmacenSeleccionado,
    filtroKardex,
    filtroActivo,
  ]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setCentroAlmacenSeleccionado(null);
    setTipoAlmacenamientoSeleccionado(null);
    setTipoAlmacenSeleccionado(null);
    setFiltroKardex("todos");
    setFiltroActivo("todos");
  };

  const handleEdit = (rowData) => {
    // Establecer automáticamente la empresa del centro de almacén
    if (rowData.centroAlmacen && rowData.centroAlmacen.empresaId) {
      setEmpresaSeleccionada(rowData.centroAlmacen.empresaId);
    }
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing) {
        await actualizarAlmacen(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Almacén actualizado correctamente.",
        });
      } else {
        await crearAlmacen(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Almacén creado correctamente.",
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
      message: `¿Está seguro de eliminar el almacén "${rowData.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        try {
          await eliminarAlmacen(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Almacén eliminado correctamente.",
          });
          cargarDatos();
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              err.response?.data?.mensaje ||
              err.response?.data?.message ||
              "Error al eliminar.",
          });
        }
      },
    });
  };

  const booleanTemplate = (rowData, field) => {
    return rowData[field] ? (
      <i className="pi pi-check" style={{ color: "green" }} />
    ) : (
      <i className="pi pi-times" style={{ color: "red" }} />
    );
  };

  const centroNombre = (rowData) => rowData.centroAlmacen?.nombre || "-";
  const tipoAlmacenamientoNombre = (rowData) =>
    rowData.tipoAlmacenamiento?.nombre || "-";
  const tipoAlmacenNombre = (rowData) => rowData.tipoAlmacen?.nombre || "-";
  const empresaTemplate = (rowData) => {
    if (!rowData.centroAlmacen?.empresaId) return "-";
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(rowData.centroAlmacen.empresaId)
    );
    return empresa ? empresa.razonSocial : "-";
  };

  const actionBody = (rowData) => {
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
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(rowData);
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <DataTable
        value={almacenesFiltrados}
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
                <h1>Almacenes</h1>
              </div>
              <div style={{ flex: 3 }}>
                <label
                  htmlFor="empresaFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Empresa:
                </label>
                <Dropdown
                  id="empresaFilter"
                  value={empresaSeleccionada}
                  options={empresas}
                  onChange={(e) => setEmpresaSeleccionada(e.value)}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Todas"
                  filter
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  onClick={handleNew}
                  disabled={!empresaSeleccionada}
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
                  htmlFor="centroFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Centro de Almacén:
                </label>
                <Dropdown
                  id="centroFilter"
                  value={centroAlmacenSeleccionado}
                  options={centrosFiltrados}
                  onChange={(e) => setCentroAlmacenSeleccionado(e.value)}
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
                  htmlFor="tipoAlmacenamientoFilter"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo Almacenamiento:
                </label>
                <Dropdown
                  id="tipoAlmacenamientoFilter"
                  value={tipoAlmacenamientoSeleccionado}
                  options={tiposAlmacenamiento}
                  onChange={(e) => setTipoAlmacenamientoSeleccionado(e.value)}
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
                  Kardex:
                </label>
                <Button
                  label={
                    filtroKardex === "todos"
                      ? "Todos"
                      : filtroKardex === "si"
                      ? "Lleva Kardex"
                      : "No lleva Kardex"
                  }
                  icon={
                    filtroKardex === "todos"
                      ? "pi pi-list"
                      : filtroKardex === "si"
                      ? "pi pi-check"
                      : "pi pi-times"
                  }
                  className={
                    filtroKardex === "todos"
                      ? "p-button-secondary"
                      : filtroKardex === "si"
                      ? "p-button-success"
                      : "p-button-danger"
                  }
                  onClick={() => {
                    if (filtroKardex === "todos") setFiltroKardex("si");
                    else if (filtroKardex === "si") setFiltroKardex("no");
                    else setFiltroKardex("todos");
                  }}
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
        <Column field="nombre" header="Nombre" />
        <Column body={empresaTemplate} header="Empresa" />
        <Column
          field="centroAlmacenId"
          header="Centro Almacén"
          body={centroNombre}
        />
        <Column
          field="tipoAlmacenamientoId"
          header="Tipo Almacenamiento"
          body={tipoAlmacenamientoNombre}
        />
        <Column
          field="tipoAlmacenId"
          header="Tipo Almacén"
          body={tipoAlmacenNombre}
        />
        <Column
          field="seLlevaKardex"
          header="Lleva Kardex"
          body={(rowData) => booleanTemplate(rowData, "seLlevaKardex")}
        />
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
        header={editing ? "Editar Almacén" : "Nuevo Almacén"}
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <AlmacenForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          centrosAlmacen={centrosAlmacen}
          tiposAlmacenamiento={tiposAlmacenamiento}
          tiposAlmacen={tiposAlmacen}
          empresaId={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
