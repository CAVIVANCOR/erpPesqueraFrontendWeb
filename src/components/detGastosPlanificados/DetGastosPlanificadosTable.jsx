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
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import {
  getGastosPlanificados,
  eliminarGastoPlanificado,
} from "../../api/detGastosPlanificados";
import { getProductos } from "../../api/producto";
import { getAllMonedas } from "../../api/moneda";
import DetGastosPlanificadosForm from "./DetGastosPlanificadosForm";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import { getFamiliasProducto } from "../../api/familiaProducto";
import { getSubfamiliasProducto } from "../../api/subfamiliaProducto";

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
  monedaIdCabecera = null,
  toast,
  permisos = {},
  readOnly = false,
}) => {
  const [gastosPlanificados, setGastosPlanificados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
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
      const data = await getProductos();
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
   * Carga las familias desde la API
   */
  const cargarFamilias = async () => {
    try {
      const data = await getFamiliasProducto();
      // Filtrar: excluir Mercadería (id=1) y Servicios (id=5)
      const familiasFiltradas = data.filter(
        (f) => Number(f.id) !== 1 && Number(f.id) !== 5,
      );
      setFamilias(familiasFiltradas);
    } catch (error) {
      console.error("Error al cargar familias:", error);
    }
  };

  /**
   * Carga las subfamilias desde la API
   */
  const cargarSubfamilias = async () => {
    try {
      const data = await getSubfamiliasProducto();
      setSubfamilias(data);
    } catch (error) {
      console.error("Error al cargar subfamilias:", error);
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
      cargarFamilias();
      cargarSubfamilias();
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
  const onGuardar = () => {
    cerrarDialogo();
    cargarGastosPlanificados();
  };

  /**
   * Confirma la eliminación de un gasto planificado
   */
  const confirmarEliminacion = (gasto) => {
    setConfirmState({
      visible: true,
      row: gasto,
    });
  };

  /**
   * Elimina un gasto planificado
   */
  const eliminarGasto = async () => {
    try {
      await eliminarGastoPlanificado(confirmState.row.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Gasto planificado eliminado correctamente",
      });
      setConfirmState({ visible: false, row: null });
      cargarGastosPlanificados();
    } catch (error) {
      console.error("Error al eliminar gasto planificado:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar el gasto planificado",
      });
    }
  };

  /**
   * Template para el monto planificado
   */
  const montoTemplate = (rowData) => {
    const simbolo = rowData.moneda?.simbolo || "";
    const monto = formatearNumero(rowData.montoPlanificado, 2);
    return `${simbolo} ${monto}`;
  };

  /**
   * Template para el producto
   */
  const productoTemplate = (rowData) => {
    return rowData.producto?.descripcionArmada || rowData.producto?.nombre || "";
  };

  /**
   * Calcula el total de montos planificados
   */
  const calcularTotal = () => {
    return gastosPlanificados.reduce(
      (sum, gasto) => sum + Number(gasto.montoPlanificado || 0),
      0,
    );
  };

  /**
   * Footer con totales
   */
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="TOTAL"
          colSpan={2}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: getResponsiveFontSize(),
          }}
        />
        <Column
          footer={`S/. ${formatearNumero(calcularTotal(), 2)}`}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: getResponsiveFontSize(),
          }}
        />
        <Column footer="" />
      </Row>
    </ColumnGroup>
  );

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
            <span style={{ color: "#b71c1c" }}>eliminar</span> este gasto
            planificado?
            <br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminarGasto}
        reject={() => setConfirmState({ visible: false, row: null })}
        acceptLabel="Sí, eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
        rejectClassName="p-button-text"
      />

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: getResponsiveFontSize() }}>
            Gastos Planificados
          </h3>
          {!readOnly && permisos.puedeCrear && (
            <Button
              label="Nuevo Gasto"
              icon="pi pi-plus"
              onClick={abrirDialogoNuevo}
              className="p-button-success"
              size="small"
              type="button"
            />
          )}
        </div>

        <DataTable
          value={gastosPlanificados}
          loading={loading}
          emptyMessage="No hay gastos planificados registrados"
          footerColumnGroup={footerGroup}
          stripedRows
          showGridlines
          size="small"
        >
          <Column
            field="producto.descripcionArmada"
            header="Producto (Gasto)"
            body={productoTemplate}
            style={{ fontSize: getResponsiveFontSize() }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            style={{ fontSize: getResponsiveFontSize() }}
          />
          <Column
            field="montoPlanificado"
            header="Monto Planificado"
            body={montoTemplate}
            style={{
              textAlign: "right",
              fontSize: getResponsiveFontSize(),
            }}
          />
          <Column
            body={accionesTemplate}
            exportable={false}
            style={{ width: "8rem", textAlign: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: window.innerWidth < 768 ? "95vw" : "50vw" }}
        header={
          gastoSeleccionado
            ? "Editar Gasto Planificado"
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
          familias={familias}
          subfamilias={subfamilias}
          monedaIdCabecera={monedaIdCabecera}
          entregaRendirData={entregaRendirData}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
          readOnly={readOnly}
        />
      </Dialog>
    </>
  );
};

export default DetGastosPlanificadosTable;