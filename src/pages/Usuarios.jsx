/**
 * Página Usuarios
 *
 * Módulo de gestión de usuarios del ERP Megui.
 * Protegido por autenticación y control de permisos.
 */
/**
 * Pantalla de Gestión de Usuarios
 *
 * Utiliza PrimeReact DataTable para mostrar la lista de usuarios del sistema.
 * Incluye botón para crear nuevo usuario y acciones de editar/eliminar.
 * Esta versión utiliza datos simulados (mock) para la tabla.
 *
 * Documentación profesional en español técnico.
 */
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { InputText } from "primereact/inputtext";
import { Avatar } from "primereact/avatar";
import UsuarioForm from "../components/usuarios/UsuarioForm";
import { usePermissions } from "../hooks/usePermissions";
import PermissionGuard from "../components/common/PermissionGuard";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../api/usuarios";
import { getEmpresas } from "../api/empresa";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional de gestión de usuarios del ERP Megui.
 * - CRUD completo con integración API REST.
 * - Tabla con filtros, búsqueda y paginación avanzada.
 * - Formularios desacoplados con validación profesional.
 * - Feedback visual con Toast y loaders.
 * Documentado en español técnico.
 */

/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible según permisos del usuario.
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 * - Control de permisos por submódulo usando usePermissions.
 */
