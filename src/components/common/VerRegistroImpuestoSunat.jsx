// src/components/common/VerRegistroImpuestoSunat.jsx
import React, { useState } from "react";
import { Dialog } from 'primereact/dialog';
import DetraccionForm from '../detraccion/DetraccionForm';
import RetencionForm from '../retencion/RetencionForm';
import PercepcionForm from '../percepcion/PercepcionForm';

export default function VerRegistroImpuestoSunat({
  registro,
  tipo,
  monedas = [],
  tiposDetraccion = [],
  tiposRetencionPercepcion = [],
  periodosContables = [],
  cuentasCorrientes = [],
  empresas = [],
  entidadesComerciales = [],
  estadosPago = [],
  compact = false,
  toast = null,
  permisos = {},
  onUpdate = null
}) {
  const [showDialog, setShowDialog] = useState(false);

  if (!registro) return null;

  const formatearNumero = (num) => {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const moneda = monedas?.find(m => Number(m.id) === Number(registro.monedaId));
  const simboloMoneda = moneda?.simbolo || 'S/.';

  const getColorConfig = () => {
    switch(tipo) {
      case 'DETRACCION':
        return {
          tipo: '#8B0000',
          tasa: '#dc3545',
          saldo: '#dc3545',
          label: 'Detracción',
          icon: 'pi-percentage'
        };
      case 'RETENCION':
        return {
          tipo: '#6f42c1',
          tasa: '#9b59b6',
          saldo: '#6f42c1',
          label: 'Retención',
          icon: 'pi-minus-circle'
        };
      case 'PERCEPCION':
        return {
          tipo: '#0f5132',
          tasa: '#198754',
          saldo: '#198754',
          label: 'Percepción',
          icon: 'pi-plus-circle'
        };
      default:
        return {
          tipo: '#6c757d',
          tasa: '#6c757d',
          saldo: '#6c757d',
          label: 'Impuesto',
          icon: 'pi-file'
        };
    }
  };

  const colors = getColorConfig();

  const getTipoNombre = () => {
    if (tipo === 'DETRACCION' && registro.tipoDetraccion) {
      return `${registro.tipoDetraccion.codigo} - ${registro.tipoDetraccion.nombre}`;
    }
    if ((tipo === 'RETENCION' || tipo === 'PERCEPCION') && registro.tipoRetencion) {
      return `${registro.tipoRetencion.codigo} - ${registro.tipoRetencion.descripcion}`;
    }
    return 'N/A';
  };

  const getTasa = () => {
    if (tipo === 'DETRACCION') return registro.tasaDetraccion;
    if (tipo === 'RETENCION') return registro.tasaRetencion;
    if (tipo === 'PERCEPCION') return registro.tasaPercepcion;
    return 0;
  };

  const getImporteRequerido = () => {
    if (tipo === 'DETRACCION') return registro.importeRequerido;
    if (tipo === 'RETENCION') return registro.importeRetenido;
    if (tipo === 'PERCEPCION') return registro.importePercibido;
    return 0;
  };

  const getEstadoColor = () => {
    const estado = registro.estadoPago?.descripcion || '';
    if (estado.includes('SALDADO') || estado.includes('PAGADO')) return '#198754';
    if (estado.includes('PENDIENTE')) return '#ffc107';
    if (estado.includes('PARCIAL')) return '#fd7e14';
    return '#6c757d';
  };

  const getCuentaInfo = () => {
    if (tipo === 'DETRACCION' && registro.cuentaBNSunatPropia) {
      const cuenta = registro.cuentaBNSunatPropia;
      return `${cuenta.banco?.nombre || 'BN'} - ${cuenta.numeroCuenta}`;
    }
    return registro.numeroDocumento || 'N/A';
  };

  const handleClick = () => {
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const handleSubmit = async (formData) => {
    setShowDialog(false);
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate(formData);
    }
  };

  const renderForm = () => {
    if (tipo === 'DETRACCION') {
      return (
        <DetraccionForm
          isEdit={true}
          defaultValues={{
            ...registro,
            fechaEmision: registro.fechaEmision ? new Date(registro.fechaEmision) : null,
            fechaContable: registro.fechaContable ? new Date(registro.fechaContable) : null,
            fechaAplicacion: registro.fechaAplicacion ? new Date(registro.fechaAplicacion) : null,
          }}
          empresas={empresas}
          entidadesComerciales={entidadesComerciales}
          tiposDetraccion={tiposDetraccion}
          monedas={monedas}
          estados={estadosPago}
          periodosContables={periodosContables}
          cuentasCorrientes={cuentasCorrientes}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onSaveSuccess={handleSubmit}
          loading={false}
          readOnly={true}
          permisos={permisos}
          toast={toast}
        />
      );
    }

    if (tipo === 'RETENCION') {
      return (
        <RetencionForm
          isEdit={true}
          defaultValues={{
            ...registro,
            fechaEmision: registro.fechaEmision ? new Date(registro.fechaEmision) : null,
            fechaContable: registro.fechaContable ? new Date(registro.fechaContable) : null,
            fechaAplicacion: registro.fechaAplicacion ? new Date(registro.fechaAplicacion) : null,
          }}
          empresas={empresas}
          entidadesComerciales={entidadesComerciales}
          tiposRetencionPercepcion={tiposRetencionPercepcion}
          monedas={monedas}
          estados={estadosPago}
          periodosContables={periodosContables}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onSaveSuccess={handleSubmit}
          loading={false}
          readOnly={true}
          permisos={permisos}
          toast={toast}
        />
      );
    }

    if (tipo === 'PERCEPCION') {
      return (
        <PercepcionForm
          isEdit={true}
          defaultValues={{
            ...registro,
            fechaEmision: registro.fechaEmision ? new Date(registro.fechaEmision) : null,
            fechaContable: registro.fechaContable ? new Date(registro.fechaContable) : null,
            fechaAplicacion: registro.fechaAplicacion ? new Date(registro.fechaAplicacion) : null,
          }}
          empresas={empresas}
          entidadesComerciales={entidadesComerciales}
          tiposRetencionPercepcion={tiposRetencionPercepcion}
          monedas={monedas}
          estados={estadosPago}
          periodosContables={periodosContables}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onSaveSuccess={handleSubmit}
          loading={false}
          readOnly={true}
          permisos={permisos}
          toast={toast}
        />
      );
    }

    return null;
  };

  return (
    <>
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
        <div style={{ flex: 1.5, backgroundColor: '#cfe2ff', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #b6d4fe' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Tipo {colors.label}</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTipoNombre()}</div>
        </div>
        <div style={{ flex: 0.5, backgroundColor: '#e7d6f5', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #d4b9e8' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Tasa</div>
          <div>{getTasa()}%</div>
        </div>
        <div style={{ flex: 0.6, backgroundColor: '#d1ecf1', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #bee5eb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>F.Emisión</div>
          <div>{formatearFecha(registro.fechaEmision)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#e7d6f5', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #d4b9e8' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Total</div>
          <div>{simboloMoneda} {formatearNumero(registro.importeTotal)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#fff3cd', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #ffeaa7' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Requerido</div>
          <div>{simboloMoneda} {formatearNumero(getImporteRequerido())}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#d1e7dd', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #badbcc' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Pagado</div>
          <div>{simboloMoneda} {formatearNumero(registro.importePagado)}</div>
        </div>
        <div style={{ flex: 0.7, backgroundColor: '#f8d7da', color: '#000', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #f5c6cb' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#555' }}>Saldo</div>
          <div>{simboloMoneda} {formatearNumero(registro.saldoPendiente)}</div>
        </div>

      </div>

      <Dialog
        header={
          <div>
            <i className={`pi ${colors.icon}`} style={{ marginRight: "0.5rem" }} />
            {`${colors.label} ID: ${registro.id}`}
          </div>
        }
        visible={showDialog}
        style={{ width: "95vw", maxWidth: "1400px" }}
        onHide={handleCancel}
        modal
        maximizable
        blockScroll
      >
        {renderForm()}
      </Dialog>
    </>
  );
}