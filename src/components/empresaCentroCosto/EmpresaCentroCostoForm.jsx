// src/components/empresaCentroCosto/EmpresaCentroCostoForm.jsx
// Formulario profesional para EmpresaCentroCosto. Cumple la regla transversal ERP Megui.
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";

/**
 * Formulario profesional para gestión de relación Empresa-Centro de Costo
 * Utiliza React Hook Form para validación y manejo de estado
 * @param {boolean} isEdit - Indica si es modo edición
 * @param {Object} defaultValues - Valores por defecto del formulario
 * @param {Array} empresas - Lista de empresas disponibles
 * @param {Array} centrosCosto - Lista de centros de costo disponibles
 * @param {Array} personalPorEmpresa - Lista de personal activo filtrado por empresa
 * @param {Array} proveedoresPorEmpresa - Lista de proveedores filtrados por empresa
 * @param {Function} onEmpresaChange - Callback cuando cambia la empresa seleccionada
 * @param {Function} onSubmit - Función callback para envío del formulario
 * @param {Function} onCancel - Función callback para cancelar
 * @param {boolean} loading - Estado de carga
 */
export default function EmpresaCentroCostoForm({
  isEdit,
  defaultValues,
  empresas,
  centrosCosto,
  personalPorEmpresa,
  proveedoresPorEmpresa,
  onEmpresaChange,
  onSubmit,
  onCancel,
  loading,
}) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      EmpresaID: null,
      CentroCostoID: null,
      ResponsableID: null,
      ProveedorExternoID: null,
      Activo: true,
    },
  });

  // Observar cambios en la empresa seleccionada
  const empresaSeleccionada = watch("EmpresaID");

  // Resetear formulario cuando cambien los valores por defecto
  useEffect(() => {
    // Solo resetear si realmente hay defaultValues o es la primera carga
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({
        EmpresaID: defaultValues?.EmpresaID ? Number(defaultValues.EmpresaID) : null,
        CentroCostoID: defaultValues?.CentroCostoID ? Number(defaultValues.CentroCostoID) : null,
        ResponsableID: defaultValues?.ResponsableID ? Number(defaultValues.ResponsableID) : null,
        ProveedorExternoID: defaultValues?.ProveedorExternoID ? Number(defaultValues.ProveedorExternoID) : null,
        Activo:
          defaultValues?.Activo !== undefined ? !!defaultValues.Activo : true,
      });
    }
  }, [defaultValues]);

  // Cargar datos cuando cambia la empresa
  useEffect(() => {
    if (empresaSeleccionada && onEmpresaChange) {
      onEmpresaChange(empresaSeleccionada);
    }
  }, [empresaSeleccionada, onEmpresaChange]);

  const onFormSubmit = (data) => {
    // Formatear datos antes de enviar
    const formattedData = {
      EmpresaID: data.EmpresaID ? Number(data.EmpresaID) : null,
      CentroCostoID: data.CentroCostoID ? Number(data.CentroCostoID) : null,
      ResponsableID: data.ResponsableID ? Number(data.ResponsableID) : null,
      ProveedorExternoID: data.ProveedorExternoID
        ? Number(data.ProveedorExternoID)
        : null,
      Activo: data.Activo,
    };
    onSubmit(formattedData);
  };

  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name].message}</small>
    );
  };

  // Preparar opciones para los dropdowns
  const empresasOptions =
    empresas?.map((e) => ({
      label: e.razonSocial || e.nombre,
      value: Number(e.id),
    })) || [];

  const centrosCostoOptions =
    centrosCosto?.map((c) => ({
      label: c.Nombre,
      value: Number(c.id),
    })) || [];

  const personalOptions = personalPorEmpresa?.map((p) => ({
    label: p.label || `${p.nombres} ${p.apellidos}`.trim(),
    value: Number(p.value || p.id),
  })) || [];

  const proveedoresOptions = proveedoresPorEmpresa?.map((p) => ({
    label: p.label || p.razonSocial || p.nombreComercial,
    value: Number(p.value || p.id),
  })) || [];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-fluid">
      {/* Campo Empresa */}
      <div className="field">
        <label
          htmlFor="EmpresaID"
          className={classNames({ "p-error": errors.EmpresaID })}
        >
          Empresa *
        </label>
        <Controller
          name="EmpresaID"
          control={control}
          rules={{
            required: "La empresa es requerida",
          }}
          render={({ field, fieldState }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={empresasOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar empresa"
              disabled={loading}
              className={classNames({ "p-invalid": fieldState.invalid })}
              filter
              showClear
              filterBy="label"
            />
          )}
        />
        {getFormErrorMessage("EmpresaID")}
      </div>

      {/* Campo Centro de Costo */}
      <div className="field">
        <label
          htmlFor="CentroCostoID"
          className={classNames({ "p-error": errors.CentroCostoID })}
        >
          Centro de Costo *
        </label>
        <Controller
          name="CentroCostoID"
          control={control}
          rules={{
            required: "El centro de costo es requerido",
          }}
          render={({ field, fieldState }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={centrosCostoOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar centro de costo"
              disabled={loading}
              className={classNames({ "p-invalid": fieldState.invalid })}
              filter
              showClear
              filterBy="label"
            />
          )}
        />
        {getFormErrorMessage("CentroCostoID")}
      </div>

      {/* Campo Responsable */}
      <div className="field">
        <label
          htmlFor="ResponsableID"
          className={classNames({ "p-error": errors.ResponsableID })}
        >
          Responsable *
        </label>
        <Controller
          name="ResponsableID"
          control={control}
          rules={{
            required: "El responsable es requerido",
          }}
          render={({ field, fieldState }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={personalOptions}
              optionLabel="label"
              optionValue="value"
              placeholder={empresaSeleccionada ? "Seleccionar responsable" : "Primero seleccione una empresa"}
              disabled={loading || !empresaSeleccionada}
              className={classNames({ "p-invalid": fieldState.invalid })}
              filter
              showClear
              filterBy="label"
              emptyMessage="No hay personal disponible para esta empresa"
            />
          )}
        />
        {getFormErrorMessage("ResponsableID")}
      </div>

      {/* Campo Proveedor Externo */}
      <div className="field">
        <label htmlFor="ProveedorExternoID">Proveedor Externo</label>
        <Controller
          name="ProveedorExternoID"
          control={control}
          render={({ field, fieldState }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={proveedoresOptions}
              optionLabel="label"
              optionValue="value"
              placeholder={empresaSeleccionada ? "Seleccionar proveedor (opcional)" : "Primero seleccione una empresa"}
              disabled={loading || !empresaSeleccionada}
              className={classNames({ "p-invalid": fieldState.invalid })}
              filter
              showClear
              filterBy="label"
              emptyMessage="No hay proveedores disponibles para esta empresa"
            />
          )}
        />
        {getFormErrorMessage("ProveedorExternoID")}
      </div>

      {/* Campo Activo */}
      <div className="field-checkbox">
        <Controller
          name="Activo"
          control={control}
          render={({ field }) => (
            <Checkbox
              inputId={field.name}
              checked={field.value}
              onChange={(e) => field.onChange(e.checked)}
              disabled={loading}
            />
          )}
        />
        <label htmlFor="Activo" className="ml-2">
          Activo
        </label>
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          onClick={onCancel}
          disabled={loading}
          className="p-button-text"
          outlined
          severity="danger"
          raised
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          className="p-button-success"
          outlined
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
