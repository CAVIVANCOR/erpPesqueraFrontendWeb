/**
 * Pantalla CRUD para gestión de Departamentos
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global con filtro en tiempo real
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
import { InputText } from "primereact/inputtext";
import { getDepartamentos, eliminarDepartamento, crearDepartamento, actualizarDepartamento } from "../api/departamento";
import { getPaises } from "../api/pais";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import DepartamentoForm from "../components/departamento/DepartamentoForm";
import { getResponsiveFontSize } from "../utils/utils";

const Departamento = ({ ruta }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [departamentoAEliminar, setDepartamentoAEliminar] = useState(null);
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
      const [departamentosData, paisesData] = await Promise.all([
        getDepartamentos(),
        getPaises()
      ]);
      setDepartamentos(departamentosData);
      setPaises(paisesData);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar departamentos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setDepartamentoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (departamento) => {
    setDepartamentoSeleccionado(departamento);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setDepartamentoSeleccionado(null);
  };

  const onGuardarExitoso = async () => {
    // El formulario ya manejó la API internamente
    // Solo mostramos feedback visual y recargamos datos
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: departamentoSeleccionado 
        ? "Departamento actualizado correctamente"
        : "Departamento creado correctamente",
      life: 3000,
    });
    
    cargarDatos();
    cerrarDialogo();
  };

  const confirmarEliminacion = (departamento) => {
    setDepartamentoAEliminar(departamento);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarDepartamento(departamentoAEliminar.id);
      setDepartamentos(
        departamentos.filter((d) => d.id !== departamentoAEliminar.id)
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Departamento eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar departamento",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setDepartamentoAEliminar(null);
    }
  };

  const paisTemplate = (rowData) => {
    const pais = paises.find(p => Number(p.id) === Number(rowData.paisId));
    return pais ? pais.nombre : 'N/A';
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
        value={departamentos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron departamentos"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Departamentos</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Departamento"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar departamentos..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable />
        <Column field="codSUNAT" header="Código SUNAT" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="paisId" header="País" body={paisTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          departamentoSeleccionado
            ? "Editar Departamento"
            : "Nuevo Departamento"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <DepartamentoForm
          departamento={departamentoSeleccionado}
          paises={paises}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el departamento "${departamentoAEliminar?.nombre}"?`}
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

export default Departamento;
