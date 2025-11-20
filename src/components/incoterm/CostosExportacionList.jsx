/**
 * Componente de lista CRUD para Costos de Exportación por Incoterm
 * Se integra dentro del formulario de Incoterm para gestionar los costos aplicables
 * @module components/incoterm/CostosExportacionList
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import {
  getCostosExportacionPorIncotermPorIncoterm,
  eliminarCostoExportacionPorIncoterm,
} from "../../api/costoExportacionPorIncoterm";
import CostoExportacionForm from "./CostoExportacionForm";

/**
 * Componente CostosExportacionList
 * Lista y gestiona los costos de exportación asociados a un Incoterm
 */
const CostosExportacionList = ({ incotermId, readOnly = false }) => {
  const toast = useRef(null);

  // Estados
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [costoSeleccionado, setCostoSeleccionado] = useState(null);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga los costos del Incoterm
   */
  const cargarCostos = async () => {
    if (!incotermId) return;

    try {
      setLoading(true);
      const data = await getCostosExportacionPorIncotermPorIncoterm(incotermId);

      // Normalizar IDs
      const costosNormalizados = data.map((costo) => ({
        ...costo,
        id: Number(costo.id),
        incotermId: Number(costo.incotermId),
        productoId: Number(costo.productoId),
      }));

      setCostos(costosNormalizados);
    } catch (error) {
      console.error("Error al cargar costos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los costos de exportación",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar costos al montar o cambiar incotermId
   */
  useEffect(() => {
    if (incotermId) {
      cargarCostos();
    }
  }, [incotermId]);

  /**
   * Abre el diálogo para crear nuevo costo
   */
  const abrirDialogoNuevo = () => {
    if (readOnly || !incotermId) return;
    setCostoSeleccionado(null);
    setModoEdicion(false);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar costo
   */
  const editarCosto = (costo) => {
    if (readOnly) return;
    setCostoSeleccionado(costo);
    setModoEdicion(true);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setModoEdicion(false);
    setCostoSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarCostos();
  };

  /**
   * Confirma la eliminación de un costo
   */
  const confirmarEliminacion = (costo) => {
    if (readOnly) return;
    setConfirmState({ visible: true, row: costo });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarCostoExportacionPorIncoterm(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Costo "${confirmState.row.producto?.nombre}" eliminado correctamente`,
      });

      await cargarCostos();
    } catch (error) {
      console.error("Error al eliminar costo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el costo de exportación",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Template para el nombre del producto
   */
  const productoTemplate = (rowData) => {
    const producto = rowData.producto || {};
    const descripcionArmada = producto.descripcionArmada?.trim();

    return (
      <div>
        <div style={{ fontWeight: "bold" }}>
          {descripcionArmada && descripcionArmada.length > 0 ? descripcionArmada : "S/D"}
        </div>
      </div>
    );
  };


  /**
   * Template para responsable
   */
  const responsableTemplate = (rowData) => {
    return (
      <Badge
        value={rowData.esResponsabilidadVendedor ? "VENDEDOR" : "COMPRADOR"}
        severity={rowData.esResponsabilidadVendedor ? "info" : "warning"}
      />
    );
  };

  /**
   * Template para activo
   */
  const activoTemplate = (rowData) => {
    return (
      <Badge
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  /**
   * Template para obligatorio
   */
  const obligatorioTemplate = (rowData) => {
    return (
      <Badge
        value={rowData.esObligatorio ? "SÍ" : "NO"}
        severity={rowData.esObligatorio ? "success" : "secondary"}
      />
    );
  };

  /**
   * Template para proveedor default
   */
  const proveedorTemplate = (rowData) => {
    return rowData.proveedorDefault?.razonSocial || "-";
  };

  /**
   * Template para moneda default
   */
  const monedaTemplate = (rowData) => {
    return rowData.monedaDefault?.codigoSunat || "-";
  };

  /**
   * Template para valor default
   */
  const valorTemplate = (rowData) => {
    if (!rowData.valorVentaDefault) return "-";
    const moneda = rowData.monedaDefault?.codigoSunat || "";
    return `${moneda} ${Number(rowData.valorVentaDefault).toFixed(2)}`;
  };

  /**
   * Template para requiere documento
   */
  const requiereDocumentoTemplate = (rowData) => {
    return (
      <Badge
        value={rowData.requiereDocumento ? "SÍ" : "NO"}
        severity={rowData.requiereDocumento ? "warning" : "secondary"}
      />
    );
  };

  /**
   * Template para acciones
   */
  const accionesTemplate = (rowData) => {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "row", 
          gap: "0.25rem", 
          justifyContent: "center",
          alignItems: "center"
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info p-button-sm"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          disabled={readOnly}
          style={{ width: "28px", height: "28px", padding: "0" }}
          onClick={(e) => {
            e.stopPropagation();
            editarCosto(rowData);
          }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={readOnly}
          style={{ width: "28px", height: "28px", padding: "0" }}
          onClick={(e) => {
            e.stopPropagation();
            confirmarEliminacion(rowData);
          }}
        />
      </div>
    );
  };

  // Si no hay incotermId, mostrar mensaje
  if (!incotermId) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#666",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <i
          className="pi pi-info-circle"
          style={{ fontSize: "2rem", marginBottom: "1rem" }}
        />
        <p style={{ margin: 0 }}>
          Guarde el Incoterm primero para poder agregar costos de exportación
        </p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .compact-row {
          height: 35px !important;
          line-height: 1.2 !important;
        }
        .compact-row td {
          padding: 0.25rem !important;
          vertical-align: middle !important;
        }
        .p-badge {
          font-size: 0.7rem !important;
          padding: 0.15rem 0.4rem !important;
        }
      `}</style>
      <Toast ref={toast} />

      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span>
            ¿Está seguro de que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el costo{" "}
            <b>
              {confirmState.row ? `"${confirmState.row.producto?.nombre}"` : ""}
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
        value={costos}
        loading={loading}
        dataKey="id"
        size="small"
        showGridlines
        stripedRows
        selectionMode="single"
        onRowClick={(e) => editarCosto(e.data)}
        style={{ cursor: "pointer", fontSize: "11px" }}
        rowClassName={() => "compact-row"}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 15, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} costos"
        emptyMessage="No hay costos configurados para este Incoterm"
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
              <h2>Costos de Exportación Aplicables</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Agregar Costo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                disabled={readOnly}
                onClick={abrirDialogoNuevo}
              />
            </div>
          </div>
        }
      >
        <Column
          field="orden"
          header="Ord"
          sortable
          style={{ width: "50px", textAlign: "center", padding: "0.25rem" }}
        />
        <Column
          field="producto.nombre"
          header="Producto/Costo"
          body={productoTemplate}
          sortable
          style={{ minWidth: "200px", maxWidth: "300px", padding: "0.25rem" }}
        />
        <Column
          field="esResponsabilidadVendedor"
          header="Resp."
          body={responsableTemplate}
          sortable
          style={{ width: "90px", textAlign: "center", padding: "0.25rem" }}
        />
        <Column
          field="esObligatorio"
          header="Oblig."
          body={obligatorioTemplate}
          sortable
          style={{ width: "70px", textAlign: "center", padding: "0.25rem" }}
        />
        <Column
          field="proveedorDefault.razonSocial"
          header="Proveedor"
          body={proveedorTemplate}
          sortable
          style={{ minWidth: "150px", maxWidth: "250px", padding: "0.25rem" }}
        />
        <Column
          field="monedaDefault.codigoSunat"
          header="Mon."
          body={monedaTemplate}
          sortable
          style={{ width: "60px", textAlign: "center", padding: "0.25rem" }}
        />
        <Column
          field="valorVentaDefault"
          header="Valor"
          body={valorTemplate}
          sortable
          style={{ width: "90px", textAlign: "right", padding: "0.25rem" }}
        />
        <Column
          field="requiereDocumento"
          header="Doc."
          body={requiereDocumentoTemplate}
          sortable
          style={{ width: "60px", textAlign: "center", padding: "0.25rem" }}
        />
        <Column
          field="activo"
          header="Estado"
          body={activoTemplate}
          sortable
          style={{ width: "80px", textAlign: "center", padding: "0.25rem" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          frozen
          alignFrozen="right"
          style={{ width: "90px", textAlign: "center", padding: "0.25rem" }}
        />
      </DataTable>

      <Dialog
        visible={dialogoVisible}
        style={{ width: "1000px" }}
        header={
          modoEdicion
            ? "Editar Costo de Exportación"
            : "Nuevo Costo de Exportación"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <CostoExportacionForm
          costo={costoSeleccionado}
          incotermId={incotermId}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default CostosExportacionList;