// src/pages/AccesoInstalacion.jsx
// Pantalla CRUD profesional para AccesoInstalacion. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import AccesoInstalacionForm from "../components/accesoInstalacion/AccesoInstalacionForm";
import {
  getAllAccesoInstalacion,
  crearAccesoInstalacion,
  actualizarAccesoInstalacion,
  eliminarAccesoInstalacion,
} from "../api/accesoInstalacion";
import { getEmpresas } from "../api/empresa";
import { getSedes } from "../api/sedes";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { InputText } from "primereact/inputtext";

/**
 * Pantalla profesional para gestión de Accesos a Instalaciones.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function AccesoInstalacion() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados globales para Empresa y Sede (filtrado y creación)
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [sedesFiltradas, setSedesFiltradas] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const cargarDatos = async () => {
      if (isMounted) {
        await cargarDatosIniciales();
      }
    };
    
    cargarDatos();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Cargar datos iniciales (empresas, sedes y items)
  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Cargar empresas
      const empresasData = await getEmpresas();
      console.log("empresasData", empresasData);
      
      if (empresasData && Array.isArray(empresasData)) {
        setEmpresas(empresasData.map((e) => ({ ...e, id: Number(e.id) })));
      }

      // Cargar todas las sedes
      const sedesData = await getSedes();
      
      if (sedesData && Array.isArray(sedesData)) {
        setSedes(
          sedesData.map((s) => ({
            ...s,
            id: Number(s.id),
            empresaId: Number(s.empresaId),
          }))
        );
      }

      // Cargar items
      await cargarItems();
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los datos iniciales.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para filtrar sedes cuando cambia la empresa seleccionada
  useEffect(() => {
    if (empresaSeleccionada) {
      const sedesFiltradas = sedes.filter(
        (sede) => sede.empresaId === Number(empresaSeleccionada)
      );
      setSedesFiltradas(sedesFiltradas);

      // Si la sede actual no pertenece a la empresa seleccionada, limpiarla
      if (
        sedeSeleccionada &&
        !sedesFiltradas.find((s) => s.id === Number(sedeSeleccionada))
      ) {
        setSedeSeleccionada(null);
      }
    } else {
      setSedesFiltradas([]);
      setSedeSeleccionada(null);
    }
  }, [empresaSeleccionada, sedes, sedeSeleccionada]);

  const cargarItems = async () => {
    setLoading(true);
    try {
      let data = await getAllAccesoInstalacion();
      
      // Verificar que data sea un array válido
      if (!data || !Array.isArray(data)) {
        console.warn('Los datos de accesos no son válidos:', data);
        setItems([]);
        return;
      }

      // Aplicar filtros por empresa y sede si están seleccionados
      if (empresaSeleccionada) {
        data = data.filter(
          (item) => item.empresaId === Number(empresaSeleccionada)
        );
      }
      if (sedeSeleccionada) {
        data = data.filter((item) => item.sedeId === Number(sedeSeleccionada));
      }

      setItems(data);
    } catch (err) {
      console.error('Error al cargar accesos:', err);
      setItems([]); // Establecer array vacío en caso de error
      
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar la lista de accesos.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarAccesoInstalacion(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el registro.",
      });
    }
    setLoading(false);
    setShowConfirm(false);
    setToDelete(null);
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarAccesoInstalacion(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearAccesoInstalacion(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el registro.",
      });
    }
    setLoading(false);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaAcceso) return "";
    return new Date(rowData.fechaAcceso).toLocaleDateString("es-ES");
  };

  const horaBodyTemplate = (rowData) => {
    if (!rowData.horaAcceso) return "";
    return rowData.horaAcceso;
  };

  const estadoBodyTemplate = (rowData) => {
    return (
      <span
        className={`p-tag ${rowData.activo ? "p-tag-success" : "p-tag-danger"}`}
      >
        {rowData.activo ? "Activo" : "Inactivo"}
      </span>
    );
  };

  // Efecto para recargar items cuando cambien los filtros
  useEffect(() => {
    if (empresas.length > 0) {
      // Solo recargar si ya se cargaron las empresas
      cargarItems();
    }
  }, [empresaSeleccionada, sedeSeleccionada]);

  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        value={items}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="p-datatable-gridlines"
        showGridlines
        size="small"
        emptyMessage="No se encontraron registros"
        onRowClick={(e) => handleEdit(e.data)}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Registro de Accesos a Instalaciones</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              disabled={!empresaSeleccionada || !sedeSeleccionada}
              onClick={() => {
                setEditing(null);
                setShowDialog(true);
              }}
              tooltip={
                !empresaSeleccionada || !sedeSeleccionada
                  ? "Seleccione empresa y sede para crear un nuevo acceso"
                  : "Crear nuevo acceso"
              }
            />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar accesos..."
              style={{ width: "300px" }}
            />
            {/* Panel de Filtros Globales */}
            <label htmlFor="empresaFiltro" className="font-bold">
              Empresa *
            </label>
            <Dropdown
              id="empresaFiltro"
              value={empresaSeleccionada}
              options={empresas}
              onChange={(e) => setEmpresaSeleccionada(e.value)}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder="Seleccione una empresa"
              className="w-full"
              showClear
            />
            <label htmlFor="sedeFiltro" className="font-bold">
              Sede *
            </label>
            <Dropdown
              id="sedeFiltro"
              value={sedeSeleccionada}
              options={sedesFiltradas}
              onChange={(e) => setSedeSeleccionada(e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccione una sede"
              className="w-full"
              disabled={!empresaSeleccionada}
              showClear
            />
          </div>
        }
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        scrollable
        scrollHeight="600px"
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column field="persona.nombres" header="Persona" sortable />
        <Column field="tipoAcceso.descripcion" header="Tipo Acceso" sortable />
        <Column
          field="fechaAcceso"
          header="Fecha"
          sortable
          body={fechaBodyTemplate}
        />
        <Column
          field="horaAcceso"
          header="Hora"
          sortable
          body={horaBodyTemplate}
        />
        <Column field="motivoAcceso.descripcion" header="Motivo" sortable />
        <Column field="observaciones" header="Observaciones" sortable />
        <Column
          field="activo"
          header="Estado"
          sortable
          body={estadoBodyTemplate}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={showDialog}
        style={{ 
          width: "90vw", 
          maxWidth: "800px",
          margin: "0 auto"
        }}
        header={
          editing ? "Editar Acceso a Instalación" : "Nuevo Acceso a Instalación"
        }
        modal
        className="p-fluid dialog-responsive"
        onHide={() => {
          setShowDialog(false);
          setEditing(null);
        }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
        draggable={false}
        resizable={false}
      >
        <AccesoInstalacionForm
          item={editing}
          onSave={handleSave}
          onCancel={() => {
            setShowDialog(false);
            setEditing(null);
          }}
          empresaId={empresaSeleccionada}
          sedeId={sedeSeleccionada}
        />
      </Dialog>

      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro de que desea eliminar este registro?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={confirmDelete}
        reject={() => {
          setShowConfirm(false);
          setToDelete(null);
        }}
        acceptClassName="p-button-danger"
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
      />
    </div>
  );
}
