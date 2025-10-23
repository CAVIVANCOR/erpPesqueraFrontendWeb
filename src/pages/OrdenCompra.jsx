// src/pages/OrdenCompra.jsx
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import OrdenCompraForm from "../components/ordenCompra/OrdenCompraForm";
import {
  getOrdenesCompra,
  crearOrdenCompra,
  actualizarOrdenCompra,
  eliminarOrdenCompra,
  aprobarOrdenCompra,
  anularOrdenCompra,
  generarOrdenDesdeRequerimiento,
} from "../api/ordenCompra";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getRequerimientosCompra } from "../api/requerimientoCompra";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

export default function OrdenCompra() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (empresaSeleccionada) {
      const filtrados = items.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
      setItemsFiltrados(filtrados);
    } else {
      setItemsFiltrados(items);
    }
  }, [empresaSeleccionada, items]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        ordenesData,
        empresasData,
        proveedoresData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        requerimientosData,
      ] = await Promise.all([
        getOrdenesCompra(),
        getEmpresas(),
        getEntidadesComerciales(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getRequerimientosCompra(),
      ]);

      setItems(ordenesData);
      setEmpresas(empresasData);
      setProveedores(proveedoresData);
      setFormasPago(formasPagoData);
      setProductos(productosData);

      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      // Filtrar estados de documentos de compras (tipoProvieneDeId = 11)
      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 11 && !e.cesado
      );
      setEstadosDoc(estadosDocFiltrados);

      // Filtrar solo requerimientos aprobados
      const requerimientosAprobados = requerimientosData.filter(
        (r) => r.estadoDocId === 33
      );
      setRequerimientos(requerimientosAprobados);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarOrdenCompra(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Orden de compra eliminada correctamente.",
      });
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      const esEdicion = editing && editing.id && editing.codigo;

      if (esEdicion) {
        await actualizarOrdenCompra(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Orden actualizada. Puedes seguir agregando detalles.",
        });
      } else {
        const resultado = await crearOrdenCompra(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Orden creada con código: ${resultado.codigo}. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        const { getOrdenCompraPorId } = await import("../api/ordenCompra");
        const ordenCompleta = await getOrdenCompraPorId(resultado.id);
        setEditing(ordenCompleta);
      }

      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo guardar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing({ empresaId: empresaSeleccionada });
    setShowDialog(true);
  };

  const handleAprobar = async (id) => {
    setLoading(true);
    try {
      await aprobarOrdenCompra(id);

      toast.current.show({
        severity: "success",
        summary: "Orden Aprobada",
        detail: "La orden se aprobó exitosamente.",
        life: 3000,
      });

      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo aprobar.";
      toast.current.show({
        severity: "error",
        summary: "Error al Aprobar",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleAnular = async (id) => {
    setLoading(true);
    try {
      await anularOrdenCompra(id);

      toast.current.show({
        severity: "success",
        summary: "Orden Anulada",
        detail: "La orden se anuló exitosamente.",
        life: 3000,
      });

      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo anular.";
      toast.current.show({
        severity: "error",
        summary: "Error al Anular",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleGenerarDesdeRequerimiento = async (requerimientoId) => {
    setLoading(true);
    try {
      const resultado = await generarOrdenDesdeRequerimiento(requerimientoId);
      toast.current.show({
        severity: "success",
        summary: "Orden Generada",
        detail: `Orden ${resultado.codigo} generada desde requerimiento.`,
        life: 5000,
      });
      cargarDatos();
      
      // Abrir la orden recién creada
      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenCompleta = await getOrdenCompraPorId(resultado.id);
      setEditing(ordenCompleta);
      setShowDialog(true);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo generar la orden.",
      });
    }
    setLoading(false);
  };

  const empresaNombre = (rowData) => {
    return rowData.empresa?.razonSocial || "";
  };

  const proveedorNombre = (rowData) => {
    return rowData.proveedor?.razonSocial || "";
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoDoc?.nombre || "";
    let severity = "info";

    if (estado === "PENDIENTE") severity = "warning";
    if (estado === "APROBADO") severity = "success";
    if (estado === "ANULADO") severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const fechaTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleDateString() : "";
  };

  const actionBody = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        aria-label="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          aria-label="Eliminar"
        />
      )}
    </>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar esta orden de compra?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Órdenes de Compra</h2>
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="empresaFiltro" style={{ fontWeight: "bold" }}>
                Empresa*
              </label>
              <Dropdown
                id="empresaFiltro"
                value={empresaSeleccionada}
                options={empresas.map((e) => ({
                  label: e.razonSocial,
                  value: Number(e.id),
                }))}
                onChange={(e) => setEmpresaSeleccionada(e.value)}
                placeholder="Seleccionar empresa para filtrar"
                optionLabel="label"
                optionValue="value"
                showClear
                disabled={loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nueva"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleAdd}
                disabled={loading || !empresaSeleccionada}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="codigo" header="Código" />
        <Column field="empresaId" header="Empresa" body={empresaNombre} />
        <Column
          field="fechaEmision"
          header="F. Emisión"
          body={(rowData) => fechaTemplate(rowData, "fechaEmision")}
        />
        <Column field="proveedorId" header="Proveedor" body={proveedorNombre} />
        <Column field="estadoId" header="Estado" body={estadoTemplate} />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing?.id ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
        visible={showDialog}
        style={{ width: "1350px", maxWidth: "95vw" }}
        onHide={() => setShowDialog(false)}
        modal
        maximizable
      >
        <OrdenCompraForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          proveedores={proveedores}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          estadosDoc={estadosDoc}
          requerimientos={requerimientos}
          empresaFija={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onAprobar={handleAprobar}
          onAnular={handleAnular}
          onGenerarDesdeRequerimiento={handleGenerarDesdeRequerimiento}
          loading={loading}
          toast={toast}
        />
      </Dialog>
    </div>
  );
}