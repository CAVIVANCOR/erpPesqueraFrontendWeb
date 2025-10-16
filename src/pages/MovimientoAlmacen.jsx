// src/pages/MovimientoAlmacen.jsx
// Pantalla CRUD profesional para MovimientoAlmacen. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import MovimientoAlmacenForm from "../components/movimientoAlmacen/MovimientoAlmacenForm";
import {
  getMovimientosAlmacen,
  crearMovimientoAlmacen,
  actualizarMovimientoAlmacen,
  eliminarMovimientoAlmacen,
  cerrarMovimientoAlmacen,
  anularMovimientoAlmacen,
} from "../api/movimientoAlmacen";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getConceptosMovAlmacen } from "../api/conceptoMovAlmacen";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Movimientos de Almacén.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function MovimientoAlmacen() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [conceptosMovAlmacen, setConceptosMovAlmacen] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
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
        movimientosData,
        empresasData,
        tiposData,
        entidadesData,
        conceptosData,
        productosData,
        personalData,
      ] = await Promise.all([
        getMovimientosAlmacen(),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getConceptosMovAlmacen(),
        getProductos(),
        getPersonal(),
      ]);
      setItems(movimientosData);
      setEmpresas(empresasData);
      setTiposDocumento(tiposData);
      setEntidadesComerciales(entidadesData);
      setConceptosMovAlmacen(conceptosData);
      setProductos(productosData);
      
      // Mapear personal con nombreCompleto
      const personalConNombres = personalData.map(p => ({
        ...p,
        nombreCompleto: `${p.nombres || ''} ${p.apellidos || ''}`.trim()
      }));
      setPersonalOptions(personalConNombres);
      console.log('👥 Personal cargado:', personalConNombres.length, 'registros');
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
      await eliminarMovimientoAlmacen(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Movimiento de almacén eliminado correctamente.",
      });
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        const resultado = await actualizarMovimientoAlmacen(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Movimiento de almacén actualizado.",
        });
      } else {
        const resultado = await crearMovimientoAlmacen(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Movimiento creado con número: ${resultado.numeroDocumento}`,
          life: 5000
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarDatos(); // Refresca la lista para mostrar el nuevo movimiento
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "No se pudo guardar.";
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

  const handleCerrar = async (id) => {
    setLoading(true);
    try {
      await cerrarMovimientoAlmacen(id);
      toast.current.show({
        severity: "success",
        summary: "Movimiento Cerrado",
        detail: "El movimiento se cerró exitosamente y se generó el kardex.",
      });
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo cerrar el movimiento.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoading(false);
  };

  const handleAnular = async (id, empresaId) => {
    setLoading(true);
    try {
      await anularMovimientoAlmacen(id, empresaId);
      toast.current.show({
        severity: "success",
        summary: "Movimiento Anulado",
        detail: "El movimiento se anuló exitosamente.",
      });
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo anular el movimiento.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoading(false);
  };

  const empresaNombre = (rowData) => {
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(rowData.empresaId)
    );
    return empresa ? empresa.razonSocial : "";
  };

  const tipoDocumentoNombre = (rowData) => {
    const tipo = tiposDocumento.find(
      (t) => Number(t.id) === Number(rowData.tipoDocumentoId)
    );
    return tipo ? tipo.descripcion : ""; // TipoDocumento usa 'descripcion' no 'nombre'
  };

  const entidadNombre = (rowData) => {
    if (!rowData.entidadComercialId) return "";
    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId)
    );
    return entidad ? entidad.razonSocial : "";
  };

  const fechaTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleDateString() : "";
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-blue-600" : "text-gray-600"}>
      {rowData[field] ? "Sí" : "No"}
    </span>
  );

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
        message="¿Está seguro que desea eliminar este movimiento de almacén?"
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
              <h2>Gestión de Movimientos de Almacén</h2>
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
          field="tipoDocumentoId"
          header="Tipo Doc."
          body={tipoDocumentoNombre}
        />
        <Column
          field="fechaDocumento"
          header="Fecha"
          body={(rowData) => fechaTemplate(rowData, "fechaDocumento")}
        />
        <Column
          field="entidadComercialId"
          header="Entidad"
          body={entidadNombre}
        />
        <Column
          field="esCustodia"
          header="Es Custodia"
          body={(rowData) => booleanTemplate(rowData, "esCustodia")}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing
            ? "Editar Movimiento de Almacén"
            : "Nuevo Movimiento de Almacén"
        }
        visible={showDialog}
        style={{ width: "1200px", maxWidth: "95vw" }}
        onHide={() => setShowDialog(false)}
        modal
        maximizable
      >
        <MovimientoAlmacenForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          entidadesComerciales={entidadesComerciales}
          conceptosMovAlmacen={conceptosMovAlmacen}
          productos={productos}
          personalOptions={personalOptions}
          empresaFija={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onCerrar={handleCerrar}
          onAnular={handleAnular}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
