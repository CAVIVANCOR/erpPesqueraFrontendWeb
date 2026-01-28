// src/components/documentacionPersonal/DocumentacionPersonalForm.jsx
// Formulario profesional para DocumentacionPersonal. Cumple la regla transversal ERP Megui.
// Utiliza React Hook Form, Yup y PrimeReact. Documentado en español técnico.

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { getPersonal } from "../../api/personal";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getEmpresas } from "../../api/empresa";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const schema = Yup.object().shape({
  personalId: Yup.number().required("El personal es obligatorio"),
  documentoPescaId: Yup.number().required(
    "El documento de pesca es obligatorio",
  ),
  numeroDocumento: Yup.string()
    .nullable()
    .max(50, "El número de documento no puede exceder 50 caracteres"),
  fechaEmision: Yup.date().nullable(),
  fechaVencimiento: Yup.date()
    .nullable()
    .min(
      Yup.ref("fechaEmision"),
      "La fecha de vencimiento debe ser posterior a la fecha de emisión",
    ),
  urlDocPdf: Yup.string()
    .nullable()
    .max(500, "La URL no puede exceder 500 caracteres"),
  docVencido: Yup.boolean(),
  cesado: Yup.boolean(),
  observaciones: Yup.string()
    .nullable()
    .max(500, "Las observaciones no pueden exceder 500 caracteres"),
});

/**
 * Formulario profesional para DocumentacionPersonal.
 * Sigue el patrón estándar ERP Megui con React Hook Form + Yup.
 * @param {boolean} isEdit - Modo edición
 * @param {object} defaultValues - Valores por defecto
 * @param {function} onSubmit - Callback de envío
 * @param {function} onCancel - Callback de cancelación
 * @param {boolean} loading - Estado de carga
 * @param {boolean} readOnly - Modo solo lectura
 */
