// src/components/tipoContrato/TipoContratoForm.jsx
// Formulario profesional para alta y edición de TipoContrato en el ERP Megui.
// Usa react-hook-form y validación Yup. Documentado en español técnico.

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";

// Esquema de validación profesional
const schema = Yup.object().shape({
  codigo: Yup.string().required("El código es obligatorio").max(10, "Máx 10 caracteres"),
  nombre: Yup.string().required("El nombre es obligatorio").max(60, "Máx 60 caracteres"),
  cesado: Yup.boolean()
});

/**
 * Formulario desacoplado para alta/edición de TipoContrato
 * Recibe props: isEdit, defaultValues, onSubmit, onCancel, loading
 */
export default function TipoContratoForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues || { codigo: "", nombre: "", cesado: false }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos de solo lectura para fechas de auditoría, solo en edición */}
      {defaultValues?.createdAt && (
        <div className="p-field" style={{ marginBottom: 14 }}>
          <label htmlFor="createdAt">Creado el</label>
          <InputText id="createdAt" value={new Date(defaultValues.createdAt).toLocaleString()} readOnly disabled />
        </div>
      )}
      {defaultValues?.updatedAt && (
        <div className="p-field" style={{ marginBottom: 14 }}>
          <label htmlFor="updatedAt">Actualizado el</label>
          <InputText id="updatedAt" value={new Date(defaultValues.updatedAt).toLocaleString()} readOnly disabled />
        </div>
      )}
      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="codigo">Código *</label>
        <InputText id="codigo" {...register("codigo")} className={errors.codigo ? "p-invalid" : ""} autoFocus maxLength={10} />
        {errors.codigo && <small className="p-error">{errors.codigo.message}</small>}
      </div>
      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="nombre">Nombre *</label>
        <InputText id="nombre" {...register("nombre")} className={errors.nombre ? "p-invalid" : ""} maxLength={60} />
        {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
      </div>
      <div className="p-field-checkbox" style={{ marginBottom: 18 }}>
        <Checkbox id="cesado" {...register("cesado")} checked={!!defaultValues?.cesado} />
        <label htmlFor="cesado" style={{ marginLeft: 8 }}>¿Cesado?</label>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Registrar"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
