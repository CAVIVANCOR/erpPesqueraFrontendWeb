// src/components/documentacionEmbarcacion/DocumentacionEmbarcacionForm.jsx
// Formulario profesional para DocumentacionEmbarcacion. Cumple la regla transversal ERP Megui.
// Utiliza React Hook Form, Yup y PrimeReact. Documentado en español técnico.

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { getEmbarcaciones } from "../../api/embarcacion";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getActivos } from "../../api/activo";

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  embarcacionId: Yup.number().required("La embarcación es obligatoria"),
  documentoPescaId: Yup.number().required("El documento de pesca es obligatorio"),
  observaciones: Yup.string().nullable().max(500, "Las observaciones no pueden exceder 500 caracteres"),
});

/**
 * Formulario profesional para DocumentacionEmbarcacion.
 * Sigue el patrón estándar ERP Megui con React Hook Form + Yup.
 * @param {boolean} isEdit - Modo edición
 * @param {object} defaultValues - Valores por defecto
 * @param {function} onSubmit - Callback de envío
 * @param {function} onCancel - Callback de cancelación
 * @param {boolean} loading - Estado de carga
 */
export default function DocumentacionEmbarcacionForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
}) {
  // Normalización profesional de valores por defecto
  const normalizedDefaults = {
    ...defaultValues,
    embarcacionId: defaultValues.embarcacionId ? Number(defaultValues.embarcacionId) : null,
    documentoPescaId: defaultValues.documentoPescaId ? Number(defaultValues.documentoPescaId) : null,
    observaciones: defaultValues.observaciones || "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: normalizedDefaults,
    mode: "onTouched",
  });

  // Estados para combos
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [documentosPesca, setDocumentosPesca] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset cuando cambian los valores por defecto
  useEffect(() => {
    reset(normalizedDefaults);
  }, [defaultValues, reset]);

  // Carga de combos al montar el componente
  useEffect(() => {
    cargarCombos();
  }, []);

  const cargarCombos = async () => {
    setLoadingCombos(true);
    setErrorMessage("");
    try {
      const [embarcacionesRes, documentosPescaRes, activosRes] = await Promise.allSettled([
        getEmbarcaciones(),
        getDocumentosPesca(),
        getActivos(),
      ]);
      // Normalización de embarcaciones
      if (embarcacionesRes.status === "fulfilled") {
        const activosData = activosRes.status === "fulfilled" ? activosRes.value : [];
        const embarcacionesData = embarcacionesRes.value.map((e) => {
          const activo = activosData.find(a => Number(a.id) === Number(e.activoId));
          return {
            ...e,
            id: Number(e.id),
            label: activo ? activo.descripcion : `Embarcación ${e.id}`,
          };
        });
        setEmbarcaciones(embarcacionesData);
      } else {
        console.error("Error al cargar embarcaciones:", embarcacionesRes.reason);
      }

      // Normalización de documentos de pesca
      if (documentosPescaRes.status === "fulfilled") {
        const documentosData = documentosPescaRes.value.map((d) => ({
          ...d,
          id: Number(d.id),
          label: d.descripcion,
        }));
        setDocumentosPesca(documentosData);
      } else {
        console.error("Error al cargar documentos de pesca:", documentosPescaRes.reason);
      }
    } catch (error) {
      console.error("Error al cargar combos:", error);
      setErrorMessage("Error al cargar los datos necesarios para el formulario");
    } finally {
      setLoadingCombos(false);
    }
  };

  // Función de envío con normalización
  const onSubmitForm = (data) => {
    const normalizedData = {
      embarcacionId: Number(data.embarcacionId),
      documentoPescaId: Number(data.documentoPescaId),
      observaciones: data.observaciones?.trim().toUpperCase() || null,
    };
    onSubmit(normalizedData);
  };

  // Función para obtener clases de error
  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
  };

  return (
    <div className="p-fluid">
      {errorMessage && (
        <Message severity="error" text={errorMessage} className="mb-3" />
      )}
      
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="grid">
          {/* Embarcación */}
          <div className="col-12 md:col-6">
            <label htmlFor="embarcacionId" className="block text-900 font-medium mb-2">
              Embarcación *
            </label>
            <Controller
              name="embarcacionId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="embarcacionId"
                  {...field}
                  options={embarcaciones}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccione una embarcación"
                  className={getFieldClass("embarcacionId")}
                  disabled={loading || loadingCombos}
                  showClear
                  filter
                  filterBy="label"
                  emptyMessage="No hay embarcaciones disponibles"
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.embarcacionId && (
              <small className="p-error">{errors.embarcacionId.message}</small>
            )}
          </div>

          {/* Documento de Pesca */}
          <div className="col-12 md:col-6">
            <label htmlFor="documentoPescaId" className="block text-900 font-medium mb-2">
              Documento de Pesca *
            </label>
            <Controller
              name="documentoPescaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="documentoPescaId"
                  {...field}
                  options={documentosPesca}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccione un documento"
                  className={getFieldClass("documentoPescaId")}
                  disabled={loading || loadingCombos}
                  showClear
                  filter
                  filterBy="label"
                  emptyMessage="No hay documentos disponibles"
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.documentoPescaId && (
              <small className="p-error">{errors.documentoPescaId.message}</small>
            )}
          </div>

          {/* Observaciones */}
          <div className="col-12">
            <label htmlFor="observaciones" className="block text-900 font-medium mb-2">
              Observaciones
            </label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  {...field}
                  rows={3}
                  placeholder="Ingrese observaciones (opcional)"
                  className={getFieldClass("observaciones")}
                  disabled={loading}
                  style={{ textTransform: 'uppercase', fontWeight: "bold" }}
                  maxLength={500}
                />
              )}
            />
            {errors.observaciones && (
              <small className="p-error">{errors.observaciones.message}</small>
            )}
          </div>
        </div>
          {/* Botones de acción */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              type="button"
              onClick={onCancel}
              disabled={loading}
              raised
              outlined
              size="small"
            />
            <Button
              label={isEdit ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              className="p-button-success"
              type="submit"
              loading={loading}
              disabled={loadingCombos}
              raised
              outlined
              size="small"
            />
          </div>
      </form>
    </div>
  );
}
