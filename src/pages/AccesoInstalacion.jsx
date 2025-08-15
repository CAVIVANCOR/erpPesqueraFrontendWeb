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
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import AccesoInstalacionForm from "../components/accesoInstalacion/AccesoInstalacionForm";
import SalidaDialog from "../components/accesoInstalacion/SalidaDialog";
import {
  getAllAccesoInstalacion,
  crearAccesoInstalacion,
  actualizarAccesoInstalacion,
  eliminarAccesoInstalacion,
} from "../api/accesoInstalacion";
import { getEmpresas } from "../api/empresa";
import { getSedes } from "../api/sedes";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { FcDocument, FcDisclaimer } from "react-icons/fc";
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
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);

  // Estados globales para Empresa y Sede (filtrado y creación)
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [sedesFiltradas, setSedesFiltradas] = useState([]);
  const [showSalidaDialog, setShowSalidaDialog] = useState(false);

  // Estado para filtro de estado de visitantes
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Estado para personal (persona destino)
  const [personal, setPersonal] = useState([]);

  // Opciones para el filtro de estado
  const opcionesEstado = [
    { label: "🔴 Solo Dentro", value: "dentro" },
    { label: "✅ Solo Salieron", value: "fuera" },
    { label: "👥 Todos", value: "todos" },
  ];

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

  // Cargar datos iniciales (empresas, sedes, personal y items)
  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Cargar empresas
      const empresasData = await getEmpresas();
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

      // Cargar personal para persona destino
      const personalData = await getPersonal();
      if (personalData && Array.isArray(personalData)) {
        setPersonal(
          personalData.map((p) => ({
            ...p,
            id: Number(p.id),
            empresaId: Number(p.empresaId),
          }))
        );
      }

      // Cargar items
      await cargarItems();
    } catch (err) {
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

  // Efecto para recargar datos cuando cambien los filtros
  useEffect(() => {
    // Solo recargar si ya se han cargado los datos iniciales
    if (empresas.length > 0 && sedes.length > 0) {
      cargarItems(
        empresaSeleccionada,
        sedeSeleccionada,
        fechaDesde,
        fechaHasta,
        filtroEstado
      );
    }
  }, [
    empresaSeleccionada,
    sedeSeleccionada,
    fechaDesde,
    fechaHasta,
    filtroEstado,
    empresas.length,
    sedes.length,
  ]);

  const cargarItems = async (
    filtroEmpresa = null,
    filtroSede = null,
    filtroFechaDesde = null,
    filtroFechaHasta = null,
    filtroEstadoParam = null
  ) => {
    setLoading(true);
    try {
      let data = await getAllAccesoInstalacion();

      // Verificar que data sea un array válido
      if (!data || !Array.isArray(data)) {
        setItems([]);
        return;
      }

      // Ordenar por fecha más reciente primero (fechaHora descendente)
      data = data.sort((a, b) => {
        const fechaA = new Date(a.fechaHora || a.createdAt);
        const fechaB = new Date(b.fechaHora || b.createdAt);
        return fechaB - fechaA; // Orden descendente (más reciente primero)
      });

      // Aplicar filtros por empresa y sede si están seleccionados
      // Usar los parámetros pasados o los estados actuales
      const empresaFiltro = filtroEmpresa || empresaSeleccionada;
      const sedeFiltro = filtroSede || sedeSeleccionada;
      const fechaDesdeFiltro = filtroFechaDesde || fechaDesde;
      const fechaHastaFiltro = filtroFechaHasta || fechaHasta;
      const estadoFiltro = filtroEstadoParam || filtroEstado;

      // Regla ERP Megui: Comparación de IDs siempre numérica
      if (empresaFiltro) {
        data = data.filter(
          (item) => Number(item.empresaId) === Number(empresaFiltro)
        );
      }

      if (sedeFiltro) {
        data = data.filter(
          (item) => Number(item.sedeId) === Number(sedeFiltro)
        );
      }

      // Aplicar filtros de fecha si están definidos
      if (fechaDesdeFiltro || fechaHastaFiltro) {
        data = data.filter((item) => {
          const fechaItem = new Date(item.fechaHora || item.createdAt);
          let cumpleFiltro = true;

          if (fechaDesdeFiltro) {
            const fechaDesdeComparar = new Date(fechaDesdeFiltro);
            fechaDesdeComparar.setHours(0, 0, 0, 0); // Inicio del día
            cumpleFiltro = cumpleFiltro && fechaItem >= fechaDesdeComparar;
          }

          if (fechaHastaFiltro) {
            const fechaHastaComparar = new Date(fechaHastaFiltro);
            fechaHastaComparar.setHours(23, 59, 59, 999); // Final del día
            cumpleFiltro = cumpleFiltro && fechaItem <= fechaHastaComparar;
          }

          return cumpleFiltro;
        });
      }

      // Aplicar filtro de estado
      if (estadoFiltro && estadoFiltro !== "todos") {
        data = data.filter((item) => {
          if (estadoFiltro === "dentro") {
            return !item.fechaHoraSalidaDefinitiva; // Sin fecha de salida = está dentro
          } else if (estadoFiltro === "fuera") {
            return item.fechaHoraSalidaDefinitiva; // Con fecha de salida = ya salió
          }
          return true; // "todos" no filtra nada
        });
      }

      setItems(data);
    } catch (err) {
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

  /**
   * Manejar registro encontrado desde SalidaDialog
   * Abre el formulario de edición con el registro encontrado
   */
  const handleRegistroEncontrado = (registro) => {
    setEditing(registro);
    setShowDialog(true);
  };

  /**
   * Manejar salida definitiva procesada desde SalidaDialog
   * Recarga los datos para reflejar los cambios
   */
  const handleSalidaProcesada = async (registroActualizado) => {
    // Recargar datos para mostrar los cambios
    await cargarItems(
      empresaSeleccionada,
      sedeSeleccionada,
      fechaDesde,
      fechaHasta,
      filtroEstado
    );

    toast.current?.show({
      severity: "success",
      summary: "Datos Actualizados",
      detail: "La lista se ha actualizado con la salida definitiva procesada",
      life: 3000,
    });
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

  /**
   * Limpiar filtros de fecha para mostrar todos los registros
   */
  const limpiarFiltrosFecha = () => {
    setFechaDesde(null);
    setFechaHasta(null);
  };

  /**
   * Limpiar filtro de estado
   */
  const limpiarFiltroEstado = () => {
    setFiltroEstado(null);
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
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-rounded"
          onClick={(ev) => {
            ev.stopPropagation();
            handleEdit(rowData);
          }}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger p-button-rounded"
            onClick={(ev) => {
              ev.stopPropagation();
              handleDelete(rowData);
            }}
            tooltip="Eliminar Registro"
          />
        )}
      </div>
    );
  };

  const fechaHoraBodyTemplate = (rowData) => {
    if (!rowData.fechaHora) return "";
    const fecha = new Date(rowData.fechaHora);
    const fechaFormateada = fecha.toLocaleDateString("es-ES");
    const horaFormateada = fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${fechaFormateada} ${horaFormateada}`;
  };

  const fechaSalidaBodyTemplate = (rowData) => {
    if (!rowData.fechaHoraSalidaDefinitiva) return "";
    const fecha = new Date(rowData.fechaHoraSalidaDefinitiva);
    const fechaFormateada = fecha.toLocaleDateString("es-ES");
    const horaFormateada = fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${fechaFormateada} ${horaFormateada}`;
  };

  /**
   * Template para mostrar el estado del visitante con íconos
   * ✅ = Ya salió (fechaHoraSalidaDefinitiva no null)
   * 🔴 = Aún está dentro (fechaHoraSalidaDefinitiva null)
   */
  const estadoBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "center", fontSize: "16px" }}>
        {rowData.fechaHoraSalidaDefinitiva ? "✅" : "🔴"}
      </div>
    );
  };

  /**
   * Template para mostrar alerta de incidente
   * ⚠️ = Incidente resaltante (incidenteResaltante=true)
   * Espacio vacío = Sin incidente
   */
  const incidenteBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "center" }}>
        {rowData.incidenteResaltante ? <FcDisclaimer /> : ""}
      </div>
    );
  };

  /**
   * Template para mostrar documentación adjunta
   * FcDocument = Tiene documentación adjunta (urlDocumentoVisitante con información)
   * Espacio vacío = Sin documentación
   */
  const documentoBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "center" }}>
        {rowData.urlDocumentoVisitante ? <FcDocument /> : ""}
      </div>
    );
  };

  /**
   * Template para mostrar la persona destino
   * Muestra el nombre completo de la persona destino basado en personaFirmaDestinoVisitaId
   */
  const personaDestinoBodyTemplate = (rowData) => {
    if (!rowData.personaFirmaDestinoVisitaId) return "";

    // Buscar la persona en el array de personal (similar al patrón de motivoAcceso)
    const persona = personal.find(
      (p) => Number(p.id) === Number(rowData.personaFirmaDestinoVisitaId)
    );
    if (persona) {
      return `${persona.nombres} ${persona.apellidos}`;
    }

    // Fallback: mostrar ID si no se encuentra la persona
    return `ID: ${rowData.personaFirmaDestinoVisitaId}`;
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
        globalFilter={globalFilter}
        globalFilterFields={[
          "nombrePersona",
          "numeroDocumento",
          "vehiculoNroPlaca",
          "vehiculoMarca",
          "vehiculoModelo",
          "vehiculoColor",
          "equipoMarca",
          "equipoSerie",
          "observaciones",
          "descripcionIncidente",
          "tipoAcceso.nombre",
          "tipoPersona.nombre",
          "motivoAcceso.descripcion",
          "tipoEquipo.nombre",
        ]}
        emptyMessage={
          globalFilter
            ? `No se encontraron registros que coincidan con "${globalFilter}"`
            : empresaSeleccionada ||
              sedeSeleccionada ||
              fechaDesde ||
              fechaHasta ||
              filtroEstado
            ? `No se encontraron registros para los filtros aplicados${
                empresaSeleccionada
                  ? ` (Empresa: ${
                      empresas.find((e) => e.id === empresaSeleccionada)
                        ?.razonSocial || "N/A"
                    })`
                  : ""
              }${
                sedeSeleccionada
                  ? ` (Sede: ${
                      sedesFiltradas.find((s) => s.id === sedeSeleccionada)
                        ?.nombre || "N/A"
                    })`
                  : ""
              }${
                fechaDesde || fechaHasta
                  ? ` (Fechas: ${
                      fechaDesde
                        ? fechaDesde.toLocaleDateString("es-ES")
                        : "..."
                    } - ${
                      fechaHasta
                        ? fechaHasta.toLocaleDateString("es-ES")
                        : "..."
                    })`
                  : ""
              }${
                filtroEstado
                  ? ` (Estado: ${
                      opcionesEstado.find((e) => e.value === filtroEstado)
                        ?.label || "N/A"
                    })`
                  : ""
              }`
            : "No se encontraron registros. Seleccione empresa y sede para ver los accesos."
        }
        onRowClick={(e) => handleEdit(e.data)}
        header={
          <div className="flex align-items-center gap-2">
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <h2>Control Acceso Instalaciones</h2>
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <small className="text-500">
                  {items.length} registro{items.length !== 1 ? "s" : ""}
                  {(empresaSeleccionada || sedeSeleccionada) && (
                    <span className="text-primary">
                      {empresaSeleccionada &&
                        ` | Empresa: ${
                          empresas.find((e) => e.id === empresaSeleccionada)
                            ?.razonSocial || "N/A"
                        }`}
                      {sedeSeleccionada &&
                        ` | Sede: ${
                          sedesFiltradas.find((s) => s.id === sedeSeleccionada)
                            ?.nombre || "N/A"
                        }`}
                    </span>
                  )}
                </small>
              </div>
            </div>
            {/* Primera Linea */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label
                  htmlFor="empresaFiltro"
                  className="font-bold"
                  style={{ textAlign: "center" }}
                >
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
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label
                  htmlFor="sedeFiltro"
                  className="font-bold"
                  style={{ textAlign: "center" }}
                >
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
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label className="font-bold" style={{ textAlign: "center" }}>
                  Nuevo
                </label>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className={
                    !empresaSeleccionada || !sedeSeleccionada
                      ? "p-button-secondary p-button-outlined"
                      : "p-button-success p-button-outlined"
                  }
                  size="small"
                  disabled={!empresaSeleccionada || !sedeSeleccionada}
                  style={{
                    opacity:
                      !empresaSeleccionada || !sedeSeleccionada ? 0.5 : 1,
                    cursor:
                      !empresaSeleccionada || !sedeSeleccionada
                        ? "not-allowed"
                        : "pointer",
                    backgroundColor:
                      !empresaSeleccionada || !sedeSeleccionada
                        ? "#f8f9fa"
                        : "",
                    borderColor:
                      !empresaSeleccionada || !sedeSeleccionada
                        ? "#dee2e6"
                        : "",
                    color:
                      !empresaSeleccionada || !sedeSeleccionada
                        ? "#6c757d"
                        : "",
                  }}
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
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label className="font-bold" style={{ textAlign: "center" }}>
                  Salida
                </label>
                <Button
                  label="Salida"
                  icon="pi pi-sign-out"
                  className="p-button-warning p-button-outlined"
                  size="small"
                  onClick={() => {
                    setShowSalidaDialog(true);
                  }}
                  tooltip="Procesar salida de visitante"
                />
              </div>
            </div>
            {/* Segunda Linea */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Panel de Filtros Globales */}
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label
                  htmlFor="idglobalFilter"
                  className="font-bold"
                  style={{ textAlign: "center" }}
                >
                  Filtros Globales
                </label>
                <InputText
                  id="idglobalFilter"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar accesos..."
                  style={{ width: "300px" }}
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label
                  htmlFor="fechaDesde"
                  className="font-bold"
                  style={{ textAlign: "center" }}
                >
                  Fecha Desde
                </label>
                <Calendar
                  id="fechaDesde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.value)}
                  placeholder="Fecha Desde"
                  className="w-full"
                  dateFormat="dd/mm/yy"
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label
                  htmlFor="fechaHasta"
                  className="font-bold"
                  style={{ textAlign: "center" }}
                >
                  Fecha Hasta
                </label>
                <Calendar
                  id="fechaHasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.value)}
                  placeholder="Fecha Hasta"
                  className="w-full"
                  dateFormat="dd/mm/yy"
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label
                  htmlFor="limpiarFechas"
                  className="font-bold"
                  style={{ textAlign: "center" }}
                >
                  Limpiar Fechas
                </label>
                <Button
                  id="limpiarFechas"
                  label="Limpiar Fechas"
                  icon="pi pi-times"
                  className="p-button-outlined p-button-danger"
                  size="small"
                  onClick={limpiarFiltrosFecha}
                  tooltip="Limpiar filtros de fecha"
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <label
                  htmlFor="filtroEstado"
                  className="font-bold"
                  style={{ textAlign: "center" }}
                >
                  Estado Visitante
                </label>
                <Dropdown
                  id="filtroEstado"
                  value={filtroEstado}
                  options={opcionesEstado}
                  onChange={(e) => setFiltroEstado(e.value)}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Filtrar por estado"
                  className="w-full"
                  showClear
                  clearIcon="pi pi-times"
                  tooltip="Filtrar visitantes por estado"
                />
              </div>
            </div>
          </div>
        }
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        scrollable
        scrollHeight="600px"
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ width: "80px", textAlign: "center" }}
        />
        <Column
          body={estadoBodyTemplate}
          header="Estado"
          style={{ width: "60px", textAlign: "center" }}
          sortable={false}
        />
        <Column
          body={incidenteBodyTemplate}
          header={<FcDisclaimer />}
          style={{ textAlign: "center", fontSize: "20px" }}
          sortable={false}
        />
        <Column
          body={documentoBodyTemplate}
          header={<FcDocument />}
          style={{ textAlign: "center", fontSize: "20px" }}
          sortable={false}
        />
        <Column field="nombrePersona" header="Persona" sortable />
        <Column field="tipoAcceso.nombre" header="Tipo Acceso" sortable />
        <Column
          field="fechaHora"
          header="Fecha y Hora"
          sortable
          body={fechaHoraBodyTemplate}
        />
        <Column
          field="fechaHoraSalidaDefinitiva"
          header="Fecha Salida"
          sortable
          body={fechaSalidaBodyTemplate}
        />
        <Column field="numeroDocumento" header="Documento" sortable />
        <Column field="vehiculoNroPlaca" header="Placa" sortable />
        <Column field="motivoAcceso.descripcion" header="Motivo" sortable />
        <Column field="tipoPersona.nombre" header="Tipo Persona" sortable />
        <Column
          body={personaDestinoBodyTemplate}
          header="Persona Destino"
          sortable={false}
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
          margin: "0 auto",
        }}
        header={
          editing
            ? `Editar Acceso a Instalación - ID: ${editing.id}`
            : "Nuevo Acceso a Instalación"
        }
        modal
        className="p-fluid dialog-responsive"
        onHide={() => {
          setShowDialog(false);
          setEditing(null);
        }}
        breakpoints={{ "960px": "90vw", "640px": "95vw" }}
        draggable={false}
        resizable={false}
      >
        <AccesoInstalacionForm
          item={editing}
          onSave={handleSave}
          onCancel={(shouldReload = false) => {
            setShowDialog(false);
            setEditing(null);
            // Si shouldReload es true, recargar la lista para reflejar cambios
            if (shouldReload) {
              cargarItems();
            }
          }}
          empresaId={empresaSeleccionada}
          sedeId={sedeSeleccionada}
        />
      </Dialog>

      <Dialog
        visible={showSalidaDialog}
        style={{
          width: "90vw",
          maxWidth: "800px",
          margin: "0 auto",
        }}
        header="Procesar Salida de Visitante"
        modal
        className="p-fluid dialog-responsive"
        onHide={() => {
          setShowSalidaDialog(false);
        }}
        breakpoints={{ "960px": "90vw", "640px": "95vw" }}
        draggable={false}
        resizable={false}
      >
        <SalidaDialog
          onClose={() => setShowSalidaDialog(false)}
          onRegistroEncontrado={handleRegistroEncontrado}
          onSalidaProcesada={handleSalidaProcesada}
          toast={toast}
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
