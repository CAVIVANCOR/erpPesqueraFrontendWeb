// src/pages/CargosPersonal.jsx
// Pantalla profesional de gestión de cargos del personal para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { getCargosPersonal, crearCargoPersonal, actualizarCargoPersonal, eliminarCargoPersonal } from "../api/cargosPersonal";
import CargosPersonalForm from "../components/cargosPersonal/CargosPersonalForm";

/**
 * Página de gestión de cargos del personal.
 * - CRUD completo con integración API REST.
 * - Tabla con filtros, búsqueda y paginación avanzada.
 * - Formularios desacoplados con validación profesional.
 * - Feedback visual con Toast y loaders.
 * Documentado en español técnico.
 */
export default function CargosPersonal() {
  const toast = useRef(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargoEdit, setCargoEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => { cargarCargos(); }, []);

  async function cargarCargos() {
    setLoading(true);
    try {
      const data = await getCargosPersonal();
      setCargos(Array.isArray(data) ? data : (data.cargos || []));
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar los cargos del personal");
    } finally {
      setLoading(false);
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
        descripcion: data.descripcion,
        cesado: !!data.cesado
      };
      if (modoEdicion && cargoEdit) {
        console.log("[DEBUG] Payload limpio enviado a actualizarCargoPersonal:", payload);
        await actualizarCargoPersonal(cargoEdit.id, payload);
        mostrarToast("success", "Cargo actualizado", `El cargo fue actualizado correctamente.`);
      } else {
        await crearCargoPersonal(payload);
        mostrarToast("success", "Cargo creado", `El cargo fue registrado correctamente.`);
      }
      setMostrarDialogo(false);
      cargarCargos();
    } catch (err) {
      mostrarToast("error", "Error", err?.response?.data?.error || "No se pudo guardar el cargo.");
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(cargo) {
    setCargoEdit(cargo);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  async function handleEliminar(cargo) {
    if (!window.confirm("¿Está seguro que desea eliminar este cargo?")) return;
    setLoading(true);
    try {
      await eliminarCargoPersonal(cargo.id);
      mostrarToast("success", "Cargo eliminado", `El cargo fue eliminado correctamente.`);
      cargarCargos();
    } catch (err) {
      mostrarToast("error", "Error", err?.response?.data?.error || "No se pudo eliminar el cargo.");
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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Cargos del Personal</h2>
        <Button label="Nuevo Cargo" icon="pi pi-plus" onClick={() => { setCargoEdit(null); setModoEdicion(false); setMostrarDialogo(true); }} />
      </div>
      <DataTable
        value={cargos}
        loading={loading}
        paginator rows={10} rowsPerPageOptions={[5, 10, 20]}
        globalFilter={globalFilter}
        stripedRows
        emptyMessage="No hay cargos registrados."
        header={
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText type="search" onInput={e => setGlobalFilter(e.target.value)} placeholder="Buscar cargos..." style={{ width: 240 }} />
          </span>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="descripcion" header="Descripción" />
        <Column field="cesado" header="¿Cesado?" body={rowData => rowData.cesado ? 'Sí' : 'No'} />
        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: 150, textAlign: 'center' }} />
      </DataTable>
      <Dialog header={modoEdicion ? "Editar Cargo" : "Nuevo Cargo"} visible={mostrarDialogo} style={{ width: 500 }} modal onHide={() => setMostrarDialogo(false)}>
        <CargosPersonalForm
          isEdit={modoEdicion}
          defaultValues={cargoEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
        />
      </Dialog>
    </div>
  );
}
