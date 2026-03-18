import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { getMovimientosCajaPorCuenta } from "../../api/movimientoCaja";

const MovimientosCuentaDialog = ({ visible, onHide, cuenta, toast }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  useEffect(() => {
    if (visible && cuenta) {
      cargarMovimientos();
    }
  }, [visible, cuenta]);

  const cargarMovimientos = async () => {
    if (!cuenta) return;

    try {
      setLoading(true);
      const movs = await getMovimientosCajaPorCuenta(
        cuenta.id,
        fechaInicio,
        fechaFin
      );
      setMovimientos(movs);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar movimientos de la cuenta",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    cargarMovimientos();
  };

  const handleLimpiarFiltros = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setTimeout(() => cargarMovimientos(), 100);
  };

  // Calcular totales
  const calcularTotalIngresos = () => {
    return movimientos
      .filter((m) => m.tipoMovimiento?.esIngreso === true)
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  };

  const calcularTotalEgresos = () => {
    return movimientos
      .filter((m) => m.tipoMovimiento?.esIngreso === false)
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  };

  const calcularSaldoNeto = () => {
    return calcularTotalIngresos() - calcularTotalEgresos();
  };

  // Templates
  const fechaTemplate = (rowData) => {
    const fecha = new Date(rowData.fechaOperacionMovCaja);
    return fecha.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const tipoTemplate = (rowData) => {
    const esIngreso = rowData.tipoMovimiento?.esIngreso;
    return (
      <Tag
        value={esIngreso ? "INGRESO" : "EGRESO"}
        severity={esIngreso ? "success" : "danger"}
        icon={esIngreso ? "pi pi-arrow-down" : "pi pi-arrow-up"}
        style={{ fontWeight: "bold" }}
      />
    );
  };

  const montoTemplate = (rowData) => {
    const esIngreso = rowData.tipoMovimiento?.esIngreso;
    const monto = Number(rowData.monto || 0);
    return (
      <span
        style={{
          fontWeight: "bold",
          color: esIngreso ? "#22c55e" : "#ef4444",
        }}
      >
        {rowData.moneda?.simbolo}{" "}
        {monto.toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    );
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoMovimientoCaja?.descripcion;
    let severity = "info";

    if (estado === "PENDIENTE") severity = "warning";
    if (estado === "VALIDADO") severity = "info";
    if (estado === "ASIENTO GENERADO") severity = "success";

    return <Tag value={estado} severity={severity} />;
  };

  const entidadTemplate = (rowData) => {
    return (
      <span style={{ fontSize: "12px" }}>
        {rowData.entidadComercial?.razonSocial || "-"}
      </span>
    );
  };

  const headerTemplate = () => {
    return (
      <div>
        <h3 style={{ margin: 0 }}>
          <i className="pi pi-list" style={{ marginRight: "10px" }} />
          Movimientos de Cuenta
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
      style={{ width: "95vw", maxWidth: "1400px" }}
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

      {/* Tabla de Movimientos */}
      <DataTable
        value={movimientos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No hay movimientos registrados"
        style={{ fontSize: "12px" }}
        stripedRows
        showGridlines
      >
        <Column
          field="fechaOperacionMovCaja"
          header="Fecha"
          body={fechaTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="tipoMovimiento.nombre"
          header="Tipo"
          body={tipoTemplate}
          sortable
          style={{ width: "130px" }}
        />
        <Column
          field="monto"
          header="Monto"
          body={montoTemplate}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="entidadComercial.razonSocial"
          header="Entidad Comercial"
          body={entidadTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ minWidth: "250px" }}
        />
        <Column
          field="tipoReferencia.descripcion"
          header="Tipo Ref."
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="estadoMovimientoCaja.descripcion"
          header="Estado"
          body={estadoTemplate}
          sortable
          style={{ width: "150px" }}
        />
      </DataTable>

      {/* Resumen */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ marginTop: 0, marginBottom: "16px" }}>
          <i className="pi pi-chart-bar" style={{ marginRight: "8px" }} />
          Resumen del Período
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
              {calcularTotalIngresos().toLocaleString("es-PE", {
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
              {calcularTotalEgresos().toLocaleString("es-PE", {
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
              Saldo Neto
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: calcularSaldoNeto() >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              {cuenta?.moneda?.simbolo}{" "}
              {calcularSaldoNeto().toLocaleString("es-PE", {
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
              border: "2px solid #8b5cf6",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
              Total Movimientos
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#8b5cf6" }}>
              {movimientos.length}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default MovimientosCuentaDialog;