// src/components/saldoCuentaCorriente/HistoricoCuentaCorriente.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function HistoricoCuentaCorriente({
  visible,
  onHide,
  saldos = [],
  cuentaCorriente = null,
}) {
  const [periodo, setPeriodo] = useState("mensual");
  const [chartData, setChartData] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [datosDetallados, setDatosDetallados] = useState([]);
  const [datosInsuficientes, setDatosInsuficientes] = useState(false);

  useEffect(() => {
    if (visible && saldos.length > 0) {
      setChartData([]);
      setDatosInsuficientes(false);
      setTimeout(() => {
        procesarDatos();
      }, 100);
    }
  }, [visible, saldos, periodo]);

  const calcularEstadisticasAvanzadas = (valores) => {
    const n = valores.length;
    if (n === 0) return null;

    const promedio = valores.reduce((a, b) => a + b, 0) / n;

    const varianza =
      valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / n;
    const desviacionEstandar = Math.sqrt(varianza);

    const coeficienteVariacion =
      promedio !== 0 ? (desviacionEstandar / promedio) * 100 : 0;

    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);
    const rango = maximo - minimo;

    let tendencia = "Estable";
    let tasaCrecimiento = 0;

    if (n >= 2) {
      const primerValor = valores[0];
      const ultimoValor = valores[n - 1];

      if (primerValor !== 0) {
        tasaCrecimiento = ((ultimoValor - primerValor) / primerValor) * 100;
      }

      if (tasaCrecimiento > 5) {
        tendencia = "Creciente";
      } else if (tasaCrecimiento < -5) {
        tendencia = "Decreciente";
      }
    }

    return {
      promedio,
      desviacionEstandar,
      varianza,
      coeficienteVariacion,
      maximo,
      minimo,
      rango,
      tendencia,
      tasaCrecimiento,
    };
  };

  const procesarDatos = () => {
    const saldosOrdenados = [...saldos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    if (saldosOrdenados.length < 1) {
      setDatosInsuficientes(true);
      return;
    }

    let labels = [];
    let dataIngresos = [];
    let dataEgresos = [];
    let dataSaldo = [];
    let detalles = [];

    if (periodo === "mensual") {
      const datosPorMes = {};
      saldosOrdenados.forEach((saldo) => {
        const fecha = new Date(saldo.fecha);
        const mesAnio = `${fecha.toLocaleString("es-PE", {
          month: "short",
        })} ${fecha.getFullYear()}`;

        if (!datosPorMes[mesAnio]) {
          datosPorMes[mesAnio] = {
            ingresos: 0,
            egresos: 0,
            saldoFinal: 0,
            fecha: fecha,
            registros: 0,
          };
        }

        datosPorMes[mesAnio].ingresos += Number(saldo.ingresos || 0);
        datosPorMes[mesAnio].egresos += Number(saldo.egresos || 0);
        datosPorMes[mesAnio].saldoFinal = Number(saldo.saldoActual || 0);
        datosPorMes[mesAnio].registros++;
      });

      labels = Object.keys(datosPorMes);
      dataIngresos = labels.map((label) => datosPorMes[label].ingresos);
      dataEgresos = labels.map((label) => datosPorMes[label].egresos);
      dataSaldo = labels.map((label) => datosPorMes[label].saldoFinal);

      detalles = labels.map((label, index) => ({
        periodo: label,
        ingresos: datosPorMes[label].ingresos,
        egresos: datosPorMes[label].egresos,
        flujoNeto: datosPorMes[label].ingresos - datosPorMes[label].egresos,
        saldoFinal: datosPorMes[label].saldoFinal,
        variacion:
          index > 0
            ? datosPorMes[label].saldoFinal -
              datosPorMes[labels[index - 1]].saldoFinal
            : 0,
        registros: datosPorMes[label].registros,
      }));
    } else {
      const datosPorAnio = {};
      saldosOrdenados.forEach((saldo) => {
        const fecha = new Date(saldo.fecha);
        const anio = fecha.getFullYear().toString();

        if (!datosPorAnio[anio]) {
          datosPorAnio[anio] = {
            ingresos: 0,
            egresos: 0,
            saldoFinal: 0,
            fecha: fecha,
            registros: 0,
          };
        }

        datosPorAnio[anio].ingresos += Number(saldo.ingresos || 0);
        datosPorAnio[anio].egresos += Number(saldo.egresos || 0);
        datosPorAnio[anio].saldoFinal = Number(saldo.saldoActual || 0);
        datosPorAnio[anio].registros++;
      });

      labels = Object.keys(datosPorAnio);
      dataIngresos = labels.map((label) => datosPorAnio[label].ingresos);
      dataEgresos = labels.map((label) => datosPorAnio[label].egresos);
      dataSaldo = labels.map((label) => datosPorAnio[label].saldoFinal);

      detalles = labels.map((label, index) => ({
        periodo: label,
        ingresos: datosPorAnio[label].ingresos,
        egresos: datosPorAnio[label].egresos,
        flujoNeto: datosPorAnio[label].ingresos - datosPorAnio[label].egresos,
        saldoFinal: datosPorAnio[label].saldoFinal,
        variacion:
          index > 0
            ? datosPorAnio[label].saldoFinal -
              datosPorAnio[labels[index - 1]].saldoFinal
            : 0,
        registros: datosPorAnio[label].registros,
      }));
    }

    setDatosDetallados(detalles);

    const chartDataFormatted = labels.map((label, index) => ({
      periodo: label,
      ingresos: dataIngresos[index],
      egresos: dataEgresos[index],
      saldo: dataSaldo[index],
    }));

    setChartData(chartDataFormatted);

    const totalIngresos = dataIngresos.reduce((a, b) => a + b, 0);
    const totalEgresos = dataEgresos.reduce((a, b) => a + b, 0);
    const flujoNetoTotal = totalIngresos - totalEgresos;
    const saldoActual = dataSaldo[dataSaldo.length - 1] || 0;
    const saldoInicial = dataSaldo[0] || 0;

    const statsIngresos = calcularEstadisticasAvanzadas(dataIngresos);
    const statsEgresos = calcularEstadisticasAvanzadas(dataEgresos);
    const statsSaldo = calcularEstadisticasAvanzadas(dataSaldo);

    const indiceMaxSaldo = dataSaldo.indexOf(statsSaldo.maximo);
    const indiceMinSaldo = dataSaldo.indexOf(statsSaldo.minimo);

    setEstadisticas({
      totalIngresos,
      totalEgresos,
      flujoNetoTotal,
      flujoNetoPromedio: flujoNetoTotal / labels.length,
      saldoActual,
      saldoInicial,
      variacionTotal: saldoActual - saldoInicial,
      variacionPorcentual:
        saldoInicial !== 0
          ? ((saldoActual - saldoInicial) / saldoInicial) * 100
          : 0,
      periodos: labels.length,
      ratioIngresosEgresos:
        totalEgresos !== 0 ? totalIngresos / totalEgresos : 0,
    });

    setMetricas({
      ingresos: {
        ...statsIngresos,
        total: totalIngresos,
      },
      egresos: {
        ...statsEgresos,
        total: totalEgresos,
      },
      saldo: {
        ...statsSaldo,
        periodoMaximo: labels[indiceMaxSaldo],
        periodoMinimo: labels[indiceMinSaldo],
      },
    });
  };

  const periodoOptions = [
    { label: "Mensual", value: "mensual" },
    { label: "Anual", value: "anual" },
  ];

  const moneda = cuentaCorriente?.moneda?.simbolo || "";

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
            {payload[0].payload.periodo}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              style={{
                margin: "3px 0",
                color: entry.color,
                fontSize: "0.9rem",
              }}
            >
              <strong>{entry.name}:</strong> {moneda}{" "}
              {Number(entry.value).toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const montoBodyTemplate = (rowData, field) => {
    const valor = rowData[field];
    const color =
      field === "ingresos"
        ? "#22c55e"
        : field === "egresos"
        ? "#ef4444"
        : "#495057";

    return (
      <span style={{ color, fontWeight: "bold" }}>
        {moneda} {Number(valor).toFixed(2)}
      </span>
    );
  };

  const variacionBodyTemplate = (rowData) => {
    const valor = rowData.variacion;
    const color = valor >= 0 ? "#22c55e" : "#ef4444";
    const icon = valor >= 0 ? "pi-arrow-up" : "pi-arrow-down";

    return (
      <span style={{ color, fontWeight: "bold" }}>
        <i className={`pi ${icon}`} style={{ marginRight: "0.3rem" }} />
        {moneda} {Math.abs(valor).toFixed(2)}
      </span>
    );
  };

  return (
    <Dialog
      header={
        <div>
          <i className="pi pi-chart-line" style={{ marginRight: "0.5rem" }} />
          Análisis Histórico Profesional
        </div>
      }
      visible={visible}
      style={{ width: "95vw", maxWidth: "1600px" }}
      onHide={onHide}
      modal
      maximizable
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 2 }}>
            <h3 style={{ margin: 0 }}>
              {cuentaCorriente?.banco?.nombre || "Banco"} -{" "}
              {cuentaCorriente?.numeroCuenta || ""}
            </h3>
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="periodo" style={{ fontWeight: "bold" }}>
              Período:
            </label>
            <Dropdown
              id="periodo"
              value={periodo}
              options={periodoOptions}
              onChange={(e) => setPeriodo(e.value)}
              style={{ width: "150px" }}
            />
          </div>
        </div>

        {datosInsuficientes && (
          <Message
            severity="warn"
            text="No hay datos históricos disponibles. Registre movimientos de saldo para visualizar el análisis."
            style={{ marginBottom: "1rem", width: "100%" }}
          />
        )}

        {estadisticas && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Tag
              style={{
                padding: "0.5rem 1rem",
                flex: "1 1 auto",
                minWidth: "150px",
                backgroundColor: "rgb(54, 162, 235)",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Total Ingresos
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {moneda} {estadisticas.totalIngresos.toFixed(2)}
                </div>
              </div>
            </Tag>
            <Tag
              style={{
                padding: "0.5rem 1rem",
                flex: "1 1 auto",
                minWidth: "150px",
                backgroundColor: "rgb(255, 99, 132)",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Total Egresos
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {moneda} {estadisticas.totalEgresos.toFixed(2)}
                </div>
              </div>
            </Tag>
            <Tag
              style={{
                padding: "0.5rem 1rem",
                flex: "1 1 auto",
                minWidth: "150px",
                backgroundColor:
                  estadisticas.flujoNetoTotal >= 0
                    ? "rgb(76, 175, 80)"
                    : "rgb(244, 67, 54)",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Flujo Neto Total
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {estadisticas.flujoNetoTotal >= 0 ? "+" : ""}
                  {moneda} {estadisticas.flujoNetoTotal.toFixed(2)}
                </div>
              </div>
            </Tag>
            <Tag
              style={{
                padding: "0.5rem 1rem",
                flex: "1 1 auto",
                minWidth: "150px",
                backgroundColor: "rgb(75, 192, 192)",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Saldo Actual
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {moneda} {estadisticas.saldoActual.toFixed(2)}
                </div>
              </div>
            </Tag>
            <Tag
              style={{
                padding: "0.5rem 1rem",
                flex: "1 1 auto",
                minWidth: "150px",
                backgroundColor:
                  estadisticas.variacionTotal >= 0
                    ? "rgba(76, 175, 80, 0.8)"
                    : "rgba(244, 67, 54, 0.8)",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Variación Total
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {estadisticas.variacionTotal >= 0 ? "+" : ""}
                  {moneda} {estadisticas.variacionTotal.toFixed(2)}
                  <div style={{ fontSize: "0.7rem" }}>
                    ({estadisticas.variacionPorcentual >= 0 ? "+" : ""}
                    {estadisticas.variacionPorcentual.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </Tag>
            <Tag
              style={{
                padding: "0.5rem 1rem",
                flex: "1 1 auto",
                minWidth: "150px",
                backgroundColor: "#607D8B",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Períodos Analizados
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {estadisticas.periodos}
                </div>
              </div>
            </Tag>
          </div>
        )}

        {!datosInsuficientes && (
          <TabView>
            <TabPanel header="Gráfico Histórico" leftIcon="pi pi-chart-line">
              <div style={{ height: "500px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebedef" />
                    <XAxis
                      dataKey="periodo"
                      tick={{ fill: "#495057", fontSize: 11 }}
                      stroke="#495057"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "#495057", fontSize: 12 }}
                      stroke="#495057"
                      tickFormatter={(value) =>
                        `${moneda} ${value.toFixed(0)}`
                      }
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "rgb(75, 192, 192)", fontSize: 12 }}
                      stroke="rgb(75, 192, 192)"
                      tickFormatter={(value) =>
                        `${moneda} ${value.toFixed(0)}`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="ingresos"
                      fill="rgb(54, 162, 235)"
                      name="Ingresos"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="egresos"
                      fill="rgb(255, 99, 132)"
                      name="Egresos"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="saldo"
                      stroke="rgb(75, 192, 192)"
                      strokeWidth={3}
                      name="Saldo"
                      dot={{ r: 4, fill: "rgb(75, 192, 192)" }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabPanel>

            <TabPanel header="Tabla Detallada" leftIcon="pi pi-table">
              <DataTable
                value={datosDetallados}
                paginator
                rows={10}
                emptyMessage="No hay datos para mostrar"
                size="small"
              >
                <Column
                  field="periodo"
                  header="Período"
                  sortable
                  style={{ minWidth: "120px" }}
                />
                <Column
                  field="ingresos"
                  header="Ingresos"
                  body={(rowData) => montoBodyTemplate(rowData, "ingresos")}
                  sortable
                  style={{ minWidth: "120px", textAlign: "right" }}
                />
                <Column
                  field="egresos"
                  header="Egresos"
                  body={(rowData) => montoBodyTemplate(rowData, "egresos")}
                  sortable
                  style={{ minWidth: "120px", textAlign: "right" }}
                />
                <Column
                  field="flujoNeto"
                  header="Flujo Neto"
                  body={(rowData) => montoBodyTemplate(rowData, "flujoNeto")}
                  sortable
                  style={{ minWidth: "120px", textAlign: "right" }}
                />
                <Column
                  field="saldoFinal"
                  header="Saldo Final"
                  body={(rowData) => montoBodyTemplate(rowData, "saldoFinal")}
                  sortable
                  style={{ minWidth: "120px", textAlign: "right" }}
                />
                <Column
                  field="variacion"
                  header="Variación"
                  body={variacionBodyTemplate}
                  sortable
                  style={{ minWidth: "120px", textAlign: "right" }}
                />
                <Column
                  field="registros"
                  header="Registros"
                  sortable
                  style={{ minWidth: "100px", textAlign: "center" }}
                />
              </DataTable>
            </TabPanel>

            <TabPanel
              header="Métricas Estadísticas"
              leftIcon="pi pi-calculator"
            >
              {metricas && (
                <div style={{ padding: "1rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(350px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        border: "2px solid rgb(54, 162, 235)",
                        borderRadius: "8px",
                        padding: "1rem",
                        backgroundColor: "rgba(54, 162, 235, 0.05)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          color: "rgb(54, 162, 235)",
                        }}
                      >
                        📈 Estadísticas de Ingresos
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        <div>
                          <strong>Total:</strong> {moneda}{" "}
                          {metricas.ingresos.total.toFixed(2)}
                        </div>
                        <div>
                          <strong>Promedio:</strong> {moneda}{" "}
                          {metricas.ingresos.promedio.toFixed(2)}
                        </div>
                        <div>
                          <strong>Máximo:</strong> {moneda}{" "}
                          {metricas.ingresos.maximo.toFixed(2)}
                        </div>
                        <div>
                          <strong>Mínimo:</strong> {moneda}{" "}
                          {metricas.ingresos.minimo.toFixed(2)}
                        </div>
                        <div>
                          <strong>Desv. Estándar:</strong> {moneda}{" "}
                          {metricas.ingresos.desviacionEstandar.toFixed(2)}
                        </div>
                        <div>
                          <strong>Coef. Variación:</strong>{" "}
                          {metricas.ingresos.coeficienteVariacion.toFixed(2)}%
                        </div>
                        <div>
                          <strong>Tendencia:</strong>{" "}
                          <Tag
                            value={metricas.ingresos.tendencia}
                            severity={
                              metricas.ingresos.tendencia === "Creciente"
                                ? "success"
                                : metricas.ingresos.tendencia === "Decreciente"
                                ? "danger"
                                : "info"
                            }
                          />{" "}
                          (
                          {metricas.ingresos.tasaCrecimiento >= 0 ? "+" : ""}
                          {metricas.ingresos.tasaCrecimiento.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        border: "2px solid rgb(255, 99, 132)",
                        borderRadius: "8px",
                        padding: "1rem",
                        backgroundColor: "rgba(255, 99, 132, 0.05)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          color: "rgb(255, 99, 132)",
                        }}
                      >
                        📉 Estadísticas de Egresos
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        <div>
                          <strong>Total:</strong> {moneda}{" "}
                          {metricas.egresos.total.toFixed(2)}
                        </div>
                        <div>
                          <strong>Promedio:</strong> {moneda}{" "}
                          {metricas.egresos.promedio.toFixed(2)}
                        </div>
                        <div>
                          <strong>Máximo:</strong> {moneda}{" "}
                          {metricas.egresos.maximo.toFixed(2)}
                        </div>
                        <div>
                          <strong>Mínimo:</strong> {moneda}{" "}
                          {metricas.egresos.minimo.toFixed(2)}
                        </div>
                        <div>
                          <strong>Desv. Estándar:</strong> {moneda}{" "}
                          {metricas.egresos.desviacionEstandar.toFixed(2)}
                        </div>
                        <div>
                          <strong>Coef. Variación:</strong>{" "}
                          {metricas.egresos.coeficienteVariacion.toFixed(2)}%
                        </div>
                        <div>
                          <strong>Tendencia:</strong>{" "}
                          <Tag
                            value={metricas.egresos.tendencia}
                            severity={
                              metricas.egresos.tendencia === "Creciente"
                                ? "danger"
                                : metricas.egresos.tendencia === "Decreciente"
                                ? "success"
                                : "info"
                            }
                          />{" "}
                          ({metricas.egresos.tasaCrecimiento >= 0 ? "+" : ""}
                          {metricas.egresos.tasaCrecimiento.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        border: "2px solid rgb(75, 192, 192)",
                        borderRadius: "8px",
                        padding: "1rem",
                        backgroundColor: "rgba(75, 192, 192, 0.05)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          color: "rgb(75, 192, 192)",
                        }}
                      >
                        💰 Estadísticas de Saldo
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        <div>
                          <strong>Promedio:</strong> {moneda}{" "}
                          {metricas.saldo.promedio.toFixed(2)}
                        </div>
                        <div>
                          <strong>Máximo:</strong> {moneda}{" "}
                          {metricas.saldo.maximo.toFixed(2)}
                          <div style={{ fontSize: "0.8rem", color: "#666" }}>
                            ({metricas.saldo.periodoMaximo})
                          </div>
                        </div>
                        <div>
                          <strong>Mínimo:</strong> {moneda}{" "}
                          {metricas.saldo.minimo.toFixed(2)}
                          <div style={{ fontSize: "0.8rem", color: "#666" }}>
                            ({metricas.saldo.periodoMinimo})
                          </div>
                        </div>
                        <div>
                          <strong>Rango:</strong> {moneda}{" "}
                          {metricas.saldo.rango.toFixed(2)}
                        </div>
                        <div>
                          <strong>Desv. Estándar:</strong> {moneda}{" "}
                          {metricas.saldo.desviacionEstandar.toFixed(2)}
                        </div>
                        <div>
                          <strong>Coef. Variación:</strong>{" "}
                          {metricas.saldo.coeficienteVariacion.toFixed(2)}%
                        </div>
                        <div>
                          <strong>Tendencia:</strong>{" "}
                          <Tag
                            value={metricas.saldo.tendencia}
                            severity={
                              metricas.saldo.tendencia === "Creciente"
                                ? "success"
                                : metricas.saldo.tendencia === "Decreciente"
                                ? "danger"
                                : "info"
                            }
                          />{" "}
                          ({metricas.saldo.tasaCrecimiento >= 0 ? "+" : ""}
                          {metricas.saldo.tasaCrecimiento.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {estadisticas && (
                    <div
                      style={{
                        marginTop: "1.5rem",
                        padding: "1rem",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "8px",
                        border: "1px solid #2196f3",
                      }}
                    >
                      <h4
                        style={{ margin: "0 0 0.5rem 0", color: "#1976d2" }}
                      >
                        📊 Métricas Adicionales
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(250px, 1fr))",
                          gap: "0.5rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        <div>
                          <strong>Flujo Neto Promedio:</strong> {moneda}{" "}
                          {estadisticas.flujoNetoPromedio.toFixed(2)}
                        </div>
                        <div>
                          <strong>Ratio Ingresos/Egresos:</strong>{" "}
                          {estadisticas.ratioIngresosEgresos.toFixed(2)}x
                        </div>
                        <div>
                          <strong>Saldo Inicial:</strong> {moneda}{" "}
                          {estadisticas.saldoInicial.toFixed(2)}
                        </div>
                        <div>
                          <strong>Saldo Final:</strong> {moneda}{" "}
                          {estadisticas.saldoActual.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "1.5rem",
                      padding: "1rem",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <h4 style={{ margin: "0 0 0.5rem 0" }}>
                      📚 Interpretación de Métricas
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "1.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <li>
                        <strong>Desviación Estándar:</strong> Mide la
                        volatilidad. Valores altos indican mayor variabilidad
                        en los datos.
                      </li>
                      <li>
                        <strong>Coeficiente de Variación:</strong> Volatilidad
                        relativa (%). Permite comparar la variabilidad entre
                        diferentes métricas.
                      </li>
                      <li>
                        <strong>Tendencia:</strong> Creciente (&​gt;5%), Estable
                        (-5% a 5%), Decreciente (&​lt;-5%)
                      </li>
                      <li>
                        <strong>Ratio Ingresos/Egresos:</strong> &​gt;1 indica
                        más ingresos que egresos (positivo), &​lt;1 indica
                        déficit.
                      </li>
                      <li>
                        <strong>Flujo Neto:</strong> Diferencia entre ingresos
                        y egresos. Positivo = superávit, Negativo = déficit.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </TabPanel>
          </TabView>
        )}
      </div>
    </Dialog>
  );
}