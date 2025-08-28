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
import { ToggleButton } from "primereact/togglebutton";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import {
  crearParametroAprobador,
  actualizarParametroAprobador,
} from "../../api/parametroAprobador";
import { getPersonal } from "../../api/personal";
import { getModulos } from "../../api/moduloSistema";
import { getEmpresas } from "../../api/empresa";
import { getSedes } from "../../api/sedes";
import { getActivosPorEmpresaYTipo } from "../../api/activo";

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
  vigenteDesde: yup.date().required("La fecha vigente desde es obligatoria"),
  vigenteHasta: yup.date().nullable(),
  cesado: yup.boolean().default(false),
});

const ParametroAprobadorForm = ({
  parametroAprobador,
  onGuardar,
  onCancelar,
}) => {
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState([]);
  const [modulosSistema, setModulosSistema] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [activosEmbarcacion, setActivosEmbarcacion] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const esEdicion = !!parametroAprobador;

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
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

  // Efecto para cargar activos cuando cambia la empresa
  const empresaWatched = watch("empresaId");
  useEffect(() => {
    if (empresaWatched) {
      const moduloSistemaId = watch("moduloSistemaId");
      if (moduloSistemaId) {
        const tipoId = obtenerTipoIdPorModulo(moduloSistemaId);
        cargarActivosEmbarcacion(empresaWatched, tipoId);
      }
      setEmpresaSeleccionada(empresaWatched);
    } else {
      setActivosEmbarcacion([]);
      setEmpresaSeleccionada(null);
    }
  }, [empresaWatched]);

  // Efecto para recargar embarcaciones cuando cambia el módulo sistema
  const moduloSistemaWatched = watch("moduloSistemaId");
  useEffect(() => {
    const empresaId = watch("empresaId");
    if (empresaId && moduloSistemaWatched) {
      const tipoId = obtenerTipoIdPorModulo(moduloSistemaWatched);
      cargarActivosEmbarcacion(empresaId, tipoId);
    } else if (!moduloSistemaWatched) {
      setActivosEmbarcacion([]);
    }
  }, [moduloSistemaWatched]);

  // Efecto para autocompletar empresa al seleccionar persona
  const personalWatched = watch("personalRespId");
  useEffect(() => {
    if (personalWatched && !esEdicion) {
      // Solo autocompletar en modo creación, no en edición
      const personaSeleccionada = personal.find(
        (p) => Number(p.id) === Number(personalWatched)
      );
      if (personaSeleccionada && personaSeleccionada.empresaId) {
        const empresaId = Number(personaSeleccionada.empresaId);
        setValue("empresaId", empresaId);
        // Las embarcaciones se cargarán cuando se seleccione el módulo sistema
      }
    }
  }, [personalWatched, personal, esEdicion, setValue]);

  /**
   * Cargar datos para combos
   */
  const cargarCombos = async () => {
    try {
      const [personalData, modulosData, empresasData, sedesData] =
        await Promise.all([
          getPersonal(),
          getModulos(),
          getEmpresas(),
          getSedes(),
        ]);

      setPersonal(personalData);
      setModulosSistema(modulosData);
      setEmpresas(empresasData);
      setSedes(sedesData);
    } catch (error) {
      console.error("Error al cargar combos:", error);
    }
  };

  /**
   * Cargar activos de embarcación filtrados por empresa y tipo
   * @param {number} empresaId - ID de la empresa seleccionada
   * @param {number} tipoId - ID del tipo de embarcación
   */
  const cargarActivosEmbarcacion = async (empresaId, tipoId) => {
    try {
      const activosData = await getActivosPorEmpresaYTipo(empresaId, tipoId);
      setActivosEmbarcacion(activosData);
    } catch (error) {
      console.error("Error al cargar activos de embarcación:", error);
      setActivosEmbarcacion([]);
    }
  };

  /**
   * Mapea el ID del módulo sistema al tipoId de embarcación correspondiente
   * @param {number} moduloSistemaId - ID del módulo sistema seleccionado
   * @returns {number} tipoId correspondiente (1 = Pesca Industrial, 2 = Pesca de Consumo)
   */
  const obtenerTipoIdPorModulo = (moduloSistemaId) => {
    const modulo = modulosSistema.find(
      (m) => Number(m.id) === Number(moduloSistemaId)
    );
    if (!modulo) return 1; // Default a Pesca Industrial

    const nombreModulo = modulo.nombre?.toUpperCase() || "";

    if (nombreModulo.includes("PESCA INDUSTRIAL")) {
      return 1; // tipoId=1 para Embarcación pesquera Industrial
    } else if (nombreModulo.includes("PESCA DE CONSUMO")) {
      return 2; // tipoId=2 para Embarcación de consumo
    }

    return 1; // Default a Pesca Industrial
  };

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (parametroAprobador) {
      setValue(
        "personalRespId",
        Number(parametroAprobador.personalRespId) || null
      );
      setValue(
        "moduloSistemaId",
        Number(parametroAprobador.moduloSistemaId) || null
      );
      setValue("empresaId", Number(parametroAprobador.empresaId) || null);
      setValue(
        "embarcacionId",
        parametroAprobador.embarcacionId
          ? Number(parametroAprobador.embarcacionId)
          : null
      );
      setValue(
        "sedeId",
        parametroAprobador.sedeId ? Number(parametroAprobador.sedeId) : null
      );
      setValue(
        "vigenteDesde",
        parametroAprobador.vigenteDesde
          ? new Date(parametroAprobador.vigenteDesde)
          : null
      );
      setValue(
        "vigenteHasta",
        parametroAprobador.vigenteHasta
          ? new Date(parametroAprobador.vigenteHasta)
          : null
      );
      setValue("cesado", parametroAprobador.cesado || false);

      // Cargar embarcaciones para el registro en edición
      if (parametroAprobador.empresaId && parametroAprobador.moduloSistemaId) {
        const tipoId = obtenerTipoIdPorModulo(
          Number(parametroAprobador.moduloSistemaId)
        );
        cargarActivosEmbarcacion(Number(parametroAprobador.empresaId), tipoId);
      }
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
  }, [parametroAprobador, setValue, reset, modulosSistema]);

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
        await actualizarParametroAprobador(
          parametroAprobador.id,
          datosNormalizados
        );
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
  const personalOptions = personal.map((persona) => ({
    label: `${persona.nombres} ${persona.apellidos}`,
    value: Number(persona.id),
  }));

  const modulosSistemaOptions = modulosSistema.map((modulo) => ({
    label: modulo.nombre,
    value: Number(modulo.id),
  }));

  const empresasOptions = empresas.map((empresa) => ({
    label: empresa.razonSocial,
    value: Number(empresa.id),
  }));

  const activosEmbarcacionOptions = activosEmbarcacion.map((activo) => ({
    label: activo.nombre,
    value: Number(activo.embarcacion?.id || activo.id),
  }));

  const sedesOptions = sedes
    .filter((sede) => Number(sede.empresaId) === Number(empresaSeleccionada))
    .map((sede) => ({
      label: sede.nombre,
      value: Number(sede.id),
    }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Personal Responsable */}
        <div style={{ flex: 1 }}>
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
            <small className="p-error p-d-block">
              {errors.personalRespId.message}
            </small>
          )}
        </div>
        {/* Campo Empresa */}
        <div style={{ flex: 1 }}>
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
            <small className="p-error p-d-block">
              {errors.empresaId.message}
            </small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Módulo Sistema */}
        <div style={{ flex: 1 }}>
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
            <small className="p-error p-d-block">
              {errors.moduloSistemaId.message}
            </small>
          )}
        </div>

        {/* Campo Embarcación */}
        <div style={{ flex: 1 }}>
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
                options={activosEmbarcacionOptions}
                placeholder={
                  empresaSeleccionada
                    ? "Seleccione embarcación (opcional)"
                    : "Primero seleccione una empresa"
                }
                className={getFieldClass("embarcacionId")}
                disabled={!empresaSeleccionada}
                filter
                showClear
              />
            )}
          />
          {errors.embarcacionId && (
            <small className="p-error p-d-block">
              {errors.embarcacionId.message}
            </small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Vigente Desde */}
        <div style={{ flex: 1 }}>
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
            <small className="p-error p-d-block">
              {errors.vigenteDesde.message}
            </small>
          )}
        </div>

        {/* Campo Vigente Hasta */}
        <div style={{ flex: 1 }}>
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
            <small className="p-error p-d-block">
              {errors.vigenteHasta.message}
            </small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          marginBottom: 12,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Sede */}
        <div style={{ flex: 1 }}>
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

        {/* Campo Cesado */}
        <div style={{ flex: 1 }}>
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <ToggleButton
                id="cesado"
                onLabel="Cesado"
                offLabel="Cesado"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                checked={field.value || false}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />
          {errors.cesado && (
            <small className="p-error p-d-block">{errors.cesado.message}</small>
          )}
        </div>
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
          className="p-button-text"
          onClick={onCancelar}
          disabled={loading}
          raised
          outlined
          size="small"
        />
        <Button
          type="submit"
          label={esEdicion ? "Actualizar" : "Crear"}
          icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
          loading={loading}
          className="p-button-success"
          raised
          outlined
          size="small"
        />
      </div>
    </form>
  );
};

export default ParametroAprobadorForm;
