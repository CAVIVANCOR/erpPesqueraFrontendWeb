// src/pages/AreasFisicasSede.jsx
// Pantalla profesional de gestión de áreas físicas de sede para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from '../shared/stores/useAuthStore';
import { InputText } from "primereact/inputtext";
import { getAreasFisicas, crearAreaFisica, actualizarAreaFisica, eliminarAreaFisica } from "../api/areasFisicas";
import { getSedes } from "../api/sedes";
import { getEmpresas } from "../api/empresa"; // Importa la API profesional de empresas
import AreaFisicaForm from "../components/areasFisicas/AreaFisicaForm";

/**
 * Página de gestión de áreas físicas de sede.
 * - CRUD completo con integración API REST.
 * - Tabla con filtros, búsqueda y paginación avanzada.
 * - Formularios desacoplados con validación profesional.
 * - Feedback visual con Toast y loaders.
 * Documentado en español técnico.
 */
/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin).
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 */
export default function AreasFisicasSede() {
  const usuario = useAuthStore(state => state.usuario);
  const [confirmState, setConfirmState] = useState({ visible: false, row: null });
  const toast = useRef(null);
  const [areas, setAreas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [empresas, setEmpresas] = useState([]); // Estado profesional para empresas
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [areaEdit, setAreaEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Carga inicial de áreas físicas, sedes y empresas
  useEffect(() => {
    cargarAreas();
    cargarSedes();
    cargarEmpresas(); // Carga profesional de empresas
  }, []);

  async function cargarAreas() {
    setLoading(true);
    try {
      const data = await getAreasFisicas();
      setAreas(Array.isArray(data) ? data : (data.areas || []));
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las áreas físicas");
    } finally {
      setLoading(false);
    }
  }

  async function cargarSedes() {
    try {
      const data = await getSedes();
      setSedes(Array.isArray(data) ? data : (data.sedes || []));
    } catch (err) {
      setSedes([]);
    }
  }

  /**
   * Carga todas las empresas desde la API profesional.
   * Se usa para poblar el combo dependiente en el formulario de área física.
   */
  async function cargarEmpresas() {
    try {
      const data = await getEmpresas();
      setEmpresas(Array.isArray(data) ? data : (data.empresas || []));
    } catch (err) {
      setEmpresas([]);
    }
  }

  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  async function onSubmitForm(data) {
    setFormLoading(true);
    try {
      if (modoEdicion && areaEdit) {
        // Filtrado profesional del payload: solo se envían los campos válidos según el modelo Prisma
      // Esto evita errores de backend por campos desconocidos (id, empresaId, createdAt, updatedAt, sede)
      const { sedeId, nombre, descripcion, cesado } = data;
      const payload = {
        sedeId: typeof sedeId === "string" ? Number(sedeId) : sedeId,
        nombre,
        descripcion,
        cesado,
      };
      // Log profesional para depuración: muestra el payload limpio enviado al backend
      await actualizarAreaFisica(areaEdit.id, payload);
        mostrarToast("success", "Área actualizada", `El área física fue actualizada correctamente.`);
      } else {
        // Elimina empresaId del payload porque no existe en el modelo Prisma
      const { empresaId, ...dataSinEmpresa } = data;
      // Log profesional para depuración: muestra el objeto enviado al backend en alta
      await crearAreaFisica(dataSinEmpresa);
        mostrarToast("success", "Área creada", `El área física fue registrada correctamente.`);
      }
      setMostrarDialogo(false);
      cargarAreas();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo guardar el área física.");
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(area) {
    setAreaEdit(area);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEditar(e.data);
  }

  function handleEliminar(area) {
    setConfirmState({ visible: true, row: area });
  }

  const handleConfirmDelete = async () => {
    const area = confirmState.row;
    if (!area) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarAreaFisica(area.id);
      mostrarToast("success", "Área eliminada", `El área física fue eliminada correctamente.`);
      cargarAreas();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo eliminar el área física.");
    } finally {
      setLoading(false);
    }
  }

  const accionesTemplate = (rowData) => (
    <span>
      <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-info" style={{ marginRight: 8 }} onClick={e => { e.stopPropagation(); handleEditar(rowData); }} tooltip="Editar" />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger" onClick={e => { e.stopPropagation(); handleEliminar(rowData); }} tooltip="Eliminar" />
      )}
    </span>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Áreas Físicas de Sede</h2>
        <Button label="Nueva Área" icon="pi pi-plus" onClick={() => { setAreaEdit(null); setModoEdicion(false); setMostrarDialogo(true); }} />
      </div>
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={<span style={{ color: '#b71c1c', fontWeight: 600 }}>
          ¿Está seguro que desea <span style={{ color: '#b71c1c' }}>eliminar</span> el área <b>{confirmState.row ? confirmState.row.nombre : ''}</b>?<br/>
          <span style={{ fontWeight: 400, color: '#b71c1c' }}>Esta acción no se puede deshacer.</span>
        </span>}
        header={<span style={{ color: '#b71c1c' }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={areas}
        loading={loading}
        paginator rows={10} rowsPerPageOptions={[5, 10, 20]}
        globalFilter={globalFilter}
        stripedRows
        emptyMessage="No hay áreas físicas registradas."
        header={
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText type="search" onInput={e => setGlobalFilter(e.target.value)} placeholder="Buscar áreas..." style={{ width: 240 }} />
          </span>
        }
        onRowClick={onRowClick}
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="nombre" header="Nombre" />
        <Column field="sede.nombre" header="Sede" body={rowData => rowData.sede?.nombre} />
        <Column field="descripcion" header="Descripción" />
        <Column field="cesado" header="¿Cesada?" body={rowData => rowData.cesado ? 'Sí' : 'No'} />
        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: 150, textAlign: 'center' }} />
      </DataTable>
      <Dialog header={modoEdicion ? "Editar Área" : "Nueva Área"} visible={mostrarDialogo} style={{ width: 600 }} modal onHide={() => setMostrarDialogo(false)}>
        {/*
          Se usa useMemo para evitar que el array de empresas cambie de referencia en cada render,
          lo que puede causar que PrimeReact Dropdown pierda la selección visual.
        */}
        <AreaFisicaForm
          isEdit={modoEdicion}
          defaultValues={areaEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          empresas={React.useMemo(() => empresas, [empresas])}
          sedes={sedes}
        />
      </Dialog>
    </div>
  );
}
