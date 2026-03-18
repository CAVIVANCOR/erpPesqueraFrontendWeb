import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { getSaldosCuentaCorriente } from "../../api/saldoCuentaCorriente";

const HistoricoSaldosDialog = ({ visible, onHide, cuenta, toast }) => {
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (visible && cuenta) {
      cargarHistorico();
    }
  }, [visible, cuenta]);

  useEffect(() => {
    if (saldos.length > 0) {
      prepararGrafico();
    }
  }, [saldos]);

  const cargarHistorico = async () => {
    if (!cuenta) return;

    try {
      setLoading(true);
      const saldosData = await getSaldosCuentaCorriente(
        cuenta.id,
        fechaInicio,
        fechaFin
      );
      setSaldos(saldosData);
    } catch (error) {
      console.error("Error al cargar histórico:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar histórico de saldos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    cargarHistorico();
  };

  const handleLimpiarFiltros = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setTimeout(() => cargarHistorico(), 100);
  };

  const prepararGrafico = () => {
    const labels = saldos.map((s) => {
      const fecha = new Date(s.fecha);
      return fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
      });
    });

    const dataSaldos = saldos.map((s) => Number(s.saldoActual || 0));
    const dataIngresos = saldos.map((s) => Number(s.ingresos || 0));
    const dataEgresos = saldos.map((s) => Number(s.egresos || 0));

    setChartData({
      labels: labels,
      datasets: [
        {
          label: "Saldo Actual",
          data: dataSaldos,
          fill: false,
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f6",
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Ingresos",
          data: dataIngresos,
          fill: false,
          borderColor: "#22c55e",
          backgroundColor: "#22c55e",
          tension: 0.4,
          yAxisID: "y1",
        },
        {
          label: "Egresos",
          data: dataEgresos,
          fill: false,
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    });
  };

  const chartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: "#495057",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#495057",
        },
        grid: {
          color: "#ebedef",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        ticks: {
          color: "#495057",
        },
        grid: {
          color: "#ebedef",
        },
        title: {
          display: true,
          text: "Saldo Actual",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        ticks: {
          color: "#495057",
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Ingresos / Egresos",
        },
      },
    },
  };

  // Templates
  const fechaTemplate = (rowData) => {
    const fecha = new Date(rowData.fecha);
    return fecha.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const montoTemplate = (rowData, field) => {
    const monto = Number(rowData[field] || 0);
    let color = "#000";
    if (field === "ingresos") color = "#22c55e";
    if (field === "egresos") color = "#ef4444";
    if (field === "saldoActual") color = monto >= 0 ? "#3b82f6" : "#ef4444";

    return (
      <span style={{ fontWeight: "bold", color }}>
        {cuenta?.moneda?.simbolo}{" "}
        {monto.toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    );
  };

  const conciliadoTemplate = (rowData) => {
    return rowData.conciliado ? (
      <i className="pi pi-check-circle" style={{ color: "#22c55e", fontSize: "20px" }} />
    ) : (
      <i className="pi pi-times-circle" style={{ color: "#ef4444", fontSize: "20px" }} />
    );
  };

  const headerTemplate = () => {
    return (
      <div>
        <h3 style={{ margin: 0 }}>
          <i className="pi pi-chart-line" style={{ marginRight: "10px" }} />
          Histórico de Saldos
        </h3>
        <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
          <strong>Cuenta:</strong> {cuenta?.numeroCuenta} | <strong>Banco:</strong>{" "}
          {cuenta?.banco?.nombre} | <strong>Moneda:</strong>{" "}
          {cuenta?.moneda?.simbolo}
        </div>
      </div>
    );
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={headerTemplate}
      style={{ width: "95vw", maxWidth: "1600px" }}
      maximizable
    >
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaInicio" style={{ display: "block", marginBottom: "8px" }}>
            Fecha Inicio
          </label>
          <Calendar
            id="fechaInicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Desde"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaFin" style={{ display: "block", marginBottom: "8px" }}>
            Fecha Fin
          </label>
          <Calendar
            id="fechaFin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Hasta"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
          <Button
            label="Filtrar"
            icon="pi pi-filter"
            onClick={handleFiltrar}
            className="p-button-primary"
          />
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            onClick={handleLimpiarFiltros}
            className="p-button-secondary"
          />
        </div>
      </div>

      {/* Gráfico */}
      {chartData && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ marginBottom: "16px" }}>
            <i className="pi pi-chart-line" style={{ marginRight: "8px" }} />
            Evolución de Saldos
          </h4>
          <Chart type="line" data={chartData} options={chartOptions} style={{ height: "400px" }} />
        </div>
      )}

      {/* Tabla de Histórico */}
      <DataTable
        value={saldos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No hay registros de saldos"
        style={{ fontSize: "12px" }}
        stripedRows
        showGridlines
      >
        <Column
          field="fecha"
          header="Fecha"
          body={fechaTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="saldoAnterior"
          header="Saldo Anterior"
          body={(rowData) => montoTemplate(rowData, "saldoAnterior")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="ingresos"
          header="Ingresos"
          body={(rowData) => montoTemplate(rowData, "ingresos")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="egresos"
          header="Egresos"
          body={(rowData) => montoTemplate(rowData, "egresos")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="saldoActual"
          header="Saldo Actual"
          body={(rowData) => montoTemplate(rowData, "saldoActual")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="saldoContable"
          header="Saldo Contable"
          body={(rowData) => montoTemplate(rowData, "saldoContable")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="diferencia"
          header="Diferencia"
          body={(rowData) => montoTemplate(rowData, "diferencia")}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="conciliado"
          header="Conciliado"
          body={conciliadoTemplate}
          sortable
          style={{ width: "100px", textAlign: "center" }}
        />
      </DataTable>

      {/* Estadísticas */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ marginTop: 0, marginBottom: "16px" }}>
          <i className="pi pi-info-circle" style={{ marginRight: "8px" }} />
          Estadísticas del Período
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "2px solid #22c55e",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
              Total Ingresos
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#22c55e" }}>
              {cuenta?.moneda?.simbolo}{" "}
              {saldos
                .reduce((sum, s) => sum + Number(s.ingresos || 0), 0)
                .toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "2px solid #ef4444",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
              Total Egresos
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ef4444" }}>
              {cuenta?.moneda?.simbolo}{" "}
              {saldos
                .reduce((sum, s) => sum + Number(s.egresos || 0), 0)
                .toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "2px solid #3b82f6",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
              Saldo Final
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: saldos.length > 0 && Number(saldos[saldos.length - 1]?.saldoActual || 0) >= 0
                  ? "#22c55e"
                  : "#ef4444",
              }}
            >
              {cuenta?.moneda?.simbolo}{" "}
              {saldos.length > 0
                ? Number(saldos[saldos.length - 1]?.saldoActual || 0).toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "2px solid #8b5cf6",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
              Registros
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#8b5cf6" }}>
              {saldos.length}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default HistoricoSaldosDialog;