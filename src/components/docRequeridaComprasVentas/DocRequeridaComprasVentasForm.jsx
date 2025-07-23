// src/components/docRequeridaComprasVentas/DocRequeridaComprasVentasForm.jsx
// Formulario profesional para DocRequeridaComprasVentas con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { createDocRequeridaComprasVentas, updateDocRequeridaComprasVentas } from '../../api/docRequeridaComprasVentas';
import { getTiposProducto } from '../../api/tipoProducto';
import { getAllTipoEstadoProducto } from '../../api/tipoEstadoProducto';
import { getDestinosProducto } from '../../api/destinoProducto';
import { getAllFormaTransaccion } from '../../api/formaTransaccion';

/**
 * Componente DocRequeridaComprasVentasForm
 * Formulario para gestión de documentos requeridos en compras/ventas
 * Incluye validaciones y relaciones con catálogos según patrón ERP Megui
 */
const DocRequeridaComprasVentasForm = ({ documento, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nombre: '',
      descripcion: '',
      obligatorio: true,
      activo: true,
      tipoProductoId: null,
      tipoEstadoProductoId: null,
      destinoProductoId: null,
      formaTransaccionId: null,
      paraCompras: false,
      paraVentas: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstado, setTiposEstado] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [formasTransaccion, setFormasTransaccion] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (documento) {
      // Cargar datos del documento para edición
      reset({
        nombre: documento.nombre || '',
        descripcion: documento.descripcion || '',
        obligatorio: Boolean(documento.obligatorio),
        activo: Boolean(documento.activo),
        tipoProductoId: documento.tipoProductoId ? Number(documento.tipoProductoId) : null,
        tipoEstadoProductoId: documento.tipoEstadoProductoId ? Number(documento.tipoEstadoProductoId) : null,
        destinoProductoId: documento.destinoProductoId ? Number(documento.destinoProductoId) : null,
        formaTransaccionId: documento.formaTransaccionId ? Number(documento.formaTransaccionId) : null,
        paraCompras: Boolean(documento.paraCompras),
        paraVentas: Boolean(documento.paraVentas)
      });
    }
  }, [documento, reset]);

  const cargarDatos = async () => {
    try {
      const [
        tiposProductoData,
        tiposEstadoData,
        destinosData,
        formasData
      ] = await Promise.all([
        getTiposProducto(),
        getAllTipoEstadoProducto(),
        getDestinosProducto(),
        getAllFormaTransaccion()
      ]);

      // Normalizar IDs según regla ERP Megui
      setTiposProducto(tiposProductoData.map(t => ({
        ...t,
        id: Number(t.id),
        label: t.nombre,
        value: Number(t.id)
      })));

      setTiposEstado(tiposEstadoData.map(t => ({
        ...t,
        id: Number(t.id),
        label: t.nombre,
        value: Number(t.id)
      })));

      setDestinos(destinosData.map(d => ({
        ...d,
        id: Number(d.id),
        label: d.nombre,
        value: Number(d.id)
      })));

      setFormasTransaccion(formasData.map(f => ({
        ...f,
        id: Number(f.id),
        label: f.nombre,
        value: Number(f.id)
      })));

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Preparar payload con validaciones
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        obligatorio: Boolean(data.obligatorio),
        activo: Boolean(data.activo),
        tipoProductoId: Number(data.tipoProductoId),
        tipoEstadoProductoId: Number(data.tipoEstadoProductoId),
        destinoProductoId: Number(data.destinoProductoId),
        formaTransaccionId: Number(data.formaTransaccionId),
        paraCompras: Boolean(data.paraCompras),
        paraVentas: Boolean(data.paraVentas)
      };

      console.log('Payload DocRequeridaComprasVentas:', payload);

      if (documento?.id) {
        await updateDocRequeridaComprasVentas(documento.id, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento requerido actualizado correctamente'
        });
      } else {
        await createDocRequeridaComprasVentas(payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento requerido creado correctamente'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar documento requerido:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al guardar el documento requerido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doc-requerida-compras-ventas-form">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12 md:col-6">
            <label htmlFor="nombre" className="block text-900 font-medium mb-2">
              Nombre *
            </label>
            <Controller
              name="nombre"
              control={control}
              rules={{ 
                required: 'El nombre es obligatorio',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 100, message: 'Máximo 100 caracteres' }
              }}
              render={({ field }) => (
                <InputText
                  id="nombre"
                  {...field}
                  placeholder="Ingrese el nombre del documento"
                  className={`w-full ${errors.nombre ? 'p-invalid' : ''}`}
                />
              )}
            />
            {errors.nombre && (
              <small className="p-error">{errors.nombre.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="tipoProductoId" className="block text-900 font-medium mb-2">
              Tipo de Producto *
            </label>
            <Controller
              name="tipoProductoId"
              control={control}
              rules={{ required: 'El tipo de producto es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="tipoProductoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={tiposProducto}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar tipo de producto"
                  className={`w-full ${errors.tipoProductoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.tipoProductoId && (
              <small className="p-error">{errors.tipoProductoId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="tipoEstadoProductoId" className="block text-900 font-medium mb-2">
              Estado de Producto *
            </label>
            <Controller
              name="tipoEstadoProductoId"
              control={control}
              rules={{ required: 'El estado de producto es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="tipoEstadoProductoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={tiposEstado}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar estado de producto"
                  className={`w-full ${errors.tipoEstadoProductoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.tipoEstadoProductoId && (
              <small className="p-error">{errors.tipoEstadoProductoId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="destinoProductoId" className="block text-900 font-medium mb-2">
              Destino de Producto *
            </label>
            <Controller
              name="destinoProductoId"
              control={control}
              rules={{ required: 'El destino de producto es obligatorio' }}
              render={({ field }) => (
                <Dropdown
                  id="destinoProductoId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={destinos}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar destino de producto"
                  className={`w-full ${errors.destinoProductoId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.destinoProductoId && (
              <small className="p-error">{errors.destinoProductoId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="formaTransaccionId" className="block text-900 font-medium mb-2">
              Forma de Transacción *
            </label>
            <Controller
              name="formaTransaccionId"
              control={control}
              rules={{ required: 'La forma de transacción es obligatoria' }}
              render={({ field }) => (
                <Dropdown
                  id="formaTransaccionId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={formasTransaccion}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar forma de transacción"
                  className={`w-full ${errors.formaTransaccionId ? 'p-invalid' : ''}`}
                  filter
                  showClear
                />
              )}
            />
            {errors.formaTransaccionId && (
              <small className="p-error">{errors.formaTransaccionId.message}</small>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              rules={{ 
                maxLength: { value: 500, message: 'Máximo 500 caracteres' }
              }}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  {...field}
                  placeholder="Descripción del documento requerido (opcional)"
                  className={`w-full ${errors.descripcion ? 'p-invalid' : ''}`}
                  rows={3}
                />
              )}
            />
            {errors.descripcion && (
              <small className="p-error">{errors.descripcion.message}</small>
            )}
          </div>

          <div className="col-12 md:col-3">
            <div className="field-checkbox">
              <Controller
                name="obligatorio"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="obligatorio"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="obligatorio" className="ml-2 text-900 font-medium">
                Obligatorio
              </label>
            </div>
          </div>

          <div className="col-12 md:col-3">
            <div className="field-checkbox">
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="activo"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="activo" className="ml-2 text-900 font-medium">
                Activo
              </label>
            </div>
          </div>

          <div className="col-12 md:col-3">
            <div className="field-checkbox">
              <Controller
                name="paraCompras"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="paraCompras"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="paraCompras" className="ml-2 text-900 font-medium">
                Para Compras
              </label>
            </div>
          </div>

          <div className="col-12 md:col-3">
            <div className="field-checkbox">
              <Controller
                name="paraVentas"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="paraVentas"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="paraVentas" className="ml-2 text-900 font-medium">
                Para Ventas
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={documento?.id ? 'Actualizar' : 'Crear'}
            icon={documento?.id ? 'pi pi-check' : 'pi pi-plus'}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default DocRequeridaComprasVentasForm;
