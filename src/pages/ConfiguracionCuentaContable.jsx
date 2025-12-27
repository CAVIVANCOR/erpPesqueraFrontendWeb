// src/pages/ConfiguracionCuentaContable.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import ConfiguracionCuentaContableForm from "../components/configuracionCuentaContable/ConfiguracionCuentaContableForm";
import {
  getAllConfiguracionCuentaContable,
  eliminarConfiguracionCuentaContable,
} from "../api/configuracionCuentaContable";
import { getEmpresas } from "../api/empresa";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getAllTipoReferenciaMovimientoCaja } from "../api/tipoReferenciaMovimientoCaja";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

export default function ConfiguracionCuentaContable({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [tiposReferencia, setTiposReferencia] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState(null);
  const [activoFilter, setActivoFilter] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, empresaFilter, tipoMovimientoFilter, activoFilter]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [configs, emps, tiposMov, tiposRef] = await Promise.all([
        getAllConfiguracionCuentaContable(),
        getEmpresas(),
        getAllTipoMovEntregaRendir(),
        getAllTipoReferenciaMovimientoCaja(),
      ]);
      setItems(configs);
      setEmpresas(emps);
      setTiposMovimiento(tiposMov);
      setTiposReferencia(tiposRef);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filtrarItems = () => {
    let filtrados = [...items];

    if (empresaFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaFilter)
      );
    }

    if (tipoMovimientoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.tipoMovimientoId) === Number(tipoMovimientoFilter)
      );
    }

    if (activoFilter !== null) {
      filtrados = filtrados.filter((item) => item.activo === activoFilter);
    }

    setItemsFiltrados(filtrados);
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }
    setSelected(rowData);
    setIsEdit(true);
    setShowDialog(true);
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setConfirmState({ visible: true, row: rowData });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarConfiguracionCuentaContable(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Configuración eliminada",
        detail: `La configuración fue eliminada correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          "No se pudo eliminar la configuración.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
  };

  const onSubmit = async (data) => {
    // Validar permisos antes de guardar
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      await data; // El formulario ya maneja la llamada a la API
      toast.current?.show({
        severity: "success",
        summary: isEdit ? "Configuración actualizada" : "Configuración creada",
        detail: isEdit
          ? "La configuración fue actualizada correctamente."
          : "La configuración fue creada correctamente.",
        life: 3000,
      });
      setShowDialog(false);
      setSelected(null);
      setIsEdit(false);
      cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la configuración.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEmpresaFilter(null);
    setTipoMovimientoFilter(null);
    setActivoFilter(null);
    setGlobalFilter("");
  };

  const empresaNombreBodyTemplate = (rowData) => {
    const empresa = rowData.empresa;
    return empresa ? empresa.razonSocial : "-";
  };

  const tipoMovimientoBodyTemplate = (rowData) => {
    const tipo = rowData.tipoMovimiento;
    return tipo ? tipo.nombre : "-";
  };

  const tipoReferenciaBodyTemplate = (rowData) => {
    if (!rowData.tipoReferenciaId) return "-";
    const tipo = rowData.tipoReferencia;
    return tipo ? tipo.nombre : "-";
  };

  const activoBodyTemplate = (rowData) => {
    return rowData.activo ? (
      <Tag value="ACTIVO" severity="success" />
    ) : (
      <Tag value="INACTIVO" severity="danger" />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={() => {
            if (permisos.puedeVer || permisos.puedeEditar) {
              onEdit(rowData);
            }
          }}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          disabled={!permisos.puedeEliminar}
          onClick={() => {
            if (permisos.puedeEliminar) {
              onDelete(rowData);
            }
          }}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const empresaOptions = empresas.map((emp) => ({
    label: emp.razonSocial,
    value: Number(emp.id),
  }));

  const tipoMovimientoOptions = tiposMovimiento.map((tipo) => ({
    label: tipo.nombre,
    value: Number(tipo.id),
  }));

  const activoOptions = [
    { label: "Activos", value: true },
    { label: "Inactivos", value: false },
  ];

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> esta configuración?
            <br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={<span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} configuraciones"
        sortField="id"
        sortOrder={1}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => onEdit(e.data)
            : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={["cuentaContableDebe", "cuentaContableHaber", "descripcionPlantilla"]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Configuraciones de Cuentas Contables</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length}
                </small>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  raised
                  disabled={!permisos.puedeCrear}
                  tooltip="Nueva Configuración"
                  outlined
                  onClick={onNew}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  size="small"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail:
                        "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  size="small"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1.5 }}>
                <label htmlFor="empresaFilter">Filtrar por Empresa</label>
                <Dropdown
                  id="empresaFilter"
                  value={empresaFilter}
                  options={empresaOptions}
                  onChange={(e) => setEmpresaFilter(e.value)}
                  placeholder="Todas"
                  showClear
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1.5 }}>
                <label htmlFor="tipoMovimientoFilter">Filtrar por Tipo Movimiento</label>
                <Dropdown
                  id="tipoMovimientoFilter"
                  value={tipoMovimientoFilter}
                  options={tipoMovimientoOptions}
                  onChange={(e) => setTipoMovimientoFilter(e.value)}
                  placeholder="Todos"
                  showClear
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="activoFilter">Estado</label>
                <Dropdown
                  id="activoFilter"
                  value={activoFilter}
                  options={activoOptions}
                  onChange={(e) => setActivoFilter(e.value)}
                  placeholder="Todos"
                  showClear
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter">Buscar</label>
                <span className="p-input-icon-left">
                  <i className="pi pi-search" />
                  <InputText
                    id="globalFilter"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable />
        <Column
          field="empresaId"
          header="Empresa"
          body={empresaNombreBodyTemplate}
          sortable
        />
        <Column
          field="tipoMovimientoId"
          header="Tipo Movimiento"
          body={tipoMovimientoBodyTemplate}
          sortable
        />
        <Column
          field="tipoReferenciaId"
          header="Tipo Referencia"
          body={tipoReferenciaBodyTemplate}
          sortable
        />
        <Column
          field="cuentaContableDebe"
          header="Cuenta DEBE"
          sortable
          style={{ fontFamily: "monospace", fontWeight: "bold" }}
        />
        <Column
          field="cuentaContableHaber"
          header="Cuenta HABER"
          sortable
          style={{ fontFamily: "monospace", fontWeight: "bold" }}
        />
        <Column
          field="descripcionPlantilla"
          header="Plantilla Descripción"
          sortable
          body={(rowData) => rowData.descripcionPlantilla || "-"}
        />
        <Column
          field="activo"
          header="Estado"
          body={activoBodyTemplate}
          sortable
        />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Configuración de Cuenta Contable"
              : "Ver Configuración de Cuenta Contable"
            : "Nueva Configuración de Cuenta Contable"
        }
        visible={showDialog}
        style={{ width: "1200px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <ConfiguracionCuentaContableForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          empresas={empresas}
          tiposMovimiento={tiposMovimiento}
          tiposReferencia={tiposReferencia}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}