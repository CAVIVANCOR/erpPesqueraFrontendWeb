// src/pages/DetCuotaPesca.jsx
// Pantalla profesional de gestión de detalles de cuota de pesca para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import {
  getDetallesCuotaPesca,
  crearDetalleCuotaPesca,
  actualizarDetalleCuotaPesca,
  eliminarDetalleCuotaPesca,
} from "../api/detCuotaPesca";
import { getEmpresas } from "../api/empresa";
import DetCuotaPescaForm from "../components/detCuotaPesca/DetCuotaPescaForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de detalles de cuota de pesca.
 * - CRUD completo con integración API REST.
 * - Filtro obligatorio por empresa antes de crear.
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
export default function DetCuotaPesca({ ruta }) {
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
  // Referencia para Toast de notificaciones
  const toast = useRef(null);

  // Estado para la lista de detalles de cuota
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [detalleEdit, setDetalleEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estado para filtro de empresa
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // Carga inicial de empresas y detalles
  useEffect(() => {
    cargarEmpresas();
    cargarDetalles();
  }, []);

  // Función para cargar empresas del backend
  async function cargarEmpresas() {
    setLoadingEmpresas(true);
    try {
      const data = await getEmpresas();
      setEmpresas(Array.isArray(data) ? data : data.empresas || []);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las empresas");
    } finally {
      setLoadingEmpresas(false);
    }
  }

  // Función para cargar todos los detalles de cuota
  async function cargarDetalles() {
    setLoading(true);
    try {
      const data = await getDetallesCuotaPesca();
      setDetalles(Array.isArray(data) ? data : []);
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        "No se pudieron cargar los detalles de cuota"
      );
    } finally {
      setLoading(false);
    }
  }


  // Muestra notificación Toast
  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  // Maneja el submit del formulario (alta o edición)
  async function onSubmitForm(data) {
    // Validar permisos antes de guardar
    if (modoEdicion && !permisos.puedeEditar) {
      return;
    }
    if (!modoEdicion && !permisos.puedeCrear) {
      return;
    }

    setFormLoading(true);
    try {
      if (modoEdicion && detalleEdit) {
        await actualizarDetalleCuotaPesca(detalleEdit.id, data);
        mostrarToast(
          "success",
          "Detalle actualizado",
          `El detalle de cuota fue actualizado correctamente.`
        );
      } else {
        await crearDetalleCuotaPesca(data);
        mostrarToast(
          "success",
          "Detalle creado",
          `El detalle de cuota fue registrado correctamente.`
        );
      }
      setMostrarDialogo(false);
      cargarDetalles();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "No se pudo guardar el detalle de cuota.";
      mostrarToast("error", "Error", errorMsg);
    } finally {
      setFormLoading(false);
    }
  }

  // Maneja la edición
  function handleEditar(detalle) {
    setDetalleEdit(detalle);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  // Maneja la eliminación
  function handleEliminar(detalle) {
    setConfirmState({ visible: true, row: detalle });
  }

  const handleConfirmDelete = async () => {
    const detalle = confirmState.row;
    if (!detalle) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarDetalleCuotaPesca(detalle.id);
      mostrarToast(
        "success",
        "Detalle eliminado",
        `El detalle de cuota fue eliminado correctamente.`
      );
      cargarDetalles();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "No se pudo eliminar el detalle de cuota.";
      mostrarToast("error", "Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Maneja el botón Nuevo
  function handleNuevo() {
    setDetalleEdit(null);
    setModoEdicion(false);
    setMostrarDialogo(true);
  }

  // Renderiza los botones de acción en cada fila
  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        style={{ marginRight: 8 }}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={(e) => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            handleEditar(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={(e) => {
          if (permisos.puedeEliminar) {
            handleEliminar(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  // Template para mostrar empresa
  const empresaTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "Sin empresa";
  };

  // Template para mostrar persona que actualiza
  const personaTemplate = (rowData) => {
    if (!rowData.personaActualiza) return "Sin persona";
    return `${rowData.personaActualiza.nombres} ${rowData.personaActualiza.apellidos}`;
  };

  // Template para mostrar tipo de cuota
  const tipoCuotaTemplate = (rowData) => {
    return rowData.cuotaPropia ? (
      <span style={{ color: "#2196F3", fontWeight: "bold" }}>PROPIA</span>
    ) : (
      <span style={{ color: "#FF9800", fontWeight: "bold" }}>ALQUILADA</span>
    );
  };

  // Template para mostrar estado activo
  const activoTemplate = (rowData) => {
    return rowData.activo ? (
      <span style={{ color: "#4CAF50" }}>Sí</span>
    ) : (
      <span style={{ color: "#F44336" }}>No</span>
    );
  };

  // Template para porcentaje
  const porcentajeTemplate = (rowData) => {
    return `${Number(rowData.porcentajeCuota).toFixed(6)}%`;
  };

  // Template para precio por tonelada
  const precioTemplate = (rowData) => {
    const precio = Number(rowData.precioPorTonDolares || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(precio);
  };

  // Preparar opciones de empresas
  const empresasOptions = empresas.map((e) => ({
    label: e.razonSocial,
    value: Number(e.id),
  }));

  // Filtrar detalles por empresa seleccionada
  const detallesFiltrados = empresaSeleccionada
    ? detalles.filter((d) => Number(d.empresaId) === Number(empresaSeleccionada))
    : detalles;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el detalle de
            cuota <b>{confirmState.row ? confirmState.row.nombre : ""}</b>?
            <br />
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

      {/* Tabla de detalles de cuota */}
      <DataTable
        value={detallesFiltrados}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
        size="small"
        showGridlines
        stripedRows
        globalFilter={globalFilter}
        emptyMessage="No hay detalles de cuota registrados."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>Cuotas de Pesca</h2>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="empresaFiltro">Filtrar por Empresa</label>
              <Dropdown
                id="empresaFiltro"
                value={empresaSeleccionada}
                options={empresasOptions}
                onChange={(e) => setEmpresaSeleccionada(e.value)}
                placeholder="Todas las empresas"
                filter
                showClear
                disabled={loadingEmpresas}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo Detalle"
                icon="pi pi-plus"
                className="p-button-success"
                raised
                disabled={!permisos.puedeCrear}
                onClick={handleNuevo}
                tooltip="Crear nuevo detalle de cuota"
              />
            </div>
            <div style={{ flex: 3 }}>
              <span className="p-input-icon-left">
                <InputText
                  type="search"
                  onInput={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar por nombre o empresa..."
                  style={{ width: 300 }}
                />
              </span>
            </div>
          </div>
        }
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined
        }
        globalFilterFields={["nombre", "empresa.razonSocial"]}
      >
        <Column field="id" header="ID" style={{ width: "80px" }} />
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          style={{ width: "200px" }}
        />
        <Column field="nombre" header="Nombre" />
        <Column
          field="porcentajeCuota"
          header="Porcentaje"
          body={porcentajeTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="precioPorTonDolares"
          header="Precio/Ton (USD)"
          body={precioTemplate}
          style={{ width: "140px" }}
        />
        <Column
          field="cuotaPropia"
          header="Tipo"
          body={tipoCuotaTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="personaActualiza"
          header="Actualizado Por"
          body={personaTemplate}
        />
        <Column
          field="activo"
          header="Activo"
          body={activoTemplate}
          style={{ width: "100px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ minWidth: 150, textAlign: "center" }}
        />
      </DataTable>

      {/* Diálogo de formulario */}
      <Dialog
        header={
          modoEdicion
            ? permisos.puedeEditar
              ? "Editar Detalle de Cuota"
              : "Ver Detalle de Cuota"
            : "Nuevo Detalle de Cuota"
        }
        visible={mostrarDialogo}
        style={{ width: 600 }}
        modal
        onHide={() => setMostrarDialogo(false)}
      >
        <DetCuotaPescaForm
          isEdit={modoEdicion}
          defaultValues={
            detalleEdit
              ? { ...detalleEdit }
              : {
                  empresaId: empresaSeleccionada || null,
                  idPersonaActualiza: usuario?.personalId,
                }
          }
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
