// src/components/saldoCuentaCorriente/ProyeccionCuentaCorriente.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { Message } from "primereact/message";
import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ProyeccionCuentaCorriente({
  visible,
  onHide,
  saldos = [],
  cuentaCorriente = null,
}) {
  const [periodo, setPeriodo] = useState("mensual");
  const [periodosProyectar, setPeriodosProyectar] = useState(6);
  const [chartDataProyeccion, setChartDataProyeccion] = useState([]);
  const [chartDataEscenarios, setChartDataEscenarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [datosInsuficientes, setDatosInsuficientes] = useState(false);

  useEffect(() => {
    if (visible && saldos.length > 0) {
      setChartDataProyeccion([]);
      setChartDataEscenarios([]);
      setDatosInsuficientes(false);
      setTimeout(() => {
        procesarProyeccion();
      }, 100);
    }
  }, [visible, saldos, periodo, periodosProyectar]);

  const calcularRegresionLineal = (valores) => {
    const n = valores.length;
    if (n < 2) return null;

    const indices = valores.map((_, i) => i + 1);

    const promedioX = indices.reduce((a, b) => a + b, 0) / n;
    const promedioY = valores.reduce((a, b) => a + b, 0) / n;

    let numerador = 0;
    let denominador = 0;

    for (let i = 0; i < n; i++) {
      numerador += (indices[i] - promedioX) * (valores[i] - promedioY);
      denominador += Math.pow(indices[i] - promedioX, 2);
    }

    const pendiente = denominador !== 0 ? numerador / denominador : 0;
    const intercepto = promedioY - pendiente * promedioX;

    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const valorPredicho = intercepto + pendiente * indices[i];
      ssRes += Math.pow(valores[i] - valorPredicho, 2);
      ssTot += Math.pow(valores[i] - promedioY, 2);
    }

    const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

    const desviacionEstandar = Math.sqrt(
      valores.reduce((sum, val) => sum + Math.pow(val - promedioY, 2), 0) / n
    );

    return {
      pendiente,
      intercepto,
      r2,
      desviacionEstandar,
      confianza: r2 > 0.7 ? "Alta" : r2 > 0.4 ? "Media" : "Baja",
    };
  };

  const proyectarConTendencia = (datosHistoricos, periodosProyectar) => {
    const n = datosHistoricos.length;

    if (n < 3) {
      const promedio = datosHistoricos.reduce((a, b) => a + b, 0) / n;
      const proyecciones = {
        base: [],
        optimista: [],
        pesimista: [],
        confianza: [],
      };

      for (let i = 1; i <= periodosProyectar; i++) {
        proyecciones.base.push(promedio);
        proyecciones.optimista.push(promedio * 1.1);
        proyecciones.pesimista.push(promedio * 0.9);
        proyecciones.confianza.push(0.3);
      }

      return {
        proyecciones,
        regresion: {
          pendiente: 0,
          intercepto: promedio,
          r2: 0,
          desviacionEstandar: 0,
          confianza: "Baja",
        },
        metodoUsado: "promedio",
      };
    }

    const regresion = calcularRegresionLineal(datosHistoricos);
    if (!regresion) return null;

    const proyecciones = {
      base: [],
      optimista: [],
      pesimista: [],
      confianza: [],
    };

    for (let i = 1; i <= periodosProyectar; i++) {
      const valorProyectado =
        regresion.intercepto + regresion.pendiente * (n + i);

      const margenError = 1.96 * regresion.desviacionEstandar;
      const confianzaPeriodo = Math.max(0, regresion.r2 - i * 0.05);

      proyecciones.base.push(Math.max(0, valorProyectado));
      proyecciones.optimista.push(Math.max(0, valorProyectado + margenError));
      proyecciones.pesimista.push(Math.max(0, valorProyectado - margenError));
      proyecciones.confianza.push(confianzaPeriodo);
    }

    return {
      proyecciones,
      regresion,
      metodoUsado: "regresion",
    };
  };

  const procesarProyeccion = () => {
    const saldosOrdenados = [...saldos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    if (saldosOrdenados.length < 1) {
      setDatosInsuficientes(true);
      return;
    }

    let labelsHistoricos = [];
    let dataIngresosHistoricos = [];
    let dataEgresosHistoricos = [];
    let dataSaldoHistorico = [];

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
          };
        }

        datosPorMes[mesAnio].ingresos += Number(saldo.ingresos || 0);
        datosPorMes[mesAnio].egresos += Number(saldo.egresos || 0);
        datosPorMes[mesAnio].saldoFinal = Number(saldo.saldoActual || 0);
      });

      labelsHistoricos = Object.keys(datosPorMes);
      dataIngresosHistoricos = labelsHistoricos.map(
        (label) => datosPorMes[label].ingresos
      );
      dataEgresosHistoricos = labelsHistoricos.map(
        (label) => datosPorMes[label].egresos
      );
      dataSaldoHistorico = labelsHistoricos.map(
        (label) => datosPorMes[label].saldoFinal
      );
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
          };
        }

        datosPorAnio[anio].ingresos += Number(saldo.ingresos || 0);
        datosPorAnio[anio].egresos += Number(saldo.egresos || 0);
        datosPorAnio[anio].saldoFinal = Number(saldo.saldoActual || 0);
      });

      labelsHistoricos = Object.keys(datosPorAnio);
      dataIngresosHistoricos = labelsHistoricos.map(
        (label) => datosPorAnio[label].ingresos
      );
      dataEgresosHistoricos = labelsHistoricos.map(
        (label) => datosPorAnio[label].egresos
      );
      dataSaldoHistorico = labelsHistoricos.map(
        (label) => datosPorAnio[label].saldoFinal
      );
    }

    const proyeccionIngresos = proyectarConTendencia(
      dataIngresosHistoricos,
      periodosProyectar
    );
    const proyeccionEgresos = proyectarConTendencia(
      dataEgresosHistoricos,
      periodosProyectar
    );
    const proyeccionSaldo = proyectarConTendencia(
      dataSaldoHistorico,
      periodosProyectar
    );

    if (!proyeccionIngresos || !proyeccionEgresos || !proyeccionSaldo) {
      setDatosInsuficientes(true);
      return;
    }

    const labelsProyectados = [];
    for (let i = 1; i <= periodosProyectar; i++) {
      if (periodo === "mensual") {
        const ultimaFecha = new Date(
          saldosOrdenados[saldosOrdenados.length - 1].fecha
        );
        ultimaFecha.setMonth(ultimaFecha.getMonth() + i);
        labelsProyectados.push(
          `${ultimaFecha.toLocaleString("es-PE", {
            month: "short",
          })} ${ultimaFecha.getFullYear()}`
        );
      } else {
        const ultimoAnio = parseInt(
          labelsHistoricos[labelsHistoricos.length - 1]
        );
        labelsProyectados.push((ultimoAnio + i).toString());
      }
    }

    const saldoActual = dataSaldoHistorico[dataSaldoHistorico.length - 1] || 0;
    const saldoProyectadoBase =
      proyeccionSaldo.proyecciones.base[
        proyeccionSaldo.proyecciones.base.length - 1
      ] || 0;
    const variacionProyectada = saldoProyectadoBase - saldoActual;

    const promedioIngresos =
      dataIngresosHistoricos.reduce((a, b) => a + b, 0) /
      dataIngresosHistoricos.length;
    const promedioEgresos =
      dataEgresosHistoricos.reduce((a, b) => a + b, 0) /
      dataEgresosHistoricos.length;

    setEstadisticas({
      saldoActual,
      saldoProyectado: saldoProyectadoBase,
      variacionProyectada,
      promedioIngresos,
      promedioEgresos,
      periodosProyectados: periodosProyectar,
      metodoUsado: proyeccionSaldo.metodoUsado,
      datosHistoricos: dataSaldoHistorico.length,
    });

    setMetricas({
      ingresos: {
        tendencia:
          proyeccionIngresos.regresion.pendiente > 0
            ? "Creciente"
            : proyeccionIngresos.regresion.pendiente < 0
            ? "Decreciente"
            : "Estable",
        tasaCrecimiento:
          dataIngresosHistoricos[0] !== 0
            ? (
                (proyeccionIngresos.regresion.pendiente /
                  dataIngresosHistoricos[0]) *
                100
              ).toFixed(2)
            : "0.00",
        r2: (proyeccionIngresos.regresion.r2 * 100).toFixed(1),
        confiabilidad: proyeccionIngresos.regresion.confianza,
      },
      egresos: {
        tendencia:
          proyeccionEgresos.regresion.pendiente > 0
            ? "Creciente"
            : proyeccionEgresos.regresion.pendiente < 0
            ? "Decreciente"
            : "Estable",
        tasaCrecimiento:
          dataEgresosHistoricos[0] !== 0
            ? (
                (proyeccionEgresos.regresion.pendiente /
                  dataEgresosHistoricos[0]) *
                100
              ).toFixed(2)
            : "0.00",
        r2: (proyeccionEgresos.regresion.r2 * 100).toFixed(1),
        confiabilidad: proyeccionEgresos.regresion.confianza,
      },
      saldo: {
        tendencia:
          proyeccionSaldo.regresion.pendiente > 0
            ? "Creciente"
            : proyeccionSaldo.regresion.pendiente < 0
            ? "Decreciente"
            : "Estable",
        tasaCrecimiento:
          dataSaldoHistorico[0] !== 0
            ? (
                (proyeccionSaldo.regresion.pendiente / dataSaldoHistorico[0]) *
                100
              ).toFixed(2)
            : "0.00",
        r2: (proyeccionSaldo.regresion.r2 * 100).toFixed(1),
        confiabilidad: proyeccionSaldo.regresion.confianza,
      },
    });

    const chartDataProyeccionFormatted = labelsProyectados.map(
      (label, index) => ({
        periodo: label,
        ingresos: proyeccionIngresos.proyecciones.base[index],
        egresos: proyeccionEgresos.proyecciones.base[index],
        saldo: proyeccionSaldo.proyecciones.base[index],
      })
    );

    setChartDataProyeccion(chartDataProyeccionFormatted);

    const chartDataEscenariosFormatted = labelsProyectados.map(
      (label, index) => ({
        periodo: label,
        optimista: proyeccionSaldo.proyecciones.optimista[index],
        base: proyeccionSaldo.proyecciones.base[index],
        pesimista: proyeccionSaldo.proyecciones.pesimista[index],
      })
    );

    setChartDataEscenarios(chartDataEscenariosFormatted);
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

  return (
    <Dialog
      header={
        <div>
          <i className="pi pi-chart-bar" style={{ marginRight: "0.5rem" }} />
          Proyección Financiera Profesional
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
          <div
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <label htmlFor="periodosProyectar" style={{ fontWeight: "bold" }}>
              Proyectar:
            </label>
            <Button
              icon="pi pi-minus"
              onClick={() =>
                setPeriodosProyectar(Math.max(1, periodosProyectar - 1))
              }
              className="p-button-sm p-button-outlined"
              disabled={periodosProyectar <= 1}
            />
            <InputNumber
              inputId="periodosProyectar"
              value={periodosProyectar}
              onValueChange={(e) => setPeriodosProyectar(e.value)}
              min={1}
              max={24}
              style={{ width: "80px" }}
            />
            <Button
              icon="pi pi-plus"
              onClick={() =>
                setPeriodosProyectar(Math.min(24, periodosProyectar + 1))
              }
              className="p-button-sm p-button-outlined"
              disabled={periodosProyectar >= 24}
            />
          </div>
        </div>

        {datosInsuficientes && (
          <Message
            severity="warn"
            text="No hay suficientes datos históricos para generar proyecciones. Registre más movimientos de saldo para obtener análisis más precisos."
            style={{ marginBottom: "1rem", width: "100%" }}
          />
        )}

        {estadisticas && estadisticas.metodoUsado === "promedio" && (
          <Message
            severity="info"
            text={`Proyección basada en promedio simple (${estadisticas.datosHistoricos} ${estadisticas.datosHistoricos === 1 ? "registro" : "registros"}). Para proyecciones más precisas con regresión lineal, registre al menos 3 movimientos de saldo.`}
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
                backgroundColor: "rgba(75, 192, 192, 0.7)",
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
                backgroundColor: "rgb(75, 192, 192)",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Saldo Proyectado
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {moneda} {estadisticas.saldoProyectado.toFixed(2)}
                </div>
              </div>
            </Tag>
            <Tag
              style={{
                padding: "0.5rem 1rem",
                flex: "1 1 auto",
                minWidth: "150px",
                backgroundColor:
                  estadisticas.variacionProyectada >= 0
                    ? "rgb(75, 192, 192)"
                    : "rgb(255, 99, 132)",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>
                  Variación Proyectada
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {estadisticas.variacionProyectada >= 0 ? "+" : ""}
                  {moneda} {estadisticas.variacionProyectada.toFixed(2)}
                </div>
              </div>
            </Tag>
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
                  Promedio Ingresos
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {moneda} {estadisticas.promedioIngresos.toFixed(2)}
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
                  Promedio Egresos
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {moneda} {estadisticas.promedioEgresos.toFixed(2)}
                </div>
              </div>
            </Tag>
          </div>
        )}

        {!datosInsuficientes && (
          <TabView>
            <TabPanel header="Proyección Base" leftIcon="pi pi-chart-line">
              <div style={{ height: "500px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartDataProyeccion}>
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

            <TabPanel header="Escenarios" leftIcon="pi pi-sitemap">
              <div style={{ height: "500px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataEscenarios}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebedef" />
                    <XAxis
                      dataKey="periodo"
                      tick={{ fill: "#495057", fontSize: 11 }}
                      stroke="#495057"
                    />
                    <YAxis
                      tick={{ fill: "#495057", fontSize: 12 }}
                      stroke="#495057"
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
                    <Line
                      type="monotone"
                      dataKey="optimista"
                      stroke="rgb(76, 175, 80)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Optimista"
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="base"
                      stroke="rgb(75, 192, 192)"
                      strokeWidth={3}
                      name="Base"
                      dot={{ r: 4, fill: "rgb(75, 192, 192)" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pesimista"
                      stroke="rgb(244, 67, 54)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Pesimista"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
                        "repeat(auto-fit, minmax(300px, 1fr))",
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
                        📈 Análisis de Ingresos
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
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
                          />
                        </div>
                        <div>
                          <strong>Tasa de Crecimiento:</strong>{" "}
                          {metricas.ingresos.tasaCrecimiento}% por período
                        </div>
                        <div>
                          <strong>R² (Precisión):</strong>{" "}
                          {metricas.ingresos.r2}%
                        </div>
                        <div>
                          <strong>Confiabilidad:</strong>{" "}
                          <Tag
                            value={metricas.ingresos.confiabilidad}
                            severity={
                              metricas.ingresos.confiabilidad === "Alta"
                                ? "success"
                                : metricas.ingresos.confiabilidad === "Media"
                                ? "warning"
                                : "danger"
                            }
                          />
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
                        📉 Análisis de Egresos
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
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
                          />
                        </div>
                        <div>
                          <strong>Tasa de Crecimiento:</strong>{" "}
                          {metricas.egresos.tasaCrecimiento}% por período
                        </div>
                        <div>
                          <strong>R² (Precisión):</strong>{" "}
                          {metricas.egresos.r2}%
                        </div>
                        <div>
                          <strong>Confiabilidad:</strong>{" "}
                          <Tag
                            value={metricas.egresos.confiabilidad}
                            severity={
                              metricas.egresos.confiabilidad === "Alta"
                                ? "success"
                                : metricas.egresos.confiabilidad === "Media"
                                ? "warning"
                                : "danger"
                            }
                          />
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
                        💰 Análisis de Saldo
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
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
                          />
                        </div>
                        <div>
                          <strong>Tasa de Crecimiento:</strong>{" "}
                          {metricas.saldo.tasaCrecimiento}% por período
                        </div>
                        <div>
                          <strong>R² (Precisión):</strong> {metricas.saldo.r2}%
                        </div>
                        <div>
                          <strong>Confiabilidad:</strong>{" "}
                          <Tag
                            value={metricas.saldo.confiabilidad}
                            severity={
                              metricas.saldo.confiabilidad === "Alta"
                                ? "success"
                                : metricas.saldo.confiabilidad === "Media"
                                ? "warning"
                                : "danger"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "2rem",
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
                      }}
                    >
                      <li>
                        <strong>R² (Coeficiente de Determinación):</strong> Mide
                        qué tan bien el modelo se ajusta a los datos. Valores
                        cercanos a 100% indican alta precisión.
                      </li>
                      <li>
                        <strong>Confiabilidad:</strong> Alta (R² &​gt; 70%),
                        Media (R² &​gt; 40%), Baja (R² ≤ 40%)
                      </li>
                      <li>
                        <strong>Tasa de Crecimiento:</strong> Porcentaje de
                        cambio promedio por período basado en regresión lineal.
                      </li>
                      <li>
                        <strong>Escenarios:</strong> Optimista (+1.96σ), Base
                        (proyección), Pesimista (-1.96σ) con intervalo de
                        confianza del 95%.
                      </li>
                      {estadisticas.metodoUsado === "promedio" && (
                        <li style={{ color: "#ff9800", fontWeight: "bold" }}>
                          <strong>Nota:</strong> Con pocos datos históricos, se
                          usa promedio simple. Registre más movimientos para
                          análisis más precisos con regresión lineal.
                        </li>
                      )}
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