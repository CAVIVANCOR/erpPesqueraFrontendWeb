// src/components/movimientoAlmacen/StockDetalladoDialog.jsx
// Componente NIVEL 3: Muestra stock detallado con todas las variables de trazabilidad
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { getSaldosDetProductoClienteConFiltros } from "../../api/saldosDetProductoCliente";
import { format } from "date-fns";

/**
 * Componente para mostrar stock detallado con variables de trazabilidad
 * @param {boolean} visible - Visibilidad del diálogo
 * @param {function} onHide - Callback al cerrar
 * @param {Object} producto - Producto seleccionado
 * @param {Object} almacen - Almacén seleccionado
 * @param {number} empresaId - ID de la empresa
 * @param {number} almacenId - ID del almacén
 * @param {number} clienteId - ID del cliente
 * @param {boolean} esCustodia - Si es mercadería en custodia
 */
export default function StockDetalladoDialog({
  visible,
  onHide,
  producto,
  almacen,
  empresaId,
  almacenId,
  clienteId,
  esCustodia,
}) {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saldosDetallados, setSaldosDetallados] = useState([]);

  useEffect(() => {
    if (visible && producto && almacenId) {
      cargarStockDetallado();
    }
  }, [visible, producto, almacenId, empresaId, clienteId, esCustodia]);

  /**
   * Carga stock detallado con todas las variables de trazabilidad
   */
  const cargarStockDetallado = async () => {
    if (!empresaId || !almacenId || !clienteId || !producto?.id) return;

    setLoading(true);
    try {
      const filtros = {
        empresaId,
        almacenId,
        productoId: producto.id,
        clienteId,
        esCustodia,
        soloConSaldo: true, // Solo registros con saldo > 0
      };

      const saldos = await getSaldosDetProductoClienteConFiltros(filtros);
      setSaldosDetallados(saldos);
    } catch (error) {
      console.error("Error al cargar stock detallado:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar stock detallado",
      });
    } finally {
      setLoading(false);
    }
  };

  // Templates de columnas
  const loteContenedorTemplate = (rowData) => {
    return (
      <div>
        <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
          {rowData.lote || "SIN LOTE"}
        </div>
        {rowData.numContenedor && (
          <div style={{
            fontSize: "0.75em",
            color: "#666",
            marginBottom: "0.25rem"
          }}>
            Cont: {rowData.numContenedor}
          </div>
        )}
        {rowData.nroSerie && (
          <div style={{
            fontSize: "0.75em",
            color: "#1976d2",
            backgroundColor: "#e3f2fd",
            padding: "0.15rem 0.4rem",
            borderRadius: "3px",
            display: "inline-block",
            fontWeight: "500"
          }}>
            Serie: {rowData.nroSerie}
          </div>
        )}
      </div>
    );
  };

  const fechasTemplate = (rowData) => {
    // Verificar si está vencido
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVenc = rowData.fechaVencimiento ? new Date(rowData.fechaVencimiento) : null;
    const estaVencido = fechaVenc && fechaVenc < hoy;

    return (
      <div style={{ fontSize: "0.75em", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {rowData.fechaIngreso && (
          <div style={{
            backgroundColor: "#fff9c4",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            borderLeft: "3px solid #fbc02d"
          }}>
            <span style={{ fontWeight: "600", color: "#000" }}>Ingreso:</span>{" "}
            <span style={{ color: "#000" }}>
              {format(new Date(rowData.fechaIngreso), "dd/MM/yyyy")}
            </span>
          </div>
        )}
        {rowData.fechaProduccion && (
          <div style={{
            backgroundColor: "#bbdefb",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            borderLeft: "3px solid #1976d2"
          }}>
            <span style={{ fontWeight: "600", color: "#000" }}>Producción:</span>{" "}
            <span style={{ color: "#000" }}>
              {format(new Date(rowData.fechaProduccion), "dd/MM/yyyy")}
            </span>
          </div>
        )}
        {rowData.fechaVencimiento && (
          <div style={{
            backgroundColor: estaVencido ? "#f44336" : "#ffe0b2",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            borderLeft: estaVencido ? "3px solid #b71c1c" : "3px solid #ff9800"
          }}>
            <span style={{ fontWeight: "600", color: estaVencido ? "#fff" : "#000" }}>Vencimiento:</span>{" "}
            <span style={{ color: estaVencido ? "#fff" : "#000", fontWeight: estaVencido ? "700" : "normal" }}>
              {format(new Date(rowData.fechaVencimiento), "dd/MM/yyyy")}
              {estaVencido && " ⚠️"}
            </span>
          </div>
        )}
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {rowData.estadoMercaderia && (
          <Tag
            value={rowData.estadoMercaderia.descripcion || rowData.estadoMercaderia.nombre || rowData.estadoMercaderia}
            severity="warning"
            style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              padding: "0.35rem 0.6rem"
            }}
          />
        )}
        {rowData.estadoCalidad && (
          <Tag
            value={rowData.estadoCalidad.descripcion || rowData.estadoCalidad.nombre || rowData.estadoCalidad}
            severity="info"
            style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              padding: "0.35rem 0.6rem"
            }}
          />
        )}
        {!rowData.estadoMercaderia && !rowData.estadoCalidad && (
          <span style={{ fontSize: "0.75rem", color: "#999" }}>Sin estados</span>
        )}
      </div>
    );
  };

  const unidadEmpaqueTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: "600", fontSize: "0.9em" }}>
          {producto?.unidadMedida?.nombre || "-"}
        </div>
        {producto?.unidadMedida?.simbolo && (
          <div style={{ fontSize: "0.7em", color: "#666" }}>
            ({producto.unidadMedida.simbolo})
          </div>
        )}
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
          {Number(rowData.saldoCantidad || 0).toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    );
  };

  const pesoTemplate = (rowData) => {
    const peso = Number(rowData.saldoPeso || 0);
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: "600" }}>
          {peso.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div style={{ fontSize: "0.75em", color: "#666" }}>KG</div>
      </div>
    );
  };

  // Funciones para totales del footer
  const totalCantidad = () => {
    const total = saldosDetallados.reduce((sum, s) => sum + Number(s.saldoCantidad || 0), 0);
    return total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalPeso = () => {
    const total = saldosDetallados.reduce((sum, s) => sum + Number(s.saldoPeso || 0), 0);
    return `${total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`;
  };

  // Footer con totales usando ColumnGroup
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column 
          footer="TOTALES:" 
          colSpan={3}
          footerStyle={{ textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #dee2e6' }} 
        />
        <Column 
          footer={totalCantidad} 
          footerStyle={{ textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #dee2e6' }} 
        />
        <Column 
          footer="" 
          footerStyle={{ textAlign: 'center', borderRight: '1px solid #dee2e6' }} 
        />
        <Column 
          footer={totalPeso} 
          footerStyle={{ textAlign: 'right', fontWeight: 'bold', color: '#2e7d32', fontSize: '1.1em' }} 
        />
      </Row>
    </ColumnGroup>
  );

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
          Stock Detallado con Variables
        </h3>
        <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
          {producto?.descripcionArmada}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#999" }}>
          Almacén: {almacen?.nombre || "N/A"}
        </div>
      </div>
      <Tag
        value={`${saldosDetallados.length} Registro(s)`}
        severity="success"
        style={{ fontSize: "1rem" }}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header={header}
        style={{ width: "95vw", maxWidth: "1400px" }}
        modal
      >
        <DataTable
          value={saldosDetallados}
          loading={loading}
          emptyMessage="No hay stock detallado disponible"
          footerColumnGroup={footerGroup}
          responsiveLayout="scroll"
          stripedRows
          size="small"
        >
          <Column
            field="lote"
            header="Lote / Contenedor / Serie"
            body={loteContenedorTemplate}
            sortable
            style={{ width: "15%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'left' }}
            headerStyle={{ textAlign: 'left' }}
          />
          <Column
            header="Fechas"
            body={fechasTemplate}
            style={{ width: "18%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'left' }}
            headerStyle={{ textAlign: 'left' }}
          />
          <Column
            header="Estados"
            body={estadoTemplate}
            style={{ width: "15%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'center' }}
            headerStyle={{ textAlign: 'center' }}
          />
          <Column
            field="saldoCantidad"
            header="Cantidad"
            body={cantidadTemplate}
            sortable
            style={{ width: "12%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
          <Column
            header="Unidad Empaque"
            body={unidadEmpaqueTemplate}
            style={{ width: "12%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'center' }}
            headerStyle={{ textAlign: 'center' }}
          />
          <Column
            field="saldoPeso"
            header="Peso"
            body={pesoTemplate}
            sortable
            style={{ width: "12%" }}
            bodyStyle={{ textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
        </DataTable>
      </Dialog>
    </>
  );
}