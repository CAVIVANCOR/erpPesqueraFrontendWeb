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
import { getMediosPago, deleteMedioPago } from "../api/medioPago";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import MedioPagoForm from "../components/medioPago/MedioPagoForm";
import { getResponsiveFontSize } from "../utils/utils";

const MedioPago = ({ ruta }) => {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [mediosPago, setMediosPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [medioPagoSeleccionado, setMedioPagoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [medioPagoAEliminar, setMedioPagoAEliminar] = useState(null);
  const toast = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    cargarMediosPago();
  }, []);

  const cargarMediosPago = async () => {
    try {
      setLoading(true);
      const data = await getMediosPago();
      setMediosPago(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar medios de pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setMedioPagoSeleccionado(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (medioPago) => {
    setMedioPagoSeleccionado(medioPago);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setMedioPagoSeleccionado(null);
    setIsEdit(false);
  };

  const onGuardarExitoso = () => {
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    cargarMediosPago();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: medioPagoSeleccionado
        ? "Medio de pago actualizado correctamente"
        : "Medio de pago creado correctamente",
      life: 3000,
    });
  };

  const onError = (mensajeError) => {
    toast.current.show({
      severity: "error",
      summary: "Error",
      detail: mensajeError,
      life: 5000,
    });
  };

  const confirmarEliminacion = (medioPago) => {
    setMedioPagoAEliminar(medioPago);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await deleteMedioPago(medioPagoAEliminar.id);
      setMediosPago(
        mediosPago.filter((m) => Number(m.id) !== Number(medioPagoAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Medio de pago eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar medio de pago",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setMedioPagoAEliminar(null);
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

  const requiereBancoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.requiereBanco ? "Sí" : "No"}
        severity={rowData.requiereBanco ? "info" : "secondary"}
      />
    );
  };

  const requiereNumOperacionTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.requiereNumOperacion ? "Sí" : "No"}
        severity={rowData.requiereNumOperacion ? "info" : "secondary"}
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
        value={mediosPago}
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
        emptyMessage="No se encontraron medios de pago"
        globalFilter={globalFilter}
        globalFilterFields={['codigo', 'nombre']}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Medios de Pago</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Medio de Pago"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar medios de pago..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="id" header="ID" sortable />
        <Column field="codigo" header="Código" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="requiereBanco" header="Requiere Banco" body={requiereBancoTemplate} sortable />
        <Column field="requiereNumOperacion" header="Requiere N° Operación" body={requiereNumOperacionTemplate} sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
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
              ? "Editar Medio de Pago"
              : "Ver Medio de Pago"
            : "Nuevo Medio de Pago"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <MedioPagoForm
          medioPago={medioPagoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          onError={onError}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el medio de pago "${medioPagoAEliminar?.nombre}"?`}
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

export default MedioPago;