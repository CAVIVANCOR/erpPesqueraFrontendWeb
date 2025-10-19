// src/components/movimientoAlmacen/KardexProductoDialog.jsx
// Componente reutilizable para mostrar el kardex de un producto
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { TabView, TabPanel } from "primereact/tabview";
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";

// Constantes de colores para el kardex
const COLOR_INGRESO = "#f4fcf5"; // Verde claro para ingresos
const COLOR_EGRESO = "#f9e8e9"; // Rojo claro para egresos
const COLOR_SALDO = "#f2f8fc"; // Celeste claro para saldos finales
const COLOR_SALDO_INICIAL = "#fcfaf4"; // Azul claro para saldos iniciales

/**
 * Componente independiente para mostrar el kardex de un producto
 * @param {boolean} visible - Controla la visibilidad del diálogo
 * @param {function} onHide - Función callback al cerrar el diálogo
 * @param {number|string} empresaId - ID de la empresa
 * @param {number|string} almacenId - ID del almacén
 * @param {number|string} productoId - ID del producto
 * @param {boolean} esCustodia - Si es mercadería en custodia (default: false)
 * @param {number|string} clienteId - ID del cliente (solo para custodia)
 * @param {string} productoNombre - Nombre del producto para mostrar en el header
 * @param {string} fechaDesde - Fecha desde para filtrar (opcional)
 * @param {string} fechaHasta - Fecha hasta para filtrar (opcional)
 */
