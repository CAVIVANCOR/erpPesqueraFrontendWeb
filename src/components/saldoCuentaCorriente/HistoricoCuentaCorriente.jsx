// src/components/saldoCuentaCorriente/HistoricoCuentaCorriente.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";

export default function HistoricoCuentaCorriente({
  visible,
  onHide,
  saldos = [],
  cuentaCorriente = null,
}) {
  const [periodo, setPeriodo] = useState("mensual");
  const [chartData, setChartData] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    if (visible && saldos.length > 0) {
      setChartData(null);
      setTimeout(() => {
        procesarDatos();
        setChartKey((prev) => prev + 1);
      }, 100);
    }
  }, [visible, saldos, periodo]);

  const procesarDatos = () => {
    const saldosOrdenados = [...saldos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    let labels = [];
    let dataIngresos = [];
    let dataEgresos = [];
    let dataSaldo = [];

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

      labels = Object.keys(datosPorMes);
      dataIngresos = labels.map((label) => datosPorMes[label].ingresos);
      dataEgresos = labels.map((label) => datosPorMes[label].egresos);
      dataSaldo = labels.map((label) => datosPorMes[label].saldoFinal);
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

      labels = Object.keys(datosPorAnio);
      dataIngresos = labels.map((label) => datosPorAnio[label].ingresos);
      dataEgresos = labels.map((label) => datosPorAnio[label].egresos);
      dataSaldo = labels.map((label) => datosPorAnio[label].saldoFinal);
    }

    const totalIngresos = dataIngresos.reduce((a, b) => a + b, 0);
    const totalEgresos = dataEgresos.reduce((a, b) => a + b, 0);
    const promedioIngresos = totalIngresos / dataIngresos.length;
    const promedioEgresos = totalEgresos / dataEgresos.length;
    const saldoActual = dataSaldo[dataSaldo.length - 1] || 0;

    setEstadisticas({
      totalIngresos,
      totalEgresos,
      promedioIngresos,
      promedioEgresos,
      saldoActual,
      periodos: labels.length,
    });

    setChartData({
      labels,
      datasets: [
        {
          label: "Ingresos",
          data: dataIngresos,
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
        {
          label: "Egresos",
          data: dataEgresos,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
        {
          label: "Saldo",
          data: dataSaldo,
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
          <i className="pi pi-chart-line" style={{ marginRight: "0.5rem" }} />
          Análisis Histórico
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
                backgroundColor: "rgba(54, 162, 235, 0.7)",
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
                backgroundColor: "rgba(255, 99, 132, 0.7)",
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
                  Períodos Analizados
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {estadisticas.periodos}
                </div>
              </div>
            </Tag>
          </div>
        )}

        <div style={{ height: "500px" }}>
          {chartData && (
            <Chart
              key={chartKey}
              type="bar"
              data={chartData}
              options={chartOptions}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}
