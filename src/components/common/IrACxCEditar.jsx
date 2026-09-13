// src/components/common/IrACxCEditar.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { getCuentaPorCobrarByPreFacturaId } from "../../api/cuentasPorCobrarPagar/cuentaPorCobrar";
import CuentaPorCobrarForm from "../cuentaPorCobrar/CuentaPorCobrarForm";
import { ESTADO_PREFACTURA } from "../../utils/estados.constants";

/**
 * Componente reutilizable genérico para editar una Cuenta por Cobrar desde cualquier módulo
 * 
 * @param {Object} props
 * @param {BigInt|Number} props.preFacturaId - ID de la PreFactura (OBLIGATORIO)
 * @param {Object} props.preFactura - Objeto completo de PreFactura con todos sus datos (OBLIGATORIO)
 * @param {Array} props.empresas - Lista de empresas para el formulario (OBLIGATORIO)
 * @param {Array} props.clientes - Lista de clientes para el formulario (OBLIGATORIO)
 * @param {Array} props.monedas - Lista de monedas para el formulario (OBLIGATORIO)
 * @param {Array} props.estados - Lista de estados de CxC para el formulario (OBLIGATORIO)
 * @param {Array} props.periodosContables - Lista de períodos contables (OBLIGATORIO)
 * @param {Array} props.mediosPago - Lista de medios de pago (OBLIGATORIO)
 * @param {Array} props.bancos - Lista de bancos (OBLIGATORIO)
 * @param {Array} props.cuentasCorrientes - Lista de cuentas corrientes (OBLIGATORIO)
 * @param {Object} props.permisos - Permisos del usuario (opcional)
 * @param {Object} props.toast - Referencia al toast para notificaciones (opcional)
 * @param {Function} props.onCxCUpdated - Callback cuando se actualiza la CxC (opcional)
 * @param {Function} props.onGenerarAsiento - Callback para generar asiento contable (opcional)
 * @param {string} props.label - Texto personalizado del botón (opcional)
 * @param {boolean} props.showCxCId - Mostrar ID de CxC en el label (default: true)
 * @param {string} props.icon - Ícono del botón (default: "pi-pencil")
 * @param {string} props.severity - Severidad del botón (default: "info")
 * @param {string} props.className - Clases CSS adicionales (opcional)
 * @param {boolean} props.outlined - Si el botón es outlined (default: true)
 * @param {string} props.tooltip - Tooltip del botón (opcional)
 * @param {boolean} props.disabled - Si el botón está deshabilitado (default: false)
 * @param {number} props.estadoIdMinimo - Estado mínimo para mostrar el botón (default: 48)
 */
