// src/components/common/CardAsientoContable.jsx
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import AsientoContableViewer from "./AsientoContableViewer";
import AsientoContableEditor from "./AsientoContableEditor";
import { getAsientoContableById } from "../../api/contabilidad/asientoContable";

/**
 * Componente genérico para mostrar el Card de Asiento Contable
 * con botones de Generar/Regenerar/Editar
 * 
 * @param {Object} props
 * @param {BigInt|number} props.asientoContableId - ID del asiento contable
 * @param {Function} props.onGenerarAsiento - Callback para generar/regenerar asiento
 * @param {boolean} props.disabled - Deshabilitar botones
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.tituloCard - Título del card (default: "Asiento Contable")
 */
const CardAsientoContable = ({
  asientoContableId,
  onGenerarAsiento,
  disabled = false,
  loading = false,
  tituloCard = "Asiento Contable",
}) => {
  const [dialogEditar, setDialogEditar] = useState(false);
  const [asientoParaEditar, setAsientoParaEditar] = useState(null);
  const [loadingAsiento, setLoadingAsiento] = useState(false);

  const handleEditarAsiento = async () => {
    if (!asientoContableId) return;
    
    try {
      setLoadingAsiento(true);
      const asientoCompleto = await getAsientoContableById(asientoContableId);
      setAsientoParaEditar(asientoCompleto);
      setDialogEditar(true);
    } catch (error) {
      console.error("Error al cargar asiento para editar:", error);
    } finally {
      setLoadingAsiento(false);
    }
  };

  const handleGuardarEdicion = (asientoEditado) => {
    // Aquí llamarías a la API para actualizar el asiento
    setDialogEditar(false);
  };

  const cardHeader = (
    <div className="flex justify-content-between align-items-center">
      <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#495057" }}>
        {tituloCard}
      </span>
      <div className="flex gap-2">
        <Button
          label={asientoContableId ? "Regenerar Asiento" : "Generar Asiento"}
          icon={asientoContableId ? "pi pi-refresh" : "pi pi-plus-circle"}
          onClick={onGenerarAsiento}
          disabled={disabled || loading}
          loading={loading}
          severity="help"
          size="small"
          raised
          tooltip={
            asientoContableId
              ? "Eliminar y regenerar el asiento contable"
              : "Generar asiento contable automáticamente"
          }
          tooltipOptions={{ position: "top" }}
        />
        {asientoContableId && (
          <Button
            label="Editar"
            icon="pi pi-pencil"
            onClick={handleEditarAsiento}
            disabled={disabled || loading || loadingAsiento}
            loading={loadingAsiento}
            severity="warning"
            size="small"
            outlined
            tooltip="Editar asiento contable"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <Card
        header={cardHeader}
        style={{
          marginTop: 20,
          border: "2px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          borderRadius: "8px",
        }}
      >
        {asientoContableId ? (
          <AsientoContableViewer
            asientoContableId={asientoContableId}
            showHeader={false}
          />
        ) : (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#6b7280",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "2px dashed #d1d5db",
            }}
          >
            <i
              className="pi pi-book"
              style={{
                fontSize: "3rem",
                marginBottom: "15px",
                color: "#9ca3af",
                display: "block",
              }}
            ></i>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              No se ha generado un asiento contable
            </p>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Haga clic en <strong>"Generar Asiento"</strong> para crear el
              asiento contable automáticamente
            </p>
          </div>
        )}
      </Card>

      {/* Dialog para editar asiento */}
      <Dialog
        header="Editar Asiento Contable"
        visible={dialogEditar}
        style={{ width: "90vw", maxWidth: "1200px" }}
        modal
        onHide={() => {
          setDialogEditar(false);
          setAsientoParaEditar(null);
        }}
        maximizable
      >
        {asientoParaEditar ? (
          <AsientoContableEditor
            borradorAsiento={asientoParaEditar}
            onGuardar={handleGuardarEdicion}
            onCancelar={() => {
              setDialogEditar(false);
              setAsientoParaEditar(null);
            }}
            loading={loading}
          />
        ) : (
          <div className="flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default CardAsientoContable;
