// src/components/accesoInstalacion/cards/ObservacionesIncidentesCard.jsx
// Card moderno para observaciones e incidentes del acceso
// Usa Card de PrimeReact para diseño profesional y responsive

import React, { useEffect } from "react";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Controller } from "react-hook-form";

/**
 * Card para observaciones e incidentes del acceso
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de react-hook-form
 * @param {Function} props.watch - Función watch de react-hook-form
 * @param {Function} props.setValue - Función setValue de react-hook-form
 * @param {Function} props.getFormErrorMessage - Función para obtener mensajes de error
 * @param {boolean} props.accesoSellado - Si el acceso está sellado (deshabilita todos los campos)
 */
const ObservacionesIncidentesCard = ({
  control,
  watch,
  setValue,
  getFormErrorMessage,
  accesoSellado = false,
}) => {
  const descripcionIncidente = watch("descripcionIncidente");
  const tieneIncidente = watch("incidenteResaltante");

  // Efecto para sincronizar automáticamente el checkbox con la descripción
  useEffect(() => {
    const tieneTexto = descripcionIncidente && descripcionIncidente.trim().length > 0;
    
    // Solo actualizar si el estado actual es diferente al que debería ser
    if (tieneIncidente !== tieneTexto) {
      setValue("incidenteResaltante", tieneTexto);
    }
  }, [descripcionIncidente, tieneIncidente, setValue]);

  return (
    <Card
      title="Observaciones e Incidentes"
      subTitle="Notas adicionales y registro de incidentes especiales"
      className="mb-4"
    >
      <div className="formgrid grid">
        {/* Campo de Observaciones */}
        <div className="field col-12">
          <label htmlFor="observaciones" className="font-semibold">
            Observaciones
          </label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                {...field}
                placeholder="Ingrese observaciones generales"
                className="w-full"
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
                rows={3}
                maxLength={500}
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("observaciones")}
        </div>

        {/* SEPARADOR */}
        <div className="field col-12">
          <hr className="my-4" />
        </div>
        {/* Descripción del Incidente - Primero para que controle el checkbox */}
        <div className="field col-12">
          <label htmlFor="descripcionIncidente" className="font-semibold">
            Descripción del Incidente
          </label>
          <Controller
            name="descripcionIncidente"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="descripcionIncidente"
                {...field}
                placeholder="Describa el incidente resaltante"
                className="w-full"
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
                rows={3}
                maxLength={500}
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("descripcionIncidente")}
          <small className="text-500">
            Describa cualquier incidente ocurrido durante el acceso. El checkbox se marcará automáticamente.
          </small>
        </div>

        {/* Checkbox Incidente Resaltante - Automático y no editable */}
        <div className="field col-12">
          <div className="flex align-items-center">
            <Controller
              name="incidenteResaltante"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="incidenteResaltante"
                  checked={field.value}
                  onChange={() => {}} // No hacer nada - es automático
                  className="mr-2"
                  disabled={true} // No editable
                  style={{ 
                    opacity: field.value ? 1 : 0.6,
                    cursor: 'not-allowed'
                  }}
                />
              )}
            />
            <label htmlFor="incidenteResaltante" className="font-semibold">
              Incidente Resaltante {tieneIncidente && <span className="text-orange-500">(Detectado automáticamente)</span>}
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ObservacionesIncidentesCard;
