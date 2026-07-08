import React, { useState, useEffect, useRef, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { FilterMatchMode } from "primereact/api";
import {
  getCuotasPorPrestamo,
  deleteCuotaPrestamo,
  generarCronogramaCuotas,
  guardarCuotasBulk,
} from "../../api/tesoreria/cuotaPrestamo";
import { getResponsiveFontSize } from "../../utils/utils";

// Estilos para celdas editables
const editableCellStyle = {
  backgroundColor: '#e3f2fd',
  border: '1px solid #90caf9',
  cursor: 'pointer'
};

export default function CuotaPrestamoList({
  prestamoBancarioId,
  prestamo,
  readOnly = false,
}) {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [selectedDateCell, setSelectedDateCell] = useState(null);
  const [tempDate, setTempDate] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    if (prestamoBancarioId) {
      cargarCuotas();
    }
  }, [prestamoBancarioId]);

  const cargarCuotas = async () => {
    try {
      setLoading(true);
      const data = await getCuotasPorPrestamo(prestamoBancarioId);
      if (data && data.length > 0) {
        setCuotas(data);
      } else {
        await handleGenerarCronograma();
      }
    } catch (error) {
      console.error("Error al cargar cuotas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar cuotas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarCronograma = async () => {
    try {
      setLoading(true);
      const data = await generarCronogramaCuotas(prestamoBancarioId);
      setCuotas(data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cronograma generado: ${data.length} cuotas`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al generar cronograma:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al generar cronograma",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleRegenerarDesdeCuota = async (numeroCuota) => {
    try {
      setLoading(true);

      const cuotasArray = [...cuotas];
      const index = cuotasArray.findIndex(c => c.numeroCuota === numeroCuota);

      if (index === -1) return;

      // Recalcular desde esta cuota hacia adelante
      for (let i = index; i < cuotasArray.length; i++) {
        // Calcular saldo antes
        const saldoAnterior = i === 0
          ? parseFloat(prestamo?.montoDesembolsado || 0)
          : parseFloat(cuotasArray[i - 1].saldoCapitalDespues || 0);

        cuotasArray[i].saldoCapitalAntes = saldoAnterior;

        // Si NO fue editado manualmente, recalcular capital
        if (!cuotasArray[i].capitalEditadoManualmente) {
          // Calcular cuota fija (sistema francés)
          const tasaMensual = prestamo?.tasaInteresEfectiva
            ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
            : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

          const n = cuotasArray.length;
          const cuotaFija = parseFloat(prestamo?.montoDesembolsado || 0) *
            (tasaMensual * Math.pow(1 + tasaMensual, n)) /
            (Math.pow(1 + tasaMensual, n) - 1);

          const interesCuota = saldoAnterior * tasaMensual;
          cuotasArray[i].montoCapital = cuotaFija - interesCuota;
        }

        // Si NO fue editado manualmente, recalcular interés
        if (!cuotasArray[i].interesEditadoManualmente) {
          const tasaMensual = prestamo?.tasaInteresEfectiva
            ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
            : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

          cuotasArray[i].montoInteres = saldoAnterior * tasaMensual;
        }

        // Recalcular saldo después
        cuotasArray[i].saldoCapitalDespues = saldoAnterior - parseFloat(cuotasArray[i].montoCapital || 0);

        // Recalcular total
        cuotasArray[i].montoTotal =
          parseFloat(cuotasArray[i].montoCapital || 0) +
          parseFloat(cuotasArray[i].montoInteres || 0) +
          parseFloat(cuotasArray[i].montoComision || 0) +
          parseFloat(cuotasArray[i].montoSeguro || 0);
      }

      setCuotas([...cuotasArray]);

      // Guardar
      await guardarCuotasBulk(prestamoBancarioId, cuotasArray);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cuotas regeneradas desde la ${numeroCuota}`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al regenerar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al regenerar cuotas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarCalculos = async () => {
    if (!cuotas || cuotas.length < 2) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe haber al menos 2 cuotas para completar cálculos",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      const cuotasArray = [...cuotas];

      // Empezar desde la cuota 2 (índice 1)
      for (let i = 1; i < cuotasArray.length; i++) {
        // Calcular saldo antes desde la cuota anterior
        const saldoAnterior = parseFloat(cuotasArray[i - 1].saldoCapitalDespues || 0);
        cuotasArray[i].saldoCapitalAntes = saldoAnterior;

        // Si NO fue editado manualmente, recalcular interés
        if (!cuotasArray[i].interesEditadoManualmente) {
          const tasaMensual = prestamo?.tasaInteresEfectiva
            ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
            : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

          cuotasArray[i].montoInteres = saldoAnterior * tasaMensual;
        }

        // Si NO fue editado manualmente, recalcular capital
        if (!cuotasArray[i].capitalEditadoManualmente) {
          // Calcular cuota fija (sistema francés)
          const tasaMensual = prestamo?.tasaInteresEfectiva
            ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
            : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

          const n = cuotasArray.length;
          const cuotaFija = parseFloat(prestamo?.montoDesembolsado || 0) *
            (tasaMensual * Math.pow(1 + tasaMensual, n)) /
            (Math.pow(1 + tasaMensual, n) - 1);

          const interesCuota = parseFloat(cuotasArray[i].montoInteres || 0);
          cuotasArray[i].montoCapital = cuotaFija - interesCuota;
        }

        // Recalcular saldo después
        cuotasArray[i].saldoCapitalDespues = saldoAnterior - parseFloat(cuotasArray[i].montoCapital || 0);

        // Recalcular total
        cuotasArray[i].montoTotal =
          parseFloat(cuotasArray[i].montoCapital || 0) +
          parseFloat(cuotasArray[i].montoInteres || 0) +
          parseFloat(cuotasArray[i].montoComision || 0) +
          parseFloat(cuotasArray[i].montoSeguro || 0);
      }

      // Actualizar estado primero
      setCuotas([...cuotasArray]);

      // Guardar en BD
      await guardarCuotasBulk(prestamoBancarioId, cuotasArray);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cálculos completados y guardados correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al completar cálculos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al completar cálculos",
        life: 3000,
      });
      // Recargar cuotas en caso de error
      await cargarCuotas();
    } finally {
      setLoading(false);
    }
  };

  const onCellEditComplete = async (e) => {
    let { rowData, newValue, field, originalEvent: event } = e;

    const cuotasArray = [...cuotas];
    const index = cuotasArray.findIndex((c) => c.numeroCuota === rowData.numeroCuota);

    if (index === -1) {
      event.preventDefault();
      return;
    }

    if (field === "fechaVencimiento") {
      cuotasArray[index][field] = newValue;
      cuotasArray[index].fechaEditadaManualmente = true;
    } else {
      // CONVERTIR A NÚMERO - NUNCA STRINGS
      const valor = parseFloat(newValue) || 0;
      cuotasArray[index][field] = valor;

      // Marcar como editado manualmente
      if (field === "montoCapital") {
        cuotasArray[index].capitalEditadoManualmente = true;
      } else if (field === "montoInteres") {
        cuotasArray[index].interesEditadoManualmente = true;
      } else if (field === "montoComision") {
        cuotasArray[index].comisionEditadaManualmente = true;
      } else if (field === "montoSeguro") {
        cuotasArray[index].seguroEditadoManualmente = true;
      }

      // RECALCULAR TOTAL - SIEMPRE CON NÚMEROS
      const nuevoTotal =
        parseFloat(cuotasArray[index].montoCapital || 0) +
        parseFloat(cuotasArray[index].montoInteres || 0) +
        parseFloat(cuotasArray[index].montoComision || 0) +
        parseFloat(cuotasArray[index].montoSeguro || 0);

      // Crear nuevo objeto para forzar re-render
      cuotasArray[index] = {
        ...cuotasArray[index],
        montoTotal: nuevoTotal
      };
      // Si editó capital, recalcular saldos siguientes
      if (field === "montoCapital") {
        // Recalcular saldo después de la cuota editada
        const saldoAnteriorCuotaEditada = index === 0
          ? parseFloat(prestamo?.montoDesembolsado || 0)
          : parseFloat(cuotasArray[index - 1].saldoCapitalDespues || 0);

        cuotasArray[index].saldoCapitalDespues = saldoAnteriorCuotaEditada - parseFloat(cuotasArray[index].montoCapital || 0);

        // Recalcular saldos de cuotas siguientes (desde index + 1)
        for (let i = index + 1; i < cuotasArray.length; i++) {
          const saldoAnterior = parseFloat(cuotasArray[i - 1].saldoCapitalDespues || 0);

          cuotasArray[i].saldoCapitalAntes = saldoAnterior;
          cuotasArray[i].saldoCapitalDespues = saldoAnterior - parseFloat(cuotasArray[i].montoCapital || 0);
        }
      }
    }

    // Forzar re-render creando nuevo array
    setCuotas([...cuotasArray]);

    // Guardar inmediatamente
    try {
      await guardarCuotasBulk(prestamoBancarioId, cuotasArray);
      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: `${field} actualizado`,
        life: 2000,
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar cambios",
        life: 3000,
      });
      await cargarCuotas();
    }

    event.preventDefault();
  };
  // Recalcular solo el total de UNA cuota (cuando se edita interés/comisión/seguro)
  const recalcularTotalCuota = (cuotasArray, index) => {
    cuotasArray[index].montoTotal =
      parseFloat(cuotasArray[index].montoCapital || 0) +
      parseFloat(cuotasArray[index].montoInteres || 0) +
      parseFloat(cuotasArray[index].montoComision || 0) +
      parseFloat(cuotasArray[index].montoSeguro || 0);
  };

  // Recalcular saldos e intereses desde una cuota hacia adelante (cuando se edita capital)
  const recalcularDesdeCuota = (cuotasArray, index) => {
    const tasaMensual = prestamo?.tasaInteresEfectiva
      ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
      : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

    for (let i = index; i < cuotasArray.length; i++) {
      // Recalcular saldo antes
      const saldoAnterior = i === 0
        ? parseFloat(prestamo?.montoDesembolsado || 0)
        : cuotasArray[i - 1].saldoCapitalDespues;

      cuotasArray[i].saldoCapitalAntes = saldoAnterior;

      // Recalcular saldo después
      cuotasArray[i].saldoCapitalDespues = saldoAnterior - (cuotasArray[i].montoCapital || 0);

      // Solo recalcular interés si NO fue editado manualmente
      if (!cuotasArray[i].interesEditadoManualmente) {
        cuotasArray[i].montoInteres = saldoAnterior * tasaMensual;
      }

      // Recalcular total
      cuotasArray[i].montoTotal =
        parseFloat(cuotasArray[i].montoCapital || 0) +
        parseFloat(cuotasArray[i].montoInteres || 0) +
        parseFloat(cuotasArray[i].montoComision || 0) +
        parseFloat(cuotasArray[i].montoSeguro || 0);
    }
  };

  const cellEditor = (options) => {
    if (options.field === "fechaVencimiento") {
      return (
        <Button
          type="button"
          label={options.value ? new Date(options.value).toLocaleDateString('es-PE') : 'Seleccionar'}
          icon="pi pi-calendar"
          onClick={() => {
            setSelectedDateCell(options);
            // Convertir string a Date object si es necesario
            const fechaActual = options.value ? new Date(options.value) : new Date();
            setTempDate(fechaActual);
            setShowCalendarDialog(true);
          }}
          style={{ width: '100%' }}
          size="small"
        />
      );
    }
    return (
      <InputNumber
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
      />
    );
  };

  const handleDateSelect = async () => {
    if (selectedDateCell && tempDate) {
      setShowCalendarDialog(false);

      // Actualizar directamente en el array de cuotas
      const cuotasArray = [...cuotas];
      const index = cuotasArray.findIndex((c) => c.id === selectedDateCell.rowData.id);

      if (index !== -1) {
        // Crear nuevo objeto para forzar re-render
        cuotasArray[index] = {
          ...cuotasArray[index],
          fechaVencimiento: tempDate,
          fechaEditadaManualmente: true
        };

        // Actualizar estado ANTES de guardar para mostrar cambio inmediatamente
        setCuotas([...cuotasArray]);

        // Guardar inmediatamente en BD
        try {
          await guardarCuotasBulk(prestamoBancarioId, cuotasArray);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Fecha actualizada correctamente",
            life: 2000,
          });
        } catch (error) {
          console.error("Error al guardar fecha:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al guardar la fecha",
            life: 3000,
          });
          // Recargar para revertir cambio
          await cargarCuotas();
        }
      }
    }
    setSelectedDateCell(null);
    setTempDate(null);
  };

  const totales = useMemo(() => {
    return {
      montoCapital: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoCapital || 0),
        0
      ),
      montoInteres: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoInteres || 0),
        0
      ),
      montoComision: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoComision || 0),
        0
      ),
      montoSeguro: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoSeguro || 0),
        0
      ),
      montoTotal: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoTotal || 0),
        0
      ),
    };
  }, [cuotas]);

  const confirmDelete = (cuota) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cuota ${cuota.numeroCuota}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => handleDelete(cuota.id),
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteCuotaPrestamo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cuota eliminada correctamente",
        life: 3000,
      });
      await cargarCuotas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar cuota",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const estadoBodyTemplate = (rowData) => {
    const severity =
      rowData.estadoPago === "PAGADO"
        ? "success"
        : rowData.estadoPago === "VENCIDO"
          ? "danger"
          : "warning";
    return <Tag value={rowData.estadoPago} severity={severity} />;
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) return "";
    return new Date(rowData.fechaVencimiento).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData[field] || 0);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={readOnly}
        />
      </div>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      <Dialog
        header="Seleccionar Fecha"
        visible={showCalendarDialog}
        style={{ width: '550px' }}
        onHide={() => {
          setShowCalendarDialog(false);
          setSelectedDateCell(null);
          setTempDate(null);
        }}
        footer={
          <div>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowCalendarDialog(false)}
              className="p-button-text"
            />
            <Button
              type="button"
              label="Aceptar"
              icon="pi pi-check"
              onClick={handleDateSelect}
              autoFocus
            />
          </div>
        }
      >
        <Calendar
          value={tempDate}
          onChange={(e) => setTempDate(e.value)}
          dateFormat="dd/mm/yy"
          inline
          style={{ width: "100%" }}
        />
      </Dialog>

      <div className="card">
        <DataTable
          value={cuotas}
          loading={loading}
          dataKey="id"
          showGridlines
          stripedRows
          size="small"
          paginator
          rows={20}
          rowsPerPageOptions={[20, 40, 80, 160]}
          filters={filters}
          globalFilterFields={["numeroCuota", "estadoPago"]}
          emptyMessage="No se encontraron cuotas"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuotas"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          style={{ fontSize: getResponsiveFontSize() }}
          editMode="cell"
          header={
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Cronograma de Cuotas</h2>
              </div>
              <div style={{ flex: 1, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <Button
                  type="button"
                  label="Regenerar Cronograma"
                  icon="pi pi-refresh"
                  severity="warning"
                  onClick={handleGenerarCronograma}
                  loading={loading}
                  disabled={readOnly}
                  tooltip="Regenera todas las cuotas desde cero"
                  tooltipOptions={{ position: "top" }}
                />
                <Button
                  type="button"
                  label="Completar Cálculos"
                  icon="pi pi-calculator"
                  severity="info"
                  onClick={handleCompletarCalculos}
                  loading={loading}
                  disabled={readOnly || cuotas.length < 2}
                  tooltip="Recalcula cuotas desde la 2 respetando valores editados"
                  tooltipOptions={{ position: "top" }}
                />
              </div>
            </div>
          }
        >
          <Column
            field="numeroCuota"
            header="N°"
            sortable
            style={{ width: "60px", textAlign: "center" }}
            footer="TOTALES:"
            footerStyle={{ textAlign: "right", fontWeight: "bold" }}
          />
          <Column
            field="fechaVencimiento"
            header="Vencimiento"
            body={fechaBodyTemplate}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "130px", textAlign: "center" }}
            bodyStyle={editableCellStyle}
          />
          <Column
            field="saldoCapitalAntes"
            header="Saldo Antes"
            body={(r) => montoBodyTemplate(r, "saldoCapitalAntes")}
            sortable
            style={{ width: "130px", textAlign: "right", backgroundColor: "#f5f5f5" }}
          />
          <Column
            field="montoCapital"
            header="Capital"
            body={(r) => montoBodyTemplate(r, "montoCapital")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "120px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoCapital)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoInteres"
            header="Interés"
            body={(r) => montoBodyTemplate(r, "montoInteres")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "110px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoInteres)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoComision"
            header="Comisión"
            body={(r) => montoBodyTemplate(r, "montoComision")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "110px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoComision)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoSeguro"
            header="Seguro"
            body={(r) => montoBodyTemplate(r, "montoSeguro")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "100px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoSeguro)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoTotal"
            header="Total"
            body={(r) => montoBodyTemplate(r, "montoTotal")}
            sortable
            style={{
              width: "120px",
              textAlign: "right",
              backgroundColor: "#d1ecf1",
              fontWeight: "bold",
            }}
            footer={formatCurrency(totales.montoTotal)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="saldoCapitalDespues"
            header="Saldo Después"
            body={(r) => montoBodyTemplate(r, "saldoCapitalDespues")}
            sortable
            style={{ width: "130px", textAlign: "right", backgroundColor: "#f5f5f5" }}
          />
          <Column
            field="estadoPago"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "80px" }}
          />
        </DataTable>
      </div>
    </div>
  );
}