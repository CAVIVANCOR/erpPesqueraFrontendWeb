// src/components/common/IrACxPEditar.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { getCuentaPorPagarByOrdenCompraId } from "../../api/cuentasPorCobrarPagar/cuentaPorPagar";
import CuentaPorPagarForm from "../cuentaPorPagar/CuentaPorPagarForm";

/**
 * Componente reutilizable genérico para editar una Cuenta por Pagar desde cualquier módulo
 * 
 * @param {Object} props
 * @param {BigInt|Number} props.ordenCompraId - ID de la OrdenCompra (OBLIGATORIO)
 * @param {Object} props.ordenCompra - Objeto completo de OrdenCompra con todos sus datos (OBLIGATORIO)
 * @param {Array} props.empresas - Lista de empresas para el formulario (OBLIGATORIO)
 * @param {Array} props.proveedores - Lista de proveedores para el formulario (OBLIGATORIO)
 * @param {Array} props.monedas - Lista de monedas para el formulario (OBLIGATORIO)
 * @param {Array} props.estados - Lista de estados de CxP para el formulario (OBLIGATORIO)
 * @param {Array} props.periodosContables - Lista de períodos contables (OBLIGATORIO)
 * @param {Array} props.mediosPago - Lista de medios de pago (OBLIGATORIO)
 * @param {Array} props.bancos - Lista de bancos (OBLIGATORIO)
 * @param {Array} props.cuentasCorrientes - Lista de cuentas corrientes (OBLIGATORIO)
 * @param {Object} props.permisos - Permisos del usuario (opcional)
 * @param {Object} props.toast - Referencia al toast para notificaciones (opcional)
 * @param {Function} props.onCxPUpdated - Callback cuando se actualiza la CxP (opcional)
 * @param {Function} props.onGenerarAsiento - Callback para generar asiento contable (opcional)
 * @param {string} props.label - Texto personalizado del botón (opcional)
 * @param {boolean} props.showCxPId - Mostrar ID de CxP en el label (default: true)
 * @param {string} props.icon - Ícono del botón (default: "pi-pencil")
 * @param {string} props.severity - Severidad del botón (default: "warning")
 * @param {string} props.className - Clases CSS adicionales (opcional)
 * @param {boolean} props.outlined - Si el botón es outlined (default: true)
 * @param {string} props.tooltip - Tooltip del botón (opcional)
 * @param {boolean} props.disabled - Si el botón está deshabilitado (default: false)
 * @param {number} props.estadoIdMinimo - Estado mínimo para mostrar el botón (default: 39)
 */
export default function IrACxPEditar({
  ordenCompraId,
  ordenCompra,
  empresas = [],
  proveedores = [],
  monedas = [],
  estados = [],
  periodosContables = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  permisos = {},
  toast = null,
  onCxPUpdated,
  onGenerarAsiento,
  label = null,
  showCxPId = true,
  icon = "pi pi-pencil",
  severity = "warning",
  className = "",
  outlined = true,
  tooltip = null,
  disabled = false,
  estadoIdMinimo = 39,
  ...rest
}) {
  const [cxpData, setCxpData] = useState(null);
  const [loading, setLoading] = useState(!!ordenCompraId);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState(null);

  // Validar props obligatorios
  useEffect(() => {
    if (!ordenCompraId) {
      console.error("❌ IrACxPEditar: ordenCompraId es obligatorio");
    }
    if (!ordenCompra) {
      console.error("❌ IrACxPEditar: ordenCompra es obligatorio");
    }
  }, [ordenCompraId, ordenCompra]);

  useEffect(() => {
    let isMounted = true;

    const loadCxP = async () => {
      if (!ordenCompraId) {
        setCxpData(null);
        setLoading(false);
        return;
      }

      // Solo cargar CxP si el estado es >= estadoIdMinimo (APROBADO por defecto = 39)
      const estadoId = Number(ordenCompra?.estadoId || 0);
      if (estadoId < estadoIdMinimo) {
        if (isMounted) {
          setCxpData(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getCuentaPorPagarByOrdenCompraId(ordenCompraId);

        if (response && response.id) {
          setCxpData(response);
        } else {
          if (isMounted) {
            setCxpData(null);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "No se encontró la Cuenta por Pagar");
        setCxpData(null);
      } finally {
        setLoading(false);
      }
    };

    loadCxP();

    return () => {
      isMounted = false;
    };
  }, [ordenCompraId, ordenCompra?.estadoId, estadoIdMinimo]);

  const handleClick = () => {
    if (cxpData) {
      setShowDialog(true);
    } else if (toast) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin CxP",
        detail: error || "No se encontró una Cuenta por Pagar asociada a esta OrdenCompra",
        life: 3000,
      });
    }
  };

  const handleSubmit = async (formData) => {
    setShowDialog(false);

    if (onCxPUpdated && typeof onCxPUpdated === "function") {
      onCxPUpdated(formData);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  // Determinar el label del botón
  const getButtonLabel = () => {
    if (loading) return "Cargando CxP...";
    if (cxpData?.id) return `Ir a CxP: ID ${cxpData.id}`;
    return "Ir a CxP";
  };

  return (
    <>
      <Button
        type="button"
        label={getButtonLabel()}
        icon={icon}
        severity={severity}
        outlined={outlined}
        onClick={handleClick}
        className={className}
        tooltip={tooltip || (cxpData ? `Editar Cuenta por Pagar ID ${cxpData.id}` : "Cargando...")}
        tooltipOptions={{ position: "top" }}
        loading={loading}
        disabled={loading}
        {...rest}
      />

      <Dialog
        header={
          <div>
            <i className="pi pi-money-bill" style={{ marginRight: "0.5rem" }} />
            {cxpData ? `Editar Cuenta por Pagar #${cxpData.id}` : "Cuenta por Pagar"}
          </div>
        }
        visible={showDialog}
        style={{ width: "95vw", maxWidth: "1400px" }}
        onHide={handleCancel}
        modal
        maximizable
        blockScroll
      >
        {cxpData && (
          <CuentaPorPagarForm
            isEdit={true}
            defaultValues={{
              ...cxpData,
              // Asegurar que las fechas sean objetos Date
              fechaEmision: cxpData.fechaEmision ? new Date(cxpData.fechaEmision) : null,
              fechaVencimiento: cxpData.fechaVencimiento ? new Date(cxpData.fechaVencimiento) : null,
              fechaContable: cxpData.fechaContable ? new Date(cxpData.fechaContable) : null,
            }}
            empresas={empresas}
            proveedores={proveedores}
            monedas={monedas}
            estados={estados}
            periodosContables={periodosContables}
            mediosPago={mediosPago}
            bancos={bancos}
            cuentasCorrientes={cuentasCorrientes}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onGenerarAsiento={onGenerarAsiento}
            onSaveSuccess={handleSubmit}
            loading={false}
            readOnly={false}
            permisos={permisos}
            toast={toast}
          />
        )}
      </Dialog>
    </>
  );
}