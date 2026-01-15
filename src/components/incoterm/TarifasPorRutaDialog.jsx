/**
 * Diálogo para gestión de Tarifas por Ruta
 * Muestra tabla de tarifas y permite crear/editar/eliminar
 * @module components/incoterm/TarifasPorRutaDialog
 */

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import {
  getTarifasPorCostoIncoterm,
  eliminarTarifaCostoExportacionRuta,
} from "../../api/tarifaCostoExportacionRuta";
import TarifaRutaForm from "./TarifaRutaForm";

/**
 * Componente TarifasPorRutaDialog
 */
const TarifasPorRutaDialog = ({
  visible,
  onHide,
  costoIncoterm,
  toast,
}) => {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState(null);
  const toastRef = useRef(toast);

  /**
   * Carga las tarifas del costo de Incoterm
   */
  const cargarTarifas = async () => {
    if (!costoIncoterm?.id) return;

    try {
      setLoading(true);
      const data = await getTarifasPorCostoIncoterm(Number(costoIncoterm.id));
      setTarifas(data || []);
    } catch (error) {
      console.error("Error al cargar tarifas:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las tarifas por ruta",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar tarifas cuando se abre el diálogo
   */
  useEffect(() => {
    if (visible && costoIncoterm?.id) {
      cargarTarifas();
      setShowForm(false);
      setTarifaSeleccionada(null);
    }
  }, [visible, costoIncoterm]);

  /**
   * Maneja la creación de nueva tarifa
   */
  const handleNuevaTarifa = () => {
    setTarifaSeleccionada(null);
    setShowForm(true);
  };

  /**
   * Maneja la edición de tarifa
   */
  const handleEditarTarifa = (tarifa) => {
    setTarifaSeleccionada(tarifa);
    setShowForm(true);
  };

  /**
   * Maneja la eliminación de tarifa
   */
  const handleEliminarTarifa = (tarifa) => {
    confirmDialog({
      message: `¿Está seguro de eliminar esta tarifa?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          await eliminarTarifaCostoExportacionRuta(Number(tarifa.id));
          toastRef.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Tarifa eliminada correctamente",
          });
          cargarTarifas();
        } catch (error) {
          console.error("Error al eliminar tarifa:", error);
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar la tarifa",
          });
        }
      },
    });
  };

  /**
   * Maneja el guardado exitoso del formulario
   * IMPORTANTE: Solo cierra el formulario, NO el diálogo principal
   */
  const handleSaveForm = () => {
    setShowForm(false);
    setTarifaSeleccionada(null);
    cargarTarifas();
    // NO llamar a onHide() aquí - eso cerraría el diálogo principal
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancelForm = () => {
    setShowForm(false);
    setTarifaSeleccionada(null);
  };

  /**
   * Template para columna de ruta origen
   */
  const rutaOrigenTemplate = (rowData) => {
    const partes = [];
    if (rowData.paisOrigen?.nombre) partes.push(rowData.paisOrigen.nombre);
    if (rowData.puertoOrigen?.nombre) partes.push(rowData.puertoOrigen.nombre);
    return partes.length > 0 ? partes.join(" - ") : "-";
  };

  /**
   * Template para columna de ruta destino
   */
  const rutaDestinoTemplate = (rowData) => {
    const partes = [];
    if (rowData.paisDestino?.nombre) partes.push(rowData.paisDestino.nombre);
    if (rowData.puertoDestino?.nombre) partes.push(rowData.puertoDestino.nombre);
    return partes.length > 0 ? partes.join(" - ") : "-";
  };

  /**
   * Template para columna de proveedor
   */
  const proveedorTemplate = (rowData) => {
    return rowData.proveedor?.razonSocial || "-";
  };

  /**
   * Template para columna de tarifa
   */
  const tarifaTemplate = (rowData) => {
    const moneda = rowData.moneda?.codigoSunat || "";
    const valor = Number(rowData.valorVenta).toFixed(2);
    return `${moneda} ${valor}`;
  };

  /**
   * Template para columna de vigencia
   */
  const vigenciaTemplate = (rowData) => {
    const desde = new Date(rowData.fechaVigenciaDesde).toLocaleDateString("es-PE");
    const hasta = rowData.fechaVigenciaHasta
      ? new Date(rowData.fechaVigenciaHasta).toLocaleDateString("es-PE")
      : "Indefinida";
    return `${desde} - ${hasta}`;
  };

  /**
   * Template para columna de estado
   */
  const estadoTemplate = (rowData) => {
    return (
      <span
        className={`p-badge ${
          rowData.activo ? "p-badge-success" : "p-badge-danger"
        }`}
      >
        {rowData.activo ? "Activo" : "Inactivo"}
      </span>
    );
  };

  /**
   * Template para columna de acciones
   */
  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
        <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning p-button-sm"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          onClick={(e) => {
            e.stopPropagation();
            handleEditarTarifa(rowData);
          }}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          onClick={(e) => {
            e.stopPropagation();
            handleEliminarTarifa(rowData);
          }}
        />
      </div>
    );
  };

  /**
   * Maneja el cierre del diálogo principal
   */
  const handleHideDialog = () => {
    setShowForm(false);
    setTarifaSeleccionada(null);
    onHide();
  };

  return (
    <>
      <ConfirmDialog />
      <Dialog
        visible={visible}
        style={{ width: "90vw", maxWidth: "1200px" }}
        header={
          <div>
            <h3 style={{ margin: 0 }}>Tarifas por Ruta</h3>
            <small style={{ color: "#6c757d" }}>
              {costoIncoterm?.producto?.descripcionArmada || "Costo de Exportación"}
            </small>
          </div>
        }
        modal
        className="p-fluid"
        onHide={handleHideDialog}
        maximizable
        closable={!showForm}
        closeOnEscape={!showForm}
      >
        {!showForm ? (
          <div>
            {/* Tabla de Tarifas */}
            <DataTable
              value={tarifas}
              loading={loading}
              dataKey="id"
              size="small"
              showGridlines
              stripedRows
              paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              emptyMessage="No hay tarifas configuradas para este costo"
              header={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ margin: 0 }}>Lista de Tarifas</h4>
                  <Button
                    type="button"
                    label="Nueva Tarifa"
                    icon="pi pi-plus"
                    className="p-button-success"
                    onClick={handleNuevaTarifa}
                  />
                </div>
              }
            >
              <Column
                field="puertoOrigen.nombre"
                header="Origen"
                body={rutaOrigenTemplate}
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                field="puertoDestino.nombre"
                header="Destino"
                body={rutaDestinoTemplate}
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                field="proveedor.razonSocial"
                header="Proveedor"
                body={proveedorTemplate}
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                field="moneda.codigoSunat"
                header="Tarifa"
                body={tarifaTemplate}
                sortable
                style={{ width: "120px", textAlign: "right" }}
              />
              <Column
                field="fechaVigenciaDesde"
                header="Vigencia"
                body={vigenciaTemplate}
                sortable
                style={{ width: "200px" }}
              />
              <Column
                field="activo"
                header="Estado"
                body={estadoTemplate}
                sortable
                style={{ width: "100px", textAlign: "center" }}
              />
              <Column
                header="Acciones"
                body={accionesTemplate}
                style={{ width: "100px", textAlign: "center" }}
              />
            </DataTable>

            {/* Botón Cerrar */}
            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <Button
                type="button"
                label="Cerrar"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={handleHideDialog}
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Formulario de Tarifa */}
            <TarifaRutaForm
              tarifa={tarifaSeleccionada}
              costoIncotermId={costoIncoterm?.id}
              onSave={handleSaveForm}
              onCancel={handleCancelForm}
              toast={toast}
            />
          </div>
        )}
      </Dialog>
    </>
  );
};

export default TarifasPorRutaDialog;