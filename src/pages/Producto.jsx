// src/pages/Producto.jsx
// Pantalla CRUD profesional para Producto. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import ProductoForm from "../components/producto/ProductoForm";
import { getProductos, crearProducto, actualizarProducto, eliminarProducto } from "../api/producto";
import { getFamiliasProducto } from "../api/familiaProducto";
import { getSubfamiliasProducto } from "../api/subfamiliaProducto";
import { getUnidadesMedida } from "../api/unidadMedida";
import { getTiposMaterial } from "../api/tipoMaterial";
import { getColores } from "../api/color";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Productos.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function Producto() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [tiposMaterial, setTiposMaterial] = useState([]);
  const [colores, setColores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore(state => state.usuario);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        productosData,
        familiasData,
        subfamiliasData,
        unidadesData,
        tiposMaterialData,
        coloresData
      ] = await Promise.all([
        getProductos(),
        getFamiliasProducto(),
        getSubfamiliasProducto(),
        getUnidadesMedida(),
        getTiposMaterial(),
        getColores()
      ]);
      setItems(productosData);
      setFamilias(familiasData);
      setSubfamilias(subfamiliasData);
      setUnidadesMedida(unidadesData);
      setTiposMaterial(tiposMaterialData);
      setColores(coloresData);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo cargar los datos." });
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
      await eliminarProducto(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Producto eliminado correctamente." });
      cargarDatos();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo eliminar." });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarProducto(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Producto actualizado." });
      } else {
        await crearProducto(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Producto creado." });
      }
      setShowDialog(false);
      setEditing(null);
      cargarDatos();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo guardar." });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const familiaNombre = (rowData) => {
    const familia = familias.find(f => Number(f.id) === Number(rowData.familiaId));
    return familia ? familia.descripcionBase : '';
  };

  const unidadMedidaNombre = (rowData) => {
    const unidad = unidadesMedida.find(u => Number(u.id) === Number(rowData.unidadMedidaId));
    return unidad ? unidad.nombre : '';
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-green-600" : "text-red-600"}>
      {rowData[field] ? "Sí" : "No"}
    </span>
  );

  const decimalTemplate = (rowData, field) => {
    const value = rowData[field];
    return value ? Number(value).toFixed(2) : '';
  };

  const actionBody = (rowData) => (
    <>
      <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => handleEdit(rowData)} aria-label="Editar" />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDelete(rowData)} aria-label="Eliminar" />
      )}
    </>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este producto?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Productos</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="codigo" header="Código" />
        <Column field="descripcionBase" header="Descripción" />
        <Column field="familiaId" header="Familia" body={familiaNombre} />
        <Column field="unidadMedidaId" header="Unidad" body={unidadMedidaNombre} />
        <Column field="exoneradoIgv" header="Exonerado IGV" body={rowData => booleanTemplate(rowData, 'exoneradoIgv')} />
        <Column field="porcentajeDetraccion" header="% Detracción" body={rowData => decimalTemplate(rowData, 'porcentajeDetraccion')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Producto" : "Nuevo Producto"} visible={showDialog} style={{ width: 900 }} onHide={() => setShowDialog(false)} modal>
        <ProductoForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          familias={familias}
          subfamilias={subfamilias}
          unidadesMedida={unidadesMedida}
          tiposMaterial={tiposMaterial}
          colores={colores}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
