// src/components/detDocTripulantesFaenaConsumo/DetDocTripulantesFaenaConsumoForm.jsx
// Formulario profesional para DetDocTripulantesFaenaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDetDocTripulantesFaenaConsumo, updateDetDocTripulantesFaenaConsumo } from '../../api/detDocTripulantesFaenaConsumo';

/**
 * Formulario para gestión de DetDocTripulantesFaenaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetDocTripulantesFaenaConsumoForm = ({ documento, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [faenas, setFaenas] = useState([]);
  const [tripulantes, setTripulantes] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const toast = useRef(null);

  // Observar fechas para validación
  const fechaEmision = watch('fechaEmision');
  const fechaVencimiento = watch('fechaVencimiento');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (documento) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        faenaPescaConsumoId: documento.faenaPescaConsumoId ? Number(documento.faenaPescaConsumoId) : null,
        tripulanteId: documento.tripulanteId ? Number(documento.tripulanteId) : null,
        documentoId: documento.documentoId ? Number(documento.documentoId) : null,
        numeroDocumento: documento.numeroDocumento || '',
        fechaEmision: documento.fechaEmision ? new Date(documento.fechaEmision) : null,
        fechaVencimiento: documento.fechaVencimiento ? new Date(documento.fechaVencimiento) : null,
        urlDocTripulantePdf: documento.urlDocTripulantePdf || '',
        observaciones: documento.observaciones || '',
        verificado: documento.verificado || false
      });
    } else {
      // Reset para nuevo registro
      reset({
        faenaPescaConsumoId: null,
        tripulanteId: null,
        documentoId: null,
        numeroDocumento: '',
        fechaEmision: null,
        fechaVencimiento: null,
        urlDocTripulantePdf: '',
        observaciones: '',
        verificado: false
      });
    }
  }, [documento, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setFaenas([
        { id: 1, descripcion: 'Faena Anchoveta - Paracas 001', fechaSalida: '2024-01-15' },
        { id: 2, descripcion: 'Faena Jurel - Chimbote 002', fechaSalida: '2024-01-16' },
        { id: 3, descripcion: 'Faena Caballa - Callao 003', fechaSalida: '2024-01-17' }
      ]);
      
      setTripulantes([
        { id: 1, nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Marinero' },
        { id: 2, nombres: 'Luis', apellidos: 'Rodríguez Silva', cargo: 'Motorista' },
        { id: 3, nombres: 'Miguel', apellidos: 'Torres López', cargo: 'Cocinero' },
        { id: 4, nombres: 'José', apellidos: 'Vargas Ruiz', cargo: 'Patrón' },
        { id: 5, nombres: 'Pedro', apellidos: 'García Pérez', cargo: 'Marinero' }
      ]);

      setTiposDocumento([
        { id: 1, nombre: 'DNI', descripcion: 'Documento Nacional de Identidad' },
        { id: 2, nombre: 'Libreta de Mar', descripcion: 'Libreta de Embarque Marítimo' },
        { id: 3, nombre: 'Certificado Médico', descripcion: 'Certificado de Aptitud Médica' },
        { id: 4, nombre: 'Certificado STCW', descripcion: 'Certificado de Competencia Marítima' },
        { id: 5, nombre: 'Licencia de Pesca', descripcion: 'Licencia para Actividades Pesqueras' },
        { id: 6, nombre: 'Seguro de Vida', descripcion: 'Póliza de Seguro de Vida' },
        { id: 7, nombre: 'Certificado Seguridad', descripcion: 'Certificado de Seguridad Marítima' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const validarFechas = () => {
    if (fechaEmision && fechaVencimiento && fechaEmision >= fechaVencimiento) {
      return 'La fecha de vencimiento debe ser posterior a la fecha de emisión';
    }
    return true;
  };

  const calcularVigencia = () => {
    if (!fechaVencimiento) return '';
    
    const ahora = new Date();
    const diasRestantes = Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return `Vencido hace ${Math.abs(diasRestantes)} días`;
    } else if (diasRestantes === 0) {
      return 'Vence hoy';
    } else if (diasRestantes <= 30) {
      return `Vence en ${diasRestantes} días (Próximo a vencer)`;
    } else {
      return `Vigente por ${diasRestantes} días`;
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validar fechas
      const validacionFechas = validarFechas();
      if (validacionFechas !== true) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: validacionFechas
        });
        return;
      }
      
      // Preparar payload con tipos correctos
      const payload = {
        faenaPescaConsumoId: Number(data.faenaPescaConsumoId),
        tripulanteId: data.tripulanteId ? Number(data.tripulanteId) : null,
        documentoId: data.documentoId ? Number(data.documentoId) : null,
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaEmision: data.fechaEmision ? data.fechaEmision.toISOString() : null,
        fechaVencimiento: data.fechaVencimiento ? data.fechaVencimiento.toISOString() : null,
        urlDocTripulantePdf: data.urlDocTripulantePdf?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
        verificado: Boolean(data.verificado)
      };

      console.log('Payload DetDocTripulantesFaenaConsumo:', payload); // Log para depuración

      if (documento?.id) {
        await updateDetDocTripulantesFaenaConsumo(documento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento actualizado correctamente'
        });
      } else {
        await createDetDocTripulantesFaenaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento creado correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el documento'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="det-doc-tripulantes-faena-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Faena */}
              <div className="col-12">
                <label htmlFor="faenaPescaConsumoId" className="block text-900 font-medium mb-2">
                  Faena de Pesca *
                </label>
                <Controller
                  name="faenaPescaConsumoId"
                  control={control}
                  rules={{ required: 'La faena es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="faenaPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={faenas.map(f => ({ 
                        ...f, 
                        id: Number(f.id),
                        nombreCompleto: `${f.id} - ${f.descripcion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una faena"
                      className={errors.faenaPescaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.faenaPescaConsumoId && (
                  <small className="p-error">{errors.faenaPescaConsumoId.message}</small>
                )}
              </div>

              {/* Tripulante */}
              <div className="col-12 md:col-6">
                <label htmlFor="tripulanteId" className="block text-900 font-medium mb-2">
                  Tripulante
                </label>
                <Controller
                  name="tripulanteId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tripulanteId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={tripulantes.map(t => ({ 
                        ...t, 
                        id: Number(t.id),
                        nombreCompleto: `${t.nombres} ${t.apellidos} (${t.cargo})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un tripulante"
                      showClear
                      filter
                    />
                  )}
                />
              </div>

              {/* Tipo de Documento */}
              <div className="col-12 md:col-6">
                <label htmlFor="documentoId" className="block text-900 font-medium mb-2">
                  Tipo de Documento
                </label>
                <Controller
                  name="documentoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="documentoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposDocumento.map(td => ({ 
                        ...td, 
                        id: Number(td.id),
                        nombreCompleto: `${td.nombre} - ${td.descripcion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione tipo de documento"
                      showClear
                      filter
                    />
                  )}
                />
              </div>

              {/* Número de Documento */}
              <div className="col-12">
                <label htmlFor="numeroDocumento" className="block text-900 font-medium mb-2">
                  Número de Documento
                </label>
                <Controller
                  name="numeroDocumento"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroDocumento"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: 12345678, LM-2024-001, CM-2024-123"
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Fechas y Vigencia */}
          <TabPanel header="Fechas y Vigencia">
            <div className="grid">
              {/* Fecha de Emisión */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaEmision" className="block text-900 font-medium mb-2">
                  Fecha de Emisión
                </label>
                <Controller
                  name="fechaEmision"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaEmision"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha de emisión"
                      dateFormat="dd/mm/yy"
                      showIcon
                    />
                  )}
                />
              </div>

              {/* Fecha de Vencimiento */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaVencimiento" className="block text-900 font-medium mb-2">
                  Fecha de Vencimiento
                </label>
                <Controller
                  name="fechaVencimiento"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaVencimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha de vencimiento"
                      dateFormat="dd/mm/yy"
                      showIcon
                      minDate={fechaEmision}
                    />
                  )}
                />
              </div>

              {/* Estado de Verificación */}
              <div className="col-12">
                <div className="field-checkbox">
                  <Controller
                    name="verificado"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        inputId="verificado"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                    )}
                  />
                  <label htmlFor="verificado" className="ml-2">
                    Documento Verificado
                  </label>
                </div>
              </div>

              {/* Información de Vigencia */}
              {fechaVencimiento && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h5 className="mb-2 text-blue-800">Estado de Vigencia</h5>
                    <div className="text-lg font-bold">
                      {(() => {
                        const vigencia = calcularVigencia();
                        const esVencido = vigencia.includes('Vencido');
                        const esPorVencer = vigencia.includes('Próximo a vencer');
                        
                        return (
                          <span className={
                            esVencido ? 'text-red-600' : 
                            esPorVencer ? 'text-orange-600' : 
                            'text-green-600'
                          }>
                            {vigencia}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 3: Documentación y Observaciones */}
          <TabPanel header="Documentación y Observaciones">
            <div className="grid">
              {/* URL del Documento PDF */}
              <div className="col-12">
                <label htmlFor="urlDocTripulantePdf" className="block text-900 font-medium mb-2">
                  URL del Documento (PDF)
                </label>
                <Controller
                  name="urlDocTripulantePdf"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlDocTripulantePdf"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://ejemplo.com/documento-tripulante.pdf"
                    />
                  )}
                />
              </div>

              {/* Observaciones */}
              <div className="col-12">
                <label htmlFor="observaciones" className="block text-900 font-medium mb-2">
                  Observaciones
                </label>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="observaciones"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={5}
                      placeholder="Observaciones sobre el documento del tripulante..."
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 4: Resumen */}
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen del Documento</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Faena:</strong> {
                        faenas.find(f => f.id === watch('faenaPescaConsumoId'))?.descripcion || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Tripulante:</strong> {
                        tripulantes.find(t => t.id === watch('tripulanteId'))?.nombres || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Tipo Documento:</strong> {
                        tiposDocumento.find(td => td.id === watch('documentoId'))?.nombre || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Número:</strong> {watch('numeroDocumento') || 'Sin definir'}
                    </div>
                    <div className="col-6">
                      <strong>F. Emisión:</strong> {
                        fechaEmision ? fechaEmision.toLocaleDateString('es-PE') : 'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>F. Vencimiento:</strong> {
                        fechaVencimiento ? fechaVencimiento.toLocaleDateString('es-PE') : 'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Verificado:</strong> {watch('verificado') ? 'Sí' : 'No'}
                    </div>
                    {fechaVencimiento && (
                      <div className="col-6">
                        <strong>Estado:</strong> {calcularVigencia()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
          />
          <Button
            type="submit"
            label={documento?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DetDocTripulantesFaenaConsumoForm;
