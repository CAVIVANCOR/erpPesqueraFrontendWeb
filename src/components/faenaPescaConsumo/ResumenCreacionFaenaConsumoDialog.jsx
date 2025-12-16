/**
 * ResumenCreacionFaenaConsumoDialog.jsx
 * 
 * Componente modal para mostrar el resumen de la creación de una faena de pesca consumo completa
 * Muestra información detallada de todos los registros creados
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';

/**
 * Componente ResumenCreacionFaenaConsumoDialog
 * @param {Object} props - Props del componente
 * @param {boolean} props.visible - Visibilidad del diálogo
 * @param {Function} props.onHide - Callback para cerrar el diálogo
 * @param {Object} props.resumen - Datos del resumen de creación
 */
const ResumenCreacionFaenaConsumoDialog = ({ visible, onHide, resumen }) => {
  if (!resumen) return null;

  const {
    faenaId,
    descripcion,
    nombreNovedad,
    embarcacionNombre,
    patronNombre,
    motoristaNombre,
    bahiaNombre,
    tripulantesRegistrados,
    tripulantesPorCargo,
    accionesPreviasAsignadas,
    docTripulantesTotal,
    docTripulantesVigentes,
    docTripulantesVencidos,
    docEmbarcacionTotal,
    docEmbarcacionVigentes,
    docEmbarcacionVencidos,
    tieneAdvertencias,
    totalDocumentosVencidos
  } = resumen;

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cerrar"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text"
      />
      <Button
        label="Entendido"
        icon="pi pi-check"
        onClick={onHide}
        className="p-button-success"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-check-circle" style={{ fontSize: '1.5rem', color: '#22c55e' }}></i>
          <span>Faena de Pesca Consumo Creada Exitosamente</span>
        </div>
      }
      footer={footer}
      style={{ width: '800px' }}
      modal
      dismissableMask
    >
      <div className="p-fluid">
        {/* Información General */}
        <Card className="mb-3">
          <div className="grid">
            <div className="col-12">
              <h3 className="mt-0 mb-3 text-primary">
                <i className="pi pi-info-circle mr-2"></i>
                Información General
              </h3>
            </div>
            <div className="col-6">
              <div className="mb-2">
                <strong>Faena ID:</strong>
                <Badge value={faenaId} severity="info" className="ml-2" />
              </div>
              <div className="mb-2">
                <strong>Descripción:</strong>
                <p className="mt-1 mb-0">{descripcion}</p>
              </div>
            </div>
            <div className="col-6">
              <div className="mb-2">
                <strong>Novedad:</strong>
                <p className="mt-1 mb-0">{nombreNovedad || 'S/N'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Datos Autocompletados */}
        <Card className="mb-3">
          <h3 className="mt-0 mb-3 text-primary">
            <i className="pi pi-cog mr-2"></i>
            Datos Autocompletados
          </h3>
          <div className="grid">
            <div className="col-6">
              <div className="mb-2">
                <strong>Embarcación:</strong>
                <p className="mt-1 mb-0">
                  {embarcacionNombre || <span className="text-orange-500">No autocompletado</span>}
                </p>
              </div>
              <div className="mb-2">
                <strong>Patrón:</strong>
                <p className="mt-1 mb-0">
                  {patronNombre || <span className="text-orange-500">No autocompletado</span>}
                </p>
              </div>
            </div>
            <div className="col-6">
              <div className="mb-2">
                <strong>Motorista:</strong>
                <p className="mt-1 mb-0">
                  {motoristaNombre || <span className="text-orange-500">No autocompletado</span>}
                </p>
              </div>
              <div className="mb-2">
                <strong>Bahía:</strong>
                <p className="mt-1 mb-0">
                  {bahiaNombre || <span className="text-orange-500">No autocompletado</span>}
                </p>
              </div>
            </div>
          </div>
          {(!embarcacionNombre || !patronNombre || !motoristaNombre || !bahiaNombre) && (
            <div className="mt-3 p-3 surface-100 border-round">
              <i className="pi pi-info-circle text-orange-500 mr-2"></i>
              <span className="text-sm">
                Los campos no autocompletados deben ser llenados manualmente en la edición de la faena.
              </span>
            </div>
          )}
        </Card>

        {/* Tripulantes Registrados */}
        <Card className="mb-3">
          <h3 className="mt-0 mb-3 text-primary">
            <i className="pi pi-users mr-2"></i>
            Tripulantes Registrados
          </h3>
          <div className="grid">
            <div className="col-3">
              <div className="text-center p-3 surface-100 border-round">
                <div className="text-4xl font-bold text-primary mb-2">{tripulantesRegistrados}</div>
                <div className="text-sm text-600">Total</div>
              </div>
            </div>
            <div className="col-3">
              <div className="text-center p-3 surface-100 border-round">
                <div className="text-4xl font-bold text-blue-500 mb-2">{tripulantesPorCargo?.tripulantes || 0}</div>
                <div className="text-sm text-600">Tripulantes</div>
              </div>
            </div>
            <div className="col-3">
              <div className="text-center p-3 surface-100 border-round">
                <div className="text-4xl font-bold text-cyan-500 mb-2">{tripulantesPorCargo?.patrones || 0}</div>
                <div className="text-sm text-600">Patrones</div>
              </div>
            </div>
            <div className="col-3">
              <div className="text-center p-3 surface-100 border-round">
                <div className="text-4xl font-bold text-teal-500 mb-2">{tripulantesPorCargo?.motoristas || 0}</div>
                <div className="text-sm text-600">Motoristas</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Acciones Previas */}
        <Card className="mb-3">
          <h3 className="mt-0 mb-3 text-primary">
            <i className="pi pi-list-check mr-2"></i>
            Acciones Previas Asignadas
          </h3>
          <div className="text-center p-3 surface-100 border-round">
            <div className="text-4xl font-bold text-purple-500 mb-2">{accionesPreviasAsignadas}</div>
            <div className="text-sm text-600">Acciones previas configuradas</div>
          </div>
        </Card>

        {/* Documentación */}
        <Card className="mb-3">
          <h3 className="mt-0 mb-3 text-primary">
            <i className="pi pi-file mr-2"></i>
            Documentación Registrada
          </h3>
          
          {/* Documentos de Tripulantes */}
          <div className="mb-3">
            <h4 className="text-lg mb-2">Documentos de Tripulantes</h4>
            <div className="grid">
              <div className="col-4">
                <div className="text-center p-3 surface-100 border-round">
                  <div className="text-3xl font-bold mb-2">{docTripulantesTotal}</div>
                  <div className="text-sm text-600">Total</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 bg-green-50 border-round">
                  <div className="text-3xl font-bold text-green-600 mb-2">{docTripulantesVigentes}</div>
                  <div className="text-sm text-600">Vigentes</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 bg-red-50 border-round">
                  <div className="text-3xl font-bold text-red-600 mb-2">{docTripulantesVencidos}</div>
                  <div className="text-sm text-600">Vencidos</div>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* Documentos de Embarcación */}
          <div>
            <h4 className="text-lg mb-2">Documentos de Embarcación</h4>
            <div className="grid">
              <div className="col-4">
                <div className="text-center p-3 surface-100 border-round">
                  <div className="text-3xl font-bold mb-2">{docEmbarcacionTotal}</div>
                  <div className="text-sm text-600">Total</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 bg-green-50 border-round">
                  <div className="text-3xl font-bold text-green-600 mb-2">{docEmbarcacionVigentes}</div>
                  <div className="text-sm text-600">Vigentes</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 bg-red-50 border-round">
                  <div className="text-3xl font-bold text-red-600 mb-2">{docEmbarcacionVencidos}</div>
                  <div className="text-sm text-600">Vencidos</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Advertencias */}
        {tieneAdvertencias && (
          <Card className="bg-orange-50 border-orange-200">
            <div className="flex align-items-start gap-3">
              <i className="pi pi-exclamation-triangle text-orange-500" style={{ fontSize: '2rem' }}></i>
              <div>
                <h4 className="mt-0 mb-2 text-orange-700">Advertencia: Documentos Vencidos</h4>
                <p className="mt-0 mb-2">
                  Se han detectado <strong>{totalDocumentosVencidos}</strong> documento(s) vencido(s).
                </p>
                <p className="mt-0 mb-0 text-sm">
                  Por favor, revise y actualice la documentación vencida antes de iniciar operaciones con esta faena.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Mensaje de Éxito */}
        {!tieneAdvertencias && (
          <Card className="bg-green-50 border-green-200">
            <div className="flex align-items-center gap-3">
              <i className="pi pi-check-circle text-green-500" style={{ fontSize: '2rem' }}></i>
              <div>
                <h4 className="mt-0 mb-2 text-green-700">¡Todo en Orden!</h4>
                <p className="mt-0 mb-0">
                  La faena de pesca consumo ha sido creada exitosamente con toda su documentación vigente.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Dialog>
  );
};

export default ResumenCreacionFaenaConsumoDialog;
