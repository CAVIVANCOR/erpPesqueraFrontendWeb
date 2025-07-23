// src/components/empresas/EmpresaForm.jsx
// Formulario modular y reutilizable para alta y edición de empresas en el ERP Megui.
// Usa react-hook-form y Yup para validación profesional y desacoplada.
// Cumple SRP y puede integrarse en cualquier modal/dialog.
// Documentado en español técnico.

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { useState } from 'react';
import { getPersonal } from '../../api/personal';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { subirLogoEmpresa } from '../../api/empresa';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

// Esquema de validación profesional con Yup alineado al modelo Empresa de Prisma
const schema = Yup.object().shape({
  razonSocial: Yup.string().required('La razón social es obligatoria'),
  nombreComercial: Yup.string(),
  ruc: Yup.string().required('El RUC es obligatorio').length(11, 'El RUC debe tener 11 dígitos'),
  direccion: Yup.string(),
  telefono: Yup.string(),
  email: Yup.string().email('Debe ser un email válido'),
  cesado: Yup.boolean(),
  representantelegalId: Yup.number().nullable(),
  logo: Yup.string(),
  porcentajeIgv: Yup.number().nullable(),
  porcentajeRetencion: Yup.number().nullable(),
  montoMinimoRetencion: Yup.number().nullable(),
  cuentaDetraccion: Yup.string(),
  soyAgenteRetencion: Yup.boolean(),
  soyAgentePercepcion: Yup.boolean(),
});

/**
 * Formulario modular de empresa.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 */
/**
 * Formulario modular de empresa con gestión profesional de logo.
 * Permite mostrar, subir y actualizar el logo de la empresa usando PrimeReact y API JWT.
 * Documentado profesionalmente en español técnico.
 */
