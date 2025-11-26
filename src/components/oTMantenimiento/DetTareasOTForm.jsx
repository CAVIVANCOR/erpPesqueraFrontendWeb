// src/components/oTMantenimiento/DetTareasOTForm.jsx
// Formulario modular para crear/editar tareas individuales de OT
import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";

const DetTareasOTForm = ({
  tarea = null,
  estadosTarea = [],
  personalOptions = [],
  contratistas = [],
  onSubmit,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    numeroTarea: tarea?.numeroTarea || 1,
    descripcion: tarea?.descripcion || "",
    observaciones: tarea?.observaciones || "",
    responsableId: tarea?.responsableId ? Number(tarea.responsableId) : null,
    contratistaId: tarea?.contratistaId ? Number(tarea.contratistaId) : null,
    estadoTareaId: tarea?.estadoTareaId ? Number(tarea.estadoTareaId) : 57, // PENDIENTE por defecto
    fechaProgramada: tarea?.fechaProgramada
      ? new Date(tarea.fechaProgramada)
      : null,
    fechaInicio: tarea?.fechaInicio ? new Date(tarea.fechaInicio) : null,
    fechaFin: tarea?.fechaFin ? new Date(tarea.fechaFin) : null,
    realizado: tarea?.realizado || false,
    validaTerminoTareaId: tarea?.validaTerminoTareaId
      ? Number(tarea.validaTerminoTareaId)
      : null,
    fechaValidaTerminoTarea: tarea?.fechaValidaTerminoTarea
      ? new Date(tarea.fechaValidaTerminoTarea)
      : null,
    urlFotosAntesPdf: tarea?.urlFotosAntesPdf || null,
    urlCotizacionUnoPdf: tarea?.urlCotizacionUnoPdf || null,
    urlCotizacionDosPdf: tarea?.urlCotizacionDosPdf || null,
    adjuntoCotizacionUno: tarea?.adjuntoCotizacionUno || false,
    adjuntoCotizacionDos: tarea?.adjuntoCotizacionDos || false,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validarFormulario = () => {
    const camposFaltantes = [];

    if (!formData.numeroTarea) camposFaltantes.push("Número de Tarea");
    if (!formData.descripcion?.trim()) camposFaltantes.push("Descripción");
    if (!formData.estadoTareaId) camposFaltantes.push("Estado");

    if (camposFaltantes.length > 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Campos Obligatorios Faltantes",
        detail: (
          <div>
            <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Los siguientes campos son obligatorios:
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {camposFaltantes.map((campo, index) => (
                <li key={index}>{campo}</li>
              ))}
            </ul>
          </div>
        ),
        life: 6000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error al guardar tarea:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-tareas-ot-form p-fluid">
      <Toast ref={toast} />

      {/* FILA: Número de Tarea, Estado */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroTarea" style={{ fontWeight: "bold" }}>
            Número de Tarea *
          </label>
          <InputNumber
            id="numeroTarea"
            value={formData.numeroTarea}
            onValueChange={(e) => handleChange("numeroTarea", e.value)}
            min={1}
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label htmlFor="estadoTareaId" style={{ fontWeight: "bold" }}>
            Estado *
          </label>
          <Dropdown
            id="estadoTareaId"
            value={formData.estadoTareaId}
            options={estadosTarea.map((e) => ({
              label: e.descripcion,
              value: Number(e.id),
            }))}
            onChange={(e) => handleChange("estadoTareaId", e.value)}
            placeholder="Seleccionar estado"
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* FILA: Descripción */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="descripcion" style={{ fontWeight: "bold" }}>
          Descripción *
        </label>
        <InputTextarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          rows={3}
          placeholder="Describa la tarea a realizar"
          disabled={loading}
          style={{ width: "100%" }}
        />
      </div>

      {/* FILA: Responsable, Contratista */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="responsableId" style={{ fontWeight: "bold" }}>
            Responsable (Personal)
          </label>
          <Dropdown
            id="responsableId"
            value={formData.responsableId}
            options={personalOptions.map((p) => ({
              label: `${p.nombres} ${p.apellidos}`,
              value: Number(p.id),
            }))}
            onChange={(e) => handleChange("responsableId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="contratistaId" style={{ fontWeight: "bold" }}>
            Contratista
          </label>
          <Dropdown
            id="contratistaId"
            value={formData.contratistaId}
            options={contratistas.map((c) => ({
              label: c.razonSocial,
              value: Number(c.id),
            }))}
            onChange={(e) => handleChange("contratistaId", e.value)}
            placeholder="Seleccionar contratista"
            filter
            showClear
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* FILA: Fechas */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaProgramada" style={{ fontWeight: "bold" }}>
            Fecha Programada
          </label>
          <Calendar
            id="fechaProgramada"
            value={formData.fechaProgramada}
            onChange={(e) => handleChange("fechaProgramada", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaInicio" style={{ fontWeight: "bold" }}>
            Fecha Inicio
          </label>
          <Calendar
            id="fechaInicio"
            value={formData.fechaInicio}
            onChange={(e) => handleChange("fechaInicio", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            showTime
            hourFormat="24"
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaFin" style={{ fontWeight: "bold" }}>
            Fecha Fin
          </label>
          <Calendar
            id="fechaFin"
            value={formData.fechaFin}
            onChange={(e) => handleChange("fechaFin", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            showTime
            hourFormat="24"
            disabled={loading}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* FILA: Realizado (Botón) */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold" }}>Estado de Realización</label>
        <Button
          label={formData.realizado ? "REALIZADO" : "PENDIENTE"}
          severity={formData.realizado ? "success" : "warning"}
          icon={formData.realizado ? "pi pi-check" : "pi pi-clock"}
          onClick={() => handleChange("realizado", !formData.realizado)}
          disabled={loading}
          style={{
            width: "100%",
            fontWeight: "bold",
            marginTop: "0.25rem",
          }}
        />
      </div>

      {/* FILA: Observaciones */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
          Observaciones
        </label>
        <InputTextarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          rows={2}
          placeholder="Observaciones adicionales"
          disabled={loading}
          style={{ width: "100%" }}
        />
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          label={tarea ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          className="p-button-primary"
          onClick={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DetTareasOTForm;
