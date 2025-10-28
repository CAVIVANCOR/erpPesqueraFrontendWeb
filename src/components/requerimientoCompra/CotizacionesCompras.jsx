/**
 * CotizacionesCompras.jsx
 * Componente para listar las cotizaciones de un requerimiento de compra
 */
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { confirmDialog } from "primereact/confirmdialog";
import {
  getCotizacionesProveedor,
  crearCotizacionProveedor,
  eliminarCotizacionProveedor,
} from "../../api/cotizacionProveedor";
import DetalleCotizacionCompra from "./DetalleCotizacionCompra";
import { formatearNumero } from "../../utils/utils";

export default function CotizacionesCompras({
  requerimientoId,
  detallesRequerimiento = [],
  proveedores = [],
  monedas = [],
  puedeEditar,
  toast,
  onCountChange,
}) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionesFiltradas, setCotizacionesFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialogNueva, setShowDialogNueva] = useState(false);
  const [showDialogDetalle, setShowDialogDetalle] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  // Filtros
  const [filtroProveedor, setFiltroProveedor] = useState(null);
  const [filtroProductosSeleccionados, setFiltroProductosSeleccionados] =
    useState(false);
  const [filtroProductosNuevos, setFiltroProductosNuevos] = useState(false);

  const [formNuevaCotizacion, setFormNuevaCotizacion] = useState({
    proveedorId: null,
    monedaId: null,
    fechaCotizacion: new Date(),
  });

  useEffect(() => {
    if (requerimientoId) {
      cargarCotizaciones();
    }
  }, [requerimientoId]);

  useEffect(() => {
    if (onCountChange) onCountChange(cotizaciones.length);
  }, [cotizaciones, onCountChange]);

  const cargarCotizaciones = async () => {
    setLoading(true);
    try {
      const data = await getCotizacionesProveedor(requerimientoId);
      setCotizaciones(data);
      setCotizacionesFiltradas(data);
    } catch (err) {
      console.error("Error:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las cotizaciones",
      });
    }
    setLoading(false);
  };

  const aplicarFiltros = () => {
    let resultado = [...cotizaciones];

    // Filtro por proveedor
    if (filtroProveedor) {
      resultado = resultado.filter(
        (c) => Number(c.proveedorId) === Number(filtroProveedor)
      );
    }

    // Filtro por productos seleccionados (con precios)
    if (filtroProductosSeleccionados) {
      resultado = resultado.filter((c) =>
        c.detalles.some((d) => Number(d.precioUnitario) > 0)
      );
    }

    // Filtro por productos nuevos (alternativos)
    if (filtroProductosNuevos) {
      resultado = resultado.filter((c) =>
        c.detalles.some((d) => d.esProductoAlternativo)
      );
    }

    setCotizacionesFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroProveedor(null);
    setFiltroProductosSeleccionados(false);
    setFiltroProductosNuevos(false);
    setCotizacionesFiltradas(cotizaciones);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [
    filtroProveedor,
    filtroProductosSeleccionados,
    filtroProductosNuevos,
    cotizaciones,
  ]);

  const handleAdd = () => {
    if (!detallesRequerimiento?.length) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "El requerimiento no tiene items",
      });
      return;
    }
    setFormNuevaCotizacion({
      proveedorId: null,
      monedaId: null,
      fechaCotizacion: new Date(),
    });
    setShowDialogNueva(true);
  };

  const handleCrearCotizacion = async () => {
    if (!formNuevaCotizacion.proveedorId || !formNuevaCotizacion.monedaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Complete todos los campos",
      });
      return;
    }
    try {
      setLoading(true);
      await crearCotizacionProveedor({
        requerimientoCompraId: requerimientoId,
        ...formNuevaCotizacion,
      });
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cotización creada con ${detallesRequerimiento.length} items`,
      });
      setShowDialogNueva(false);
      cargarCotizaciones();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "Error al crear",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditarPrecios = (cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setShowDialogDetalle(true);
  };

  const handleDelete = (cotizacion) => {
    confirmDialog({
      message: `¿Eliminar cotización de ${cotizacion.proveedor?.razonSocial}?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        try {
          await eliminarCotizacionProveedor(cotizacion.id);
          toast.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Cotización eliminada",
          });
          cargarCotizaciones();
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar",
          });
        }
      },
    });
  };

  const calcularTotal = (detalles) => {
    return detalles.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
  };

  const proveedorTemplate = (row) => (
    <span style={{ fontWeight: "bold" }}>
      {row.proveedor?.razonSocial || "-"}
    </span>
  );
  
  const monedaTemplate = (row) => (
    <span style={{ fontWeight: "bold" }}>
      {row.moneda?.simbolo || "-"}
    </span>
  );
  
  const fechaTemplate = (row) => (
    <span style={{ fontWeight: "bold" }}>
      {new Date(row.fechaCotizacion).toLocaleDateString("es-PE")}
    </span>
  );
  
  const totalTemplate = (row) => {
    const total = calcularTotal(row.detalles || []);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold" }}>
        {row.moneda?.simbolo || ""} {formatearNumero(total)}
      </div>
    );
  };
  
  const itemsTemplate = (row) => (
    <span style={{ fontWeight: "bold" }}>
      {row.detalles?.length || 0}
    </span>
  );

  const accionesTemplate = (row) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        icon={puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        className="p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEditarPrecios(row);
        }}
        tooltip={puedeEditar ? "Editar precios" : "Ver detalle"}
      />
      <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
        disabled={!puedeEditar}
        tooltip="Eliminar"
      />
    </div>
  );

  // Obtener proveedores únicos que tienen cotizaciones
  const proveedoresConCotizaciones = React.useMemo(() => {
    const proveedoresIds = new Set(
      (cotizaciones || [])
        .map((c) => {
          const id = c?.proveedor?.id ?? c?.proveedorId;
          return id != null ? Number(id) : null;
        })
        .filter((id) => id != null)
    );
    return (proveedores || []).filter((p) => proveedoresIds.has(Number(p.id)));
  }, [cotizaciones, proveedores]);

  return (
    <div>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 5,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 0.5 }}>
          <Button
            label="Nueva"
            icon="pi pi-plus"
            onClick={handleAdd}
            disabled={!puedeEditar || loading}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label>Filtro por Proveedor</label>
          <Dropdown
            value={filtroProveedor}
            options={proveedoresConCotizaciones.map((p) => ({
              label: p.razonSocial,
              value: Number(p.id),
            }))}
            onChange={(e) => setFiltroProveedor(e.value)}
            placeholder="Todos los proveedores"
            showClear
            filter
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Productos seleccionados</label>
          <Button
            icon={filtroProductosSeleccionados ? "pi pi-check" : "pi pi-filter"}
            label={filtroProductosSeleccionados ? "Seleccionados" : "Todos"}
            className={filtroProductosSeleccionados ? "p-button-success" : "p-button-secondary"}
            severity={filtroProductosSeleccionados ? "success" : "secondary"}
            size="small"
            onClick={() =>
              setFiltroProductosSeleccionados(!filtroProductosSeleccionados)
            }
          />
        </div>

        <div style={{ flex: 1 }}>
          <label>Productos nuevos</label>
          <Button
            icon={filtroProductosNuevos ? "pi pi-check" : "pi pi-filter"}
            label={filtroProductosNuevos ? "Productos nuevos" : "Todos"}
            className={filtroProductosNuevos ? "p-button-info" : "p-button-secondary"}
            severity={filtroProductosNuevos ? "info" : "secondary"}
            size="small"
            onClick={() => setFiltroProductosNuevos(!filtroProductosNuevos)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            icon="pi pi-times"
            label="Limpiar filtros"
            className="p-button-secondary"
            severity="secondary"
            size="small"
            outlined
            onClick={limpiarFiltros}
            tooltip="Limpiar filtros"
          />
        </div>
      </div>

      <DataTable
        value={cotizacionesFiltradas}
        loading={loading}
        emptyMessage="No hay cotizaciones"
        style={{ fontSize: "12px" }}
        selectionMode="single"
        onRowClick={(e) => {
          if (puedeEditar) {
            handleEditarPrecios(e.data);
          }
        }}
        showGridlines
        size="small"
        stripedRows
      >
        <Column
          field="proveedor.razonSocial"
          header="Proveedor"
          body={proveedorTemplate}
        />
        <Column
          field="moneda.simbolo"
          header="Moneda"
          body={monedaTemplate}
          style={{ width: "100px" }}
        />
        <Column
          field="fechaCotizacion"
          header="Fecha"
          body={fechaTemplate}
          style={{ width: "120px" }}
        />
        <Column
          header="Items"
          body={itemsTemplate}
          style={{ width: "80px" }}
        />
        <Column
          header="Total"
          body={totalTemplate}
          style={{ width: "150px", textAlign: "right" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "150px" }}
        />
      </DataTable>

      {/* DIÁLOGO: NUEVA COTIZACIÓN */}
      <Dialog
        header="Nueva Cotización"
        visible={showDialogNueva}
        style={{ width: "500px" }}
        onHide={() => setShowDialogNueva(false)}
      >
        <div className="p-fluid">
          <div className="field">
            <label>Proveedor*</label>
            <Dropdown
              value={formNuevaCotizacion.proveedorId}
              options={proveedores.map((p) => ({
                label: p.razonSocial,
                value: Number(p.id),
              }))}
              onChange={(e) =>
                setFormNuevaCotizacion({
                  ...formNuevaCotizacion,
                  proveedorId: e.value,
                })
              }
              placeholder="Seleccionar"
              filter
            />
          </div>
          <div className="field">
            <label>Moneda*</label>
            <Dropdown
              value={formNuevaCotizacion.monedaId}
              options={monedas.map((m) => ({
                label: `${m.nombreLargo} (${m.simbolo})`,
                value: Number(m.id),
              }))}
              onChange={(e) =>
                setFormNuevaCotizacion({
                  ...formNuevaCotizacion,
                  monedaId: e.value,
                })
              }
              placeholder="Seleccionar"
            />
          </div>
          <div className="field">
            <label>Fecha Cotización</label>
            <Calendar
              value={formNuevaCotizacion.fechaCotizacion}
              onChange={(e) =>
                setFormNuevaCotizacion({
                  ...formNuevaCotizacion,
                  fechaCotizacion: e.value,
                })
              }
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setShowDialogNueva(false)}
          />
          <Button
            label="Crear"
            icon="pi pi-check"
            onClick={handleCrearCotizacion}
            loading={loading}
          />
        </div>
      </Dialog>

      {/* DIÁLOGO: DETALLE COTIZACIÓN */}
      {showDialogDetalle && cotizacionSeleccionada && (
        <DetalleCotizacionCompra
          cotizacion={cotizacionSeleccionada}
          visible={showDialogDetalle}
          onHide={() => {
            setShowDialogDetalle(false);
            setCotizacionSeleccionada(null);
            cargarCotizaciones();
          }}
          toast={toast}
          puedeEditar={puedeEditar}
        />
      )}
    </div>
  );
}
