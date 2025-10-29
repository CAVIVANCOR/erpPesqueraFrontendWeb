/**
 * Página Usuarios
 *
 * Módulo de gestión de usuarios del ERP Megui.
 * Protegido por autenticación.
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
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { InputText } from "primereact/inputtext";
import { Avatar } from "primereact/avatar"; // Importación necesaria para mostrar avatares profesionales
import UsuarioForm from "../components/usuarios/UsuarioForm";
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
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin).
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 */
export default function Usuarios() {
  const usuario = useAuthStore((state) => state.usuario);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  // Referencia para Toast de notificaciones
  const toast = useRef(null);

  // Estado para la lista de usuarios
  const [usuarios, setUsuarios] = useState([]);
  // Estado para loading global de la tabla
  const [loading, setLoading] = useState(false);
  // Estado para paginación y filtros
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(7);
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Estado para filtro de empresa
  const [empresas, setEmpresas] = useState([]);
  const [empresaFiltro, setEmpresaFiltro] = useState(null);

  // Estado para modal de alta/edición
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [dialogKey, setDialogKey] = useState(0); // Contador para forzar re-render

  // Carga inicial de empresas
  useEffect(() => {
    cargarEmpresas();
  }, []);

  // Carga inicial y búsqueda/paginación
  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line
  }, [first, rows, globalFilter, empresaFiltro]);

  // Función para cargar empresas
  async function cargarEmpresas() {
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las empresas");
    }
  }

  // Función para cargar usuarios del backend
  async function cargarUsuarios() {
    setLoading(true);
    try {
      const params = { skip: first, take: rows, search: globalFilter };
      const data = await getUsuarios(params);
      // Soporte para respuesta tipo array o tipo objeto
      let lista = Array.isArray(data) ? data : data.usuarios || [];
      
      // Filtrar por empresa si hay filtro activo
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

  // Muestra notificación Toast
  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  // Estado para el formulario de nuevo usuario
  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    email: "",
    password: "",
    rol: "",
    estado: "Activo",
  });
  const [errores, setErrores] = useState({});

  // Validación simple (puedes luego migrar a Yup)
  const validar = () => {
    const errs = {};
    if (!form.nombre) errs.nombre = "El nombre es obligatorio";
    if (!form.usuario) errs.usuario = "El usuario es obligatorio";
    if (!form.email) errs.email = "El email es obligatorio";
    if (!form.password) errs.password = "La contraseña es obligatoria";
    if (!form.rol) errs.rol = "El rol es obligatorio";
    return errs;
  };

  // Maneja el submit del formulario
  const handleGuardar = (e) => {
    e.preventDefault();
    const errs = validar();
    setErrores(errs);
    if (Object.keys(errs).length === 0) {
      // Agrega el usuario a la tabla mock
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

  // Maneja cambios en los campos del formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Abre el diálogo para crear un nuevo usuario
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

  // Acción: abrir modal para editar usuario
  function handleEditar(usuario) {
    setUsuarioEdit(usuario);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  // Acción: eliminar usuario
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

  // Renderiza los botones de acción en cada fila
  function accionesTemplate(rowData) {
    return (
      <span>
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
        {usuario?.esSuperUsuario && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              handleEliminar(rowData);
            }}
            tooltip="Eliminar usuario"
          />
        )}
      </span>
    );
  }

  // Submit del formulario (alta o edición)
  async function onSubmitForm(data) {
    setFormLoading(true);
    try {
      // Construye el payload limpio solo con los campos válidos para el backend
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
        await actualizarUsuario(usuarioEdit.id, usuarioPayload);
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
      cargarUsuarios();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo guardar el usuario.");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      {/* Tabla de usuarios con PrimeReact DataTable */}
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
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              onClick={handleNuevo}
              disabled={!usuario?.esSuperUsuario || !empresaFiltro}
              tooltip={
                !usuario?.esSuperUsuario 
                  ? "Solo Superusuarios pueden crear usuarios" 
                  : !empresaFiltro 
                  ? "Debe seleccionar una empresa primero"
                  : ""
              }
              tooltipOptions={{ position: "bottom" }}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar usuarios..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={onRowClick}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" style={{ width: 70 }} />
        <Column 
          header="Empresa" 
          body={(rowData) => rowData.empresa?.razonSocial || rowData.empresa?.nombre || "Sin empresa"}
          style={{ minWidth: 150 }}
        />
        <Column field="username" header="Nombre de usuario" />

        {/* Columna: Avatar profesional del personal relacionado (foto o iniciales) */}
        <Column
          header="Foto"
          body={(rowData) => {
            const nombres = rowData.personal?.nombres || "";
            const apellidos = rowData.personal?.apellidos || "";
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            const urlFoto = rowData.personal?.urlFotoPersona
              ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${
                  rowData.personal.urlFotoPersona
                }`
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
        {/* Columna: Nombre completo del personal relacionado */}
        <Column
          header="Nombre completo"
          body={(rowData) =>
            rowData.personal
              ? `${rowData.personal.nombres} ${rowData.personal.apellidos}`
              : ""
          }
        />
        {/* Columnas alineadas con los campos reales del backend */}
        {/* Columna: Correo electrónico del personal relacionado */}
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
      {/* Dialogo de alta/edición de usuario */}
      {mostrarDialogo && (
        <Dialog
          header={modoEdicion ? "Editar Usuario" : "Nuevo Usuario"}
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
          />
        </Dialog>
      )}
    </div>
  );
}
