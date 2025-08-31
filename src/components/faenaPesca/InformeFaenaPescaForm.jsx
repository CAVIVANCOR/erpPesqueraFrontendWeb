/**
 * InformeFaenaPescaForm.jsx
 *
 * Componente para mostrar y editar el informe de faena de pesca.
 * Extraído de DatosGeneralesFaenaPesca.jsx para seguir el patrón de cards.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";

const InformeFaenaPescaForm = ({
  control,
  watch,
  errors,
  loading = false,
}) => {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="urlInformeFaena">URL Informe Faena</label>
          <Controller
            name="urlInformeFaena"
            control={control}
            render={({ field }) => (
              <InputText
                id="urlInformeFaena"
                {...field}
                disabled={loading}
                style={{ fontWeight: "bold" }}
                placeholder="URL del informe de faena"
                className={classNames({
                  "p-invalid": errors.urlInformeFaena,
                })}
              />
            )}
          />
          {errors.urlInformeFaena && (
            <Message severity="error" text={errors.urlInformeFaena.message} />
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
          <label htmlFor="urlReporteFaenaCalas">URL Reporte Faena Calas</label>
          <Controller
            name="urlReporteFaenaCalas"
            control={control}
            render={({ field }) => (
              <InputText
                id="urlReporteFaenaCalas"
                {...field}
                disabled={loading}
                style={{ fontWeight: "bold" }}
                placeholder="URL del reporte de faena calas"
                className={classNames({
                  "p-invalid": errors.urlReporteFaenaCalas,
                })}
              />
            )}
          />
          {errors.urlReporteFaenaCalas && (
            <Message severity="error" text={errors.urlReporteFaenaCalas.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="urlDeclaracionDesembarqueArmador">URL Declaración Desembarque Armador</label>
          <Controller
            name="urlDeclaracionDesembarqueArmador"
            control={control}
            render={({ field }) => (
              <InputText
                id="urlDeclaracionDesembarqueArmador"
                {...field}
                disabled={loading}
                style={{ fontWeight: "bold" }}
                placeholder="URL de la declaración de desembarque del armador"
                className={classNames({
                  "p-invalid": errors.urlDeclaracionDesembarqueArmador,
                })}
              />
            )}
          />
          {errors.urlDeclaracionDesembarqueArmador && (
            <Message severity="error" text={errors.urlDeclaracionDesembarqueArmador.message} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InformeFaenaPescaForm;
