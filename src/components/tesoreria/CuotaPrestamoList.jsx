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

  const handleGuardarTodo = async () => {
    try {
      setLoading(true);
      await guardarCuotasBulk(prestamoBancarioId, cuotas);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cuotas guardadas correctamente",
        life: 3000,
      });
      await cargarCuotas();
    } catch (error) {
      console.error("Error al guardar cuotas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar cuotas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCellEditComplete = (e) => {
    const { rowData, newValue, field } = e;
    const cuotasActualizadas = [...cuotas];
    const index = cuotasActualizadas.findIndex((c) => c.id === rowData.id);

    if (field === "fechaVencimiento") {
      cuotasActualizadas[index][field] = newValue;
    } else {
      const numero = parseFloat(newValue);
      cuotasActualizadas[index][field] = isNaN(numero) ? 0 : numero;

      if (
        field === "montoCapital" ||
        field === "montoInteres" ||
        field === "montoComision" ||
        field === "montoSeguro"
      ) {
        const cuota = cuotasActualizadas[index];
        cuota.montoTotal =
          (cuota.montoCapital || 0) +
          (cuota.montoInteres || 0) +
          (cuota.montoComision || 0) +
          (cuota.montoSeguro || 0);
      }

      if (field === "montoCapital") {
        recalcularSaldos(cuotasActualizadas, index);
      }
    }

    setCuotas(cuotasActualizadas);
  };

  const recalcularSaldos = (cuotasArray, desdeIndex) => {
    for (let i = desdeIndex; i < cuotasArray.length; i++) {
      if (i === 0) {
        cuotasArray[i].saldoCapitalAntes = prestamo.montoDesembolsado;
      } else {
        cuotasArray[i].saldoCapitalAntes =
          cuotasArray[i - 1].saldoCapitalDespues;
      }
      cuotasArray[i].saldoCapitalDespues =
        cuotasArray[i].saldoCapitalAntes - cuotasArray[i].montoCapital;

      const saldoAntes = cuotasArray[i].saldoCapitalAntes;
      const tasaMensual = (prestamo.tasaInteresAnual || 0) / 12 / 100;
      cuotasArray[i].montoInteres = saldoAntes * tasaMensual;
      cuotasArray[i].montoTotal =
        cuotasArray[i].montoCapital +
        cuotasArray[i].montoInteres +
        (cuotasArray[i].montoComision || 0) +
        (cuotasArray[i].montoSeguro || 0);
    }
  };

  const cellEditor = (options) => {
    if (options.field === "fechaVencimiento") {
      return (
        <Calendar
          value={options.value}
          onChange={(e) => options.editorCallback(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
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
                  label="Regenerar Cronograma"
                  icon="pi pi-refresh"
                  severity="warning"
                  onClick={handleGenerarCronograma}
                  loading={loading}
                  disabled={readOnly}
                />
                <Button
                  label="Guardar Todo"
                  icon="pi pi-save"
                  severity="success"
                  onClick={handleGuardarTodo}
                  loading={loading}
                  disabled={readOnly}
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
            sortable
            style={{ width: "110px", textAlign: "right", backgroundColor: "#fff3cd" }}
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