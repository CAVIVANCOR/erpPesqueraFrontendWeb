// src/components/cuentaPorPagar/PagosTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import PagoCuentaPorPagarForm from "./PagoCuentaPorPagarForm";
import {
  getPagosPorCuentaPagar,
  createPagoCuentaPorPagar,
  updatePagoCuentaPorPagar,
  deletePagoCuentaPorPagar,
} from "../../api/cuentasPorCobrarPagar/pagoCuentaPorPagar";
// ⭐ AGREGADO: Importar API de préstamos bancarios
import { getAllPrestamoBancario } from "../../api/tesoreria/prestamoBancarios";
export default function PagosTab({
  cuentaPorPagarId,
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
  // ⭐ AGREGADO: Estado para préstamos bancarios
  const [prestamosBancarios, setPrestamosBancarios] = useState([]);

  useEffect(() => {
    if (cuentaPorPagarId) {
      cargarPagos();
    } else {
      setPagos([]);
    }
  }, [cuentaPorPagarId]);

  // ⭐ AGREGADO: Cargar préstamos bancarios al montar el componente
  useEffect(() => {
    cargarPrestamosBancarios();
  }, []);

  const cargarPagos = async () => {
    if (!cuentaPorPagarId) return;

    setLoading(true);
    try {
      const data = await getPagosPorCuentaPagar(cuentaPorPagarId);
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

  // ⭐ AGREGADO: Función para cargar préstamos bancarios
  const cargarPrestamosBancarios = async () => {
    try {
      const data = await getAllPrestamoBancario ();
      setPrestamosBancarios(data || []);
    } catch (error) {
      console.error("Error al cargar préstamos bancarios:", error);
    }
  };

  const abrirDialogoNuevo = () => {
    if (!cuentaPorPagarId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la cuenta por pagar antes de registrar pagos",
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
        detail: "El monto del pago debe ser mayor a 0",
        life: 3000,
      });
      return;
    }

    if (Number(formData.montoPago) > Number(saldoPendiente)) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: `El monto del pago (${formData.montoPago}) no puede ser mayor al saldo pendiente (${saldoPendiente})`,
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

    // ⭐ AGREGADO: Validar que si el medio de pago es PRÉSTAMO BANCARIO, debe seleccionar un préstamo
    const medioPagoSeleccionado = mediosPago?.find(
      (m) => Number(m.id) === Number(formData.medioPagoId)
    );
    const esPrestamoBancario =
      medioPagoSeleccionado?.codigo === "07" ||
      medioPagoSeleccionado?.nombre?.toUpperCase().includes("PRÉSTAMO");

    if (esPrestamoBancario && !formData.prestamoBancarioId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un préstamo bancario cuando el medio de pago es PRÉSTAMO BANCARIO",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const estadoPagoId = estados?.find(
        (e) =>
          e.nombre?.toUpperCase().includes("PAGADO") ||
          e.nombre?.toUpperCase().includes("COBRADO")
      )?.id;

      const dataParaGrabacion = {
        cuentaPorPagarId: Number(cuentaPorPagarId),
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
        prestamoBancarioId: formData.prestamoBancarioId // ⭐ AGREGADO
          ? Number(formData.prestamoBancarioId)
          : null,
        movimientoCajaId: null,
        estadoId: estadoPagoId ? Number(estadoPagoId) : null,
        observaciones: formData.observaciones || null,
      };

      if (editando && formData.id) {
        await updatePagoCuentaPorPagar(formData.id, dataParaGrabacion);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoCuentaPorPagar(dataParaGrabacion);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }

      cerrarDialogo();
      await cargarPagos();

      if (onPagoRegistrado) {
        onPagoRegistrado();
      }
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo guardar el pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (pago) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el pago de ${Number(
        pago.montoPago
      ).toFixed(2)}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: () => eliminarPago(pago.id),
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
    });
  };

  const eliminarPago = async (pagoId) => {
    setLoading(true);
    try {
      await deletePagoCuentaPorPagar(pagoId);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago eliminado correctamente",
        life: 3000,
      });
      await cargarPagos();
      if (onPagoRegistrado) {
        onPagoRegistrado();
      }
    } catch (error) {
      console.error("Error al eliminar pago:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo eliminar el pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fechaTemplate = (rowData) => {
    return new Date(rowData.fechaPago).toLocaleDateString("es-ES");
  };

  const montoTemplate = (rowData) => {
    return Number(rowData.montoPago).toFixed(2);
  };

  const medioPagoTemplate = (rowData) => {
    return rowData.medioPago?.nombre || "N/A";
  };

  // ⭐ AGREGADO: Template para mostrar préstamo bancario
  const prestamoBancarioTemplate = (rowData) => {
    if (!rowData.prestamoBancarioId) return "-";
    return rowData.prestamoBancario?.numeroPrestamo || "N/A";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => abrirDialogoEditar(rowData)}
          disabled={!puedeEditar || readOnly}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmarEliminar(rowData)}
          disabled={!puedeEditar || readOnly}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  return (
    <div className="card">
      <div style={{ marginBottom: "1rem" }}>
        <Button
          label="Registrar Pago"
          icon="pi pi-plus"
          onClick={abrirDialogoNuevo}
          disabled={!puedeEditar || readOnly}
        />
      </div>

      <DataTable
        value={pagos}
        loading={loading}
        emptyMessage="No hay pagos registrados"
        size="small"
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column
          field="fechaPago"
          header="Fecha"
          body={fechaTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="montoPago"
          header="Monto"
          body={montoTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="medioPago.nombre"
          header="Medio de Pago"
          body={medioPagoTemplate}
          sortable
          style={{ width: "150px" }}
        />
        {/* ⭐ AGREGADO: Columna para préstamo bancario */}
        <Column
          field="prestamoBancario.numeroPrestamo"
          header="Préstamo"
          body={prestamoBancarioTemplate}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="numeroOperacion"
          header="Nº Operación"
          style={{ width: "150px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      <PagoCuentaPorPagarForm
        visible={dialogVisible}
        pago={pagoSeleccionado}
        isEdit={editando}
        saldoPendiente={saldoPendiente}
        monedaId={monedaId}
        monedas={monedas}
        mediosPago={mediosPago}
        bancos={bancos}
        cuentasCorrientes={cuentasCorrientes}
        prestamosBancarios={prestamosBancarios} // ⭐ AGREGADO: Pasar préstamos bancarios
        onHide={cerrarDialogo}
        onSave={handleGuardar}
        loading={loading}
        readOnly={readOnly}
      />
    </div>
  );
}