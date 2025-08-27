// src/components/documentacionPersonal/DocumentacionPersonalForm.jsx
// Formulario profesional para DocumentacionPersonal. Cumple la regla transversal ERP Megui.
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

import { getPersonal } from "../../api/personal";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getEmpresas } from "../../api/empresa";

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  personalId: Yup.number().required("El personal es obligatorio"),
  documentoPescaId: Yup.number().required("El documento de pesca es obligatorio"),
  observaciones: Yup.string().nullable().max(500, "Las observaciones no pueden exceder 500 caracteres"),
});

/**
 * Formulario profesional para DocumentacionPersonal.
 * Sigue el patrón estándar ERP Megui con React Hook Form + Yup.
 * @param {boolean} isEdit - Modo edición
 * @param {object} defaultValues - Valores por defecto
 * @param {function} onSubmit - Callback de envío
 * @param {function} onCancel - Callback de cancelación
 * @param {boolean} loading - Estado de carga
 */
export default function DocumentacionPersonalForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
}) {
  // Normalización profesional de valores por defecto
  const normalizedDefaults = {
    ...defaultValues,
    personalId: defaultValues.personalId ? Number(defaultValues.personalId) : null,
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
  const [personal, setPersonal] = useState([]);
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
      const [personalRes, documentosPescaRes, empresasRes] = await Promise.allSettled([
        getPersonal(),
        getDocumentosPesca(),
        getEmpresas(),
      ]);

      // Normalización de personal
      if (personalRes.status === "fulfilled") {
        const empresasData = empresasRes.status === "fulfilled" ? empresasRes.value : [];
        const personalData = personalRes.value.map((p) => {
          const empresa = empresasData.find(e => Number(e.id) === Number(p.empresaId));
          return {
            ...p,
            id: Number(p.id),
            label: `${p.nombres} ${p.apellidos} - ${empresa?.nombreComercial || 'Sin empresa'}`,
          };
        });
        setPersonal(personalData);
      } else {
        console.error("Error al cargar personal:", personalRes.reason);
      }

      // Normalización de documentos de pesca
      if (documentosPescaRes.status === "fulfilled") {
        const documentosData = documentosPescaRes.value
          .filter((d) => d.paraTripulantes === true)
          .map((d) => ({
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
      personalId: Number(data.personalId),
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
          {/* Personal */}
          <div className="col-12 md:col-6">
            <label htmlFor="personalId" className="block text-900 font-medium mb-2">
              Personal *
            </label>
            <Controller
              name="personalId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="personalId"
                  {...field}
                  options={personal}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccione una persona"
                  className={getFieldClass("personalId")}
                  disabled={loading || loadingCombos}
                  showClear
                  filter
                  filterBy="label"
                  emptyMessage="No hay personal disponible"
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.personalId && (
              <small className="p-error">{errors.personalId.message}</small>
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
