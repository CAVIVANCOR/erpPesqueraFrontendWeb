// src/pages/PagoCuentaPorPagar.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import PagoCuentaPorPagarForm from "../components/pagoCuentaPorPagar/PagoCuentaPorPagarForm";
import {
  getPagosCuentaPorPagar,
  getPagoCuentaPorPagarById,
  createPagoCuentaPorPagar,
  updatePagoCuentaPorPagar,
  deletePagoCuentaPorPagar,
} from "../api/cuentasPorCobrarPagar/pagoCuentaPorPagar";
import { getCuentaPorPagar } from "../api/cuentasPorCobrarPagar/cuentaPorPagar";
import { getMonedas } from "../api/moneda";
import { getMediosPago } from "../api/medioPago";
import { getBancos } from "../api/banco";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { useAuthStore } from "../shared/stores/useAuthStore";

export default function PagoCuentaPorPagar() {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  const [pagos, setPagos] = useState([]);
  const [cuentasPorPagar, setCuentasPorPagar] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [estados, setEstados] = useState([]);

  const [selectedPago, setSelectedPago] = useState(null);
  const [pagoDialog, setPagoDialog] = useState(false);
  const [deletePagoDialog, setDeletePagoDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        pagosData,
        cuentasData,
        monedasData,
        mediosPagoData,
        bancosData,
        cuentasCorrientesData,
        estadosData,
      ] = await Promise.all([
        getPagosCuentaPorPagar(),
        getCuentaPorPagar(),
        getMonedas(),
        getMediosPago(),
        getBancos(),
        getAllCuentaCorriente(),
        getEstadosMultiFuncion(),
      ]);

      const pagosFiltrados = pagosData?.filter((p) => p.cuentaPorPagarId !== null) || [];
      setPagos(pagosFiltrados);
      
      const cuentasPendientes = cuentasData?.filter(
        (c) => Number(c.saldoPendiente || 0) > 0
      ) || [];
      setCuentasPorPagar(cuentasPendientes);
      
      setMonedas(monedasData || []);
      setMediosPago(mediosPagoData || []);
      setBancos(bancosData || []);
      setCuentasCorrientes(cuentasCorrientesData || []);
      setEstados(estadosData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setFormData({});
    setSelectedPago(null);
    setIsEdit(false);
    setPagoDialog(true);
  };

  const hideDialog = () => {
    setPagoDialog(false);
    setFormData({});
    setSelectedPago(null);
  };

  const editPago = async (pago) => {
    try {
      setLoading(true);
      const pagoCompleto = await getPagoCuentaPorPagarById(pago.id);
      
      const dataParaEdicion = {
        ...pagoCompleto,
        cuentaPorPagarId: Number(pagoCompleto.cuentaPorPagarId),
        monedaId: Number(pagoCompleto.monedaId),
        medioPagoId: Number(pagoCompleto.medioPagoId),
        bancoId: pagoCompleto.bancoId ? Number(pagoCompleto.bancoId) : null,
        cuentaBancariaId: pagoCompleto.cuentaBancariaId ? Number(pagoCompleto.cuentaBancariaId) : null,
      };

      setFormData(dataParaEdicion);
      setSelectedPago(pago);
      setIsEdit(true);
      setPagoDialog(true);
    } catch (error) {
      console.error("Error al cargar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const savePago = async (data) => {
    try {
      setLoading(true);

      if (isEdit && selectedPago) {
        await updatePagoCuentaPorPagar(selectedPago.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoCuentaPorPagar(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeletePago = (pago) => {
    setSelectedPago(pago);
    setDeletePagoDialog(true);
  };

  const deletePagoConfirmed = async () => {
    try {
      setLoading(true);
      await deletePagoCuentaPorPagar(selectedPago.id);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago eliminado correctamente",
        life: 3000,
      });

      setDeletePagoDialog(false);
      setSelectedPago(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeletePagoDialog = () => {
    setDeletePagoDialog(false);
    setSelectedPago(null);
  };

  const cuentaPorPagarBodyTemplate = (rowData) => {
    const cuenta = cuentasPorPagar.find((c) => Number(c.id) === Number(rowData.cuentaPorPagarId));
    if (!cuenta && rowData.cuentaPorPagar) {
      return `${rowData.cuentaPorPagar.numeroOrdenCompra || rowData.cuentaPorPagarId}`;
    }
    return cuenta?.numeroOrdenCompra || rowData.cuentaPorPagarId || "-";
  };

  const proveedorBodyTemplate = (rowData) => {
    if (rowData.cuentaPorPagar?.proveedor) {
      return rowData.cuentaPorPagar.proveedor.razonSocial;
    }
    const cuenta = cuentasPorPagar.find((c) => Number(c.id) === Number(rowData.cuentaPorPagarId));
    return cuenta?.proveedor?.razonSocial || "-";
  };

  const monedaBodyTemplate = (rowData) => {
    const moneda = monedas.find((m) => Number(m.id) === Number(rowData.monedaId));
    return moneda?.codigoSunat || "-";
  };

  const medioPagoBodyTemplate = (rowData) => {
    if (rowData.medioPago) {
      return rowData.medioPago.nombre;
    }
    const medio = mediosPago.find((m) => Number(m.id) === Number(rowData.medioPagoId));
    return medio?.nombre || "-";
  };

  const fechaBodyTemplate = (rowData, field) => {
    if (!rowData[field]) return "-";
    return new Date(rowData[field]).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    const monto = rowData[field] || 0;
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editPago(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDeletePago(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          label="Nuevo Pago"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNew}
        />
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          className="p-button-info"
          onClick={loadData}
          loading={loading}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </span>
    );
  };

  const deletePagoDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeletePagoDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={deletePagoConfirmed}
        loading={loading}
      />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />

      <h2>Gestión de Pagos (Pagos de Cuentas por Pagar)</h2>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={pagos}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron pagos"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        responsiveLayout="scroll"
        stripedRows
        size="small"
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ minWidth: "80px" }}
        />
        <Column
          header="Cuenta por Pagar"
          body={cuentaPorPagarBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Proveedor"
          body={proveedorBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Fecha Pago"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaPago")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Monto Pagado"
          body={(rowData) => montoBodyTemplate(rowData, "montoPago")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          header="Moneda"
          body={monedaBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="Medio de Pago"
          body={medioPagoBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="numeroOperacion"
          header="Nro. Operación"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={pagoDialog}
        style={{ width: "90vw", maxWidth: "1200px" }}
        header={isEdit ? "Editar Pago" : "Registrar Nuevo Pago"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <PagoCuentaPorPagarForm
          isEdit={isEdit}
          defaultValues={formData}
          cuentasPorPagar={cuentasPorPagar}
          monedas={monedas}
          mediosPago={mediosPago}
          bancos={bancos}
          cuentasCorrientes={cuentasCorrientes}
          estados={estados}
          onSubmit={savePago}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deletePagoDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deletePagoDialogFooter}
        onHide={hideDeletePagoDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedPago && (
            <span>
              ¿Está seguro de eliminar el pago de{" "}
              <b>{montoBodyTemplate(selectedPago, "montoPago")}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
