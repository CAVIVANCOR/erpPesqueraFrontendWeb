/**
 * DatosGeneralesProductoForm.jsx
 *
 * Componente Card para gestionar los datos generales de un producto.
 * Incluye campos básicos de identificación, descripción y configuración.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { ButtonGroup } from "primereact/buttongroup";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import { Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { subirFotoProducto } from "../../api/producto";
import { Panel } from "primereact/panel";

export default function DatosGeneralesProductoForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  familias = [],
  subfamilias = [],
  unidadesMedida = [],
  tiposAlmacenamiento = [],
  paises = [],
  marcas = [],
  estadosIniciales = [],
  empresas = [],
  clientes = [],
  tiposMaterial = [],
  colores = [],
  unidadMetricaDefault,
  especies = [],
  defaultValues = {},
  readOnly = false,
}) {
  const familiaIdWatch = watch("familiaId");
  const empresaIdWatch = watch("empresaId");

  // Opciones normalizadas para dropdowns
  const familiasOptions = familias.map((f) => ({
    label: f.nombre,
    value: Number(f.id),
  }));

  const subfamiliasOptions = subfamilias
    .filter((s) => Number(s.familiaId) === Number(familiaIdWatch))
    .map((s) => ({
      label: s.nombre,
      value: Number(s.id),
    }));

  const unidadesMedidaOptions = unidadesMedida.map((u) => ({
    label: `${u.nombre} (${u.simbolo})`,
    value: Number(u.id),
  }));

  const tiposMaterialOptions = tiposMaterial.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  const coloresOptions = colores.map((c) => ({
    label: c.nombre,
    value: Number(c.id),
  }));

  const empresasOptions = empresas.map((e) => ({
    label: e.razonSocial,
    value: Number(e.id),
  }));

  // Filtrar clientes por la empresa seleccionada
  // EntidadComercial.empresaId debe coincidir con Producto.empresaId
  const clienteIdActual = watch("clienteId");
  
  const clientesOptions = clientes
    .filter((c) => {
      // Debe ser cliente
      if (!c.esCliente) return false;

      // SIEMPRE incluir el cliente actual del producto (para modo edición)
      if (clienteIdActual && Number(c.id) === Number(clienteIdActual)) {
        return true;
      }

      // Si hay empresa seleccionada, filtrar por EntidadComercial.empresaId
      if (empresaIdWatch) {
        return Number(c.empresaId) === Number(empresaIdWatch);
      }

      return true; // Si no hay empresa seleccionada, mostrar todos los clientes
    })
    .map((c) => ({
      label: c.razonSocial,
      value: Number(c.id),
    }));

  const tiposAlmacenamientoOptions = tiposAlmacenamiento.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  const paisesOptions = paises.map((p) => ({
    label: p.gentilicio,
    value: Number(p.id),
  }));

  const marcasOptions = marcas.map((m) => ({
    label: m.nombre,
    value: Number(m.id),
  }));

  const estadosInicialesOptions = estadosIniciales.map((e) => ({
    label: e.descripcion,
    value: Number(e.id),
  }));

  const especiesOptions = especies.map((e) => ({
    label: e.nombre,
    value: Number(e.id),
  }));

  // Limpiar subfamilia cuando cambie la familia
  useEffect(() => {
    if (familiaIdWatch) {
      const subfamiliaActual = watch("subfamiliaId");
      const subfamiliaValida = subfamilias.find(
        (s) =>
          Number(s.id) === Number(subfamiliaActual) &&
          Number(s.familiaId) === Number(familiaIdWatch)
      );
      if (!subfamiliaValida) {
        setValue("subfamiliaId", null);
      }
    }
  }, [familiaIdWatch, subfamilias, setValue, watch]);

  // Limpiar cliente cuando cambie la empresa
  useEffect(() => {
    if (empresaIdWatch) {
      const clienteActual = watch("clienteId");

      // Validar que el cliente actual pertenezca a la empresa seleccionada
      if (clienteActual) {
        const clienteValido = clientes.find(
          (c) =>
            Number(c.id) === Number(clienteActual) &&
            Number(c.empresaId) === Number(empresaIdWatch) &&
            c.esCliente === true
        );
        if (!clienteValido) {
          setValue("clienteId", null);
        }
      }
    }
  }, [empresaIdWatch, clientes, setValue, watch]);

  // Establecer estado inicial LIBERADO para productos nuevos
  useEffect(() => {
    if (estadosIniciales.length > 0) {
      const estadoLiberado = estadosIniciales.find(
        (e) =>
          e.descripcion?.toUpperCase() === "LIBERADO" &&
          e.tipoProvieneDe?.descripcion?.toUpperCase() === "PRODUCTOS"
      );

      if (estadoLiberado) {
        const estadoLiberadoId = Number(estadoLiberado.id);
        const currentValue = watch("estadoInicialId");

        if (!currentValue || Number(currentValue) !== estadoLiberadoId) {
          setValue("estadoInicialId", estadoLiberadoId);
        }
      }
    }
  }, [estadosIniciales, setValue, watch]);

  // Función para armar descripcionArmada según especificación del usuario
  const armarDescripcionArmada = () => {
    const formData = watch();
    let descripcionArmada = "";

    // 1. Descripción base según aplicaSubfamilia
    if (formData.aplicaSubfamilia) {
      const subfamilia = subfamilias.find(
        (s) => Number(s.id) === Number(formData.subfamiliaId)
      );
      if (subfamilia) {
        descripcionArmada =
          subfamilia.nombre +
          " " +
          (formData.descripcionBase || "") +
          " " +
          (formData.descripcionExtendida || "");
      } else {
        descripcionArmada =
          (formData.descripcionBase || "") +
          " " +
          (formData.descripcionExtendida || "");
      }
    } else {
      descripcionArmada =
        (formData.descripcionBase || "") +
        " " +
        (formData.descripcionExtendida || "");
    }

    // 2. Tipo Material si tipoMaterialId > 1
    if (Number(formData.tipoMaterialId) > 1) {
      const tipoMaterial = tiposMaterial.find(
        (t) => Number(t.id) === Number(formData.tipoMaterialId)
      );
      if (tipoMaterial) {
        descripcionArmada += " " + tipoMaterial.nombre;
      }
    }

    // 3. Medidas si alguna es diferente de ""
    const tieneMedidas =
      formData.medidaDiametro ||
      formData.medidaAncho ||
      formData.medidaAlto ||
      formData.medidaLargo ||
      formData.medidaEspesor ||
      formData.medidaAngulo;

    if (tieneMedidas) {
      descripcionArmada += " ";

      // Diámetro
      if (formData.medidaDiametro) {
        const unidadDiametro = unidadesMedida.find(
          (u) => Number(u.id) === Number(formData.unidadDiametroId)
        );
        descripcionArmada +=
          " " + formData.medidaDiametro + " " + (unidadDiametro?.simbolo || "");
      }

      // Ancho
      if (formData.medidaAncho) {
        const unidadAncho = unidadesMedida.find(
          (u) => Number(u.id) === Number(formData.unidadAnchoId)
        );
        descripcionArmada +=
          " " + formData.medidaAncho + " " + (unidadAncho?.simbolo || "");
      }

      // Alto
      if (formData.medidaAlto) {
        const unidadAlto = unidadesMedida.find(
          (u) => Number(u.id) === Number(formData.unidadAltoId)
        );
        descripcionArmada +=
          " " + formData.medidaAlto + " " + (unidadAlto?.simbolo || "");
      }

      // Largo
      if (formData.medidaLargo) {
        const unidadLargo = unidadesMedida.find(
          (u) => Number(u.id) === Number(formData.unidadLargoId)
        );
        descripcionArmada +=
          " " + formData.medidaLargo + " " + (unidadLargo?.simbolo || "");
      }

      // Espesor
      if (formData.medidaEspesor) {
        const unidadEspesor = unidadesMedida.find(
          (u) => Number(u.id) === Number(formData.unidadEspesorId)
        );
        descripcionArmada +=
          " " + formData.medidaEspesor + " " + (unidadEspesor?.simbolo || "");
      }

      // Ángulo
      if (formData.medidaAngulo) {
        const unidadAngulo = unidadesMedida.find(
          (u) => Number(u.id) === Number(formData.unidadAnguloId)
        );
        descripcionArmada +=
          " " + formData.medidaAngulo + " " + (unidadAngulo?.simbolo || "");
      }
      if (formData.descripcionMedidaAdicional) {
        descripcionArmada += " " + formData.descripcionMedidaAdicional;
      }
    }

    // 4. Marca si marcaId > 0 y aplicaMarca = true
    if (Number(formData.marcaId) > 0 && formData.aplicaMarca) {
      const marca = marcas.find(
        (m) => Number(m.id) === Number(formData.marcaId)
      );
      if (marca) {
        descripcionArmada += " " + marca.nombre;
      }
    }

    // 5. País (procedencia) si procedenciaId > 0 y aplicaProcedencia = true
    if (Number(formData.procedenciaId) > 0 && formData.aplicaProcedencia) {
      const pais = paises.find(
        (p) => Number(p.id) === Number(formData.procedenciaId)
      );
      if (pais) {
        descripcionArmada += " " + pais.gentilicio;
      }
    }

    // 6. Color si colorId > 0 y aplicaColor = true
    if (Number(formData.colorId) > 0 && formData.aplicaColor) {
      const color = colores.find(
        (c) => Number(c.id) === Number(formData.colorId)
      );
      if (color) {
        descripcionArmada += " " + color.nombre;
      }
    }

    // 7. Unidad de medida si unidadMedidaId > 0 y aplicaUnidadMedida = true
    if (Number(formData.unidadMedidaId) > 0 && formData.aplicaUnidadMedida) {
      const unidadMedida = unidadesMedida.find(
        (u) => Number(u.id) === Number(formData.unidadMedidaId)
      );
      if (unidadMedida) {
        descripcionArmada += " " + unidadMedida.simbolo;
      }
    }

    // 8. Tipo almacenamiento si tipoAlmacenamientoId > 0 y aplicaTipoAlmacenamiento = true
    if (
      Number(formData.tipoAlmacenamientoId) > 0 &&
      formData.aplicaTipoAlmacenamiento
    ) {
      const tipoAlmacenamiento = tiposAlmacenamiento.find(
        (t) => Number(t.id) === Number(formData.tipoAlmacenamientoId)
      );
      if (tipoAlmacenamiento) {
        descripcionArmada += " " + tipoAlmacenamiento.nombre;
      }
    }

    // Limpiar espacios múltiples y establecer el valor
    descripcionArmada = descripcionArmada.replace(/\s+/g, " ").trim();
    setValue("descripcionArmada", descripcionArmada);
  };

  // useEffect para armar descripcionArmada cuando cambien los campos relevantes
  useEffect(() => {
    armarDescripcionArmada();
  }, [
    watch("aplicaSubfamilia"),
    watch("subfamiliaId"),
    watch("descripcionBase"),
    watch("descripcionExtendida"),
    watch("tipoMaterialId"),
    watch("medidaDiametro"),
    watch("medidaAncho"),
    watch("medidaAlto"),
    watch("medidaLargo"),
    watch("medidaEspesor"),
    watch("medidaAngulo"),
    watch("unidadDiametroId"),
    watch("unidadAnchoId"),
    watch("unidadAltoId"),
    watch("unidadLargoId"),
    watch("unidadEspesorId"),
    watch("unidadAnguloId"),
    watch("descripcionMedidaAdicional"),
    watch("marcaId"),
    watch("aplicaMarca"),
    watch("procedenciaId"),
    watch("aplicaProcedencia"),
    watch("colorId"),
    watch("aplicaColor"),
    watch("unidadMedidaId"),
    watch("aplicaUnidadMedida"),
    watch("tipoAlmacenamientoId"),
    watch("aplicaTipoAlmacenamiento"),
  ]);

  // --- Gestión profesional de foto de producto ---
  const [fotoPreview, setFotoPreview] = useState(
    defaultValues.urlFotoProducto
      ? `${import.meta.env.VITE_UPLOADS_URL}/productos/${
          defaultValues.urlFotoProducto
        }`
      : null
  );

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const toastFoto = React.useRef(null);

  // Reset profesional y actualización de preview de foto al abrir en modo edición o alta
  useEffect(() => {
    // Actualiza el preview de la foto si cambia el registro
    /**
     * Construye la URL profesional de la foto usando la variable de entorno general para uploads.
     */
    const urlFoto = defaultValues.urlFotoProducto
      ? defaultValues.urlFotoProducto.startsWith("http")
        ? defaultValues.urlFotoProducto
        : `${import.meta.env.VITE_UPLOADS_URL}/productos/${
            defaultValues.urlFotoProducto
          }`
      : null;
    setFotoPreview(urlFoto);
  }, [defaultValues]);

  /**
   * Maneja la subida profesional de la foto de producto.
   * Valida tipo/tamaño, sube vía API, actualiza preview y campo urlFotoProducto.
   * Muestra mensajes de éxito/error profesional.
   * Muestra el preview inmediatamente usando URL.createObjectURL(file),
   * luego sube el archivo y actualiza el preview con la URL definitiva del backend.
   * Documentado en español técnico.
   */
  const handleFotoUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;
    // Validación profesional: solo imágenes y máx 2MB
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
      const res = await subirFotoProducto(defaultValues.id, file);
      setValue("urlFotoProducto", res.foto, { shouldValidate: true });
      // Construye la URL profesional de la foto subida usando la variable general de uploads.
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/productos/${
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
    } finally {
      setUploadingFoto(false);
    }
  };

  // --- Fin gestión foto de producto ---

  return (
    <Fieldset style={{ padding: 0, margin: 0, border: "none" }}>
      <Toast ref={toastFoto} />
      <div className="p-fluid formgrid grid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 2 }}>
            <label htmlFor="empresaId" className="font-bold">
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="empresaId"
                  {...field}
                  options={empresasOptions}
                  placeholder="Seleccione una empresa"
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{ fontWeight: "bold" }}
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="clienteId" className="font-bold">
              Cliente *
            </label>
            <Controller
              name="clienteId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="clienteId"
                  {...field}
                  options={clientesOptions}
                  placeholder={
                    empresaIdWatch
                      ? "Seleccione un cliente"
                      : "Primero seleccione una empresa"
                  }
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{ fontWeight: "bold" }}
                  filter
                  disabled={readOnly || !empresaIdWatch}
                />
              )}
            />
            {errors.clienteId && (
              <small className="p-error">{errors.clienteId.message}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="codigo" className="font-bold">
              Código *
            </label>
            <Controller
              name="codigo"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="codigo"
                  {...field}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{ fontWeight: "bold" }}
                  maxLength={20}
                  disabled={readOnly}
                />
              )}
            />
            {errors.codigo && (
              <small className="p-error">{errors.codigo.message}</small>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="familiaId" className="font-bold">
              Familia *
            </label>
            <Controller
              name="familiaId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="familiaId"
                  {...field}
                  options={familiasOptions}
                  placeholder="Seleccione una familia"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  filter
                  showClear
                  disabled={readOnly}
                />
              )}
            />
            {errors.familiaId && (
              <small className="p-error">{errors.familiaId.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="subfamiliaId" className="font-bold">
              Subfamilia *
            </label>
            <Controller
              name="aplicaSubfamilia"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="aplicaSubfamilia"
                  {...field}
                  checked={field.value}
                  disabled={readOnly}
                />
              )}
            />
            <Controller
              name="subfamiliaId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="subfamiliaId"
                  {...field}
                  options={subfamiliasOptions}
                  placeholder="Seleccione una subfamilia"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  filter
                  showClear
                  disabled={readOnly || !familiaIdWatch}
                />
              )}
            />
            {errors.subfamiliaId && (
              <small className="p-error">{errors.subfamiliaId.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="especieId" className="font-bold">
              Especie
            </label>
            <Controller
              name="especieId"
              control={control}
              render={({ field, fieldState }) => (
                <Dropdown
                  id="especieId"
                  {...field}
                  options={especiesOptions}
                  placeholder="Seleccione especie"
                  style={{ fontWeight: "bold" }}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  showClear
                  filter
                  disabled={readOnly}
                />
              )}
            />
            {errors.especieId && (
              <small className="p-error">{errors.especieId.message}</small>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="descripcionBase" className="font-bold">
              Descripción Base *
            </label>
            <Controller
              name="descripcionBase"
              control={control}
              render={({ field, fieldState }) => (
                <InputText
                  id="descripcionBase"
                  {...field}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                  maxLength={120}
                  disabled={readOnly}
                />
              )}
            />
            {errors.descripcionBase && (
              <small className="p-error">
                {errors.descripcionBase.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="descripcionExtendida" className="font-bold">
              Descripción Extendida
            </label>
            <Controller
              name="descripcionExtendida"
              control={control}
              render={({ field, fieldState }) => (
                <InputTextarea
                  id="descripcionExtendida"
                  {...field}
                  rows={1}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                  maxLength={120}
                  disabled={readOnly}
                />
              )}
            />
            {errors.descripcionExtendida && (
              <small className="p-error">
                {errors.descripcionExtendida.message}
              </small>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="descripcionArmada" className="font-bold">
              Descripción Armada *
            </label>
            <Controller
              name="descripcionArmada"
              control={control}
              render={({ field, fieldState }) => (
                <InputTextarea
                  id="descripcionArmada"
                  {...field}
                  rows={1}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  style={{
                    textTransform: "uppercase",
                    color: "#000000",
                    fontSize: "large",
                    fontWeight: "bold",
                    backgroundColor: "#FFFFCC",
                  }}
                  maxLength={500}
                  disabled
                />
              )}
            />
            {errors.descripcionArmada && (
              <small className="p-error">
                {errors.descripcionArmada.message}
              </small>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "2rem",
            marginTop: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="procedenciaId" className="font-bold">
                Procedencia *
              </label>
              <Controller
                name="aplicaProcedencia"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="aplicaProcedencia"
                    {...field}
                    checked={field.value}
                    disabled={readOnly}
                  />
                )}
              />
              <Controller
                name="procedenciaId"
                control={control}
                render={({ field, fieldState }) => (
                  <Dropdown
                    id="procedenciaId"
                    {...field}
                    options={paisesOptions}
                    placeholder="Seleccione una procedencia"
                    style={{ fontWeight: "bold" }}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    showClear
                    filter
                    disabled={readOnly}
                  />
                )}
              />
              {errors.procedenciaId && (
                <small className="p-error">
                  {errors.procedenciaId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tipoAlmacenamientoId" className="font-bold">
                Tipo de Almacenamiento *
              </label>
              <Controller
                name="aplicaTipoAlmacenamiento"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="aplicaTipoAlmacenamiento"
                    {...field}
                    checked={field.value}
                    disabled={readOnly}
                  />
                )}
              />
              <Controller
                name="tipoAlmacenamientoId"
                control={control}
                render={({ field, fieldState }) => (
                  <Dropdown
                    id="tipoAlmacenamientoId"
                    {...field}
                    options={tiposAlmacenamientoOptions}
                    placeholder="Seleccione tipo de almacenamiento"
                    style={{ fontWeight: "bold" }}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    showClear
                    filter
                    disabled={readOnly}
                  />
                )}
              />
              {errors.tipoAlmacenamientoId && (
                <small className="p-error">
                  {errors.tipoAlmacenamientoId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="unidadMedidaId" className="font-bold">
                Unidad de Medida *
              </label>
              <Controller
                name="aplicaUnidadMedida"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="aplicaUnidadMedida"
                    {...field}
                    checked={field.value}
                    disabled={readOnly}
                  />
                )}
              />
              <Controller
                name="unidadMedidaId"
                control={control}
                render={({ field, fieldState }) => (
                  <Dropdown
                    id="unidadMedidaId"
                    {...field}
                    options={unidadesMedidaOptions}
                    placeholder="Seleccione una unidad"
                    style={{ fontWeight: "bold" }}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    showClear
                    filter
                    disabled={readOnly}
                  />
                )}
              />
              {errors.unidadMedidaId && (
                <small className="p-error">
                  {errors.unidadMedidaId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="porcentajeDetraccion" className="font-bold">
                Detracción (%)
              </label>
              <Controller
                name="porcentajeDetraccion"
                control={control}
                render={({ field, fieldState }) => (
                  <InputNumber
                    id="porcentajeDetraccion"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    max={100}
                    suffix="%"
                    disabled={readOnly}
                  />
                )}
              />
              {errors.porcentajeDetraccion && (
                <small className="p-error">
                  {errors.porcentajeDetraccion.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="estadoInicialId" className="font-bold">
                Estado Inicial *
              </label>
              <Controller
                name="estadoInicialId"
                control={control}
                render={({ field, fieldState }) => (
                  <Dropdown
                    id="estadoInicialId"
                    {...field}
                    options={estadosInicialesOptions}
                    placeholder="Seleccione estado inicial"
                    style={{ fontWeight: "bold" }}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    showClear
                    disabled={readOnly}
                  />
                )}
              />
              {errors.estadoInicialId && (
                <small className="p-error">
                  {errors.estadoInicialId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Controller
                name="cesado"
                control={control}
                render={({ field }) => (
                  <Button
                    id="cesado"
                    type="button"
                    label={field.value ? "CESADO" : "ACTIVO"}
                    icon={
                      field.value ? "pi pi-times-circle" : "pi pi-check-circle"
                    }
                    className={
                      field.value ? "p-button-danger" : "p-button-primary"
                    }
                    onClick={() => field.onChange(!field.value)}
                    style={{ marginTop: "0.5rem", width: "100%" }}
                    disabled={readOnly}
                    raised
                  />
                )}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "2rem",
              marginTop: 18,
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "1rem",
              backgroundColor: "#f8f9fa",
            }}
          >
            {/* Controles de carga y mensaje */}
            <div style={{ flex: 3 }}>
              <FileUpload
                name="foto"
                accept="image/*"
                maxFileSize={10 * 1024 * 1024}
                chooseLabel="Elegir foto"
                uploadLabel="Subir"
                cancelLabel="Cancelar"
                customUpload
                uploadHandler={handleFotoUpload}
                disabled={readOnly || !defaultValues.id || uploadingFoto}
                auto
                mode="basic"
              />
              <small className="p-d-block" style={{ color: "#888" }}>
                Solo PNG/JPG. Máx 10MB.
              </small>
              {/* Input profesional para URL de la foto (solo input text, editable/deshabilitado según lógica) */}
              <Controller
                name="urlFotoProducto"
                control={control}
                disabled
                render={({ field, fieldState }) => (
                  <InputText
                    id="urlFotoProducto"
                    {...field}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    placeholder="URL de la foto (opcional)"
                  />
                )}
              />
              {errors.urlFotoProducto && (
                <small className="p-error">
                  {errors.urlFotoProducto.message}
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
            <div style={{ flex: 2, display: "flex", justifyContent: "end" }}>
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto actual"
                  style={{
                    marginTop: "1rem",
                    marginBottom: "1rem",
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
                    marginTop: "1rem",
                    marginBottom: "1rem",
                    width: 180,
                    height: 120,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "end",
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
        {/* Sección de Información Margenes de Utilidad */}
        <Panel
          header="Información Adicional"
          toggleable
          collapsed
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          ></div>
          {/* Sección de Márgenes de Utilidad */}
          <div
            style={{
              display: "flex",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "0.25rem",
              border: "2px solid #dee2e6",
              gap: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: "#495057" }}>
                Márgenes de Utilidad
              </h3>
            </div>
            <div style={{ flex: 1 }}>
              <small style={{ display: "block", color: "#6c757d" }}>
                Estos márgenes se heredan de la Empresa al crear el producto.
                Puedes editarlos para este producto específico.
              </small>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="margenMinimoPermitido" className="font-bold">
                Margen Mínimo Permitido (%)
              </label>
              <Controller
                name="margenMinimoPermitido"
                control={control}
                render={({ field, fieldState }) => (
                  <InputNumber
                    id="margenMinimoPermitido"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    min={0}
                    max={100}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix=" %"
                    placeholder="0.00 %"
                    disabled={readOnly}
                  />
                )}
              />
              {errors.margenMinimoPermitido && (
                <small className="p-error">
                  {errors.margenMinimoPermitido.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="margenUtilidadObjetivo" className="font-bold">
                Margen Utilidad Objetivo (%)
              </label>
              <Controller
                name="margenUtilidadObjetivo"
                control={control}
                render={({ field, fieldState }) => (
                  <InputNumber
                    id="margenUtilidadObjetivo"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                    min={0}
                    max={100}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix=" %"
                    placeholder="0.00 %"
                    disabled={readOnly}
                  />
                )}
              />
              {errors.margenUtilidadObjetivo && (
                <small className="p-error">
                  {errors.margenUtilidadObjetivo.message}
                </small>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </Fieldset>
  );
}