export default function IrACxCEditar({
  preFacturaId,
  preFactura,
  empresas = [],
  clientes = [],
  monedas = [],
  estados = [],
  periodosContables = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  permisos = {},
  toast = null,
  onCxCUpdated,
  onGenerarAsiento,
  label = null,
  showCxCId = true,
  icon = "pi pi-pencil",
  severity = "info",
  className = "",
  outlined = true,
  tooltip = null,
  disabled = false,
  estadoIdMinimo = 48,
  compact = false,
  ...rest
}) {
  const [cxcData, setCxcData] = useState(null);
  const [loading, setLoading] = useState(!!preFacturaId);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState(null);

  // Validar props obligatorios
  useEffect(() => {
    if (!preFacturaId) {
      console.error("❌ IrACxCEditar: preFacturaId es obligatorio");
    }
    if (!preFactura) {
      console.error("❌ IrACxCEditar: preFactura es obligatorio");
    }
  }, [preFacturaId, preFactura]);


  useEffect(() => {
    let isMounted = true;

    const loadCxC = async () => {

      if (!preFacturaId) {
        setCxcData(null);
        setLoading(false);
        return;
      }

      // ⭐ Solo cargar CxC si el estado NO es PENDIENTE
      const estadoId = Number(preFactura?.estadoId || 0);
      if (estadoId === ESTADO_PREFACTURA.PENDIENTE) {
        if (isMounted) {
          setCxcData(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getCuentaPorCobrarByPreFacturaId(preFacturaId);

        if (response && response.id) {
          setCxcData(response);
        } else {
          if (isMounted) {
            setCxcData(null);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "No se encontró la Cuenta por Cobrar");
        setCxcData(null);
      } finally {
        setLoading(false);
      }
    };

    loadCxC();

    return () => {
      isMounted = false;
    };
  }, [preFacturaId, preFactura?.estadoId]);

  const handleClick = () => {
    if (cxcData) {
      setShowDialog(true);
    } else if (toast) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin CxC",
        detail: error || "No se encontró una Cuenta por Cobrar asociada a esta PreFactura",
        life: 3000,
      });
    }
  };

  const handleSubmit = async (formData) => {
    setShowDialog(false);

    if (onCxCUpdated && typeof onCxCUpdated === "function") {
      onCxCUpdated(formData);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  // Determinar el label del botón
  const getButtonLabel = () => {
    if (loading) return "Cargando CxC...";
    if (cxcData?.id) return `Ir a CxC: ID ${cxcData.id}`;
    return "Ir a CxC";
  };

  const renderCompactMode = () => (
    <Button
      type="button"
      label={getButtonLabel()}
      icon={icon}
      severity={severity}
      outlined={outlined}
      onClick={handleClick}
      className={className}
      tooltip={tooltip || (cxcData ? `Editar Cuenta por Cobrar ID ${cxcData.id}` : "Cargando...")}
      tooltipOptions={{ position: "top" }}
      loading={loading}
      disabled={loading}
      {...rest}
    />
  );

  const renderExpandedMode = () => {
    if (loading) {
      return <div style={{ padding: '1rem', textAlign: 'center' }}>Cargando CxC...</div>;
    }

    if (!cxcData) {
      return null;
    }

    const formatearNumero = (num) => {
      return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
    };

    const formatearFecha = (fecha) => {
      if (!fecha) return '-';
      return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const moneda = monedas?.find(m => m.id === cxcData.monedaId);
    const simboloMoneda = moneda?.simbolo || 'S/.';

    return (
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.5rem',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backgroundColor: '#fff'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
      >
        <div style={{ flex: 1, backgroundColor: '#cfe2ff', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #b6d4fe' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Cliente</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cxcData.cliente?.razonSocial || '-'}</div>
        </div>
        <div style={{ flex: 0.6, backgroundColor: '#d1ecf1', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #bee5eb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>F.Emisión</div>
          <div>{formatearFecha(cxcData.fechaEmision)}</div>
        </div>
        <div style={{ flex: 0.6, backgroundColor: '#fff3cd', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #ffeaa7' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>F.Venc</div>
          <div>{formatearFecha(cxcData.fechaVencimiento)}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#f8d7da', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #f5c6cb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Producto</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cxcData.preFactura?.tipoProducto?.nombre || 'N/A'}</div>
        </div>
        <div style={{ flex: 0.8, backgroundColor: '#e0cffc', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #d4b9e8' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>
            {cxcData.tieneDetraccion ? 'Detracción' : cxcData.tieneRetencion ? 'Retención' : cxcData.tienePercepcion ? 'Percepción' : 'Sin Impuesto'}
          </div>
          <div>{simboloMoneda} {formatearNumero(cxcData.montoDetraccionTotal || cxcData.montoRetencionTotal || cxcData.montoPercepcionTotal || 0)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#e7d6f5', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #d4b9e8' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Total</div>
          <div>{simboloMoneda} {formatearNumero(cxcData.montoTotal)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#d1e7dd', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #badbcc' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Pagado</div>
          <div>{simboloMoneda} {formatearNumero(cxcData.montoPagado)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#f8d7da', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #f5c6cb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Saldo</div>
          <div>{simboloMoneda} {formatearNumero(cxcData.saldoPendiente)}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      {compact ? renderCompactMode() : renderExpandedMode()}

      <Dialog
        header={
          <div>
            <i className="pi pi-money-bill" style={{ marginRight: "0.5rem" }} />
            {cxcData ? `Editar Cuenta por Cobrar #${cxcData.id}` : "Cuenta por Cobrar"}
          </div>
        }
        visible={showDialog}
        style={{ width: "95vw", maxWidth: "1400px" }}
        onHide={handleCancel}
        modal
        maximizable
        blockScroll
      >
        {cxcData && (
          <CuentaPorCobrarForm
            isEdit={true}
            defaultValues={{
              ...cxcData,
              // Asegurar que las fechas sean objetos Date
              fechaEmision: cxcData.fechaEmision ? new Date(cxcData.fechaEmision) : null,
              fechaVencimiento: cxcData.fechaVencimiento ? new Date(cxcData.fechaVencimiento) : null,
              fechaContable: cxcData.fechaContable ? new Date(cxcData.fechaContable) : null,
            }}
            empresas={empresas}
            clientes={clientes}
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