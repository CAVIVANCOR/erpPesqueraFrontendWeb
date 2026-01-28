/**
 * InformeFaenaPescaForm.jsx - MIGRADO a Sistema PDF V2
 *
 * Componente para mostrar y editar el informe de faena de pesca.
 * Usa PDFDocumentManager para gestionar dos PDFs distintos en TabView.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import { TabView, TabPanel } from "primereact/tabview";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const InformeFaenaPescaForm = ({
  control,
  watch,
  errors,
  setValue,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  const faenaId = watch('id') || defaultValues.id;

  return (
    <div className="card">
      <TabView>
        <TabPanel header="Reporte Faena Calas" leftIcon="pi pi-file-pdf mr-2">
          <div className="p-3">
            <PDFDocumentManager
              moduleName="faena-pesca-reporte-calas"
              fieldName="urlReporteFaenaCalas"
              title="Reporte de Faena Calas"
              dialogTitle="Subir Reporte de Faena Calas"
              uploadButtonLabel="Capturar/Subir Reporte"
              viewButtonLabel="Ver"
              downloadButtonLabel="Descargar"
              emptyMessage="No hay reporte de faena calas cargado"
              emptyDescription="Use el botón 'Capturar/Subir Reporte' para agregar el reporte de faena. Puede subir múltiples archivos (reporte + anexos) y se consolidarán automáticamente."
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              defaultValues={defaultValues}
              entityId={faenaId}
              readOnly={readOnly}
            />
          </div>
        </TabPanel>

        <TabPanel header="Declaración Desembarque" leftIcon="pi pi-file-word mr-2">
          <div className="p-3">
            <PDFDocumentManager
              moduleName="faena-pesca-declaracion-desembarque"
              fieldName="urlDeclaracionDesembarqueArmador"
              title="Declaración de Desembarque del Armador"
              dialogTitle="Subir Declaración de Desembarque"
              uploadButtonLabel="Capturar/Subir Declaración"
              viewButtonLabel="Ver"
              downloadButtonLabel="Descargar"
              emptyMessage="No hay declaración de desembarque cargada"
              emptyDescription="Use el botón 'Capturar/Subir Declaración' para agregar la declaración del armador. Puede subir múltiples archivos y se consolidarán automáticamente."
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              defaultValues={defaultValues}
              entityId={faenaId}
              readOnly={readOnly}
            />
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};

export default InformeFaenaPescaForm;