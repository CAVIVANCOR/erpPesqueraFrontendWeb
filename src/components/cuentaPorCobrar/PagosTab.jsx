// src/components/cuentaPorCobrar/PagosTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import PagoCobroForm from "./PagoCobroForm";
import {
  getPagosPorCuentaCobrar,
  createPagoCuentaPorCobrar,
  updatePagoCuentaPorCobrar,
  deletePagoCuentaPorCobrar,
} from "../../api/cuentasPorCobrarPagar/pagoCuentaPorCobrar";

export default function PagosTab({
  cuentaPorCobrarId,
  saldoPendiente,
  monedaId,
  empresaId,
  monedas,
  mediosPago,
  bancos,
  cuentasCorrientes,
  estados,
  puedeEditar,
  toast,
  onPagoRegistrado,
  readOnly = false,
}) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  useEffect(() => {
    if (cuentaPorCobrarId) {
      cargarPagos();
    } else {
      setPagos([]);
    }
  }, [cuentaPorCobrarId]);

  const cargarPagos = async () => {
    if (!cuentaPorCobrarId) return;

    setLoading(true);
    try {
      const data = await getPagosPorCuentaCobrar(cuentaPorCobrarId);
      setPagos(data || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los pagos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    if (!cuentaPorCobrarId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la cuenta por cobrar antes de registrar pagos",
        life: 3000,
      });
      return;
    }

    setPagoSeleccionado(null);
    setEditando(false);
    setDialogVisible(true);
  };

  const abrirDialogoEditar = (pago) => {
    setPagoSeleccionado(pago);
    setEditando(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setPagoSeleccionado(null);
    setEditando(false);
  };

  const handleGuardar = async (formData) => {
    if (!formData.montoPago || formData.montoPago <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El monto del cobro debe ser mayor a 0",
        life: 3000,
      });
      return;
    }

    if (Number(formData.montoPago) > Number(saldoPendiente)) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: `El monto del cobro (${formData.montoPago}) no puede ser mayor al saldo pendiente (${saldoPendiente})`,
        life: 3000,
      });
      return;
    }

    if (!formData.medioPagoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un medio de pago",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const estadoPagoId = estados?.find(
        (e) =>
          e.nombre?.toUpperCase().includes("PAGADO") ||
          e.nombre?.toUpperCase().includes("COBRADO"),
      )?.id;

      const dataParaGrabacion = {
        cuentaPorCobrarId: Number(cuentaPorCobrarId),
        empresaId: Number(empresaId),
        fechaPago: formData.fechaPago,
        montoPagado: Number(formData.montoPago),
        monedaId: Number(formData.monedaId),
        tipoCambio: Number(formData.tipoCambio),
        medioPagoId: Number(formData.medioPagoId),
        numeroOperacion: formData.numeroOperacion || null,
        bancoId: formData.bancoId ? Number(formData.bancoId) : null,
        cuentaBancariaId: formData.cuentaBancariaId
          ? Number(formData.cuentaBancariaId)
          : null,
        movimientoCajaId: null,
        estadoId: estadoPagoId ? Number(estadoPagoId) : null,
        observaciones: formData.observaciones || null,
      };

      if (editando && formData.id) {
        await updatePagoCuentaPorCobrar(formData.id, dataParaGrabacion);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cobro actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoCuentaPorCobrar(dataParaGrabacion);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cobro registrado correctamente",
          life: 3000,
        });
      }

      cerrarDialogo();
      await cargarPagos();
      if (onPagoRegistrado) onPagoRegistrado();
    } catch (error) {
      console.error("Error al guardar cobro:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo guardar el cobro",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (pago) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el cobro de ${Number(pago.montoPago).toFixed(2)}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: () => handleEliminar(pago.id),
    });
  };

  const handleEliminar = async (pagoId) => {
    setLoading(true);
    try {
      await deletePagoCuentaPorCobrar(pagoId);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cobro eliminado correctamente",
        life: 3000,
      });
      await cargarPagos();
      if (onPagoRegistrado) onPagoRegistrado();
    } catch (error) {
      console.error("Error al eliminar cobro:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo eliminar el cobro",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaPago) return "-";
    return new Date(rowData.fechaPago).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(rowData.montoPago || 0));
  };

  const monedaBodyTemplate = (rowData) => {
    const moneda = monedas?.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    return moneda?.codigoSunat || "-";
  };

  const medioPagoBodyTemplate = (rowData) => {
    const medio = mediosPago?.find(
      (m) => Number(m.id) === Number(rowData.medioPagoId),
    );
    return medio?.nombre || "-";
  };

  const actionBodyTemplate = (rowData) => {
    if (readOnly || !puedeEditar) return null;

    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => abrirDialogoEditar(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminar(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const totalPagado = pagos.reduce(
    (sum, p) => sum + Number(p.montoPago || 0),
    0,
  );

  return (
    <div className="pagos-tab">
      <div
        className="mb-3"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <strong>Saldo Pendiente: </strong>
          <span
            style={{ color: "red", fontSize: "1.2rem", fontWeight: "bold" }}
          >
            {new Intl.NumberFormat("es-PE", {
              style: "decimal",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(saldoPendiente || 0))}
          </span>
          <span className="ml-3">
            <strong>Total Cobrado: </strong>
            <span
              style={{ color: "green", fontSize: "1.2rem", fontWeight: "bold" }}
            >
              {new Intl.NumberFormat("es-PE", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalPagado)}
            </span>
          </span>
        </div>
        {!readOnly && puedeEditar && (
          <Button
            label="Registrar Cobro"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirDialogoNuevo}
            disabled={!cuentaPorCobrarId || Number(saldoPendiente) <= 0}
          />
        )}
      </div>

      <DataTable
        value={pagos}
        loading={loading}
        emptyMessage="No hay cobros registrados"
        size="small"
        stripedRows
      >
        <Column field="id" header="ID" style={{ width: "80px" }} />
        <Column
          header="Fecha Cobro"
          body={fechaBodyTemplate}
          style={{ width: "120px" }}
        />
        <Column
          header="Monto"
          body={montoBodyTemplate}
          style={{ width: "120px", textAlign: "right" }}
        />
        <Column
          header="Moneda"
          body={monedaBodyTemplate}
          style={{ width: "100px" }}
        />
        <Column
          header="Medio de Pago"
          body={medioPagoBodyTemplate}
          style={{ width: "150px" }}
        />
        <Column
          field="numeroOperacion"
          header="Nro. Operación"
          style={{ width: "150px" }}
        />
        <Column field="observaciones" header="Observaciones" />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      <PagoCobroForm
        visible={dialogVisible}
        pago={pagoSeleccionado}
        isEdit={editando}
        saldoPendiente={saldoPendiente}
        monedaId={monedaId}
        monedas={monedas}
        mediosPago={mediosPago}
        bancos={bancos}
        cuentasCorrientes={cuentasCorrientes}
        onHide={cerrarDialogo}
        onSave={handleGuardar}
        loading={loading}
        readOnly={readOnly || !puedeEditar}
      />
    </div>
  );
}
