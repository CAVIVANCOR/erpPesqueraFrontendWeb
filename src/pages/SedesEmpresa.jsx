// src/pages/SedesEmpresa.jsx
// Pantalla profesional de gestión de sedes de empresa para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { getSedes, crearSede, actualizarSede, eliminarSede } from "../api/sedes";
import { getEmpresas } from "../api/empresa";
import SedeForm from "../components/sedes/SedeForm";

/**
 * Página de gestión de sedes de empresa.
 * - CRUD completo con integración API REST.
 * - Tabla con filtros, búsqueda y paginación avanzada.
 * - Formularios desacoplados con validación profesional.
 * - Feedback visual con Toast y loaders.
 * Documentado en español técnico.
 */
export default function SedesEmpresa() {
  const toast = useRef(null);
  const [sedes, setSedes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sedeEdit, setSedeEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Carga inicial de sedes y empresas
  useEffect(() => {
    cargarSedes();
    cargarEmpresas();
  }, []);

  async function cargarSedes() {
    setLoading(true);
    try {
      const data = await getSedes();
      setSedes(Array.isArray(data) ? data : (data.sedes || []));
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las sedes");
    } finally {
      setLoading(false);
    }
  }

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
      // Filtrado profesional del payload: solo los campos válidos para el modelo Prisma
      const payload = {
        empresaId: typeof data.empresaId === "string" ? Number(data.empresaId) : data.empresaId,
        nombre: data.nombre,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        cesado: !!data.cesado,
      };
      if (modoEdicion && sedeEdit) {
        // Log profesional para depuración: muestra el objeto limpio enviado al backend
        console.log("[DEBUG] Payload limpio enviado a actualizarSede:", payload);
        await actualizarSede(sedeEdit.id, payload);
        mostrarToast("success", "Sede actualizada", `La sede fue actualizada correctamente.`);
      } else {
        // Log profesional para depuración en alta
        console.log("[DEBUG] Payload limpio enviado a crearSede:", payload);
        await crearSede(payload);
        mostrarToast("success", "Sede creada", `La sede fue registrada correctamente.`);
      }
      setMostrarDialogo(false);
      cargarSedes();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo guardar la sede.");
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(sede) {
    setSedeEdit(sede);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  async function handleEliminar(sede) {
    if (!window.confirm("¿Está seguro que desea eliminar esta sede?")) return;
    setLoading(true);
    try {
      await eliminarSede(sede.id);
      mostrarToast("success", "Sede eliminada", `La sede fue eliminada correctamente.`);
      cargarSedes();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo eliminar la sede.");
    } finally {
      setLoading(false);
    }
  }

  const accionesTemplate = (rowData) => (
    <span>
      <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-info" style={{ marginRight: 8 }} onClick={() => handleEditar(rowData)} tooltip="Editar" />
      <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger" onClick={() => handleEliminar(rowData)} tooltip="Eliminar" />
    </span>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Sedes de Empresa</h2>
        <Button label="Nueva Sede" icon="pi pi-plus" onClick={() => { setSedeEdit(null); setModoEdicion(false); setMostrarDialogo(true); }} />
      </div>
      <DataTable
        value={sedes}
        loading={loading}
        paginator rows={10} rowsPerPageOptions={[5, 10, 20]}
        globalFilter={globalFilter}
        onGlobalFilterChange={e => setGlobalFilter(e.target.value)}
        responsiveLayout="scroll"
        stripedRows
        emptyMessage="No hay sedes registradas."
        header={
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText type="search" onInput={e => setGlobalFilter(e.target.value)} placeholder="Buscar sedes..." style={{ width: 240 }} />
          </span>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="nombre" header="Nombre" />
        <Column field="empresa.razonSocial" header="Empresa" body={rowData => rowData.empresa?.razonSocial} />
        <Column field="direccion" header="Dirección" />
        <Column field="telefono" header="Teléfono" />
        <Column field="email" header="Email" />
        <Column field="cesado" header="¿Cesada?" body={rowData => rowData.cesado ? 'Sí' : 'No'} />
        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: 150, textAlign: 'center' }} />
      </DataTable>
      <Dialog header={modoEdicion ? "Editar Sede" : "Nueva Sede"} visible={mostrarDialogo} style={{ width: 600 }} modal onHide={() => setMostrarDialogo(false)}>
        <SedeForm
          isEdit={modoEdicion}
          defaultValues={sedeEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          empresas={empresas}
        />
      </Dialog>
    </div>
  );
}
