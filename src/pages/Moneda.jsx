/**
 * Pantalla CRUD profesional para Moneda
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, codigoSunat, nombreLargo, simbolo, activo, createdAt, updatedAt
 * Patrón aplicado: Botón eliminar visible solo para superusuario/admin, confirmación visual profesional, búsqueda global por cualquier campo.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { getMonedas,eliminarMoneda } from '../api/moneda';
import { useAuthStore } from '../shared/stores/useAuthStore';
import MonedaForm from '../components/moneda/MonedaForm';
import { getResponsiveFontSize } from '../utils/utils';

/**
 * Componente Moneda
 * Pantalla principal para gestión de monedas
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const Moneda = () => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados del componente
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga las monedas desde la API
   */
  const cargarMonedas = async () => {
    try {
      setLoading(true);
      const data = await getMonedas();
      setMonedas(data);
    } catch (error) {
      console.error("Error al cargar monedas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el listado de monedas",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarMonedas();
  }, []);

  /**
   * Abre el diálogo para crear nueva moneda
   */
  const abrirDialogoNuevo = () => {
    setMonedaSeleccionada(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar moneda (clic en fila)
   */
  const editarMoneda = (moneda) => {
    setMonedaSeleccionada(moneda);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setMonedaSeleccionada(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarMonedas();
  };

  /**
   * Confirma la eliminación de una moneda
   * Solo visible para superusuario o admin
   */
  const confirmarEliminacion = (moneda) => {
    setConfirmState({ visible: true, row: moneda });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarMoneda(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Moneda "${confirmState.row.nombreLargo || confirmState.row.codigoSunat}" eliminada correctamente`,
      });

      await cargarMonedas();
    } catch (error) {
      console.error("Error al eliminar moneda:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la moneda",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Maneja el filtro global - búsqueda por cualquier campo
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilter(value);
  };

  /**
   * Template para el estado activo
   */
  const estadoTemplate = (rowData) => {
    return rowData.activo ? (
      <Tag value="ACTIVO" severity="success" />
    ) : (
      <Tag value="INACTIVO" severity="danger" />
    );
  };

  /**
   * Template para fechas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-";
  };

  /**
   * Template para acciones
   */
  const accionesTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(e) => {
            e.stopPropagation();
            editarMoneda(rowData);
          }}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
          />
        )}
      </>
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> la moneda{" "}
            <b>{confirmState.row ? `"${confirmState.row.nombreLargo || confirmState.row.codigoSunat}"` : ""}</b>?
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
        value={monedas}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} monedas"
        globalFilter={globalFilter}
        globalFilterFields={["codigoSunat", "nombreLargo", "simbolo"]}
        emptyMessage="No se encontraron monedas"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Monedas</h2>
            <Button
              type="button"
              label="Nueva"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              raised
              onClick={abrirDialogoNuevo}
            />
            <InputText
              type="search"
              onInput={onGlobalFilterChange}
              placeholder="Buscar monedas..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarMoneda(e.data)}
        className="datatable-responsive"
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "60px" }} />
        <Column
          field="codigoSunat"
          header="Código Sunat"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="nombreLargo"
          header="Nombre Largo"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="simbolo"
          header="Símbolo"
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="activo"
          header="Estado"
          body={estadoTemplate}
          sortable
          style={{ minWidth: "100px" }}
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
        header={monedaSeleccionada?.id ? "Editar Moneda" : "Nueva Moneda"}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <MonedaForm
          moneda={monedaSeleccionada}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default Moneda;
