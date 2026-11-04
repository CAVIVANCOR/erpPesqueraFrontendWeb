import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Message } from "primereact/message";
import { generarPDFEstadoCuentaProveedoresMantenimiento } from "./EstadoCuentaProveedoresMantenimientoPDF";
import { getEstadoCuentaProveedoresMantenimiento } from "../../api/estadoCuentaProveedoresMantenimiento";
import { mensajeDeError } from "../../utils/mensajeError";

/**
 * Botón "Estado de Cuenta Proveedores" autónomo, siguiendo el patrón de ReporteMovimientoFondos.
 * No pide parámetros: al abrirse genera el estado de cuenta a la fecha de todos los proveedores de servicios y
 * repuestos de Mantenimiento, de todas las empresas: por proveedor, lo presupuestado de cada OT, cada documento de
 * compra (facturado), sus pagos desde caja y el saldo, con subtotales por proveedor en soles y dólares.
 *
 * Props:
 *  - usuarioNombre: usuario que emite el reporte
 *  - toast: ref del Toast de la página (opcional)
 *  - disabled, label, className
 */
export default function ReporteEstadoCuentaProveedoresMantenimiento({
  usuarioNombre = "",
  toast = null,
  disabled = false,
  label = "Estado de Cuenta Proveedores",
  className = "p-button-success",
}) {
  const [visible, setVisible] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const pdfUrlRef = useRef(null);

  const mostrar = (severity, summary, detail) =>
    toast?.current?.show({ severity, summary, detail, life: severity === "error" ? 8000 : 3500 });

  const liberarPdf = () => {
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = null;
    setPdfUrl(null);
  };

  useEffect(() => () => pdfUrlRef.current && URL.revokeObjectURL(pdfUrlRef.current), []);

  const generar = async () => {
    setGenerando(true);
    setError(null);
    liberarPdf();
    try {
      const datos = await getEstadoCuentaProveedoresMantenimiento();
      const resultado = await generarPDFEstadoCuentaProveedoresMantenimiento({ datos, usuarioNombre });

      const url = URL.createObjectURL(new Blob([resultado.bytes], { type: "application/pdf" }));
      pdfUrlRef.current = url;
      setPdfUrl(url);
      mostrar("success", "Reporte generado", `${resultado.totalProveedores} proveedor(es) de ${resultado.totalEmpresas} empresa(s)`);
    } catch (err) {
      const mensaje = mensajeDeError(err, "No se pudo generar el estado de cuenta de proveedores");
      setError(mensaje);
      mostrar("error", "Error", mensaje);
    } finally {
      setGenerando(false);
    }
  };

  const abrir = () => {
    setVisible(true);
    generar();
  };

  const cerrar = () => {
    setVisible(false);
    liberarPdf();
  };

  const descargar = () => {
    if (!pdfUrl) return;
    const enlace = document.createElement("a");
    enlace.href = pdfUrl;
    enlace.download = `estado-de-cuenta-proveedores-mantenimiento-${new Date().toISOString().slice(0, 10)}.pdf`;
    enlace.click();
  };

  return (
    <>
      <Button
        type="button"
        label={label}
        icon="pi pi-file-pdf"
        className={className}
        onClick={abrir}
        disabled={disabled}
        tooltip="Estado de cuenta de proveedores de servicios y repuestos de Mantenimiento: presupuestado, facturado, pagado y saldo"
        tooltipOptions={{ position: "top" }}
      />
      <Dialog
        header="Estado de Cuenta de Proveedores de Mantenimiento"
        visible={visible}
        onHide={cerrar}
        style={{ width: "96vw", maxWidth: "1800px" }}
        maximizable
        modal
      >
        <div className="p-fluid">
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button
              type="button"
              label="Actualizar"
              icon="pi pi-refresh"
              className="p-button-outlined p-button-info"
              style={{ width: "auto" }}
              loading={generando}
              onClick={generar}
              disabled={generando}
            />
            <Button
              type="button"
              label="Descargar PDF"
              icon="pi pi-download"
              className="p-button-secondary"
              style={{ width: "auto" }}
              onClick={descargar}
              disabled={!pdfUrl}
            />
          </div>

          {generando && <Message severity="info" text="Generando el estado de cuenta..." className="mt-2" style={{ width: "100%" }} />}
          {error && <Message severity="error" text={error} className="mt-2" style={{ width: "100%" }} />}

          {pdfUrl && (
            <iframe
              title="Estado de Cuenta de Proveedores de Mantenimiento"
              src={pdfUrl}
              style={{ width: "100%", height: "72vh", border: "1px solid #ced4da", marginTop: 12 }}
            />
          )}
        </div>
      </Dialog>
    </>
  );
}
