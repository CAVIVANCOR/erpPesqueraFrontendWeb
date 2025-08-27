/**
 * Formulario para gestión de Parámetros Aprobador
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: personalRespId, moduloSistemaId, empresaId, embarcacionId, sedeId, vigenteDesde, vigenteHasta, cesado
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
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearParametroAprobador, actualizarParametroAprobador } from "../../api/parametroAprobador";
import { getPersonal } from "../../api/personal";
import { getModulos } from "../../api/moduloSistema";
import { getEmpresas } from "../../api/empresa";
import { getEmbarcaciones } from "../../api/embarcacion";
import { getSedes } from "../../api/sedes";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  personalRespId: yup
    .number()
    .required("El personal responsable es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  moduloSistemaId: yup
    .number()
    .required("El módulo sistema es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  empresaId: yup
    .number()
    .required("La empresa es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  embarcacionId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  sedeId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  vigenteDesde: yup
    .date()
    .required("La fecha vigente desde es obligatoria"),
  vigenteHasta: yup
    .date()
    .nullable(),
  cesado: yup
    .boolean()
    .default(false),
});

const ParametroAprobadorForm = ({ parametroAprobador, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState([]);
  const [modulosSistema, setModulosSistema] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [sedes, setSedes] = useState([]);
  const esEdicion = !!parametroAprobador;

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
      personalRespId: null,
      moduloSistemaId: null,
      empresaId: null,
      embarcacionId: null,
      sedeId: null,
      vigenteDesde: null,
      vigenteHasta: null,
      cesado: false,
    },
  });

  // Cargar datos de combos al montar
  useEffect(() => {
    cargarCombos();
  }, []);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (parametroAprobador) {
      setValue("personalRespId", Number(parametroAprobador.personalRespId) || null);
      setValue("moduloSistemaId", Number(parametroAprobador.moduloSistemaId) || null);
      setValue("empresaId", Number(parametroAprobador.empresaId) || null);
      setValue("embarcacionId", parametroAprobador.embarcacionId ? Number(parametroAprobador.embarcacionId) : null);
      setValue("sedeId", parametroAprobador.sedeId ? Number(parametroAprobador.sedeId) : null);
      setValue("vigenteDesde", parametroAprobador.vigenteDesde ? new Date(parametroAprobador.vigenteDesde) : null);
      setValue("vigenteHasta", parametroAprobador.vigenteHasta ? new Date(parametroAprobador.vigenteHasta) : null);
      setValue("cesado", parametroAprobador.cesado || false);
    } else {
      reset({
        personalRespId: null,
        moduloSistemaId: null,
        empresaId: null,
        embarcacionId: null,
        sedeId: null,
        vigenteDesde: null,
        vigenteHasta: null,
        cesado: false,
      });
    }
  }, [parametroAprobador, setValue, reset]);

  /**
   * Cargar datos para combos
   */
  const cargarCombos = async () => {
    try {
      const [personalData, modulosData, empresasData, embarcacionesData, sedesData] = await Promise.all([
        getPersonal(),
        getModulos(),
        getEmpresas(),
        getEmbarcaciones(),
        getSedes()
      ]);
      
      setPersonal(personalData);
      setModulosSistema(modulosData);
      setEmpresas(empresasData);
      setEmbarcaciones(embarcacionesData);
      setSedes(sedesData);
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
        personalRespId: Number(data.personalRespId),
        moduloSistemaId: Number(data.moduloSistemaId),
        empresaId: Number(data.empresaId),
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        sedeId: data.sedeId ? Number(data.sedeId) : null,
        vigenteDesde: data.vigenteDesde,
        vigenteHasta: data.vigenteHasta || null,
        cesado: data.cesado,
      };

      if (esEdicion) {
        await actualizarParametroAprobador(parametroAprobador.id, datosNormalizados);
      } else {
        await crearParametroAprobador(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar parámetro aprobador:", error);
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
  const personalOptions = personal.map(persona => ({
    label: `${persona.nombres} ${persona.apellidos}`,
    value: Number(persona.id)
  }));

  const modulosSistemaOptions = modulosSistema.map(modulo => ({
    label: modulo.nombre,
    value: Number(modulo.id)
  }));

  const empresasOptions = empresas.map(empresa => ({
    label: empresa.razonSocial,
    value: Number(empresa.id)
  }));

  const embarcacionesOptions = embarcaciones.map(embarcacion => ({
    label: embarcacion.nombre,
    value: Number(embarcacion.id)
  }));

  const sedesOptions = sedes.map(sede => ({
    label: sede.nombre,
    value: Number(sede.id)
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-grid p-formgrid">
        {/* Campo Personal Responsable */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="personalRespId" className="p-d-block">
            Personal Responsable <span className="p-error">*</span>
          </label>
          <Controller
            name="personalRespId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="personalRespId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={personalOptions}
                placeholder="Seleccione personal responsable"
                className={getFieldClass("personalRespId")}
                filter
                showClear
              />
            )}
          />
          {errors.personalRespId && (
            <small className="p-error p-d-block">{errors.personalRespId.message}</small>
          )}
        </div>

        {/* Campo Módulo Sistema */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="moduloSistemaId" className="p-d-block">
            Módulo Sistema <span className="p-error">*</span>
          </label>
          <Controller
            name="moduloSistemaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="moduloSistemaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={modulosSistemaOptions}
                placeholder="Seleccione módulo sistema"
                className={getFieldClass("moduloSistemaId")}
                filter
                showClear
              />
            )}
          />
          {errors.moduloSistemaId && (
            <small className="p-error p-d-block">{errors.moduloSistemaId.message}</small>
          )}
        </div>

        {/* Campo Empresa */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="empresaId" className="p-d-block">
            Empresa <span className="p-error">*</span>
          </label>
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="empresaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={empresasOptions}
                placeholder="Seleccione una empresa"
                className={getFieldClass("empresaId")}
                filter
                showClear
              />
            )}
          />
          {errors.empresaId && (
            <small className="p-error p-d-block">{errors.empresaId.message}</small>
          )}
        </div>

        {/* Campo Embarcación */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="embarcacionId" className="p-d-block">
            Embarcación
          </label>
          <Controller
            name="embarcacionId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="embarcacionId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={embarcacionesOptions}
                placeholder="Seleccione embarcación (opcional)"
                className={getFieldClass("embarcacionId")}
                filter
                showClear
              />
            )}
          />
          {errors.embarcacionId && (
            <small className="p-error p-d-block">{errors.embarcacionId.message}</small>
          )}
        </div>

        {/* Campo Sede */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="sedeId" className="p-d-block">
            Sede
          </label>
          <Controller
            name="sedeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="sedeId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={sedesOptions}
                placeholder="Seleccione sede (opcional)"
                className={getFieldClass("sedeId")}
                filter
                showClear
              />
            )}
          />
          {errors.sedeId && (
            <small className="p-error p-d-block">{errors.sedeId.message}</small>
          )}
        </div>

        {/* Campo Vigente Desde */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="vigenteDesde" className="p-d-block">
            Vigente Desde <span className="p-error">*</span>
          </label>
          <Controller
            name="vigenteDesde"
            control={control}
            render={({ field }) => (
              <Calendar
                id="vigenteDesde"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione fecha desde"
                className={getFieldClass("vigenteDesde")}
                dateFormat="dd/mm/yy"
                showIcon
              />
            )}
          />
          {errors.vigenteDesde && (
            <small className="p-error p-d-block">{errors.vigenteDesde.message}</small>
          )}
        </div>

        {/* Campo Vigente Hasta */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="vigenteHasta" className="p-d-block">
            Vigente Hasta
          </label>
          <Controller
            name="vigenteHasta"
            control={control}
            render={({ field }) => (
              <Calendar
                id="vigenteHasta"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione fecha hasta (opcional)"
                className={getFieldClass("vigenteHasta")}
                dateFormat="dd/mm/yy"
                showIcon
              />
            )}
          />
          {errors.vigenteHasta && (
            <small className="p-error p-d-block">{errors.vigenteHasta.message}</small>
          )}
        </div>

        {/* Campo Cesado */}
        <div className="p-col-12 p-field">
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="cesado"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("cesado")}
                />
                <label htmlFor="cesado" className="p-checkbox-label">
                  Parámetro cesado
                </label>
              </div>
            )}
          />
          {errors.cesado && (
            <small className="p-error p-d-block">{errors.cesado.message}</small>
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

export default ParametroAprobadorForm;
