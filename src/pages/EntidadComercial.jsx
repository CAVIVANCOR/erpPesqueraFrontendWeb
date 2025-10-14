/**
 * Pantalla CRUD para gestión de Entidades Comerciales
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Filtros profesionales: Empresa, Tipo de Entidad, Forma de Pago, Agentes de Retención
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
import { Dropdown } from "primereact/dropdown";
import {
  getEntidadesComerciales,
  eliminarEntidadComercial,
} from "../api/entidadComercial";
import { getEmpresas } from "../api/empresa";
import { getTiposEntidad } from "../api/tipoEntidad";
import { getFormasPago } from "../api/formaPago";
import { useAuthStore } from "../shared/stores/useAuthStore";
import EntidadComercialForm from "../components/entidadComercial/EntidadComercialForm";
import { getResponsiveFontSize } from "../utils/utils";
import { InputText } from "primereact/inputtext";

const EntidadComercial = () => {
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [entidadesFiltradas, setEntidadesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [entidadAEliminar, setEntidadAEliminar] = useState(null);

  // Estados para filtros
  const [empresas, setEmpresas] = useState([]);
  const [tiposEntidad, setTiposEntidad] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroTipoEntidad, setFiltroTipoEntidad] = useState(null);
  const [filtroFormaPago, setFiltroFormaPago] = useState(null);
  const [filtroAgenteRetencion, setFiltroAgenteRetencion] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [
    entidadesComerciales,
    filtroEmpresa,
    filtroTipoEntidad,
    filtroFormaPago,
    filtroAgenteRetencion,
  ]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar entidades comerciales
      const dataEntidades = await getEntidadesComerciales();
      setEntidadesComerciales(dataEntidades);
      setEntidadesFiltradas(dataEntidades);

      // Cargar datos para filtros
      const [dataEmpresas, dataTiposEntidad, dataFormasPago] =
        await Promise.all([getEmpresas(), getTiposEntidad(), getFormasPago()]);

      setEmpresas(dataEmpresas);
      setTiposEntidad(dataTiposEntidad);
      setFormasPago(dataFormasPago);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarEntidadesComerciales = async () => {
    try {
      setLoading(true);
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar entidades comerciales",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...entidadesComerciales];

    // Filtro por empresa
    if (filtroEmpresa !== null) {
      resultado = resultado.filter(
        (e) => Number(e.empresaId) === Number(filtroEmpresa)
      );
    }

    // Filtro por tipo de entidad
    if (filtroTipoEntidad !== null) {
      resultado = resultado.filter(
        (e) => Number(e.tipoEntidadId) === Number(filtroTipoEntidad)
      );
    }

    // Filtro por forma de pago
    if (filtroFormaPago !== null) {
      resultado = resultado.filter(
        (e) => Number(e.formaPagoId) === Number(filtroFormaPago)
      );
    }

    // Filtro por agente de retención
    if (filtroAgenteRetencion !== null) {
      resultado = resultado.filter(
        (e) => e.esAgenteRetencion === filtroAgenteRetencion
      );
    }

    setEntidadesFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroTipoEntidad(null);
    setFiltroFormaPago(null);
    setFiltroAgenteRetencion(null);
    setGlobalFilter("");
  };

  const abrirDialogoNuevo = () => {
    // Pre-cargar empresa seleccionada en el filtro
    const entidadInicial = filtroEmpresa
      ? { empresaId: Number(filtroEmpresa) }
      : null;
    setEntidadSeleccionada(entidadInicial);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (entidad) => {
    setEntidadSeleccionada(entidad);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEntidadSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    cargarEntidadesComerciales();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: entidadSeleccionada && entidadSeleccionada.id
        ? "Entidad comercial actualizada correctamente"
        : "Entidad comercial creada correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (entidad) => {
    setEntidadAEliminar(entidad);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarEntidadComercial(entidadAEliminar.id);
      setEntidadesComerciales(
        entidadesComerciales.filter(
          (e) => Number(e.id) !== Number(entidadAEliminar.id)
        )
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Entidad comercial eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar entidad comercial",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setEntidadAEliminar(null);
    }
  };

  const numeroDocumentoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.numeroDocumento}
      </span>
    );
  };

  const razonSocialTemplate = (rowData) => {
    return <span style={{ fontWeight: "500" }}>{rowData.razonSocial}</span>;
  };

  const tipoTemplate = (rowData) => {
    const tipos = [];
    if (rowData.esCliente) tipos.push("Cliente");
    if (rowData.esProveedor) tipos.push("Proveedor");
    if (rowData.esCorporativo) tipos.push("Corporativo");

    return tipos.length > 0 ? tipos.join(", ") : "N/A";
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estado ? "Activo" : "Inactivo"}
        severity={rowData.estado ? "success" : "danger"}
      />
    );
  };

  const estadoActivoSUNATTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estadoActivoSUNAT ? "Activo" : "Inactivo"}
        severity={rowData.estadoActivoSUNAT ? "success" : "danger"}
      />
    );
  };

  const condicionHabidoSUNATTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.condicionHabidoSUNAT ? "Habido" : "No Habido"}
        severity={rowData.condicionHabidoSUNAT ? "success" : "warning"}
      />
    );
  };

  const esAgenteRetencionTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esAgenteRetencion ? "Sí" : "No"}
        severity={rowData.esAgenteRetencion ? "info" : "secondary"}
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

  // Normalizar opciones para dropdowns
  const empresasOptions = empresas.map((e) => ({
    label: e.razonSocial || e.nombre,
    value: Number(e.id),
  }));

  const tiposEntidadOptions = tiposEntidad.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  const formasPagoOptions = formasPago.map((f) => ({
    label: f.nombre,
    value: Number(f.id),
  }));

  const agenteRetencionOptions = [
    { label: "Todos", value: null },
    { label: "Sí", value: true },
    { label: "No", value: false },
  ];

  const header = (
    <div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2 }}>
          <h2>Entidades Comerciales</h2>
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="filtroEmpresa">Filtro por Empresa</label>
          <Dropdown
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.value)}
            options={empresasOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por Empresa"
            showClear
            className="w-full"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            size="small"
            raised
            tooltip="Nueva Entidad Comercial"
            className="p-button-success"
            onClick={abrirDialogoNuevo}
          />
        </div>
        <div style={{ flex: 1 }}>
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            className="w-full"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            size="small"
            outlined
            onClick={limpiarFiltros}
          />
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
        <div style={{ flex: 1 }}>
          <label htmlFor="filtroTipoEntidad">Filtro por Tipo Entidad</label>
          <Dropdown
            value={filtroTipoEntidad}
            onChange={(e) => setFiltroTipoEntidad(e.value)}
            options={tiposEntidadOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por Tipo Entidad"
            showClear
            className="w-full"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="filtroFormaPago">Filtro por Forma Pago</label>
          <Dropdown
            value={filtroFormaPago}
            onChange={(e) => setFiltroFormaPago(e.value)}
            options={formasPagoOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por Forma Pago"
            showClear
            className="w-full"
          />
        </div>
        <div style={{ flex: 1, alignItems: "center", flexDirection: "column" }}>
          <label htmlFor="filtroAgenteRetencion">Agente Retención</label>
          <Dropdown
            value={filtroAgenteRetencion}
            onChange={(e) => setFiltroAgenteRetencion(e.value)}
            options={agenteRetencionOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Agente Retención"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={entidadesFiltradas}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron entidades comerciales"
        header={header}
        globalFilter={globalFilter}
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable />
        <Column
          field="numeroDocumento"
          header="N° Documento"
          body={numeroDocumentoTemplate}
          sortable
        />
        <Column
          field="razonSocial"
          header="Razón Social"
          body={razonSocialTemplate}
          sortable
        />
        <Column header="Tipo" body={tipoTemplate} sortable />
        <Column field="estado" header="Estado" body={estadoTemplate} sortable />
        <Column
          field="estadoActivoSUNAT"
          header="Activo SUNAT"
          body={estadoActivoSUNATTemplate}
          sortable
        />
        <Column
          field="condicionHabidoSUNAT"
          header="Habido SUNAT"
          body={condicionHabidoSUNATTemplate}
          sortable
        />
        <Column
          field="esAgenteRetencion"
          header="Agente Retención"
          body={esAgenteRetencionTemplate}
          sortable
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          entidadSeleccionada && entidadSeleccionada.id
            ? `Editar Entidad Comercial - ID: ${entidadSeleccionada.id}`
            : "Nueva Entidad Comercial"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "90vw", maxWidth: "1300px" }}
        modal
      >
        <EntidadComercialForm
          entidadComercial={entidadSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la entidad comercial "${entidadAEliminar?.razonSocial}"?`}
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

export default EntidadComercial;
