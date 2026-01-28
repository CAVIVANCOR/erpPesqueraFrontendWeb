/**
 * InformeFaenaPescaConsumoForm.jsx - MIGRADO a Sistema PDF V2
 *
 * Componente para mostrar y editar el informe de faena de pesca consumo.
 * Usa PDFDocumentManager para gestionar el informe de faena.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const InformeFaenaPescaConsumoForm = ({
  control,
  watch,
  errors,
  setValue,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  return (
    <div className="card">
      <div className="p-3">
        <h3 className="text-900 font-bold mb-3">Informe de Faena de Pesca Consumo</h3>
        
        <PDFDocumentManager
          moduleName="faena-pesca-consumo"
          fieldName="urlInformeFaena"
          title="Informe de Faena"
          dialogTitle="Subir Informe de Faena"
          uploadButtonLabel="Capturar/Subir Informe"
          viewButtonLabel="Ver"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay informe de faena cargado"
          emptyDescription="Use el botón 'Capturar/Subir Informe' para agregar el informe de faena de pesca consumo. Puede subir múltiples archivos (informe + anexos) y se consolidarán automáticamente."
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default InformeFaenaPescaConsumoForm;