/**
 * Pantalla CRUD profesional para SubfamiliaProducto
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, nombre (VarChar 80), familiaProductoId, familiaProducto, productos[]
 * Patrón aplicado: Botón eliminar visible solo para superusuario/admin, confirmación visual profesional, búsqueda global, relación con FamiliaProducto.
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
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import {
  getSubfamiliasProducto,
  eliminarSubfamiliaProducto,
} from "../api/subfamiliaProducto";
import { getFamiliasProducto } from "../api/familiaProducto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import SubfamiliaProductoForm from "../components/subfamiliaProducto/SubfamiliaProductoForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente SubfamiliaProducto
 * Pantalla principal para gestión de subfamilias de producto
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global, relación con familia.
 */
const SubfamiliaProducto = ({ ruta }) => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Estados del componente
  const [subfamiliasProducto, setSubfamiliasProducto] = useState([]);
  const [familiasProducto, setFamiliasProducto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [subfamiliaSeleccionada, setSubfamiliaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [familiaFiltro, setFamiliaFiltro] = useState(null);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga las subfamilias de producto desde la API
   */
  const cargarSubfamiliasProducto = async () => {
    try {
      setLoading(true);
      const data = await getSubfamiliasProducto();

      // Normalizar IDs según regla ERP Megui
      const subfamiliasNormalizadas = data.map((subfamilia) => ({
        ...subfamilia,
        id: Number(subfamilia.id),
        familiaProductoId: Number(subfamilia.familiaProductoId),
      }));

      setSubfamiliasProducto(subfamiliasNormalizadas);
    } catch (error) {
      console.error("Error al cargar subfamilias de producto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las subfamilias de producto",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga las familias de producto para el dropdown
   */
  const cargarFamiliasProducto = async () => {
    try {
      const data = await getFamiliasProducto();

      // Normalizar IDs según regla ERP Megui
      const familiasNormalizadas = data.map((familia) => ({
        ...familia,
        id: Number(familia.id),
      }));

      setFamiliasProducto(familiasNormalizadas);
    } catch (error) {
      console.error("Error al cargar familias de producto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las familias de producto",
      });
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarSubfamiliasProducto();
    cargarFamiliasProducto();
  }, []);

  /**
   * Abre el diálogo para crear nueva subfamilia de producto
   */
  const abrirDialogoNuevo = () => {
    if (!permisos.puedeCrear) return;
    setSubfamiliaSeleccionada(null);
    setModoEdicion(false);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar subfamilia de producto (clic en fila)
   */
  const editarSubfamiliaProducto = (subfamilia) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) return;
    setSubfamiliaSeleccionada(subfamilia);
    setModoEdicion(true);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setModoEdicion(false);
    setSubfamiliaSeleccionada(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarSubfamiliasProducto();
  };

  /**
   * Confirma la eliminación de una subfamilia de producto
   * Solo permitido si tiene permisos de eliminación
   */
  const confirmarEliminacion = (subfamilia) => {
    if (!permisos.puedeEliminar) return;
    setConfirmState({ visible: true, row: subfamilia });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarSubfamiliaProducto(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Subfamilia de producto "${confirmState.row.nombre}" eliminada correctamente`,
      });

      await cargarSubfamiliasProducto();
    } catch (error) {
      console.error("Error al eliminar subfamilia de producto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la subfamilia de producto",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Template para el nombre de la subfamilia de producto
   */
  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
        {rowData.nombre}
      </span>
    );
  };

  /**
   * Template para mostrar la familia de producto
   */
  const familiaTemplate = (rowData) => {
    // Buscar la familia en el array de familias cargadas usando familiaId
    const familia = familiasProducto.find(
      (f) => Number(f.id) === Number(rowData.familiaId)
    );

    return (
      <span style={{ fontWeight: "500", color: "#495057" }}>
        {familia?.nombre || "N/A"}
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
   * Incluye botón de editar y eliminar (deshabilitados según permisos)
   * Estilo idéntico a Empresas.jsx: botones siempre visibles, deshabilitados según permisos
   */
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={(e) => {
            e.stopPropagation();
            if (permisos.puedeVer || permisos.puedeEditar) {
              editarSubfamiliaProducto(rowData);
            }
          }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeEliminar}
          onClick={(e) => {
            e.stopPropagation();
            if (permisos.puedeEliminar) {
              confirmarEliminacion(rowData);
            }
          }}
        />
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> la subfamilia de
            producto{" "}
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
        value={subfamiliasProducto.filter((subfamilia) =>
          familiaFiltro
            ? Number(subfamilia.familiaId) === Number(familiaFiltro)
            : true
        )}
        loading={loading}
        dataKey="id"
        size="small"
        showGridlines
        stripedRows
        selectionMode="single"
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => editarSubfamiliaProducto(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} subfamilias de producto"
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "familiaProducto.nombre"]}
        emptyMessage="No se encontraron subfamilias de producto"
        header={
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Subfamilias de Producto</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                raised
                disabled={!permisos.puedeCrear}
                onClick={abrirDialogoNuevo}
              />
            </div>
            <div style={{ flex: 2 }}>
              <Dropdown
                value={familiaFiltro}
                options={familiasProducto}
                onChange={(e) => setFamiliaFiltro(e.value)}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Filtrar por Familia"
                showClear
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <InputText
                type="search"
                value={globalFilter}
                onInput={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar subfamilias..."
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1.5 }}>
              <Button
                type="button"
                icon="pi pi-filter-slash"
                className="p-button-outlined p-button-secondary"
                label="Limpiar Filtros"
                tooltip="Limpiar filtros"
                tooltipOptions={{ position: "top" }}
                disabled={!familiaFiltro && !globalFilter}
                onClick={() => {
                  setFamiliaFiltro(null);
                  setGlobalFilter("");
                }}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        }
        scrollable
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
          field="familiaProducto.nombre"
          header="Familia"
          body={familiaTemplate}
          sortable
          style={{ minWidth: "180px" }}
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
        style={{ width: "600px" }}
        header={
          modoEdicion
            ? permisos.puedeEditar
              ? "Editar Subfamilia de Producto"
              : "Ver Subfamilia de Producto"
            : "Nueva Subfamilia de Producto"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <SubfamiliaProductoForm
          subfamiliaProducto={subfamiliaSeleccionada}
          familiasProducto={familiasProducto}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default SubfamiliaProducto;
