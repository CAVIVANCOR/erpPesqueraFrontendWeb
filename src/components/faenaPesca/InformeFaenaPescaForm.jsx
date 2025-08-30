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
import { InputText } from "primereact/inputtext";

const InformeFaenaPescaForm = ({
  urlInformeFaena,
  setUrlInformeFaena,
  loading = false,
}) => {
  return (
    <div className="card">
      <div className="field">
        <label htmlFor="urlInformeFaena">URL Informe Faena</label>
        <InputText
          id="urlInformeFaena"
          value={urlInformeFaena}
          onChange={(e) => setUrlInformeFaena(e.target.value)}
          disabled={loading}
          style={{ fontWeight: "bold" }}
          placeholder="URL del informe de faena"
        />
      </div>
    </div>
  );
};

export default InformeFaenaPescaForm;
