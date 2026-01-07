// src/components/comprobanteElectronico/AccionesSunatComprobante.jsx
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { confirmDialog } from "primereact/confirmdialog";
import {
  enviarComprobanteASunat,
  consultarComprobanteEnSunat,
  anularComprobante,
  consultarAnulacion,
} from "../../api/facturacionElectronica/comprobanteElectronico";

/**
 * Componente de acciones SUNAT para comprobantes electrónicos
 * Permite enviar, consultar, anular comprobantes
 */
const AccionesSunatComprobante = ({ comprobante, toast, onAccionCompletada, permisos }) => {
  const [loading, setLoading] = useState(false);
  const [showAnularDialog, setShowAnularDialog] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");

  const handleEnviarASunat = async () => {
    if (!permisos.puedeEditar) {
      toast?.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para enviar comprobantes",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de enviar el comprobante ${comprobante.numeroCompleto} a SUNAT?`,
      header: "Confirmar Envío a SUNAT",
      icon: "pi pi-send",
      acceptLabel: "Enviar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          setLoading(true);
          const resultado = await enviarComprobanteASunat(comprobante.id);
          
          toast?.current?.show({
            severity: resultado.respuestaNubefact?.aceptado_por_sunat ? "success" : "warn",
            summary: resultado.respuestaNubefact?.aceptado_por_sunat ? "Éxito" : "Advertencia",
            detail: resultado.respuestaNubefact?.sunat_description || "Comprobante enviado a SUNAT",
            life: 5000,
          });

          if (onAccionCompletada) {
            onAccionCompletada();
          }
        } catch (error) {
          console.error("Error al enviar a SUNAT:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.error || "No se pudo enviar el comprobante a SUNAT",
            life: 5000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleConsultarEstado = async () => {
    try {
      setLoading(true);
      const resultado = await consultarComprobanteEnSunat(comprobante.id);
      
      toast?.current?.show({
        severity: "info",
        summary: "Estado en SUNAT",
        detail: resultado.estadoSunat?.sunat_description || "Consulta realizada",
        life: 5000,
      });

      if (onAccionCompletada) {
        onAccionCompletada();
      }
    } catch (error) {
      console.error("Error al consultar estado:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "No se pudo consultar el estado",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe ingresar un motivo de anulación",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const resultado = await anularComprobante(comprobante.id, motivoAnulacion);
      
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Solicitud de anulación enviada a SUNAT",
        life: 5000,
      });

      setShowAnularDialog(false);
      setMotivoAnulacion("");

      if (onAccionCompletada) {
        onAccionCompletada();
      }
    } catch (error) {
      console.error("Error al anular comprobante:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "No se pudo anular el comprobante",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoAnulacion = () => {
    if (!permisos.puedeEliminar) {
      toast?.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para anular comprobantes",
        life: 3000,
      });
      return;
    }

    if (!comprobante.nubefactAceptadoPorSunat) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Solo se pueden anular comprobantes aceptados por SUNAT",
        life: 3000,
      });
      return;
    }

    setMotivoAnulacion("");
    setShowAnularDialog(true);
  };

  return (
    <>
      {/* Botón Enviar a SUNAT */}
      {!comprobante.fechaEnvioOSE && (
        <Button
          icon="pi pi-send"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={handleEnviarASunat}
          loading={loading}
          disabled={!permisos.puedeEditar}
          tooltip="Enviar a SUNAT"
        />
      )}

      {/* Botón Consultar Estado */}
      {comprobante.fechaEnvioOSE && (
        <Button
          icon="pi pi-search"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={handleConsultarEstado}
          loading={loading}
          tooltip="Consultar Estado en SUNAT"
        />
      )}

      {/* Botón Anular */}
      {comprobante.nubefactAceptadoPorSunat && (
        <Button
          icon="pi pi-ban"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={abrirDialogoAnulacion}
          loading={loading}
          disabled={!permisos.puedeEliminar}
          tooltip="Anular Comprobante"
        />
      )}

      {/* Dialog de Anulación */}
      <Dialog
        header="Anular Comprobante Electrónico"
        visible={showAnularDialog}
        style={{ width: "450px" }}
        onHide={() => setShowAnularDialog(false)}
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowAnularDialog(false)}
              disabled={loading}
            />
            <Button
              label="Anular"
              icon="pi pi-check"
              className="p-button-danger"
              onClick={handleAnular}
              loading={loading}
              disabled={!motivoAnulacion.trim()}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="motivo">Motivo de Anulación *</label>
            <InputTextarea
              id="motivo"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              rows={4}
              placeholder="Ingrese el motivo de la anulación"
              disabled={loading}
              maxLength={200}
            />
            <small className="text-gray-600">
              Máximo 200 caracteres. Este motivo será enviado a SUNAT.
            </small>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default AccionesSunatComprobante;