export default function EmpresaForm({ isEdit = false, defaultValues = {}, onSubmit, onCancel, loading }) {
  // Extrae 'control' para uso con Controller
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...defaultValues, cesado: defaultValues.cesado ?? false },
  });

  // Estado profesional para manejo del logo
  /**
   * Estado profesional para el preview del logo.
   * Usa la variable de entorno VITE_UPLOADS_URL para flexibilidad en otros uploads.
   */
  const [logoPreview, setLogoPreview] = useState(
    defaultValues.logo
      ? `${import.meta.env.VITE_UPLOADS_URL}/logos/${defaultValues.logo}`
      : null
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const toast = useRef(null);


  // Estado profesional para lista de personal
  const [personal, setPersonal] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const listarPersonalEmpresa = async (empresaId) => {
    // Devuelve un array [{ id, nombreCompleto }]
    const data = await getPersonal(empresaId);
    // Mapea a formato profesional para combos
    return data.map(p => ({
      id: p.id,
      nombreCompleto: `${p.nombres} ${p.apellidos}${p.cargo?.nombre || '' ? ' (' + p.cargo?.nombre + ')' : ''}`.trim()
    }));
  }

  // Carga el personal de la empresa al montar o cambiar empresaId
  useEffect(() => {
    async function cargarPersonal() {
      setLoadingPersonal(true);
      try {
        // Si tienes empresaId en defaultValues, úsalo. Si no, deja el combo vacío/deshabilitado.
        if (defaultValues.empresaId) {
          const lista = await listarPersonalEmpresa(defaultValues.empresaId);
          setPersonal(lista);
        } else {
          setPersonal([]);
        }
      } catch (err) {
        setPersonal([]);
      } finally {
        setLoadingPersonal(false);
      }
    }
    cargarPersonal();
  }, [defaultValues.empresaId]);

  // Reset al abrir en modo edición o alta
  useEffect(() => {
    reset({ ...defaultValues, cesado: defaultValues.cesado ?? false });
    // Actualiza el preview del logo si cambia la empresa
    /**
     * Construye la URL profesional del logo usando la nueva variable de entorno general para uploads.
     */
    const urlLogo = defaultValues.logo
      ? `${import.meta.env.VITE_UPLOADS_URL}/logos/${defaultValues.logo}`
      : null;
    setLogoPreview(urlLogo);
  }, [defaultValues, isEdit, reset]);

  /**
   * Maneja la subida profesional del logo de empresa.
   * Valida tipo/tamaño, sube vía API, actualiza preview y campo logo.
   * Muestra mensajes de éxito/error profesional.
   */
  /**
   * Maneja la subida profesional del logo de empresa.
   * Muestra el preview inmediatamente usando URL.createObjectURL(file),
   * luego sube el archivo y actualiza el preview con la URL definitiva del backend.
   * Documentado en español técnico.
   */
  const handleLogoUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;
    // Validación profesional: solo imágenes y máx 2MB
    if (!file.type.startsWith('image/')) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Solo se permiten archivos de imagen', life: 4000 });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'El archivo supera el tamaño máximo de 2MB', life: 4000 });
      return;
    }
    // Muestra el preview inmediato usando URL local
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    setUploadingLogo(true);
    try {
      // Sube el logo usando el endpoint profesional
      const res = await subirLogoEmpresa(defaultValues.id, file);
      // Actualiza el campo logo en el formulario y preview con la URL definitiva
      setValue('logo', res.logo, { shouldValidate: true });
      /**
       * Construye la URL profesional del logo subido usando la variable general de uploads.
       */
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/logos/${res.logo}`;
      setLogoPreview(urlBackend);
      toast.current?.show({ severity: 'success', summary: 'Logo actualizado', detail: 'El logo se subió correctamente', life: 3000 });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.error || 'Error al subir el logo', life: 4000 });
    } finally {
      setUploadingLogo(false);
    }
  };


  

  return (
    <>
      {/* Toast profesional para mensajes de usuario */}
      <Toast ref={toast} position="top-right" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-fluid">
          {/* Gestión profesional de logo de empresa */}
          <div className="p-field">
            {/* Layout profesional: imagen a la izquierda, controles a la derecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 8 }}>
              {/* Bloque izquierdo: título y imagen del logo */}
              <div style={{ minWidth: 180, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                {/* Título pegado a la imagen */}
                <label htmlFor="logo" style={{ marginBottom: 6, fontWeight: 500 }}>Logo de la empresa</label>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo actual" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }} />
                ) : (
                  <div style={{ width: 180, height: 120, borderRadius: 6, border: '1px solid #ccc', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 14 }}>
                    Sin logo
                  </div>
                )}
              </div>
              {/* Controles de carga y mensaje */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FileUpload
                  name="logo"
                  accept="image/*"
                  maxFileSize={2 * 1024 * 1024}
                  chooseLabel="Seleccionar logo"
                  uploadLabel="Subir"
                  cancelLabel="Cancelar"
                  customUpload
                  uploadHandler={handleLogoUpload}
                  disabled={!defaultValues.id || uploadingLogo}
                  auto
                  mode="basic"
                  className="p-mb-2"
                />
                <small className="p-d-block" style={{ color: '#888' }}>Solo PNG/JPG. Máx 2MB.</small>
                {/* Mensaje profesional si no hay id disponible */}
                {!defaultValues.id && (
                  <small className="p-error p-d-block">Guarda primero la empresa para habilitar la subida de logo.</small>
                )}
              </div>
            </div>

          </div>

        <div className="p-field">
          <label htmlFor="razonSocial">Razón Social*</label>
          <InputText id="razonSocial" {...register('razonSocial')} className={errors.razonSocial ? 'p-invalid' : ''} autoFocus />
          {errors.razonSocial && <small className="p-error">{errors.razonSocial.message}</small>}
        </div>
        <div className="p-field">
          <label htmlFor="nombreComercial">Nombre Comercial</label>
          <InputText id="nombreComercial" {...register('nombreComercial')} className={errors.nombreComercial ? 'p-invalid' : ''} />
        </div>
        <div className="p-field">
          <label htmlFor="ruc">RUC*</label>
          <InputText id="ruc" {...register('ruc')} className={errors.ruc ? 'p-invalid' : ''} maxLength={11} />
          {errors.ruc && <small className="p-error">{errors.ruc.message}</small>}
        </div>
        <div className="p-field">
          <label htmlFor="direccion">Dirección</label>
          <InputText id="direccion" {...register('direccion')} className={errors.direccion ? 'p-invalid' : ''} />
        </div>
        <div className="p-field">
          <label htmlFor="telefono">Teléfono</label>
          <InputText id="telefono" {...register('telefono')} className={errors.telefono ? 'p-invalid' : ''} />
        </div>
        <div className="p-field">
          <label htmlFor="email">Email</label>
          <InputText id="email" {...register('email')} className={errors.email ? 'p-invalid' : ''} />
          {errors.email && <small className="p-error">{errors.email.message}</small>}
        </div>
        <div className="p-field">
          <label htmlFor="representantelegalId">Representante Legal</label>
          {/* Combo profesional de personal usando Controller para integración total con react-hook-form y PrimeReact. */}
          <Controller
            name="representantelegalId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="representantelegalId"
                value={field.value ?? null}
                options={personal}
                optionLabel="nombreCompleto"
                optionValue="id"
                placeholder={loadingPersonal ? "Cargando..." : "Seleccione representante legal"}
                className={errors.representantelegalId ? 'p-invalid' : ''}
                onChange={e => field.onChange(e.value)}
                disabled={loadingPersonal || !defaultValues.empresaId}
                filter
                showClear
              />
            )}
          />
          {errors.representantelegalId && <small className="p-error">{errors.representantelegalId.message}</small>}
        </div>
        <div className="p-field">
          <label htmlFor="porcentajeIgv">Porcentaje IGV (%)</label>
          {/* Campo numérico profesional con 2 decimales fijos usando PrimeReact InputNumber */}
          <Controller
            name="porcentajeIgv"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="porcentajeIgv"
                value={field.value === undefined || field.value === null ? null : Number(field.value)}
                onValueChange={e => field.onChange(e.value === undefined ? null : e.value)}
                min={0}
                max={100}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                suffix=" %"
                placeholder="0.00 %"
                className={errors.porcentajeIgv ? 'p-invalid' : ''}
              />
            )}
          />
        </div>
        <div className="p-field">
          <label htmlFor="porcentajeRetencion">Porcentaje Retención (%)</label>
          {/* Campo numérico profesional con 2 decimales fijos usando PrimeReact InputNumber */}
          <Controller
            name="porcentajeRetencion"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="porcentajeRetencion"
                value={field.value === undefined || field.value === null ? null : Number(field.value)}
                onValueChange={e => field.onChange(e.value === undefined ? null : e.value)}
                min={0}
                max={100}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                suffix=" %"
                placeholder="0.00 %"
                className={errors.porcentajeRetencion ? 'p-invalid' : ''}
              />
            )}
          />
        </div>
        <div className="p-field">
          <label htmlFor="montoMinimoRetencion">Monto Mínimo Retención</label>
          {/* Campo numérico profesional con 2 decimales fijos usando PrimeReact InputNumber */}
          <Controller
            name="montoMinimoRetencion"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="montoMinimoRetencion"
                value={field.value === undefined || field.value === null ? null : Number(field.value)}
                onValueChange={e => field.onChange(e.value === undefined ? null : e.value)}
                min={0}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                prefix="S/ "
                placeholder="0.00"
                className={errors.montoMinimoRetencion ? 'p-invalid' : ''}
              />
            )}
          />
        </div>
        <div className="p-field">
          <label htmlFor="cuentaDetraccion">Cuenta Detracción</label>
          <InputText id="cuentaDetraccion" {...register('cuentaDetraccion')} className={errors.cuentaDetraccion ? 'p-invalid' : ''} />
        </div>
        <div className="p-field-checkbox">
          {/* Checkbox profesional controlado para booleanos */}
          <Controller
            name="soyAgenteRetencion"
            control={control}
            render={({ field }) => (
              <Checkbox inputId="soyAgenteRetencion" checked={!!field.value} onChange={e => field.onChange(e.checked)} />
            )}
          />
          <label htmlFor="soyAgenteRetencion">¿Es agente de retención?</label>
        </div>
        <div className="p-field-checkbox">
          {/* Checkbox profesional controlado para booleanos */}
          <Controller
            name="soyAgentePercepcion"
            control={control}
            render={({ field }) => (
              <Checkbox inputId="soyAgentePercepcion" checked={!!field.value} onChange={e => field.onChange(e.checked)} />
            )}
          />
          <label htmlFor="soyAgentePercepcion">¿Es agente de percepción?</label>
        </div>
        <div className="p-field-checkbox">
          <Checkbox inputId="cesado" {...register('cesado')} checked={!!defaultValues.cesado} />
          <label htmlFor="cesado">Empresa cesada</label>
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading || isSubmitting} />
          <Button type="submit" label={isEdit ? "Actualizar" : "Registrar"} icon="pi pi-save" loading={loading || isSubmitting} />
        </div>
      </div>
    </form>
    </>
  );
}
