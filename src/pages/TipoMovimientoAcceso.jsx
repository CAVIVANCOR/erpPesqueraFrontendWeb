/**
 * Pantalla CRUD profesional para TipoMovimientoAcceso
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Gestiona tipos de movimientos de acceso (ingreso, salida, transferencia, etc.).
 *
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal)
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo
 * - Feedback visual con Toast
 * - Documentación de la regla en el encabezado
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import {
  obtenerTiposMovimientoAcceso,
  eliminarTipoMovimientoAcceso,
  cambiarEstadoTipoMovimiento,
} from "../api/tipoMovimientoAcceso";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import TipoMovimientoAccesoForm from "../components/tipoMovimientoAcceso/TipoMovimientoAccesoForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente TipoMovimientoAcceso
 * Pantalla principal para gestión de tipos de movimientos de acceso
 */
const TipoMovimientoAcceso = ({ ruta }) => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Estados del componente
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  /**
   * Carga los tipos de movimientos desde la API
   */
  const cargarTipos = async () => {
    try {
      setLoading(true);
      const data = await obtenerTiposMovimientoAcceso();

      // Normalizar IDs según regla ERP Megui
      const tiposNormalizados = data.map((tipo) => ({
        ...tipo,
        id: Number(tipo.id),
        nombre: tipo.nombre?.trim() || "",
        descripcion: tipo.descripcion?.trim() || null,
        activo: Boolean(tipo.activo),
        createdAt: tipo.createdAt ? new Date(tipo.createdAt) : null,
        updatedAt: tipo.updatedAt ? new Date(tipo.updatedAt) : null,
      }));

      setTipos(tiposNormalizados);
    } catch (error) {
      console.error("Error al cargar tipos de movimientos de acceso:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los tipos de movimientos de acceso",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarTipos();
  }, []);

  /**
   * Abre el diálogo para crear nuevo tipo
   */
  const abrirDialogoNuevo = () => {
    setTipoSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar tipo (clic en fila)
   */
  const editarTipo = (tipo) => {
    setTipoSeleccionado(tipo);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setTipoSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarTipos();
  };

  /**
   * Confirma la eliminación de un tipo
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (tipo) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }

    const confirmar = () => {
      eliminarTipoMovimiento(tipo.id);
    };

    const rechazar = () => {
      // No hacer nada
    };

    confirmDialog({
      message: `¿Está seguro de eliminar el tipo de movimiento "${tipo.nombre}" (${tipo.codigo})?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: confirmar,
      reject: rechazar,
    });
  };

  /**
   * Elimina un tipo de movimiento
   */
  const eliminarTipoMovimiento = async (id) => {
    try {
      await eliminarTipoMovimientoAcceso(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de movimiento eliminado correctamente",
      });
      await cargarTipos();
    } catch (error) {
      console.error("Error al eliminar tipo de movimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar el tipo de movimiento",
      });
    }
  };

  /**
   * Maneja el filtro global
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilter(value);
  };

  /**
   * Template para el nombre
   */
  const nombreTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <span className="font-medium">{rowData.nombre}</span>
      </div>
    );
  };

  /**
   * Template para el estado activo
   */
  const estadoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag
          value={rowData.activo ? "ACTIVO" : "INACTIVO"}
          severity={rowData.activo ? "success" : "danger"}
        />
      </div>
    );
  };

  /**
   * Template para descripción
   */
  const descripcionTemplate = (rowData) => {
    if (!rowData.descripcion) {
      return <span className="text-500">-</span>;
    }

    const texto =
      rowData.descripcion.length > 60
        ? `${rowData.descripcion.substring(0, 60)}...`
        : rowData.descripcion;

    return (
      <span title={rowData.descripcion} className="text-sm">
        {texto}
      </span>
    );
  };

  /**
   * Template para acciones
   * Solo muestra eliminar para superusuario o admin
   */
  const accionesTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            editarTipo(rowData);
          }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? 'Editar' : 'Ver'}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          onClick={() => confirmarEliminacion(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </>
    );
  };
  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="card">
        <DataTable
          value={tipos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={["nombre", "descripcion"]}
          emptyMessage="No se encontraron tipos de movimientos de acceso"
          onRowClick={(permisos.puedeVer || permisos.puedeEditar) ? (e) => editarTipo(e.data) : undefined}
          className="datatable-responsive"
          header={
            <div className="flex align-items-center gap-2">
              <h2>Gestión de Tipos de Movimientos de Acceso</h2>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                onClick={abrirDialogoNuevo}
                disabled={!permisos.puedeCrear}
                tooltip={!permisos.puedeCrear ? 'No tiene permisos para crear' : 'Nuevo Tipo de Movimiento de Acceso'}
                size="small"
                outlined
                raised
              />
              <span className="p-input-icon-left">
                <InputText
                  type="search"
                  value={globalFilter}
                  onChange={onGlobalFilterChange}
                  placeholder="Buscar..."
                  className="w-full sm:w-auto"
                />
              </span>
            </div>
          }
          scrollable
          scrollHeight="600px"
          style={{ cursor: (permisos.puedeVer || permisos.puedeEditar) ? "pointer" : "default", fontSize: getResponsiveFontSize() }}
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="nombre"
            header="Nombre"
            body={nombreTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            body={descripcionTemplate}
            sortable
            style={{ minWidth: "250px" }}
          />
          <Column
            field="activo"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            body={accionesTemplate}
            header="Acciones"
            frozen
            alignFrozen="right"
            style={{ minWidth: "100px" }}
          />
        </DataTable>
      </div>

      {/* Diálogo del formulario */}
      <Dialog
        visible={dialogoVisible}
        style={{ width: "90vw", maxWidth: "600px" }}
        header={
          tipoSeleccionado?.id
            ? "Editar Tipo de Movimiento"
            : "Nuevo Tipo de Movimiento"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
        maximizable
      >
        <TipoMovimientoAccesoForm
          tipo={tipoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          permisos={permisos}
          readOnly={!!tipoSeleccionado && !!tipoSeleccionado.id && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default TipoMovimientoAcceso;
