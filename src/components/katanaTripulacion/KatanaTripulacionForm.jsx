/**
 * Formulario profesional para KatanaTripulacion
 * Sigue el patrón establecido en EmpresaForm.jsx
 * Componente controlado con react-hook-form y Yup
 * Graba directamente en la base de datos
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { crearKatanaTripulacion, actualizarKatanaTripulacion } from "../../api/katanaTripulacion";
import { getEmpresas } from "../../api/empresa";

// Schema de validación Yup
const schema = Yup.object().shape({
  empresaId: Yup.number()
    .required("La empresa es obligatoria")
    .typeError("La empresa es obligatoria"),
  rangoInicialTn: Yup.number()
    .min(0, "El rango inicial no puede ser negativo")
    .nullable()
    .transform((value, originalValue) => originalValue === "" ? null : value),
  rangoFinaTn: Yup.number()
    .min(0, "El rango final no puede ser negativo")
    .nullable()
    .transform((value, originalValue) => originalValue === "" ? null : value)
    .test('mayor-que-inicial', 'El rango final debe ser mayor o igual al inicial', function(value) {
      const { rangoInicialTn } = this.parent;
      if (rangoInicialTn !== null && value !== null && rangoInicialTn !== undefined && value !== undefined) {
        return value >= rangoInicialTn;
      }
      return true;
    }),
  kgOtorgadoCalculo: Yup.number()
    .min(0, "Los kg otorgados no pueden ser negativos")
    .nullable()
    .transform((value, originalValue) => originalValue === "" ? null : value),
});

export default function KatanaTripulacionForm({
  katanaTripulacion,
  onGuardar,
  onCancelar,
  readOnly = false,
}) {
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const isEdit = !!katanaTripulacion;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      empresaId: katanaTripulacion?.empresaId || null,
      rangoInicialTn: katanaTripulacion?.rangoInicialTn || 0,
      rangoFinaTn: katanaTripulacion?.rangoFinaTn || 0,
      kgOtorgadoCalculo: katanaTripulacion?.kgOtorgadoCalculo || 0,
    },
  });

  // Cargar empresas
  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      setLoadingEmpresas(true);
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setGuardando(true);

      // Normalizar datos
      const payload = {
        empresaId: Number(data.empresaId),
        rangoInicialTn: data.rangoInicialTn !== null && data.rangoInicialTn !== undefined ? Number(data.rangoInicialTn) : 0,
        rangoFinaTn: data.rangoFinaTn !== null && data.rangoFinaTn !== undefined ? Number(data.rangoFinaTn) : 0,
        kgOtorgadoCalculo: data.kgOtorgadoCalculo !== null && data.kgOtorgadoCalculo !== undefined ? Number(data.kgOtorgadoCalculo) : 0,
      };

      if (isEdit) {
        await actualizarKatanaTripulacion(katanaTripulacion.id, payload);
      } else {
        await crearKatanaTripulacion(payload);
      }

      if (onGuardar) onGuardar();
    } catch (error) {
      console.error("Error al guardar katana tripulación:", error);
      throw error;
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-field" style={{ marginBottom: "1rem" }}>
        <label htmlFor="empresaId">
          Empresa <span style={{ color: "red" }}>*</span>
        </label>
        <Controller
          name="empresaId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="empresaId"
              value={field.value}
              options={empresas}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder={loadingEmpresas ? "Cargando..." : "Seleccione empresa"}
              className={errors.empresaId ? "p-invalid" : ""}
              onChange={(e) => field.onChange(e.value)}
              disabled={readOnly || loadingEmpresas}
              filter
              showClear
            />
          )}
        />
        {errors.empresaId && (
          <small className="p-error">{errors.empresaId.message}</small>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: "1rem" }}>
        <label htmlFor="rangoInicialTn">Rango Inicial (Tn)</label>
        <Controller
          name="rangoInicialTn"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="rangoInicialTn"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              min={0}
              disabled={readOnly}
              className={errors.rangoInicialTn ? "p-invalid" : ""}
            />
          )}
        />
        {errors.rangoInicialTn && (
          <small className="p-error">{errors.rangoInicialTn.message}</small>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: "1rem" }}>
        <label htmlFor="rangoFinaTn">Rango Final (Tn)</label>
        <Controller
          name="rangoFinaTn"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="rangoFinaTn"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              min={0}
              disabled={readOnly}
              className={errors.rangoFinaTn ? "p-invalid" : ""}
            />
          )}
        />
        {errors.rangoFinaTn && (
          <small className="p-error">{errors.rangoFinaTn.message}</small>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: "1rem" }}>
        <label htmlFor="kgOtorgadoCalculo">Kg Otorgado Cálculo</label>
        <Controller
          name="kgOtorgadoCalculo"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="kgOtorgadoCalculo"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              min={0}
              disabled={readOnly}
              className={errors.kgOtorgadoCalculo ? "p-invalid" : ""}
            />
          )}
        />
        {errors.kgOtorgadoCalculo && (
          <small className="p-error">{errors.kgOtorgadoCalculo.message}</small>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancelar}
          disabled={guardando}
        />
        {!readOnly && (
          <Button
            type="submit"
            label={isEdit ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            className="p-button-success"
            loading={guardando}
          />
        )}
      </div>
    </form>
  );
}
