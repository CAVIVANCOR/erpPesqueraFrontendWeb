import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import { generarPDFMovimientoFondos } from "./MovimientoFondosPDF";
import { getDatosReporteMovimientoFondos } from "../../api/reporteMovimientoFondos";

const REPORTES = [
  { clave: "movimientos", titulo: "Movimiento de Fondos", archivo: "movimiento-de-fondos" },
  { clave: "saldos", titulo: "Saldos por Cuentas Bancarias", archivo: "saldos-por-cuentas-bancarias" },
];

const rangoPorDefecto = (rangoFechas, movimientos) => {
  if (rangoFechas?.[0]) return [rangoFechas[0], rangoFechas[1] || rangoFechas[0]];
  const fechas = movimientos
    .map((m) => (m.fechaOperacionMovCaja ? new Date(m.fechaOperacionMovCaja).getTime() : null))
    .filter(Boolean);
  if (fechas.length === 0) return null;
  return [new Date(Math.min(...fechas)), new Date(Math.max(...fechas))];
};

const enRango = (m, rango) => {
  if (!rango?.[0] || !m.fechaOperacionMovCaja) return false;
  const desde = new Date(rango[0]);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(rango[1] || rango[0]);
  hasta.setHours(23, 59, 59, 999);
  const fecha = new Date(m.fechaOperacionMovCaja);
  return fecha >= desde && fecha <= hasta;
};

/**
 * Botón "Reporte" genérico y autónomo. Emite DOS reportes independientes, que se muestran a la vez:
 *  1) Movimiento de Fondos: diario, por empresa (cada una en página nueva), por cuenta y con subtotales por día.
 *  2) Saldos por Cuentas Bancarias: todas las cuentas que se movieron en el rango, por empresa.
 *
 * Props:
 *  - movimientos: movimientos de caja a reportar, de todas las empresas (con sus relaciones)
 *  - rangoFechas: [desde, hasta] sugerido (opcional; si no hay, se usa el de los movimientos)
 *  - empresas: catálogo de empresas (razonSocial, ruc, logo, id) para encabezados y logos por empresa
 *  - usuarioNombre: usuario que emite el reporte
 *  - toast: ref del Toast de la página (opcional)
 *  - disabled, label, className
 */
