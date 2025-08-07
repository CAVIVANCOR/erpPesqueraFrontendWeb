/**
 * Pantalla CRUD para gestión de Ubigeos
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
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getUbigeos, eliminarUbigeo, crearUbigeo, actualizarUbigeo } from "../api/ubigeo";
import { getPaises } from "../api/pais";
import { getDepartamentos } from "../api/departamento";
import { getProvincias } from "../api/provincia";
import { useAuthStore } from "../shared/stores/useAuthStore";
import UbigeoForm from "../components/ubigeo/UbigeoForm";
import { getResponsiveFontSize } from "../utils/utils";

const Ubigeo = () => {
  const [ubigeos, setUbigeos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [ubigeoSeleccionado, setUbigeoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [ubigeoAEliminar, setUbigeoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarUbigeos();
  }, []);

  const cargarUbigeos = async () => {
    try {
      setLoading(true);
      const [ubigeosData, paisesData, departamentosData, provinciasData] = await Promise.all([
        getUbigeos(),
        getPaises(),
        getDepartamentos(),
        getProvincias(),
      ]);
      setUbigeos(ubigeosData);
      setPaises(paisesData);
      setDepartamentos(departamentosData);
      setProvincias(provinciasData);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar ubigeos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setUbigeoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (ubigeo) => {
    setUbigeoSeleccionado(ubigeo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setUbigeoSeleccionado(null);
  };

  const onGuardarExitoso = async (data) => {
    if (ubigeoSeleccionado) {
      await actualizarUbigeo(ubigeoSeleccionado.id, data);
    } else {
      await crearUbigeo(data);
    }
    cargarUbigeos();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: ubigeoSeleccionado
        ? "Ubigeo actualizado correctamente"
        : "Ubigeo creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (ubigeo) => {
    setUbigeoAEliminar(ubigeo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarUbigeo(ubigeoAEliminar.id);
      setUbigeos(
        ubigeos.filter((u) => u.id !== ubigeoAEliminar.id)
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Ubigeo eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar ubigeo",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setUbigeoAEliminar(null);
    }
  };

  const paisNombre = (rowData) => {
    const pais = paises.find(p => Number(p.id) === Number(rowData.paisId));
    return pais ? pais.nombre : '';
  };

  const departamentoNombre = (rowData) => {
    const departamento = departamentos.find(d => Number(d.id) === Number(rowData.departamentoId));
    return departamento ? departamento.nombre : '';
  };

  const provinciaNombre = (rowData) => {
    const provincia = provincias.find(p => Number(p.id) === Number(rowData.provinciaId));
    return provincia ? provincia.nombre : '';
  };

  const distritoNombre = (rowData) => {
    const distrito = distritos.find(d => Number(d.id) === Number(rowData.distritoId));
    return distrito ? distrito.nombre : '';
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
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
        value={ubigeos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron ubigeos"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Ubigeos</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Ubigeo"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar ubigeos..."
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
        <Column field="codigo" header="Código" sortable />
        <Column field="paisId" header="País" body={paisNombre} sortable />
        <Column field="departamentoId" header="Departamento" body={departamentoNombre} sortable />
        <Column field="provinciaId" header="Provincia" body={provinciaNombre} sortable />
        <Column field="nombreDistrito" header="Distrito" sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          ubigeoSeleccionado
            ? "Editar Ubigeo"
            : "Nuevo Ubigeo"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "800px" }}
        modal
      >
        <UbigeoForm
          ubigeo={ubigeoSeleccionado}
          paises={paises}
          departamentos={departamentos}
          provincias={provincias}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el ubigeo "${ubigeoAEliminar?.codigo}"?`}
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

export default Ubigeo;