export default function KardexProductoDialog({
  visible,
  onHide,
  empresaId,
  almacenId,
  productoId,
  esCustodia = false,
  clienteId = null,
  productoNombre = "Producto",
  fechaDesde = null,
  fechaHasta = null,
}) {
  const [kardex, setKardex] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && empresaId && almacenId && productoId) {
      cargarKardex();
    }
  }, [visible, empresaId, almacenId, productoId, esCustodia, clienteId]);

  const cargarKardex = async () => {
    try {
      setLoading(true);
      const token = useAuthStore.getState().token;
      const API_URL = `${import.meta.env.VITE_API_URL}/kardex-almacen/producto`;

      const params = {
        empresaId,
        almacenId,
        productoId,
        esCustodia,
      };

      if (esCustodia && clienteId) {
        params.clienteId = clienteId;
      }

      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;

      const res = await axios.get(API_URL, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setKardex(res.data || []);
    } catch (error) {
      console.error("Error al cargar kardex:", error);
      setKardex([]);
    } finally {
      setLoading(false);
    }
  };

  const numberTemplate = (value) => {
    if (!value && value !== 0) return "-";
    return Number(value).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const moneyTemplate = (value) => {
    if (!value && value !== 0) return "-";
    return (
      "S/ " +
      Number(value).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const dateTemplate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("es-PE");
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Kardex ${
        esCustodia ? "Custodia" : "Propio"
      } - ${productoNombre}`}
      style={{ width: "95vw", maxWidth: "1600px" }}
      modal
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
        </div>
      ) : (
        <TabView>
          {/* VISTA 1: KARDEX VALORIZADO */}
          <TabPanel header="Kardex Valorizado">
            <DataTable
              value={kardex}
              emptyMessage="No hay movimientos de kardex para este producto"
              size="small"
              stripedRows
              showGridlines
              scrollable
              scrollHeight="600px"
              style={{ fontSize: "11px" }}
            >
              <Column
                field="fechaMovimientoAlmacen"
                header="Fecha"
                body={(row) => dateTemplate(row.fechaMovimientoAlmacen)}
                style={{ width: "80px", fontWeight: "bold" }}
                frozen
              />
              <Column
                field="numDocCompleto"
                header="N° Dcmto"
                style={{ width: "140px", fontWeight: "bold" }}
                frozen
              />
              <Column
                field="esIngresoEgreso"
                header="Tipo"
                body={(row) => (
                  <Tag
                    value={row.esIngresoEgreso ? "INGRESO" : "EGRESO"}
                    severity={row.esIngresoEgreso ? "success" : "danger"}
                  />
                )}
                style={{ width: "80px", textAlign: "center" }}
                frozen
              />

              <Column
                field="conceptoMovAlmacen.descripcionArmada"
                header="Concepto"
                style={{ width: "250px", fontWeight: "bold" }}
                frozen
              />

              {/* INGRESOS VALORIZADOS */}
              <Column
                field="ingresoCant"
                header="Ing.Cant"
                body={(row) => numberTemplate(row.ingresoCant)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_INGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="ingresoCantCostoUnit"
                header="Ing.C.Unit"
                body={(row) => moneyTemplate(row.ingresoCantCostoUnit)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_INGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="ingresoCantCostoTotal"
                header="Ing.C.Total"
                body={(row) => moneyTemplate(row.ingresoCantCostoTotal)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_INGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="ingresoPeso"
                header="Ing.Peso"
                body={(row) => numberTemplate(row.ingresoPeso)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_INGRESO,
                  fontWeight: "bold",
                }}
              />

              {/* EGRESOS VALORIZADOS */}
              <Column
                field="egresoCant"
                header="Egr.Cant"
                body={(row) => numberTemplate(row.egresoCant)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_EGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="egresoCantCostoUnit"
                header="Egr.C.Unit"
                body={(row) => moneyTemplate(row.egresoCantCostoUnit)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_EGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="egresoCantCostoTotal"
                header="Egr.C.Total"
                body={(row) => moneyTemplate(row.egresoCantCostoTotal)}
                style={{
                  width: "120px",
                  textAlign: "right",
                  backgroundColor: COLOR_EGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="egresoPeso"
                header="Egr.Peso"
                body={(row) => numberTemplate(row.egresoPeso)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_EGRESO,
                  fontWeight: "bold",
                }}
              />

              {/* SALDOS FINALES VALORIZADOS */}
              <Column
                field="saldoFinalCant"
                header="Saldo Cant"
                body={(row) => numberTemplate(row.saldoFinalCant)}
                style={{
                  width: "100px",
                  textAlign: "right",
                  backgroundColor: COLOR_SALDO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="saldoFinalCostoUnitCant"
                header="Saldo C.Unit"
                body={(row) => moneyTemplate(row.saldoFinalCostoUnitCant)}
                style={{
                  width: "120px",
                  textAlign: "right",
                  backgroundColor: COLOR_SALDO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="saldoFinalCostoTotalCant"
                header="Saldo C.Total"
                body={(row) => moneyTemplate(row.saldoFinalCostoTotalCant)}
                style={{
                  width: "120px",
                  textAlign: "right",
                  backgroundColor: COLOR_SALDO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="saldoFinalPeso"
                header="Saldo Peso"
                body={(row) => numberTemplate(row.saldoFinalPeso)}
                style={{
                  width: "90px",
                  textAlign: "right",
                  backgroundColor: COLOR_SALDO,
                  fontWeight: "bold",
                }}
              />
            </DataTable>
          </TabPanel>

          {/* VISTA 2: KARDEX POR VARIABLES DE STOCK */}
          <TabPanel header="Kardex por Variables de Stock">
            <DataTable
              value={kardex}
              emptyMessage="No hay movimientos de kardex para este producto"
              stripedRows
              showGridlines
              scrollable
              scrollHeight="600px"
              style={{ fontSize: getResponsiveFontSize() }}
              size="small"
            >
              <Column
                field="fechaMovimientoAlmacen"
                header="Fecha"
                body={(row) => dateTemplate(row.fechaMovimientoAlmacen)}
                style={{ minWidth: "80px", width: "80px", maxWidth:"80px" }}
              />
              <Column
                field="numDocCompleto"
                header="N° Dcmto"
                style={{ minWidth: "140px", width: "140px", maxWidth:"140px" }}
              />
              <Column
                field="conceptoMovAlmacen.descripcionArmada"
                header="Concepto"
                style={{ minWidth: "250px", width: "250px", maxWidth:"250px" }}
              />
              <Column
                field="esIngresoEgreso"
                header="Tipo"
                body={(row) => (
                  <Tag
                    value={row.esIngresoEgreso ? "INGRESO" : "EGRESO"}
                    severity={row.esIngresoEgreso ? "success" : "danger"}
                  />
                )}
                style={{ minWidth: "100px", width: "100px", maxWidth:"100px", textAlign: "center" }}
              />

              {/* VARIABLES DE TRAZABILIDAD */}
              <Column
                field="fechaIngreso"
                header="Fecha Ingreso"
                body={(row) => dateTemplate(row.fechaIngreso)}
                style={{
                  minWidth: "70px",
                  maxWidth: "100px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="fechaProduccion"
                header="Fecha Produccion"
                body={(row) => dateTemplate(row.fechaProduccion)}
                style={{
                  minWidth: "70px",
                  maxWidth: "110px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="numContenedor"
                header="N° Contenedor"
                style={{
                  minWidth: "120px",
                  maxWidth: "120px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="estado.descripcion"
                header="Estado Mercaderia"
                body={(row) => row.estado?.descripcion || "-"}
                style={{
                  minWidth: "90px",
                  maxWidth: "120px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="estadoCalidad.descripcion"
                header="Estado Calidad"
                body={(row) => row.estadoCalidad?.descripcion || "-"}
                style={{
                  minWidth: "100px",
                  maxWidth: "160px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="lote"
                header="Lote"
                style={{
                  minWidth: "120px",
                  maxWidth: "120px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="fechaVencimiento"
                header="Fecha Vencimiento"
                body={(row) => dateTemplate(row.fechaVencimiento)}
                style={{
                  minWidth: "70px",
                  maxWidth: "100px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              />

              {/* INGRESOS - Solo cantidades y pesos */}
              <Column
                field="ingresoCantVariables"
                header="Ing. Cant."
                body={(row) => numberTemplate(row.ingresoCantVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_INGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="ingresoPesoVariables"
                header="Ing. Peso"
                body={(row) => numberTemplate(row.ingresoPesoVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_INGRESO,
                  fontWeight: "bold",
                }}
              />

              {/* EGRESOS - Solo cantidades y pesos */}
              <Column
                field="egresoCantVariables"
                header="Egr. Cant."
                body={(row) => numberTemplate(row.egresoCantVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_EGRESO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="egresoPesoVariables"
                header="Egr. Peso"
                body={(row) => numberTemplate(row.egresoPesoVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_EGRESO,
                  fontWeight: "bold",
                }}
              />

              {/* SALDOS INICIALES */}
              <Column
                field="saldoInicialCantVariables"
                header="Saldo Ini. Cant."
                body={(row) => numberTemplate(row.saldoInicialCantVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_SALDO_INICIAL,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="saldoInicialPesoVariables"
                header="Saldo Ini. Peso"
                body={(row) => numberTemplate(row.saldoInicialPesoVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_SALDO_INICIAL,
                  fontWeight: "bold",
                }}
              />

              {/* SALDOS FINALES */}
              <Column
                field="saldoFinalCantVariables"
                header="Saldo Fin. Cant."
                body={(row) => numberTemplate(row.saldoFinalCantVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_SALDO,
                  fontWeight: "bold",
                }}
              />
              <Column
                field="saldoFinalPesoVariables"
                header="Saldo Fin. Peso"
                body={(row) => numberTemplate(row.saldoFinalPesoVariables)}
                style={{
                  minWidth: "80px",
                  maxWidth: "100px",
                  textAlign: "center",
                  backgroundColor: COLOR_SALDO,
                  fontWeight: "bold",
                }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      )}
    </Dialog>
  );
}