export default function ReporteMovimientoFondos({
  movimientos = [],
  rangoFechas = null,
  empresas = [],
  usuarioNombre = "",
  toast = null,
  disabled = false,
  label = "Reporte",
  className = "p-button-success",
}) {
  const [visible, setVisible] = useState(false);
  const [rango, setRango] = useState(null);
  const [incluirAnulados, setIncluirAnulados] = useState(false);
  const [incluirResumen, setIncluirResumen] = useState(true);
  const [incluirContabilidad, setIncluirContabilidad] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [pdfs, setPdfs] = useState({ movimientos: null, saldos: null });
  const [errores, setErrores] = useState({ movimientos: null, saldos: null });
  const [error, setError] = useState(null);
  const pdfsRef = useRef({ movimientos: null, saldos: null });

  const mostrar = (severity, summary, detail) =>
    toast?.current?.show({ severity, summary, detail, life: severity === "error" ? 6000 : 3500 });

  const liberarPdfs = () => {
    Object.values(pdfsRef.current).forEach((url) => url && URL.revokeObjectURL(url));
    pdfsRef.current = { movimientos: null, saldos: null };
    setPdfs({ movimientos: null, saldos: null });
    setErrores({ movimientos: null, saldos: null });
  };

  useEffect(() => () => Object.values(pdfsRef.current).forEach((url) => url && URL.revokeObjectURL(url)), []);

  const abrir = () => {
    setRango(rangoPorDefecto(rangoFechas, movimientos));
    setError(null);
    liberarPdfs();
    setVisible(true);
  };

  const cerrar = () => {
    setVisible(false);
    liberarPdfs();
  };

  const movimientosEnRango = useMemo(() => movimientos.filter((m) => enRango(m, rango)), [movimientos, rango]);

  const generar = async () => {
    if (!rango?.[0]) {
      setError("Seleccione el rango de fechas del reporte");
      return;
    }
    setGenerando(true);
    setError(null);
    liberarPdfs();
    try {
      let enriquecimiento = null;
      if (incluirContabilidad) {
        try {
          enriquecimiento = await getDatosReporteMovimientoFondos(movimientosEnRango.map((m) => Number(m.id)));
        } catch (err) {
          console.error("No se pudieron consultar asientos y saldos para el reporte:", err);
          mostrar(
            "warn",
            "Reporte sin datos contables",
            "No se pudieron consultar cuentas contables, asientos ni saldos. Se genera solo con los datos del movimiento."
          );
        }
      }

      const nuevos = { movimientos: null, saldos: null };
      const nuevosErrores = { movimientos: null, saldos: null };
      let resumen = null;

      for (const { clave } of REPORTES) {
        try {
          const resultado = await generarPDFMovimientoFondos({
            parte: clave,
            movimientos: movimientosEnRango,
            enriquecimiento,
            empresas,
            rango,
            opciones: { incluirAnulados, incluirResumen },
            usuarioNombre,
          });
          nuevos[clave] = URL.createObjectURL(new Blob([resultado.bytes], { type: "application/pdf" }));
          if (!resumen) resumen = resultado;
        } catch (err) {
          console.error(`Error al generar el reporte ${clave}:`, err);
          nuevosErrores[clave] = err.message || "Error al generar el reporte";
        }
      }

      pdfsRef.current = nuevos;
      setPdfs(nuevos);
      setErrores(nuevosErrores);

      if (resumen) {
        mostrar("success", "Reportes generados", `${resumen.totalMovimientos} movimiento(s) de ${resumen.totalEmpresas} empresa(s)`);
      } else {
        throw new Error(nuevosErrores.movimientos || "No se pudo generar ningún reporte");
      }
    } catch (err) {
      setError(err.message || "Error al generar los reportes");
      mostrar("error", "Error", err.message || "Error al generar los reportes");
    } finally {
      setGenerando(false);
    }
  };

  const descargar = ({ clave, archivo }) => {
    const url = pdfs[clave];
    if (!url) return;
    const desde = new Date(rango[0]).toISOString().slice(0, 10);
    const hasta = new Date(rango[1] || rango[0]).toISOString().slice(0, 10);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${archivo}-${desde}${hasta !== desde ? `_a_${hasta}` : ""}.pdf`;
    enlace.click();
  };

  const hayPdfs = Boolean(pdfs.movimientos || pdfs.saldos);

  return (
    <>
      <Button
        type="button"
        label={label}
        icon="pi pi-file-pdf"
        className={className}
        onClick={abrir}
        disabled={disabled || movimientos.length === 0}
        tooltip={movimientos.length === 0 ? "No hay movimientos para reportar" : "Movimiento de fondos y saldos por cuentas bancarias"}
        tooltipOptions={{ position: "top" }}
      />
      <Dialog
        header="Reportes - Movimiento de Fondos y Saldos por Cuentas Bancarias"
        visible={visible}
        onHide={cerrar}
        style={{ width: "96vw", maxWidth: "1800px" }}
        maximizable
        modal
      >
        <div className="p-fluid">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 2, minWidth: "260px" }}>
              <label htmlFor="rangoReporteFondos" style={{ fontWeight: "bold" }}>
                Rango de Fechas del Reporte
              </label>
              <Calendar
                id="rangoReporteFondos"
                value={rango}
                onChange={(e) => setRango(e.value)}
                selectionMode="range"
                dateFormat="dd/mm/yy"
                showIcon
                showButtonBar
                readOnlyInput
                placeholder="Seleccionar rango..."
              />
            </div>
            <div style={{ flex: 3, minWidth: "320px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="flex align-items-center">
                <Checkbox inputId="repContabilidad" checked={incluirContabilidad} onChange={(e) => setIncluirContabilidad(e.checked)} />
                <label htmlFor="repContabilidad" className="ml-2">
                  Incluir cuentas contables, asientos y saldos
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox inputId="repResumen" checked={incluirResumen} onChange={(e) => setIncluirResumen(e.checked)} />
                <label htmlFor="repResumen" className="ml-2">
                  Incluir resumen del periodo y controles
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox inputId="repAnulados" checked={incluirAnulados} onChange={(e) => setIncluirAnulados(e.checked)} />
                <label htmlFor="repAnulados" className="ml-2">
                  Incluir movimientos anulados
                </label>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <Button
                type="button"
                label={generando ? "Generando..." : "Generar reportes"}
                icon="pi pi-cog"
                loading={generando}
                onClick={generar}
                disabled={generando || !rango?.[0] || movimientosEnRango.length === 0}
              />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <small style={{ color: "#6c757d" }}>
              {movimientosEnRango.length} movimiento(s) de todas las empresas en el rango elegido (de {movimientos.length} que
              cumplen los filtros actuales de la pagina, sin considerar la empresa ni el rango).
            </small>
          </div>

          {error && <Message severity="error" text={error} className="mt-2" style={{ width: "100%" }} />}

          {(hayPdfs || errores.movimientos || errores.saldos) && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              {REPORTES.map((reporte) => (
                <div key={reporte.clave} style={{ flex: 1, minWidth: "480px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <strong>{reporte.titulo}</strong>
                    <Button
                      type="button"
                      label="Descargar PDF"
                      icon="pi pi-download"
                      className="p-button-sm p-button-secondary"
                      style={{ width: "auto" }}
                      onClick={() => descargar(reporte)}
                      disabled={!pdfs[reporte.clave]}
                    />
                  </div>
                  {pdfs[reporte.clave] ? (
                    <iframe
                      title={reporte.titulo}
                      src={pdfs[reporte.clave]}
                      style={{ width: "100%", height: "72vh", border: "1px solid #ced4da" }}
                    />
                  ) : (
                    <Message severity="warn" text={errores[reporte.clave] || "No se generó el reporte"} style={{ width: "100%" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
