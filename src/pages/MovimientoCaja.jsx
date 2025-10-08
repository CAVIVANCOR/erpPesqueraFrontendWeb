// src/pages/MovimientoCaja.jsx
// Pantalla CRUD profesional para MovimientoCaja. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import MovimientoCajaForm from "../components/movimientoCaja/MovimientoCajaForm";
import DetEntregaRendirPescaIndustrial from "../components/temporadaPesca/DetEntregaRendirPescaIndustrial";
import DetEntregaRendirNovedadConsumo from "../components/novedadPescaConsumo/DetEntregaRendirNovedadConsumo";
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
import { getAllDetMovsEntregaRendir } from "../api/detMovsEntregaRendir";
import { getAllEntregaARendir } from "../api/entregaARendir";
import { getAllDetMovsEntRendirPescaConsumo } from "../api/detMovsEntRendirPescaConsumo";
import { getEntregasARendirPescaConsumo } from "../api/entregaARendirPescaConsumo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";

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

  // Estados para DetEntregaRendirPescaIndustrial
  const [movimientosDetEntrega, setMovimientosDetEntrega] = useState([]);
  const [entregasARendir, setEntregasARendir] = useState([]);
  const [selectedMovimientosDetEntrega, setSelectedMovimientosDetEntrega] =
    useState([]);
  const [loadingDetEntrega, setLoadingDetEntrega] = useState(false);
  const [selectedDetMovsIds, setSelectedDetMovsIds] = useState([]);
  const [estadosMultiFuncion, setEstadosMultiFuncion] = useState([]);

  // Estados para DetEntregaRendirNovedadConsumo (Pesca Consumo)
  const [movimientosDetEntregaConsumo, setMovimientosDetEntregaConsumo] = useState([]);
  const [entregasARendirConsumo, setEntregasARendirConsumo] = useState([]);
  const [selectedMovimientosDetEntregaConsumo, setSelectedMovimientosDetEntregaConsumo] =
    useState([]);
  const [loadingDetEntregaConsumo, setLoadingDetEntregaConsumo] = useState(false);
  const [selectedDetMovsIdsConsumo, setSelectedDetMovsIdsConsumo] = useState([]);

  const cargarEstadosMultiFuncion = async () => {
    try {
      const data = await getEstadosMultiFuncion();
      // Filtrar solo los estados de "MOVIMIENTOS CAJA" (tipoProvieneDeId === 6)
      const estadosFiltrados = data.filter(
        (estado) => Number(estado.tipoProvieneDeId) === 6
      );
      setEstadosMultiFuncion(estadosFiltrados);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los estados multifunción.",
      });
    }
  };

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
    cargarMovimientosDetEntrega();
    cargarEntregasARendir();
    cargarMovimientosDetEntregaConsumo();
    cargarEntregasARendirConsumo();
    cargarEstadosMultiFuncion();
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
        detail: "No se pudo cargar los movimientos de caja.",
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
        detail: "No se pudo cargar los tipos de movimiento.",
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
        detail: "No se pudo cargar los tipos de referencia.",
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

  // Funciones para cargar datos de DetEntregaRendirPescaIndustrial
  const cargarMovimientosDetEntrega = async () => {
    setLoadingDetEntrega(true);
    try {
      const data = await getAllDetMovsEntregaRendir();
      setMovimientosDetEntrega(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entrega a rendir.",
      });
    }
    setLoadingDetEntrega(false);
  };

  const cargarEntregasARendir = async () => {
    try {
      const data = await getAllEntregaARendir();
      setEntregasARendir(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir.",
      });
    }
  };

  // Funciones para cargar datos de DetEntregaRendirNovedadConsumo (Pesca Consumo)
  const cargarMovimientosDetEntregaConsumo = async () => {
    setLoadingDetEntregaConsumo(true);
    try {
      const data = await getAllDetMovsEntRendirPescaConsumo();
      setMovimientosDetEntregaConsumo(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los movimientos de entrega a rendir de pesca consumo.",
      });
    }
    setLoadingDetEntregaConsumo(false);
  };

  const cargarEntregasARendirConsumo = async () => {
    try {
      const data = await getEntregasARendirPescaConsumo();
      setEntregasARendirConsumo(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las entregas a rendir de pesca consumo.",
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

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text"
          onClick={() => handleEdit(rowData)}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="movimiento-caja-container">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro de eliminar este registro?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />

      {/* TabView con 8 TabPanels */}
      <TabView>
        <TabPanel header="Pesca Industrial">
          <div className="mb-4">
            <DetEntregaRendirPescaIndustrial
              entregaARendir={entregasARendir[0] || null}
              movimientos={movimientosDetEntrega}
              personal={personal}
              centrosCosto={centrosCosto}
              tiposMovimiento={tipoMovEntregaRendir}
              entidadesComerciales={entidadesComerciales}
              temporadaPescaIniciada={true}
              loading={loadingDetEntrega}
              selectedMovimientos={selectedMovimientosDetEntrega}
              onSelectionChange={(e) => {
                setSelectedMovimientosDetEntrega(e.value);
                setSelectedDetMovsIds(e.value.map((mov) => mov.id));
              }}
              onDataChange={() => {
                cargarMovimientosDetEntrega();
                cargarEntregasARendir();
              }}
            />
          </div>
        </TabPanel>

        <TabPanel header="Pesca Consumo">
          <div className="mb-4">
            <DetEntregaRendirNovedadConsumo
              entregaARendirPescaConsumo={entregasARendirConsumo[0] || null}
              movimientos={movimientosDetEntregaConsumo}
              personal={personal}
              centrosCosto={centrosCosto}
              tiposMovimiento={tipoMovEntregaRendir}
              entidadesComerciales={entidadesComerciales}
              novedadPescaConsumoIniciada={true}
              loading={loadingDetEntregaConsumo}
              selectedMovimientos={selectedMovimientosDetEntregaConsumo}
              onSelectionChange={(e) => {
                setSelectedMovimientosDetEntregaConsumo(e.value);
                setSelectedDetMovsIdsConsumo(e.value.map((mov) => mov.id));
              }}
              onDataChange={() => {
                cargarMovimientosDetEntregaConsumo();
                cargarEntregasARendirConsumo();
              }}
            />
          </div>
        </TabPanel>

        <TabPanel header="Compras">
          <div className="p-4">
            <h3>Compras</h3>
            <p>Contenido para Compras - En desarrollo</p>
          </div>
        </TabPanel>

        <TabPanel header="Ventas">
          <div className="p-4">
            <h3>Ventas</h3>
            <p>Contenido para Ventas - En desarrollo</p>
          </div>
        </TabPanel>

        <TabPanel header="Producción">
          <div className="p-4">
            <h3>Producción</h3>
            <p>Contenido para Producción - En desarrollo</p>
          </div>
        </TabPanel>

        <TabPanel header="Almacén">
          <div className="p-4">
            <h3>Almacén</h3>
            <p>Contenido para Almacén - En desarrollo</p>
          </div>
        </TabPanel>

        <TabPanel header="Servicios">
          <div className="p-4">
            <h3>Servicios</h3>
            <p>Contenido para Servicios - En desarrollo</p>
          </div>
        </TabPanel>

        <TabPanel header="Mantenimiento">
          <div className="p-4">
            <h3>Mantenimiento</h3>
            <p>Contenido para Mantenimiento - En desarrollo</p>
          </div>
        </TabPanel>
      </TabView>

      {/* Dialog para formulario */}
      <Dialog
        visible={showDialog}
        style={{ width: "800px" }}
        header={editing ? "Editar Movimiento Caja" : "Nuevo Movimiento Caja"}
        modal
        onHide={() => {
          setShowDialog(false);
          setEditing(null);
        }}
      >
        <MovimientoCajaForm
          item={editing}
          centrosCosto={centrosCosto}
          modulos={modulos}
          personal={personal}
          empresas={empresas}
          tipoMovEntregaRendir={tipoMovEntregaRendir}
          monedas={monedas}
          tipoReferenciaMovimientoCaja={tipoReferenciaMovimientoCaja}
          cuentasCorrientes={cuentasCorrientes}
          entidadesComerciales={entidadesComerciales}
          estadosMultiFuncion={estadosMultiFuncion}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowDialog(false);
            setEditing(null);
          }}
        />
      </Dialog>
    </div>
  );
}