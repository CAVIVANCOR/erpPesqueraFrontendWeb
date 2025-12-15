// src/pages/EmpresaCentroCosto.jsx
// Pantalla CRUD profesional para EmpresaCentroCosto. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import EmpresaCentroCostoForm from "../components/empresaCentroCosto/EmpresaCentroCostoForm";
import { getAllEmpresaCentroCosto, crearEmpresaCentroCosto, actualizarEmpresaCentroCosto, eliminarEmpresaCentroCosto } from "../api/empresaCentroCosto";
import { getEmpresas } from "../api/empresa";
import { getAllCentroCosto } from "../api/centroCosto";
import { getPersonalActivoPorEmpresa } from "../api/personal";
import { getProveedoresPorEmpresa } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de relación Empresa-Centro de Costo.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Filtrado global en DataTable.
 * - Documentación de la regla en el encabezado.
 */
export default function EmpresaCentroCosto() {
  const toast = useRef(null);
  const [relaciones, setRelaciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [personalPorEmpresa, setPersonalPorEmpresa] = useState([]);
  const [proveedoresPorEmpresa, setProveedoresPorEmpresa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [relacionSeleccionada, setRelacionSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const { usuario } = useAuthStore();
  const permisos = usePermissions("EmpresaCentroCosto");
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  // Configuración de filtros para DataTable
  const [filters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [relacionesData, empresasData, centrosData] = await Promise.all([
        getAllEmpresaCentroCosto(),
        getEmpresas(),
        getAllCentroCosto()
      ]);
      setRelaciones(relacionesData);
      setEmpresas(empresasData);
      setCentrosCosto(centrosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos del sistema"
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirNuevo = () => {
    setRelacionSeleccionada(null);
    setPersonalPorEmpresa([]);
    setProveedoresPorEmpresa([]);
    setDialogVisible(true);
  };

  const editarRelacion = (relacion) => {
    setRelacionSeleccionada({ ...relacion });
    setDialogVisible(true);
    // Cargar personal y proveedores cuando se selecciona una empresa
    if (relacion.EmpresaID) {
      cargarDatosPorEmpresa(relacion.EmpresaID);
    }
  };

  const cargarDatosPorEmpresa = async (empresaId) => {
    if (!empresaId) {
      setPersonalPorEmpresa([]);
      setProveedoresPorEmpresa([]);
      return;
    }

    try {
      const [personalData, proveedoresData] = await Promise.all([
        getPersonalActivoPorEmpresa(empresaId),
        getProveedoresPorEmpresa(empresaId)
      ]);
      setPersonalPorEmpresa(personalData);
      setProveedoresPorEmpresa(proveedoresData);
    } catch (error) {
      console.error('Error al cargar datos por empresa:', error);
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se pudieron cargar todos los datos de la empresa"
      });
    }
  };

  const confirmarEliminacion = (relacion) => {
    const empresa = empresas.find(e => Number(e.id) === Number(relacion.EmpresaID));
    const centro = centrosCosto.find(c => Number(c.id) === Number(relacion.CentroCostoID));
    const empresaNombre = empresa?.razonSocial || empresa?.nombre || 'Empresa';
    const centroNombre = centro?.Nombre || 'Centro de Costo';
    
    confirmDialog({
      message: `¿Está seguro que desea eliminar la relación entre "${empresaNombre}" y "${centroNombre}"?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => eliminarRelacion(relacion),
      reject: () => {}
    });
  };

  const eliminarRelacion = async (relacion) => {
    setLoading(true);
    try {
      await eliminarEmpresaCentroCosto(relacion.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Relación eliminada correctamente"
      });
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar relación:', error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la relación"
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarRelacion = async (relacionData) => {
    setLoading(true);
    try {
      if (relacionSeleccionada?.id) {
        await actualizarEmpresaCentroCosto(relacionSeleccionada.id, relacionData);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Relación actualizada correctamente"
        });
      } else {
        await crearEmpresaCentroCosto(relacionData);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Relación creada correctamente"
        });
      }
      setDialogVisible(false);
      setRelacionSeleccionada(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar relación:', error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la relación"
      });
    } finally {
      setLoading(false);
    }
  };

  const cerrarDialog = () => {
    setDialogVisible(false);
    setRelacionSeleccionada(null);
  };

  // Renderizado de la columna de empresa
  const empresaBodyTemplate = (rowData) => {
    const empresa = empresas.find(e => Number(e.id) === Number(rowData.EmpresaID));
    return empresa?.razonSocial || empresa?.nombre || 'N/A';
  };

  // Renderizado de la columna de centro de costo
  const centroCostoBodyTemplate = (rowData) => {
    const centro = centrosCosto.find(c => Number(c.id) === Number(rowData.CentroCostoID));
    return centro?.Nombre || 'N/A';
  };

  // Renderizado de la columna de estado activo
  const activoBodyTemplate = (rowData) => {
    return (
      <span className={`badge ${rowData.Activo ? 'badge-success' : 'badge-danger'}`}>
        {rowData.Activo ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  // Renderizado de la columna de acciones
  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={() => editarRelacion(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </>
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <DataTable
          value={relaciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={
            <div className="flex align-items-center gap-2">
              <h2>Gestión de Centro de Costo por Empresa</h2>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                size="small"
                className="p-button-success"
                tooltip="Agregar un nuevo Registro para Centro de Costo por Empresa"
                tooltipOptions={{ position: "top" }}
                outlined
                raised
                onClick={abrirNuevo}
                disabled={loading || !permisos.puedeCrear}
              />
              <span className="p-input-icon-left">
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar relaciones..."
                />
              </span>
            </div>
          }
          filters={filters}
          globalFilterFields={['EmpresaID', 'CentroCostoID', 'ResponsableID']}
          globalFilter={globalFilter}
          emptyMessage="No se encontraron relaciones"
          onRowClick={(e) => editarRelacion(e.data)}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} relaciones"
          scrollable
          scrollHeight="600px"
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        >
          <Column field="id" header="ID" sortable style={{ width: "80px" }} />
          <Column 
            field="EmpresaID" 
            header="Empresa" 
            body={empresaBodyTemplate}
            sortable 
            style={{ minWidth: "250px" }}
          />
          <Column 
            field="CentroCostoID" 
            header="Centro de Costo" 
            body={centroCostoBodyTemplate}
            sortable 
            style={{ minWidth: "200px" }}
          />
          <Column 
            field="ResponsableID" 
            header="Responsable ID" 
            sortable 
            style={{ width: "150px" }}
          />
          <Column 
            field="ProveedorExternoID" 
            header="Proveedor Externo" 
            style={{ width: "150px" }}
          />
          <Column 
            field="Activo" 
            header="Estado" 
            body={activoBodyTemplate}
            sortable 
            style={{ width: "120px", textAlign: "center" }}
          />
          <Column 
            body={actionBodyTemplate} 
            header="Acciones" 
            style={{ width: "120px", textAlign: "center" }}
            exportable={false}
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "700px" }}
        header={relacionSeleccionada?.id ? "Editar Centro Costo por Empresa" : "Nuevo Registro de Centro Costo por Empresa"}
        modal
        className="p-fluid"
        onHide={cerrarDialog}
      >
        <EmpresaCentroCostoForm
          isEdit={!!relacionSeleccionada?.id}
          defaultValues={relacionSeleccionada || {}}
          empresas={empresas}
          centrosCosto={centrosCosto}
          personalPorEmpresa={personalPorEmpresa}
          proveedoresPorEmpresa={proveedoresPorEmpresa}
          onEmpresaChange={cargarDatosPorEmpresa}
          onSubmit={guardarRelacion}
          onCancel={cerrarDialog}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
}
