import React, { useState, useEffect, useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

const AnalisisMovimientoCaja = ({
  movimientos = [],
  empresas = [],
  monedas = [],
  estadosMultiFuncion = [],
  loading = false
}) => {
  const [periodo, setPeriodo] = useState("mensual");
  const [empresaFiltro, setEmpresaFiltro] = useState(null);
  const [monedaFiltro, setMonedaFiltro] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [chartKey, setChartKey] = useState(0);

  const periodosOptions = [
    { label: "Diario", value: "diario" },
    { label: "Semanal", value: "semanal" },
    { label: "Mensual", value: "mensual" },
    { label: "Anual", value: "anual" }
  ];

  // Filtrar movimientos según criterios
  const movimientosFiltrados = useMemo(() => {
    let filtrados = [...movimientos];

    if (empresaFiltro) {
      filtrados = filtrados.filter(m => Number(m.empresaOrigenId) === Number(empresaFiltro));
    }

    if (monedaFiltro) {
      filtrados = filtrados.filter(m => Number(m.monedaId) === Number(monedaFiltro));
    }

    if (fechaInicio) {
      filtrados = filtrados.filter(m => new Date(m.fechaOperacionMovCaja) >= fechaInicio);
    }

    if (fechaFin) {
      filtrados = filtrados.filter(m => new Date(m.fechaOperacionMovCaja) <= fechaFin);
    }

    return filtrados.sort((a, b) => new Date(a.fechaOperacionMovCaja) - new Date(b.fechaOperacionMovCaja));
  }, [movimientos, empresaFiltro, monedaFiltro, fechaInicio, fechaFin]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalIngresos = movimientosFiltrados
      .filter(m => Number(m.monto) > 0)
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    const totalEgresos = movimientosFiltrados
      .filter(m => Number(m.monto) < 0)
      .reduce((sum, m) => sum + Math.abs(Number(m.monto || 0)), 0);

    const saldoNeto = totalIngresos - totalEgresos;

    const cantidadIngresos = movimientosFiltrados.filter(m => Number(m.monto) > 0).length;
    const cantidadEgresos = movimientosFiltrados.filter(m => Number(m.monto) < 0).length;

    const promedioIngresos = cantidadIngresos > 0 ? totalIngresos / cantidadIngresos : 0;
    const promedioEgresos = cantidadEgresos > 0 ? totalEgresos / cantidadEgresos : 0;

    return {
      totalIngresos,
      totalEgresos,
      saldoNeto,
      cantidadIngresos,
      cantidadEgresos,
      promedioIngresos,
      promedioEgresos,
      totalMovimientos: movimientosFiltrados.length
    };
  }, [movimientosFiltrados]);

  // Procesar datos para gráfico de líneas (evolución temporal)
  const chartDataLineas = useMemo(() => {
    if (movimientosFiltrados.length === 0) return null;

    const datosPorPeriodo = {};

    movimientosFiltrados.forEach(mov => {
      const fecha = new Date(mov.fechaOperacionMovCaja);
      let clave = "";

      switch (periodo) {
        case "diario":
          clave = fecha.toLocaleDateString("es-PE");
          break;
        case "semanal":
          const semana = Math.ceil(fecha.getDate() / 7);
          clave = `Sem ${semana} ${fecha.toLocaleString("es-PE", { month: "short" })} ${fecha.getFullYear()}`;
          break;
        case "mensual":
          clave = `${fecha.toLocaleString("es-PE", { month: "short" })} ${fecha.getFullYear()}`;
          break;
        case "anual":
          clave = fecha.getFullYear().toString();
          break;
        default:
          clave = fecha.toLocaleDateString("es-PE");
      }

      if (!datosPorPeriodo[clave]) {
        datosPorPeriodo[clave] = { ingresos: 0, egresos: 0, saldo: 0 };
      }

      const monto = Number(mov.monto || 0);
      if (monto > 0) {
        datosPorPeriodo[clave].ingresos += monto;
      } else {
        datosPorPeriodo[clave].egresos += Math.abs(monto);
      }
    });

    const labels = Object.keys(datosPorPeriodo);
    const dataIngresos = labels.map(label => datosPorPeriodo[label].ingresos);
    const dataEgresos = labels.map(label => datosPorPeriodo[label].egresos);
    const dataSaldo = labels.map(label => datosPorPeriodo[label].ingresos - datosPorPeriodo[label].egresos);

    return {
      labels,
      datasets: [
        {
          label: "Ingresos",
          data: dataIngresos,
          borderColor: "#22C55E",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.4,
          fill: true
        },
        {
          label: "Egresos",
          data: dataEgresos,
          borderColor: "#EF4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.4,
          fill: true
        },
        {
          label: "Saldo Neto",
          data: dataSaldo,
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [movimientosFiltrados, periodo]);

  // Procesar datos para gráfico de barras (por empresa)
  const chartDataBarras = useMemo(() => {
    if (movimientosFiltrados.length === 0 || empresas.length === 0) return null;

    const datosPorEmpresa = {};

    movimientosFiltrados.forEach(mov => {
      const empresaId = mov.empresaOrigenId;
      if (!datosPorEmpresa[empresaId]) {
        datosPorEmpresa[empresaId] = { ingresos: 0, egresos: 0 };
      }

      const monto = Number(mov.monto || 0);
      if (monto > 0) {
        datosPorEmpresa[empresaId].ingresos += monto;
      } else {
        datosPorEmpresa[empresaId].egresos += Math.abs(monto);
      }
    });

    const labels = Object.keys(datosPorEmpresa).map(id => {
      const empresa = empresas.find(e => Number(e.id) === Number(id));
      return empresa?.razonSocial || `Empresa ${id}`;
    });

    const dataIngresos = Object.values(datosPorEmpresa).map(d => d.ingresos);
    const dataEgresos = Object.values(datosPorEmpresa).map(d => d.egresos);

    return {
      labels,
      datasets: [
        {
          label: "Ingresos",
          data: dataIngresos,
          backgroundColor: "#22C55E"
        },
        {
          label: "Egresos",
          data: dataEgresos,
          backgroundColor: "#EF4444"
        }
      ]
    };
  }, [movimientosFiltrados, empresas]);

  // Procesar datos para gráfico de torta (distribución por tipo)
  const chartDataTorta = useMemo(() => {
    if (movimientosFiltrados.length === 0) return null;

    const ingresos = movimientosFiltrados.filter(m => Number(m.monto) > 0).length;
    const egresos = movimientosFiltrados.filter(m => Number(m.monto) < 0).length;

    return {
      labels: ["Ingresos", "Egresos"],
      datasets: [
        {
          data: [ingresos, egresos],
          backgroundColor: ["#22C55E", "#EF4444"],
          hoverBackgroundColor: ["#16A34A", "#DC2626"]
        }
      ]
    };
  }, [movimientosFiltrados]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top"
      },
      tooltip: {
        mode: "index",
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return "S/ " + value.toLocaleString("es-PE", { minimumFractionDigits: 2 });
          }
        }
      }
    }
  };

  const chartOptionsTorta = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom"
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  const limpiarFiltros = () => {
    setEmpresaFiltro(null);
    setMonedaFiltro(null);
    setFechaInicio(null);
    setFechaFin(null);
    setPeriodo("mensual");
    setChartKey(prev => prev + 1);
  };

  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [periodo, empresaFiltro, monedaFiltro, fechaInicio, fechaFin]);

  const formatCurrency = (value) => {
    return `S/ ${Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="p-fluid">
      <Card className="mb-3">
        <div className="grid">
          <div className="col-12 md:col-3">
            <label className="block mb-2 font-semibold">Periodo</label>
            <Dropdown
              value={periodo}
              options={periodosOptions}
              onChange={(e) => setPeriodo(e.value)}
              placeholder="Seleccione periodo"
            />
          </div>
          <div className="col-12 md:col-3">
            <label className="block mb-2 font-semibold">Empresa</label>
            <Dropdown
              value={empresaFiltro}
              options={empresas}
              onChange={(e) => setEmpresaFiltro(e.value)}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder="Todas las empresas"
              showClear
              filter
            />
          </div>
          <div className="col-12 md:col-2">
            <label className="block mb-2 font-semibold">Moneda</label>
            <Dropdown
              value={monedaFiltro}
              options={monedas}
              onChange={(e) => setMonedaFiltro(e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Todas"
              showClear
            />
          </div>
          <div className="col-12 md:col-2">
            <label className="block mb-2 font-semibold">Fecha Inicio</label>
            <Calendar
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.value)}
              dateFormat="dd/mm/yy"
              placeholder="Desde"
              showIcon
              showButtonBar
            />
          </div>
          <div className="col-12 md:col-2">
            <label className="block mb-2 font-semibold">Fecha Fin</label>
            <Calendar
              value={fechaFin}
              onChange={(e) => setFechaFin(e.value)}
              dateFormat="dd/mm/yy"
              placeholder="Hasta"
              showIcon
              showButtonBar
            />
          </div>
        </div>
        <div className="flex justify-content-end mt-3">
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            className="p-button-outlined"
            onClick={limpiarFiltros}
          />
        </div>
      </Card>

      <div className="grid">
        <div className="col-12 md:col-3">
          <Card className="text-center bg-green-50">
            <i className="pi pi-arrow-up text-green-600 text-4xl mb-2"></i>
            <h3 className="text-green-700 m-0 mb-2">Total Ingresos</h3>
            <p className="text-2xl font-bold text-green-800 m-0">{formatCurrency(estadisticas.totalIngresos)}</p>
            <Tag value={`${estadisticas.cantidadIngresos} movimientos`} severity="success" className="mt-2" />
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card className="text-center bg-red-50">
            <i className="pi pi-arrow-down text-red-600 text-4xl mb-2"></i>
            <h3 className="text-red-700 m-0 mb-2">Total Egresos</h3>
            <p className="text-2xl font-bold text-red-800 m-0">{formatCurrency(estadisticas.totalEgresos)}</p>
            <Tag value={`${estadisticas.cantidadEgresos} movimientos`} severity="danger" className="mt-2" />
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card className="text-center bg-blue-50">
            <i className="pi pi-chart-line text-blue-600 text-4xl mb-2"></i>
            <h3 className="text-blue-700 m-0 mb-2">Saldo Neto</h3>
            <p className={`text-2xl font-bold m-0 ${estadisticas.saldoNeto >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatCurrency(estadisticas.saldoNeto)}
            </p>
            <Tag 
              value={estadisticas.saldoNeto >= 0 ? "Positivo" : "Negativo"} 
              severity={estadisticas.saldoNeto >= 0 ? "success" : "danger"} 
              className="mt-2" 
            />
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card className="text-center bg-purple-50">
            <i className="pi pi-list text-purple-600 text-4xl mb-2"></i>
            <h3 className="text-purple-700 m-0 mb-2">Total Movimientos</h3>
            <p className="text-2xl font-bold text-purple-800 m-0">{estadisticas.totalMovimientos}</p>
            <div className="mt-2">
              <Tag value={`Promedio Ingreso: ${formatCurrency(estadisticas.promedioIngresos)}`} severity="info" className="mr-1" />
            </div>
          </Card>
        </div>
      </div>

      <Divider />

      <div className="grid">
        <div className="col-12 lg:col-8">
          <Card title="Evolución Temporal de Movimientos">
            <div style={{ height: "400px" }}>
              {chartDataLineas ? (
                <Chart key={`lineas-${chartKey}`} type="line" data={chartDataLineas} options={chartOptions} />
              ) : (
                <div className="flex align-items-center justify-content-center h-full">
                  <p className="text-500">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="col-12 lg:col-4">
          <Card title="Distribución Ingresos vs Egresos">
            <div style={{ height: "400px" }}>
              {chartDataTorta ? (
                <Chart key={`torta-${chartKey}`} type="doughnut" data={chartDataTorta} options={chartOptionsTorta} />
              ) : (
                <div className="flex align-items-center justify-content-center h-full">
                  <p className="text-500">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid mt-3">
        <div className="col-12">
          <Card title="Movimientos por Empresa">
            <div style={{ height: "400px" }}>
              {chartDataBarras ? (
                <Chart key={`barras-${chartKey}`} type="bar" data={chartDataBarras} options={chartOptions} />
              ) : (
                <div className="flex align-items-center justify-content-center h-full">
                  <p className="text-500">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalisisMovimientoCaja;
