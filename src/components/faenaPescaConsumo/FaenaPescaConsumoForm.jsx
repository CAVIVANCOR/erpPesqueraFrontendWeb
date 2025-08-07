// src/components/faenaPescaConsumo/FaenaPescaConsumoForm.jsx
// Formulario profesional para FaenaPescaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createFaenaPescaConsumo, updateFaenaPescaConsumo } from '../../api/faenaPescaConsumo';

/**
 * Formulario para gestión de FaenaPescaConsumo
 * Maneja creación y edición con validaciones y combos normalizados
 * Organizado en pestañas para mejor UX
 */
const FaenaPescaConsumoForm = ({ faena, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [novedades, setNovedades] = useState([]);
  const [bahias, setBahias] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [puertos, setPuertos] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [boliches, setBoliches] = useState([]);
  const toast = useRef(null);

  // Observar fechas para validación
  const fechaSalida = watch('fechaSalida');
  const fechaRetorno = watch('fechaRetorno');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (faena) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        novedadPescaConsumoId: faena.novedadPescaConsumoId ? Number(faena.novedadPescaConsumoId) : null,
        bahiaId: faena.bahiaId ? Number(faena.bahiaId) : null,
        motoristaId: faena.motoristaId ? Number(faena.motoristaId) : null,
        patronId: faena.patronId ? Number(faena.patronId) : null,
        descripcion: faena.descripcion || '',
        fechaSalida: faena.fechaSalida ? new Date(faena.fechaSalida) : null,
        fechaRetorno: faena.fechaRetorno ? new Date(faena.fechaRetorno) : null,
        puertoSalidaId: faena.puertoSalidaId ? Number(faena.puertoSalidaId) : null,
        puertoRetornoId: faena.puertoRetornoId ? Number(faena.puertoRetornoId) : null,
        puertoDescargaId: faena.puertoDescargaId ? Number(faena.puertoDescargaId) : null,
        embarcacionId: faena.embarcacionId ? Number(faena.embarcacionId) : null,
        bolicheRedId: faena.bolicheRedId ? Number(faena.bolicheRedId) : null,
        urlInformeFaena: faena.urlInformeFaena || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        novedadPescaConsumoId: null,
        bahiaId: null,
        motoristaId: null,
        patronId: null,
        descripcion: '',
        fechaSalida: null,
        fechaRetorno: null,
        puertoSalidaId: null,
        puertoRetornoId: null,
        puertoDescargaId: null,
        embarcacionId: null,
        bolicheRedId: null,
        urlInformeFaena: ''
      });
    }
  }, [faena, reset]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // Datos de ejemplo mientras se implementan las APIs
      setNovedades([
        { id: 1, nombre: 'Temporada Anchoveta 2024-I' },
        { id: 2, nombre: 'Temporada Jurel 2024-I' },
        { id: 3, nombre: 'Temporada Caballa 2024-I' }
      ]);
      
      setBahias([
        { id: 1, nombre: 'Bahía de Paracas', codigo: 'PAR' },
        { id: 2, nombre: 'Bahía de Chimbote', codigo: 'CHI' },
        { id: 3, nombre: 'Bahía de Callao', codigo: 'CAL' }
      ]);

      setPersonal([
        { id: 1, nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Motorista' },
        { id: 2, nombres: 'Luis', apellidos: 'Rodríguez Silva', cargo: 'Patrón' },
        { id: 3, nombres: 'Miguel', apellidos: 'Torres López', cargo: 'Motorista' },
        { id: 4, nombres: 'José', apellidos: 'Vargas Ruiz', cargo: 'Patrón' }
      ]);

      setPuertos([
        { id: 1, nombre: 'Puerto de Paracas', codigo: 'PAR' },
        { id: 2, nombre: 'Puerto de Chimbote', codigo: 'CHI' },
        { id: 3, nombre: 'Puerto del Callao', codigo: 'CAL' },
        { id: 4, nombre: 'Puerto de Paita', codigo: 'PAI' }
      ]);

      setEmbarcaciones([
        { id: 1, nombre: 'Don Pescador I', matricula: 'CO-12345-PM' },
        { id: 2, nombre: 'Mar Azul II', matricula: 'CO-67890-PM' },
        { id: 3, nombre: 'Estrella del Mar', matricula: 'CO-11111-PM' }
      ]);

      setBoliches([
        { id: 1, nombre: 'Red Boliche Premium', codigo: 'RBP-001' },
        { id: 2, nombre: 'Red Boliche Estándar', codigo: 'RBE-002' },
        { id: 3, nombre: 'Red Boliche Especial', codigo: 'RBE-003' }
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
    if (fechaSalida && fechaRetorno && fechaSalida >= fechaRetorno) {
      return 'La fecha de retorno debe ser posterior a la fecha de salida';
    }
    return true;
  };

  const calcularDuracion = () => {
    if (!fechaSalida || !fechaRetorno) return '';
    
    const diferencia = fechaRetorno - fechaSalida;
    const horas = Math.round(diferencia / (1000 * 60 * 60));
    
    if (horas < 24) {
      return `${horas} horas`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias} días ${horasRestantes} horas`;
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
        novedadPescaConsumoId: Number(data.novedadPescaConsumoId),
        bahiaId: Number(data.bahiaId),
        motoristaId: Number(data.motoristaId),
        patronId: Number(data.patronId),
        descripcion: data.descripcion?.trim() || null,
        fechaSalida: data.fechaSalida.toISOString(),
        fechaRetorno: data.fechaRetorno.toISOString(),
        puertoSalidaId: Number(data.puertoSalidaId),
        puertoRetornoId: Number(data.puertoRetornoId),
        puertoDescargaId: Number(data.puertoDescargaId),
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        bolicheRedId: data.bolicheRedId ? Number(data.bolicheRedId) : null,
        urlInformeFaena: data.urlInformeFaena?.trim() || null
      };
      if (faena?.id) {
        await updateFaenaPescaConsumo(faena.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Faena actualizada correctamente'
        });
      } else {
        await createFaenaPescaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Faena creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la faena'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faena-pesca-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          {/* Pestaña 1: Información General */}
          <TabPanel header="Información General">
            <div className="grid">
              {/* Novedad */}
              <div className="col-12 md:col-6">
                <label htmlFor="novedadPescaConsumoId" className="block text-900 font-medium mb-2">
                  Novedad de Pesca *
                </label>
                <Controller
                  name="novedadPescaConsumoId"
                  control={control}
                  rules={{ required: 'La novedad es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="novedadPescaConsumoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={novedades.map(n => ({ ...n, id: Number(n.id) }))}
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione una novedad"
                      className={errors.novedadPescaConsumoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.novedadPescaConsumoId && (
                  <small className="p-error">{errors.novedadPescaConsumoId.message}</small>
                )}
              </div>

              {/* Bahía */}
              <div className="col-12 md:col-6">
                <label htmlFor="bahiaId" className="block text-900 font-medium mb-2">
                  Bahía *
                </label>
                <Controller
                  name="bahiaId"
                  control={control}
                  rules={{ required: 'La bahía es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="bahiaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={bahias.map(b => ({ 
                        ...b, 
                        id: Number(b.id),
                        nombreCompleto: `${b.codigo} - ${b.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una bahía"
                      className={errors.bahiaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.bahiaId && (
                  <small className="p-error">{errors.bahiaId.message}</small>
                )}
              </div>

              {/* Motorista */}
              <div className="col-12 md:col-6">
                <label htmlFor="motoristaId" className="block text-900 font-medium mb-2">
                  Motorista *
                </label>
                <Controller
                  name="motoristaId"
                  control={control}
                  rules={{ required: 'El motorista es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="motoristaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal.filter(p => p.cargo === 'Motorista').map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.nombres} ${p.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un motorista"
                      className={errors.motoristaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.motoristaId && (
                  <small className="p-error">{errors.motoristaId.message}</small>
                )}
              </div>

              {/* Patrón */}
              <div className="col-12 md:col-6">
                <label htmlFor="patronId" className="block text-900 font-medium mb-2">
                  Patrón *
                </label>
                <Controller
                  name="patronId"
                  control={control}
                  rules={{ required: 'El patrón es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="patronId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={personal.filter(p => p.cargo === 'Patrón').map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.nombres} ${p.apellidos}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un patrón"
                      className={errors.patronId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.patronId && (
                  <small className="p-error">{errors.patronId.message}</small>
                )}
              </div>

              {/* Descripción */}
              <div className="col-12">
                <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
                  Descripción
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={3}
                      placeholder="Descripción de la faena de pesca..."
                    />
                  )}
                />
              </div>
            </div>
          </TabPanel>

          {/* Pestaña 2: Fechas y Puertos */}
          <TabPanel header="Fechas y Puertos">
            <div className="grid">
              {/* Fecha Salida */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaSalida" className="block text-900 font-medium mb-2">
                  Fecha y Hora de Salida *
                </label>
                <Controller
                  name="fechaSalida"
                  control={control}
                  rules={{ required: 'La fecha de salida es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaSalida"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha y hora"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                      className={errors.fechaSalida ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaSalida && (
                  <small className="p-error">{errors.fechaSalida.message}</small>
                )}
              </div>

              {/* Fecha Retorno */}
              <div className="col-12 md:col-6">
                <label htmlFor="fechaRetorno" className="block text-900 font-medium mb-2">
                  Fecha y Hora de Retorno *
                </label>
                <Controller
                  name="fechaRetorno"
                  control={control}
                  rules={{ required: 'La fecha de retorno es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaRetorno"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione fecha y hora"
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="24"
                      showIcon
                      minDate={fechaSalida}
                      className={errors.fechaRetorno ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.fechaRetorno && (
                  <small className="p-error">{errors.fechaRetorno.message}</small>
                )}
              </div>

              {/* Puerto Salida */}
              <div className="col-12 md:col-4">
                <label htmlFor="puertoSalidaId" className="block text-900 font-medium mb-2">
                  Puerto de Salida *
                </label>
                <Controller
                  name="puertoSalidaId"
                  control={control}
                  rules={{ required: 'El puerto de salida es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="puertoSalidaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={puertos.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.codigo} - ${p.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione puerto"
                      className={errors.puertoSalidaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.puertoSalidaId && (
                  <small className="p-error">{errors.puertoSalidaId.message}</small>
                )}
              </div>

              {/* Puerto Retorno */}
              <div className="col-12 md:col-4">
                <label htmlFor="puertoRetornoId" className="block text-900 font-medium mb-2">
                  Puerto de Retorno *
                </label>
                <Controller
                  name="puertoRetornoId"
                  control={control}
                  rules={{ required: 'El puerto de retorno es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="puertoRetornoId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={puertos.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.codigo} - ${p.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione puerto"
                      className={errors.puertoRetornoId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.puertoRetornoId && (
                  <small className="p-error">{errors.puertoRetornoId.message}</small>
                )}
              </div>

              {/* Puerto Descarga */}
              <div className="col-12 md:col-4">
                <label htmlFor="puertoDescargaId" className="block text-900 font-medium mb-2">
                  Puerto de Descarga *
                </label>
                <Controller
                  name="puertoDescargaId"
                  control={control}
                  rules={{ required: 'El puerto de descarga es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="puertoDescargaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={puertos.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.codigo} - ${p.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione puerto"
                      className={errors.puertoDescargaId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.puertoDescargaId && (
                  <small className="p-error">{errors.puertoDescargaId.message}</small>
                )}
              </div>

              {/* Duración Calculada */}
              {fechaSalida && fechaRetorno && (
                <div className="col-12">
                  <div className="card p-3 bg-blue-50">
                    <h5 className="mb-2 text-blue-800">Información de Duración</h5>
                    <div className="text-lg font-bold text-primary">
                      <strong>Duración Total: {calcularDuracion()}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Pestaña 3: Embarcación y Equipos */}
          <TabPanel header="Embarcación y Equipos">
            <div className="grid">
              {/* Embarcación */}
              <div className="col-12 md:col-6">
                <label htmlFor="embarcacionId" className="block text-900 font-medium mb-2">
                  Embarcación
                </label>
                <Controller
                  name="embarcacionId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="embarcacionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={embarcaciones.map(e => ({ 
                        ...e, 
                        id: Number(e.id),
                        nombreCompleto: `${e.matricula} - ${e.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione una embarcación"
                      showClear
                      filter
                    />
                  )}
                />
              </div>

              {/* Boliche/Red */}
              <div className="col-12 md:col-6">
                <label htmlFor="bolicheRedId" className="block text-900 font-medium mb-2">
                  Boliche/Red
                </label>
                <Controller
                  name="bolicheRedId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="bolicheRedId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={boliches.map(b => ({ 
                        ...b, 
                        id: Number(b.id),
                        nombreCompleto: `${b.codigo} - ${b.nombre}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione un boliche"
                      showClear
                      filter
                    />
                  )}
                />
              </div>

              {/* URL Informe */}
              <div className="col-12">
                <label htmlFor="urlInformeFaena" className="block text-900 font-medium mb-2">
                  URL del Informe de Faena
                </label>
                <Controller
                  name="urlInformeFaena"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="urlInformeFaena"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://ejemplo.com/informe-faena.pdf"
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
                  <h5 className="mb-3">Resumen de la Faena</h5>
                  <div className="grid">
                    <div className="col-6">
                      <strong>Novedad:</strong> {
                        novedades.find(n => n.id === watch('novedadPescaConsumoId'))?.nombre || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Bahía:</strong> {
                        bahias.find(b => b.id === watch('bahiaId'))?.nombre || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Motorista:</strong> {
                        personal.find(p => p.id === watch('motoristaId'))?.nombres || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Patrón:</strong> {
                        personal.find(p => p.id === watch('patronId'))?.nombres || 'Sin seleccionar'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Fecha Salida:</strong> {
                        fechaSalida ? fechaSalida.toLocaleString('es-PE') : 'Sin definir'
                      }
                    </div>
                    <div className="col-6">
                      <strong>Fecha Retorno:</strong> {
                        fechaRetorno ? fechaRetorno.toLocaleString('es-PE') : 'Sin definir'
                      }
                    </div>
                    {fechaSalida && fechaRetorno && (
                      <div className="col-12">
                        <div className="text-lg font-bold text-primary">
                          <strong>Duración: {calcularDuracion()}</strong>
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
            label={faena?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default FaenaPescaConsumoForm;
