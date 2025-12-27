// src/components/saldoCuentaCorriente/ProyeccionCuentaCorriente.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

export default function ProyeccionCuentaCorriente({
  visible,
  onHide,
  saldos = [],
  cuentaCorriente = null,
}) {
  const [periodo, setPeriodo] = useState("mensual");
  const [periodosProyectar, setPeriodosProyectar] = useState(6);
  const [chartDataProyeccion, setChartDataProyeccion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    if (visible && saldos.length > 0) {
      setChartDataProyeccion(null);
      setTimeout(() => {
        procesarProyeccion();
        setChartKey((prev) => prev + 1);
      }, 100);
    }
  }, [visible, saldos, periodo, periodosProyectar]);

  const procesarProyeccion = () => {
    const saldosOrdenados = [...saldos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

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

    const promedioIngresos =
      dataIngresosHistoricos.reduce((a, b) => a + b, 0) /
      dataIngresosHistoricos.length;
    const promedioEgresos =
      dataEgresosHistoricos.reduce((a, b) => a + b, 0) /
      dataEgresosHistoricos.length;

    const labelsProyectados = [];
    const dataIngresosProyectados = [];
    const dataEgresosProyectados = [];
    const dataSaldoProyectado = [];

    let ultimoSaldo = dataSaldoHistorico[dataSaldoHistorico.length - 1] || 0;

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

      dataIngresosProyectados.push(promedioIngresos);
      dataEgresosProyectados.push(promedioEgresos);
      ultimoSaldo = ultimoSaldo + promedioIngresos - promedioEgresos;
      dataSaldoProyectado.push(ultimoSaldo);
    }

    const saldoProyectadoFinal =
      dataSaldoProyectado[dataSaldoProyectado.length - 1] || 0;
    const variacionProyectada =
      saldoProyectadoFinal - dataSaldoHistorico[dataSaldoHistorico.length - 1];

    setEstadisticas({
      saldoActual: dataSaldoHistorico[dataSaldoHistorico.length - 1] || 0,
      saldoProyectado: saldoProyectadoFinal,
      variacionProyectada,
      promedioIngresos,
      promedioEgresos,
      periodosProyectados: periodosProyectar,
    });

    setChartDataProyeccion({
      labels: labelsProyectados,
      datasets: [
        {
          label: "Ingresos Proyectados",
          data: dataIngresosProyectados,
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
        {
          label: "Egresos Proyectados",
          data: dataEgresosProyectados,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
        {
          label: "Saldo Proyectado",
          data: dataSaldoProyectado,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
        },
      ],
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#495057",
          font: {
            size: 12,
            weight: "bold",
          },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            const moneda = cuentaCorriente?.moneda?.simbolo || "";
            return `${
              context.dataset.label
            }: ${moneda} ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          color: "#495057",
          font: { size: 11 },
        },
        grid: {
          color: "#ebedef",
          drawBorder: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#495057",
          font: { size: 12 },
          callback: function (value) {
            const moneda = cuentaCorriente?.moneda?.simbolo || "";
            return `${moneda} ${value.toFixed(0)}`;
          },
        },
        grid: {
          color: "#ebedef",
          drawBorder: false,
        },
      },
    },
  };

  const periodoOptions = [
    { label: "Mensual", value: "mensual" },
    { label: "Anual", value: "anual" },
  ];

  const moneda = cuentaCorriente?.moneda?.simbolo || "";

  return (
    <Dialog
      header={
        <div>
          <i className="pi pi-chart-bar" style={{ marginRight: "0.5rem" }} />
          Proyección Financiera
        </div>
      }
      visible={visible}
      style={{ width: "90vw", maxWidth: "1400px" }}
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

        {estadisticas && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
              marginTop: "1rem",
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
                  Períodos Proyectados
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {estadisticas.periodosProyectados}
                </div>
              </div>
            </Tag>
          </div>
        )}

        <div style={{ height: "500px", marginBottom: "1rem" }}>
          {chartDataProyeccion && (
            <Chart
              key={chartKey}
              type="bar"
              data={chartDataProyeccion}
              options={chartOptions}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}
