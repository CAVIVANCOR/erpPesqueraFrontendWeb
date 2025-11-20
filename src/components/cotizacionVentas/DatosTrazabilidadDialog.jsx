// src/components/cotizacionVentas/DatosTrazabilidadDialog.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Divider } from "primereact/divider";

/**
 * Diálogo para asignar datos de trazabilidad a todos los detalles de la cotización
 * @param {boolean} visible - Visibilidad del diálogo
 * @param {function} onHide - Callback al cerrar
 * @param {function} onAsignar - Callback al asignar valores (recibe objeto con los datos)
 * @param {object} toast - Referencia al Toast para notificaciones
 */
export default function DatosTrazabilidadDialog({
  visible,
  onHide,
  onAsignar,
  toast,
}) {
  const [formData, setFormData] = useState({
    loteProduccion: "",
    temperaturaAlmacenamiento: "",
    fechaProduccion: null,
    fechaVencimiento: null,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAsignar = () => {
    // Validaciones
    if (
      !formData.loteProduccion &&
      !formData.temperaturaAlmacenamiento &&
      !formData.fechaProduccion &&
      !formData.fechaVencimiento
    ) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar al menos un valor de trazabilidad",
      });
      return;
    }

    setSaving(true);
    try {
      onAsignar(formData);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Datos de trazabilidad asignados a todos los detalles",
      });
      // Limpiar formulario
      setFormData({
        loteProduccion: "",
        temperaturaAlmacenamiento: "",
        fechaProduccion: null,
        fechaVencimiento: null,
      });
      onHide();
    } catch (error) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al asignar datos de trazabilidad",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      header="📦 Datos de Trazabilidad"
      visible={visible}
      style={{ width: "600px" }}
      onHide={onHide}
      modal
    >
      <div className="p-fluid">
        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "2px solid #1976d2",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <i
              className="pi pi-info-circle"
              style={{ color: "#1976d2", fontSize: "1.2rem" }}
            />
            <span style={{ fontWeight: "bold", color: "#1976d2" }}>
              Información
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#333" }}>
            Los valores ingresados se asignarán a <strong>todos los detalles</strong> de
            la cotización. Puede dejar campos vacíos si no desea asignarlos.
          </p>
        </div>

        <Divider />

        {/* Lote Producción */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="loteProduccion" style={{ fontWeight: "bold" }}>
            Lote Producción
          </label>
          <InputText
            id="loteProduccion"
            value={formData.loteProduccion}
            onChange={(e) => handleChange("loteProduccion", e.target.value)}
            maxLength={50}
            placeholder="Ingrese el lote de producción"
            disabled={saving}
          />
        </div>

        {/* Temperatura */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="temperaturaAlmacenamiento"
            style={{ fontWeight: "bold" }}
          >
            Temperatura de Almacenamiento
          </label>
          <InputText
            id="temperaturaAlmacenamiento"
            value={formData.temperaturaAlmacenamiento}
            onChange={(e) =>
              handleChange("temperaturaAlmacenamiento", e.target.value)
            }
            maxLength={50}
            placeholder="Ej: -18°C"
            disabled={saving}
          />
        </div>

        {/* Fechas */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaProduccion" style={{ fontWeight: "bold" }}>
              Fecha Producción
            </label>
            <Calendar
              id="fechaProduccion"
              value={formData.fechaProduccion}
              onChange={(e) => handleChange("fechaProduccion", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={saving}
              placeholder="Seleccione fecha"
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
              Fecha Vencimiento
            </label>
            <Calendar
              id="fechaVencimiento"
              value={formData.fechaVencimiento}
              onChange={(e) => handleChange("fechaVencimiento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={saving}
              placeholder="Seleccione fecha"
            />
          </div>
        </div>

        <Divider />

        {/* Botones */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={onHide}
            disabled={saving}
            severity="secondary"
            outlined
          />
          <Button
            label="Asignar Valores al Detalle"
            icon="pi pi-check"
            onClick={handleAsignar}
            loading={saving}
            severity="success"
          />
        </div>
      </div>
    </Dialog>
  );
}