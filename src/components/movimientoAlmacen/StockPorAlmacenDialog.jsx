// src/components/movimientoAlmacen/StockPorAlmacenDialog.jsx
// Componente NIVEL 2: Muestra stock de un producto por almacén
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { getSaldosProductoClienteConFiltros } from "../../api/saldosProductoCliente";
import StockDetalladoDialog from "./StockDetalladoDialog";

/**
 * Componente para mostrar stock de un producto por almacén
 * @param {boolean} visible - Visibilidad del diálogo
 * @param {function} onHide - Callback al cerrar
 * @param {Object} producto - Producto seleccionado
 * @param {number} empresaId - ID de la empresa
 * @param {number} clienteId - ID del cliente
 * @param {boolean} esCustodia - Si es mercadería en custodia
 */
export default function StockPorAlmacenDialog({
  visible,
  onHide,
  producto,
  empresaId,
  clienteId,
  esCustodia,
}) {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saldosPorAlmacen, setSaldosPorAlmacen] = useState([]);
  
  // Estado para Nivel 3
  const [showStockDetallado, setShowStockDetallado] = useState(false);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);

  useEffect(() => {
    if (visible && producto) {
      cargarStockPorAlmacen();
    }
  }, [visible, producto, empresaId, clienteId, esCustodia]);

  /**
   * Carga stock del producto agrupado por almacén
   */
  const cargarStockPorAlmacen = async () => {
    if (!empresaId || !clienteId || !producto?.id) return;

    setLoading(true);
    try {
      const filtros = {
        empresaId,
        productoId: producto.id,
        clienteId,
        custodia: esCustodia,
        soloConSaldo: true, // Solo almacenes con stock
      };

      const saldos = await getSaldosProductoClienteConFiltros(filtros);
      
      // CONSOLIDAR por almacén (sumar cantidades del mismo almacén)
      const consolidado = {};
      saldos.forEach((saldo) => {
        const almacenId = saldo.almacenId;
        if (!consolidado[almacenId]) {
          consolidado[almacenId] = {
            ...saldo,
            saldoCantidad: 0,
            saldoPeso: 0,
            costoUnitarioPromedio: 0,
            registrosDetalle: [], // Guardar registros para Nivel 3
          };
        }
        consolidado[almacenId].saldoCantidad += Number(saldo.saldoCantidad || 0);
        consolidado[almacenId].saldoPeso += Number(saldo.saldoPeso || 0);
        consolidado[almacenId].registrosDetalle.push(saldo);
      });

      // Calcular costo promedio ponderado por almacén
      Object.values(consolidado).forEach((item) => {
        const totalValor = item.registrosDetalle.reduce(
          (sum, s) => sum + Number(s.saldoCantidad || 0) * Number(s.costoUnitarioPromedio || 0),
          0
        );
        item.costoUnitarioPromedio = item.saldoCantidad > 0 ? totalValor / item.saldoCantidad : 0;
      });

      setSaldosPorAlmacen(Object.values(consolidado));
    } catch (error) {
      console.error("Error al cargar stock por almacén:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar stock por almacén",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja clic en fila para ver detalle con variables
   */
  const handleRowClick = (rowData) => {
    setAlmacenSeleccionado(rowData);
    setShowStockDetallado(true);
  };

  // Templates de columnas
  const almacenTemplate = (rowData) => {
    return (
      <div>
        <div style={{ fontWeight: "600" }}>{rowData.almacen?.nombre}</div>
        <div style={{ fontSize: "0.85em", color: "#666" }}>ID: {rowData.almacenId?.toString()}</div>
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: "600", fontSize: "1.1em" }}>
          {Number(rowData.saldoCantidad || 0).toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div style={{ fontSize: "0.75em", color: "#666" }}>
          {rowData.producto?.unidadMedida?.abreviatura || "UND"}
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

  const costoTemplate = (rowData) => {
    const costo = Number(rowData.costoUnitarioPromedio || 0);
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: "600" }}>
          S/ {costo.toLocaleString("es-PE", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          })}
        </div>
        <div style={{ fontSize: "0.75em", color: "#666" }}>Costo Prom.</div>
      </div>
    );
  };

  const valorTotalTemplate = (rowData) => {
    const cantidad = Number(rowData.saldoCantidad || 0);
    const costo = Number(rowData.costoUnitarioPromedio || 0);
    const valorTotal = cantidad * costo;
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.1em", color: "#1976d2" }}>
          S/ {valorTotal.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    );
  };

  // Funciones para totales del footer
  const totalCantidad = () => {
    const total = saldosPorAlmacen.reduce((sum, s) => sum + Number(s.saldoCantidad || 0), 0);
    return total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalPeso = () => {
    const total = saldosPorAlmacen.reduce((sum, s) => sum + Number(s.saldoPeso || 0), 0);
    return `${total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`;
  };

  const totalValor = () => {
    const total = saldosPorAlmacen.reduce(
      (sum, s) => sum + Number(s.saldoCantidad || 0) * Number(s.costoUnitarioPromedio || 0),
      0
    );
    return `S/ ${total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Footer con totales usando ColumnGroup
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column 
          footer="TOTALES:" 
          footerStyle={{ textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #dee2e6' }} 
        />
        <Column 
          footer={totalCantidad} 
          footerStyle={{ textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #dee2e6' }} 
        />
        <Column 
          footer={totalPeso} 
          footerStyle={{ textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #dee2e6' }} 
        />
        <Column 
          footer="" 
          footerStyle={{ textAlign: 'right', borderRight: '1px solid #dee2e6' }} 
        />
        <Column 
          footer={totalValor} 
          footerStyle={{ textAlign: 'right', fontWeight: 'bold', color: '#1976d2', fontSize: '1.1em' }} 
        />
      </Row>
    </ColumnGroup>
  );

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
          Stock por Almacén
        </h3>
        <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
          {producto?.descripcionArmada}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#999" }}>
          Código: {producto?.codigo || "N/A"}
        </div>
      </div>
      <Tag
        value={`${saldosPorAlmacen.length} Almacén(es)`}
        severity="info"
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
        style={{ width: "90vw", maxWidth: "1200px" }}
        modal
      >
        <DataTable
          value={saldosPorAlmacen}
          loading={loading}
          emptyMessage="No hay stock disponible en ningún almacén"
          footerColumnGroup={footerGroup}
          responsiveLayout="scroll"
          stripedRows
          size="small"
          onRowClick={(e) => handleRowClick(e.data)}
          selectionMode="single"
          style={{ cursor: "pointer" }}
        >
                   <Column
            field="almacen.nombre"
            header="Almacén"
            body={almacenTemplate}
            sortable
            style={{ width: "25%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'left' }}
            headerStyle={{ textAlign: 'left' }}
          />
          <Column
            field="saldoCantidad"
            header="Cantidad"
            align="right"
            body={cantidadTemplate}
            sortable
            style={{ width: "15%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
          <Column
            field="saldoPeso"
            header="Peso"
            align="right"
            body={pesoTemplate}
            sortable
            style={{ width: "15%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
          <Column
            field="costoUnitarioPromedio"
            header="Costo Unitario"
            align="right"
            body={costoTemplate}
            sortable
            style={{ width: "15%", borderRight: '1px solid #dee2e6' }}
            bodyStyle={{ textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
          <Column
            header="Valor Total"
            body={valorTotalTemplate}
            align="right"
            style={{ width: "20%" }}
            bodyStyle={{ textAlign: 'right' }}
            headerStyle={{ textAlign: 'right' }}
          />
        </DataTable>
      </Dialog>

      {/* Nivel 3: Detalle con variables */}
      {showStockDetallado && almacenSeleccionado && (
        <StockDetalladoDialog
          visible={showStockDetallado}
          onHide={() => setShowStockDetallado(false)}
          producto={producto}
          almacen={almacenSeleccionado?.almacen}
          empresaId={empresaId}
          almacenId={almacenSeleccionado?.almacenId}
          clienteId={clienteId}
          esCustodia={esCustodia}
        />
      )}
    </>
  );
}