// src/components/detDocEmbarcacionPescaConsumo/DetDocEmbarcacionPescaConsumoForm.jsx
// Formulario profesional para DetDocEmbarcacionPescaConsumo. Cumple regla transversal ERP Megui:
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
import { crearDetDocEmbarcacionPescaConsumo, actualizarDetDocEmbarcacionPescaConsumo } from '../../api/detDocEmbarcacionPescaConsumo';
// Importar APIs necesarias según tabla de equivalencias
import { getFaenasPescaConsumo } from '../../api/faenaPescaConsumo';
import { getDocumentosPesca } from '../../api/documentoPesca';

/**
 * Formulario para gestión de DetDocEmbarcacionPescaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const DetDocEmbarcacionPescaConsumoForm = ({ documento, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [faenas, setFaenas] = useState([]);
  const [tiposDocumentoPesca, setTiposDocumentoPesca] = useState([]);
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
        documentoPescaId: documento.documentoPescaId ? Number(documento.documentoPescaId) : null,
        numeroDocumento: documento.numeroDocumento || '',
        fechaEmision: documento.fechaEmision ? new Date(documento.fechaEmision) : null,
        fechaVencimiento: documento.fechaVencimiento ? new Date(documento.fechaVencimiento) : null,
        urlDocEmbarcacio: documento.urlDocEmbarcacio || '',
        observaciones: documento.observaciones || '',
        verificado: documento.verificado || false
      });
    } else {
      // Reset para nuevo registro
      reset({
        faenaPescaConsumoId: null,
        documentoPescaId: null,
        numeroDocumento: '',
        fechaEmision: null,
        fechaVencimiento: null,
        urlDocEmbarcacio: '',
        observaciones: '',
        verificado: false
      });
    }
  }, [documento, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar FaenaPescaConsumo desde API
      const faenasData = await getFaenasPescaConsumo();
      setFaenas(faenasData.map(f => ({
        label: `${f.id} - ${f.descripcion || `Faena ${f.id}`}`,
        value: Number(f.id)
      })));

      // Cargar DocumentoPesca desde API
      const tiposDocumentoPescaData = await getDocumentosPesca();
      setTiposDocumentoPesca(tiposDocumentoPescaData.map(tdp => ({
        label: `${tdp.nombre} - ${tdp.descripcion || ''}`,
        value: Number(tdp.id)
      })));
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos desde las APIs'
      });
    } finally {
      setLoading(false);
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
        documentoPescaId: Number(data.documentoPescaId),
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaEmision: data.fechaEmision ? data.fechaEmision.toISOString() : null,
        fechaVencimiento: data.fechaVencimiento ? data.fechaVencimiento.toISOString() : null,
        urlDocEmbarcacio: data.urlDocEmbarcacio?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
        verificado: Boolean(data.verificado)
      };
      if (documento?.id) {
        await actualizarDetDocEmbarcacionPescaConsumo(documento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento actualizado correctamente'
        });
      } else {
        await crearDetDocEmbarcacionPescaConsumo(payload);
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
    <div className="det-doc-embarcacion-pesca-consumo-form">
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
                      options={faenas}
                      optionLabel="label"
                      optionValue="value"
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

              {/* Tipo de Documento de Pesca */}
              <div className="col-12">
                <label htmlFor="documentoPescaId" className="block text-900 font-medium mb-2">
                  Tipo de Documento *
                </label>
                <Controller
                  name="documentoPescaId"
                  control={control}
                  rules={{ required: 'El tipo de documento es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="documentoPescaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={tiposDocumentoPesca}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione tipo de documento"
                      className={errors.documentoPescaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.documentoPescaId && (
                  <small className="p-error">{errors.documentoPescaId.message}</small>
                )}
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
                      placeholder="Ej: MAT-2024-001, CS-2024-123, PP-2024-456"
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
                <label htmlFor="urlDocEmbarcacio" className="block text-900 font-medium mb-2">
                  URL del Documento (PDF)
                </label>
                <Controller
                  name="urlDocEmbarcacio"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlDocEmbarcacio"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://ejemplo.com/documento-embarcacion.pdf"
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
                      placeholder="Observaciones sobre el documento de la embarcación..."
                    />
                  )}
                />
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

export default DetDocEmbarcacionPescaConsumoForm;