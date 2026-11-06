// src/components/parametroLegal/ParametroLegalForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";
import { getRegimenesLaboralesActivos } from "../../api/recursosHumanos/regimenLaboral";
import BooleanToggleButton from "../common/BooleanToggleButton";
import AuditoriaDialog from "../common/AuditoriaDialog";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VALORES_INICIALES = {
  regimenLaboralId: null,
  clave: "",
  descripcion: "",
  valor: null,
  vigenteDesde: null,
  vigenteHasta: null,
  validadoPorContador: false,
};

const aFecha = (valor) => (valor ? new Date(valor) : null);

/**
 * Formulario de parámetro legal.
 * Los parámetros se ingresan válidos y quedan vigentes desde la fecha indicada.
 */
const ParametroLegalForm = ({ isEdit, defaultValues, personalAuditoria = [], onSubmit, onCancel, loading }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const [regimenes, setRegimenes] = useState([]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: VALORES_INICIALES, mode: "onChange" });

  useEffect(() => {
    const cargarRegimenes = async () => {
      try {
        // Ids como número: el valor del formulario es numérico y el Dropdown compara por igualdad estricta
        setRegimenes(((await getRegimenesLaboralesActivos()) || []).map((r) => ({ ...r, id: Number(r.id) })));
      } catch (error) {
        console.error("Error al cargar regímenes laborales:", error);
      }
    };
    cargarRegimenes();
  }, []);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({
        regimenLaboralId: defaultValues.regimenLaboralId ? Number(defaultValues.regimenLaboralId) : null,
        clave: defaultValues.clave || "",
        descripcion: defaultValues.descripcion || "",
        valor: defaultValues.valor !== undefined && defaultValues.valor !== null ? Number(defaultValues.valor) : null,
        vigenteDesde: aFecha(defaultValues.vigenteDesde),
        vigenteHasta: aFecha(defaultValues.vigenteHasta),
        validadoPorContador: Boolean(defaultValues.validadoPorContador),
      });
    } else {
      reset(VALORES_INICIALES);
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      regimenLaboralId: data.regimenLaboralId ? Number(data.regimenLaboralId) : null,
      clave: data.clave.trim().toUpperCase(),
      descripcion: data.descripcion.trim(),
      valor: Number(data.valor),
      // Fecha persistida: ISO de la medianoche local (nunca texto YYYY-MM-DD, que retrocede un día en Perú)
      vigenteDesde: data.vigenteDesde.toISOString(),
      vigenteHasta: data.vigenteHasta ? data.vigenteHasta.toISOString() : null,
      validadoPorContador: Boolean(data.validadoPorContador),
    });
  };

  const bloqueado = loading;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
      <div className="field">
        <label htmlFor="regimenLaboralId" className="font-medium">
          Régimen laboral
        </label>
        <Controller
          name="regimenLaboralId"
          control={control}
          render={({ field }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-briefcase" />
              </span>
              <Dropdown
                id={field.name}
                value={field.value}
                options={regimenes}
                optionLabel="descripcion"
                optionValue="id"
                onChange={(e) => field.onChange(e.value)}
                placeholder="General (aplica a todos los regímenes)"
                disabled={bloqueado}
                showClear
                emptyMessage="No hay regímenes disponibles"
              />
            </div>
          )}
        />
        <small className="text-color-secondary">Vacío = parámetro general (UIT, RMV...). Con régimen = regla de ese régimen.</small>
      </div>

      <div className="field mt-4">
        <label htmlFor="clave" className={classNames("font-medium", { "p-error": errors.clave })}>
          Clave <span className="text-red-500">*</span>
        </label>
        <Controller
          name="clave"
          control={control}
          rules={{
            required: "La clave es requerida",
            maxLength: { value: 80, message: "Máximo 80 caracteres" },
            pattern: { value: /^[A-Za-z0-9_]+$/, message: "Solo letras, números y guion bajo" },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-key" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={bloqueado}
                maxLength={80}
                placeholder="Ej: UIT, RMV, VACACIONES_DIAS"
              />
            </div>
          )}
        />
        {errors.clave && <small className="p-error">{errors.clave.message}</small>}
        <small className="text-color-secondary">Es el nombre con el que las fórmulas de la planilla usan este valor.</small>
      </div>

      <div className="field mt-4">
        <label htmlFor="descripcion" className={classNames("font-medium", { "p-error": errors.descripcion })}>
          Descripción <span className="text-red-500">*</span>
        </label>
        <Controller
          name="descripcion"
          control={control}
          rules={{
            required: "La descripción es requerida",
            maxLength: { value: 150, message: "Máximo 150 caracteres" },
          }}
          render={({ field, fieldState }) => (
            <InputText
              id={field.name}
              value={field.value || ""}
              onChange={field.onChange}
              className={classNames({ "p-invalid": fieldState.error })}
              disabled={bloqueado}
              maxLength={150}
              placeholder="Ej: Unidad Impositiva Tributaria (S/)"
            />
          )}
        />
        {errors.descripcion && <small className="p-error">{errors.descripcion.message}</small>}
      </div>

      <div className="formgrid grid mt-4">
        <div className="field col-6">
          <label htmlFor="valor" className={classNames("font-medium", { "p-error": errors.valor })}>
            Valor <span className="text-red-500">*</span>
          </label>
          <Controller
            name="valor"
            control={control}
            rules={{ required: "El valor es requerido" }}
            render={({ field, fieldState }) => (
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={6}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={bloqueado}
              />
            )}
          />
          {errors.valor && <small className="p-error">{errors.valor.message}</small>}
          <small className="text-color-secondary">Los sí/no se guardan como 1 y 0.</small>
        </div>

        <div className="field col-6">
          <label htmlFor="vigenteDesde" className={classNames("font-medium", { "p-error": errors.vigenteDesde })}>
            Vigente desde <span className="text-red-500">*</span>
          </label>
          <Controller
            name="vigenteDesde"
            control={control}
            rules={{ required: "La fecha de inicio es requerida" }}
            render={({ field, fieldState }) => (
              <Calendar
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={bloqueado}
              />
            )}
          />
          {errors.vigenteDesde && <small className="p-error">{errors.vigenteDesde.message}</small>}
        </div>

        <div className="field col-6">
          <label htmlFor="vigenteHasta" className="font-medium">
            Vigente hasta
          </label>
          <Controller
            name="vigenteHasta"
            control={control}
            render={({ field }) => (
              <Calendar
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                showButtonBar
                disabled={bloqueado}
              />
            )}
          />
          <small className="text-500">Último día en que rige. Vacío = sin fecha de término. Úselo cuando la norma deja de aplicar.</small>
        </div>
      </div>

      <div className="field mt-4">
        <label htmlFor="validadoPorContador" className="font-medium">
          Validación del contador
        </label>
        <Controller
          name="validadoPorContador"
          control={control}
          render={({ field }) => (
            <BooleanToggleButton
              value={field.value}
              onChange={field.onChange}
              labelTrue="VALIDADO POR EL CONTADOR"
              labelFalse="SIN VALIDAR POR EL CONTADOR"
              severityTrue="success"
              severityFalse="secondary"
              icon={field.value ? "pi-check-circle" : "pi-clock"}
              disabled={loading}
            />
          )}
        />
        <small className="text-color-secondary">Es solo informativo.</small>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end", gap: 8, marginTop: 18 }}>
        {/* Auditoría (solo en edición) */}
        {isEdit && defaultValues?.id && (
          <div style={{ flex: 1 }}>
            <AuditoriaDialog
              data={defaultValues}
              fieldMapping={{
                fechaCreacion: "creadoEn",
                creadoPor: "creadoPor",
                fechaActualizacion: "actualizadoEn",
                actualizadoPor: "actualizadoPor",
              }}
              usuarios={personalAuditoria.map((p) => ({ label: `${p.nombres} ${p.apellidos}`.trim(), value: Number(p.id), urlFotoPersona: p.urlFotoPersona }))}
              esSuperUsuario={Boolean(usuario?.esSuperUsuario)}
              buttonProps={{
                label: usuario?.esSuperUsuario ? "Auditoría" : "Ver Auditoría",
                className: "p-button-info",
                style: { width: "100%" },
              }}
            />
          </div>
        )}
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
          outlined
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          disabled={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>
    </form>
  );
};

export default ParametroLegalForm;
