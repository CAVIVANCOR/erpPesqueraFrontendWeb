// src/components/entregaARendirPescaConsumo/EntregaARendirPescaConsumoForm.jsx
// Formulario profesional para EntregaARendirPescaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { crearEntregaARendirPescaConsumo, actualizarEntregaARendirPescaConsumo } from '../../api/entregaARendirPescaConsumo';
// Importar APIs necesarias
import { getAllNovedadPescaConsumo } from '../../api/novedadPescaConsumo';
import { getPersonal } from '../../api/personal';
import { getCentrosCosto } from '../../api/centroCosto';

/**
 * Formulario para gestión de EntregaARendirPescaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const EntregaARendirPescaConsumoForm = ({ entrega, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [novedadesPesca, setNovedadesPesca] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const toast = useRef(null);

  // Observar estado de liquidación
  const entregaLiquidada = watch('entregaLiquidada');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (entrega) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        novedadPescaConsumoId: entrega.novedadPescaConsumoId ? Number(entrega.novedadPescaConsumoId) : null,
        respEntregaRendirId: entrega.respEntregaRendirId ? Number(entrega.respEntregaRendirId) : null,
        centroCostoId: entrega.centroCostoId ? Number(entrega.centroCostoId) : null,
        entregaLiquidada: entrega.entregaLiquidada || false,
        fechaLiquidacion: entrega.fechaLiquidacion ? new Date(entrega.fechaLiquidacion) : null
      });
    } else {
      // Reset para nuevo registro
      reset({
        novedadPescaConsumoId: null,
        respEntregaRendirId: null,
        centroCostoId: null,
        entregaLiquidada: false,
        fechaLiquidacion: null
      });
    }
  }, [entrega, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar Novedades de Pesca Consumo desde API
      const novedadesData = await getAllNovedadPescaConsumo();
      setNovedadesPesca(novedadesData.map(novedad => ({
        id: Number(novedad.id),
        descripcion: novedad.descripcion || `Novedad ${novedad.id}`,
        fechaNovedad: novedad.fechaNovedad || novedad.fechaCreacion
      })));

      // Cargar Personal (Responsables) desde API
      const personalData = await getPersonal();
      setResponsables(personalData.map(persona => ({
        id: Number(persona.id),
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        cargo: persona.cargo?.nombre || 'Sin cargo'
      })));

      // Cargar Centros de Costo desde API
      const centrosCostoData = await getCentrosCosto();
      setCentrosCosto(centrosCostoData.map(centro => ({
        id: Number(centro.id),
        codigo: centro.codigo,
        descripcion: centro.descripcion,
        activo: centro.activo !== false // Por defecto true si no está definido
      })));
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularDiasPendientes = () => {
    if (entregaLiquidada || !entrega?.fechaCreacion) return null;
    
    const fechaCreacion = new Date(entrega.fechaCreacion);
    const ahora = new Date();
    const diasPendientes = Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60 * 24));
    
    return diasPendientes;
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con tipos correctos
      const payload = {
        novedadPescaConsumoId: Number(data.novedadPescaConsumoId),
        respEntregaRendirId: Number(data.respEntregaRendirId),
        centroCostoId: Number(data.centroCostoId),
        entregaLiquidada: Boolean(data.entregaLiquidada),
        fechaLiquidacion: data.fechaLiquidacion ? data.fechaLiquidacion.toISOString() : null
      };

      // Si se marca como liquidada pero no tiene fecha, usar fecha actual
      if (payload.entregaLiquidada && !payload.fechaLiquidacion) {
        payload.fechaLiquidacion = new Date().toISOString();
      }

      // Si se desmarca como liquidada, limpiar fecha de liquidación
      if (!payload.entregaLiquidada) {
        payload.fechaLiquidacion = null;
      }
      if (entrega?.id) {
        await actualizarEntregaARendirPescaConsumo(entrega.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Entrega actualizada correctamente'
        });
      } else {
        await crearEntregaARendirPescaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Entrega creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la entrega'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entrega-a-rendir-pesca-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Novedad de Pesca Consumo */}
              <div className="col-12">
                <label htmlFor="novedadPescaConsumoId" className="block text-900 font-medium mb-2">
                  Novedad de Pesca *
                </label>
                <Controller
                  name="novedadPescaConsumoId"
                  control={control}
                  rules={{ required: 'La novedad de pesca es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="novedadPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={novedadesPesca.map(np => ({ 
                        ...np, 
                        id: Number(np.id),
                        nombreCompleto: `${np.id} - ${np.descripcion} (${new Date(np.fechaNovedad).toLocaleDateString('es-PE')})`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una novedad de pesca"
                      className={errors.novedadPescaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.novedadPescaConsumoId && (
                  <small className="p-error">{errors.novedadPescaConsumoId.message}</small>
                )}
              </div>

              {/* Responsable de Entrega a Rendir */}
              <div className="col-12">
                <label htmlFor="respEntregaRendirId" className="block text-900 font-medium mb-2">
                  Responsable de Entrega *
                </label>
                <Controller
                  name="respEntregaRendirId"
                  control={control}
                  rules={{ required: 'El responsable es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="respEntregaRendirId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={responsables.map(resp => ({ 
                        ...resp, 
                        id: Number(resp.id),
                        nombreCompleto: `${resp.nombres} ${resp.apellidos} - ${resp.cargo}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un responsable"
                      className={errors.respEntregaRendirId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.respEntregaRendirId && (
                  <small className="p-error">{errors.respEntregaRendirId.message}</small>
                )}
              </div>

              {/* Centro de Costo */}
              <div className="col-12">
                <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
                  Centro de Costo *
                </label>
                <Controller
                  name="centroCostoId"
                  control={control}
                  rules={{ required: 'El centro de costo es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="centroCostoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={centrosCosto.filter(cc => cc.activo).map(cc => ({ 
                        ...cc, 
                        id: Number(cc.id),
                        nombreCompleto: `${cc.codigo} - ${cc.descripcion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un centro de costo"
                      className={errors.centroCostoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.centroCostoId && (
                  <small className="p-error">{errors.centroCostoId.message}</small>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Estado de Liquidación */}
          <TabPanel header="Estado de Liquidación">
            <div className="grid">
              {/* Estado de Liquidación */}
              <div className="col-12">
                <div className="field-checkbox">
                  <Controller
                    name="entregaLiquidada"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        inputId="entregaLiquidada"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.checked)}
                      />
                    )}
                  />
                  <label htmlFor="entregaLiquidada" className="ml-2">
                    Entrega Liquidada
                  </label>
                </div>
              </div>

              {/* Fecha de Liquidación */}
              <div className="col-12">
                <label htmlFor="fechaLiquidacion" className="block text-900 font-medium mb-2">
                  Fecha de Liquidación
                </label>
                <Controller
                  name="fechaLiquidacion"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      id="fechaLiquidacion"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha de liquidación"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                      disabled={!entregaLiquidada}
                    />
                  )}
                />
                {entregaLiquidada && (
                  <small className="text-blue-600">
                    Si no selecciona una fecha, se usará la fecha y hora actual al guardar
                  </small>
                )}
              </div>

              {/* Información de Estado */}
              <div className="col-12">
                <div className="card p-3 bg-blue-50">
                  <h5 className="mb-2 text-blue-800">Estado de la Entrega</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Estado Actual:</strong>
                      <div className={`text-lg font-bold ${entregaLiquidada ? 'text-green-600' : 'text-orange-600'}`}>
                        {entregaLiquidada ? 'Liquidada' : 'Pendiente'}
                      </div>
                    </div>
                    {!entregaLiquidada && entrega?.fechaCreacion && (
                      <div className="col-6">
                        <strong>Días Pendientes:</strong>
                        <div className="text-lg font-bold text-red-600">
                          {calcularDiasPendientes()} días
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 3: Resumen */}
          <TabPanel header="Resumen">
            <div className="grid">
              <div className="col-12">
                <div className="card p-4 bg-gray-50">
                  <h5 className="mb-3">Resumen de la Entrega a Rendir</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Novedad:</strong> {
                        novedadesPesca.find(np => np.id === watch('novedadPescaConsumoId'))?.descripcion || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Responsable:</strong> {
                        (() => {
                          const resp = responsables.find(r => r.id === watch('respEntregaRendirId'));
                          return resp ? `${resp.nombres} ${resp.apellidos}` : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Centro de Costo:</strong> {
                        (() => {
                          const cc = centrosCosto.find(c => c.id === watch('centroCostoId'));
                          return cc ? `${cc.codigo} - ${cc.descripcion}` : 'Sin seleccionar';
                        })()
                      }
                    </div>
                    <div className="col-6">
                      <strong>Estado:</strong> 
                      <span className={`ml-2 font-bold ${entregaLiquidada ? 'text-green-600' : 'text-orange-600'}`}>
                        {entregaLiquidada ? 'Liquidada' : 'Pendiente'}
                      </span>
                    </div>
                    {entregaLiquidada && watch('fechaLiquidacion') && (
                      <div className="col-12">
                        <strong>Fecha de Liquidación:</strong> {
                          watch('fechaLiquidacion').toLocaleString('es-PE')
                        }
                      </div>
                    )}
                    {!entregaLiquidada && entrega?.fechaCreacion && (
                      <div className="col-12">
                        <div className="text-lg">
                          <strong>Días Pendientes:</strong> 
                          <span className="ml-2 font-bold text-red-600">
                            {calcularDiasPendientes()} días desde la creación
                          </span>
                        </div>
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
            label={entrega?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default EntregaARendirPescaConsumoForm;