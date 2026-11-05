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

const VALORES_INICIALES = {
  regimenLaboralId: null,
  clave: "",
  descripcion: "",
  valor: null,
  vigenteDesde: null,
  validadoPorContador: false,
};

const aFecha = (valor) => (valor ? new Date(valor) : null);

/**
 * Formulario de parámetro legal.
 * Un parámetro ACTIVO es histórico: solo se permite marcar la validación del contador (soloValidacion = true).
 */
const ParametroLegalForm = ({ isEdit, defaultValues, onSubmit, onCancel, loading, soloValidacion = false }) => {
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
        setRegimenes((await getRegimenesLaboralesActivos()) || []);
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
        validadoPorContador: Boolean(defaultValues.validadoPorContador),
      });
    } else {
      reset(VALORES_INICIALES);
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = (data) => {
    if (soloValidacion) {
      onSubmit({ validadoPorContador: Boolean(data.validadoPorContador) });
      return;
    }
    onSubmit({
      regimenLaboralId: data.regimenLaboralId ? Number(data.regimenLaboralId) : null,
      clave: data.clave.trim().toUpperCase(),
      descripcion: data.descripcion.trim(),
      valor: Number(data.valor),
      // Fecha persistida: ISO de la medianoche local (nunca texto YYYY-MM-DD, que retrocede un día en Perú)
      vigenteDesde: data.vigenteDesde.toISOString(),
      validadoPorContador: Boolean(data.validadoPorContador),
    });
  };

  const bloqueado = loading || soloValidacion;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
      {soloValidacion && (
        <small className="block mb-3 text-color-secondary">
          El parámetro está activo y forma parte del histórico: solo puede marcarse la validación del contador. Para cambiar
          su valor, cree un parámetro nuevo con otra vigencia.
        </small>
      )}

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
      </div>

      <div className="field mt-4">
        <label htmlFor="validadoPorContador" className="font-medium">
          Validación del contador
        </label>
        <Controller
          name="validadoPorContador"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "VALIDADO POR EL CONTADOR" : "SIN VALIDAR POR EL CONTADOR"}
              className={field.value ? "p-button-success" : "p-button-secondary"}
              icon={field.value ? "pi pi-check-circle" : "pi pi-clock"}
              onClick={() => field.onChange(!field.value)}
              disabled={loading}
              style={{ width: "100%" }}
            />
          )}
        />
        <small className="text-color-secondary">Es informativo: si falta, se avisa al activar pero no se bloquea.</small>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
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
          label={isEdit ? "Actualizar" : "Guardar borrador"}
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
