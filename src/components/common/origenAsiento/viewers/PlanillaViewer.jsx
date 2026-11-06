import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { getPlanillaById } from '../../../../api/recursosHumanos/planilla';
import { formatearFecha } from '../../../../utils/utils';
import { mensajeDeError } from '../../../../utils/mensajeError';

const formatearMonto = (valor) => Number(valor || 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });

/**
 * Vista de origen de un asiento generado por una planilla (solo lectura): resumen y boletas por trabajador.
 */
export default function PlanillaViewer({ id, visible, onHide }) {
  const [planilla, setPlanilla] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || !visible) return;
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        setPlanilla(await getPlanillaById(id));
      } catch (err) {
        setError(mensajeDeError(err, 'No se pudo cargar la planilla de origen'));
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id, visible]);

  return (
    <Dialog visible={visible} onHide={onHide} header="Planilla - Vista de Origen" style={{ width: '90vw', maxHeight: '90vh' }} modal dismissableMask>
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <ProgressSpinner />
          <p>Cargando datos...</p>
        </div>
      )}
      {error && <Message severity="error" text={error} style={{ width: '100%' }} />}
      {planilla && !loading && (
        <div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
            <div><strong>Planilla:</strong> {planilla.descripcion}</div>
            <div><strong>Empresa:</strong> {planilla.empresa?.razonSocial}</div>
            <div><strong>Periodo:</strong> {formatearFecha(planilla.fechaInicio)} - {formatearFecha(planilla.fechaFin)}</div>
            <div>
              <Tag value={planilla.estado?.descripcion} severity={(planilla.estado?.severityColor || 'secondary').toLowerCase()} />
            </div>
            <div><strong>Neto:</strong> {formatearMonto(planilla.totalNeto)}</div>
          </div>
          <DataTable value={planilla.trabajadores || []} size="small" showGridlines stripedRows emptyMessage="La planilla no tiene boletas">
            <Column header="Trabajador" body={(t) => `${t.personal?.apellidos} ${t.personal?.nombres}`} />
            <Column header="Documento" body={(t) => t.personal?.numeroDocumento} style={{ width: 120 }} />
            <Column header="Días" body={(t) => Number(t.diasTrabajados)} style={{ width: 70, textAlign: 'center' }} />
            <Column header="Ingresos" body={(t) => formatearMonto(t.totalIngresos)} style={{ width: 130, textAlign: 'right' }} />
            <Column header="Descuentos" body={(t) => formatearMonto(t.totalDescuentos)} style={{ width: 130, textAlign: 'right' }} />
            <Column header="Aportes empleador" body={(t) => formatearMonto(t.totalAportesEmpleador)} style={{ width: 140, textAlign: 'right' }} />
            <Column header="Neto a pagar" body={(t) => <strong>{formatearMonto(t.totalNeto)}</strong>} style={{ width: 130, textAlign: 'right' }} />
          </DataTable>
        </div>
      )}
    </Dialog>
  );
}
