/**
 * Pantalla CRUD para gestión de Tipos de Activo
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por código, nombre, descripción
 * - Muestra cuentas contables configuradas (33x, 68x, 39x)
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.1.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getTiposActivo, eliminarTipoActivo } from "../api/tipoActivo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import TipoActivoForm from "../components/tipoActivo/TipoActivoForm";
import { getResponsiveFontSize } from "../utils/utils";

const TipoActivo = ({ ruta }) => {
  const [tiposActivo, setTiposActivo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoActivoSeleccionado, setTipoActivoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tipoActivoAEliminar, setTipoActivoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return (
      <div className="p-4">
        <h2>Sin Acceso</h2>
        <p>No tiene permisos para acceder a este módulo.</p>
      </div>
    );
  }
  const [globalFilter, setGlobalFilter] = useState("");

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarTiposActivo();
  }, []);

  const cargarTiposActivo = async () => {
    try {
      setLoading(true);
      const data = await getTiposActivo();
      setTiposActivo(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de activo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setTipoActivoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tipoActivo) => {
    setTipoActivoSeleccionado(tipoActivo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoActivoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarTiposActivo();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: tipoActivoSeleccionado
        ? "Tipo de activo actualizado correctamente"
        : "Tipo de activo creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (tipoActivo) => {
    setTipoActivoAEliminar(tipoActivo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarTipoActivo(tipoActivoAEliminar.id);
      setTiposActivo(
        tiposActivo.filter(
          (t) => Number(t.id) !== Number(tipoActivoAEliminar.id),
        ),
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de activo eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar tipo de activo",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setTipoActivoAEliminar(null);
    }
  };

  const codigoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.codigo}
      </span>
    );
  };

  const nombreTemplate = (rowData) => {
    return <span style={{ fontWeight: "500" }}>{rowData.nombre}</span>;
  };

  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "CESADO" : "ACTIVO"}
        severity={rowData.cesado ? "danger" : "success"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const cuentaActivoTemplate = (rowData) => {
    if (!rowData.cuentaActivo) return "-";
    return (
      <span style={{ fontSize: "0.9em" }}>
        {rowData.cuentaActivo.codigoCuenta} - {rowData.cuentaActivo.nombreCuenta}
      </span>
    );
  };

  const cuentaDepreciacionTemplate = (rowData) => {
    if (!rowData.cuentaDepreciacion) return "-";
    return (
      <span style={{ fontSize: "0.9em" }}>
        {rowData.cuentaDepreciacion.codigoCuenta} - {rowData.cuentaDepreciacion.nombreCuenta}
      </span>
    );
  };

  const cuentaDepreciacionAcumuladaTemplate = (rowData) => {
    if (!rowData.cuentaDepreciacionAcumulada) return "-";
    return (
      <span style={{ fontSize: "0.9em" }}>
        {rowData.cuentaDepreciacionAcumulada.codigoCuenta} - {rowData.cuentaDepreciacionAcumulada.nombreCuenta}
      </span>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={tiposActivo}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron tipos de activo"
        globalFilter={globalFilter}
        globalFilterFields={["codigo", "nombre", "descripcion"]}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Activo</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Tipo de Activo"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar tipos de activo..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column field="codigo" header="Código" body={codigoTemplate} sortable style={{ minWidth: "120px" }} />
        <Column field="nombre" header="Nombre" body={nombreTemplate} sortable style={{ minWidth: "180px" }} />
        <Column field="descripcion" header="Descripción" sortable style={{ minWidth: "200px" }} />
        <Column 
          header="Cuenta Activo (33x)" 
          body={cuentaActivoTemplate} 
          sortable 
          style={{ minWidth: "250px" }}
        />
        <Column 
          header="Cuenta Depreciación (68x)" 
          body={cuentaDepreciacionTemplate} 
          sortable 
          style={{ minWidth: "250px" }}
        />
        <Column 
          header="Cuenta Dep. Acumulada (39x)" 
          body={cuentaDepreciacionAcumuladaTemplate} 
          sortable 
          style={{ minWidth: "250px" }}
        />
        <Column header="Estado" body={cesadoTemplate} sortable style={{ minWidth: "100px" }} />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          tipoActivoSeleccionado
            ? "Editar Tipo de Activo"
            : "Nuevo Tipo de Activo"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "1200px" }}
        modal
      >
        <TipoActivoForm
          tipoActivo={tipoActivoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
          toast={toast}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el tipo de activo "${tipoActivoAEliminar?.nombre}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />
    </div>
  );
};

export default TipoActivo;