/**
 * Formulario para gestión de Embarcaciones
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: activoId, matricula, tipoEmbarcacionId, capacidadBodegaTon, esloraM, mangaM, puntalM, motorMarca, motorPotenciaHp, anioFabricacion, proveedorGpsId, tabletMarca, tabletModelo, estadoActivoId
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearEmbarcacion, actualizarEmbarcacion } from "../../api/embarcacion";
import { getTiposEmbarcacion } from "../../api/tipoEmbarcacion";
import { getEstadosMultiFuncionPorTipoProvieneDe } from "../../api/estadoMultiFuncion";
import { getActivos } from "../../api/activo";
import { getEntidadesComerciales } from "../../api/entidadComercial";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  activoId: yup
    .number()
    .required("El activo es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  matricula: yup
    .string()
    .required("La matrícula es obligatoria")
    .trim(),
  tipoEmbarcacionId: yup
    .number()
    .required("El tipo de embarcación es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  capacidadBodegaTon: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  esloraM: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  mangaM: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  puntalM: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  motorMarca: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  motorPotenciaHp: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  anioFabricacion: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  proveedorGpsId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  tabletMarca: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  tabletModelo: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  estadoActivoId: yup
    .number()
    .required("El estado activo es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
});

const EmbarcacionForm = ({ embarcacion, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const [tiposEmbarcacion, setTiposEmbarcacion] = useState([]);
  const [estadosActivo, setEstadosActivo] = useState([]);
  const [activos, setActivos] = useState([]);
  const [proveedoresGps, setProveedoresGps] = useState([]);
  const esEdicion = !!embarcacion;

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      activoId: null,
      matricula: "",
      tipoEmbarcacionId: null,
      capacidadBodegaTon: null,
      esloraM: null,
      mangaM: null,
      puntalM: null,
      motorMarca: "",
      motorPotenciaHp: null,
      anioFabricacion: null,
      proveedorGpsId: null,
      tabletMarca: "",
      tabletModelo: "",
      estadoActivoId: null,
    },
  });

  // Cargar datos de combos al montar
  useEffect(() => {
    cargarCombos();
  }, []);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (embarcacion) {
      setValue("activoId", embarcacion.activoId || null);
      setValue("matricula", embarcacion.matricula || "");
      setValue("tipoEmbarcacionId", embarcacion.tipoEmbarcacionId || null);
      setValue("capacidadBodegaTon", embarcacion.capacidadBodegaTon || null);
      setValue("esloraM", embarcacion.esloraM || null);
      setValue("mangaM", embarcacion.mangaM || null);
      setValue("puntalM", embarcacion.puntalM || null);
      setValue("motorMarca", embarcacion.motorMarca || "");
      setValue("motorPotenciaHp", embarcacion.motorPotenciaHp || null);
      setValue("anioFabricacion", embarcacion.anioFabricacion || null);
      setValue("proveedorGpsId", embarcacion.proveedorGpsId || null);
      setValue("tabletMarca", embarcacion.tabletMarca || "");
      setValue("tabletModelo", embarcacion.tabletModelo || "");
      setValue("estadoActivoId", embarcacion.estadoActivoId || null);
    } else {
      reset({
        activoId: null,
        matricula: "",
        tipoEmbarcacionId: null,
        capacidadBodegaTon: null,
        esloraM: null,
        mangaM: null,
        puntalM: null,
        motorMarca: "",
        motorPotenciaHp: null,
        anioFabricacion: null,
        proveedorGpsId: null,
        tabletMarca: "",
        tabletModelo: "",
        estadoActivoId: null,
      });
    }
  }, [embarcacion, setValue, reset]);

  /**
   * Cargar datos para combos
   */
  const cargarCombos = async () => {
    try {
      const [tiposData, estadosData, activosData, proveedoresData] = await Promise.all([
        getTiposEmbarcacion(),
        getEstadosMultiFuncionPorTipoProvieneDe(1),
        getActivos(),
        getEntidadesComerciales()
      ]);
      
      setTiposEmbarcacion(tiposData);
      setEstadosActivo(estadosData);
      setActivos(activosData);
      setProveedoresGps(proveedoresData);
    } catch (error) {
      console.error("Error al cargar combos:", error);
    }
  };

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        activoId: Number(data.activoId),
        matricula: data.matricula.trim().toUpperCase(),
        tipoEmbarcacionId: Number(data.tipoEmbarcacionId),
        capacidadBodegaTon: data.capacidadBodegaTon,
        esloraM: data.esloraM,
        mangaM: data.mangaM,
        puntalM: data.puntalM,
        motorMarca: data.motorMarca?.trim().toUpperCase() || null,
        motorPotenciaHp: data.motorPotenciaHp,
        anioFabricacion: data.anioFabricacion,
        proveedorGpsId: Number(data.proveedorGpsId),
        tabletMarca: data.tabletMarca?.trim().toUpperCase() || null,
        tabletModelo: data.tabletModelo?.trim().toUpperCase() || null,
        estadoActivoId: Number(data.estadoActivoId),
      };

      if (esEdicion) {
        await actualizarEmbarcacion(embarcacion.id, datosNormalizados);
      } else {
        await crearEmbarcacion(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar embarcación:", error);
      // El manejo de errores se realiza en el componente padre
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   * @param {string} fieldName - Nombre del campo
   * @returns {string} Clase CSS
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  // Opciones para combos
  const tiposEmbarcacionOptions = tiposEmbarcacion.map(tipo => ({
    label: tipo.nombre,
    value: Number(tipo.id)
  }));

  const estadosActivoOptions = estadosActivo.map(estado => ({
    label: estado.descripcion,
    value: Number(estado.id)
  }));

  const activosOptions = activos.map(activo => ({
    label: activo.nombre,
    value: Number(activo.id)
  }));

  const proveedoresGpsOptions = proveedoresGps.map(proveedor => ({
    label: proveedor.nombre,
    value: Number(proveedor.id)
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-grid p-formgrid">
        {/* Campo Activo */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="activoId" className="p-d-block">
            Activo <span className="p-error">*</span>
          </label>
          <Controller
            name="activoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="activoId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={activosOptions}
                placeholder="Seleccione un activo"
                className={getFieldClass("activoId")}
                filter
                showClear
              />
            )}
          />
          {errors.activoId && (
            <small className="p-error p-d-block">{errors.activoId.message}</small>
          )}
        </div>

        {/* Campo Matrícula */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="matricula" className="p-d-block">
            Matrícula <span className="p-error">*</span>
          </label>
          <Controller
            name="matricula"
            control={control}
            render={({ field }) => (
              <InputText
                id="matricula"
                {...field}
                placeholder="Ingrese la matrícula"
                className={getFieldClass("matricula")}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.matricula && (
            <small className="p-error p-d-block">{errors.matricula.message}</small>
          )}
        </div>

        {/* Campo Tipo Embarcación */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="tipoEmbarcacionId" className="p-d-block">
            Tipo de Embarcación <span className="p-error">*</span>
          </label>
          <Controller
            name="tipoEmbarcacionId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoEmbarcacionId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={tiposEmbarcacionOptions}
                placeholder="Seleccione tipo de embarcación"
                className={getFieldClass("tipoEmbarcacionId")}
                filter
                showClear
              />
            )}
          />
          {errors.tipoEmbarcacionId && (
            <small className="p-error p-d-block">{errors.tipoEmbarcacionId.message}</small>
          )}
        </div>

        {/* Campo Estado Activo */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="estadoActivoId" className="p-d-block">
            Estado Activo <span className="p-error">*</span>
          </label>
          <Controller
            name="estadoActivoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="estadoActivoId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={estadosActivoOptions}
                placeholder="Seleccione estado activo"
                className={getFieldClass("estadoActivoId")}
                filter
                showClear
              />
            )}
          />
          {errors.estadoActivoId && (
            <small className="p-error p-d-block">{errors.estadoActivoId.message}</small>
          )}
        </div>

        {/* Campo Capacidad Bodega */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="capacidadBodegaTon" className="p-d-block">
            Capacidad Bodega (Ton)
          </label>
          <Controller
            name="capacidadBodegaTon"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="capacidadBodegaTon"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Capacidad en toneladas"
                className={getFieldClass("capacidadBodegaTon")}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                min={0}
                suffix=" Ton"
              />
            )}
          />
          {errors.capacidadBodegaTon && (
            <small className="p-error p-d-block">{errors.capacidadBodegaTon.message}</small>
          )}
        </div>

        {/* Campo Eslora */}
        <div className="p-col-12 p-md-4 p-field">
          <label htmlFor="esloraM" className="p-d-block">
            Eslora (m)
          </label>
          <Controller
            name="esloraM"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="esloraM"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Eslora en metros"
                className={getFieldClass("esloraM")}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                min={0}
                suffix=" m"
              />
            )}
          />
          {errors.esloraM && (
            <small className="p-error p-d-block">{errors.esloraM.message}</small>
          )}
        </div>

        {/* Campo Manga */}
        <div className="p-col-12 p-md-4 p-field">
          <label htmlFor="mangaM" className="p-d-block">
            Manga (m)
          </label>
          <Controller
            name="mangaM"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="mangaM"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Manga en metros"
                className={getFieldClass("mangaM")}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                min={0}
                suffix=" m"
              />
            )}
          />
          {errors.mangaM && (
            <small className="p-error p-d-block">{errors.mangaM.message}</small>
          )}
        </div>

        {/* Campo Puntal */}
        <div className="p-col-12 p-md-4 p-field">
          <label htmlFor="puntalM" className="p-d-block">
            Puntal (m)
          </label>
          <Controller
            name="puntalM"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="puntalM"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Puntal en metros"
                className={getFieldClass("puntalM")}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                min={0}
                suffix=" m"
              />
            )}
          />
          {errors.puntalM && (
            <small className="p-error p-d-block">{errors.puntalM.message}</small>
          )}
        </div>

        {/* Campo Motor Marca */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="motorMarca" className="p-d-block">
            Marca del Motor
          </label>
          <Controller
            name="motorMarca"
            control={control}
            render={({ field }) => (
              <InputText
                id="motorMarca"
                {...field}
                placeholder="Marca del motor"
                className={getFieldClass("motorMarca")}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.motorMarca && (
            <small className="p-error p-d-block">{errors.motorMarca.message}</small>
          )}
        </div>

        {/* Campo Motor Potencia */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="motorPotenciaHp" className="p-d-block">
            Potencia Motor (HP)
          </label>
          <Controller
            name="motorPotenciaHp"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="motorPotenciaHp"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Potencia en HP"
                className={getFieldClass("motorPotenciaHp")}
                min={0}
                suffix=" HP"
              />
            )}
          />
          {errors.motorPotenciaHp && (
            <small className="p-error p-d-block">{errors.motorPotenciaHp.message}</small>
          )}
        </div>

        {/* Campo Año Fabricación */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="anioFabricacion" className="p-d-block">
            Año de Fabricación
          </label>
          <Controller
            name="anioFabricacion"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="anioFabricacion"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Año de fabricación"
                className={getFieldClass("anioFabricacion")}
                min={1900}
                max={new Date().getFullYear() + 1}
                useGrouping={false}
              />
            )}
          />
          {errors.anioFabricacion && (
            <small className="p-error p-d-block">{errors.anioFabricacion.message}</small>
          )}
        </div>

        {/* Campo Proveedor GPS */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="proveedorGpsId" className="p-d-block">
            Proveedor GPS
          </label>
          <Controller
            name="proveedorGpsId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="proveedorGpsId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={proveedoresGpsOptions}
                placeholder="Seleccione proveedor GPS"
                className={getFieldClass("proveedorGpsId")}
                filter
                showClear
              />
            )}
          />
          {errors.proveedorGpsId && (
            <small className="p-error p-d-block">{errors.proveedorGpsId.message}</small>
          )}
        </div>

        {/* Campo Tablet Marca */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="tabletMarca" className="p-d-block">
            Marca de Tablet
          </label>
          <Controller
            name="tabletMarca"
            control={control}
            render={({ field }) => (
              <InputText
                id="tabletMarca"
                {...field}
                placeholder="Marca de la tablet"
                className={getFieldClass("tabletMarca")}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.tabletMarca && (
            <small className="p-error p-d-block">{errors.tabletMarca.message}</small>
          )}
        </div>

        {/* Campo Tablet Modelo */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="tabletModelo" className="p-d-block">
            Modelo de Tablet
          </label>
          <Controller
            name="tabletModelo"
            control={control}
            render={({ field }) => (
              <InputText
                id="tabletModelo"
                {...field}
                placeholder="Modelo de la tablet"
                className={getFieldClass("tabletModelo")}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.tabletModelo && (
            <small className="p-error p-d-block">{errors.tabletModelo.message}</small>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancelar}
          disabled={loading}
        />
        <Button
          type="submit"
          label={esEdicion ? "Actualizar" : "Crear"}
          icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
          loading={loading}
        />
      </div>
    </form>
  );
};

export default EmbarcacionForm;
