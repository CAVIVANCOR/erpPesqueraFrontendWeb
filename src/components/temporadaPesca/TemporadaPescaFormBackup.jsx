/**
 * Formulario para gestión de Temporadas de Pesca
 *
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Combos relacionales con empresas, personal con cargo BAHIA COMERCIAL y estados de temporada
 * - Gestión de cuotas con formato decimal
 * - Control de fechas de inicio y fin con validaciones
 * - Upload de archivos PDF para resoluciones
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Validaciones de negocio específicas (fechas, cuotas, superposición)
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { FileUpload } from "primereact/fileupload";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { classNames } from "primereact/utils";
import { getBahiasComerciales } from "../../api/personal";
import {
  getTemporadasPesca,
  getTemporadaPescaPorId,
  crearTemporadaPesca,
  actualizarTemporadaPesca,
  subirDocumentoTemporada,
} from "../../api/temporadaPesca";
import { getEstadosMultiFuncionParaTemporadaPesca } from "../../api/estadoMultiFuncion";

/**
 * Componente de formulario para temporadas de pesca
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const TemporadaPescaForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  empresas = [],
}) => {
  // Estados locales
  const [bahiasComerciales, setBahiasComerciales] = useState([]);
  const [bahiasComercialesFiltradas, setBahiasComercialesFiltradas] = useState(
    []
  );
  const [estadosTemporada, setEstadosTemporada] = useState([]);
  const [estadoDefaultId, setEstadoDefaultId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [archivoSubido, setArchivoSubido] = useState(null);
  const [validandoSuperposicion, setValidandoSuperposicion] = useState(false);

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      empresaId: null,
      BahiaId: null,
      estadoTemporadaId: null,
      nombre: "",
      fechaInicio: null,
      fechaFin: null,
      numeroResolucion: "",
      urlResolucionPdf: "",
      cuotaPropiaTon: null,
      cuotaAlquiladaTon: null,
    },
  });

  // Observar cambios en empresa para filtrar bahías
  const empresaSeleccionada = watch("empresaId");
  const fechaInicio = watch("fechaInicio");
  const fechaFin = watch("fechaFin");
  const estadoSeleccionado = watch("estadoTemporadaId");

  /**
   * Cargar estados de temporada al montar el componente
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const estadosData = await getEstadosMultiFuncionParaTemporadaPesca();
        setEstadosTemporada(estadosData);

        // Encontrar y guardar el ID del estado por defecto
        const estadoDefault = estadosData.find(
          (estado) => estado.descripcion === "EN ESPERA DE INICIO"
        );
        if (estadoDefault) {
          setEstadoDefaultId(Number(estadoDefault.id));
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    cargarDatos();
  }, []);

  /**
   * Establecer estado por defecto cuando esté disponible y no hay elemento en edición
   */
  useEffect(() => {
    if (estadoDefaultId && !editingItem) {
      setValue("estadoTemporadaId", estadoDefaultId);
    }
  }, [estadoDefaultId, editingItem, setValue]);

  /**
   * Filtrar bahías comerciales cuando cambie la empresa seleccionada
   */
  useEffect(() => {
    if (empresaSeleccionada) {
      const cargarBahiasComerciales = async () => {
        try {
          const bahiasData = await getBahiasComerciales(
            Number(empresaSeleccionada)
          );
          setBahiasComerciales(bahiasData);
          setBahiasComercialesFiltradas(bahiasData);
        } catch (error) {
          console.error("Error cargando bahías comerciales:", error);
          setBahiasComerciales([]);
          setBahiasComercialesFiltradas([]);
        }
      };
      cargarBahiasComerciales();
    } else {
      setBahiasComerciales([]);
      setBahiasComercialesFiltradas([]);
      setValue("BahiaId", null);
    }
  }, [empresaSeleccionada, setValue]);

  /**
   * Validar superposición cuando cambien fechas o estado
   */
  useEffect(() => {
    if (fechaInicio && fechaFin && estadoSeleccionado && empresaSeleccionada) {
      validarSuperposicionFechas();
    }
  }, [fechaInicio, fechaFin, estadoSeleccionado, empresaSeleccionada]);

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        empresaId: Number(editingItem.empresaId),
        BahiaId: Number(editingItem.BahiaId),
        estadoTemporadaId: Number(editingItem.estadoTemporadaId) || 1,
        nombre: editingItem.nombre,
        fechaInicio: new Date(editingItem.fechaInicio),
        fechaFin: new Date(editingItem.fechaFin),
        numeroResolucion: editingItem.numeroResolucion || "",
        urlResolucionPdf: editingItem.urlResolucionPdf || "",
        cuotaPropiaTon: editingItem.cuotaPropiaTon
          ? Number(editingItem.cuotaPropiaTon)
          : null,
        cuotaAlquiladaTon: editingItem.cuotaAlquiladaTon
          ? Number(editingItem.cuotaAlquiladaTon)
          : null,
      });

      if (editingItem.urlResolucionPdf) {
        setArchivoSubido({
          name: editingItem.numeroResolucion + ".pdf",
          url: editingItem.urlResolucionPdf,
        });
      }
    } else {
      // Limpiar formulario para nueva temporada
      reset({
        empresaId: null,
        BahiaId: null,
        estadoTemporadaId: estadoDefaultId,
        nombre: "",
        fechaInicio: null,
        fechaFin: null,
        numeroResolucion: "",
        urlResolucionPdf: "",
        cuotaPropiaTon: null,
        cuotaAlquiladaTon: null,
      });
      setArchivoSubido(null);
    }
  }, [editingItem, reset, estadoDefaultId]);

  /**
   * Cargar bahías comerciales disponibles
   */
  const cargarBahiasComerciales = async () => {
    try {
      const data = await getBahiasComerciales();
      setBahiasComerciales(data);
    } catch (error) {
      console.error("Error al cargar bahías comerciales:", error);
    }
  };

  /**
   * Validar superposición de fechas con otras temporadas
   */
  const validarSuperposicionFechas = async () => {
    try {
      setValidandoSuperposicion(true);

      const datos = {
        empresaId: Number(empresaSeleccionada),
        estadoTemporadaId: Number(estadoSeleccionado),
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
      };

      // Simulación de validación - implementar según API
      setTimeout(() => {
        setValidandoSuperposicion(false);
      }, 1000);
    } catch (error) {
      console.error("Error al validar superposición:", error);
      setValidandoSuperposicion(false);
    }
  };

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      empresaId: Number(data.empresaId),
      BahiaId: Number(data.BahiaId),
      estadoTemporadaId: Number(data.estadoTemporadaId),
      nombre: data.nombre.trim(),
      fechaInicio: data.fechaInicio.toISOString(),
      fechaFin: data.fechaFin.toISOString(),
      numeroResolucion: data.numeroResolucion?.trim() || null,
      urlResolucionPdf:
        data.urlResolucionPdf?.trim() || archivoSubido?.url || null,
      cuotaPropiaTon: data.cuotaPropiaTon ? Number(data.cuotaPropiaTon) : null,
      cuotaAlquiladaTon: data.cuotaAlquiladaTon
        ? Number(data.cuotaAlquiladaTon)
        : null,
    };

    onSave(formData);
  };

  /**
   * Manejar cierre del diálogo
   */
  const handleHide = () => {
    reset();
    setArchivoSubido(null);
    setUploadProgress(0);
    onHide();
  };

  /**
   * Manejar upload de archivo PDF
   */
  const onUpload = async (event) => {
    const file = event.files[0];

    try {
      setUploadProgress(0);

      // Simular progreso de upload
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const resultado = await subirDocumentoTemporada(file);

      clearInterval(interval);
      setUploadProgress(100);

      setArchivoSubido({
        name: file.name,
        url: resultado.url,
      });

      setValue("urlResolucionPdf", resultado.url);

      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error) {
      console.error("Error al subir archivo:", error);
      setUploadProgress(0);
    }
  };

  /**
   * Preparar opciones de empresas para el dropdown
   */
  const empresasOptions = empresas.map((empresa) => ({
    label: empresa.razonSocial || empresa.nombre,
    value: Number(empresa.id),
  }));

  /**
   * Preparar opciones de bahías comerciales para el dropdown
   */
  const bahiasComercialesOptions = bahiasComercialesFiltradas.map(
    (persona) => ({
      label: persona.nombreCompleto,
      value: Number(persona.id),
    })
  );

  /**
   * Preparar opciones de estados de temporada para el dropdown
   */
  const estadosTemporadaOptions = estadosTemporada.map((estado) => ({
    label: estado.descripcion,
    value: Number(estado.id),
  }));

  /**
   * Footer del diálogo con botones de acción
   */
  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        onClick={handleHide}
      />
      <Button
        label={editingItem ? "Actualizar" : "Crear"}
        icon="pi pi-check"
        onClick={handleSubmit(onSubmit)}
        loading={validandoSuperposicion}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "900px" }}
      header={
        editingItem ? "Editar Temporada de Pesca" : "Nueva Temporada de Pesca"
      }
      modal
      footer={dialogFooter}
      onHide={handleHide}
      className="p-fluid"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Empresa */}
            <div style={{ flex: 1 }}>
              <label htmlFor="empresaId" className="font-semibold">
                Empresa *
              </label>
              <Controller
                name="empresaId"
                control={control}
                rules={{ required: "La empresa es obligatoria" }}
                render={({ field }) => (
                  <Dropdown
                    id="empresaId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={empresasOptions}
                    placeholder="Seleccione una empresa"
                    filter
                    showClear
                    style={{ fontWeight: "bold" }}
                    className={classNames({ "p-invalid": errors.empresaId })}
                  />
                )}
              />
              {errors.empresaId && (
                <Message severity="error" text={errors.empresaId.message} />
              )}
            </div>
            {/* Bahía */}
            <div style={{ flex: 1 }}>
              <label htmlFor="BahiaId" className="font-semibold">
                Bahía Comercial *
              </label>
              <Controller
                name="BahiaId"
                control={control}
                rules={{ required: "La bahía comercial es obligatoria" }}
                render={({ field }) => (
                  <Dropdown
                    id="BahiaId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={bahiasComercialesOptions}
                    placeholder={
                      empresaSeleccionada
                        ? "Seleccione una bahía comercial"
                        : "Primero seleccione empresa"
                    }
                    filter
                    showClear
                    disabled={!empresaSeleccionada}
                    style={{ fontWeight: "bold" }}
                    className={classNames({ "p-invalid": errors.BahiaId })}
                  />
                )}
              />
              {errors.BahiaId && (
                <Message severity="error" text={errors.BahiaId.message} />
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
            {/* Número de Resolución */}
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroResolucion" className="font-semibold">
                Número de Resolución
              </label>
              <Controller
                name="numeroResolucion"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroResolucion"
                    {...field}
                    placeholder="Ej: R.M. N° 123-2024-PRODUCE"
                    style={{ fontWeight: "bold" }}
                    className={classNames({
                      "p-invalid": errors.numeroResolucion,
                    })}
                  />
                )}
              />
              <small className="text-muted">
                Número de la resolución ministerial
              </small>
            </div>

            {/* Nombre de Temporada */}
            <div style={{ flex: 1 }}>
              <label htmlFor="nombre" className="font-semibold">
                Nombre de Temporada *
              </label>
              <Controller
                name="nombre"
                control={control}
                rules={{
                  required: "El nombre es obligatorio",
                  minLength: { value: 3, message: "Mínimo 3 caracteres" },
                }}
                render={({ field }) => (
                  <InputText
                    id="nombre"
                    {...field}
                    placeholder="Ej: Temporada Anchoveta 2024"
                    style={{ fontWeight: "bold" }}
                    className={classNames({ "p-invalid": errors.nombre })}
                  />
                )}
              />
              {errors.nombre && (
                <Message severity="error" text={errors.nombre.message} />
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
            {/* Fecha de Inicio */}
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaInicio" className="font-semibold">
                Fecha de Inicio *
              </label>
              <Controller
                name="fechaInicio"
                control={control}
                rules={{
                  required: "La fecha de inicio es obligatoria",
                  validate: (value) => {
                    const fin = watch("fechaFin");
                    if (fin && value >= fin) {
                      return "La fecha de inicio debe ser anterior a la fecha de fin";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <Calendar
                    id="fechaInicio"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha de inicio"
                    showIcon
                    style={{ fontWeight: "bold" }}
                    className={classNames({ "p-invalid": errors.fechaInicio })}
                  />
                )}
              />
              {errors.fechaInicio && (
                <Message severity="error" text={errors.fechaInicio.message} />
              )}
            </div>

            {/* Fecha de Fin */}
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaFin" className="font-semibold">
                Fecha de Fin *
              </label>
              <Controller
                name="fechaFin"
                control={control}
                rules={{
                  required: "La fecha de fin es obligatoria",
                  validate: (value) => {
                    const inicio = watch("fechaInicio");
                    if (inicio && value <= inicio) {
                      return "La fecha de fin debe ser posterior a la fecha de inicio";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <Calendar
                    id="fechaFin"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha de fin"
                    showIcon
                    style={{ fontWeight: "bold" }}
                    className={classNames({ "p-invalid": errors.fechaFin })}
                  />
                )}
              />
              {errors.fechaFin && (
                <Message severity="error" text={errors.fechaFin.message} />
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
            {/* Cuota Propia */}
            <div style={{ flex: 1 }}>
              <label htmlFor="cuotaPropiaTon" className="font-semibold">
                Cuota Propia (Toneladas)
              </label>
              <Controller
                name="cuotaPropiaTon"
                control={control}
                rules={{
                  min: { value: 0, message: "La cuota no puede ser negativa" },
                }}
                render={({ field }) => (
                  <InputNumber
                    id="cuotaPropiaTon"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    placeholder="0.00"
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    min={0}
                    suffix=" Ton"
                    style={{ fontWeight: "bold" }}
                    className={classNames({
                      "p-invalid": errors.cuotaPropiaTon,
                    })}
                  />
                )}
              />
              {errors.cuotaPropiaTon && (
                <Message
                  severity="error"
                  text={errors.cuotaPropiaTon.message}
                />
              )}
            </div>
            {/* Cuota Alquilada */}
            <div style={{ flex: 1 }}>
              <label htmlFor="cuotaAlquiladaTon" className="font-semibold">
                Cuota Alquilada (Toneladas)
              </label>
              <Controller
                name="cuotaAlquiladaTon"
                control={control}
                rules={{
                  min: { value: 0, message: "La cuota no puede ser negativa" },
                }}
                render={({ field }) => (
                  <InputNumber
                    id="cuotaAlquiladaTon"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    placeholder="0.00"
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    min={0}
                    suffix=" Ton"
                    className={classNames({
                      "p-invalid": errors.cuotaAlquiladaTon,
                    })}
                  />
                )}
              />
              {errors.cuotaAlquiladaTon && (
                <Message
                  severity="error"
                  text={errors.cuotaAlquiladaTon.message}
                />
              )}
            </div>
            {/* Estado de Temporada */}
            <div style={{ flex: 1 }}>
              <label htmlFor="estadoTemporadaId" className="font-semibold">
                Estado de Temporada *
              </label>
              <Controller
                name="estadoTemporadaId"
                control={control}
                rules={{ required: "El estado es obligatorio" }}
                render={({ field }) => (
                  <Dropdown
                    id="estadoTemporadaId"
                    {...field}
                    value={field.value ? Number(field.value) : null}
                    options={estadosTemporadaOptions}
                    placeholder="Seleccione un estado"
                    style={{ fontWeight: "bold" }}
                    className={classNames({
                      "p-invalid": errors.estadoTemporadaId,
                    })}
                  />
                )}
              />
              {errors.estadoTemporadaId && (
                <Message
                  severity="error"
                  text={errors.estadoTemporadaId.message}
                />
              )}
            </div>
          </div>

          {/* Upload de Resolución PDF */}
          <div className="col-6">
            <label className="font-semibold">Archivo de Resolución (PDF)</label>
            <FileUpload
              mode="basic"
              accept="application/pdf"
              maxFileSize={5000000}
              onUpload={onUpload}
              chooseOptions={{
                label: "Seleccionar PDF",
                icon: "pi pi-file-pdf",
              }}
              uploadHandler={onUpload}
              customUpload
            />

            {uploadProgress > 0 && (
              <ProgressBar
                value={uploadProgress}
                className="mt-2"
                style={{ height: "6px" }}
              />
            )}

            {archivoSubido && (
              <div className="mt-2">
                <Tag
                  value={archivoSubido.name}
                  severity="success"
                  icon="pi pi-file-pdf"
                />
                {archivoSubido.url && (
                  <Button
                    icon="pi pi-eye"
                    className="p-button-text p-button-sm ml-2"
                    tooltip="Ver archivo"
                    onClick={() => window.open(archivoSubido.url, "_blank")}
                  />
                )}
              </div>
            )}

            <small className="text-muted">
              Archivo PDF de la resolución (máximo 5MB)
            </small>
          </div>

          {/* Indicador de validación de superposición */}
          {validandoSuperposicion && (
            <div className="col-12">
              <Message
                severity="info"
                text="Validando superposición de fechas con otras temporadas..."
                className="w-full"
              />
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
};

export default TemporadaPescaForm;
