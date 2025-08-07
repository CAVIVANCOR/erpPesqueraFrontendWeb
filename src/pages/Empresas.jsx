// src/pages/Empresas.jsx
// Pantalla profesional de gestión de empresas para el ERP Megui.
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
import { getEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa } from "../api/empresa";
import EmpresaForm from "../components/empresas/EmpresaForm";

/**
 * Página de gestión de empresas.
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
export default function Empresas() {
  const usuario = useAuthStore(state => state.usuario);
  const [confirmState, setConfirmState] = useState({ visible: false, row: null });
  // Referencia para Toast de notificaciones
  const toast = useRef(null);

  // Estado para la lista de empresas
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empresaEdit, setEmpresaEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Carga inicial de empresas
  useEffect(() => {
    cargarEmpresas();
  }, []);

  // Función para cargar empresas del backend
  async function cargarEmpresas() {
    setLoading(true);
    try {
      const data = await getEmpresas();
      setEmpresas(Array.isArray(data) ? data : (data.empresas || []));
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las empresas");
    } finally {
      setLoading(false);
    }
  }

  // Muestra notificación Toast
  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  // Maneja el submit del formulario (alta o edición)
  async function onSubmitForm(data) {
    setFormLoading(true);
    try {
      // Filtrado profesional del payload: solo los campos válidos para el modelo Prisma
      const payload = {
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial,
        ruc: data.ruc,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        cesado: !!data.cesado,
        cuentaDetraccion: data.cuentaDetraccion,
        rutaArchivosAdjuntos: data.rutaArchivosAdjuntos,
        rutaReportesGenerados: data.rutaReportesGenerados,
        soyAgenteRetencion: !!data.soyAgenteRetencion,
        soyAgentePercepcion: !!data.soyAgentePercepcion,
        porcentajeIgv: data.porcentajeIgv,
        porcentajeRetencion: data.porcentajeRetencion,
        montoMinimoRetencion: data.montoMinimoRetencion,
        representantelegalId: data.representantelegalId,
        logo: data.logo,
      };
      if (modoEdicion && empresaEdit) {
        await actualizarEmpresa(empresaEdit.id, payload);
        mostrarToast("success", "Empresa actualizada", `La empresa fue actualizada correctamente.`);
      } else {
        await crearEmpresa(payload);
        mostrarToast("success", "Empresa creada", `La empresa fue registrada correctamente.`);
      }
      setMostrarDialogo(false);
      cargarEmpresas();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo guardar la empresa.");
    } finally {
      setFormLoading(false);
    }
  }

  // Maneja la edición
  function handleEditar(empresa) {
    setEmpresaEdit(empresa);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEditar(e.data);
  }

  // Maneja la eliminación
  function handleEliminar(empresa) {
    setConfirmState({ visible: true, row: empresa });
  }

  const handleConfirmDelete = async () => {
    const empresa = confirmState.row;
    if (!empresa) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarEmpresa(empresa.id);
      mostrarToast("success", "Empresa eliminada", `La empresa fue eliminada correctamente.`);
      cargarEmpresas();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo eliminar la empresa.");
    } finally {
      setLoading(false);
    }
  }

  // Renderiza los botones de acción en cada fila
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
        <h2>Empresas</h2>
        <Button label="Nueva Empresa" icon="pi pi-plus" onClick={() => { setEmpresaEdit(null); setModoEdicion(false); setMostrarDialogo(true); }} />
      </div>
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={<span style={{ color: '#b71c1c', fontWeight: 600 }}>
          ¿Está seguro que desea <span style={{ color: '#b71c1c' }}>eliminar</span> la empresa <b>{confirmState.row ? confirmState.row.razonSocial : ''}</b>?<br/>
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
        value={empresas}
        loading={loading}
        paginator rows={10} rowsPerPageOptions={[5, 10, 20]}
        globalFilter={globalFilter}
        stripedRows
        emptyMessage="No hay empresas registradas."
        header={
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText type="search" onInput={e => setGlobalFilter(e.target.value)} placeholder="Buscar empresas..." style={{ width: 240 }} />
          </span>
        }
        onRowClick={onRowClick}
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="razonSocial" header="Razón Social" />
        <Column field="nombreComercial" header="Nombre Comercial" />
        <Column field="ruc" header="RUC" />
        <Column field="telefono" header="Teléfono" />
        <Column field="email" header="Email" />
        <Column field="cesado" header="¿Cesada?" body={rowData => rowData.cesado ? 'Sí' : 'No'} />
        <Column header="Acciones" body={accionesTemplate} style={{ minWidth: 150, textAlign: 'center' }} />
      </DataTable>
      <Dialog header={modoEdicion ? "Editar Empresa" : "Nueva Empresa"} visible={mostrarDialogo} style={{ width: 600 }} modal onHide={() => setMostrarDialogo(false)}>
        {/*
          Se asegura que defaultValues siempre tenga empresaId, ya que el combo de personal lo requiere.
          En edición, mapea empresaEdit.id a empresaId. En alta, se puede definir empresaId si hay contexto padre.
        */}
        <EmpresaForm
          isEdit={modoEdicion}
          defaultValues={
            empresaEdit
              ? { ...empresaEdit, empresaId: empresaEdit.id }
              : {}
          }
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
        />
      </Dialog>
    </div>
  );
}
