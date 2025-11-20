/**
 * PdfDetMovEntregaRendirVentasCard.jsx
 *
 * Card para gestión de PDF de comprobante de movimiento de entrega a rendir en ventas.
 * Permite subir, visualizar y eliminar el PDF del comprobante.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React from "react";
import { Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";

const PdfDetMovEntregaRendirVentasCard = ({
  control,
  errors,
  urlComprobanteMovimiento,
  toast,
  setValue,
  movimiento,
}) => {
  /**
   * Maneja la subida del archivo PDF
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos PDF",
        life: 3000,
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo no debe superar los 5MB",
        life: 3000,
      });
      return;
    }

    try {
      // Crear FormData
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("tipo", "comprobante-movimiento-ventas");
      
      if (movimiento?.id) {
        formData.append("movimientoId", movimiento.id);
      }

      // Subir al servidor
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/upload/pdf-comprobante-movimiento`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Error al subir el archivo");
      }

      const data = await response.json();

      // Actualizar el campo en el formulario
      setValue("urlComprobanteMovimiento", data.url);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "PDF subido correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al subir PDF:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al subir el archivo PDF",
        life: 3000,
      });
    }
  };

  /**
   * Abre el PDF en una nueva pestaña
   */
  const handleVerPdf = () => {
    if (urlComprobanteMovimiento) {
      window.open(urlComprobanteMovimiento, "_blank");
    }
  };

  /**
   * Elimina el PDF
   */
  const handleEliminarPdf = () => {
    setValue("urlComprobanteMovimiento", "");
    toast.current?.show({
      severity: "info",
      summary: "PDF Eliminado",
      detail: "El PDF del comprobante ha sido eliminado",
      life: 3000,
    });
  };

  return (
    <Card
      title="Comprobante PDF del Movimiento"
      className="mb-4"
      pt={{
        header: { className: "pb-0" },
        content: { className: "pt-2" },
      }}
    >
      <div className="p-fluid">
        <div style={{ marginBottom: "1rem" }}>
          <Message
            severity="info"
            text="Suba el PDF del comprobante del movimiento (factura, boleta, recibo, etc.)"
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: "0.5rem", flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
          <div style={{ flex: 2 }}>
            <label htmlFor="urlComprobanteMovimiento" className="block text-900 font-medium mb-2">
              URL del Comprobante PDF
            </label>
            <Controller
              name="urlComprobanteMovimiento"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlComprobanteMovimiento"
                  {...field}
                  value={field.value || ""}
                  placeholder="URL del PDF se generará automáticamente al subir el archivo"
                  className={classNames({ "p-invalid": errors.urlComprobanteMovimiento })}
                  readOnly
                  style={{ fontWeight: "bold", color: "#2196F3" }}
                />
              )}
            />
            {errors.urlComprobanteMovimiento && (
              <Message severity="error" text={errors.urlComprobanteMovimiento.message} />
            )}
          </div>

          <div style={{ flex: 1, display: "flex", gap: "0.5rem", alignItems: "end" }}>
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">Subir PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="upload-pdf-comprobante"
              />
              <Button
                type="button"
                label="Seleccionar"
                icon="pi pi-upload"
                className="p-button-primary"
                onClick={() => document.getElementById("upload-pdf-comprobante").click()}
                size="small"
              />
            </div>

            {urlComprobanteMovimiento && (
              <>
                <div style={{ flex: 1 }}>
                  <label className="block text-900 font-medium mb-2">Ver PDF</label>
                  <Button
                    type="button"
                    label="Ver"
                    icon="pi pi-eye"
                    className="p-button-info"
                    onClick={handleVerPdf}
                    size="small"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label className="block text-900 font-medium mb-2">Eliminar</label>
                  <Button
                    type="button"
                    label="Eliminar"
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={handleEliminarPdf}
                    size="small"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {urlComprobanteMovimiento && (
          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#e3f2fd", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <i className="pi pi-check-circle" style={{ color: "#2196F3", fontSize: "1.5rem" }}></i>
              <div>
                <strong>PDF Cargado</strong>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                  El comprobante PDF está disponible para visualización
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PdfDetMovEntregaRendirVentasCard;