/**
 * Pantalla CRUD profesional para UnidadMedida
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, nombre (VarChar 60), simbolo (VarChar 20), factorConversion, esMedidaMetrica, productos[]
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
import { Tag } from "primereact/tag";
import {
  getUnidadesMedida,
  eliminarUnidadMedida,
} from "../api/unidadMedida";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import UnidadMedidaForm from "../components/unidadMedida/UnidadMedidaForm";
import { getResponsiveFontSize } from "../utils/utils";
import { Navigate } from "react-router-dom";

/**
 * Componente UnidadMedida
 * Pantalla principal para gestión de unidades de medida
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const UnidadMedida = ({ ruta }) => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  // Estados del componente
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [unidadMedidaSeleccionada, setUnidadMedidaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga las unidades de medida desde la API
   */
  const cargarUnidadesMedida = async () => {
    try {
      setLoading(true);
      const data = await getUnidadesMedida();

      // Normalizar IDs según regla ERP Megui
      const unidadesNormalizadas = data.map((unidad) => ({
        ...unidad,
        id: Number(unidad.id),
      }));

      setUnidadesMedida(unidadesNormalizadas);
    } catch (error) {
      console.error("Error al cargar unidades de medida:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las unidades de medida",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarUnidadesMedida();
  }, []);

  /**
   * Abre el diálogo para crear nueva unidad de medida
   */
  const abrirDialogoNuevo = () => {
    setUnidadMedidaSeleccionada(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar unidad de medida (clic en fila)
   */
  const editarUnidadMedida = (unidadMedida) => {
    setUnidadMedidaSeleccionada(unidadMedida);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setUnidadMedidaSeleccionada(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarUnidadesMedida();
  };

  /**
   * Confirma la eliminación de una unidad de medida
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (unidadMedida) => {
    setConfirmState({ visible: true, row: unidadMedida });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarUnidadMedida(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Unidad de medida "${confirmState.row.nombre}" eliminada correctamente`,
      });

      await cargarUnidadesMedida();
    } catch (error) {
      console.error("Error al eliminar unidad de medida:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la unidad de medida",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Template para el nombre de la unidad de medida
   */
  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
        {rowData.nombre}
      </span>
    );
  };

  /**
   * Template para el símbolo de la unidad de medida
   */
  const simboloTemplate = (rowData) => {
    return (
      <Tag value={rowData.simbolo} severity="info" style={{ fontSize: "0.8rem" }} />
    );
  };

  /**
   * Template para el factor de conversión
   */
  const factorConversionTemplate = (rowData) => {
    return rowData.factorConversion 
      ? Number(rowData.factorConversion).toFixed(6)
      : "N/A";
  };

  /**
   * Template para medida métrica
   */
  const medidaMetricaTemplate = (rowData) => {
    return rowData.esMedidaMetrica ? (
      <Tag value="MÉTRICA" severity="success" />
    ) : (
      <Tag value="NO MÉTRICA" severity="warning" />
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
            editarUnidadMedida(rowData);
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> la unidad de medida{" "}
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
        value={unidadesMedida}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} unidades de medida"
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "simbolo"]}
        emptyMessage="No se encontraron unidades de medida"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Unidades de Medida</h2>
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
              placeholder="Buscar unidades de medida..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarUnidadMedida(e.data)}
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
          style={{ minWidth: "150px" }}
        />
        <Column
          field="simbolo"
          header="Símbolo"
          body={simboloTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="factorConversion"
          header="Factor Conversión"
          body={factorConversionTemplate}
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          field="esMedidaMetrica"
          header="Tipo"
          body={medidaMetricaTemplate}
          sortable
          style={{ minWidth: "120px" }}
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
          unidadMedidaSeleccionada?.id
            ? "Editar Unidad de Medida"
            : "Nueva Unidad de Medida"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <UnidadMedidaForm
          unidadMedida={unidadMedidaSeleccionada}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
};

export default UnidadMedida;
