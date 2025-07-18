// src/pages/Personal.jsx
// Página principal de gestión de personal en el ERP Megui.
// Reutiliza patrones de Usuarios.jsx y documenta en español técnico.

import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import PersonalForm from '../components/personal/PersonalForm';
import { getPersonal, crearPersonal, actualizarPersonal } from '../api/personal';
import { getEmpresas } from '../api/empresa';
import { Dialog } from 'primereact/dialog';
import { getCargosPersonal } from '../api/cargosPersonal';
import { getSedes } from '../api/sedes';
import { getAreasFisicas } from '../api/areasFisicas';

// Importar aquí funciones de alta, edición y borrado cuando se implementen

/**
 * Página de gestión de personal.
 * Incluye DataTable, alta, edición y eliminación, con feedback visual profesional.
 */
export default function PersonalPage() {
  const [personales, setPersonales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /**
   * Carga los cargos desde el backend.
   * Utiliza la función getCargosPersonal para obtener los datos.
   * Si hay un error, muestra un toast con el mensaje de error.
   */
  const [cargosLista, setCargosLista] = useState([]);
  useEffect(() => {
    cargarCargos();
  }, []);
  const cargarCargos = async () => {
    try {
      const data = await getCargosPersonal();
      setCargosLista(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los cargos' });
    }
  };
  const getCargoDescripcion = (id) => {
    const cargo = cargosLista.find(c => Number(c.id) === Number(id));
    return cargo ? cargo.descripcion : '';
  };

  /**
   * Carga las empresas desde el backend.
   * Utiliza la función getEmpresas para obtener los datos.
   * Si hay un error, muestra un toast con el mensaje de error.
   */
    // Cargar empresas
    const [empresasLista, setEmpresasLista] = useState([]);
    useEffect(() => {
      cargarEmpresas();
    }, []);
  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas();
      setEmpresasLista(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar las empresas' });
    }
  };

  const getEmpresaRazonSocial = (id) => {
    const empresa = empresasLista.find(e => Number(e.id) === Number(id));
    return empresa ? empresa.razonSocial : '';
  };

  const [sedesLista, setSedesLista] = useState([]);
  useEffect(() => {
    cargarSedes();
  }, []);
  const cargarSedes = async () => {
    try {
      const data = await getSedes();
      setSedesLista(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar las sedes' });
    }
  };
  const getSedeNombre = (id) => {
    const sede = sedesLista.find(s => Number(s.id) === Number(id));
    return sede ? sede.nombre : '';
  };

  const [areasFisicasLista, setAreasFisicasLista] = useState([]);
  useEffect(() => {
    cargarAreasFisicas();
  }, []);
  const cargarAreasFisicas = async () => {
    try {
      const data = await getAreasFisicas();
      setAreasFisicasLista(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar las áreas físicas' });
    }
  };
  const getAreaFisicaNombre = (id) => {
    const area = areasFisicasLista.find(a => Number(a.id) === Number(id));
    return area ? area.nombre : '';
  };



  // Carga inicial de personal
  useEffect(() => {
    cargarPersonal();
  }, []);

  const cargarPersonal = async () => {
    setLoading(true);
    try {
      const data = await getPersonal();
      setPersonales(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el personal' });
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de botones de acción
  const actionBodyTemplate = (rowData) => (
    <>
      <Button icon="pi pi-pencil" className="p-button-text p-mr-2" onClick={() => onEdit(rowData)} />
      <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => onDelete(rowData)} />
    </>
  );

  // Lógica para alta y edición
  const onNew = () => {
    setSelected(null);
    setIsEdit(false);
    setShowForm(true);
  };
  const onEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };
  const onDelete = (row) => {
    // Implementar lógica de borrado
    alert('Eliminar: ' + row.nombres + ' ' + row.apellidos);
  };
  const onCancel = () => setShowForm(false);
  
  /**
 * Maneja el alta o edición de personal.
 * Construye el payload profesional, registra logs y llama a la API según corresponda.
 * Cumple las reglas de logging y validación previas a producción.
 */
const onSubmit = async (data) => {
  setLoading(true);
  try {
    // Construir payload limpio solo con campos válidos para el backend
    // Payload profesional con todos los campos requeridos por el backend
    const personalPayload = {
      nombres: data.nombres,
      apellidos: data.apellidos,
      empresaId: data.empresaId ? Number(data.empresaId) : null,
      tipoDocumentoId: data.tipoDocumentoId ? Number(data.tipoDocumentoId) : null,
      numeroDocumento: data.numeroDocumento,
      fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento).toISOString() : null,
      fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso).toISOString() : null,
      cesado: !!data.cesado,
      telefono: data.telefono || null,
      correo: data.correo || null,
      urlFotoPersona: data.urlFotoPersona || null,
      tipoContratoId: data.tipoContratoId ? Number(data.tipoContratoId) : null,
      cargoId: data.cargoId ? Number(data.cargoId) : null,
      sedeEmpresaId: data.sedeEmpresaId ? Number(data.sedeEmpresaId) : null,
      areaFisicaId: data.areaFisicaId ? Number(data.areaFisicaId) : null,
    };
    if (isEdit && selected) {
      // Edición de personal existente
      await actualizarPersonal(selected.id, personalPayload);
      toast?.show({ severity: 'success', summary: 'Personal actualizado', detail: `El personal ${data.nombres} fue actualizado correctamente.` });
    } else {
      await crearPersonal(personalPayload);
      toast?.show({ severity: 'success', summary: 'Personal creado', detail: `El personal ${data.nombres} fue registrado correctamente.` });
    }
    setShowForm(false);
    cargarPersonal();
  } catch (err) {
if (err?.response?.data) {
  console.error('[PersonalPage] Respuesta de error backend:', JSON.stringify(err.response.data));
}
    toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el personal.' });
  } finally {
    setLoading(false);
  }
};

  // Conversión profesional de fechas para edición, fuera del JSX
  // Esto asegura que PrimeReact Calendar reciba objetos Date y evita errores de referencia.
  // Conversión profesional de fechas y campos para edición, fuera del JSX
  // Incluye todos los campos nuevos para que el formulario los reciba correctamente
  const selectedPersonal = selected
    ? {
        ...selected,
        fechaNacimiento: selected.fechaNacimiento ? new Date(selected.fechaNacimiento) : null,
        fechaIngreso: selected.fechaIngreso ? new Date(selected.fechaIngreso) : null,
        telefono: selected.telefono || '',
        correo: selected.correo || '',
        urlFotoPersona: selected.urlFotoPersona || '',
        tipoContratoId: selected.tipoContratoId ? String(selected.tipoContratoId) : '',
        cargoId: selected.cargoId ? String(selected.cargoId) : '',
        areaFisicaId: selected.areaFisicaId ? String(selected.areaFisicaId) : '',
        sedeEmpresaId: selected.sedeEmpresaId ? String(selected.sedeEmpresaId) : '',
      }
    : { cesado: false };

  return (
    <div className="p-m-4">
      <Toast ref={setToast} />
      <div className="p-d-flex p-jc-between p-ai-center p-mb-3">
        <h2>Gestión de Personal</h2>
        <Button label="Nuevo Personal" icon="pi pi-plus" onClick={onNew} />
      </div>
      <DataTable value={personales} loading={loading} paginator rows={10} selectionMode="single" selection={selected} onSelectionChange={e => setSelected(e.value)}>
        <Column field="nombres" header="Nombres" />
        <Column field="apellidos" header="Apellidos" />
        <Column
          header="Cargo"
          body={row => getCargoDescripcion(row.cargoId)}
        />
        <Column
          header="Empresa"
          body={row => getEmpresaRazonSocial(row.empresaId)}
        />
        <Column
          header="Sede Empresa"
          body={row => getSedeNombre(row.sedeEmpresaId)}
        />
        <Column
          header="Área Física"
          body={row => getAreaFisicaNombre(row.areaFisicaId)}
        />
        <Column field="cesado" header="Cesado" body={row => row.cesado ? 'Sí' : 'No'} />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      {/*
        El formulario de alta/edición de personal se muestra en un modal profesional (Dialog),
        cumpliendo la regla de UX para no mostrarlo debajo de la lista.
      */}
      <Dialog header={isEdit ? 'Editar Personal' : 'Nuevo Personal'} visible={showForm} style={{ width: '40vw', minWidth: 350 }} modal className="p-fluid" onHide={onCancel} closeOnEscape dismissableMask>
        <PersonalForm
          isEdit={isEdit}
          defaultValues={selectedPersonal}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
