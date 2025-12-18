// src/components/usuarios/DetListaAccesosAModulosUsuario.jsx
// Componente profesional para gestionar accesos de usuario a módulos y submódulos.
// Permite edición en línea de permisos y agregar todos los módulos automáticamente.
// Cumple SRP y está desacoplado para integración en UsuarioForm.

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { getModulos } from "../../api/moduloSistema";
import { getSubmodulos } from "../../api/submoduloSistema";
import {
  asignarAccesosEnLote,
  getAccesosPorUsuario,
  eliminarAccesosUsuario,
} from "../../api/accesosUsuario";
import { getResponsiveFontSize } from "../../utils/utils";

/**
 * Componente de detalle de accesos a módulos para un usuario.
 * @param {Object} props
 * @param {Array} props.accesos - Array de accesos actuales del usuario
 * @param {function} props.onChange - Callback cuando cambian los accesos
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {boolean} props.esSuperUsuario - Si el usuario es superusuario
 * @param {boolean} props.esAdmin - Si el usuario es administrador
 * @param {boolean} props.esUsuario - Si el usuario es usuario estándar
 * @param {number} props.usuarioId - ID del usuario (requerido para guardar en BD)
 */
export default function DetListaAccesosAModulosUsuario({
  accesos = [],
  onChange,
  disabled = false,
  esSuperUsuario = false,
  esAdmin = false,
  esUsuario = false,
  usuarioId = null,
  puedeCrear = false,
}) {
  const toast = useRef(null);
  const [accesosInternos, setAccesosInternos] = useState(accesos); // Inicializar con prop
  const [modulos, setModulos] = useState([]);
  const [submodulos, setSubmodulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false);

  // Estados para filtros
  const [filtroModulo, setFiltroModulo] = useState(null);
  const [filtroSubmodulo, setFiltroSubmodulo] = useState(null);
  const [filtroActivos, setFiltroActivos] = useState(null); // null=todos, true=activos, false=inactivos
  const [filtroAccesos, setFiltroAccesos] = useState(null); // null=todos, 'sin'=sin accesos, 'con'=con accesos
  const [accesosFiltrados, setAccesosFiltrados] = useState([]);
  const [renderKey, setRenderKey] = useState(0); // Key para forzar re-render del DataTable
  const [paginatorRows, setPaginatorRows] = useState(5); // Filas por página
  const [paginatorFirst, setPaginatorFirst] = useState(0); // Primera fila visible

  // Cargar módulos y submódulos al montar
  useEffect(() => {
    cargarDatos();
    setPaginatorRows(5);
    setPaginatorFirst(0);
  }, []);

  // Cargar accesos desde BD cuando hay usuarioId
  useEffect(() => {
    if (usuarioId) {
      cargarAccesosDesdeDB();
    }
  }, [usuarioId]);

  // ELIMINADO: useEffect que sobrescribía cambios locales
  // El estado se inicializa con la prop y luego se maneja internamente

  // Aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [
    accesosInternos,
    filtroModulo,
    filtroSubmodulo,
    filtroActivos,
    filtroAccesos,
  ]);

  /**
   * Aplica todos los filtros activos a la lista de accesos
   */
  const aplicarFiltros = () => {
    let resultado = [...accesosInternos];

    // Filtro por módulo
    if (filtroModulo) {
      resultado = resultado.filter((acceso) => {
        const submodulo = submodulos.find((s) => s.id === acceso.submoduloId);
        return submodulo?.moduloId === filtroModulo;
      });
    }

    // Filtro por submódulo
    if (filtroSubmodulo) {
      resultado = resultado.filter(
        (acceso) => acceso.submoduloId === filtroSubmodulo
      );
    }

    // Filtro por activos/inactivos
    if (filtroActivos !== null) {
      resultado = resultado.filter((acceso) => acceso.activo === filtroActivos);
    }

    // Filtro por accesos (sin/con permisos)
    if (filtroAccesos === "sin") {
      resultado = resultado.filter(
        (acceso) =>
          !acceso.puedeVer &&
          !acceso.puedeCrear &&
          !acceso.puedeEditar &&
          !acceso.puedeEliminar &&
          !acceso.puedeAprobarDocs &&
          !acceso.puedeRechazarDocs &&
          !acceso.puedeReactivarDocs
      );
    } else if (filtroAccesos === "con") {
      resultado = resultado.filter(
        (acceso) =>
          acceso.puedeVer ||
          acceso.puedeCrear ||
          acceso.puedeEditar ||
          acceso.puedeEliminar ||
          acceso.puedeAprobarDocs ||
          acceso.puedeRechazarDocs ||
          acceso.puedeReactivarDocs
      );
    }

    setAccesosFiltrados(resultado);
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    setFiltroModulo(null);
    setFiltroSubmodulo(null);
    setFiltroActivos(null);
    setFiltroAccesos(null);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [modulosData, submodulosData] = await Promise.all([
        getModulos(),
        getSubmodulos(),
      ]);
      setModulos(modulosData);
      setSubmodulos(submodulosData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los módulos y submódulos",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga los accesos del usuario desde la base de datos
   */
  const cargarAccesosDesdeDB = async () => {
    if (!usuarioId) return;

    setLoading(true);
    try {
      const accesosDB = await getAccesosPorUsuario(usuarioId);
      setAccesosInternos(accesosDB);
      if (onChange) {
        onChange(accesosDB);
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los accesos del usuario",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Agrega todos los submódulos de todos los módulos con permisos por defecto.
   * Si es superusuario, todos los permisos se marcan como true.
   * Inteligente: Solo agrega los faltantes, RESPETA Y MANTIENE los existentes sin alterarlos.
   * GUARDA DIRECTAMENTE EN LA BASE DE DATOS.
   */
  const agregarTodosLosModulos = async () => {
    if (!usuarioId) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se puede agregar accesos sin un usuario válido",
      });
      return;
    }

    setLoading(true);
    try {
      // IDs de submódulos actuales en el catálogo
      const idsSubmodulosActuales = submodulos.map((s) => s.id);

      // Filtrar accesos existentes que aún estén en el catálogo SIN MODIFICARLOS
      const accesosExistentesValidos = accesosInternos
        .filter((acceso) => idsSubmodulosActuales.includes(acceso.submoduloId));

      // IDs de submódulos que ya tienen acceso
      const idsConAcceso = accesosExistentesValidos.map((a) => a.submoduloId);

      // Submódulos que faltan (no tienen acceso aún)
      const submodulosFaltantes = submodulos.filter(
        (s) => !idsConAcceso.includes(s.id)
      );

      // Crear accesos para los faltantes según el rol
      const nuevosAccesos = submodulosFaltantes.map((submodulo) => {
        if (esSuperUsuario) {
          // Superusuario: TODOS los permisos
          return {
            submoduloId: submodulo.id,
            submodulo: submodulo,
            puedeVer: true,
            puedeCrear: true,
            puedeEditar: true,
            puedeEliminar: true,
            puedeReactivarDocs: true,
            puedeAprobarDocs: true,
            puedeRechazarDocs: true,
            activo: true,
            _esNuevo: true,
          };
        } else if (esAdmin) {
          // Administrador: Ver, Crear, Editar, Aprobar, Rechazar, Reactivar
          return {
            submoduloId: submodulo.id,
            submodulo: submodulo,
            puedeVer: true,
            puedeCrear: true,
            puedeEditar: true,
            puedeEliminar: false,
            puedeReactivarDocs: true,
            puedeAprobarDocs: true,
            puedeRechazarDocs: true,
            activo: true,
            _esNuevo: true,
          };
        } else {
          // Usuario estándar: Sin permisos
          return {
            submoduloId: submodulo.id,
            submodulo: submodulo,
            puedeVer: false,
            puedeCrear: false,
            puedeEditar: false,
            puedeEliminar: false,
            puedeReactivarDocs: false,
            puedeAprobarDocs: false,
            puedeRechazarDocs: false,
            activo: true,
            _esNuevo: true,
          };
        }
      });

      // Combinar accesos existentes válidos + nuevos accesos
      const accesosCombinados = [...accesosExistentesValidos, ...nuevosAccesos];

      setAccesosInternos(accesosCombinados);
      onChange(accesosCombinados);

      // Mensajes informativos
      const eliminados =
        accesosInternos.length - accesosExistentesValidos.length;
      const mantenidos = accesosExistentesValidos.length;
      let mensaje = "";

      if (nuevosAccesos.length > 0 && eliminados > 0) {
        mensaje = `Se agregaron ${nuevosAccesos.length} nuevos módulos, se mantuvieron ${mantenidos} existentes y se eliminaron ${eliminados} obsoletos`;
      } else if (nuevosAccesos.length > 0) {
        if (esSuperUsuario) {
          mensaje = `Se agregaron ${nuevosAccesos.length} nuevos módulos con TODOS los permisos (Superusuario). Se respetaron ${mantenidos} módulos existentes`;
        } else if (esAdmin) {
          mensaje = `Se agregaron ${nuevosAccesos.length} nuevos módulos con permisos de Administrador. Se respetaron ${mantenidos} módulos existentes`;
        } else {
          mensaje = `Se agregaron ${nuevosAccesos.length} nuevos módulos sin permisos (Usuario estándar). Se respetaron ${mantenidos} módulos existentes`;
        }
      } else if (eliminados > 0) {
        mensaje = `Se mantuvieron ${mantenidos} módulos existentes y se eliminaron ${eliminados} accesos obsoletos`;
      } else {
        mensaje = `Todos los módulos ya estaban asignados. Se mantuvieron ${mantenidos} módulos existentes sin cambios`;
      }

      // GUARDAR EN BASE DE DATOS
      // Enviar accesos con permisos personalizados a asignarAccesosEnLote
      const accesosConPermisos = accesosCombinados
        .filter(acceso => acceso.submoduloId != null && acceso.submoduloId !== '' && !isNaN(Number(acceso.submoduloId)))
        .map(acceso => ({
          submoduloId: Number(acceso.submoduloId), // Asegurar que sea número
          permisos: {
            puedeVer: !!acceso.puedeVer,
            puedeCrear: !!acceso.puedeCrear,
            puedeEditar: !!acceso.puedeEditar,
            puedeEliminar: !!acceso.puedeEliminar,
            puedeReactivarDocs: !!acceso.puedeReactivarDocs,
            puedeAprobarDocs: !!acceso.puedeAprobarDocs,
            puedeRechazarDocs: !!acceso.puedeRechazarDocs,
            activo: acceso.activo !== false,
          }
        }));
      
      if (accesosConPermisos.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No hay accesos válidos para guardar",
        });
        return;
      }
      
      await asignarAccesosEnLote(usuarioId, accesosConPermisos);

      toast.current?.show({
        severity:
          nuevosAccesos.length > 0 || eliminados > 0 ? "success" : "info",
        summary:
          nuevosAccesos.length > 0 || eliminados > 0 ? "Éxito" : "Información",
        detail: mensaje + " - Permisos actualizados",
      });

      // NO recargar desde BD, mantener los valores actualizados en memoria
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron guardar los accesos en la base de datos",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirma si desea agregar todos los módulos
   */
  const confirmarAgregarTodos = () => {
    setShowConfirm(true);
  };

  /**
   * Confirma si desea eliminar todos los permisos
   */
  const confirmarEliminarTodos = () => {
    if (accesosInternos.length === 0) {
      toast.current?.show({
        severity: "info",
        summary: "Información",
        detail: "No hay permisos para eliminar",
      });
      return;
    }
    setShowConfirmEliminar(true);
  };

  /**
   * Elimina todos los permisos del usuario.
   * GUARDA DIRECTAMENTE EN LA BASE DE DATOS.
   */
  const eliminarTodosLosPermisos = async () => {
    if (!usuarioId) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se puede eliminar permisos sin un usuario válido",
      });
      return;
    }

    setLoading(true);
    try {
      // Eliminar físicamente todos los accesos del usuario
      // Eliminar uno por uno usando el ID específico de cada acceso
      for (const acceso of accesosInternos) {
        if (acceso && acceso.id) {
          await eliminarAccesosUsuario(acceso.id);
        }
      }
      
      // Actualizar estado local
      setAccesosInternos([]);
      if (onChange) onChange([]);
      
      // Recargar desde BD para confirmar
      await cargarAccesosDesdeDB();
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Todos los permisos fueron eliminados correctamente",
      });
    } catch (err) {
      console.error('Error al eliminar permisos:', err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron eliminar los permisos",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina un acceso de la lista
   */
  const eliminarAcceso = (rowData) => {
    const nuevosAccesos = accesosInternos.filter(
      (a) => a.submoduloId !== rowData.submoduloId
    );
    setAccesosInternos(nuevosAccesos);
    onChange(nuevosAccesos);

    toast.current?.show({
      severity: "info",
      summary: "Eliminado",
      detail: "Acceso eliminado",
    });
  };

  /**
   * Actualiza un campo de un acceso específico
   * OPTIMISTIC UPDATE: Actualiza UI inmediatamente, guarda en BD, revierte si falla
   */
  const actualizarCampo = async (rowData, campo, valor) => {
    if (!usuarioId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se puede guardar sin un usuario válido",
      });
      return;
    }

    // 1. GUARDAR ESTADO ANTERIOR para poder revertir si falla
    const estadoAnterior = [...accesosInternos];
    const estadoFiltradoAnterior = [...accesosFiltrados];

    // 2. ACTUALIZAR UI INMEDIATAMENTE (optimistic update)
    // CREAR NUEVOS OBJETOS para forzar re-render
    const nuevosAccesos = accesosInternos.map((acceso) => {
      if (acceso.submoduloId === rowData.submoduloId) {
        return { ...acceso, [campo]: valor };
      }
      return { ...acceso }; // NUEVO objeto para forzar detección
    });
    
    // Actualizar también los filtrados inmediatamente
    const nuevosFiltrados = accesosFiltrados.map((acceso) => {
      if (acceso.submoduloId === rowData.submoduloId) {
        return { ...acceso, [campo]: valor };
      }
      return { ...acceso }; // NUEVO objeto para forzar detección
    });
    
    
    setAccesosInternos([...nuevosAccesos]);
    setAccesosFiltrados([...nuevosFiltrados]);
    setRenderKey(prev => prev + 1); // Forzar re-render del DataTable
    onChange([...nuevosAccesos]);

    try {
      // 3. GUARDAR EN BASE DE DATOS
      const accesoActualizado = {
        ...rowData,
        [campo]: valor,
      };

      await asignarAccesosEnLote(usuarioId, [
        {
          submoduloId: Number(accesoActualizado.submoduloId),
          permisos: {
            puedeVer: !!accesoActualizado.puedeVer,
            puedeCrear: !!accesoActualizado.puedeCrear,
            puedeEditar: !!accesoActualizado.puedeEditar,
            puedeEliminar: !!accesoActualizado.puedeEliminar,
            puedeReactivarDocs: !!accesoActualizado.puedeReactivarDocs,
            puedeAprobarDocs: !!accesoActualizado.puedeAprobarDocs,
            puedeRechazarDocs: !!accesoActualizado.puedeRechazarDocs,
            activo: accesoActualizado.activo !== false,
          },
        },
      ]);


      // 4. Notificar éxito
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Permiso actualizado y guardado en BD`,
        life: 2000,
      });

    } catch (error) {
      // 5. SI FALLA, REVERTIR AL ESTADO ANTERIOR
      console.error('❌ Error al guardar en BD, revirtiendo cambios...');
      setAccesosInternos(estadoAnterior);
      setAccesosFiltrados(estadoFiltradoAnterior);
      onChange(estadoAnterior);
      
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo guardar en la base de datos",
        life: 4000,
      });
    }
  };

  // Templates para columnas editables
  const checkboxEditor = (rowData, campo) => (
    <Checkbox
      checked={rowData[campo]}
      onChange={(e) => actualizarCampo(rowData, campo, e.checked)}
      disabled={disabled}
    />
  );

  const moduloBody = (rowData) => {
    // Primero intentar usar la relación que viene de BD
    if (rowData.submodulo?.modulo?.nombre) {
      return rowData.submodulo.modulo.nombre;
    }
    // Fallback: buscar en los arrays cargados (para accesos nuevos no guardados)
    const submodulo = submodulos.find((s) => s.id === rowData.submoduloId);
    const modulo = modulos.find((m) => m.id === submodulo?.moduloId);
    return modulo?.nombre || "-";
  };

  const submoduloBody = (rowData) => {
    // Primero intentar usar la relación que viene de BD
    if (rowData.submodulo?.nombre) {
      return rowData.submodulo.nombre;
    }
    // Fallback: buscar en los arrays cargados (para accesos nuevos no guardados)
    const submodulo = submodulos.find((s) => s.id === rowData.submoduloId);
    return submodulo?.nombre || "-";
  };

  const iconoBody = (rowData) => {
    // Primero intentar usar la relación que viene de BD
    if (rowData.submodulo?.icono) {
      return <i className={rowData.submodulo.icono} />;
    }
    // Fallback: buscar en los arrays cargados (para accesos nuevos no guardados)
    const submodulo = submodulos.find((s) => s.id === rowData.submoduloId);
    return submodulo?.icono ? <i className={submodulo.icono} /> : null;
  };

  const actionBody = (rowData) => (
    <Button
      icon="pi pi-trash"
      className="p-button-text p-button-danger p-button-sm"
      onClick={() => eliminarAcceso(rowData)}
      disabled={disabled}
      aria-label="Eliminar"
    />
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea agregar TODOS los submódulos del sistema? Esto reemplazará los accesos actuales."
        header="Confirmar acción"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-warning"
        accept={agregarTodosLosModulos}
        reject={() => setShowConfirm(false)}
        acceptLabel="Sí, agregar todos"
        rejectLabel="Cancelar"
      />
      <ConfirmDialog
        visible={showConfirmEliminar}
        onHide={() => setShowConfirmEliminar(false)}
        message="¿Está seguro de eliminar TODOS los permisos del usuario? Esta acción no se puede deshacer."
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={() => {
          eliminarTodosLosPermisos();
          setShowConfirmEliminar(false);
        }}
        reject={() => setShowConfirmEliminar(false)}
        acceptLabel="Sí, eliminar todos"
        rejectLabel="Cancelar"
      />
      <DataTable
        key={renderKey}
        value={accesosFiltrados}
        loading={loading}
        dataKey="submoduloId"
        emptyMessage="No hay accesos asignados. Use el botón 'Agregar Todos los Módulos' para comenzar."
        scrollable
        size="small"
        showGridlines
        stripedRows
        style={{ fontSize: getResponsiveFontSize() }}
        paginator
        rows={paginatorRows}
        first={paginatorFirst}
        onPage={(e) => {
          setPaginatorRows(e.rows);
          setPaginatorFirst(e.first);
        }}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} accesos"
        stateStorage="session"
        stateKey={`dt-accesos-usuario-${usuarioId}`}
        sortField="id"
        sortOrder={-1}
        header={
          <div>
            {/* Título y botón agregar */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                marginBottom: 10,
                padding: "5px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "2px solid #dee2e6",
              }}
            >
              <div style={{ flex: 2 }}>
                <h3>
                  Accesos a Módulos ({accesosFiltrados.length} de{" "}
                  {accesosInternos.length})
                </h3>
              </div>
              {puedeCrear && (
                <>
                  <div style={{ flex: 1 }}>
                    <Button
                      type="button"
                      label="Agregar Todos los Módulos"
                      icon="pi pi-plus-circle"
                      className="p-button-warning p-button-sm"
                      onClick={confirmarAgregarTodos}
                      disabled={loading}
                      outlined
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Button
                      type="button"
                      label="Eliminar Todos los Permisos"
                      icon="pi pi-trash"
                      className="p-button-danger p-button-sm"
                      onClick={confirmarEliminarTodos}
                      disabled={loading || accesosInternos.length === 0}
                      outlined
                    />
                  </div>
                </>
              )}
            </div>

            {/* Panel de filtros */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                padding: "10px",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                marginBottom: 10,
                alignItems: "end",
              }}
            >
              {/* Filtro por Módulo */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Módulo
                </label>
                <Dropdown
                  value={filtroModulo}
                  options={[
                    { label: "Todos", value: null },
                    ...modulos.map((m) => ({ label: m.nombre, value: m.id })),
                  ]}
                  onChange={(e) => setFiltroModulo(e.value)}
                  placeholder="Todos los módulos"
                  style={{ width: "100%", fontSize: "12px" }}
                  filter
                  showClear
                />
              </div>

              {/* Filtro por Submódulo */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Submódulo
                </label>
                <Dropdown
                  value={filtroSubmodulo}
                  options={[
                    { label: "Todos", value: null },
                    ...submodulos
                      .filter(
                        (s) => !filtroModulo || s.moduloId === filtroModulo
                      )
                      .map((s) => ({ label: s.nombre, value: s.id })),
                  ]}
                  onChange={(e) => setFiltroSubmodulo(e.value)}
                  placeholder="Todos los submódulos"
                  style={{ width: "100%", fontSize: "12px" }}
                  showClear
                  filter
                />
              </div>
              {/* Filtro Accesos */}
              <div style={{ flex: "0 1 auto" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Permisos
                </label>
                <Button
                  type="button"
                  label={
                    filtroAccesos === "sin"
                      ? "SIN ACCESOS"
                      : filtroAccesos === "con"
                      ? "CON ACCESOS"
                      : "TODOS"
                  }
                  icon={
                    filtroAccesos === "sin"
                      ? "pi pi-ban"
                      : filtroAccesos === "con"
                      ? "pi pi-check-circle"
                      : "pi pi-filter"
                  }
                  className={
                    filtroAccesos === "sin"
                      ? "p-button-danger"
                      : filtroAccesos === "con"
                      ? "p-button-success"
                      : "p-button-secondary"
                  }
                  severity={
                    filtroAccesos === "sin"
                      ? "danger"
                      : filtroAccesos === "con"
                      ? "success"
                      : "secondary"
                  }
                  onClick={() => {
                    if (filtroAccesos === null) setFiltroAccesos("con");
                    else if (filtroAccesos === "con") setFiltroAccesos("sin");
                    else setFiltroAccesos(null);
                  }}
                  raised
                />
              </div>
              {/* Filtro Activos */}
              <div style={{ flex: "0 1 auto" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Estado
                </label>
                <Button
                  type="button"
                  label={
                    filtroActivos === true
                      ? "ACTIVOS"
                      : filtroActivos === false
                      ? "INACTIVOS"
                      : "TODOS"
                  }
                  icon={
                    filtroActivos === true
                      ? "pi pi-check"
                      : filtroActivos === false
                      ? "pi pi-times"
                      : "pi pi-filter"
                  }
                  className={
                    filtroActivos === true
                      ? "p-button-success"
                      : filtroActivos === false
                      ? "p-button-danger"
                      : "p-button-secondary"
                  }
                  severity={
                    filtroActivos === true
                      ? "success"
                      : filtroActivos === false
                      ? "danger"
                      : "secondary"
                  }
                  onClick={() => {
                    if (filtroActivos === null) setFiltroActivos(true);
                    else if (filtroActivos === true) setFiltroActivos(false);
                    else setFiltroActivos(null);
                  }}
                  raised
                />
              </div>

              {/* Botón Limpiar */}
              <div
                style={{
                  flex: "0 1 auto",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <Button
                  type="button"
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  onClick={limpiarFiltros}
                  outlined
                  raised
                />
              </div>
            </div>
          </div>
        }
      >
        <Column
          field="id"
          header="ID"
          body={(rowData) => rowData.id || '-'}
          style={{ width: "80px", textAlign: "center" }}
          sortable
        />
        <Column
          header="Módulo"
          body={moduloBody}
          style={{ minWidth: "150px" }}
          sortable
        />
        <Column
          header=""
          body={iconoBody}
          style={{ width: "40px", textAlign: "center" }}
        />
        <Column
          header="Submódulo"
          body={submoduloBody}
          style={{ minWidth: "200px" }}
          sortable
        />
        <Column
          header="Ver"
          body={(rowData) => checkboxEditor(rowData, "puedeVer")}
          style={{ width: "80px", textAlign: "center" }}
        />
        <Column
          header="Crear"
          body={(rowData) => checkboxEditor(rowData, "puedeCrear")}
          style={{ width: "80px", textAlign: "center" }}
        />
        <Column
          header="Editar"
          body={(rowData) => checkboxEditor(rowData, "puedeEditar")}
          style={{ width: "80px", textAlign: "center" }}
        />
        <Column
          header="Eliminar"
          body={(rowData) => checkboxEditor(rowData, "puedeEliminar")}
          style={{ width: "90px", textAlign: "center" }}
        />
        <Column
          header="Aprobar"
          body={(rowData) => checkboxEditor(rowData, "puedeAprobarDocs")}
          style={{ width: "90px", textAlign: "center" }}
        />
        <Column
          header="Rechazar"
          body={(rowData) => checkboxEditor(rowData, "puedeRechazarDocs")}
          style={{ width: "95px", textAlign: "center" }}
        />
        <Column
          header="Reactivar"
          body={(rowData) => checkboxEditor(rowData, "puedeReactivarDocs")}
          style={{ width: "95px", textAlign: "center" }}
        />
        <Column
          header="Activo"
          body={(rowData) => checkboxEditor(rowData, "activo")}
          style={{ width: "80px", textAlign: "center" }}
        />
        <Column
          body={actionBody}
          header=""
          style={{ width: "60px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
