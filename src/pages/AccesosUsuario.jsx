// src/pages/AccesosUsuario.jsx
// Pantalla CRUD profesional para AccesosUsuario. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import AccesosUsuarioForm from "../components/accesosUsuario/AccesosUsuarioForm";
import {
  getAllAccesosUsuario,
  createAccesosUsuario,
  updateAccesosUsuario,
  deleteAccesosUsuario,
} from "../api/accesosUsuario";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getUsuarios } from "../api/usuarios";
import { getModulos } from "../api/moduloSistema";
import { getSubmodulos } from "../api/submoduloSistema";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";

/**
 * Pantalla profesional para gestión de Accesos de Usuario.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Filtros dinámicos según datos existentes.
 * - Documentación de la regla en el encabezado.
 */
export default function AccesosUsuario({ ruta }) {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  
  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [dialogKey, setDialogKey] = useState(0); // Key para forzar re-render del formulario
  
  // Catálogos
  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [submodulos, setSubmodulos] = useState([]);

  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState(null);
  const [filtroModulo, setFiltroModulo] = useState(null);
  const [filtroSubmodulo, setFiltroSubmodulo] = useState(null);

  // Filtros dinámicos
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [modulosFiltrados, setModulosFiltrados] = useState([]);
  const [submodulosFiltrados, setSubmodulosFiltrados] = useState([]);

  useEffect(() => {
    cargarItems();
    cargarCatalogos();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [items, filtroUsuario, filtroModulo, filtroSubmodulo]);

  // Actualizar usuarios filtrados (solo usuarios con accesos)
  useEffect(() => {
    if (items.length > 0 && usuarios.length > 0) {
      const usuariosUnicos = [...new Set(items.map((item) => item.usuarioId))];
      const usuariosConAccesos = usuarios.filter((u) =>
        usuariosUnicos.includes(u.id)
      );
      setUsuariosFiltrados(usuariosConAccesos);
    }
  }, [items, usuarios]);

  // Actualizar módulos filtrados cuando cambia el usuario seleccionado
  useEffect(() => {
    if (filtroUsuario && items.length > 0 && submodulos.length > 0) {
      // Obtener accesos del usuario seleccionado
      const accesosUsuario = items.filter(
        (item) => item.usuarioId === filtroUsuario
      );
      const submodulosUsuario = accesosUsuario.map((item) => item.submoduloId);

      // Obtener módulos de esos submódulos
      const modulosIds = [
        ...new Set(
          submodulos
            .filter((s) => submodulosUsuario.includes(s.id))
            .map((s) => s.moduloId)
        ),
      ];

      const modulosDelUsuario = modulos.filter((m) =>
        modulosIds.includes(m.id)
      );
      setModulosFiltrados(modulosDelUsuario);
    } else {
      setModulosFiltrados([]);
    }
    // Limpiar filtro de módulo cuando cambia usuario
    setFiltroModulo(null);
  }, [filtroUsuario, items, modulos, submodulos]);

  // Actualizar submódulos filtrados cuando cambia usuario o módulo
  useEffect(() => {
    if (filtroUsuario && items.length > 0 && submodulos.length > 0) {
      // Obtener accesos del usuario seleccionado
      const accesosUsuario = items.filter(
        (item) => item.usuarioId === filtroUsuario
      );
      const submodulosUsuario = accesosUsuario.map((item) => item.submoduloId);

      // Filtrar submódulos por usuario y opcionalmente por módulo
      let submodulosFiltradosTemp = submodulos.filter((s) =>
        submodulosUsuario.includes(s.id)
      );

      if (filtroModulo) {
        submodulosFiltradosTemp = submodulosFiltradosTemp.filter(
          (s) => s.moduloId === filtroModulo
        );
      }

      setSubmodulosFiltrados(submodulosFiltradosTemp);
    } else {
      setSubmodulosFiltrados([]);
    }
    // Limpiar filtro de submódulo cuando cambia usuario o módulo
    setFiltroSubmodulo(null);
  }, [filtroUsuario, filtroModulo, items, submodulos]);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllAccesosUsuario();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista.",
      });
    }
    setLoading(false);
  };

  const cargarCatalogos = async () => {
    try {
      const [usuariosData, modulosData, submodulosData] = await Promise.all([
        getUsuarios(),
        getModulos(),
        getSubmodulos(),
      ]);
      setUsuarios(usuariosData);
      setModulos(modulosData);
      setSubmodulos(submodulosData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los catálogos.",
      });
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...items];

    if (filtroUsuario) {
      resultado = resultado.filter((item) => item.usuarioId === filtroUsuario);
    }

    if (filtroModulo) {
      const submodulosDelModulo = submodulos
        .filter((s) => s.moduloId === filtroModulo)
        .map((s) => s.id);
      resultado = resultado.filter((item) =>
        submodulosDelModulo.includes(item.submoduloId)
      );
    }

    if (filtroSubmodulo) {
      resultado = resultado.filter(
        (item) => item.submoduloId === filtroSubmodulo
      );
    }

    setItemsFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroUsuario(null);
    setFiltroModulo(null);
    setFiltroSubmodulo(null);
  };

  const handleEdit = (rowData) => {
    if (permisos.puedeEditar || permisos.puedeVer) {
      setEditing(rowData);
      setDialogKey(prev => prev + 1); // Incrementar key para forzar re-render
      setShowDialog(true);
    }
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
      await deleteAccesosUsuario(toDelete.id);
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
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
   
    setLoading(true);
    try {
      if (editing && editing.id) {
        console.log('Llamando updateAccesosUsuario con ID:', editing.id, 'y data:', data);
        await updateAccesosUsuario(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        console.log('Llamando createAccesosUsuario con data:', data);
        await createAccesosUsuario(data);
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
      console.error('Error al guardar:', err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setDialogKey(prev => prev + 1); // Incrementar key para forzar re-render
    setShowDialog(true);
  };

  const actionBody = (rowData) => (
    <>
      {(permisos.puedeEditar || permisos.puedeVer) && (
        <Button
          icon="pi pi-eye"
          className="p-button-text p-button-sm"
          onClick={() => handleEdit(rowData)}
          aria-label={permisos.puedeEditar ? "Editar" : "Ver"}
        />
      )}
      {permisos.puedeEliminar && (
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
        value={itemsFiltrados}
        loading={loading}
        dataKey="id"
        size="small"
        showGridlines
        stripedRows
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} accesos"
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: (permisos.puedeEditar || permisos.puedeVer) ? "pointer" : "default", fontSize: getResponsiveFontSize() }}
        header={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Título y botón */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Gestión de Accesos de Usuario ({itemsFiltrados.length})
              </h2>
              {permisos.puedeCrear && (
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  outlined
                  onClick={handleAdd}
                  disabled={loading}
                />
              )}
            </div>

            {/* Filtros */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="filtroUsuario"
                  style={{
                    fontWeight: "bold",
                    marginBottom: 8,
                    display: "block",
                    fontSize: "0.9rem",
                  }}
                >
                  Usuario
                </label>
                <Dropdown
                  id="filtroUsuario"
                  value={filtroUsuario}
                  options={usuariosFiltrados.map((u) => ({
                    label: u.username,
                    value: u.id,
                  }))}
                  onChange={(e) => setFiltroUsuario(e.value)}
                  placeholder="Seleccione un usuario"
                  showClear
                  filter
                  style={{ width: "100%" }}
                  disabled={usuariosFiltrados.length === 0}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="filtroModulo"
                  style={{
                    fontWeight: "bold",
                    marginBottom: 8,
                    display: "block",
                    fontSize: "0.9rem",
                  }}
                >
                  Módulo
                </label>
                <Dropdown
                  id="filtroModulo"
                  value={filtroModulo}
                  options={modulosFiltrados.map((m) => ({
                    label: m.nombre,
                    value: m.id,
                  }))}
                  onChange={(e) => setFiltroModulo(e.value)}
                  placeholder={
                    filtroUsuario
                      ? "Seleccione un módulo"
                      : "Primero seleccione usuario"
                  }
                  showClear
                  filter
                  style={{ width: "100%" }}
                  disabled={!filtroUsuario || modulosFiltrados.length === 0}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="filtroSubmodulo"
                  style={{
                    fontWeight: "bold",
                    marginBottom: 8,
                    display: "block",
                    fontSize: "0.9rem",
                  }}
                >
                  Submódulo
                </label>
                <Dropdown
                  id="filtroSubmodulo"
                  value={filtroSubmodulo}
                  options={submodulosFiltrados.map((s) => ({
                    label: s.nombre,
                    value: s.id,
                  }))}
                  onChange={(e) => setFiltroSubmodulo(e.value)}
                  placeholder={
                    filtroUsuario
                      ? "Seleccione un submódulo"
                      : "Primero seleccione usuario"
                  }
                  showClear
                  filter
                  style={{ width: "100%" }}
                  disabled={!filtroUsuario || submodulosFiltrados.length === 0}
                />
              </div>

              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  onClick={limpiarFiltros}
                  outlined
                  style={{ width: "100%" }}
                  disabled={!filtroUsuario && !filtroModulo && !filtroSubmodulo}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          header="Usuario"
          sortable
          body={(rowData) => {
            const user = usuarios.find((u) => u.id === rowData.usuarioId);
            return user?.username || rowData.usuarioId;
          }}
        />
        <Column
          header="Módulo"
          sortable
          body={(rowData) => {
            const submodulo = submodulos.find(
              (s) => s.id === rowData.submoduloId
            );
            const modulo = modulos.find((m) => m.id === submodulo?.moduloId);
            return modulo?.nombre || "-";
          }}
        />
        <Column
          header="Submódulo"
          sortable
          body={(rowData) => {
            const submodulo = submodulos.find(
              (s) => s.id === rowData.submoduloId
            );
            return submodulo?.nombre || rowData.submoduloId;
          }}
        />
        <Column
          field="puedeVer"
          header="Ver"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.puedeVer ? '#d4edda' : '#f8d7da',
                color: rowData.puedeVer ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.puedeVer ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          field="puedeCrear"
          header="Crear"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.puedeCrear ? '#d4edda' : '#f8d7da',
                color: rowData.puedeCrear ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.puedeCrear ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          field="puedeEditar"
          header="Editar"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.puedeEditar ? '#d4edda' : '#f8d7da',
                color: rowData.puedeEditar ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.puedeEditar ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          field="puedeEliminar"
          header="Eliminar"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.puedeEliminar ? '#d4edda' : '#f8d7da',
                color: rowData.puedeEliminar ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.puedeEliminar ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          field="puedeAprobarDocs"
          header="Aprobar"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.puedeAprobarDocs ? '#d4edda' : '#f8d7da',
                color: rowData.puedeAprobarDocs ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.puedeAprobarDocs ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          field="puedeRechazarDocs"
          header="Rechazar"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.puedeRechazarDocs ? '#d4edda' : '#f8d7da',
                color: rowData.puedeRechazarDocs ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.puedeRechazarDocs ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          field="puedeReactivarDocs"
          header="Reactivar"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.puedeReactivarDocs ? '#d4edda' : '#f8d7da',
                color: rowData.puedeReactivarDocs ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.puedeReactivarDocs ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          field="activo"
          header="Activo"
          sortable
          body={(rowData) => (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: rowData.activo ? '#80ade5' : '#e87881',
                color: rowData.activo ? '#155724' : '#721c24',
                fontWeight: 'bold',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {rowData.activo ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>

      {showDialog && (
        <Dialog
          key={`dialog-${dialogKey}`}
          header={
            editing 
              ? (permisos.puedeEditar ? "Editar Acceso" : "Ver Acceso")
              : "Nuevo Acceso"
          }
          visible={true}
          style={{ width: 900 }}
          onHide={() => {
            setShowDialog(false);
            setEditing(null);
          }}
          modal
        >
          <AccesosUsuarioForm
            key={`form-${dialogKey}`}
            isEdit={!!editing}
            defaultValues={editing || {}}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowDialog(false)}
            loading={loading}
            readOnly={!permisos.puedeEditar}
          />
        </Dialog>
      )}
    </div>
  );
}