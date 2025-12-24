// src/pages/ConfiguracionCuentaContable.jsx
// Pantalla CRUD profesional para ConfiguracionCuentaContable. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import ConfiguracionCuentaContableForm from "../components/configuracionCuentaContable/ConfiguracionCuentaContableForm";
import {
  getAllConfiguracionCuentaContable,
  crearConfiguracionCuentaContable,
  actualizarConfiguracionCuentaContable,
  eliminarConfiguracionCuentaContable,
} from "../api/configuracionCuentaContable";
import { getEmpresas } from "../api/empresa";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getAllTipoReferenciaMovimientoCaja } from "../api/tipoReferenciaMovimientoCaja";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Configuraciones de Cuentas Contables.
 */
export default function ConfiguracionCuentaContable({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [tiposReferencia, setTiposReferencia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

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
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const getItemsFiltrados = () => {
    return items.filter((item) => {
      const cumpleFiltroEmpresa =
        !filtroEmpresa || Number(item.empresaId) === Number(filtroEmpresa);
      const cumpleFiltroTipoMov =
        !filtroTipoMovimiento ||
        Number(item.tipoMovimientoId) === Number(filtroTipoMovimiento);
      const cumpleFiltroActivo =
        filtroActivo === null || item.activo === filtroActivo;

      return cumpleFiltroEmpresa && cumpleFiltroTipoMov && cumpleFiltroActivo;
    });
  };

  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroTipoMovimiento(null);
    setFiltroActivo(null);
  };

  const obtenerMensajeError = (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (typeof error.response?.data === "string") {
      return error.response.data;
    }
    if (error.message) {
      return error.message;
    }
    return "Error desconocido";
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
      await eliminarConfiguracionCuentaContable(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarDatos();
    } catch (err) {
      const mensajeError = obtenerMensajeError(err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarConfiguracionCuentaContable(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearConfiguracionCuentaContable(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarDatos();
    } catch (err) {
      const mensajeError = obtenerMensajeError(err);
      toast.current.show({
        severity: "error",
        summary: "Error al Guardar",
        detail: mensajeError,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
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
        value={getItemsFiltrados()}
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
                alignItems: "end",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Configuraciones de Cuentas Contables</h2>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  severity="success"
                  raised
                  onClick={handleAdd}
                  disabled={loading || !permisos.puedeCrear}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label>Filtrar por Empresa:</label>
                <Dropdown
                  value={filtroEmpresa}
                  options={empresas.map((emp) => ({
                    label: emp.razonSocial,
                    value: Number(emp.id),
                  }))}
                  onChange={(e) => setFiltroEmpresa(e.value)}
                  placeholder="Todas"
                  showClear
                  filter
                  className="w-full"
                />
              </div>
              <div style={{ flex: 2 }}>
                <label>Filtrar por Tipo Movimiento:</label>
                <Dropdown
                  value={filtroTipoMovimiento}
                  options={tiposMovimiento.map((tipo) => ({
                    label: tipo.nombre,
                    value: Number(tipo.id),
                  }))}
                  onChange={(e) => setFiltroTipoMovimiento(e.value)}
                  placeholder="Todos"
                  showClear
                  filter
                  className="w-full"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Estado:</label>
                <Dropdown
                  value={filtroActivo}
                  options={[
                    { label: "Activos", value: true },
                    { label: "Inactivos", value: false },
                  ]}
                  onChange={(e) => setFiltroActivo(e.value)}
                  placeholder="Todos"
                  showClear
                  className="w-full"
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  size="small"
                  severity="secondary"
                  raised
                  onClick={limpiarFiltros}
                  disabled={
                    !filtroEmpresa &&
                    !filtroTipoMovimiento &&
                    filtroActivo === null
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          field="empresaId"
          header="Empresa"
          sortable
          body={(rowData) => {
            const empresa = rowData.empresa;
            return empresa ? empresa.razonSocial : rowData.empresaId;
          }}
        />
        <Column
          field="tipoMovimientoId"
          header="Tipo Movimiento"
          sortable
          body={(rowData) => {
            const tipo = rowData.tipoMovimiento;
            return tipo ? tipo.nombre : rowData.tipoMovimientoId;
          }}
        />
        <Column
          field="tipoReferenciaId"
          header="Tipo Referencia"
          sortable
          body={(rowData) => {
            if (!rowData.tipoReferenciaId) return "-";
            const tipo = rowData.tipoReferencia;
            return tipo ? tipo.nombre : rowData.tipoReferenciaId;
          }}
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
          body={(rowData) =>
            rowData.descripcionPlantilla || "-"
          }
        />
        <Column
          field="activo"
          header="Estado"
          sortable
          body={(rowData) =>
            rowData.activo ? (
              <Tag value="ACTIVO" severity="success" />
            ) : (
              <Tag value="INACTIVO" severity="danger" />
            )
          }
          style={{ width: 100 }}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        header={
          editing
            ? "Editar Configuración de Cuenta Contable"
            : "Nueva Configuración de Cuenta Contable"
        }
        visible={showDialog}
        style={{ width: 1200 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <ConfiguracionCuentaContableForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          empresas={empresas}
          tiposMovimiento={tiposMovimiento}
          tiposReferencia={tiposReferencia}
        />
      </Dialog>
    </div>
  );
}
