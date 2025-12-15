// src/pages/Personal.jsx
// Página principal de gestión de personal en el ERP Megui.
// Reutiliza patrones de Usuarios.jsx y documenta en español técnico.

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import PersonalForm from "../components/personal/PersonalForm";
import { Tag } from "primereact/tag";
import {
  getPersonal,
  crearPersonal,
  actualizarPersonal,
  eliminarPersonal,
} from "../api/personal";
import { getEmpresas } from "../api/empresa";
import { Dialog } from "primereact/dialog";
import { getCargosPersonal } from "../api/cargosPersonal";
import { getSedes } from "../api/sedes";
import { getAreasFisicas } from "../api/areasFisicas";
import { Avatar } from "primereact/avatar";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de personal.
 * Incluye DataTable, alta, edición y eliminación, con feedback visual profesional.
 */
export default function PersonalPage({ ruta }) {
  // Obtener usuario autenticado para control de permisos
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
  const [personales, setPersonales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [cargoFilter, setCargoFilter] = useState(null);
  const [filtroTipoPesca, setFiltroTipoPesca] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [filteredPersonales, setFilteredPersonales] = useState([]);

  /**
   * Carga los cargos desde el backend.
   * Utiliza la función getCargosPersonal para obtener los datos.
   * Si hay un error, muestra un toast con el mensaje de error.
   */
  const [cargosLista, setCargosLista] = useState([]);
  useEffect(() => {
    loadCargos();
  }, []);

  const loadCargos = async () => {
    try {
      const data = await getCargosPersonal();
      setCargosLista(data);
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los cargos",
      });
    }
  };
  const getCargoDescripcion = (id) => {
    const cargo = cargosLista.find((c) => Number(c.id) === Number(id));
    return cargo ? cargo.descripcion : "";
  };

  /**
   * Carga las empresas desde el backend.
   * Utiliza la función getEmpresas para obtener los datos.
   * Si hay un error, muestra un toast con el mensaje de error.
   */
  // Cargar empresas
  const [empresasLista, setEmpresasLista] = useState([]);
  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const data = await getEmpresas();
      setEmpresasLista(data);
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las empresas",
      });
    }
  };

  const getEmpresaRazonSocial = (id) => {
    const empresa = empresasLista.find((e) => Number(e.id) === Number(id));
    return empresa ? empresa.razonSocial : "";
  };

  const [sedesLista, setSedesLista] = useState([]);
  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    try {
      const data = await getSedes();
      setSedesLista(data);
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las sedes",
      });
    }
  };
  const getSedeNombre = (id) => {
    const sede = sedesLista.find((s) => Number(s.id) === Number(id));
    return sede ? sede.nombre : "";
  };

  const [areasFisicasLista, setAreasFisicasLista] = useState([]);
  useEffect(() => {
    loadAreasFisicas();
  }, []);

  const loadAreasFisicas = async () => {
    try {
      const data = await getAreasFisicas();
      setAreasFisicasLista(data);
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las áreas físicas",
      });
    }
  };
  const getAreaFisicaNombre = (id) => {
    const area = areasFisicasLista.find((a) => Number(a.id) === Number(id));
    return area ? area.nombre : "";
  };

  // Carga inicial de personal
  useEffect(() => {
    loadPersonal();
    loadCargos();
    loadEmpresas();
    loadSedes();
    loadAreasFisicas();
  }, []);

  const loadPersonal = async () => {
    setLoading(true);
    try {
      const data = await getPersonal();
      setPersonales(data);
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el personal",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    aplicarFiltros();
  }, [personales, filtroTipoPesca, filtroEstado, empresaFilter, cargoFilter]);

  const aplicarFiltros = () => {
    let personalesFiltrados = [...personales];

    // Filtrar por empresa
    if (empresaFilter) {
      personalesFiltrados = personalesFiltrados.filter(
        (personal) => Number(personal.empresaId) === Number(empresaFilter)
      );
    }

    // Filtrar por cargo
    if (cargoFilter) {
      personalesFiltrados = personalesFiltrados.filter(
        (personal) => Number(personal.cargoId) === Number(cargoFilter)
      );
    }

    // Filtrar por estado (cesado)
    if (filtroEstado === "activos") {
      personalesFiltrados = personalesFiltrados.filter(
        (personal) => personal.cesado === false
      );
    } else if (filtroEstado === "cesados") {
      personalesFiltrados = personalesFiltrados.filter(
        (personal) => personal.cesado === true
      );
    }
    // Si filtroEstado === "todos", no filtramos por cesado

    // Filtrar por tipo de pesca
    if (filtroTipoPesca === "todos") {
      // Mostrar todos los registros ya filtrados por empresa/cargo/estado
      setFilteredPersonales(personalesFiltrados);
    } else if (filtroTipoPesca === "temporada") {
      // Filtrar solo registros con paraTemporadaPesca = true
      personalesFiltrados = personalesFiltrados.filter(
        (personal) => personal.paraTemporadaPesca === true
      );
      setFilteredPersonales(personalesFiltrados);
    } else if (filtroTipoPesca === "consumo") {
      // Filtrar solo registros con paraPescaConsumo = true
      personalesFiltrados = personalesFiltrados.filter(
        (personal) => personal.paraPescaConsumo === true
      );
      setFilteredPersonales(personalesFiltrados);
    }
  };

  const cambiarFiltroTipoPesca = () => {
    const siguienteEstado = {
      todos: "temporada",
      temporada: "consumo",
      consumo: "todos",
    };
    setFiltroTipoPesca(siguienteEstado[filtroTipoPesca]);
  };

  const cambiarFiltroEstado = () => {
    const siguienteEstado = {
      activos: "cesados",
      cesados: "todos",
      todos: "activos",
    };
    setFiltroEstado(siguienteEstado[filtroEstado]);
  };

  const obtenerConfigFiltroEstado = () => {
    const config = {
      activos: {
        label: "ACTIVOS",
        icon: "pi pi-check",
        severity: "primary",
      },
      cesados: {
        label: "CESADOS",
        icon: "pi pi-times",
        severity: "danger",
      },
      todos: {
        label: "TODOS",
        icon: "pi pi-list",
        severity: "success",
      },
    };
    return config[filtroEstado] || config["activos"];
  };

  const obtenerConfigFiltro = () => {
    const config = {
      todos: {
        label: "Todos",
        icon: "pi pi-check-circle",
        severity: "info",
      },
      temporada: {
        label: "Temporada",
        icon: "pi pi-cog",
        severity: "warning",
      },
      consumo: {
        label: "Consumo",
        icon: "pi pi-users",
        severity: "success",
      },
    };
    return config[filtroTipoPesca] || config["todos"];
  };

  // Renderizado de botones de acción
  const actionBodyTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={(ev) => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            onEdit(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={(ev) => {
          if (permisos.puedeEliminar) {
            onDelete(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "Sí" : "No"}
        severity={rowData.cesado ? "danger" : "secondary"}
      />
    );
  };
  const esVendedorTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esVendedor ? "Si" : "No"}
        severity={rowData.esVendedor ? "success" : "secondary"}
      />
    );
  };

  // Lógica para alta y edición
  const onNew = () => {
    setSelected(null);
    setIsEdit(false);
    setShowForm(true);
  };

  const onEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };

  const onDelete = (row) => {
    setConfirmState({ visible: true, row });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    const nombreCompleto = `${row.nombres} ${row.apellidos}`.trim();
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarPersonal(row.id);
      toast?.show({
        severity: "success",
        summary: "Personal eliminado",
        detail: `El personal ${nombreCompleto} fue eliminado correctamente.`,
      });
      await loadPersonal();
    } catch (err) {
      if (err?.response?.data) {
        console.error(
          "[PersonalPage] Error backend al eliminar:",
          JSON.stringify(err.response.data)
        );
        toast?.show({
          severity: "error",
          summary: "Error",
          detail:
            err.response.data?.message || "No se pudo eliminar el personal.",
        });
      } else {
        console.error("[PersonalPage] Error inesperado:", err);
        toast?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el personal.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowForm(false);
    setSelected(null); // Limpiar selección al cancelar
    setIsEdit(false); // Resetear modo edición
  };

  /**
   * Maneja el alta o edición de personal.
   * Construye el payload profesional, registra logs y llama a la API según corresponda.
   * Cumple las reglas de logging y validación previas a producción.
   */
  const onSubmit = async (data) => {
    // Validar permisos antes de guardar
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      // Construir payload limpio solo con campos válidos para el backend
      // Payload profesional con todos los campos requeridos por el backend
      const personalPayload = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        empresaId: data.empresaId ? Number(data.empresaId) : null,
        tipoDocumentoId: data.tipoDocumentoId
          ? Number(data.tipoDocumentoId)
          : null,
        numeroDocumento: data.numeroDocumento,
        fechaNacimiento: data.fechaNacimiento
          ? new Date(data.fechaNacimiento).toISOString()
          : null,
        fechaIngreso: data.fechaIngreso
          ? new Date(data.fechaIngreso).toISOString()
          : null,
        cesado: !!data.cesado,
        telefono: data.telefono || null,
        correo: data.correo || null,
        urlFotoPersona: data.urlFotoPersona || null,
        tipoContratoId: data.tipoContratoId
          ? Number(data.tipoContratoId)
          : null,
        cargoId: data.cargoId ? Number(data.cargoId) : null,
        sedeEmpresaId: data.sedeEmpresaId ? Number(data.sedeEmpresaId) : null,
        areaFisicaId: data.areaFisicaId ? Number(data.areaFisicaId) : null,
        sexo: typeof data.sexo === "boolean" ? data.sexo : false,
        esVendedor:
          typeof data.esVendedor === "boolean" ? data.esVendedor : false,
        paraTemporadaPesca:
          typeof data.paraTemporadaPesca === "boolean"
            ? data.paraTemporadaPesca
            : false,
        paraPescaConsumo:
          typeof data.paraPescaConsumo === "boolean"
            ? data.paraPescaConsumo
            : false,
      };
      if (isEdit && selected) {
        // Edición de personal existente
        await actualizarPersonal(selected.id, personalPayload);
        toast?.show({
          severity: "success",
          summary: "Personal actualizado",
          detail: `El personal ${data.nombres} fue actualizado correctamente.`,
        });
      } else {
        await crearPersonal(personalPayload);
        toast?.show({
          severity: "success",
          summary: "Personal creado",
          detail: `El personal ${data.nombres} fue registrado correctamente.`,
        });
      }
      setShowForm(false);
      setSelected(null); // Limpiar selección después de guardar
      setIsEdit(false); // Resetear modo edición
      loadPersonal();
    } catch (err) {
      if (err?.response?.data) {
        console.error(
          "[PersonalPage] Respuesta de error backend:",
          JSON.stringify(err.response.data)
        );
      }
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el personal.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Conversión profesional de fechas para edición, fuera del JSX
  // Esto asegura que PrimeReact Calendar reciba objetos Date y evita errores de referencia.
  // Conversión profesional de fechas y campos para edición, fuera del JSX
  // Incluye todos los campos nuevos para que el formulario los reciba correctamente
  const selectedPersonal = selected
    ? {
        ...selected,
        fechaNacimiento: selected.fechaNacimiento
          ? new Date(selected.fechaNacimiento)
          : null,
        fechaIngreso: selected.fechaIngreso
          ? new Date(selected.fechaIngreso)
          : null,
        telefono: selected.telefono || "",
        correo: selected.correo || "",
        urlFotoPersona: selected.urlFotoPersona || "",
        tipoContratoId: selected.tipoContratoId
          ? String(selected.tipoContratoId)
          : "",
        cargoId: selected.cargoId ? String(selected.cargoId) : "",
        areaFisicaId: selected.areaFisicaId
          ? String(selected.areaFisicaId)
          : "",
        sedeEmpresaId: selected.sedeEmpresaId
          ? String(selected.sedeEmpresaId)
          : "",
        sexo: typeof selected.sexo === "boolean" ? selected.sexo : false,
        paraTemporadaPesca:
          typeof selected.paraTemporadaPesca === "boolean"
            ? selected.paraTemporadaPesca
            : false,
        paraPescaConsumo:
          typeof selected.paraPescaConsumo === "boolean"
            ? selected.paraPescaConsumo
            : false,
      }
    : { cesado: false, paraTemporadaPesca: false, paraPescaConsumo: false };

  return (
    <div className="p-m-4">
      <Toast ref={setToast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> a{" "}
            <b>
              {confirmState.row
                ? `${confirmState.row.nombres} ${confirmState.row.apellidos}`
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
        value={filteredPersonales}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} personal"
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        header={
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>Personal</h2>
              <small style={{ color: "#666", fontWeight: "normal" }}>
                Total de registros: {filteredPersonales.length}
              </small>
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                raised
                disabled={!permisos.puedeCrear}
                tooltip="Nuevo Personal"
                outlined
                onClick={onNew}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="razonSocial">Filtrar por Empresa</label>
              <Dropdown
                value={empresaFilter}
                options={empresasLista}
                optionLabel="razonSocial"
                optionValue="id"
                placeholder="Filtrar por empresa"
                onChange={(e) => setEmpresaFilter(e.value)}
                showClear
                style={{ minWidth: "200px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="descripcion">Filtrar por Cargo</label>
              <Dropdown
                value={cargoFilter}
                options={cargosLista}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Filtrar por cargo"
                onChange={(e) => setCargoFilter(e.value)}
                showClear
                style={{ minWidth: "200px" }}
                filter
                filterBy="descripcion"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="estado">Filtrar por Estado</label>
              <Button
                label={obtenerConfigFiltroEstado().label}
                icon={obtenerConfigFiltroEstado().icon}
                severity={obtenerConfigFiltroEstado().severity}
                outlined
                onClick={cambiarFiltroEstado}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tipoPesca">Filtrar por Tipo de Pesca</label>
              <Button
                label={obtenerConfigFiltro().label}
                icon={obtenerConfigFiltro().icon}
                severity={obtenerConfigFiltro().severity}
                outlined
                onClick={cambiarFiltroTipoPesca}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="globalFilter">Buscar por Nombres</label>
              <span className="p-input-icon-left">
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar personal..."
                  style={{ width: "150px" }}
                />
              </span>
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Limpiar"
                icon="pi pi-filter-slash"
                className="p-button-secondary"
                size="small"
                raised
                tooltip="Limpiar todos los filtros"
                outlined
                onClick={() => {
                  setEmpresaFilter(null);
                  setCargoFilter(null);
                  setGlobalFilter("");
                  setFiltroTipoPesca("todos");
                  setFiltroEstado("activos");
                }}
              />
            </div>
          </div>
        }
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => onEdit(e.data)
            : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={[
          "nombres",
          "apellidos",
          "numeroDocumento",
          "direccion",
          "telefono",
          "correo",
        ]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="id" header="ID" sortable />
        <Column
          header="Foto"
          body={(row) => {
            const nombres = row.nombres || "";
            const apellidos = row.apellidos || "";
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            const urlFoto = row.urlFotoPersona
              ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${
                  row.urlFotoPersona
                }`
              : undefined;
            // Si hay foto, muestra el avatar con imagen; si no, iniciales
            if (urlFoto) {
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
            } else {
              const iniciales = `${nombres.charAt(0)}${apellidos.charAt(
                0
              )}`.toUpperCase();
              return (
                <span data-pr-tooltip={nombreCompleto} data-pr-position="right">
                  <Avatar
                    label={iniciales}
                    shape="circle"
                    size="large"
                    style={{
                      backgroundColor: "#2196F3",
                      color: "#fff",
                      width: 36,
                      height: 36,
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  />
                </span>
              );
            }
          }}
          style={{ minWidth: 80, textAlign: "center" }}
        />
        <Column field="nombres" header="Nombres" sortable />
        <Column field="apellidos" header="Apellidos" sortable />
        <Column
          header="Cargo"
          body={(row) => getCargoDescripcion(row.cargoId)}
          sortable
        />
        <Column
          header="Empresa"
          body={(row) => getEmpresaRazonSocial(row.empresaId)}
          sortable
        />
        <Column
          header="Sede Empresa"
          body={(row) => getSedeNombre(row.sedeEmpresaId)}
          sortable
        />
        <Column
          header="Area Física"
          body={(row) => getAreaFisicaNombre(row.areaFisicaId)}
          sortable
        />
        <Column
          field="esVendedor"
          header="Vendedor"
          body={esVendedorTemplate}
          sortable
        />
        <Column field="cesado" header="Cesado" body={cesadoTemplate} sortable />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      {/*
        El formulario de alta/edición de personal se muestra en un modal profesional (Dialog),
        cumpliendo la regla de UX para no mostrarlo debajo de la lista.
      */}
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Personal"
              : "Ver Personal"
            : "Nuevo Personal"
        }
        visible={showForm}
        style={{ width: "1300px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <PersonalForm
          isEdit={isEdit}
          defaultValues={selectedPersonal}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
