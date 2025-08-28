/**
 * Pantalla CRUD para gestión de Parámetros Aprobador
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por personal responsable, módulo sistema
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import {
  getParametrosAprobador,
  eliminarParametroAprobador,
} from "../api/parametroAprobador";
import { getPersonal } from "../api/personal";
import { getModulos } from "../api/moduloSistema";
import { getEmpresas } from "../api/empresa";
import { getEmbarcaciones } from "../api/embarcacion";
import { getActivos } from "../api/activo";
import { getSedes } from "../api/sedes";
import { useAuthStore } from "../shared/stores/useAuthStore";
import ParametroAprobadorForm from "../components/parametroAprobador/ParametroAprobadorForm";
import { getResponsiveFontSize } from "../utils/utils";

const ParametroAprobador = () => {
  const [parametrosAprobador, setParametrosAprobador] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [modulosSistema, setModulosSistema] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [activos, setActivos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [parametroSeleccionado, setParametroSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [parametroAEliminar, setParametroAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");
  const [filtroModuloSistema, setFiltroModuloSistema] = useState(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroEmbarcacion, setFiltroEmbarcacion] = useState(null);

  const opcionesModuloSistema = modulosSistema.map((modulo) => ({
    label: modulo.nombre,
    value: modulo.id,
  }));
  const opcionesEmpresa = empresas.map((empresa) => ({
    label: empresa.razonSocial,
    value: empresa.id,
  }));
  const opcionesEmbarcacion = embarcaciones
    .map((embarcacion) => {
      const activo = activos.find(
        (a) => Number(embarcacion.activoId) === Number(a.id)
      );
      return activo
        ? {
            label: activo.nombre,
            value: Number(embarcacion.id),
          }
        : null;
    })
    .filter(Boolean);

  useEffect(() => {
    cargarParametrosAprobador();
    cargarDatosCombos();
  }, []);

  const cargarDatosCombos = async () => {
    try {
      setLoading(true);
      const [
        personalData,
        modulosData,
        empresasData,
        embarcacionesData,
        activosData,
        sedesData,
      ] = await Promise.all([
        getPersonal(),
        getModulos(),
        getEmpresas(),
        getEmbarcaciones(),
        getActivos(),
        getSedes(),
      ]);

      setPersonal(personalData);
      setModulosSistema(modulosData);
      setEmpresas(empresasData);
      setEmbarcaciones(embarcacionesData);
      setActivos(activosData);
      setSedes(sedesData);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos de combos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarParametrosAprobador = async () => {
    try {
      setLoading(true);
      const data = await getParametrosAprobador();
      setParametrosAprobador(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar parámetros aprobador",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setParametroSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (parametro) => {
    setParametroSeleccionado(parametro);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setParametroSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarParametrosAprobador();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: parametroSeleccionado
        ? "Parámetro aprobador actualizado correctamente"
        : "Parámetro aprobador creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (parametro) => {
    setParametroAEliminar(parametro);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarParametroAprobador(parametroAEliminar.id);
      setParametrosAprobador(
        parametrosAprobador.filter(
          (p) => Number(parametroAEliminar.id) !== Number(p.id)
        )
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Parámetro aprobador eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar parámetro aprobador",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setParametroAEliminar(null);
    }
  };

  const personalTemplate = (rowData) => {
    const personalResp = personal.find(
      (p) => Number(rowData.personalRespId) === Number(p.id)
    );
    return personalResp
      ? `${personalResp.nombres} ${personalResp.apellidos}`
      : "N/A";
  };

  const moduloSistemaTemplate = (rowData) => {
    const modulo = modulosSistema.find(
      (m) => Number(rowData.moduloSistemaId) === Number(m.id)
    );
    return modulo?.nombre || "N/A";
  };

  const empresaTemplate = (rowData) => {
    const empresa = empresas.find(
      (e) => Number(rowData.empresaId) === Number(e.id)
    );
    return empresa?.razonSocial || "N/A";
  };

  const embarcacionTemplate = (rowData) => {
    if (!rowData.embarcacionId) return "N/A";
    const embarcacion = embarcaciones.find(
      (e) => Number(rowData.embarcacionId) === Number(e.id)
    );
    const activo = activos.find(
      (a) => Number(embarcacion.activoId) === Number(a.id)
    );
    return activo?.nombre || "N/A";
  };

  const sedeTemplate = (rowData) => {
    if (!rowData.sedeId) return "N/A";
    const sede = sedes.find((s) => Number(rowData.sedeId) === Number(s.id));
    return sede?.nombre || "N/A";
  };

  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    return fecha ? new Date(fecha).toLocaleDateString("es-ES") : "N/A";
  };

  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "CESADO" : "ACTIVO"}
        severity={rowData.cesado ? "danger" : "success"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const limpiarFiltros = () => {
    setFiltroModuloSistema(null);
    setFiltroEmpresa(null);
    setFiltroEmbarcacion(null);
    setGlobalFilter("");
  };

  // Función para filtrar datos
  const datosFiltrados = parametrosAprobador.filter((parametro) => {
    const cumpleFiltroModulo =
      !filtroModuloSistema ||
      Number(parametro.moduloSistemaId) === Number(filtroModuloSistema);
    const cumpleFiltroEmpresa =
      !filtroEmpresa || Number(parametro.empresaId) === Number(filtroEmpresa);
    const cumpleFiltroEmbarcacion =
      !filtroEmbarcacion ||
      Number(parametro.embarcacionId) === Number(filtroEmbarcacion);

    return cumpleFiltroModulo && cumpleFiltroEmpresa && cumpleFiltroEmbarcacion;
  });

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={datosFiltrados}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron parámetros aprobador"
        globalFilter={globalFilter}
        globalFilterFields={["personalRespId", "moduloSistemaId", "empresaId"]}
        header={
          <div className="flex align-items-center gap-2">
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div
                style={{ flex: 2, display: "flex", flexDirection: "column" }}
              >
                <h2>Gestión de Parámetros Aprobador</h2>
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  size="small"
                  raised
                  tooltip="Nuevo Parámetro Aprobador"
                  outlined
                  className="p-button-success"
                  onClick={abrirDialogoNuevo}
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <span className="p-input-icon-left">
                  <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar parámetros..."
                    style={{ width: "300px" }}
                  />
                </span>
              </div>
            </div>

            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Dropdown
                  value={filtroModuloSistema}
                  options={opcionesModuloSistema}
                  onChange={(e) => setFiltroModuloSistema(e.value)}
                  placeholder="Filtrar por Módulo Sistema"
                  showClear
                  style={{ minWidth: "200px" }}
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Dropdown
                  value={filtroEmpresa}
                  options={opcionesEmpresa}
                  onChange={(e) => setFiltroEmpresa(e.value)}
                  placeholder="Filtrar por Empresa"
                  showClear
                  style={{ minWidth: "200px" }}
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Dropdown
                  value={filtroEmbarcacion}
                  options={opcionesEmbarcacion}
                  onChange={(e) => setFiltroEmbarcacion(e.value)}
                  placeholder="Filtrar por Embarcación"
                  showClear
                  style={{ minWidth: "200px" }}
                />
              </div>
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-outlined p-button-secondary"
                  size="small"
                  onClick={limpiarFiltros}
                />
              </div>
            </div>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column
          header="Personal Responsable"
          body={personalTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Módulo Sistema"
          body={moduloSistemaTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Empresa"
          body={empresaTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Embarcación"
          body={embarcacionTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Sede"
          body={sedeTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Vigente Desde"
          body={(rowData) => fechaTemplate(rowData, "vigenteDesde")}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="Vigente Hasta"
          body={(rowData) => fechaTemplate(rowData, "vigenteHasta")}
          sortable
          style={{ minWidth: "80px" }}
        />
        <Column
          header="Estado"
          body={cesadoTemplate}
          sortable
          style={{ width: "80px" }}
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          parametroSeleccionado
            ? "Editar Parámetro Aprobador"
            : "Nuevo Parámetro Aprobador"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "800px" }}
        modal
      >
        <ParametroAprobadorForm
          parametroAprobador={parametroSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el parámetro aprobador con ID "${parametroAEliminar?.id}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />
    </div>
  );
};

export default ParametroAprobador;
