/**
 * Tabla reutilizable para gestión de Gastos Planificados
 * Componente que puede usarse tanto standalone como embebido en otros módulos
 * Implementa el patrón estándar ERP Megui con DataTable y gestión completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { getGastosPlanificados, eliminarGastoPlanificado } from "../../api/detGastosPlanificados";
import { getAllProductos } from "../../api/producto";
import { getAllMonedas } from "../../api/moneda";
import DetGastosPlanificadosForm from "./DetGastosPlanificadosForm";
import { getResponsiveFontSize } from "../../utils/utils";

/**
 * Componente DetGastosPlanificadosTable
 * Tabla reutilizable para gestión de gastos planificados
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.entregaRendirData - Datos de la entrega a rendir (tipo y ID)
 * @param {Object} props.toast - Referencia al componente Toast
 * @param {Object} props.permisos - Permisos del usuario
 * @param {boolean} props.readOnly - Modo solo lectura
 */
const DetGastosPlanificadosTable = ({ 
  entregaRendirData, 
  toast, 
  permisos = {}, 
  readOnly = false 
}) => {
  const [gastosPlanificados, setGastosPlanificados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga los gastos planificados desde la API
   */
  const cargarGastosPlanificados = async () => {
    try {
      setLoading(true);
      const data = await getGastosPlanificados(entregaRendirData);
      setGastosPlanificados(data);
    } catch (error) {
      console.error("Error al cargar gastos planificados:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el listado de gastos planificados",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga los productos desde la API
   */
  const cargarProductos = async () => {
    try {
      const data = await getAllProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  /**
   * Carga las monedas desde la API
   */
  const cargarMonedas = async () => {
    try {
      const data = await getAllMonedas();
      setMonedas(data);
    } catch (error) {
      console.error("Error al cargar monedas:", error);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    if (entregaRendirData) {
      cargarGastosPlanificados();
      cargarProductos();
      cargarMonedas();
    }
  }, [entregaRendirData]);

  /**
   * Abre el diálogo para crear nuevo gasto planificado
   */
  const abrirDialogoNuevo = () => {
    setGastoSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar gasto planificado
   */
  const editarGasto = (gasto) => {
    setGastoSeleccionado(gasto);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setGastoSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarGastosPlanificados();
  };

  /**
   * Confirma la eliminación de un gasto planificado
   */
  const confirmarEliminacion = (gasto) => {
    setConfirmState({ visible: true, row: gasto });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarGastoPlanificado(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Gasto planificado eliminado correctamente",
      });

      await cargarGastosPlanificados();
    } catch (error) {
      console.error("Error al eliminar gasto planificado:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar el gasto planificado",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Template para el producto
   */
  const productoTemplate = (rowData) => {
    return rowData.producto?.descripcionArmada || rowData.producto?.nombre || "-";
  };

  /**
   * Template para la moneda
   */
  const monedaTemplate = (rowData) => {
    return rowData.moneda?.simbolo || "-";
  };

  /**
   * Template para el monto
   */
  const montoTemplate = (rowData) => {
    const monto = Number(rowData.montoPlanificado || 0);
    return monto.toFixed(2);
  };

  /**
   * Template para acciones
   */
  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        style={{ marginRight: 8 }}
        disabled={readOnly || (!permisos.puedeVer && !permisos.puedeEditar)}
        onClick={() => {
          if (!readOnly && (permisos.puedeVer || permisos.puedeEditar)) {
            editarGasto(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        disabled={readOnly || !permisos.puedeEliminar}
        onClick={() => {
          if (!readOnly && permisos.puedeEliminar) {
            confirmarEliminacion(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <>
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> este gasto planificado?
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

      <div className="card">
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <h3>Gastos Planificados</h3>
          </div>
          <div>
            <Button
              type="button"
              label="Agregar Gasto"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              disabled={readOnly || !permisos.puedeCrear}
              onClick={abrirDialogoNuevo}
            />
          </div>
        </div>

        <DataTable
          value={gastosPlanificados}
          loading={loading}
          dataKey="id"
          size="small"
          showGridlines
          stripedRows
          style={{ fontSize: getResponsiveFontSize() }}
          emptyMessage="No se encontraron gastos planificados"
          scrollable
        >
          <Column field="id" header="ID" sortable style={{ minWidth: "60px" }} />
          <Column
            field="producto"
            header="Producto (Gasto)"
            body={productoTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="moneda"
            header="Moneda"
            body={monedaTemplate}
            sortable
            style={{ minWidth: "80px" }}
          />
          <Column
            field="montoPlanificado"
            header="Monto Planificado"
            body={montoTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
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
      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: "600px" }}
        header={
          gastoSeleccionado?.id
            ? permisos.puedeEditar && !readOnly
              ? "Editar Gasto Planificado"
              : "Ver Gasto Planificado"
            : "Nuevo Gasto Planificado"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <DetGastosPlanificadosForm
          gastoPlanificado={gastoSeleccionado}
          productos={productos}
          monedas={monedas}
          entregaRendirData={entregaRendirData}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
          readOnly={readOnly || (gastoSeleccionado && !permisos.puedeEditar)}
        />
      </Dialog>
    </>
  );
};

export default DetGastosPlanificadosTable;
