// src/components/accesoInstalacion/cards/DatosAccesoCard.jsx
// Card moderno para datos del acceso y persona visitante
// Usa Card de PrimeReact para diseño profesional y responsive

import React from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { Controller } from "react-hook-form";
import { formatearFechaHora } from "../../../utils/utils";

/**
 * Card para datos del acceso y persona visitante
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de react-hook-form
 * @param {Function} props.watch - Función watch de react-hook-form
 * @param {Function} props.getFormErrorMessage - Función para obtener mensajes de error
 * @param {Array} props.tiposDocumento - Array de tipos de documento
 * @param {Array} props.tiposPersona - Array de tipos de persona
 * @param {Array} props.tiposAcceso - Array de tipos de acceso
 * @param {Array} props.motivosAcceso - Array de motivos de acceso
 * @param {Array} props.personalDestino - Array de personal destino
 * @param {Array} props.areasDestino - Array de áreas destino
 * @param {boolean} props.modoEdicion - Si está en modo edición
 * @param {boolean} props.buscandoPersona - Si está buscando persona
 * @param {Function} props.onDocumentBlur - Callback cuando se pierde foco en documento
 * @param {boolean} props.accesoSellado - Si el acceso está sellado (deshabilita todos los campos)
 */
const DatosAccesoCard = ({
  control,
  watch,
  getFormErrorMessage,
  tiposDocumento,
  tiposPersona,
  tiposAcceso,
  motivosAcceso,
  personalDestino,
  areasDestino,
  modoEdicion,
  buscandoPersona,
  onDocumentBlur,
  accesoSellado = false,
}) => {
  return (
    <Card
      title="Datos del Acceso"
      subTitle="Información del visitante, motivo de acceso y Destino Persona y Area Fisica"
    >
      <div className="p-fluid">
        {/* PRIMERA FILA: Fecha y Hora, Tipo de Acceso, Tipo y N° Documento */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Fecha y Hora */}
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaHora" className="font-semibold">
              Fecha y Hora
            </label>
            <div
              id="fechaHora"
              className="p-inputtext p-component p-disabled"
              style={{ fontWeight: "bold" }}
            >
              {formatearFechaHora(
                watch("fechaHora"),
                "Generándose automáticamente..."
              )}
            </div>
          </div>
          {/* Tipo de Acceso */}
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoAccesoId" className="font-semibold">
              Tipo Acceso <span className="text-red-500">*</span>
            </label>
            <Controller
              name="tipoAccesoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="tipoAccesoId"
                  value={field.value}
                  options={tiposAcceso}
                  onChange={field.onChange}
                  placeholder="Tipo de acceso"
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                  showClear
                  disabled={accesoSellado}
                />
              )}
            />
            {getFormErrorMessage("tipoAccesoId")}
          </div>
          {/* Tipo de Documento */}
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoDocIdentidadId" className="font-semibold">
              Tipo <span className="text-red-500">*</span>
            </label>
            <Controller
              name="tipoDocIdentidadId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="tipoDocIdentidadId"
                  value={field.value}
                  options={tiposDocumento}
                  onChange={field.onChange}
                  placeholder="Tipo"
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                  showClear
                  disabled={accesoSellado}
                />
              )}
            />
            {getFormErrorMessage("tipoDocIdentidadId")}
          </div>
          {/* Número de Documento */}
          <div style={{ flex: 1 }}>
            <label htmlFor="numeroDocumento" className="font-semibold">
              N° Documento <span className="text-red-500">*</span>
            </label>
            <div className="p-inputgroup">
              <Controller
                name="numeroDocumento"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroDocumento"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur(e);
                      if (onDocumentBlur) {
                        onDocumentBlur(e.target.value);
                      }
                    }}
                    placeholder="Número de documento"
                    className="w-full"
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                    disabled={accesoSellado || modoEdicion}
                  />
                )}
              />
              <Button
                icon="pi pi-search"
                className="p-button-secondary"
                disabled={accesoSellado || modoEdicion}
              />
              {buscandoPersona && (
                <span className="p-inputgroup-addon">
                  <ProgressSpinner size="20px" strokeWidth="4" />
                </span>
              )}
            </div>
            {getFormErrorMessage("numeroDocumento")}
          </div>
        </div>

        {/* Nombre Completo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="nombrePersona" className="font-semibold">
            Nombre Completo de la Persona{" "}
            <span className="text-red-500">*</span>
          </label>
          <Controller
            name="nombrePersona"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombrePersona"
                {...field}
                placeholder="Nombres completos"
                className="w-full"
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
                disabled={accesoSellado || buscandoPersona}
              />
            )}
          />
          {getFormErrorMessage("nombrePersona")}
        </div>

        {/* Tipo de Persona */}
        <div className="field col-12 md:col-6">
          <label htmlFor="tipoPersonaId" className="font-semibold">
            Tipo de Persona <span className="text-red-500">*</span>
          </label>
          <Controller
            name="tipoPersonaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoPersonaId"
                value={field.value}
                options={tiposPersona}
                onChange={(e) => {
                  field.onChange(e.value);

                  // Autocompletar imprimeTicketIng desde TipoPersona
                  if (e.value) {
                    const tipoPersonaSeleccionado = tiposPersona.find(
                      (tp) => tp.value === e.value
                    );
                    if (
                      tipoPersonaSeleccionado &&
                      tipoPersonaSeleccionado.imprimeTicketIng !== undefined
                    ) {
                      setValue(
                        "imprimeTicketIng",
                        tipoPersonaSeleccionado.imprimeTicketIng
                      );
                    }
                  } else {
                    // Si se limpia el tipo de persona, resetear a false
                    setValue("imprimeTicketIng", false);
                  }
                }}
                placeholder="Seleccione tipo de persona"
                className="w-full"
                style={{ fontWeight: "bold" }}
                showClear
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("tipoPersonaId")}
        </div>

        {/* Motivo de Acceso */}
        <div className="field col-12 md:col-6">
          <label htmlFor="motivoId" className="font-semibold">
            Motivo de Acceso <span className="text-red-500">*</span>
          </label>
          <Controller
            name="motivoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="motivoId"
                value={field.value}
                options={motivosAcceso}
                onChange={field.onChange}
                placeholder="Seleccione motivo de acceso"
                className="w-full"
                style={{ fontWeight: "bold" }}
                showClear
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("motivoId")}
        </div>

        {/* Persona Destino */}
        <div className="field col-12 md:col-6">
          <label
            htmlFor="personaFirmaDestinoVisitaId"
            className="font-semibold"
          >
            Persona Destino (Personal) <span className="text-red-500">*</span>
          </label>
          <Controller
            name="personaFirmaDestinoVisitaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="personaFirmaDestinoVisitaId"
                value={field.value}
                options={personalDestino}
                onChange={field.onChange}
                placeholder="Seleccione persona destino"
                className="w-full"
                style={{ fontWeight: "bold" }}
                showClear
                filter
                filterBy="label"
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("personaFirmaDestinoVisitaId")}
        </div>

        {/* Área de Destino */}
        <div className="field col-12 md:col-6">
          <label htmlFor="areaDestinoVisitaId" className="font-semibold">
            Área de Destino <span className="text-red-500">*</span>
          </label>
          <Controller
            name="areaDestinoVisitaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="areaDestinoVisitaId"
                value={field.value}
                options={areasDestino}
                onChange={field.onChange}
                placeholder="Seleccione área de destino"
                className="w-full"
                style={{ fontWeight: "bold" }}
                showClear
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("areaDestinoVisitaId")}
        </div>

        {/* Checkbox Imprimir Ticket */}
        <div className="field col-12">
          <div className="flex align-items-center">
            <Controller
              name="imprimeTicketIng"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="imprimeTicketIng"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className="mr-2"
                  disabled={accesoSellado}
                />
              )}
            />
            <label htmlFor="imprimeTicketIng" className="font-semibold">
              Imprimir Ticket de Ingreso
            </label>
          </div>
          {getFormErrorMessage("imprimeTicketIng")}
        </div>
      </div>
    </Card>
  );
};

export default DatosAccesoCard;
