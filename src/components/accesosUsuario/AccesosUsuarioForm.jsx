// src/components/accesosUsuario/AccesosUsuarioForm.jsx
// Formulario profesional para AccesosUsuario con react-hook-form y botones profesionales
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { getUsuarios } from '../../api/usuarios';
import { getSubmodulos } from '../../api/submoduloSistema';
import { getModulos } from '../../api/moduloSistema';

// Esquema de validación
const schema = Yup.object().shape({
  usuarioId: Yup.number().required('Usuario es requerido'),
  submoduloId: Yup.number().required('Submódulo es requerido'),
  fechaOtorgado: Yup.date().required('Fecha otorgado es requerida'),
  puedeVer: Yup.boolean(),
  puedeCrear: Yup.boolean(),
  puedeEditar: Yup.boolean(),
  puedeEliminar: Yup.boolean(),
  puedeAprobarDocs: Yup.boolean(),
  puedeRechazarDocs: Yup.boolean(),
  puedeReactivarDocs: Yup.boolean(),
  activo: Yup.boolean(),
});

export default function AccesosUsuarioForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [submodulos, setSubmodulos] = useState([]);
  const [submodulosFiltrados, setSubmodulosFiltrados] = useState([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      usuarioId: defaultValues.usuarioId || null,
      submoduloId: defaultValues.submoduloId || null,
      fechaOtorgado: defaultValues.fechaOtorgado ? new Date(defaultValues.fechaOtorgado) : new Date(),
      puedeVer: defaultValues.puedeVer !== undefined ? defaultValues.puedeVer : true,
      puedeCrear: defaultValues.puedeCrear !== undefined ? defaultValues.puedeCrear : false,
      puedeEditar: defaultValues.puedeEditar !== undefined ? defaultValues.puedeEditar : false,
      puedeEliminar: defaultValues.puedeEliminar !== undefined ? defaultValues.puedeEliminar : false,
      puedeAprobarDocs: defaultValues.puedeAprobarDocs !== undefined ? defaultValues.puedeAprobarDocs : false,
      puedeRechazarDocs: defaultValues.puedeRechazarDocs !== undefined ? defaultValues.puedeRechazarDocs : false,
      puedeReactivarDocs: defaultValues.puedeReactivarDocs !== undefined ? defaultValues.puedeReactivarDocs : false,
      activo: defaultValues.activo !== undefined ? defaultValues.activo : true,
    },
  });

  const puedeVer = watch('puedeVer');
  const puedeCrear = watch('puedeCrear');
  const puedeEditar = watch('puedeEditar');
  const puedeEliminar = watch('puedeEliminar');
  const puedeAprobarDocs = watch('puedeAprobarDocs');
  const puedeRechazarDocs = watch('puedeRechazarDocs');
  const puedeReactivarDocs = watch('puedeReactivarDocs');
  const activo = watch('activo');

  // Cargar catálogos
  useEffect(() => {
    cargarCatalogos();
  }, []);
  
  // Filtrar submódulos cuando se carga en edición
  useEffect(() => {
    if (defaultValues.submoduloId && submodulos.length > 0) {
      const submodulo = submodulos.find(s => Number(s.id) === Number(defaultValues.submoduloId));
      if (submodulo) {
        setModuloSeleccionado(Number(submodulo.moduloId));
        const submodulosDelModulo = submodulos.filter(s => Number(s.moduloId) === Number(submodulo.moduloId));
        setSubmodulosFiltrados(submodulosDelModulo);
      }
    }
  }, [defaultValues.submoduloId, submodulos]);

  const cargarCatalogos = async () => {
    try {
      const [usuariosData, modulosData, submodulosData] = await Promise.all([
        getUsuarios(),
        getModulos(),
        getSubmodulos()
      ]);
      setUsuarios(usuariosData);
      setModulos(modulosData);
      setSubmodulos(submodulosData);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  const handleModuloChange = (moduloId) => {
    setModuloSeleccionado(moduloId);
    if (moduloId) {
      const submodulosDelModulo = submodulos.filter(s => Number(s.moduloId) === Number(moduloId));
      setSubmodulosFiltrados(submodulosDelModulo);
    } else {
      setSubmodulosFiltrados([]);
    }
    setValue('submoduloId', null);
  };

  const onFormSubmit = (data) => {
    onSubmit({
      usuarioId: Number(data.usuarioId),
      submoduloId: Number(data.submoduloId),
      fechaOtorgado: data.fechaOtorgado,
      puedeVer: !!data.puedeVer,
      puedeCrear: !!data.puedeCrear,
      puedeEditar: !!data.puedeEditar,
      puedeEliminar: !!data.puedeEliminar,
      puedeAprobarDocs: !!data.puedeAprobarDocs,
      puedeRechazarDocs: !!data.puedeRechazarDocs,
      puedeReactivarDocs: !!data.puedeReactivarDocs,
      activo: !!data.activo,
    });
  };

  const PermissionButton = ({ field, label, icon, color }) => (
    <Button
      type="button"
      label={label}
      icon={icon}
      className={field.value ? `p-button-${color}` : 'p-button-outlined p-button-secondary'}
      onClick={() => field.onChange(!field.value)}
      disabled={loading}
      style={{ width: '100%', justifyContent: 'flex-start' }}
    />
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-fluid">
      {/* Usuario, Módulo y Fecha */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="usuarioId">Usuario*</label>
          <Controller
            name="usuarioId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="usuarioId"
                {...field}
                value={field.value ? Number(field.value) : null}
                options={usuarios.map(u => ({ label: u.username, value: Number(u.id) }))}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione un usuario"
                disabled={loading || isEdit}
                filter
                showClear={!isEdit}
                style={{ fontWeight: 'bold' }}
              />
            )}
          />
          {errors.usuarioId && <small className="p-error">{errors.usuarioId.message}</small>}
        </div>
        
        <div style={{ flex: 1 }}>
          <label htmlFor="modulo">Módulo*</label>
          <Dropdown
            id="modulo"
            value={moduloSeleccionado}
            options={modulos.map(m => ({ label: m.nombre, value: Number(m.id) }))}
            onChange={(e) => handleModuloChange(e.value)}
            placeholder="Seleccione un módulo"
            disabled={loading || isEdit}
            filter
            showClear={!isEdit}
            style={{ fontWeight: 'bold' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="fechaOtorgado">Fecha Otorgado*</label>
          <Controller
            name="fechaOtorgado"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaOtorgado"
                {...field}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                showIcon
                dateFormat="dd/mm/yy"
                disabled
                style={{ fontWeight: 'bold' }}
              />
            )}
          />
          {errors.fechaOtorgado && <small className="p-error">{errors.fechaOtorgado.message}</small>}
        </div>
      </div>

      {/* Submódulo */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="submoduloId">Submódulo*</label>
        <Controller
          name="submoduloId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="submoduloId"
              {...field}
              value={field.value ? Number(field.value) : null}
              options={submodulosFiltrados.map(s => ({ label: s.nombre, value: Number(s.id) }))}
              onChange={(e) => field.onChange(e.value)}
              placeholder="Seleccione un submódulo"
              disabled={loading || isEdit || !moduloSeleccionado}
              filter
              showClear={!isEdit}
              style={{ fontWeight: 'bold' }}
            />
          )}
        />
        {errors.submoduloId && <small className="p-error">{errors.submoduloId.message}</small>}
      </div>

      {/* Permisos - Grid Responsive */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12, fontSize: '1.1rem', fontWeight: 'bold' }}>Permisos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
          <Controller
            name="puedeVer"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Puede Ver" icon="pi pi-eye" color="info" />
            )}
          />
          <Controller
            name="puedeCrear"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Puede Crear" icon="pi pi-plus-circle" color="success" />
            )}
          />
          <Controller
            name="puedeEditar"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Puede Editar" icon="pi pi-pencil" color="warning" />
            )}
          />
          <Controller
            name="puedeEliminar"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Puede Eliminar" icon="pi pi-trash" color="danger" />
            )}
          />
          <Controller
            name="puedeAprobarDocs"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Puede Aprobar Docs" icon="pi pi-check-circle" color="success" />
            )}
          />
          <Controller
            name="puedeRechazarDocs"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Puede Rechazar Docs" icon="pi pi-times-circle" color="danger" />
            )}
          />
          <Controller
            name="puedeReactivarDocs"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Puede Reactivar Docs" icon="pi pi-replay" color="info" />
            )}
          />
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <PermissionButton field={field} label="Activo" icon="pi pi-check" color="success" />
            )}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <Button 
          type="button" 
          label="Cancelar" 
          icon="pi pi-times"
          className="p-button-text" 
          onClick={onCancel} 
          disabled={loading} 
        />
        <Button 
          type="submit" 
          label={isEdit ? "Actualizar" : "Crear"} 
          icon="pi pi-save" 
          loading={loading} 
        />
      </div>
    </form>
  );
}