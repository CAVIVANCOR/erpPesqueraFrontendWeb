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
   */
  const handleSaveForm = () => {
    setShowForm(false);
    setTarifaSeleccionada(null);
    cargarTarifas();
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
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          backgroundColor: rowData.activo ? "#d4edda" : "#f8d7da",
          color: rowData.activo ? "#155724" : "#721c24",
        }}
      >
        {rowData.activo ? "ACTIVO" : "INACTIVO"}
      </span>
    );
  };

  /**
   * Template para columna de acciones
   */
  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning"
          onClick={() => handleEditarTarifa(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => handleEliminarTarifa(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  /**
   * Header del diálogo
   */
  const dialogHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <i className="pi pi-map-marker" style={{ fontSize: "1.5rem" }}></i>
      <span>
        Tarifas por Ruta -{" "}
        {costoIncoterm?.producto?.descripcionArmada || "Costo"}
      </span>
    </div>
  );

  /**
   * Footer del diálogo
   */
  const dialogFooter = (
    <div>
      <Button
        label="Cerrar"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-secondary"
      />
    </div>
  );

  return (
    <>
      <ConfirmDialog />
      <Dialog
        visible={visible}
        onHide={onHide}
        header={dialogHeader}
        footer={!showForm ? dialogFooter : null}
        style={{ width: "90vw" }}
        maximizable
        modal
      >
        {!showForm ? (
          <div>
            {/* Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: "#495057" }}>
                  Tarifas Configuradas
                </h3>
                <small style={{ color: "#6c757d" }}>
                  {tarifas.length} tarifa(s) registrada(s)
                </small>
              </div>
              <Button
                label="Nueva Tarifa"
                icon="pi pi-plus"
                className="p-button-success"
                onClick={handleNuevaTarifa}
              />
            </div>

            {/* Tabla de Tarifas */}
            <DataTable
              value={tarifas}
              loading={loading}
              emptyMessage="No hay tarifas configuradas"
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column
                field="id"
                header="ID"
                style={{ width: "80px" }}
                sortable
              />
              <Column
                header="Origen"
                body={rutaOrigenTemplate}
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                header="Destino"
                body={rutaDestinoTemplate}
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                header="Proveedor"
                body={proveedorTemplate}
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                header="Tarifa"
                body={tarifaTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                header="Vigencia"
                body={vigenciaTemplate}
                style={{ minWidth: "200px" }}
              />
              <Column
                header="Estado"
                body={estadoTemplate}
                style={{ width: "120px" }}
              />
              <Column
                header="Acciones"
                body={accionesTemplate}
                style={{ width: "150px" }}
              />
            </DataTable>
          </div>
        ) : (
          <div>
            {/* Formulario de Tarifa */}
            <TarifaRutaForm
              tarifa={tarifaSeleccionada}
              costoIncotermId={costoIncoterm?.id}
              onSave={handleSaveForm}
              onCancel={handleCancelForm}
              toast={toastRef}
            />
          </div>
        )}
      </Dialog>
    </>
  );
};

export default TarifasPorRutaDialog;