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
import ConsultaStockForm from "../components/common/ConsultaStockForm";
import {
  getMovimientosAlmacen,
  crearMovimientoAlmacen,
  actualizarMovimientoAlmacen,
  eliminarMovimientoAlmacen,
  cerrarMovimientoAlmacen,
  anularMovimientoAlmacen,
} from "../api/movimientoAlmacen";
import { generarKardex } from "../api/generarKardex";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getConceptosMovAlmacen } from "../api/conceptoMovAlmacen";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
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
  const [estadosMercaderia, setEstadosMercaderia] = useState([]);
  const [estadosCalidad, setEstadosCalidad] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [showConsultaStock, setShowConsultaStock] = useState(false);
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
        estadosData,
      ] = await Promise.all([
        getMovimientosAlmacen(),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getConceptosMovAlmacen(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
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

      // Filtrar estados de mercadería (tipoProvieneDeId = 2 para PRODUCTOS)
      const estadosMercaderiaFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 2 && !e.cesado
      );
      setEstadosMercaderia(estadosMercaderiaFiltrados);

      // Filtrar estados de calidad (tipoProvieneDeId = 10 para PRODUCTOS CALIDAD)
      const estadosCalidadFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 10 && !e.cesado
      );
      setEstadosCalidad(estadosCalidadFiltrados);
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
    console.log("=== handleFormSubmit DATOS ENVIADOS ===");
    console.log("Datos enviados:", data, "Editing:", editing );
    console.log("Editing.id:", editing?.id, "numeroDocumento:", editing?.numeroDocumento);
    setLoading(true);
    try {
      // Verificar si es edición: editing tiene numeroDocumento (viene del backend)
      // Si editing solo tiene { empresaId }, entonces es creación
      const esEdicion = editing && editing.id && editing.numeroDocumento;
      
      if (esEdicion) {
        console.log("🔄 ACTUALIZANDO movimiento existente ID:", editing.id);
        const resultado = await actualizarMovimientoAlmacen(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Movimiento de almacén actualizado. Puedes seguir agregando detalles.",
        });
        // NO cerrar el diálogo - permitir seguir agregando detalles
        // El usuario cerrará manualmente cuando termine
      } else {
        console.log("➕ CREANDO nuevo movimiento");
        const resultado = await crearMovimientoAlmacen(data);
        console.log("=== handleFormSubmit RESULTADO CREADO ===");
        console.log("Resultado creado:", resultado);
        
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Movimiento creado con número: ${resultado.numeroDocumento}. Ahora puedes agregar detalles.`,
          life: 5000
        });
        
        // Cargar el movimiento recién creado para permitir agregar detalles
        const movimientoCompleto = await getMovimientoAlmacenPorId(resultado.id);
        setEditing(movimientoCompleto);
        // NO cerrar el diálogo - mantenerlo abierto para agregar detalles
      }
      
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
      // Cerrar movimiento (cambiar estado a CERRADO id=31)
      await cerrarMovimientoAlmacen(id);
      
      toast.current.show({
        severity: "success",
        summary: "Documento Cerrado",
        detail: "El documento se cerró exitosamente (Estado: CERRADO).",
        life: 3000
      });
      
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "No se pudo cerrar el documento.";
      toast.current.show({
        severity: "error",
        summary: "Error al Cerrar",
        detail: errorMsg,
        life: 5000
      });
    }
    setLoading(false);
  };

  const handleGenerarKardex = async (id) => {
    setLoading(true);
    try {
      // 1. Generar Kardex (crea registros, calcula saldos, actualiza tablas)
      const resultado = await generarKardex(id);
      
      // Mostrar resumen de la generación
      const mensajeDetalle = `
        Kardex generado exitosamente:
        - Registros creados: ${resultado.kardexCreados}
        - Registros actualizados: ${resultado.kardexActualizados}
        - Saldos detallados: ${resultado.saldosDetActualizados}
        - Saldos generales: ${resultado.saldosGenActualizados}
      `;
      
      // Mostrar errores si los hay
      if (resultado.errores && resultado.errores.length > 0) {
        toast.current.show({
          severity: "warn",
          summary: "Kardex generado con advertencias",
          detail: `Se encontraron ${resultado.errores.length} advertencias. Revise el kardex.`,
          life: 5000
        });
      }
      
      toast.current.show({
        severity: "success",
        summary: "Kardex Generado",
        detail: mensajeDetalle,
        life: 5000
      });
      
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "No se pudo generar el kardex.";
      toast.current.show({
        severity: "error",
        summary: "Error al Generar Kardex",
        detail: errorMsg,
        life: 5000
      });
    }
    setLoading(false);
  };

  const handleAnular = async (id, empresaId) => {
    setLoading(true);
    try {
      const resultado = await anularMovimientoAlmacen(id, empresaId);
      
      // Mostrar resumen detallado de la anulación
      const mensajeDetalle = `
        Movimiento anulado exitosamente:
        - Kardex eliminados: ${resultado.kardexEliminados || 0}
        - Productos afectados: ${resultado.productosAfectados || 0}
        - SaldoAlmacenDetallado: ${resultado.saldosDetActualizados || 0}
        - SaldoAlmacenGeneral: ${resultado.saldosGenActualizados || 0}
        - SaldosDetProductoCliente: ${resultado.saldosDetProductoClienteActualizados || 0}
        - SaldosProductoCliente: ${resultado.saldosProductoClienteActualizados || 0}
      `;
      
      toast.current.show({
        severity: "success",
        summary: "Movimiento Anulado",
        detail: mensajeDetalle,
        life: 5000
      });
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "No se pudo anular el movimiento.";
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
    // Usar la relación incluida del backend
    return rowData.empresa?.razonSocial || "";
  };

  const tipoDocumentoNombre = (rowData) => {
    // Usar la relación incluida del backend
    return rowData.tipoDocumento?.descripcion || "";
  };

  const conceptoNombre = (rowData) => {
    // Usar la relación incluida del backend
    return rowData.conceptoMovAlmacen?.descripcionArmada || "";
  };

  const entidadNombre = (rowData) => {
    // Usar la relación incluida del backend
    return rowData.entidadComercial?.razonSocial || "";
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
                label="Consulta de Stock"
                icon="pi pi-chart-bar"
                className="p-button-info"
                size="small"
                outlined
                onClick={() => setShowConsultaStock(true)}
                disabled={loading || !empresaSeleccionada}
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
        style={{ width: "1350px", maxWidth: "95vw" }}
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
          estadosMercaderia={estadosMercaderia}
          estadosCalidad={estadosCalidad}
          empresaFija={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onCerrar={handleCerrar}
          onAnular={handleAnular}
          onGenerarKardex={handleGenerarKardex}
          loading={loading}
          toast={toast}
        />
      </Dialog>

      {/* Diálogo de Consulta de Stock */}
      <ConsultaStockForm
        visible={showConsultaStock}
        onHide={() => setShowConsultaStock(false)}
        empresaIdInicial={empresaSeleccionada}
      />
    </div>
  );
}
