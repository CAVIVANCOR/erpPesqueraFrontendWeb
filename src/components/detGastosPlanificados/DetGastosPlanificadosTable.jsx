/**
 * Tabla reutilizable para gestión de Gastos Planificados
 * Componente que puede usarse tanto standalone como embebido en otros módulos
 * Implementa el patrón estándar ERP Megui con DataTable y gestión completa
 * @author ERP Megui
 * @version 1.0.0
 */
import React, { useState, useEffect, useMemo } from "react";
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
// Colores específicos para Familia, Subfamilia y Producto (coherencia con ProductoSelector)
const COLORES_TEXTO = {
  familia: "#1976D2", // 🔵 Azul
  subfamilia: "#2E7D32", // 🟢 Verde
  producto: "#8B0000", // 🍷 Rojo oscuro conche vino
};
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
   * Memorizar el valor serializado de entregaRendirData para evitar loops infinitos
   */
  const entregaRendirDataKey = useMemo(() => {
    return JSON.stringify(entregaRendirData);
  }, [entregaRendirData]);

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    if (entregaRendirData) {
      cargarGastosPlanificados();
      cargarProductos();
      cargarMonedas();
    }
  }, [entregaRendirDataKey]);

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
        detail: "Error al eliminar el gasto planificado",
      });
    }
  };

  /**
   * Template para mostrar el producto
   */
  const productoTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.producto, fontWeight: "bold" }}>
        {rowData.producto?.descripcionBase ||
          rowData.producto?.descripcionArmada ||
          "N/A"}
      </span>
    );
  };
  /**
   * Template para mostrar la familia
   */
  const familiaTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.familia, fontWeight: "bold" }}>
        {rowData.producto?.familia?.nombre || "Sin familia"}
      </span>
    );
  };

  /**
   * Template para mostrar la subfamilia
   */
  const subfamiliaTemplate = (rowData) => {
    return (
      <span style={{ color: COLORES_TEXTO.subfamilia, fontWeight: "bold" }}>
        {rowData.producto?.subfamilia?.nombre || "Sin subfamilia"}
      </span>
    );
  };
  /**
   * Template para mostrar el monto
   */
  const montoTemplate = (rowData) => {
    const simbolo = rowData.moneda?.simbolo || "";
    return `${simbolo} ${formatearNumero(rowData.montoPlanificado)}`;
  };

  /**
   * Template para las acciones
   */
  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        {!readOnly && permisos.puedeEditar && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-warning"
            onClick={() => editarGasto(rowData)}
            tooltip="Editar"
            tooltipOptions={{ position: "top" }}
            size="small"
            type="button"
          />
        )}
        {!readOnly && permisos.puedeEliminar && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
            size="small"
            type="button"
          />
        )}
      </div>
    );
  };

  /**
   * Calcular el total de montos planificados
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
          footer="Total:"
          colSpan={4}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: getResponsiveFontSize(),
          }}
        />
        <Column
          footer={`${monedas.find((m) => m.id === monedaIdCabecera)?.simbolo || ""} ${formatearNumero(calcularTotal())}`}
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

  return (
    <>
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message="¿Está seguro de eliminar este gasto planificado?"
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
            field="producto.familia.nombre"
            header="Familia"
            body={familiaTemplate}
            sortable
            style={{ fontSize: getResponsiveFontSize(), minWidth: "100px" }}
          />
          <Column
            field="producto.subfamilia.nombre"
            header="Subfamilia"
            body={subfamiliaTemplate}
            sortable
            style={{ fontSize: getResponsiveFontSize(), minWidth: "100px" }}
          />
          <Column
            field="producto.descripcionBase"
            header="Producto (Gasto)"
            body={productoTemplate}
            sortable
            style={{ fontSize: getResponsiveFontSize(), minWidth: "150px" }}
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
