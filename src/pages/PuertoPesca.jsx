/**
 * Pantalla CRUD para gestión de Puertos de Pesca
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por zona, nombre, provincia, departamento
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getPuertosPesca, eliminarPuertoPesca } from "../api/puertoPesca";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import PuertoPescaForm from "../components/puertoPesca/PuertoPescaForm";
import { getResponsiveFontSize } from "../utils/utils";

const PuertoPesca = ({ ruta }) => {
  // Obtener usuario autenticado para control de permisos
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [puertosPesca, setPuertosPesca] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [puertoPescaSeleccionado, setPuertoPescaSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [puertoPescaAEliminar, setPuertoPescaAEliminar] = useState(null);
  const toast = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    cargarPuertosPesca();
  }, []);

  const cargarPuertosPesca = async () => {
    try {
      setLoading(true);
      const data = await getPuertosPesca();
      setPuertosPesca(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar puertos de pesca",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setPuertoPescaSeleccionado(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (puertoPesca) => {
    setPuertoPescaSeleccionado(puertoPesca);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setPuertoPescaSeleccionado(null);
    setIsEdit(false);
  };

  const onGuardarExitoso = () => {
    // Validar permisos antes de guardar
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    cargarPuertosPesca();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: puertoPescaSeleccionado
        ? "Puerto de pesca actualizado correctamente"
        : "Puerto de pesca creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (puertoPesca) => {
    setPuertoPescaAEliminar(puertoPesca);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarPuertoPesca(puertoPescaAEliminar.id);
      setPuertosPesca(
        puertosPesca.filter((p) => Number(p.id) !== Number(puertoPescaAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Puerto de pesca eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar puerto de pesca",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setPuertoPescaAEliminar(null);
    }
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  const paisTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esPuertoOtroPais ? "Extranjero" : "Nacional"}
        severity={rowData.esPuertoOtroPais ? "info" : "warning"}
        icon={rowData.esPuertoOtroPais ? "pi pi-globe" : "pi pi-flag"}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={(ev) => {
            ev.stopPropagation();
            if (permisos.puedeVer || permisos.puedeEditar) {
              abrirDialogoEdicion(rowData);
            }
          }}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          disabled={!permisos.puedeEliminar}
          onClick={(ev) => {
            ev.stopPropagation();
            if (permisos.puedeEliminar) {
              confirmarEliminacion(rowData);
            }
          }}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={puertosPesca}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => abrirDialogoEdicion(e.data)
            : undefined
        }
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron puertos de pesca"
        globalFilter={globalFilter}
        globalFilterFields={['zona', 'nombre', 'provincia', 'departamento']}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Puertos de Pesca</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Puerto de Pesca"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar puertos de pesca..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="id" header="ID" sortable />
        <Column field="zona" header="Zona" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="provincia" header="Provincia" sortable />
        <Column field="departamento" header="Departamento" sortable />
        <Column field="latitud" header="Latitud" sortable />
        <Column field="longitud" header="Longitud" sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column field="esPuertoOtroPais" header="Tipo" body={paisTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Puerto de Pesca"
              : "Ver Puerto de Pesca"
            : "Nuevo Puerto de Pesca"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <PuertoPescaForm
          puertoPesca={puertoPescaSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el puerto de pesca "${puertoPescaAEliminar?.nombre}"?`}
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

export default PuertoPesca;
