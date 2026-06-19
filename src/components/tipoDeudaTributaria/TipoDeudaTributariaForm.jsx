// src/components/tipoDeudaTributaria/TipoDeudaTributariaForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getPlanCuentasContable } from "../../api/contabilidad/planCuentasContable";
import { getCategoriaTipoDeudaTributariaActivos } from "../../api/tesoreria/categoriaTipoDeudaTributaria";
import { FRECUENCIA_PAGO_OPTIONS } from "../../utils/utils";

const TipoDeudaTributariaForm = ({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [entidades, setEntidades] = useState([]);
  const [cuentasContables, setCuentasContables] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      categoriaId: null,
      entidadRecaudadoraId: null,
      periodicidad: "MENSUAL",
      cuentaContableId: null,
      activo: true,
    },
    mode: "onChange",
  });

  // Cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        setLoadingCategorias(true);
        const categoriasData = await getCategoriaTipoDeudaTributariaActivos();
        setCategorias(categoriasData || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      } finally {
        setLoadingCategorias(false);
      }
    };
    loadCategorias();
  }, []);

  // Cargar entidades y cuentas contables
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [entidadesData, cuentasData] = await Promise.all([
          getEntidadesComerciales(),
          getPlanCuentasContable(),
        ]);
        setEntidades(entidadesData || []);
        setCuentasContables(cuentasData || []);
      } catch (error) {
        console.error("Error al cargar datos del formulario:", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (defaultValues) {
      setValue("nombre", defaultValues.nombre || "");
      setValue("descripcion", defaultValues.descripcion || "");
      setValue("categoriaId", defaultValues.categoriaId || null);
      setValue(
        "entidadRecaudadoraId",
        defaultValues.entidadRecaudadoraId || null
      );
      setValue("periodicidad", defaultValues.periodicidad || "MENSUAL");
      setValue("cuentaContableId", defaultValues.cuentaContableId || null);
      setValue(
        "activo",
        defaultValues.activo !== undefined ? defaultValues.activo : true
      );
    } else {
      reset({
        nombre: "",
        descripcion: "",
        categoriaId: null,
        entidadRecaudadoraId: null,
        periodicidad: "MENSUAL",
        cuentaContableId: null,
        activo: true,
      });
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    const datosNormalizados = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      categoriaId: data.categoriaId ? Number(data.categoriaId) : null,
      entidadRecaudadoraId: data.entidadRecaudadoraId
        ? Number(data.entidadRecaudadoraId)
        : null,
      periodicidad: data.periodicidad,
      cuentaContableId: data.cuentaContableId
        ? Number(data.cuentaContableId)
        : null,
      activo: Boolean(data.activo),
    };
    onSubmit(datosNormalizados);
  };

  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name].message}</small>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
      <div className="field mt-4">
        <label
          htmlFor="categoriaId"
          className={classNames("font-medium", {
            "p-error": errors.categoriaId,
          })}
        >
          Categoría
        </label>
        <Controller
          name="categoriaId"
          control={control}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-folder" />
              </span>
              <Dropdown
                id={field.name}
                value={field.value}
                options={categorias}
                optionLabel="nombre"
                optionValue="id"
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione una categoría"
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading || loadingCategorias}
                filter
                showClear
                emptyMessage="No hay categorías disponibles"
              />
            </div>
          )}
        />
        {getFormErrorMessage("categoriaId")}
      </div>
      <div className="field">
        <label
          htmlFor="nombre"
          className={classNames("font-medium", {
            "p-error": errors.nombre,
          })}
        >
          Nombre <span className="text-red-500">*</span>
        </label>
        <Controller
          name="nombre"
          control={control}
          rules={{
            required: "El nombre es requerido",
            maxLength: {
              value: 100,
              message: "Máximo 100 caracteres",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-tag" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                maxLength={100}
                placeholder="Ej: IGV por Pagar, Renta 3ra Categoría"
              />
            </div>
          )}
        />
        {getFormErrorMessage("nombre")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="descripcion"
          className={classNames("font-medium", {
            "p-error": errors.descripcion,
          })}
        >
          Descripción
        </label>
        <Controller
          name="descripcion"
          control={control}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-align-left" />
              </span>
              <InputTextarea
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                rows={3}
                placeholder="Descripción detallada del tipo de deuda tributaria"
              />
            </div>
          )}
        />
        {getFormErrorMessage("descripcion")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="entidadRecaudadoraId"
          className={classNames("font-medium", {
            "p-error": errors.entidadRecaudadoraId,
          })}
        >
          Entidad Recaudadora
        </label>
        <Controller
          name="entidadRecaudadoraId"
          control={control}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-building" />
              </span>
              <Dropdown
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={entidades}
                optionLabel="razonSocial"
                optionValue="id"
                placeholder="Seleccione entidad recaudadora"
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading || loadingData}
                filter
                showClear
                emptyMessage="No hay entidades disponibles"
              />
            </div>
          )}
        />
        {getFormErrorMessage("entidadRecaudadoraId")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="periodicidad"
          className={classNames("font-medium", {
            "p-error": errors.periodicidad,
          })}
        >
          Periodicidad <span className="text-red-500">*</span>
        </label>
        <Controller
          name="periodicidad"
          control={control}
          rules={{
            required: "La periodicidad es requerida",
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-calendar" />
              </span>
              <Dropdown
                id={field.name}
                value={field.value}
                options={FRECUENCIA_PAGO_OPTIONS}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione periodicidad"
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                emptyMessage="No hay opciones disponibles"
              />
            </div>
          )}
        />
        {getFormErrorMessage("periodicidad")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="cuentaContableId"
          className={classNames("font-medium", {
            "p-error": errors.cuentaContableId,
          })}
        >
          Cuenta Contable
        </label>
        <Controller
          name="cuentaContableId"
          control={control}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-book" />
              </span>
              <Dropdown
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={cuentasContables}
                optionLabel={(option) =>
                  `${option.codigoCuenta} - ${option.nombreCuenta}`
                }
                optionValue="id"
                placeholder="Seleccione cuenta contable"
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading || loadingData}
                filter
                showClear
                emptyMessage="No hay cuentas contables disponibles"
              />
            </div>
          )}
        />
        {getFormErrorMessage("cuentaContableId")}
      </div>

      <div className="field mt-4">
        <label htmlFor="activo" className="font-medium">
          Estado
        </label>
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "ACTIVO" : "INACTIVO"}
              className={field.value ? "p-button-success" : "p-button-danger"}
              icon={field.value ? "pi pi-check-circle" : "pi pi-times-circle"}
              onClick={() => field.onChange(!field.value)}
              disabled={loading}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>

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

export default TipoDeudaTributariaForm;