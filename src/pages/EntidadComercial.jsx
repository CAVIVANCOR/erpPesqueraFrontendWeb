/**
 * Pantalla CRUD para gestión de Entidades Comerciales
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { getEntidadesComerciales, eliminarEntidadComercial } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import EntidadComercialForm from "../components/entidadComercial/EntidadComercialForm";
import { getResponsiveFontSize } from "../utils/utils";
import { InputText } from "primereact/inputtext";

const EntidadComercial = () => {
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [entidadAEliminar, setEntidadAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarEntidadesComerciales();
  }, []);

  const cargarEntidadesComerciales = async () => {
    try {
      setLoading(true);
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar entidades comerciales",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setEntidadSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (entidad) => {
    setEntidadSeleccionada(entidad);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEntidadSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    cargarEntidadesComerciales();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: entidadSeleccionada
        ? "Entidad comercial actualizada correctamente"
        : "Entidad comercial creada correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (entidad) => {
    setEntidadAEliminar(entidad);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarEntidadComercial(entidadAEliminar.id);
      setEntidadesComerciales(
        entidadesComerciales.filter((e) => Number(e.id) !== Number(entidadAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entidad comercial eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar entidad comercial",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setEntidadAEliminar(null);
    }
  };

  const numeroDocumentoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.numeroDocumento}
      </span>
    );
  };

  const razonSocialTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.razonSocial}
      </span>
    );
  };

  const tipoTemplate = (rowData) => {
    const tipos = [];
    if (rowData.esCliente) tipos.push("Cliente");
    if (rowData.esProveedor) tipos.push("Proveedor");
    if (rowData.esCorporativo) tipos.push("Corporativo");
    
    return tipos.length > 0 ? tipos.join(", ") : "N/A";
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estado ? "Activo" : "Inactivo"}
        severity={rowData.estado ? "success" : "danger"}
      />
    );
  };

  const estadoActivoSUNATTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estadoActivoSUNAT ? "Activo" : "Inactivo"}
        severity={rowData.estadoActivoSUNAT ? "success" : "danger"}
      />
    );
  };

  const condicionHabidoSUNATTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.condicionHabidoSUNAT ? "Habido" : "No Habido"}
        severity={rowData.condicionHabidoSUNAT ? "success" : "warning"}
      />
    );
  };

  const esAgenteRetencionTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esAgenteRetencion ? "Sí" : "No"}
        severity={rowData.esAgenteRetencion ? "info" : "secondary"}
      />
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
        value={entidadesComerciales}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron entidades comerciales"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Entidades Comerciales</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nueva Entidad Comercial"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable />
        <Column 
          field="numeroDocumento" 
          header="N° Documento" 
          body={numeroDocumentoTemplate}
          sortable 
        />
        <Column 
          field="razonSocial" 
          header="Razón Social" 
          body={razonSocialTemplate}
          sortable 
        />
        <Column 
          header="Tipo" 
          body={tipoTemplate}
          sortable 
        />
        <Column 
          field="estado" 
          header="Estado" 
          body={estadoTemplate} 
          sortable 
        />
        <Column 
          field="estadoActivoSUNAT" 
          header="Activo SUNAT" 
          body={estadoActivoSUNATTemplate} 
          sortable 
        />
        <Column 
          field="condicionHabidoSUNAT" 
          header="Habido SUNAT" 
          body={condicionHabidoSUNATTemplate} 
          sortable 
        />
        <Column 
          field="esAgenteRetencion" 
          header="Agente Retención" 
          body={esAgenteRetencionTemplate} 
          sortable 
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          entidadSeleccionada
            ? `Editar Entidad Comercial - ID: ${entidadSeleccionada.id}`
            : "Nueva Entidad Comercial"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "90vw", maxWidth: "1300px" }}
        modal
      >
        <EntidadComercialForm
          entidadComercial={entidadSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la entidad comercial "${entidadAEliminar?.razonSocial}"?`}
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

export default EntidadComercial;
