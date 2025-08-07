// src/components/descargaFaenaConsumo/DescargaFaenaConsumoForm.jsx
// Formulario profesional para DescargaFaenaConsumo. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { createDescargaFaenaConsumo, updateDescargaFaenaConsumo } from '../../api/descargaFaenaConsumo';

/**
 * Formulario para gestión de DescargaFaenaConsumo
 * Organizado en pestañas para mejor UX
 */
const DescargaFaenaConsumoForm = ({ descarga, onSave, onCancel }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [faenas, setFaenas] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [puertos, setPuertos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const toast = useRef(null);

  const pesoTotalDescargado = watch('pesoTotalDescargado');
  const pesoTotalDeclarado = watch('pesoTotalDeclarado');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (descarga) {
      reset({
        faenaPescaConsumoId: descarga.faenaPescaConsumoId ? Number(descarga.faenaPescaConsumoId) : null,
        embarcacionId: descarga.embarcacionId ? Number(descarga.embarcacionId) : null,
        puertoDescargaId: descarga.puertoDescargaId ? Number(descarga.puertoDescargaId) : null,
        empresaId: descarga.empresaId ? Number(descarga.empresaId) : null,
        numeroDescarga: descarga.numeroDescarga || '',
        fechaDescarga: descarga.fechaDescarga ? new Date(descarga.fechaDescarga) : null,
        pesoTotalDescargado: descarga.pesoTotalDescargado || null,
        pesoTotalDeclarado: descarga.pesoTotalDeclarado || null,
        temperaturaProducto: descarga.temperaturaProducto || null,
        estadoProducto: descarga.estadoProducto || 'FRESCO',
        calidadProducto: descarga.calidadProducto || 'PRIMERA',
        observaciones: descarga.observaciones || '',
        estadoDescarga: descarga.estadoDescarga || 'PENDIENTE'
      });
    } else {
      reset({
        faenaPescaConsumoId: null,
        embarcacionId: null,
        puertoDescargaId: null,
        empresaId: null,
        numeroDescarga: '',
        fechaDescarga: new Date(),
        pesoTotalDescargado: null,
        pesoTotalDeclarado: null,
        temperaturaProducto: null,
        estadoProducto: 'FRESCO',
        calidadProducto: 'PRIMERA',
        observaciones: '',
        estadoDescarga: 'PENDIENTE'
      });
    }
  }, [descarga, reset]);

  const cargarDatosIniciales = async () => {
    try {
      setFaenas([
        { id: 1, numeroFaena: 'FAE-2024-001', fechaInicio: '2024-01-15', embarcacion: 'Don Lucho I' },
        { id: 2, numeroFaena: 'FAE-2024-002', fechaInicio: '2024-01-18', embarcacion: 'María del Carmen' }
      ]);

      setEmbarcaciones([
        { id: 1, nombre: 'Don Lucho I', matricula: 'CO-12345-PM', tipoEmbarcacion: 'Cerquero' },
        { id: 2, nombre: 'María del Carmen', matricula: 'CO-67890-PM', tipoEmbarcacion: 'Bolichero' }
      ]);

      setPuertos([
        { id: 1, nombre: 'Puerto de Paita', codigo: 'PAITA', region: 'Piura' },
        { id: 2, nombre: 'Puerto de Chimbote', codigo: 'CHIMB', region: 'Áncash' }
      ]);

      setEmpresas([
        { id: 1, razonSocial: 'Pesquera del Norte S.A.C.', nombreComercial: 'PENORTE', ruc: '20123456789' },
        { id: 2, razonSocial: 'Industrias Marinas del Sur S.A.', nombreComercial: 'IMASUR', ruc: '20987654321' }
      ]);

      setPersonal([
        { id: 1, nombres: 'Carlos', apellidos: 'Mendoza Ríos', cargo: 'Capitán' },
        { id: 2, nombres: 'Ana', apellidos: 'García López', cargo: 'Supervisor de Descarga' }
      ]);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const calcularDiferenciaPeso = () => {
    if (!pesoTotalDescargado || !pesoTotalDeclarado) return null;
    return pesoTotalDescargado - pesoTotalDeclarado;
  };

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (!data.numeroDescarga?.trim()) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El número de descarga es obligatorio'
        });
        return;
      }
      
      if (!data.pesoTotalDescargado || data.pesoTotalDescargado <= 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'El peso total descargado debe ser mayor a cero'
        });
        return;
      }
      
      const payload = {
        faenaPescaConsumoId: Number(data.faenaPescaConsumoId),
        embarcacionId: Number(data.embarcacionId),
        puertoDescargaId: Number(data.puertoDescargaId),
        empresaId: Number(data.empresaId),
        numeroDescarga: data.numeroDescarga.trim(),
        fechaDescarga: data.fechaDescarga,
        pesoTotalDescargado: Number(data.pesoTotalDescargado),
        pesoTotalDeclarado: data.pesoTotalDeclarado ? Number(data.pesoTotalDeclarado) : null,
        temperaturaProducto: data.temperaturaProducto ? Number(data.temperaturaProducto) : null,
        estadoProducto: data.estadoProducto || 'FRESCO',
        calidadProducto: data.calidadProducto || 'PRIMERA',
        observaciones: data.observaciones?.trim() || null,
        estadoDescarga: data.estadoDescarga || 'PENDIENTE'
      };

      if (payload.pesoTotalDeclarado) {
        payload.diferenciaPeso = payload.pesoTotalDescargado - payload.pesoTotalDeclarado;
      }
      if (descarga?.id) {
        await updateDescargaFaenaConsumo(descarga.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Descarga actualizada correctamente'
        });
      } else {
        await createDescargaFaenaConsumo(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Descarga creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la descarga'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="descarga-faena-consumo-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView>
          <TabPanel header="Información General">
            <div className="grid">
              <div className="col-12 md:col-6">
                <label htmlFor="numeroDescarga" className="block text-900 font-medium mb-2">
                  Número de Descarga *
                </label>
                <Controller
                  name="numeroDescarga"
                  control={control}
                  rules={{ required: 'El número de descarga es obligatorio' }}
                  render={({ field }) => (
                    <InputText
                      id="numeroDescarga"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: DESC-2024-001"
                      className={errors.numeroDescarga ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.numeroDescarga && (
                  <small className="p-error">{errors.numeroDescarga.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="fechaDescarga" className="block text-900 font-medium mb-2">
                  Fecha de Descarga *
                </label>
                <Controller
                  name="fechaDescarga"
                  control={control}
                  rules={{ required: 'La fecha de descarga es obligatoria' }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaDescarga"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="Seleccione fecha"
                      className={errors.fechaDescarga ? 'p-invalid' : ''}
                      showIcon
                    />
                  )}
                />
                {errors.fechaDescarga && (
                  <small className="p-error">{errors.fechaDescarga.message}</small>
                )}
              </div>

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
                        nombreCompleto: `${f.numeroFaena} - ${f.embarcacion} (${f.fechaInicio})`
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

              <div className="col-12 md:col-6">
                <label htmlFor="embarcacionId" className="block text-900 font-medium mb-2">
                  Embarcación *
                </label>
                <Controller
                  name="embarcacionId"
                  control={control}
                  rules={{ required: 'La embarcación es obligatoria' }}
                  render={({ field }) => (
                    <Dropdown
                      id="embarcacionId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={embarcaciones.map(e => ({ 
                        ...e, 
                        id: Number(e.id),
                        nombreCompleto: `${e.nombre} (${e.matricula}) - ${e.tipoEmbarcacion}`
                      }))}
                      optionLabel="nombreCompleto"
                      optionValue="id"
                      placeholder="Seleccione embarcación"
                      className={errors.embarcacionId ? 'p-invalid' : ''}
                      filter
                    />
                  )}
                />
                {errors.embarcacionId && (
                  <small className="p-error">{errors.embarcacionId.message}</small>
                )}
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="puertoDescargaId" className="block text-900 font-medium mb-2">
                  Puerto de Descarga *
                </label>
                <Controller
                  name="puertoDescargaId"
                  control={control}
                  rules={{ required: 'El puerto es obligatorio' }}
                  render={({ field }) => (
                    <Dropdown
                      id="puertoDescargaId"
                      value={field.value ? Number(field.value) : null}
                      onChange={(e) => field.onChange(e.value)}
                      options={puertos.map(p => ({ 
                        ...p, 
                        id: Number(p.id),
                        nombreCompleto: `${p.nombre} (${p.codigo}) - ${p.region}`
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
            </div>
          </TabPanel>

          <TabPanel header="Pesos y Calidad">
            <div className="grid">
              <div className="col-12 md:col-4">
                <label htmlFor="pesoTotalDescargado" className="block text-900 font-medium mb-2">
                  Peso Total Descargado (kg) *
                </label>
                <Controller
                  name="pesoTotalDescargado"
                  control={control}
                  rules={{ 
                    required: 'El peso descargado es obligatorio',
                    min: { value: 0.01, message: 'El peso debe ser mayor a cero' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoTotalDescargado"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      maxFractionDigits={2}
                      suffix=" kg"
                      className={errors.pesoTotalDescargado ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.pesoTotalDescargado && (
                  <small className="p-error">{errors.pesoTotalDescargado.message}</small>
                )}
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="pesoTotalDeclarado" className="block text-900 font-medium mb-2">
                  Peso Total Declarado (kg)
                </label>
                <Controller
                  name="pesoTotalDeclarado"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="pesoTotalDeclarado"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.00"
                      min={0}
                      maxFractionDigits={2}
                      suffix=" kg"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label className="block text-900 font-medium mb-2">
                  Diferencia de Peso (kg)
                </label>
                <div className="p-inputtext p-component p-filled">
                  <span className={`font-bold ${calcularDiferenciaPeso() > 0 ? 'text-green-600' : calcularDiferenciaPeso() < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {calcularDiferenciaPeso() !== null ? formatearPeso(calcularDiferenciaPeso()) : '0.00 kg'}
                  </span>
                </div>
                <small className="text-blue-600">
                  Calculado automáticamente
                </small>
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="estadoProducto" className="block text-900 font-medium mb-2">
                  Estado del Producto
                </label>
                <Controller
                  name="estadoProducto"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="estadoProducto"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Fresco', value: 'FRESCO' },
                        { label: 'Refrigerado', value: 'REFRIGERADO' },
                        { label: 'Congelado', value: 'CONGELADO' }
                      ]}
                      placeholder="Seleccione estado"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="calidadProducto" className="block text-900 font-medium mb-2">
                  Calidad del Producto
                </label>
                <Controller
                  name="calidadProducto"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="calidadProducto"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={[
                        { label: 'Premium', value: 'PREMIUM' },
                        { label: 'Primera', value: 'PRIMERA' },
                        { label: 'Segunda', value: 'SEGUNDA' },
                        { label: 'Tercera', value: 'TERCERA' }
                      ]}
                      placeholder="Seleccione calidad"
                    />
                  )}
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="temperaturaProducto" className="block text-900 font-medium mb-2">
                  Temperatura del Producto (°C)
                </label>
                <Controller
                  name="temperaturaProducto"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="temperaturaProducto"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      placeholder="0.0"
                      maxFractionDigits={1}
                      suffix="°C"
                    />
                  )}
                />
              </div>

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
                      rows={4}
                      placeholder="Observaciones sobre la descarga: condiciones, incidencias, calidad, etc."
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
            label={descarga?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default DescargaFaenaConsumoForm;
