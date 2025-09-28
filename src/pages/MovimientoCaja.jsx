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
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion"; // Agregar esta línea

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
  const [estadosMultiFuncion, setEstadosMultiFuncion] = useState([]); // Agregar esta línea

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
    cargarEstadosMultiFuncion(); // Agregar esta línea
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

  // Handler para aplicar movimientos seleccionados de DetEntregaRendir
  const handleAplicarMovimientosSeleccionados = () => {
    if (selectedDetMovsIds.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar al menos un movimiento.",
      });
      return;
    }

    // Obtener los registros completos de los movimientos seleccionados
    const detEntregasRendirSelect = movimientosDetEntrega.filter((mov) =>
      selectedDetMovsIds.includes(mov.id)
    );

    // Validar que todos los registros tengan la misma entidadComercialId
    const entidadesComerciales = detEntregasRendirSelect.map(
      (mov) => mov.entidadComercialId
    );
    const entidadComercialUnica = entidadesComerciales[0];

    // Verificar si todas las entidades comerciales son iguales (incluyendo null/undefined)
    const todasIguales = entidadesComerciales.every(
      (entidad) => entidad === entidadComercialUnica
    );

    if (!todasIguales) {
      toast.current.show({
        severity: "error",
        summary: "Error de Validación",
        detail:
          "Los registros seleccionados deben ser de una misma Entidad Comercial.",
        life: 5000,
      });
      return;
    }

    // Calcular la sumatoria de montos
    const montoTotal = detEntregasRendirSelect.reduce(
      (suma, mov) => suma + Number(mov.monto),
      0
    );

    // Obtener el módulo origen (debe ser el mismo en todos)
    const moduloOrigenMovCajaId =
      detEntregasRendirSelect[0]?.moduloOrigenMovCajaId;

    // Preparar datos para el formulario
    const datosFormulario = {
      selectedDetMovsIds,
      detEntregasRendirSelect,
      entidadComercialId: entidadComercialUnica,
      monto: montoTotal,
      moduloOrigenMovCajaId: moduloOrigenMovCajaId,
      // Asignar automáticamente estado "PENDIENTE"
      estadoId:
        estadosMultiFuncion.find((estado) =>
          estado.descripcion?.toUpperCase().includes("PENDIENTE")
        )?.id || null,
      tipoMovimientoId: null, // Se definirá en el formulario
      fechaMovimiento: new Date(),
    };

    // Abrir el formulario de MovimientoCaja con los datos preparados
    setEditing(datosFormulario);
    setShowDialog(true);
  };
  // Funciones para cambio de estados
  const handleValidarMovimiento = async (movimiento) => {
    try {
      const estadoValidado = estadosMultiFuncion.find((estado) =>
        estado.descripcion?.toUpperCase().includes("VALIDADO")
      );

      if (!estadoValidado) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró el estado VALIDADO",
        });
        return;
      }

      await actualizarMovimientoCaja(movimiento.id, {
        ...movimiento,
        estadoId: estadoValidado.id,
      });

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento validado correctamente",
      });

      cargarItems();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al validar movimiento",
      });
    }
  };

  const handleGenerarAsiento = async (movimiento) => {
    try {
      const estadoAsiento = estadosMultiFuncion.find(
        (estado) =>
          estado.descripcion?.toUpperCase().includes("ASIENTO") &&
          estado.descripcion?.toUpperCase().includes("GENERADO")
      );

      if (!estadoAsiento) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró el estado ASIENTO GENERADO",
        });
        return;
      }

      await actualizarMovimientoCaja(movimiento.id, {
        ...movimiento,
        estadoId: estadoAsiento.id,
      });

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Asiento contable generado correctamente",
      });

      cargarItems();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al generar asiento contable",
      });
    }
  };

  const actionBody = (rowData) => {
    // Obtener estado actual
    const estadoActual = estadosMultiFuncion.find(
      (e) => Number(e.id) === Number(rowData.estadoId)
    );
    const estadoDesc = estadoActual?.descripcion?.toUpperCase() || "";

    const esPendiente = estadoDesc.includes("PENDIENTE");
    const esValidado = estadoDesc.includes("VALIDADO");

    return (
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => handleEdit(rowData)}
          aria-label="Editar"
        />

        {esPendiente && (
          <Button
            icon="pi pi-check-circle"
            className="p-button-text p-button-warning p-button-sm"
            onClick={() => handleValidarMovimiento(rowData)}
            aria-label="Validar Movimiento"
            tooltip="Validar Movimiento"
          />
        )}

        {esValidado && (
          <Button
            icon="pi pi-file-edit"
            className="p-button-text p-button-info p-button-sm"
            onClick={() => handleGenerarAsiento(rowData)}
            aria-label="Generar Asiento"
            tooltip="Generar Asiento Contable"
          />
        )}

        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger p-button-sm"
            onClick={() => handleDelete(rowData)}
            aria-label="Eliminar"
          />
        )}
      </div>
    );
  };

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
              entidadesComerciales={entidadesComerciales} // Nueva prop
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
          <div className="p-4">
            <h3>Pesca Consumo</h3>
            <p>Contenido para Pesca Consumo - En desarrollo</p>
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

      {/* DataTable CRUD original */}
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
                label="Aplicar"
                icon="pi pi-check"
                className="p-button-success"
                onClick={handleAplicarMovimientosSeleccionados}
                disabled={selectedDetMovsIds.length === 0}
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
          onValidarMovimiento={handleValidarMovimiento} // Agregar
          onGenerarAsiento={handleGenerarAsiento} // Agregar
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
          selectedDetMovsIds={editing?.selectedDetMovsIds || []}
          detEntregasRendirSelect={editing?.detEntregasRendirSelect || []}
          estadosMultiFuncion={estadosMultiFuncion}
        />
      </Dialog>
    </div>
  );
}
