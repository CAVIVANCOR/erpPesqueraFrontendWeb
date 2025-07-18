// src/components/usuarios/UsuarioForm.jsx
// Formulario modular y reutilizable para alta y edición de usuarios en el ERP Megui.
// Usa react-hook-form y Yup para validación profesional y desacoplada.
// Cumple SRP y puede integrarse en cualquier modal/dialog.
import React, { useState, useEffect } from 'react'; // Importación necesaria para estados y efectos en React
import { useForm, Controller } from 'react-hook-form'; // Importación de Controller para formularios controlados
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

// Esquema de validación profesional con Yup alineado al modelo Usuario de Prisma
const schema = Yup.object().shape({
  username: Yup.string().required('El nombre de usuario es obligatorio'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').when('isEdit', {
    is: false,
    then: (schema) => schema.required('La contraseña es obligatoria'),
    otherwise: (schema) => schema.notRequired(),
  }),
  empresaId: Yup.number().typeError('La empresa es obligatoria').required('La empresa es obligatoria'),
  personalId: Yup.number().typeError('El personal debe ser un número').nullable(),
  esSuperUsuario: Yup.boolean(),
  esAdmin: Yup.boolean(),
  esUsuario: Yup.boolean(),
  cesado: Yup.boolean(),
});

/**
 * Componente de formulario de usuario.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 */
import { format } from 'date-fns';

/**
 * Valida si un valor es una fecha válida para evitar errores de formateo.
 * Soporta strings, Date y null/undefined.
 * Retorna true solo si la fecha es válida.
 */
function esFechaValida(fecha) {
  if (!fecha) return false;
  const d = new Date(fecha);
  return d instanceof Date && !isNaN(d.getTime());
}

