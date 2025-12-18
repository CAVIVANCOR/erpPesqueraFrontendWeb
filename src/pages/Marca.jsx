/**
 * Pantalla CRUD profesional para Marca
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, nombre (VarChar 80), productos[]
 * Patrón aplicado: Botón eliminar visible solo para superusuario/admin, confirmación visual profesional, búsqueda global por cualquier campo.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import {
  getMarcas,
  eliminarMarca,
} from "../api/marca";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import MarcaForm from "../components/marca/MarcaForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente Marca
 * Pantalla principal para gestión de marcas
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const Marca = ({ ruta }) => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <div className="p-4"><h2>Sin Acceso</h2><p>No tiene permisos para acceder a este módulo.</p></div>;
  }
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  // Estados del componente
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga las marcas desde la API
   */
  const cargarMarcas = async () => {
    try {
      setLoading(true);
      const data = await getMarcas();

      // Normalizar IDs según regla ERP Megui
      const marcasNormalizadas = data.map((marca) => ({
        ...marca,
        id: Number(marca.id),
      }));

      setMarcas(marcasNormalizadas);
    } catch (error) {
      console.error("Error al cargar marcas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las marcas",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarMarcas();
  }, []);

  /**
   * Abre el diálogo para crear nueva marca
   */
  const abrirDialogoNuevo = () => {
    setMarcaSeleccionada(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar marca (clic en fila)
   */
  const editarMarca = (marca) => {
    setMarcaSeleccionada(marca);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setMarcaSeleccionada(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarMarcas();
  };

  /**
   * Confirma la eliminación de una marca
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (marca) => {
    setConfirmState({ visible: true, row: marca });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarMarca(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Marca "${confirmState.row.nombre}" eliminada correctamente`,
      });

      await cargarMarcas();
    } catch (error) {
      console.error("Error al eliminar marca:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la marca",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Elimina una marca
   */
  const eliminarMarcaLocal = async (id) => {
    try {
      await eliminarMarca(id);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Maneja el filtro global - búsqueda por cualquier campo
   */
  const onGlobalFilterChange = (e) => {
    setGlobalFilter(e.target.value);
  };

  /**
   * Template para el nombre de la marca
   */
  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
        {rowData.nombre}
      </span>
    );
  };

  /**
   * Template para fechas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = new Date(rowData[field]);
    return fecha.toLocaleDateString("es-PE");
  };

  /**
   * Template para acciones
   * Incluye botón de editar y eliminar (eliminar solo para superusuario/admin)
   * Estilo idéntico a TipoAlmacenamiento.jsx: p-button-text, iconos pequeños
   */
  const accionesTemplate = (rowData) => {
    const esAdmin = usuario?.rol === "superusuario" || usuario?.rol === "admin";

    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          onClick={(e) => {
            e.stopPropagation();
            editarMarca(rowData);
          }}
        />
        {esAdmin && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger p-button-sm"
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <Toast ref={toast} />

      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span>
            ¿Está seguro de que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> la marca{" "}
            <b>{confirmState.row ? `"${confirmState.row.nombre}"` : ""}</b>?
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

      <DataTable
        value={marcas}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} marcas"
        globalFilter={globalFilter}
        globalFilterFields={["nombre"]}
        emptyMessage="No se encontraron marcas"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Marcas</h2>
            <Button
              type="button"
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              raised
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar marcas..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarMarca(e.data)}
        className="datatable-responsive"
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "60px" }} />
        <Column
          field="nombre"
          header="Nombre"
          body={nombreTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          frozen
          alignFrozen="right"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Dialog
        visible={dialogoVisible}
        style={{ width: "500px" }}
        header={
          marcaSeleccionada?.id
            ? "Editar Marca"
            : "Nueva Marca"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <MarcaForm
          marca={marcaSeleccionada}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
};

export default Marca;
