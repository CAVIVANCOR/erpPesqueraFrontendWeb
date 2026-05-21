/**
 * InformeFaenaPescaConsumoForm.jsx - MIGRADO a Sistema PDF V2 con Generación
 *
 * Componente para generar y mostrar el informe de faena de pesca consumo.
 * Usa VerImpresionInformeFaenaPDF para gestionar la generación del PDF.
 *
 * @author ERP Megui
 * @version 3.0.0 - Sistema PDF V2 con Generación
 */

import React from "react";
import VerImpresionInformeFaenaPDF from "./VerImpresionInformeFaenaPDF";

const InformeFaenaPescaConsumoForm = ({
  control,
  watch,
  errors,
  setValue,
  getValues,
  defaultValues = {},
  readOnly = false,
  faenaData,
}) => {
  const faenaId = watch("id") || defaultValues.id || faenaData?.id;

  return (
    <div className="card">
      <div className="p-3">
        <h3 className="text-900 font-bold mb-3">Informe de Faena de Pesca Consumo</h3>
        
        <VerImpresionInformeFaenaPDF
          faenaId={faenaId}
          datosFaena={faenaData || defaultValues}
          toast={{ current: null }}
          onPdfGenerated={(url) => {
            if (setValue) {
              setValue("urlInformeFaena", url);
            }
          }}
          onRecargarRegistro={null}
        />
      </div>
    </div>
  );
};

export default InformeFaenaPescaConsumoForm;