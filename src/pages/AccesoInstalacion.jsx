// src/pages/AccesoInstalacion.jsx
// Pantalla CRUD profesional para AccesoInstalacion. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import AccesoInstalacionForm from "../components/accesoInstalacion/AccesoInstalacionForm";
import SalidaDialog from "../components/accesoInstalacion/SalidaDialog";
import {
  getAllAccesoInstalacion,
  crearAccesoInstalacion,
  actualizarAccesoInstalacion,
  eliminarAccesoInstalacion,
} from "../api/accesoInstalacion";
import { getEmpresas } from "../api/empresa";
import { getSedes } from "../api/sedes";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { InputText } from "primereact/inputtext";

/**
 * Pantalla profesional para gestión de Accesos a Instalaciones.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function AccesoInstalacion() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados globales para Empresa y Sede (filtrado y creación)
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [sedesFiltradas, setSedesFiltradas] = useState([]);
  const [showSalidaDialog, setShowSalidaDialog] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const cargarDatos = async () => {
      if (isMounted) {
        await cargarDatosIniciales();
      }
    };

    cargarDatos();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Cargar datos iniciales (empresas, sedes y items)
  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Cargar empresas
      const empresasData = await getEmpresas();
      if (empresasData && Array.isArray(empresasData)) {
        setEmpresas(empresasData.map((e) => ({ ...e, id: Number(e.id) })));
      }

      // Cargar todas las sedes
      const sedesData = await getSedes();

      if (sedesData && Array.isArray(sedesData)) {
        setSedes(
          sedesData.map((s) => ({
            ...s,
            id: Number(s.id),
            empresaId: Number(s.empresaId),
          }))
        );
      }

      // Cargar items
      await cargarItems();
    } catch (err) {
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los datos iniciales.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para filtrar sedes cuando cambia la empresa seleccionada
  useEffect(() => {
    if (empresaSeleccionada) {
      const sedesFiltradas = sedes.filter(
        (sede) => sede.empresaId === Number(empresaSeleccionada)
      );
      setSedesFiltradas(sedesFiltradas);

      // Si la sede actual no pertenece a la empresa seleccionada, limpiarla
      if (
        sedeSeleccionada &&
        !sedesFiltradas.find((s) => s.id === Number(sedeSeleccionada))
      ) {
        setSedeSeleccionada(null);
      }
    } else {
      setSedesFiltradas([]);
      setSedeSeleccionada(null);
    }
  }, [empresaSeleccionada, sedes, sedeSeleccionada]);

  // Efecto para recargar datos cuando cambien los filtros
  useEffect(() => {
    // Solo recargar si ya se han cargado los datos iniciales
    if (empresas.length > 0 && sedes.length > 0) {
      cargarItems();
    }
  }, [empresaSeleccionada, sedeSeleccionada]);

  const cargarItems = async () => {
    setLoading(true);
    try {
      let data = await getAllAccesoInstalacion();
      // Verificar que data sea un array válido
      if (!data || !Array.isArray(data)) {
        setItems([]);
        return;
      }

      // Ordenar por fecha más reciente primero (fechaHora descendente)
      data = data.sort((a, b) => {
        const fechaA = new Date(a.fechaHora || a.createdAt);
        const fechaB = new Date(b.fechaHora || b.createdAt);
        return fechaB - fechaA; // Orden descendente (más reciente primero)
      });

      // Aplicar filtros por empresa y sede si están seleccionados
      if (empresaSeleccionada) {
        data = data.filter(
          (item) => item.empresaId === Number(empresaSeleccionada)
        );
      }
      if (sedeSeleccionada) {
        data = data.filter((item) => item.sedeId === Number(sedeSeleccionada));
      }
      setItems(data);
    } catch (err) {
      setItems([]); // Establecer array vacío en caso de error

      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar la lista de accesos.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  /**
   * Manejar registro encontrado desde SalidaDialog
   * Abre el formulario de edición con el registro encontrado
   */
  const handleRegistroEncontrado = (registro) => {
    setEditing(registro);
    setShowDialog(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarAccesoInstalacion(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el registro.",
      });
    }
    setLoading(false);
    setShowConfirm(false);
    setToDelete(null);
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarAccesoInstalacion(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearAccesoInstalacion(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el registro.",
      });
    }
    setLoading(false);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-rounded"
          onClick={(ev) => {
            ev.stopPropagation();
            handleEdit(rowData);
          }}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger p-button-rounded"
            onClick={(ev) => {
              ev.stopPropagation();
              handleDelete(rowData);
            }}
            tooltip="Eliminar Registro"
          />
        )}
      </div>
    );
  };

  const fechaHoraBodyTemplate = (rowData) => {
    if (!rowData.fechaHora) return "";
    const fecha = new Date(rowData.fechaHora);
    const fechaFormateada = fecha.toLocaleDateString("es-ES");
    const horaFormateada = fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${fechaFormateada} ${horaFormateada}`;
  };

  // Efecto para recargar items cuando cambien los filtros
  useEffect(() => {
    if (empresas.length > 0) {
      // Solo recargar si ya se cargaron las empresas
      cargarItems();
    }
  }, [empresaSeleccionada, sedeSeleccionada]);

  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        value={items}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="p-datatable-gridlines"
        showGridlines
        size="small"
        emptyMessage={
          empresaSeleccionada || sedeSeleccionada
            ? `No se encontraron registros para los filtros aplicados${
                empresaSeleccionada
                  ? ` (Empresa: ${
                      empresas.find((e) => e.id === empresaSeleccionada)
                        ?.razonSocial || "N/A"
                    })`
                  : ""
              }${
                sedeSeleccionada
                  ? ` (Sede: ${
                      sedesFiltradas.find((s) => s.id === sedeSeleccionada)
                        ?.nombre || "N/A"
                    })`
                  : ""
              }`
            : "No se encontraron registros. Seleccione empresa y sede para ver los accesos."
        }
        onRowClick={(e) => handleEdit(e.data)}
        header={
          <div className="flex align-items-center gap-2">
            <div>
              <h2>Registro de Accesos a Instalaciones</h2>
              <small className="text-500">
                {items.length} registro{items.length !== 1 ? "s" : ""}
                {(empresaSeleccionada || sedeSeleccionada) && (
                  <span className="text-primary">
                    {empresaSeleccionada &&
                      ` | Empresa: ${
                        empresas.find((e) => e.id === empresaSeleccionada)
                          ?.razonSocial || "N/A"
                      }`}
                    {sedeSeleccionada &&
                      ` | Sede: ${
                        sedesFiltradas.find((s) => s.id === sedeSeleccionada)
                          ?.nombre || "N/A"
                      }`}
                  </span>
                )}
              </small>
            </div>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className={
                !empresaSeleccionada || !sedeSeleccionada
                  ? "p-button-secondary p-button-outlined"
                  : "p-button-success p-button-outlined"
              }
              size="small"
              disabled={!empresaSeleccionada || !sedeSeleccionada}
              style={{
                opacity: !empresaSeleccionada || !sedeSeleccionada ? 0.5 : 1,
                cursor:
                  !empresaSeleccionada || !sedeSeleccionada
                    ? "not-allowed"
                    : "pointer",
                backgroundColor:
                  !empresaSeleccionada || !sedeSeleccionada ? "#f8f9fa" : "",
                borderColor:
                  !empresaSeleccionada || !sedeSeleccionada ? "#dee2e6" : "",
                color:
                  !empresaSeleccionada || !sedeSeleccionada ? "#6c757d" : "",
              }}
              onClick={() => {
                setEditing(null);
                setShowDialog(true);
              }}
              tooltip={
                !empresaSeleccionada || !sedeSeleccionada
                  ? "Seleccione empresa y sede para crear un nuevo acceso"
                  : "Crear nuevo acceso"
              }
            />
            <Button
              label="Salida"
              icon="pi pi-sign-out"
              className="p-button-warning p-button-outlined"
              size="small"
              onClick={() => {
                setShowSalidaDialog(true);
              }}
              tooltip="Procesar salida de visitante"
            />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar accesos..."
              style={{ width: "300px" }}
            />
            {/* Panel de Filtros Globales */}
            <label htmlFor="empresaFiltro" className="font-bold">
              Empresa *
            </label>
            <Dropdown
              id="empresaFiltro"
              value={empresaSeleccionada}
              options={empresas}
              onChange={(e) => setEmpresaSeleccionada(e.value)}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder="Seleccione una empresa"
              className="w-full"
              showClear
            />
            <label htmlFor="sedeFiltro" className="font-bold">
              Sede *
            </label>
            <Dropdown
              id="sedeFiltro"
              value={sedeSeleccionada}
              options={sedesFiltradas}
              onChange={(e) => setSedeSeleccionada(e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccione una sede"
              className="w-full"
              disabled={!empresaSeleccionada}
              showClear
            />
          </div>
        }
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        scrollable
        scrollHeight="600px"
      >
        <Column field="nombrePersona" header="Persona" sortable />
        <Column field="tipoAcceso.nombre" header="Tipo Acceso" sortable />
        <Column
          field="fechaHora"
          header="Fecha y Hora"
          sortable
          body={fechaHoraBodyTemplate}
        />
        <Column field="numeroDocumento" header="Documento" sortable />
        <Column field="vehiculoNroPlaca" header="Placa" sortable />
        <Column field="motivoAcceso.descripcion" header="Motivo" sortable />
        <Column field="tipoPersona.nombre" header="Tipo Persona" sortable />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={showDialog}
        style={{
          width: "90vw",
          maxWidth: "800px",
          margin: "0 auto",
        }}
        header={
          editing ? "Editar Acceso a Instalación" : "Nuevo Acceso a Instalación"
        }
        modal
        className="p-fluid dialog-responsive"
        onHide={() => {
          setShowDialog(false);
          setEditing(null);
        }}
        breakpoints={{ "960px": "90vw", "640px": "95vw" }}
        draggable={false}
        resizable={false}
      >
        <AccesoInstalacionForm
          item={editing}
          onSave={handleSave}
          onCancel={() => {
            setShowDialog(false);
            setEditing(null);
          }}
          empresaId={empresaSeleccionada}
          sedeId={sedeSeleccionada}
        />
      </Dialog>

      <Dialog
        visible={showSalidaDialog}
        style={{
          width: "90vw",
          maxWidth: "800px",
          margin: "0 auto",
        }}
        header="Procesar Salida de Visitante"
        modal
        className="p-fluid dialog-responsive"
        onHide={() => {
          setShowSalidaDialog(false);
        }}
        breakpoints={{ "960px": "90vw", "640px": "95vw" }}
        draggable={false}
        resizable={false}
      >
        <SalidaDialog 
          onClose={() => setShowSalidaDialog(false)}
          onRegistroEncontrado={handleRegistroEncontrado}
          toast={toast}
        />
      </Dialog>

      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro de que desea eliminar este registro?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={confirmDelete}
        reject={() => {
          setShowConfirm(false);
          setToDelete(null);
        }}
        acceptClassName="p-button-danger"
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
      />
    </div>
  );
}
