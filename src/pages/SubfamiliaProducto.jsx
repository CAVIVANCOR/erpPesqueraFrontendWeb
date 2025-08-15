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
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import {
  getSubfamiliasProducto,
  eliminarSubfamiliaProducto,
} from "../api/subfamiliaProducto";
import { getFamiliasProducto } from "../api/familiaProducto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import SubfamiliaProductoForm from "../components/subfamiliaProducto/SubfamiliaProductoForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente SubfamiliaProducto
 * Pantalla principal para gestión de subfamilias de producto
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global, relación con familia.
 */
const SubfamiliaProducto = () => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados del componente
  const [subfamiliasProducto, setSubfamiliasProducto] = useState([]);
  const [familiasProducto, setFamiliasProducto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [subfamiliaSeleccionada, setSubfamiliaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
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
    setSubfamiliaSeleccionada(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar subfamilia de producto (clic en fila)
   */
  const editarSubfamiliaProducto = (subfamilia) => {
    setSubfamiliaSeleccionada(subfamilia);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
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
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (subfamilia) => {
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
    const familia = familiasProducto.find(f => Number(f.id) === Number(rowData.familiaId));
    
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
   * Incluye botón de editar y eliminar (eliminar solo para superusuario/admin)
   * Estilo idéntico a TiposDocIdentidad.jsx: p-button-text, iconos pequeños
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
            editarSubfamiliaProducto(rowData);
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> la subfamilia de producto{" "}
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
        value={subfamiliasProducto}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} subfamilias de producto"
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "familiaProducto.nombre"]}
        emptyMessage="No se encontraron subfamilias de producto"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Subfamilias de Producto</h2>
            <Button
              type="button"
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              raised
              onClick={abrirDialogoNuevo}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar subfamilias de producto..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarSubfamiliaProducto(e.data)}
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
          subfamiliaSeleccionada?.id
            ? "Editar Subfamilia de Producto"
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
        />
      </Dialog>
    </div>
  );
};

export default SubfamiliaProducto;
