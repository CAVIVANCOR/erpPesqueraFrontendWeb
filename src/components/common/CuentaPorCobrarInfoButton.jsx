// src/components/common/CuentaPorCobrarInfoButton.jsx
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import CuentaPorCobrarForm from "../cuentaPorCobrar/CuentaPorCobrarForm";

/**
 * Componente reutilizable para mostrar información resumida de una CxC
 * con botón que abre diálogo completo en modo lectura
 * 
 * @param {Object} props
 * @param {Object} props.cuentaPorCobrar - Objeto de Cuenta por Cobrar (OBLIGATORIO)
 * @param {Array} props.monedas - Lista de monedas (OBLIGATORIO)
 * @param {Array} props.empresas - Lista de empresas para el formulario (OBLIGATORIO)
 * @param {Array} props.clientes - Lista de clientes para el formulario (OBLIGATORIO)
 * @param {Array} props.estados - Lista de estados de CxC (OBLIGATORIO)
 * @param {Array} props.periodosContables - Lista de períodos contables (OBLIGATORIO)
 * @param {Array} props.mediosPago - Lista de medios de pago (OBLIGATORIO)
 * @param {Array} props.bancos - Lista de bancos (OBLIGATORIO)
 * @param {Array} props.cuentasCorrientes - Lista de cuentas corrientes (OBLIGATORIO)
 * @param {Object} props.toast - Referencia al toast (opcional)
 * @param {string} props.buttonLabel - Label personalizado del botón (opcional)
 * @param {string} props.buttonIcon - Ícono del botón (default: "pi-info-circle")
 * @param {string} props.buttonSeverity - Severidad del botón (default: "info")
 * @param {boolean} props.outlined - Si el botón es outlined (default: true)
 */
export default function CuentaPorCobrarInfoButton({
  cuentaPorCobrar,
  monedas = [],
  empresas = [],
  clientes = [],
  estados = [],
  periodosContables = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  toast = null,
  buttonLabel = null,
  buttonIcon = "pi pi-info-circle",
  buttonSeverity = "info",
  outlined = true,
}) {
  const [showDialog, setShowDialog] = useState(false);

  if (!cuentaPorCobrar) return null;

  const moneda = monedas.find(m => Number(m.id) === Number(cuentaPorCobrar.monedaId));
  const simboloMoneda = moneda?.simbolo || '';

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  // Label del botón con información resumida
  const getButtonContent = () => {
    if (buttonLabel) return buttonLabel;
    
    const saldoPendiente = Number(cuentaPorCobrar.saldoPendiente || 0);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
        <span style={{ fontWeight: "600" }}>
          {cuentaPorCobrar.numeroPreFactura || 'N/A'}
        </span>
        <Tag 
          value={`Saldo: ${simboloMoneda} ${saldoPendiente.toFixed(2)}`}
          severity={saldoPendiente > 0 ? "warning" : "success"}
          style={{ marginLeft: "auto" }}
        />
      </div>
    );
  };

  return (
    <>
      {/* Botón con información resumida */}
      <Button
        type="button"
        label={typeof buttonLabel === 'string' ? buttonLabel : null}
        icon={buttonIcon}
        severity={buttonSeverity}
        outlined={outlined}
        onClick={handleOpenDialog}
        tooltip="Ver detalles de la Cuenta por Cobrar"
        tooltipOptions={{ position: "top" }}
        style={{ 
          width: "100%", 
          justifyContent: "flex-start",
          fontWeight: "bold"
        }}
      >
        {!buttonLabel && getButtonContent()}
      </Button>

      {/* Diálogo con formulario en modo lectura */}
      <Dialog
        header={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="pi pi-money-bill" />
            <span>Cuenta por Cobrar #{cuentaPorCobrar.id}</span>
            <Tag 
              value={cuentaPorCobrar.numeroPreFactura || 'N/A'}
              severity="info"
            />
          </div>
        }
        visible={showDialog}
        style={{ width: "95vw", maxWidth: "1400px" }}
        onHide={handleCloseDialog}
        modal
        maximizable
        blockScroll
      >
        <CuentaPorCobrarForm
          isEdit={true}
          defaultValues={{
            ...cuentaPorCobrar,
            fechaEmision: cuentaPorCobrar.fechaEmision ? new Date(cuentaPorCobrar.fechaEmision) : null,
            fechaVencimiento: cuentaPorCobrar.fechaVencimiento ? new Date(cuentaPorCobrar.fechaVencimiento) : null,
            fechaContable: cuentaPorCobrar.fechaContable ? new Date(cuentaPorCobrar.fechaContable) : null,
          }}
          empresas={empresas}
          clientes={clientes}
          monedas={monedas}
          estados={estados}
          periodosContables={periodosContables}
          mediosPago={mediosPago}
          bancos={bancos}
          cuentasCorrientes={cuentasCorrientes}
          onSubmit={() => {}} // No hacer nada en modo lectura
          onCancel={handleCloseDialog}
          loading={false}
          readOnly={true} // ⭐ MODO SOLO LECTURA
          permisos={{}}
          toast={toast}
        />
      </Dialog>
    </>
  );
}