export default function Usuarios({ ruta }) {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  
  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  
  const toast = useRef(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(7);
  const [globalFilter, setGlobalFilter] = useState("");
  
  const [empresas, setEmpresas] = useState([]);
  const [empresaFiltro, setEmpresaFiltro] = useState(null);

  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line
  }, [first, rows, globalFilter, empresaFiltro]);

  async function cargarEmpresas() {
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las empresas");
    }
  }

  async function cargarUsuarios() {
    setLoading(true);
    try {
      const params = { skip: first, take: rows, search: globalFilter };
      const data = await getUsuarios(params);
      let lista = Array.isArray(data) ? data : data.usuarios || [];
      
      if (empresaFiltro) {
        lista = lista.filter(u => u.empresaId === empresaFiltro);
      }
      
      setUsuarios(lista);
      setTotalRecords(lista.length);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    email: "",
    password: "",
    rol: "",
    estado: "Activo",
  });
  const [errores, setErrores] = useState({});

  const validar = () => {
    const errs = {};
    if (!form.nombre) errs.nombre = "El nombre es obligatorio";
    if (!form.usuario) errs.usuario = "El usuario es obligatorio";
    if (!form.email) errs.email = "El email es obligatorio";
    if (!form.password) errs.password = "La contraseña es obligatoria";
    if (!form.rol) errs.rol = "El rol es obligatorio";
    return errs;
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    const errs = validar();
    setErrores(errs);
    if (Object.keys(errs).length === 0) {
      setUsuarios([...usuarios, { ...form, id: usuarios.length + 1 }]);
      setMostrarDialogo(false);
      setForm({
        nombre: "",
        usuario: "",
        email: "",
        password: "",
        rol: "",
        estado: "Activo",
      });
      setErrores({});
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  function handleNuevo() {
    if (!empresaFiltro) {
      mostrarToast("warn", "Advertencia", "Debe seleccionar una empresa primero");
      return;
    }
    setModoEdicion(false);
    setUsuarioEdit(null);
    setDialogKey(prev => prev + 1);
    setMostrarDialogo(true);
  }

  function handleEditar(usuario) {
    setUsuarioEdit(usuario);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  const onRowClick = (e) => {
    // Permitir abrir el formulario si tiene permiso de ver o editar
    if (permisos.puedeEditar || permisos.puedeVer) {
      handleEditar(e.data);
    }
  };

  function handleEliminar(usuario) {
    setConfirmState({ visible: true, row: usuario });
  }

  const handleConfirmDelete = async () => {
    const usuarioRow = confirmState.row;
    if (!usuarioRow) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarUsuario(usuarioRow.id);
      mostrarToast(
        "success",
        "Usuario eliminado",
        `El usuario fue eliminado correctamente.`
      );
      cargarUsuarios();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo eliminar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  function accionesTemplate(rowData) {
    return (
      <span>
        <PermissionGuard ruta="usuarios" permiso="editar">
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-info"
            style={{ marginRight: 8 }}
            onClick={(e) => {
              e.stopPropagation();
              handleEditar(rowData);
            }}
            tooltip="Editar"
          />
        </PermissionGuard>
        <PermissionGuard ruta="usuarios" permiso="eliminar">
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              handleEliminar(rowData);
            }}
            tooltip="Eliminar usuario"
          />
        </PermissionGuard>
      </span>
    );
  }

  async function onSubmitForm(data) {
    
    setFormLoading(true);
    try {
      const usuarioPayload = {
        username: data.username,
        empresaId: Number(data.empresaId),
        personalId: data.personalId ? Number(data.personalId) : null,
        esSuperUsuario: !!data.esSuperUsuario,
        esAdmin: !!data.esAdmin,
        esUsuario: !!data.esUsuario,
        activo: !!data.activo,
        password: data.password,
      };
      
      
      if (modoEdicion && usuarioEdit) {
        
        const resultado = await actualizarUsuario(usuarioEdit.id, usuarioPayload);
        
        mostrarToast(
          "success",
          "Usuario actualizado",
          `El usuario ${data.username} fue actualizado correctamente.`
        );
      } else {
        await crearUsuario(usuarioPayload);
        mostrarToast(
          "success",
          "Usuario creado",
          `El usuario ${data.username} fue registrado correctamente.`
        );
      }
      
      setMostrarDialogo(false);
      await cargarUsuarios();
    } catch (err) {
      console.error('=== ERROR EN onSubmitForm ===');
      console.error('Error completo:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      
      // Extraer mensaje de error específico del backend
      const mensajeError = err?.response?.data?.error || err?.response?.data?.message || err.message || "No se pudo guardar el usuario.";
      
      mostrarToast("error", "Error", mensajeError);
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el usuario{" "}
            <b>
              {confirmState.row
                ? confirmState.row.personal
                  ? `${confirmState.row.personal.nombres} ${confirmState.row.personal.apellidos}`
                  : confirmState.row.username
                : ""}
            </b>
            ?<br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={<span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={usuarios}
        paginator
        rows={rows}
        first={first}
        totalRecords={totalRecords}
        loading={loading}
        onPage={(e) => {
          setFirst(e.first);
          setRows(e.rows);
        }}
        globalFilter={globalFilter}
        stripedRows
        emptyMessage="No hay usuarios registrados."
        header={
          <div className="flex align-items-center gap-2" style={{ flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
            <Dropdown
              value={empresaFiltro}
              options={empresas.map(e => ({ label: e.razonSocial || e.nombre, value: e.id }))}
              onChange={(e) => setEmpresaFiltro(e.value)}
              placeholder="Seleccione Empresa"
              showClear
              style={{ width: 250 }}
              filter
            />
            <PermissionGuard ruta="usuarios" permiso="crear">
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleNuevo}
                disabled={!empresaFiltro}
                tooltip={
                  !empresaFiltro 
                  ? "Debe seleccionar una empresa primero"
                  : ""
                }
                tooltipOptions={{ position: "bottom" }}
              />
            </PermissionGuard>
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar usuarios..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={onRowClick}
        style={{ cursor: (permisos.puedeEditar || permisos.puedeVer) ? "pointer" : "default", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" style={{ width: 70 }} />
        <Column 
          header="Empresa" 
          body={(rowData) => rowData.empresa?.razonSocial || rowData.empresa?.nombre || "Sin empresa"}
          style={{ minWidth: 150 }}
        />
        <Column field="username" header="Nombre de usuario" />
        <Column
          header="Foto"
          body={(rowData) => {
            const nombres = rowData.personal?.nombres || "";
            const apellidos = rowData.personal?.apellidos || "";
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            const urlFoto = rowData.personal?.urlFotoPersona
              ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${rowData.personal.urlFotoPersona}`
              : undefined;
            return (
              <span data-pr-tooltip={nombreCompleto} data-pr-position="right">
                <Avatar
                  image={urlFoto}
                  shape="circle"
                  size="large"
                  alt="Foto"
                  style={{ width: 36, height: 36 }}
                />
              </span>
            );
          }}
          style={{ minWidth: 80, textAlign: "center" }}
        />
        <Column
          header="Nombre completo"
          body={(rowData) =>
            rowData.personal
              ? `${rowData.personal.nombres} ${rowData.personal.apellidos}`
              : ""
          }
        />
        <Column
          header="Correo"
          body={(rowData) =>
            rowData.personal && rowData.personal.correo
              ? rowData.personal.correo
              : ""
          }
        />
        <Column
          header="Roles"
          body={(rowData) => (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {rowData.esSuperUsuario && (
                <span
                  style={{
                    backgroundColor: "#4caf50",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textAlign: "center",
                    display: "block"
                  }}
                >
                  SUPERUSUARIO
                </span>
              )}
              {rowData.esAdmin && (
                <span
                  style={{
                    backgroundColor: "#ff9800",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textAlign: "center",
                    display: "block"
                  }}
                >
                  ADMINISTRADOR
                </span>
              )}
              {rowData.esUsuario && (
                <span
                  style={{
                    backgroundColor: "#9e9e9e",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textAlign: "center",
                    display: "block"
                  }}
                >
                  USUARIO
                </span>
              )}
            </div>
          )}
          style={{ minWidth: 130, textAlign: "center" }}
        />
        <Column
          field="activo"
          header="Estado"
          body={(rowData) => (
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                fontWeight: "bold",
                backgroundColor: rowData.activo ? "#c8e6c9" : "#ffcdd2",
                color: rowData.activo ? "#2e7d32" : "#c62828",
              }}
            >
              {rowData.activo ? "Activo" : "Inactivo"}
            </span>
          )}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ minWidth: 150, textAlign: "center" }}
        />
      </DataTable>
      {mostrarDialogo && (
        <Dialog
          header={
            modoEdicion 
              ? (permisos.puedeEditar ? "Editar Usuario" : "Ver Usuario")
              : "Nuevo Usuario"
          }
          visible={true}
          style={{ width: 1300 }}
          modal
          onHide={() => {
            setMostrarDialogo(false);
            setUsuarioEdit(null);
          }}
        >
          <UsuarioForm
            isEdit={modoEdicion}
            defaultValues={
              !modoEdicion ? {
                username: "",
                password: "",
                empresaId: empresaFiltro,
                personalId: null,
                esSuperUsuario: false,
                esAdmin: false,
                esUsuario: true,
                activo: true,
              } : usuarioEdit
            }
            onSubmit={onSubmitForm}
            onCancel={() => setMostrarDialogo(false)}
            loading={formLoading}
            readOnly={!permisos.puedeEditar}
            puedeCrear={permisos.puedeCrear}
          />
        </Dialog>
      )}
    </div>
  );
}