export default function UsuarioForm({ isEdit = false, defaultValues = {}, onSubmit, onCancel, loading }) {
  // Logs de depuración para diagnóstico de fechas y props
  //console.log('[UsuarioForm] defaultValues:', defaultValues);
  //console.log('[UsuarioForm] defaultValues.fechaCreacion:', defaultValues.fechaCreacion, typeof defaultValues.fechaCreacion);
  //console.log('[UsuarioForm] defaultValues.fechaUltimoAcceso:', defaultValues.fechaUltimoAcceso, typeof defaultValues.fechaUltimoAcceso);

  // Si los campos llegan en snake_case, también los logueamos
  //console.log('[UsuarioForm] defaultValues.fecha_creacion:', defaultValues.fecha_creacion, typeof defaultValues.fecha_creacion);
  //console.log('[UsuarioForm] defaultValues.fecha_ultimo_acceso:', defaultValues.fecha_ultimo_acceso, typeof defaultValues.fecha_ultimo_acceso);

  // Importa y usa watch y setValue de react-hook-form
  // Agrega 'control' de useForm para uso con Controller (formularios controlados)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue, control } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...defaultValues, isEdit },
  });

  // Estados locales para empresas y personal
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);

  // Carga empresas al montar el formulario
  useEffect(() => {
    async function cargarEmpresas() {
      try {
        const data = await import('../../api/empresa').then(mod => mod.getEmpresas());
        setEmpresas(data);
      } catch (err) {
        // Manejo profesional de errores
        setEmpresas([]);
      }
    }
    cargarEmpresas();
  }, []);

  // Carga personal dependiente al cambiar empresa
  const cargarPersonal = async (empresaId) => {
    if (!empresaId) {
      setPersonal([]);
      return;
    }
    try {
      const data = await import('../../api/personal').then(mod => mod.getPersonal(empresaId));
      setPersonal(data);
    } catch (err) {
      setPersonal([]);
    }
  };

  // Si hay empresa seleccionada en defaultValues, carga personal correspondiente
  useEffect(() => {
    if (defaultValues.empresaId) {
      cargarPersonal(defaultValues.empresaId);
    }
    reset({ ...defaultValues, isEdit });
  }, [defaultValues, isEdit, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-fluid">
        {/*
          Campos informativos de fechas solo en edición.
          Se muestran en formato profesional usando date-fns.
          Documentado en español técnico para mantenibilidad.
        */}
        {isEdit && (
  <div className="p-field">
    <label>Fecha de creación:</label>
    <span>
      {esFechaValida(defaultValues.fechaCreacion)
        ? format(new Date(defaultValues.fechaCreacion), 'dd/MM/yyyy HH:mm')
        : 'No disponible'}
    </span>
  </div>
)}
{isEdit && (
  <div className="p-field">
    <label>Último acceso:</label>
    <span>
      {esFechaValida(defaultValues.fechaUltimoAcceso)
        ? format(new Date(defaultValues.fechaUltimoAcceso), 'dd/MM/yyyy HH:mm')
        : 'No disponible'}
    </span>
  </div>
)}

        {/* Campo: Nombre de usuario (username) */}
        <div className="p-field">
          <label htmlFor="username">Nombre de usuario</label>
          <InputText id="username" {...register('username')} className={errors.username ? 'p-invalid' : ''} autoFocus />
          {errors.username && <small className="p-error">{errors.username.message}</small>}
        </div>
        {/* Campo: Contraseña (solo en alta) */}
        {!isEdit && (
          <div className="p-field">
            <label htmlFor="password">Contraseña</label>
            <InputText id="password" type="password" {...register('password')} className={errors.password ? 'p-invalid' : ''} />
            {errors.password && <small className="p-error">{errors.password.message}</small>}
          </div>
        )}
        {/* Campo: Empresa (empresaId) como combo profesional */}
        <div className="p-field">
          <label htmlFor="empresaId">Empresa</label>
          {/*
            Combo profesional de empresa usando Controller para integración total con react-hook-form y PrimeReact.
            Solo limpia personalId y recarga personal si la empresa realmente cambia.
          */}
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="empresaId"
                value={field.value}
                options={empresas}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione una empresa"
                className={errors.empresaId ? 'p-invalid' : ''}
                onChange={e => {
                  if (field.value !== e.value) {
                    field.onChange(e.value);
                    setValue('personalId', null); // Solo limpia si cambia
                    cargarPersonal(e.value);
                  }
                }}
                filter
                showClear
              />
            )}
          />
          {errors.empresaId && <small className="p-error">{errors.empresaId.message}</small>}
        </div>
        {/* Campo: Personal relacionado (personalId) como combo dependiente */}
        <div className="p-field">
          <label htmlFor="personalId">Personal</label>
          {/*
            Se mapea el array de personal para agregar la propiedad nombreCompleto,
            que concatena nombres, apellidos y cargo si existe, para mostrarlo en el combo.
          */}
          {/*
            Combo profesional de personal usando Controller para integración total con react-hook-form y PrimeReact.
            El evento onChange actualiza correctamente el valor seleccionado incluso al hacer clic sobre el texto.
          */}
          <Controller
            name="personalId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="personalId"
                value={field.value}
                options={personal.map(p => ({
                  ...p,
                  nombreCompleto: `${p.nombres} ${p.apellidos}${p.cargo ? ' - ' + p.cargo.descripcion : ''}`
                }))}
                optionLabel="nombreCompleto"
                optionValue="id"
                placeholder="Seleccione personal"
                className={errors.personalId ? 'p-invalid' : ''}
                disabled={!watch('empresaId')}
                filter
                showClear
                onChange={e => field.onChange(e.value)}
              />
            )}
          />
          {errors.personalId && <small className="p-error">{errors.personalId.message}</small>}
        </div>
        {/* Campo: ¿Superusuario? */}
        <div className="p-field-checkbox">
          <input type="checkbox" id="esSuperUsuario" {...register('esSuperUsuario')} />
          <label htmlFor="esSuperUsuario">¿Superusuario?</label>
        </div>
        {/* Campo: ¿Administrador? */}
        <div className="p-field-checkbox">
          <input type="checkbox" id="esAdmin" {...register('esAdmin')} />
          <label htmlFor="esAdmin">¿Administrador?</label>
        </div>
        {/* Campo: ¿Usuario? */}
        <div className="p-field-checkbox">
          <input type="checkbox" id="esUsuario" {...register('esUsuario')} />
          <label htmlFor="esUsuario">¿Usuario?</label>
        </div>
        {/* Campo: ¿Cesado? */}
        <div className="p-field-checkbox">
          <input type="checkbox" id="cesado" {...register('cesado')} />
          <label htmlFor="cesado">¿Cesado?</label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" type="button" onClick={onCancel} disabled={loading || isSubmitting} />
          <Button label={isEdit ? "Actualizar" : "Guardar"} icon="pi pi-check" className="p-button-success" type="submit" loading={loading || isSubmitting} />
        </div>
      </div>
    </form>
  );
}

