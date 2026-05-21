/**
 * DetContratistasOTCard.jsx
 *
 * Card para gestionar los contratistas asociados a una Orden de Trabajo de Mantenimiento.
 * Incluye funcionalidad CRUD completa con DataTable, validaciones y gestión de repuestos.
 *
 * CORRECCIÓN v1.2.0: ProductoSelector y ActivoSelector ahora cargan datos internamente
 * - Se eliminó la carga de productos y activos en este componente
 * - Se usa empresaIdPreseleccionada para filtrar por empresa de la OT
 *
 * @author ERP Megui
 * @version 1.2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import ProductoSelector from "../common/ProductoSelector";
import ActivoSelector from "../common/ActivoSelector";
import EntidadComercialSelector from "../common/EntidadComercialSelector";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { Message } from "primereact/message";
import { formatearNumero } from "../../utils/utils";
import {
  getDetallesContratistas,
  getDetallesPorOrdenTrabajo,
  createDetContratistaOT,
  updateDetContratistaOT,
  eliminarDetalleContratista,
} from "../../api/detContratistasOT";
import { getContratistas } from "../../api/contratista";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function DetContratistasOTCard({
  otMantenimientoId,
  empresaId,
  monedas = [],
  estadosContratista = [],
  puedeEditar = true,
  onCountChange,
  readOnly = false,
  permisos = {},
}) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados principales
  const [contratistas, setContratistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingContratista, setEditingContratista] = useState(null);

  // Estados para combos
  const [contratistasOptions, setContratistasOptions] = useState([]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    id: null,
    otMantenimientoId: null,
    numeroLinea: 1,
    contratistaId: null,
    productoServicioId: null,
    activoId: null,
    servicioDescripcion: "",
    montoPactado: 0,
    montoPagado: 0,
    saldo: 0,
    monedaId: null,
    estadoId: null,
    preFacturaId: null,
    urlDocumentoContratista: "",
    urlFotosProductos: "",
    urlFotosAntes: "",
    urlFotosDespues: "",
  });

  // Cargar contratistas cuando cambie la OT
  useEffect(() => {
    if (otMantenimientoId) {
      cargarContratistas();
    } else {
      setContratistas([]);
    }
  }, [otMantenimientoId]);

  // Notificar cambios en el contador
  useEffect(() => {
    if (onCountChange) {
      onCountChange(contratistas.length);
    }
  }, [contratistas, onCountChange]);

  // Cargar opciones de combos cuando cambie la empresa
  useEffect(() => {
    if (empresaId) {
      cargarOpcionesCombos();
    }
  }, [empresaId]);

  /**
   * Cargar contratistas de la OT
   */
  const cargarContratistas = async () => {
    if (!otMantenimientoId) return;

    try {
      setLoading(true);
      const data = await getDetallesPorOrdenTrabajo(otMantenimientoId);
      setContratistas(data);
    } catch (error) {
      console.error("Error al cargar contratistas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los contratistas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar opciones para los combos
   * NOTA: ProductoSelector y ActivoSelector ahora cargan sus propios datos internamente
   */
  const cargarOpcionesCombos = async () => {
    try {
      const contratistasData = await getContratistas(empresaId);

      // Filtrar contratistas por empresa
      const contratistasFiltrados = contratistasData.filter(
        (c) => Number(c.empresaId) === Number(empresaId),
      );
      setContratistasOptions(contratistasFiltrados);
    } catch (error) {
      console.error("Error al cargar opciones:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las opciones",
        life: 3000,
      });
    }
  };

  /**
   * Abrir diálogo para nuevo contratista
   */
  const handleNuevoContratista = () => {
    if (!otMantenimientoId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la OT primero",
        life: 3000,
      });
      return;
    }

    const nuevoNumeroLinea =
      contratistas.length > 0
        ? Math.max(...contratistas.map((c) => c.numeroLinea)) + 1
        : 1;

    setFormData({
      id: null,
      otMantenimientoId: otMantenimientoId,
      numeroLinea: nuevoNumeroLinea,
      contratistaId: null,
      productoServicioId: null,
      activoId: null,
      servicioDescripcion: "",
      montoPactado: 0,
      montoPagado: 0,
      saldo: 0,
      monedaId: monedas[0]?.id || null,
      estadoId: estadosContratista[0]?.id || null,
      preFacturaId: null,
      urlDocumentoContratista: "",
      urlFotosProductos: "",
      urlFotosAntes: "",
      urlFotosDespues: "",
    });
    setEditingContratista(null);
    setDialogVisible(true);
  };

  /**
   * Abrir diálogo para editar contratista
   */
  const handleEditarContratista = (contratista) => {
    setFormData({
      id: contratista.id,
      otMantenimientoId: contratista.otMantenimientoId,
      numeroLinea: contratista.numeroLinea,
      contratistaId: Number(contratista.contratistaId),
      productoServicioId: Number(contratista.productoServicioId),
      activoId: contratista.activoId ? Number(contratista.activoId) : null,
      servicioDescripcion: contratista.servicioDescripcion || "",
      montoPactado: Number(contratista.montoPactado) || 0,
      montoPagado: Number(contratista.montoPagado) || 0,
      saldo: Number(contratista.saldo) || 0,
      monedaId: Number(contratista.monedaId),
      estadoId: Number(contratista.estadoId),
      preFacturaId: contratista.preFacturaId
        ? Number(contratista.preFacturaId)
        : null,
      urlDocumentoContratista: contratista.urlDocumentoContratista || "",
      urlFotosProductos: contratista.urlFotosProductos || "",
      urlFotosAntes: contratista.urlFotosAntes || "",
      urlFotosDespues: contratista.urlFotosDespues || "",
    });
    setEditingContratista(contratista);
    setDialogVisible(true);
  };

  /**
   * Guardar contratista (crear o actualizar)
   */
  const handleGuardarContratista = async () => {
    try {
      // Validaciones
      if (!formData.contratistaId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar un contratista",
          life: 3000,
        });
        return;
      }

      if (!formData.productoServicioId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar un producto/servicio",
          life: 3000,
        });
        return;
      }

      if (!formData.servicioDescripcion.trim()) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe ingresar una descripción del servicio",
          life: 3000,
        });
        return;
      }

      // Calcular saldo automáticamente
      const saldoCalculado =
        Number(formData.montoPactado) - Number(formData.montoPagado);

      const payload = {
        ...formData,
        saldo: saldoCalculado,
        creadoPor: usuario?.id,
        actualizadoPor: usuario?.id,
      };

      setLoading(true);

      if (editingContratista) {
        await updateDetContratistaOT(formData.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contratista actualizado correctamente",
          life: 3000,
        });
      } else {
        await createDetContratistaOT(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contratista creado correctamente",
          life: 3000,
        });
      }

      setDialogVisible(false);
      await cargarContratistas();
    } catch (error) {
      console.error("Error al guardar contratista:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.mensaje || "Error al guardar el contratista",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar contratista
   */
  const handleEliminarContratista = (contratista) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el contratista ${contratista.contratista?.razonSocial}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          setLoading(true);
          await eliminarDetalleContratista(contratista.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Contratista eliminado correctamente",
            life: 3000,
          });
          await cargarContratistas();
        } catch (error) {
          console.error("Error al eliminar contratista:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.mensaje ||
              "Error al eliminar el contratista",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  /**
   * Calcular saldo cuando cambien los montos
   */
  useEffect(() => {
    const saldoCalculado =
      Number(formData.montoPactado) - Number(formData.montoPagado);
    setFormData((prev) => ({ ...prev, saldo: saldoCalculado }));
  }, [formData.montoPactado, formData.montoPagado]);

  // Templates para columnas
  const contratistaTemplate = (rowData) => {
    return rowData.contratista?.razonSocial || "N/A";
  };

  const productoServicioTemplate = (rowData) => {
    return (
      rowData.productoServicio?.descripcionArmada ||
      rowData.productoServicio?.nombre ||
      "N/A"
    );
  };

  const activoTemplate = (rowData) => {
    return rowData.activo?.nombre || "N/A";
  };

  const montoTemplate = (rowData, field) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const simbolo = moneda?.simbolo || "";
    return `${simbolo} ${formatearNumero(rowData[field])}`;
  };

  const estadoTemplate = (rowData) => {
    const estado = estadosContratista.find(
      (e) => Number(e.id) === Number(rowData.estadoId),
    );
    return (
      <Tag
        value={estado?.descripcion || "N/A"}
        severity={estado?.severityColor || "info"}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2" style={{ justifyContent: "center" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={(e) => {
            e.stopPropagation();
            handleEditarContratista(rowData);
          }}
          disabled={readOnly || !puedeEditar}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            handleEliminarContratista(rowData);
          }}
          disabled={readOnly || !puedeEditar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Toolbar
  const toolbarLeft = (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-users" style={{ fontSize: "1.5rem" }}></i>
      <span className="text-xl font-bold">Contratistas</span>
      <Tag value={contratistas.length} severity="info" />
    </div>
  );

  const toolbarRight = (
    <Button
      label="Nuevo Contratista"
      icon="pi pi-plus"
      className="p-button-success"
      onClick={handleNuevoContratista}
      disabled={!otMantenimientoId || readOnly || !puedeEditar}
    />
  );

  // Footer del diálogo
  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDialogVisible(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-primary"
        onClick={handleGuardarContratista}
        loading={loading}
      />
    </div>
  );

  return (
    <Panel header="Contratistas de la OT" className="mb-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      {!otMantenimientoId && (
        <Message
          severity="info"
          text="Debe guardar la OT primero para agregar contratistas"
          className="mb-3"
        />
      )}

      <Toolbar left={toolbarLeft} right={toolbarRight} className="mb-3" />

      <DataTable
        value={contratistas}
        loading={loading}
        emptyMessage="No hay contratistas registrados"
        showGridlines
        stripedRows
        size="small"
        editMode="row"
        onRowEditComplete={(e) => handleEditarContratista(e.newData)}
      >
        <Column field="numeroLinea" header="Línea" style={{ width: "80px" }} />
        <Column header="Contratista" body={contratistaTemplate} />
        <Column header="Producto/Servicio" body={productoServicioTemplate} />
        <Column header="Activo" body={activoTemplate} />
        <Column
          header="Monto Pactado"
          body={(rowData) => montoTemplate(rowData, "montoPactado")}
          style={{ width: "150px" }}
        />
        <Column
          header="Monto Pagado"
          body={(rowData) => montoTemplate(rowData, "montoPagado")}
          style={{ width: "150px" }}
        />
        <Column
          header="Saldo"
          body={(rowData) => montoTemplate(rowData, "saldo")}
          style={{ width: "150px" }}
        />
        <Column
          header="Estado"
          body={estadoTemplate}
          style={{ width: "120px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      {/* Diálogo de formulario */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "1300px" }}
        header={editingContratista ? "Editar Contratista" : "Nuevo Contratista"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={() => setDialogVisible(false)}
      >
        <div className="p-fluid">
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Número de Línea */}
            <div style={{ flex: 0.25 }}>
              <label
                htmlFor="numeroLinea"
                className="block text-900 font-medium mb-2"
              >
                N° *
              </label>
              <InputNumber
                id="numeroLinea"
                value={formData.numeroLinea}
                onValueChange={(e) =>
                  setFormData({ ...formData, numeroLinea: e.value })
                }
                disabled
              />
            </div>

            {/* Contratista con EntidadComercialSelector */}
            <div style={{ flex: 2.75 }}>
              <EntidadComercialSelector
                entidades={contratistasOptions}
                value={formData.contratistaId}
                onChange={(contratistaId) =>
                  setFormData({ ...formData, contratistaId })
                }
                empresaIdPreseleccionada={empresaId}
                tipoEntidadFiltro="PROVEEDOR"
                label="Contratista"
                placeholder="Seleccione un contratista"
                required={true}
              />
            </div>
          </div>

          {/* Producto/Servicio con ProductoSelector */}
          <div style={{ marginTop: "1rem" }}>
            <ProductoSelector
              empresaIdPreseleccionada={empresaId}
              value={formData.productoServicioId}
              onChange={(productoId) =>
                setFormData({ ...formData, productoServicioId: productoId })
              }
              placeholder="Seleccione un producto/servicio"
              required={true}
            />
          </div>

          {/* Activo con ActivoSelector */}
          <div style={{ marginTop: "1rem" }}>
            <ActivoSelector
              empresaIdPreseleccionada={empresaId}
              value={formData.activoId}
              onChange={(activoId) =>
                setFormData({ ...formData, activoId: activoId })
              }
              placeholder="Seleccione un activo (opcional)"
              required={false}
            />
          </div>

          {/* Descripción del Servicio */}
          <div style={{ marginTop: "1rem" }}>
            <label
              htmlFor="servicioDescripcion"
              className="block text-900 font-medium mb-2"
            >
              Descripción del Servicio *
            </label>
            <InputTextarea
              id="servicioDescripcion"
              value={formData.servicioDescripcion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  servicioDescripcion: e.target.value,
                })
              }
              rows={3}
              placeholder="Ingrese la descripción del servicio"
            />
          </div>

          {/* Fila de montos */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "1rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Moneda */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="monedaId"
                className="block text-900 font-medium mb-2"
              >
                Moneda *
              </label>
              <Dropdown
                id="monedaId"
                value={formData.monedaId}
                options={monedas}
                onChange={(e) =>
                  setFormData({ ...formData, monedaId: e.value })
                }
                optionLabel="codigoSunat"
                optionValue="id"
                placeholder="Seleccione moneda"
              />
            </div>

            {/* Monto Pactado */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="montoPactado"
                className="block text-900 font-medium mb-2"
              >
                Monto Pactado *
              </label>
              <InputNumber
                id="montoPactado"
                value={formData.montoPactado}
                onValueChange={(e) =>
                  setFormData({ ...formData, montoPactado: e.value })
                }
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            </div>

            {/* Monto Pagado */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="montoPagado"
                className="block text-900 font-medium mb-2"
              >
                Monto Pagado
              </label>
              <InputNumber
                id="montoPagado"
                value={formData.montoPagado}
                onValueChange={(e) =>
                  setFormData({ ...formData, montoPagado: e.value })
                }
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            </div>

            {/* Saldo (calculado) */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="saldo"
                className="block text-900 font-medium mb-2"
              >
                Saldo
              </label>
              <InputNumber
                id="saldo"
                value={formData.saldo}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                disabled
              />
            </div>

            {/* Estado */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="estadoId"
                className="block text-900 font-medium mb-2"
              >
                Estado *
              </label>
              <Dropdown
                id="estadoId"
                value={formData.estadoId}
                options={estadosContratista}
                onChange={(e) =>
                  setFormData({ ...formData, estadoId: e.value })
                }
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione estado"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </Panel>
  );
}
