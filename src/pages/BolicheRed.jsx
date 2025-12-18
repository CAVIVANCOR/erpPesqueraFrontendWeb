/**
 * Página de gestión de Boliche Red
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por descripción
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
import { InputText } from "primereact/inputtext";
import { getAllBolicheRed, eliminarBolicheRed } from "../api/bolicheRed";
import { getActivos } from "../api/activo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import BolicheRedForm from "../components/bolicheRed/BolicheRedForm";
import { getResponsiveFontSize } from "../utils/utils";

const BolicheRed = ({ ruta }) => {
  const [bolicheReds, setBolicheReds] = useState([]);
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [bolicheRedSeleccionado, setBolicheRedSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [bolicheRedAEliminar, setBolicheRedAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <div className="p-4"><h2>Sin Acceso</h2><p>No tiene permisos para acceder a este módulo.</p></div>;
  }

  const [globalFilter, setGlobalFilter] = useState("");

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [bolicheRedData, activosData] = await Promise.all([
        getAllBolicheRed(),
        getActivos()
      ]);
      setBolicheReds(bolicheRedData);
      setActivos(activosData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setBolicheRedSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (bolicheRed) => {
    setBolicheRedSeleccionado(bolicheRed);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setBolicheRedSeleccionado(null);
  };

  const confirmarEliminacion = (bolicheRed) => {
    setBolicheRedAEliminar(bolicheRed);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      setLoading(true);
      await eliminarBolicheRed(bolicheRedAEliminar.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Boliche Red eliminado correctamente",
        life: 3000,
      });
      cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el Boliche Red",
        life: 3000,
      });
    } finally {
      setLoading(false);
      setConfirmVisible(false);
      setBolicheRedAEliminar(null);
    }
  };

  const onGuardar = () => {
    toast.current?.show({
      severity: "success",
      summary: "Guardado",
      detail: bolicheRedSeleccionado ? "Boliche Red actualizado correctamente" : "Boliche Red creado correctamente",
      life: 3000,
    });
    cerrarDialogo();
    cargarDatos();
  };

  const onError = (mensaje) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: mensaje || "Error al guardar el Boliche Red",
      life: 3000,
    });
  };

  const activoTemplate = (rowData) => {
    const activo = activos.find((a) => a.id === rowData.activoId);
    return activo?.descripcion || "N/A";
  };

  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "Cesado" : "Activo"}
        severity={rowData.cesado ? "danger" : "success"}
      />
    );
  };

  const paraPescaConsumoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraPescaConsumo ? "Sí" : "No"}
        severity={rowData.paraPescaConsumo ? "success" : "secondary"}
      />
    );
  };

  const paraPescaIndustrialTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraPescaIndustrial ? "Sí" : "No"}
        severity={rowData.paraPescaIndustrial ? "success" : "secondary"}
      />
    );
  };

  const numeroTemplate = (rowData, field) => {
    const valor = rowData[field];
    return valor ? Number(valor).toLocaleString() : 'N/A';
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-info"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message="¿Está seguro que desea eliminar este Boliche Red?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
      />

      <DataTable
        value={bolicheReds}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron registros"
        header={
          <div className="flex justify-content-between align-items-center">
            <h2 className="m-0">Gestión de Boliche Red</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Boliche Red"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar boliche red..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable body={(rowData) => Number(rowData.id)} />
        <Column field="activoId" header="Activo" sortable body={activoTemplate} />
        <Column field="descripcion" header="Descripción" sortable />
        <Column field="largoContraido" header="Longitud de Armado" sortable body={(rowData) => numeroTemplate(rowData, 'largoContraido')} />
        <Column field="largoExpandido" header="Longitud de Paño" sortable body={(rowData) => numeroTemplate(rowData, 'largoExpandido')} />
        <Column field="altoM" header="Alto (m)" sortable body={(rowData) => numeroTemplate(rowData, 'altoM')} />
        <Column field="nroFlotadores" header="Nº Flotadores" sortable body={(rowData) => numeroTemplate(rowData, 'nroFlotadores')} />
        <Column field="nroPlomos" header="Nº Plomos" sortable body={(rowData) => numeroTemplate(rowData, 'nroPlomos')} />
        <Column field="cesado" header="Estado" sortable body={cesadoTemplate} />
        <Column field="paraPescaConsumo" header="Para Pesca Consumo" sortable body={paraPescaConsumoTemplate} />
        <Column field="paraPescaIndustrial" header="Para Pesca Industrial" sortable body={paraPescaIndustrialTemplate} />
        <Column body={accionesTemplate} header="Acciones" style={{ width: "120px", textAlign: "center" }} />
      </DataTable>

      <Dialog
        header={bolicheRedSeleccionado ? "Editar Boliche Red" : "Nuevo Boliche Red"}
        visible={dialogVisible}
        style={{ width: "1300px" }}
        onHide={cerrarDialogo}
        modal
        className="p-fluid"
      >
        <BolicheRedForm
          bolicheRed={bolicheRedSeleccionado}
          onGuardar={onGuardar}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
};

export default BolicheRed;
