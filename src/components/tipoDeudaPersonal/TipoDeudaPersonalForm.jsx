// src/components/tipoDeudaPersonal/TipoDeudaPersonalForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";
import { getCategoriaTipoDeudaPersonalActivos } from "../../api/tesoreria/categoriaTipoDeudaPersonal";

const TipoDeudaPersonalForm = ({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}) => {
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
      activo: true,
    },
    mode: "onChange",
  });

  // Cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        setLoadingCategorias(true);
        const categoriasData = await getCategoriaTipoDeudaPersonalActivos();
        setCategorias(categoriasData || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      } finally {
        setLoadingCategorias(false);
      }
    };
    loadCategorias();
  }, []);

  useEffect(() => {
    if (defaultValues) {
      setValue("nombre", defaultValues.nombre || "");
      setValue("descripcion", defaultValues.descripcion || "");
      setValue("categoriaId", defaultValues.categoriaId || null);
      setValue("activo", defaultValues.activo !== undefined ? defaultValues.activo : true);
    } else {
      reset({
        nombre: "",
        descripcion: "",
        categoriaId: null,
        activo: true,
      });
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    const datosNormalizados = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      categoriaId: data.categoriaId ? Number(data.categoriaId) : null,
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
                placeholder="Ej: Sueldos, Gratificaciones, CTS"
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
                rows={4}
                placeholder="Descripción detallada del tipo de deuda"
              />
            </div>
          )}
        />
        {getFormErrorMessage("descripcion")}
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

export default TipoDeudaPersonalForm;