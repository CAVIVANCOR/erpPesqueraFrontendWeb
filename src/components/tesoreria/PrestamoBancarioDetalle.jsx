// src/components/tesoreria/PrestamoBancarioDetalle.jsx
import React, { useState, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import PrestamoBancarioForm from "./PrestamoBancarioForm";
import DocPrestamoPrincipal from "./DocPrestamoPrincipal";
import DocPrestamoAdicional from "./DocPrestamoAdicional";

export default function PrestamoBancarioDetalle({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prestamoData, setPrestamoData] = useState(defaultValues);
  const formRef = useRef(null);

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    setPrestamoData(data);
  };

  const handleDocumentoPrincipalActualizado = (urlDoc) => {
    setPrestamoData((prev) => ({
      ...prev,
      urlDocumentoPDF: urlDoc,
    }));
  };

  const handleDocumentoAdicionalActualizado = (urlDoc) => {
    setPrestamoData((prev) => ({
      ...prev,
      urlDocAdicionalPDF: urlDoc,
    }));
  };

  return (
    <div>
      <TabView
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      >
        {/* Tab 1: Datos Generales */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <PrestamoBancarioForm
            ref={formRef}
            isEdit={isEdit}
            defaultValues={prestamoData}
            onSubmit={handleFormSubmit}
            onCancel={onCancel}
            loading={loading}
            readOnly={readOnly}
            hideButtons={true}
          />
        </TabPanel>

        {/* Tab 2: Documento Principal */}
        {isEdit && prestamoData?.id && (
          <TabPanel
            header="Documento Principal"
            leftIcon="pi pi-file-pdf"
          >
            <DocPrestamoPrincipal
              prestamoId={prestamoData.id}
              documentoActual={prestamoData.urlDocumentoPDF}
              readOnly={readOnly}
              onDocumentoActualizado={handleDocumentoPrincipalActualizado}
            />
          </TabPanel>
        )}

        {/* Tab 3: Documentación Adicional */}
        {isEdit && prestamoData?.id && (
          <TabPanel
            header="Documentación Adicional"
            leftIcon="pi pi-paperclip"
          >
            <DocPrestamoAdicional
              prestamoId={prestamoData.id}
              documentoActual={prestamoData.urlDocAdicionalPDF}
              readOnly={readOnly}
              onDocumentoActualizado={handleDocumentoAdicionalActualizado}
            />
          </TabPanel>
        )}
      </TabView>

      {/* Botones de acción - Visibles en todos los tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20,
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          onClick={onCancel}
          className="p-button-secondary"
          disabled={loading}
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          onClick={() => {
            // Trigger submit del formulario si estamos en el tab de Datos Generales
            if (activeIndex === 0 && formRef.current) {
              formRef.current.submitForm();
            }
          }}
          disabled={loading || readOnly || activeIndex !== 0}
          loading={loading}
          tooltip={activeIndex !== 0 ? "Solo se puede guardar desde el tab Datos Generales" : ""}
        />
      </div>
    </div>
  );
}