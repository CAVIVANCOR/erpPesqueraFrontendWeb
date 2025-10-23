// src/pages/RequerimientoCompra.jsx
// Pantalla CRUD profesional para RequerimientoCompra. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import RequerimientoCompraForm from "../components/requerimientoCompra/RequerimientoCompraForm";
import {
  getRequerimientosCompra,
  crearRequerimientoCompra,
  actualizarRequerimientoCompra,
  eliminarRequerimientoCompra,
  aprobarRequerimientoCompra,
  anularRequerimientoCompra,
} from "../api/requerimientoCompra";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getTiposProducto } from "../api/tipoProducto";
import { getAllTipoEstadoProducto } from "../api/tipoEstadoProducto";
import { getAllDestinoProducto } from "../api/destinoProducto";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getCentrosCosto } from "../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getMonedas } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Requerimientos de Compra.
 */
export default function RequerimientoCompra() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState([]);
  const [destinosProducto, setDestinosProducto] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [monedas, setMonedas] = useState([]);
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

  // Filtrar items cuando cambie la empresa seleccionada
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
        requerimientosData,
        empresasData,
        tiposDocData,
        proveedoresData,
        tiposProductoData,
        tiposEstadoProductoData,
        destinosProductoData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        centrosCostoData,
        tiposMovimientoData,
        monedasData,
      ] = await Promise.all([
        getRequerimientosCompra(),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getTiposProducto(),
        getAllTipoEstadoProducto(),
        getAllDestinoProducto(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getMonedas(),
      ]);
      
      setItems(requerimientosData);
      setEmpresas(empresasData);
      setTiposDocumento(tiposDocData);
      setProveedores(proveedoresData);
      setTiposProducto(tiposProductoData);
      setTiposEstadoProducto(tiposEstadoProductoData);
      setDestinosProducto(destinosProductoData);
      setFormasPago(formasPagoData);
      setProductos(productosData);
      
      // Mapear personal con nombreCompleto
      const personalConNombres = personalData.map(p => ({
        ...p,
        nombreCompleto: `${p.nombres || ''} ${p.apellidos || ''}`.trim()
      }));
      setPersonalOptions(personalConNombres);

      // Filtrar estados de documentos (tipoProvieneDeId = 11 para DOCUMENTOS COMPRAS)
      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 11 && !e.cesado
      );
      setEstadosDoc(estadosDocFiltrados);
      setCentrosCosto(centrosCostoData);
      setTiposMovimiento(tiposMovimientoData);
      setMonedas(monedasData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleEdit = async (rowData) => {
    try {
      // Cargar el requerimiento completo con todos los campos
      const { getRequerimientoCompraPorId } = await import("../api/requerimientoCompra");
      const requerimientoCompleto = await getRequerimientoCompraPorId(rowData.id);
      
      setEditing(requerimientoCompleto);
      setShowDialog(true);
    } catch (error) {
      console.error('Error al cargar requerimiento:', error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el requerimiento",
        life: 3000,
      });
    }
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
      await eliminarRequerimientoCompra(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Requerimiento de compra eliminado correctamente.",
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
      const esEdicion = editing && editing.id && editing.numeroDocumento;
      
      if (esEdicion) {
        await actualizarRequerimientoCompra(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Requerimiento actualizado. Puedes seguir agregando detalles.",
        });
        
        // Recargar el requerimiento actualizado para obtener campos actualizados
        const { getRequerimientoCompraPorId } = await import("../api/requerimientoCompra");
        const requerimientoActualizado = await getRequerimientoCompraPorId(editing.id);
        setEditing(requerimientoActualizado);
      } else {
        const resultado = await crearRequerimientoCompra(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Requerimiento creado con número: ${resultado.numeroDocumento}. Ahora puedes agregar detalles.`,
          life: 5000
        });
        
        // Cargar el requerimiento recién creado
        const { getRequerimientoCompraPorId } = await import("../api/requerimientoCompra");
        const requerimientoCompleto = await getRequerimientoCompraPorId(resultado.id);
        setEditing(requerimientoCompleto);
      }
      
      cargarDatos();
    } catch (err) {
      const errorMsg = err.response?.data?.mensaje || err.response?.data?.error || err.response?.data?.message || "No se pudo guardar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null); // null para indicar que es creación, no edición
    setShowDialog(true);
  };

  const handleAprobar = async (id) => {
    setLoading(true);
    try {
      await aprobarRequerimientoCompra(id);
      
      toast.current.show({
        severity: "success",
        summary: "Requerimiento Aprobado",
        detail: "El requerimiento se aprobó exitosamente y se creó la Entrega a Rendir.",
        life: 3000
      });
      
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg = err.response?.data?.mensaje || err.response?.data?.error || err.response?.data?.message || "No se pudo aprobar.";
      toast.current.show({
        severity: "error",
        summary: "Error al Aprobar",
        detail: errorMsg,
        life: 5000
      });
    }
    setLoading(false);
  };

  const handleAnular = async (id) => {
    setLoading(true);
    try {
      await anularRequerimientoCompra(id);
      
      toast.current.show({
        severity: "success",
        summary: "Requerimiento Anulado",
        detail: "El requerimiento se anuló exitosamente.",
        life: 3000
      });
      
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg = err.response?.data?.mensaje || err.response?.data?.error || err.response?.data?.message || "No se pudo anular.";
      toast.current.show({
        severity: "error",
        summary: "Error al Anular",
        detail: errorMsg,
        life: 5000
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

  const tipoTemplate = (rowData) => {
    return rowData.esConCotizacion ? (
      <Tag value="Con Cotización" severity="info" icon="pi pi-shopping-cart" />
    ) : (
      <Tag value="Compra Directa" severity="success" icon="pi pi-check-circle" />
    );
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
        message="¿Está seguro que desea eliminar este requerimiento de compra?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      {/* ConfirmDialog global para confirmDialog() de componentes hijos */}
      <ConfirmDialog />
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
              <h2>Gestión de Requerimientos de Compra</h2>
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
                label="Nuevo"
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
        <Column field="numeroDocumento" header="Nº Documento" />
        <Column field="empresaId" header="Empresa" body={empresaNombre} />
        <Column
          field="fechaDocumento"
          header="Fecha"
          body={(rowData) => fechaTemplate(rowData, "fechaDocumento")}
        />
        <Column
          field="proveedorId"
          header="Proveedor"
          body={proveedorNombre}
        />
        <Column
          field="esConCotizacion"
          header="Tipo"
          body={tipoTemplate}
        />
        <Column
          field="estadoDocId"
          header="Estado"
          body={estadoTemplate}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing?.id
            ? "Editar Requerimiento de Compra"
            : "Nuevo Requerimiento de Compra"
        }
        visible={showDialog}
        style={{ width: "1350px", maxWidth: "95vw" }}
        onHide={() => setShowDialog(false)}
        modal
        maximizable
      >
        <RequerimientoCompraForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          proveedores={proveedores}
          tiposProducto={tiposProducto}
          tiposEstadoProducto={tiposEstadoProducto}
          destinosProducto={destinosProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          estadosDoc={estadosDoc}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          monedas={monedas}
          empresaFija={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onAprobar={handleAprobar}
          onAnular={handleAnular}
          loading={loading}
          toast={toast}
        />
      </Dialog>
    </div>
  );
}