export default function DocumentacionPersonalForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const normalizedDefaults = {
    ...defaultValues,
    personalId: defaultValues.personalId
      ? Number(defaultValues.personalId)
      : null,
    documentoPescaId: defaultValues.documentoPescaId
      ? Number(defaultValues.documentoPescaId)
      : null,
    numeroDocumento: defaultValues.numeroDocumento || "",
    fechaEmision: defaultValues.fechaEmision
      ? new Date(defaultValues.fechaEmision)
      : null,
    fechaVencimiento: defaultValues.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : null,
    urlDocPdf: defaultValues.urlDocPdf || "",
    docVencido: defaultValues.docVencido || false,
    cesado: defaultValues.cesado || false,
    observaciones: defaultValues.observaciones || "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: normalizedDefaults,
    mode: "onTouched",
  });

  const [personal, setPersonal] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [documentosPesca, setDocumentosPesca] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const toast = useRef(null);

  const fechaVencimiento = watch("fechaVencimiento");

  useEffect(() => {
    if (fechaVencimiento !== undefined) {
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);

      let docVencidoCalculado = true;

      if (fechaVencimiento) {
        const fechaVenc = new Date(fechaVencimiento);
        fechaVenc.setHours(0, 0, 0, 0);
        docVencidoCalculado = fechaVenc < fechaActual;
      }

      setValue("docVencido", docVencidoCalculado);
    }
  }, [fechaVencimiento, setValue]);

  useEffect(() => {
    reset(normalizedDefaults);

    if (isEdit && defaultValues.personalId && personal.length > 0) {
      const personaSeleccionada = personal.find(
        (p) => Number(p.id) === Number(defaultValues.personalId),
      );
      if (personaSeleccionada && personaSeleccionada.empresaId) {
        setFiltroEmpresa(Number(personaSeleccionada.empresaId));
      }
    }
  }, [defaultValues, reset, isEdit, personal]);

  useEffect(() => {
    cargarCombos();
  }, []);

  const cargarCombos = async () => {
    setLoadingCombos(true);
    setErrorMessage("");
    try {
      const [personalRes, documentosPescaRes, empresasRes] =
        await Promise.allSettled([
          getPersonal(),
          getDocumentosPesca(),
          getEmpresas(),
        ]);

      if (empresasRes.status === "fulfilled") {
        const empresasData = empresasRes.value.map((e) => ({
          ...e,
          id: Number(e.id),
          label: e.nombreComercial,
        }));
        setEmpresas(empresasData);
      } else {
        console.error("Error al cargar empresas:", empresasRes.reason);
      }

      if (personalRes.status === "fulfilled") {
        const empresasData =
          empresasRes.status === "fulfilled" ? empresasRes.value : [];
        const personalData = personalRes.value.map((p) => {
          const empresa = empresasData.find(
            (e) => Number(e.id) === Number(p.empresaId),
          );
          return {
            ...p,
            id: Number(p.id),
            empresaId: Number(p.empresaId),
            label: `${p.nombres} ${p.apellidos} - ${
              empresa?.nombreComercial || "Sin empresa"
            }`,
          };
        });
        setPersonal(personalData);
      } else {
        console.error("Error al cargar personal:", personalRes.reason);
      }

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
        console.error(
          "Error al cargar documentos de pesca:",
          documentosPescaRes.reason,
        );
      }
    } catch (error) {
      console.error("Error al cargar combos:", error);
      setErrorMessage(
        "Error al cargar los datos necesarios para el formulario",
      );
    } finally {
      setLoadingCombos(false);
    }
  };

  const personalFiltrado = filtroEmpresa
    ? personal.filter((p) => Number(p.empresaId) === Number(filtroEmpresa))
    : personal;

  const onSubmitForm = (data) => {
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    let docVencidoCalculado = true;

    if (data.fechaVencimiento) {
      const fechaVenc = new Date(data.fechaVencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      docVencidoCalculado = fechaVenc < fechaActual;
    }

    const normalizedData = {
      personalId: Number(data.personalId),
      documentoPescaId: Number(data.documentoPescaId),
      numeroDocumento: data.numeroDocumento?.trim().toUpperCase() || null,
      fechaEmision: data.fechaEmision || null,
      fechaVencimiento: data.fechaVencimiento || null,
      urlDocPdf: data.urlDocPdf?.trim() || null,
      docVencido: docVencidoCalculado,
      cesado: data.cesado,
      observaciones: data.observaciones?.trim().toUpperCase() || null,
    };
    onSubmit(normalizedData);
  };

  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      {errorMessage && (
        <Message severity="error" text={errorMessage} className="mb-3" />
      )}

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "end",
            marginBottom: "0.5rem",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              htmlFor="empresaId"
              className="block text-900 font-medium mb-2"
            >
              Empresa (Filtro)
            </label>
            <Dropdown
              id="empresaId"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.value)}
              options={empresas}
              optionLabel="label"
              optionValue="id"
              placeholder="Seleccione una empresa"
              disabled={readOnly || loading || loadingCombos}
              showClear
              filter
              filterBy="label"
              emptyMessage="No hay empresas disponibles"
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="personalId"
              className="block text-900 font-medium mb-2"
            >
              Personal *
            </label>
            <Controller
              name="personalId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="personalId"
                  {...field}
                  options={personalFiltrado}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccione una persona"
                  className={getFieldClass("personalId")}
                  disabled={
                    readOnly ||
                    loading ||
                    loadingCombos ||
                    personalFiltrado.length === 0
                  }
                  showClear
                  filter
                  filterBy="label"
                  emptyMessage={
                    filtroEmpresa
                      ? "No hay personal disponible para esta empresa"
                      : "No hay personal disponible"
                  }
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.personalId && (
              <small className="p-error">{errors.personalId.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="documentoPescaId"
              className="block text-900 font-medium mb-2"
            >
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
                  disabled={readOnly || loading || loadingCombos}
                  showClear
                  filter
                  filterBy="label"
                  emptyMessage="No hay documentos disponibles"
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.documentoPescaId && (
              <small className="p-error">
                {errors.documentoPescaId.message}
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
          <div style={{ flex: 1 }}>
            <label
              htmlFor="numeroDocumento"
              className="block text-900 font-medium mb-2"
            >
              Número de Documento
            </label>
            <Controller
              name="numeroDocumento"
              control={control}
              render={({ field }) => (
                <InputText
                  id="numeroDocumento"
                  {...field}
                  placeholder="Ingrese el número del documento"
                  className={getFieldClass("numeroDocumento")}
                  disabled={readOnly || loading}
                  style={{ textTransform: "uppercase", fontWeight: "bold" }}
                  maxLength={50}
                />
              )}
            />
            {errors.numeroDocumento && (
              <small className="p-error">
                {errors.numeroDocumento.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="fechaEmision"
              className="block text-900 font-medium mb-2"
            >
              Fecha de Emisión
            </label>
            <Controller
              name="fechaEmision"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fechaEmision"
                  {...field}
                  placeholder="Seleccione fecha de emisión"
                  className={getFieldClass("fechaEmision")}
                  disabled={readOnly || loading}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                />
              )}
            />
            {errors.fechaEmision && (
              <small className="p-error">{errors.fechaEmision.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="fechaVencimiento"
              className="block text-900 font-medium mb-2"
            >
              Fecha de Vencimiento
            </label>
            <Controller
              name="fechaVencimiento"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fechaVencimiento"
                  {...field}
                  placeholder="Seleccione fecha de vencimiento"
                  className={getFieldClass("fechaVencimiento")}
                  disabled={readOnly || loading}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                />
              )}
            />
            {errors.fechaVencimiento && (
              <small className="p-error">
                {errors.fechaVencimiento.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="docVencido"
              className="block text-900 font-medium mb-2"
            >
              Estado Documento
            </label>
            <Controller
              name="docVencido"
              control={control}
              render={({ field }) => (
                <Button
                  type="button"
                  label={field.value ? "VENCIDO" : "VIGENTE"}
                  icon={field.value ? "pi pi-times" : "pi pi-check"}
                  className={
                    field.value ? "p-button-danger" : "p-button-success"
                  }
                  onClick={() => field.onChange(!field.value)}
                  size="small"
                />
              )}
            />
            {errors.docVencido && (
              <small className="p-error">{errors.docVencido.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="cesado" className="block text-900 font-medium mb-2">
              Cesado
            </label>
            <Controller
              name="cesado"
              control={control}
              render={({ field }) => (
                <Button
                  type="button"
                  label={field.value ? "SI" : "NO"}
                  icon={field.value ? "pi pi-check" : "pi pi-times"}
                  className={
                    !field.value ? "p-button-success" : "p-button-danger"
                  }
                  onClick={() => field.onChange(!field.value)}
                  size="small"
                />
              )}
            />
            {errors.cesado && (
              <small className="p-error">{errors.cesado.message}</small>
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
          <div style={{ flex: 2 }}>
            <label
              htmlFor="observaciones"
              className="block text-900 font-medium mb-2"
            >
              Observaciones
            </label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  {...field}
                  rows={1}
                  placeholder="Ingrese observaciones (opcional)"
                  className={getFieldClass("observaciones")}
                  disabled={readOnly || loading}
                  style={{ textTransform: "uppercase", fontWeight: "bold" }}
                  maxLength={500}
                />
              )}
            />
            {errors.observaciones && (
              <small className="p-error">{errors.observaciones.message}</small>
            )}
          </div>
        </div>

        {(isEdit || defaultValues.id) && (
          <div style={{ marginTop: "1rem" }}>
            <PDFDocumentManager
              moduleName="documentacion-personal"
              fieldName="urlDocPdf"
              entityId={defaultValues.id}
              title="Documento PDF Personal"
              dialogTitle="Subir Documento Personal"
              uploadButtonLabel="Capturar/Subir"
              viewButtonLabel="Abrir"
              downloadButtonLabel="Descargar"
              emptyMessage="No hay documento PDF cargado"
              emptyDescription='Use el botón "Capturar/Subir" para agregar el documento personal'
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              defaultValues={normalizedDefaults}
              readOnly={false}
            />
          </div>
        )}

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
            disabled={readOnly || loadingCombos}
            raised
            outlined
            size="small"
          />
        </div>
      </form>
    </div>
  );
}
