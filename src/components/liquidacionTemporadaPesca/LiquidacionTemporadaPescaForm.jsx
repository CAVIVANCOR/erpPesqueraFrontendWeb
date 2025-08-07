// src/components/liquidacionTemporadaPesca/LiquidacionTemporadaPescaForm.jsx
// Formulario profesional para LiquidacionTemporadaPesca. Cumple regla transversal ERP Megui:
// - Campos controlados, validación, normalización de IDs en combos, envío con JWT desde Zustand
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { crearLiquidacionTemporadaPesca, actualizarLiquidacionTemporadaPesca } from '../../api/liquidacionTemporadaPesca';

/**
 * Formulario para gestión de LiquidacionTemporadaPesca
 * Maneja creación y edición con validaciones y combos normalizados
 */
const LiquidacionTemporadaPescaForm = ({ liquidacion, onSave, onCancel }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [temporadas, setTemporadas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [verificadores, setVerificadores] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (liquidacion) {
      // Reset del formulario con datos de edición, normalizando IDs
      reset({
        temporadaPescaId: liquidacion.temporadaPescaId ? Number(liquidacion.temporadaPescaId) : null,
        empresaId: liquidacion.empresaId ? Number(liquidacion.empresaId) : null,
        fechaLiquidacion: liquidacion.fechaLiquidacion ? new Date(liquidacion.fechaLiquidacion) : null,
        responsableId: liquidacion.responsableId ? Number(liquidacion.responsableId) : null,
        verificadorId: liquidacion.verificadorId ? Number(liquidacion.verificadorId) : null,
        fechaVerificacion: liquidacion.fechaVerificacion ? new Date(liquidacion.fechaVerificacion) : null,
        urlPdfLiquidacion: liquidacion.urlPdfLiquidacion || '',
        saldoFinal: liquidacion.saldoFinal ? Number(liquidacion.saldoFinal) : 0,
        observaciones: liquidacion.observaciones || ''
      });
    } else {
      // Reset para nuevo registro
      reset({
        temporadaPescaId: null,
        empresaId: null,
        fechaLiquidacion: new Date(),
        responsableId: null,
        verificadorId: null,
        fechaVerificacion: null,
        urlPdfLiquidacion: '',
        saldoFinal: 0,
        observaciones: ''
      });
    }
  }, [liquidacion, reset, temporadas, empresas, responsables, verificadores]);

  const cargarDatosIniciales = async () => {
    try {
      // TODO: Implementar APIs para cargar datos de combos
      // const [temporadasData, empresasData, responsablesData, verificadoresData] = await Promise.all([
      //   getAllTemporadaPesca(),
      //   getAllEmpresas(),
      //   getAllPersonal(),
      //   getAllPersonal()
      // ]);
      
      // Datos de ejemplo mientras se implementan las APIs
      setTemporadas([
        { id: 1, descripcion: 'Temporada 2024-1' },
        { id: 2, descripcion: 'Temporada 2024-2' }
      ]);
      
      setEmpresas([
        { id: 1, razonSocial: 'Empresa Pesquera 1' },
        { id: 2, razonSocial: 'Empresa Pesquera 2' }
      ]);
      
      setResponsables([
        { id: 1, nombres: 'Juan', apellidos: 'Pérez' },
        { id: 2, nombres: 'María', apellidos: 'García' }
      ]);
      
      setVerificadores([
        { id: 1, nombres: 'Carlos', apellidos: 'López' },
        { id: 2, nombres: 'Ana', apellidos: 'Martín' }
      ]);
      
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar datos iniciales'
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Preparar payload con tipos correctos
      const payload = {
        temporadaPescaId: Number(data.temporadaPescaId),
        empresaId: Number(data.empresaId),
        fechaLiquidacion: data.fechaLiquidacion,
        responsableId: Number(data.responsableId),
        verificadorId: data.verificadorId ? Number(data.verificadorId) : null,
        fechaVerificacion: data.fechaVerificacion || null,
        urlPdfLiquidacion: data.urlPdfLiquidacion || null,
        saldoFinal: Number(data.saldoFinal),
        observaciones: data.observaciones || null
      };
      if (liquidacion?.id) {
        await actualizarLiquidacionTemporadaPesca(liquidacion.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Liquidación actualizada correctamente'
        });
      } else {
        await crearLiquidacionTemporadaPesca(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Liquidación creada correctamente'
        });
      }
      
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la liquidación'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquidacion-temporada-pesca-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Temporada de Pesca */}
          <div className="col-12 md:col-6">
            <label htmlFor="temporadaPescaId" className="block text-900 font-medium mb-2">
              Temporada de Pesca *
            </label>
            <Controller
              name="temporadaPescaId"
              control={control}
              rules={{ required: 'La temporada de pesca es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="temporadaPescaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={temporadas.map(t => ({ ...t, id: Number(t.id) }))}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Seleccione una temporada"
                  className={errors.temporadaPescaId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.temporadaPescaId && (
              <small className="p-error">{errors.temporadaPescaId.message}</small>
            )}
          </div>

          {/* Empresa */}
          <div className="col-12 md:col-6">
            <label htmlFor="empresaId" className="block text-900 font-medium mb-2">
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              rules={{ required: 'La empresa es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={empresas.map(e => ({ ...e, id: Number(e.id) }))}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Seleccione una empresa"
                  className={errors.empresaId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>

          {/* Fecha de Liquidación */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaLiquidacion" className="block text-900 font-medium mb-2">
              Fecha de Liquidación *
            </label>
            <Controller
              name="fechaLiquidacion"
              control={control}
              rules={{ required: 'La fecha de liquidación es obligatoria' }}
              render={({ field }) => (
                <Calendar
                  id="fechaLiquidacion"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/aaaa"
                  className={errors.fechaLiquidacion ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.fechaLiquidacion && (
              <small className="p-error">{errors.fechaLiquidacion.message}</small>
            )}
          </div>

          {/* Responsable */}
          <div className="col-12 md:col-6">
            <label htmlFor="responsableId" className="block text-900 font-medium mb-2">
              Responsable *
            </label>
            <Controller
              name="responsableId"
              control={control}
              rules={{ required: 'El responsable es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="responsableId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={responsables.map(r => ({ 
                    ...r, 
                    id: Number(r.id),
                    nombreCompleto: `${r.nombres} ${r.apellidos}`
                  }))}
                  optionLabel="nombreCompleto"
                  optionValue="id"
                  placeholder="Seleccione un responsable"
                  className={errors.responsableId ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.responsableId && (
              <small className="p-error">{errors.responsableId.message}</small>
            )}
          </div>

          {/* Verificador */}
          <div className="col-12 md:col-6">
            <label htmlFor="verificadorId" className="block text-900 font-medium mb-2">
              Verificador
            </label>
            <Controller
              name="verificadorId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="verificadorId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={verificadores.map(v => ({ 
                    ...v, 
                    id: Number(v.id),
                    nombreCompleto: `${v.nombres} ${v.apellidos}`
                  }))}
                  optionLabel="nombreCompleto"
                  optionValue="id"
                  placeholder="Seleccione un verificador"
                  showClear
                />
              )}
            />
          </div>

          {/* Fecha de Verificación */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaVerificacion" className="block text-900 font-medium mb-2">
              Fecha de Verificación
            </label>
            <Controller
              name="fechaVerificacion"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fechaVerificacion"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/aaaa"
                  showClear
                />
              )}
            />
          </div>

          {/* Saldo Final */}
          <div className="col-12 md:col-6">
            <label htmlFor="saldoFinal" className="block text-900 font-medium mb-2">
              Saldo Final *
            </label>
            <Controller
              name="saldoFinal"
              control={control}
              rules={{ required: 'El saldo final es obligatorio' }}
              render={({ field }) => (
                <InputNumber
                  id="saldoFinal"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="0.00"
                  className={errors.saldoFinal ? 'p-invalid' : ''}
                />
              )}
            />
            {errors.saldoFinal && (
              <small className="p-error">{errors.saldoFinal.message}</small>
            )}
          </div>

          {/* URL PDF Liquidación */}
          <div className="col-12 md:col-6">
            <label htmlFor="urlPdfLiquidacion" className="block text-900 font-medium mb-2">
              URL PDF Liquidación
            </label>
            <Controller
              name="urlPdfLiquidacion"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlPdfLiquidacion"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="https://..."
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
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
              )}
            />
          </div>
        </div>

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
            label={liquidacion?.id ? 'Actualizar' : 'Crear'}
            icon="pi pi-check"
            loading={loading}
            className="p-button-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default LiquidacionTemporadaPescaForm;
