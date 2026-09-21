// src/components/common/IrACxPEditar.jsx
import React, { useState, useContext, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { getCuentaPorPagarByOrdenCompraId } from "../../api/cuentasPorCobrarPagar/cuentaPorPagar";
import CuentaPorPagarForm from "../cuentaPorPagar/CuentaPorPagarForm";
import { ModuloContext } from "../../context/ModuloContext";
import { ESTADO_ORDEN_COMPRA } from "../../utils/estados.constants";

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
  compact = false,
  ...rest
}) {
  const { abrirModulo } = useContext(ModuloContext);
  const [cxpData, setCxpData] = useState(null);
  const [loading, setLoading] = useState(!!ordenCompraId);
  const [showDialog, setShowDialog] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
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

      // Solo cargar CxP si el estado NO es PENDIENTE
      const estadoId = Number(ordenCompra?.estadoId || 0);
      if (estadoId === ESTADO_ORDEN_COMPRA.PENDIENTE) {
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
      setShowSelectionDialog(true);
    } else if (toast) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin CxP",
        detail: error || "No se encontró una Cuenta por Pagar asociada a esta OrdenCompra",
        life: 3000,
      });
    }
  };

  const handleOpcionA = () => {
    setShowSelectionDialog(false);
    setShowDialog(true);
  };

  const handleOpcionB = () => {
    setShowSelectionDialog(false);
    if (abrirModulo && ordenCompra?.proveedorId) {
      abrirModulo('cuentaPorPagar', 'Cuentas por Pagar', {
        proveedorId: ordenCompra.proveedorId,
        proveedorNombre: ordenCompra.proveedor?.nombre || 'Proveedor',
        soloPendientes: true,
        highlightId: cxpData?.id
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

  const renderCompactMode = () => (
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
  );

  const renderExpandedMode = () => {
    if (loading) {
      return <div style={{ padding: '1rem', textAlign: 'center' }}>Cargando CxP...</div>;
    }

    if (!cxpData) {
      return null;
    }

    const formatearNumero = (num) => {
      return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
    };

    const formatearFecha = (fecha) => {
      if (!fecha) return '-';
      return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const moneda = monedas?.find(m => m.id === cxpData.monedaId);
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
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Proveedor</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cxpData.proveedor?.razonSocial || '-'}</div>
        </div>
        <div style={{ flex: 0.6, backgroundColor: '#d1ecf1', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #bee5eb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>F.Emisión</div>
          <div>{formatearFecha(cxpData.fechaEmision)}</div>
        </div>
        <div style={{ flex: 0.6, backgroundColor: '#fff3cd', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #ffeaa7' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>F.Venc</div>
          <div>{formatearFecha(cxpData.fechaVencimiento)}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#f8d7da', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #f5c6cb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Producto</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cxpData.ordenCompra?.detalles?.[0]?.producto?.descripcionArmada || 
             cxpData.ordenCompra?.detalles?.[0]?.producto?.descripcionBase || 
             cxpData.ordenCompra?.detalles?.[0]?.producto?.nombre || 
             'N/A'}
          </div>
        </div>
        <div style={{ flex: 0.8, backgroundColor: '#e0cffc', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #d4b9e8' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>
            {cxpData.tieneDetraccion ? 'Detracción' : cxpData.tieneRetencion ? 'Retención' : cxpData.tienePercepcion ? 'Percepción' : 'Sin Impuesto'}
          </div>
          <div>
            {/* ✅ Detracción SIEMPRE en SOLES */}
            {cxpData.tieneDetraccion ? 'S/.' : simboloMoneda} {formatearNumero(cxpData.montoDetraccionTotal || cxpData.montoRetencionTotal || cxpData.montoPercepcionTotal || 0)}
          </div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#e7d6f5', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #d4b9e8' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Total</div>
          <div>{simboloMoneda} {formatearNumero(cxpData.montoTotal)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#d1e7dd', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #badbcc' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Pagado</div>
          <div>{simboloMoneda} {formatearNumero(cxpData.montoPagado)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#f8d7da', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #f5c6cb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Saldo</div>
          <div>{simboloMoneda} {formatearNumero(cxpData.saldoPendiente)}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      {compact ? renderCompactMode() : renderExpandedMode()}

      <Dialog
        header="¿Qué deseas consultar?"
        visible={showSelectionDialog}
        style={{ width: "600px" }}
        onHide={() => setShowSelectionDialog(false)}
        modal
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "10px" }}>
          <Button
            label={`📄 Editar CxP de este Documento (ID: ${cxpData?.id || ''})`}
            icon="pi pi-pencil"
            severity="warning"
            outlined
            onClick={handleOpcionA}
            style={{ padding: "15px", justifyContent: "flex-start", textAlign: "left" }}
          />
          <div style={{ fontSize: "0.85rem", color: "#666", marginLeft: "10px", marginTop: "-10px" }}>
            Monto: {cxpData?.moneda?.simbolo || 'S/'} {Number(cxpData?.montoTotal || 0).toFixed(2)} |
            Saldo: {cxpData?.moneda?.simbolo || 'S/'} {Number(cxpData?.saldoPendiente || 0).toFixed(2)}
          </div>

          <Button
            label={`📋 Ver Cuenta Corriente del Proveedor`}
            icon="pi pi-list"
            severity="info"
            outlined
            onClick={handleOpcionB}
            style={{ padding: "15px", justifyContent: "flex-start", textAlign: "left" }}
          />
          <div style={{ fontSize: "0.85rem", color: "#666", marginLeft: "10px", marginTop: "-10px" }}>
            Proveedor: {ordenCompra?.proveedor?.nombre || 'N/A'} | Solo CxP pendientes
          </div>
        </div>
      </Dialog>

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