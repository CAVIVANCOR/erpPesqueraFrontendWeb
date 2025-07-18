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
import { Dialog } from 'primereact/dialog';

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
    console.log('[PersonalPage] Payload limpio a enviar:', personalPayload);
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
    console.error('[PersonalPage] Error al guardar personal:', err, err?.response?.data);
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
        <Column field="numeroDocumento" header="N° Documento" />
        <Column field="telefono" header="Teléfono" />
        <Column field="correo" header="Correo" />
        <Column field="empresaId" header="Empresa" />
        <Column field="tipoContratoId" header="Tipo Contrato" />
        <Column field="cargoId" header="Cargo" />
        <Column field="areaFisicaId" header="Área Física" />
        <Column field="sedeEmpresaId" header="Sede Empresa" />
        <Column field="fechaIngreso" header="Ingreso" />
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
