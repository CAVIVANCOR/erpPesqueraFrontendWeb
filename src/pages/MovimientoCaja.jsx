// src/pages/MovimientoCaja.jsx
// Pantalla CRUD profesional para MovimientoCaja. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import MovimientoCajaForm from "../components/movimientoCaja/MovimientoCajaForm";
import {
  getAllMovimientoCaja,
  crearMovimientoCaja,
  actualizarMovimientoCaja,
  eliminarMovimientoCaja,
} from "../api/movimientoCaja";
import { getCentrosCosto } from "../api/centroCosto";
import { getModulos } from "../api/moduloSistema";
import { getPersonal } from "../api/personal";
import { getEmpresas } from "../api/empresa";
import { getTiposMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getMonedas } from "../api/moneda";
import { getAllTipoReferenciaMovimientoCaja } from "../api/tipoReferenciaMovimientoCaja";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Movimientos de Caja.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function MovimientoCaja() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tipoMovEntregaRendir, setTipoMovEntregaRendir] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tipoReferenciaMovimientoCaja, setTipoReferenciaMovimientoCaja] =
    useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);

  useEffect(() => {
    cargarItems();
    cargarCentrosCosto();
    cargarModulos();
    cargarPersonal();
    cargarEmpresas();
    cargarTipoMovEntregaRendir();
    cargarMonedas();
    cargarTipoReferenciaMovimientoCaja();
    cargarCuentasCorrientes();
    cargarEntidadesComerciales();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllMovimientoCaja();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista.",
      });
    }
    setLoading(false);
  };

  const cargarCentrosCosto = async () => {
    try {
      const data = await getCentrosCosto();
      setCentrosCosto(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los centros de costo.",
      });
    }
  };

  const cargarModulos = async () => {
    try {
      const data = await getModulos();
      setModulos(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los módulos.",
      });
    }
  };

  const cargarPersonal = async () => {
    try {
      const data = await getPersonal();
      setPersonal(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el personal.",
      });
    }
  };

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las empresas.",
      });
    }
  };

  const cargarTipoMovEntregaRendir = async () => {
    try {
      const data = await getTiposMovEntregaRendir();
      setTipoMovEntregaRendir(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de movimiento entrega/rendir.",
      });
    }
  };

  const cargarMonedas = async () => {
    try {
      const data = await getMonedas();
      setMonedas(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las monedas.",
      });
    }
  };

  const cargarTipoReferenciaMovimientoCaja = async () => {
    try {
      const data = await getAllTipoReferenciaMovimientoCaja();
      setTipoReferenciaMovimientoCaja(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de referencia movimiento caja.",
      });
    }
  };

  const cargarCuentasCorrientes = async () => {
    try {
      const data = await getAllCuentaCorriente();
      setCuentasCorrientes(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las cuentas corrientes.",
      });
    }
  };

  const cargarEntidadesComerciales = async () => {
    try {
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entidades comerciales.",
      });
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

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarMovimientoCaja(toDelete.id);
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
        await actualizarMovimientoCaja(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearMovimientoCaja(data);
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
        detail: "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
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
        message="¿Está seguro que desea eliminar este registro?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={items}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Movimientos de Caja</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleAdd}
                disabled={loading}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="empresaOrigenId" header="Empresa Origen" />
        <Column field="cuentaCorrienteOrigenId" header="Cuenta Origen" />
        <Column field="empresaDestinoId" header="Empresa Destino" />
        <Column field="cuentaCorrienteDestinoId" header="Cuenta Destino" />
        <Column field="fecha" header="Fecha" />
        <Column field="tipoMovimientoId" header="Tipo Movimiento" />
        <Column
          field="entidadComercialId"
          header="Entidad Comercial"
          body={(rowData) => {
            const entidad = entidadesComerciales.find(
              (e) => Number(e.id) === Number(rowData.entidadComercialId)
            );
            return entidad ? entidad.razonSocial : rowData.entidadComercialId;
          }}
        />
        <Column field="monto" header="Monto" />
        <Column field="monedaId" header="Moneda" />
        <Column field="descripcion" header="Descripción" />
        <Column field="tipoReferenciaId" header="Tipo Referencia" />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Movimiento" : "Nuevo Movimiento"}
        visible={showDialog}
        style={{ width: 1300 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <MovimientoCajaForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          centrosCosto={centrosCosto}
          modulos={modulos}
          personal={personal}
          empresas={empresas}
          tipoMovEntregaRendir={tipoMovEntregaRendir}
          monedas={monedas}
          tipoReferenciaMovimientoCaja={tipoReferenciaMovimientoCaja}
          cuentasCorrientes={cuentasCorrientes}
          entidadesComerciales={entidadesComerciales}
        />
      </Dialog>
    </div>
  );
}
