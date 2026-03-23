// src/components/movimientoCaja/DetallesGeneradosCard.jsx
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { getSaldosPorMovimiento } from "../../api/saldoCuentaCorriente";
import { getAsientosPorMovimiento } from "../../api/contabilidad/asientoContable";
import { getPagosPorMovimiento as getPagosCxCPorMovimiento } from "../../api/cuentasPorCobrarPagar/pagoCuentaPorCobrar";
import { getPagosPorMovimiento as getPagosCxPPorMovimiento } from "../../api/cuentasPorCobrarPagar/pagoCuentaPorPagar";

const DetallesGeneradosCard = ({
  movimientoId,
  refreshTrigger,
  readOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [saldos, setSaldos] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [pagosCxC, setPagosCxC] = useState([]);
  const [pagosCxP, setPagosCxP] = useState([]);
  const [conciliaciones, setConciliaciones] = useState([]);
  const [cuotasPrestamo, setCuotasPrestamo] = useState([]);
  const [desembolsos, setDesembolsos] = useState([]);
  const [letras, setLetras] = useState([]);
  const [retenciones, setRetenciones] = useState([]);
  const [inversiones, setInversiones] = useState([]);
  const [movInversiones, setMovInversiones] = useState([]);
  const [prestamos, setPrestamos] = useState([]);

  // Cargar datos cuando hay movimientoId o cambia refreshTrigger
  useEffect(() => {
    if (movimientoId) {
      cargarDetallesGenerados();
    }
  }, [movimientoId, refreshTrigger]);

  const cargarDetallesGenerados = async () => {
    setLoading(true);
    try {
      // Cargar saldos de cuenta corriente
      try {
        const saldosData = await getSaldosPorMovimiento(movimientoId);
        setSaldos(saldosData || []);
      } catch (error) {
        console.error("Error al cargar saldos:", error);
        setSaldos([]);
      }

      // Cargar asientos contables
      try {
        const asientosData = await getAsientosPorMovimiento(movimientoId);
        setAsientos(asientosData || []);
      } catch (error) {
        console.error("Error al cargar asientos:", error);
        setAsientos([]);
      }

      // Cargar pagos de cuentas por cobrar
      try {
        const pagosCxCData = await getPagosCxCPorMovimiento(movimientoId);
        setPagosCxC(pagosCxCData || []);
      } catch (error) {
        console.error("Error al cargar pagos CxC:", error);
        setPagosCxC([]);
      }

      // Cargar pagos de cuentas por pagar
      try {
        const pagosCxPData = await getPagosCxPPorMovimiento(movimientoId);
        setPagosCxP(pagosCxPData || []);
      } catch (error) {
        console.error("Error al cargar pagos CxP:", error);
        setPagosCxP([]);
      }

      // TODO: Implementar cuando existan los endpoints en el backend
      setConciliaciones([]);
      setCuotasPrestamo([]);
      setDesembolsos([]);
      setLetras([]);
      setRetenciones([]);
      setInversiones([]);
      setMovInversiones([]);
      setPrestamos([]);
    } catch (error) {
      console.error("Error al cargar detalles generados:", error);
    }
    setLoading(false);
  };

  // Función para formatear moneda
  const formatCurrency = (value, currency = "PEN") => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
    }).format(value || 0);
  };

  // Función para formatear fecha
  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("es-PE");
  };

  // Template para badge de cantidad
  const getBadgeCount = (data) => {
    return data && data.length > 0 ? (
      <Badge value={data.length} severity="info" />
    ) : null;
  };

  // Calcular total de registros
  const totalRegistros =
    saldos.length +
    asientos.length +
    pagosCxC.length +
    pagosCxP.length +
    conciliaciones.length +
    cuotasPrestamo.length +
    desembolsos.length +
    letras.length +
    retenciones.length +
    inversiones.length +
    movInversiones.length +
    prestamos.length;

  if (!movimientoId) {
    return (
      <Card title="Detalles Generados">
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <i className="pi pi-info-circle" style={{ fontSize: "2rem", marginBottom: "1rem" }} />
          <p>Guarde el movimiento primero para ver los detalles generados.</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Detalles Generados">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <ProgressSpinner />
          <p style={{ marginTop: "1rem" }}>Cargando detalles generados...</p>
        </div>
      </Card>
    );
  }

  if (totalRegistros === 0) {
    return (
      <Card title="Detalles Generados">
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <i className="pi pi-inbox" style={{ fontSize: "2rem", marginBottom: "1rem" }} />
          <p>No se han generado registros para este movimiento.</p>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Los registros se generan automáticamente al validar el movimiento.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Detalles Generados">
      <TabView>
        {/* Tab 1: Saldos Cuenta Corriente */}
        {saldos.length > 0 && (
          <TabPanel
            header={
              <span>
                Saldos Cuenta Corriente {getBadgeCount(saldos)}
              </span>
            }
          >
            <DataTable value={saldos} size="small" stripedRows>
              <Column field="cuentaCorriente.numeroCuenta" header="Cuenta" />
              <Column field="cuentaCorriente.banco.nombre" header="Banco" />
              <Column
                field="saldoAnterior"
                header="Saldo Anterior"
                body={(rowData) => formatCurrency(rowData.saldoAnterior)}
              />
              <Column
                field="ingresos"
                header="Ingresos"
                body={(rowData) => (
                  <span style={{ color: "#28a745", fontWeight: "bold" }}>
                    + {formatCurrency(rowData.ingresos)}
                  </span>
                )}
              />
              <Column
                field="egresos"
                header="Egresos"
                body={(rowData) => (
                  <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                    - {formatCurrency(rowData.egresos)}
                  </span>
                )}
              />
              <Column
                field="saldoActual"
                header="Saldo Actual"
                body={(rowData) => (
                  <span
                    style={{
                      fontWeight: "bold",
                      color: Number(rowData.saldoActual) >= 0 ? "#28a745" : "#dc3545",
                    }}
                  >
                    {formatCurrency(rowData.saldoActual)}
                  </span>
                )}
              />
              <Column field="fecha" header="Fecha" body={(rowData) => formatDate(rowData.fecha)} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 2: Asientos Contables */}
        {asientos.length > 0 && (
          <TabPanel
            header={
              <span>
                Asientos Contables {getBadgeCount(asientos)}
              </span>
            }
          >
            <DataTable value={asientos} size="small" stripedRows>
              <Column field="numeroAsiento" header="Número" />
              <Column field="fechaAsiento" header="Fecha" body={(rowData) => formatDate(rowData.fechaAsiento)} />
              <Column field="glosa" header="Glosa" />
              <Column
                field="totalDebe"
                header="Total Debe"
                body={(rowData) => formatCurrency(rowData.totalDebe)}
              />
              <Column
                field="totalHaber"
                header="Total Haber"
                body={(rowData) => formatCurrency(rowData.totalHaber)}
              />
              <Column
                field="estaCuadrado"
                header="Estado"
                body={(rowData) => (
                  <Badge
                    value={rowData.estaCuadrado ? "Cuadrado" : "Descuadrado"}
                    severity={rowData.estaCuadrado ? "success" : "danger"}
                  />
                )}
              />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 3: Pagos CxC */}
        {pagosCxC.length > 0 && (
          <TabPanel
            header={
              <span>
                Pagos CxC {getBadgeCount(pagosCxC)}
              </span>
            }
          >
            <DataTable value={pagosCxC} size="small" stripedRows>
              <Column field="cuentaPorCobrar.cliente.razonSocial" header="Cliente" />
              <Column field="montoPagado" header="Monto" body={(rowData) => formatCurrency(rowData.montoPagado)} />
              <Column field="fechaPago" header="Fecha" body={(rowData) => formatDate(rowData.fechaPago)} />
              <Column field="medioPago.nombre" header="Medio Pago" />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 4: Pagos CxP */}
        {pagosCxP.length > 0 && (
          <TabPanel
            header={
              <span>
                Pagos CxP {getBadgeCount(pagosCxP)}
              </span>
            }
          >
            <DataTable value={pagosCxP} size="small" stripedRows>
              <Column field="cuentaPorPagar.proveedor.razonSocial" header="Proveedor" />
              <Column field="montoPagado" header="Monto" body={(rowData) => formatCurrency(rowData.montoPagado)} />
              <Column field="fechaPago" header="Fecha" body={(rowData) => formatDate(rowData.fechaPago)} />
              <Column field="medioPago.nombre" header="Medio Pago" />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 5: Conciliación Bancaria */}
        {conciliaciones.length > 0 && (
          <TabPanel
            header={
              <span>
                Conciliación Bancaria {getBadgeCount(conciliaciones)}
              </span>
            }
          >
            <DataTable value={conciliaciones} size="small" stripedRows>
              <Column field="conciliacion.cuentaCorriente.numeroCuenta" header="Cuenta" />
              <Column field="monto" header="Monto" body={(rowData) => formatCurrency(rowData.monto)} />
              <Column field="tipo" header="Tipo" />
              <Column field="conciliado" header="Conciliado" body={(rowData) => (
                <Badge value={rowData.conciliado ? "Sí" : "No"} severity={rowData.conciliado ? "success" : "warning"} />
              )} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 6: Cuotas Préstamo */}
        {cuotasPrestamo.length > 0 && (
          <TabPanel
            header={
              <span>
                Cuotas Préstamo {getBadgeCount(cuotasPrestamo)}
              </span>
            }
          >
            <DataTable value={cuotasPrestamo} size="small" stripedRows>
              <Column field="prestamo.numeroPrestamo" header="Préstamo" />
              <Column field="numeroCuota" header="Cuota" />
              <Column field="montoCuota" header="Monto" body={(rowData) => formatCurrency(rowData.montoCuota)} />
              <Column field="fechaPago" header="Fecha Pago" body={(rowData) => formatDate(rowData.fechaPago)} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 7: Desembolsos Préstamo */}
        {desembolsos.length > 0 && (
          <TabPanel
            header={
              <span>
                Desembolsos Préstamo {getBadgeCount(desembolsos)}
              </span>
            }
          >
            <DataTable value={desembolsos} size="small" stripedRows>
              <Column field="prestamo.numeroPrestamo" header="Préstamo" />
              <Column field="montoDesembolsado" header="Monto" body={(rowData) => formatCurrency(rowData.montoDesembolsado)} />
              <Column field="fechaDesembolso" header="Fecha" body={(rowData) => formatDate(rowData.fechaDesembolso)} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 8: Letras de Cambio */}
        {letras.length > 0 && (
          <TabPanel
            header={
              <span>
                Letras de Cambio {getBadgeCount(letras)}
              </span>
            }
          >
            <DataTable value={letras} size="small" stripedRows>
              <Column field="letra.numeroLetra" header="Letra" />
              <Column field="montoPagado" header="Monto" body={(rowData) => formatCurrency(rowData.montoPagado)} />
              <Column field="fechaPago" header="Fecha" body={(rowData) => formatDate(rowData.fechaPago)} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 9: Retenciones */}
        {retenciones.length > 0 && (
          <TabPanel
            header={
              <span>
                Retenciones {getBadgeCount(retenciones)}
              </span>
            }
          >
            <DataTable value={retenciones} size="small" stripedRows>
              <Column field="tipoRetencion" header="Tipo" />
              <Column field="montoRetenido" header="Monto" body={(rowData) => formatCurrency(rowData.montoRetenido)} />
              <Column field="fecha" header="Fecha" body={(rowData) => formatDate(rowData.fecha)} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 10: Inversiones */}
        {inversiones.length > 0 && (
          <TabPanel
            header={
              <span>
                Inversiones {getBadgeCount(inversiones)}
              </span>
            }
          >
            <DataTable value={inversiones} size="small" stripedRows>
              <Column field="tipoInversion.nombre" header="Tipo" />
              <Column field="montoInvertido" header="Monto" body={(rowData) => formatCurrency(rowData.montoInvertido)} />
              <Column field="fechaLiquidacion" header="Fecha Liquidación" body={(rowData) => formatDate(rowData.fechaLiquidacion)} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 11: Movimientos Inversión */}
        {movInversiones.length > 0 && (
          <TabPanel
            header={
              <span>
                Movimientos Inversión {getBadgeCount(movInversiones)}
              </span>
            }
          >
            <DataTable value={movInversiones} size="small" stripedRows>
              <Column field="inversion.tipoInversion.nombre" header="Inversión" />
              <Column field="tipoMovimiento" header="Tipo" />
              <Column field="monto" header="Monto" body={(rowData) => formatCurrency(rowData.monto)} />
              <Column field="fecha" header="Fecha" body={(rowData) => formatDate(rowData.fecha)} />
            </DataTable>
          </TabPanel>
        )}

        {/* Tab 12: Préstamos */}
        {prestamos.length > 0 && (
          <TabPanel
            header={
              <span>
                Préstamos {getBadgeCount(prestamos)}
              </span>
            }
          >
            <DataTable value={prestamos} size="small" stripedRows>
              <Column field="numeroPrestamo" header="Número" />
              <Column field="banco.nombre" header="Banco" />
              <Column field="montoPrestamo" header="Monto" body={(rowData) => formatCurrency(rowData.montoPrestamo)} />
              <Column field="fechaDesembolso" header="Fecha" body={(rowData) => formatDate(rowData.fechaDesembolso)} />
            </DataTable>
          </TabPanel>
        )}
      </TabView>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          size="small"
          onClick={cargarDetallesGenerados}
          outlined
        />
      </div>
    </Card>
  );
};

export default DetallesGeneradosCard;