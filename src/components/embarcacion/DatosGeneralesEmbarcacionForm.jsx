/**
 * DatosGeneralesEmbarcacionForm.jsx
 *
 * Componente Card para gestionar los datos generales de una embarcación.
 * Incluye todos los campos básicos más la gestión de foto de embarcación.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import { subirFotoEmbarcacion } from "../../api/embarcacion";

/**
 * Componente DatosGeneralesEmbarcacionForm
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto (incluye id de la embarcación)
 * @param {Array} props.tiposEmbarcacionOptions - Opciones para combo tipos
 * @param {Array} props.estadosActivoOptions - Opciones para combo estados
 * @param {Array} props.activosOptions - Opciones para combo activos
 * @param {Array} props.proveedoresGpsOptions - Opciones para combo proveedores GPS
 */
export default function DatosGeneralesEmbarcacionForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  tiposEmbarcacionOptions,
  estadosActivoOptions,
  activosOptions,
  proveedoresGpsOptions,
}) {
  // Estados para manejo de foto - siguiendo patrón exacto de DatosGeneralesProductoForm
  const [fotoPreview, setFotoPreview] = useState(
    defaultValues.urlFotoEmbarcacion
      ? `${import.meta.env.VITE_UPLOADS_URL}/embarcaciones/${
          defaultValues.urlFotoEmbarcacion
        }`
      : null
  );
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const toastFoto = useRef(null);

  // Transformar datos para opciones de dropdowns como en EmbarcacionFormBackup
  const tiposEmbarcacionOptionsTransformed =
    tiposEmbarcacionOptions?.map((tipo) => ({
      label: tipo.nombre,
      value: Number(tipo.id),
    })) || [];

  const estadosActivoOptionsTransformed =
    estadosActivoOptions?.map((estado) => ({
      label: estado.descripcion,
      value: Number(estado.id),
    })) || [];

  const activosOptionsTransformed =
    activosOptions?.map((activo) => ({
      label: activo.nombre,
      value: Number(activo.id),
    })) || [];

  const proveedoresGpsOptionsTransformed =
    proveedoresGpsOptions?.map((proveedor) => ({
      label: proveedor.razonSocial,
      value: Number(proveedor.id),
    })) || [];

  // Reset profesional y actualización de preview de foto al abrir en modo edición o alta
  useEffect(() => {
    // Actualiza el preview de la foto si cambia el registro
    const urlFoto = defaultValues.urlFotoEmbarcacion
      ? defaultValues.urlFotoEmbarcacion.startsWith("http")
        ? defaultValues.urlFotoEmbarcacion
        : `${import.meta.env.VITE_UPLOADS_URL}/embarcaciones/${
            defaultValues.urlFotoEmbarcacion
          }`
      : null;
    setFotoPreview(urlFoto);
  }, [defaultValues]);

  /**
   * Maneja la subida profesional de la foto de embarcación.
   * Valida tipo/tamaño, sube vía API, actualiza preview y campo urlFotoEmbarcacion.
   * Muestra mensajes de éxito/error profesional.
   * Muestra el preview inmediatamente usando URL.createObjectURL(file),
   * luego sube el archivo y actualiza el preview con la URL definitiva del backend.
   * Documentado en español técnico.
   */
  const handleFotoUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;

    // Validación profesional: solo imágenes y máx 2MB (igual que productos)
    if (!file.type.startsWith("image/")) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos de imagen",
        life: 4000,
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo supera el tamaño máximo de 2MB",
        life: 4000,
      });
      return;
    }

    // Muestra el preview inmediato usando URL local
    const localUrl = URL.createObjectURL(file);
    setFotoPreview(localUrl);
    setUploadingFoto(true);

    try {
      // Sube la foto usando el endpoint profesional
      const res = await subirFotoEmbarcacion(defaultValues.id, file);
      setValue("urlFotoEmbarcacion", res.foto, { shouldValidate: true });

      // Construye la URL profesional de la foto subida usando la variable general de uploads.
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/embarcaciones/${
        res.foto
      }`;
      setFotoPreview(urlBackend);

      toastFoto.current?.show({
        severity: "success",
        summary: "Foto actualizada",
        detail: "La foto se subió correctamente",
        life: 3000,
      });
    } catch (err) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error || "Error al subir la foto",
        life: 4000,
      });
      // Restaurar preview anterior si falla
      const urlFoto = defaultValues.urlFotoEmbarcacion
        ? `${import.meta.env.VITE_UPLOADS_URL}/embarcaciones/${
            defaultValues.urlFotoEmbarcacion
          }`
        : null;
      setFotoPreview(urlFoto);
    } finally {
      setUploadingFoto(false);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  return (
    <Card
      title="Datos Generales de la Embarcación"
      className="mb-4"
      pt={{
        body: { className: "pt-0" },
        content: { className: "py-2" },
      }}
    >
      <Toast ref={toastFoto} />

      <div className="p-fluid">
        {/* Primera fila: Activo, Matrícula, Tipo, Estado */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="activoId" className="font-bold">
              Activo <span className="text-red-500">*</span>
            </label>
            <Controller
              name="activoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="activoId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={activosOptionsTransformed}
                  placeholder="Seleccione un activo"
                  className={getFieldClass("activoId")}
                  style={{ fontWeight: "bold" }}
                  filter
                  showClear
                />
              )}
            />
            {errors.activoId && (
              <small className="text-red-500 block">
                {errors.activoId.message}
              </small>
            )}
            <label htmlFor="matricula" className="font-bold">
              Matrícula <span className="text-red-500">*</span>
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
                  style={{ textTransform: "uppercase", fontWeight: "bold" }}
                />
              )}
            />
            {errors.matricula && (
              <small className="text-red-500 block">
                {errors.matricula.message}
              </small>
            )}
            <label htmlFor="tipoEmbarcacionId" className="font-bold">
              Tipo de Embarcación <span className="text-red-500">*</span>
            </label>
            <Controller
              name="tipoEmbarcacionId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="tipoEmbarcacionId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={tiposEmbarcacionOptionsTransformed}
                  placeholder="Seleccione tipo de embarcación"
                  className={getFieldClass("tipoEmbarcacionId")}
                  style={{ fontWeight: "bold" }}
                  filter
                  showClear
                />
              )}
            />
            {errors.tipoEmbarcacionId && (
              <small className="text-red-500 block">
                {errors.tipoEmbarcacionId.message}
              </small>
            )}
            <label htmlFor="estadoActivoId" className="font-bold">
              Estado Activo <span className="text-red-500">*</span>
            </label>
            <Controller
              name="estadoActivoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="estadoActivoId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={estadosActivoOptionsTransformed}
                  placeholder="Seleccione estado activo"
                  className={getFieldClass("estadoActivoId")}
                  style={{ fontWeight: "bold" }}
                  filter
                  showClear
                />
              )}
            />
            {errors.estadoActivoId && (
              <small className="text-red-500 block">
                {errors.estadoActivoId.message}
              </small>
            )}
            <label htmlFor="proveedorGpsId" className="font-bold">
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
                  options={proveedoresGpsOptionsTransformed}
                  placeholder="Seleccione proveedor GPS"
                  style={{ fontWeight: "bold" }}
                  className={getFieldClass("proveedorGpsId")}
                  filter
                  showClear
                />
              )}
            />
            {errors.proveedorGpsId && (
              <small className="text-red-500 block">
                {errors.proveedorGpsId.message}
              </small>
            )}
            <label htmlFor="tabletMarca" className="font-bold">
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
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              )}
            />
            {errors.tabletMarca && (
              <small className="text-red-500 block">
                {errors.tabletMarca.message}
              </small>
            )}
            <label htmlFor="tabletModelo" className="font-bold">
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
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              )}
            />
            {errors.tabletModelo && (
              <small className="text-red-500 block">
                {errors.tabletModelo.message}
              </small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="capacidadBodegaTon" className="font-bold">
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
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                  suffix=" Ton"
                />
              )}
            />
            {errors.capacidadBodegaTon && (
              <small className="text-red-500 block">
                {errors.capacidadBodegaTon.message}
              </small>
            )}
            <label htmlFor="esloraM" className="font-bold">
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
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                  suffix=" m"
                />
              )}
            />
            {errors.esloraM && (
              <small className="text-red-500 block">
                {errors.esloraM.message}
              </small>
            )}
            <label htmlFor="mangaM" className="font-bold">
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
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                  suffix=" m"
                />
              )}
            />
            {errors.mangaM && (
              <small className="text-red-500 block">
                {errors.mangaM.message}
              </small>
            )}
            <label htmlFor="puntalM" className="font-bold">
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
                  inputStyle={{ fontWeight: "bold" }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                  suffix=" m"
                />
              )}
            />
            {errors.puntalM && (
              <small className="text-red-500 block">
                {errors.puntalM.message}
              </small>
            )}
            <label htmlFor="motorMarca" className="font-bold">
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
                  style={{ textTransform: "uppercase", fontWeight: "bold" }}
                />
              )}
            />
            {errors.motorMarca && (
              <small className="text-red-500 block">
                {errors.motorMarca.message}
              </small>
            )}
            <label htmlFor="motorPotenciaHp" className="font-bold">
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
                  inputStyle={{ fontWeight: "bold" }}
                  min={0}
                  suffix=" HP"
                />
              )}
            />
            {errors.motorPotenciaHp && (
              <small className="text-red-500 block">
                {errors.motorPotenciaHp.message}
              </small>
            )}
            <label htmlFor="anioFabricacion" className="font-bold">
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
                  inputStyle={{ fontWeight: "bold" }}
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  useGrouping={false}
                />
              )}
            />
            {errors.anioFabricacion && (
              <small className="text-red-500 block">
                {errors.anioFabricacion.message}
              </small>
            )}
          </div>
          {/* Sección de Foto de Embarcación */}
          <div style={{ flex: 1 }}>
            {/* Controles de carga y mensaje */}
            <div style={{ flex: 2 }}>
              <FileUpload
                name="foto"
                style={{ marginBottom: 10, marginTop: 10 }}
                accept="image/*"
                maxFileSize={10 * 1024 * 1024}
                chooseLabel="Elegir foto"
                uploadLabel="Subir"
                cancelLabel="Cancelar"
                customUpload
                uploadHandler={handleFotoUpload}
                disabled={!defaultValues.id || uploadingFoto}
                auto
                mode="basic"
                className="p-mb-2"
              />
              <small className="p-d-block" style={{ color: "#888" }}>
                Solo PNG/JPG. Máx 10MB.
              </small>
              {/* Input profesional para URL de la foto (solo input text, editable/deshabilitado según lógica) */}
              <Controller
                name="urlFotoEmbarcacion"
                control={control}
                disabled
                render={({ field, fieldState }) => (
                  <InputText
                    id="urlFotoEmbarcacion"
                    {...field}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    placeholder="URL de la foto (opcional)"
                  />
                )}
              />
              {errors.urlFotoEmbarcacion && (
                <small className="p-error">
                  {errors.urlFotoEmbarcacion.message}
                </small>
              )}
              {/* Mensaje profesional si no hay id disponible */}
              {!defaultValues.id && (
                <small className="p-error p-d-block">
                  Guarda primero el registro para habilitar la subida de foto.
                </small>
              )}
            </div>
            {/* Bloque izquierdo: título y preview de la foto */}
            <div style={{ flex: 1 }}>
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto actual"
                  style={{
                    marginTop: 10,
                    marginBottom: 10,
                    maxWidth: 450,
                    maxHeight: 320,
                    borderRadius: 6,
                    border: "2px solid #ccc",
                    background: "#fff",
                  }}
                />
              ) : (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 10,
                    width: 180,
                    height: 120,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#bbb",
                    fontSize: 14,
                  }}
                >
                  Sin foto
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cuarta fila: Tablet Marca, Modelo y Foto */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
            marginTop: 10,
          }}
        ></div>
      </div>
    </Card>
  );
}
