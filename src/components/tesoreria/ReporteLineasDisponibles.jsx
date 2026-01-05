// src/components/tesoreria/ReporteLineasDisponibles.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Card } from "primereact/card";
import { getReporteLineasDisponibles } from "../../api/tesoreria/lineaCredito";
import { getAllEmpresas } from "../../api/empresa";
import { generarPDFReporteLineasDisponibles, descargarPDFReporte } from "./ReporteLineasDisponiblesPDF";

export default function ReporteLineasDisponibles() {
  const toast = useRef(null);
  const [reporte, setReporte] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      const data = await getAllEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las empresas",
        life: 3000,
      });
    }
  };

  const cargarReporte = async () => {
    if (!empresaSeleccionada) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Seleccione una empresa",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const data = await getReporteLineasDisponibles(empresaSeleccionada);
      setReporte(data);

      if (data.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "Sin resultados",
          detail: "No hay líneas de crédito para esta empresa",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al cargar reporte:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el reporte",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!reporte || reporte.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay datos para exportar",
        life: 3000,
      });
      return;
    }

    setGenerandoPDF(true);
    try {
      const empresaData = empresas.find(e => Number(e.id) === Number(empresaSeleccionada));
      const pdfBytes = await generarPDFReporteLineasDisponibles(reporte, empresaData);
      
      const nombreArchivo = `reporte-lineas-credito-${empresaData?.razonSocial || 'empresa'}-${new Date().toISOString().split('T')[0]}.pdf`;
      descargarPDFReporte(pdfBytes, nombreArchivo);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "PDF generado correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo generar el PDF",
        life: 3000,
      });
    } finally {
      setGenerandoPDF(false);
    }
  };

  const formatCurrency = (value, moneda = "PEN") => {
    const simbolo = moneda === "USD" ? "$" : "S/";
    return `${simbolo} ${new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0)}`;
  };

  const montoAprobadoTemplate = (rowData) => {
    return formatCurrency(rowData.montoAprobado, rowData.moneda?.codigo);
  };

  const montoUtilizadoTemplate = (rowData) => {
    return formatCurrency(rowData.montoUtilizado, rowData.moneda?.codigo);
  };

  const montoDisponibleTemplate = (rowData) => {
    return formatCurrency(rowData.montoDisponible, rowData.moneda?.codigo);
  };

  const porcentajeUsoTemplate = (rowData) => {
    const porcentaje = rowData.montoAprobado > 0
      ? ((rowData.montoUtilizado / rowData.montoAprobado) * 100).toFixed(1)
      : 0;

    let color = "#22c55e";
    if (porcentaje > 80) color = "#ef4444";
    else if (porcentaje > 50) color = "#f59e0b";

    return (
      <div>
        <ProgressBar
          value={parseFloat(porcentaje)}
          showValue={false}
          style={{ height: "8px", marginBottom: "4px" }}
          color={color}
        />
        <span style={{ fontSize: "0.85rem", fontWeight: "600", color }}>
          {porcentaje}%
        </span>
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    const estadoMap = {
      APROBADA: { label: "APROBADA", color: "#3b82f6" },
      VIGENTE: { label: "VIGENTE", color: "#22c55e" },
      VENCIDA: { label: "VENCIDA", color: "#ef4444" },
      CANCELADA: { label: "CANCELADA", color: "#6b7280" },
    };

    const estado = estadoMap[rowData.estado?.descripcion] || {
      label: rowData.estado?.descripcion || "N/A",
      color: "#6b7280",
    };

    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: estado.color,
          color: "white",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
        {estado.label}
      </span>
    );
  };

  const calcularTotales = () => {
    return reporte.reduce(
      (acc, linea) => {
        acc.aprobado += Number(linea.montoAprobado || 0);
        acc.utilizado += Number(linea.montoUtilizado || 0);
        acc.disponible += Number(linea.montoDisponible || 0);
        return acc;
      },
      { aprobado: 0, utilizado: 0, disponible: 0 }
    );
  };

  const totales = calcularTotales();
  const porcentajeUsoTotal = totales.aprobado > 0
    ? ((totales.utilizado / totales.aprobado) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <Toast ref={toast} />

      <Card>
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label htmlFor="empresa" style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Empresa
              </label>
              <Dropdown
                id="empresa"
                value={empresaSeleccionada}
                options={empresas.map((e) => ({
                  label: e.razonSocial,
                  value: Number(e.id),
                }))}
                onChange={(e) => setEmpresaSeleccionada(e.value)}
                placeholder="Seleccionar empresa"
                filter
                filterBy="label"
                style={{ width: "100%" }}
              />
            </div>

            <Button
              label="Generar Reporte"
              icon="pi pi-search"
              onClick={cargarReporte}
              loading={loading}
              disabled={!empresaSeleccionada}
            />

            <Button
              label="Exportar PDF"
              icon="pi pi-file-pdf"
              className="p-button-success"
              onClick={exportPDF}
              loading={generandoPDF}
              disabled={!reporte || reporte.length === 0}
            />
          </div>
        </div>

        {reporte && reporte.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <Card
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Total Aprobado
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {formatCurrency(totales.aprobado)}
                </p>
              </Card>

              <Card
                style={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Total Utilizado
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {formatCurrency(totales.utilizado)}
                </p>
              </Card>

              <Card
                style={{
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Total Disponible
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {formatCurrency(totales.disponible)}
                </p>
              </Card>

              <Card
                style={{
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  % Uso Total
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {porcentajeUsoTotal}%
                </p>
              </Card>
            </div>

            <DataTable
              value={reporte}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              responsiveLayout="scroll"
              stripedRows
              emptyMessage="No hay líneas de crédito"
            >
              <Column field="numeroLinea" header="Número Línea" sortable />
              <Column
                field="banco.nombre"
                header="Banco"
                sortable
              />
              <Column field="tipoLinea" header="Tipo" sortable />
              <Column
                field="moneda.codigo"
                header="Moneda"
                sortable
              />
              <Column
                header="Monto Aprobado"
                body={montoAprobadoTemplate}
                sortable
                sortField="montoAprobado"
              />
              <Column
                header="Monto Utilizado"
                body={montoUtilizadoTemplate}
                sortable
                sortField="montoUtilizado"
              />
              <Column
                header="Monto Disponible"
                body={montoDisponibleTemplate}
                sortable
                sortField="montoDisponible"
              />
              <Column header="% Uso" body={porcentajeUsoTemplate} />
              <Column header="Estado" body={estadoTemplate} />
            </DataTable>
          </>
        )}
      </Card>
    </div>
  );
}