/**
 * ProvisionPlanillaButton.jsx
 *
 * Componente autónomo tipo botón para generar el asiento de provisión de la planilla.
 * Abre un diálogo con las deudas candidatas, permite seleccionar las que se provisionan y genera
 * UN asiento consolidado: por cada deuda, Debe = tipoDeuda.cuentaProvisionId y
 * Haber = tipoDeuda.cuentaContableId (el backend suma por cuenta y compensa el mismo pasivo).
 *
 * Props:
 * - deudas: deudas candidatas, con `personalNombre` y `tipoDeudaNombre` ya resueltos
 * - seleccionInicialIds: ids que llegan preseleccionados al abrir el diálogo (opcional)
 * - disabled: deshabilita el botón
 * - toast: ref de Toast (opcional)
 * - onFinalizado: callback al terminar (para refrescar la lista)
 */
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { generarProvisionPlanilla } from "../../api/tesoreria/deudaConPersonal";
import AsientoContableViewer from "../common/AsientoContableViewer";
import { formatearNumero, formatearFecha } from "../../utils/utils";

const ProvisionPlanillaButton = ({
  deudas = [],
  seleccionInicialIds = [],
  label = "Provisión Planilla",
  icon = "pi pi-calculator",
  className = "p-button-help",
  style,
  disabled = false,
  toast,
  onFinalizado,
}) => {
  const [visible, setVisible] = useState(false);
  const [seleccion, setSeleccion] = useState([]);
  const [fechaAsiento, setFechaAsiento] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultadoProvision, setResultadoProvision] = useState(null);

  // No se provisionan los saldos iniciales ni las deudas que ya tienen asiento
  const estaContabilizada = (d) => d.asientosContables?.length > 0;
  const candidatas = deudas.filter((d) => !d.esSaldoInicial && !estaContabilizada(d));
  const totalSeleccion = seleccion.reduce((suma, d) => suma + Number(d.montoOriginal || 0), 0);

  const mostrarToast = (severity, summary, detail, life = 5000) =>
    toast?.current?.show({ severity, summary, detail, life });

  const abrir = () => {
    const marcadas = deudas.filter((d) => seleccionInicialIds.includes(Number(d.id)));
    const saldosIniciales = marcadas.filter((d) => d.esSaldoInicial).length;
    const yaContabilizadas = marcadas.filter((d) => !d.esSaldoInicial && estaContabilizada(d)).length;
    if (saldosIniciales > 0) {
      mostrarToast(
        "warn",
        "Saldos iniciales omitidos",
        `La provisión es solo para deudas nuevas. Se omitieron ${saldosIniciales} deuda(s) de saldo inicial de su selección.`,
        8000,
      );
    }
    if (yaContabilizadas > 0) {
      mostrarToast(
        "warn",
        "Deudas ya contabilizadas omitidas",
        `Se omitieron ${yaContabilizadas} deuda(s) que ya tienen asiento de su selección.`,
        8000,
      );
    }
    setSeleccion(candidatas.filter((d) => seleccionInicialIds.includes(Number(d.id))));
    setFechaAsiento(null);
    setVisible(true);
  };

  const cerrar = () => {
    if (!procesando) setVisible(false);
  };

  const generar = async () => {
    try {
      setProcesando(true);
      const resultado = await generarProvisionPlanilla({
        deudaIds: seleccion.map((d) => Number(d.id)),
        fechaAsiento: fechaAsiento ? fechaAsiento.toISOString() : undefined,
      });
      mostrarToast("success", "Provisión generada", `Asiento ${resultado.numeroAsiento}`);
      setVisible(false);
      setResultadoProvision(resultado);
      onFinalizado?.();
    } catch (error) {
      mostrarToast(
        "error",
        "No se pudo generar la provisión",
        error.response?.data?.message || error.message,
        8000,
      );
    } finally {
      setProcesando(false);
    }
  };

  const footer = (
    <div className="flex justify-content-between align-items-center">
      <span className="font-bold">
        {seleccion.length} seleccionadas · Total {formatearNumero(totalSeleccion)}
      </span>
      <div>
        <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={cerrar} disabled={procesando} />
        <Button
          label="Generar asiento"
          icon="pi pi-check"
          onClick={generar}
          disabled={seleccion.length === 0}
          loading={procesando}
        />
      </div>
    </div>
  );

  return (
    <>
      <Button
        type="button"
        label={label}
        icon={icon}
        className={className}
        style={style}
        disabled={disabled}
        onClick={abrir}
        tooltip="Generar el asiento de provisión de la planilla"
        tooltipOptions={{ position: "top" }}
      />

      <Dialog
        visible={visible}
        onHide={cerrar}
        header="Provisión de Planilla"
        footer={footer}
        style={{ width: "900px", maxWidth: "95vw" }}
        closable={!procesando}
        modal
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="font-bold block mb-2">Fecha del asiento (opcional)</label>
            <Calendar
              value={fechaAsiento}
              onChange={(e) => setFechaAsiento(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              showButtonBar
              placeholder="Por defecto, la fecha más reciente de las deudas"
              style={{ width: "100%" }}
            />
          </div>

          <DataTable
            value={candidatas}
            dataKey="id"
            selection={seleccion}
            onSelectionChange={(e) => setSeleccion(e.value)}
            size="small"
            showGridlines
            stripedRows
            paginator
            rows={50}
            scrollable
            scrollHeight="360px"
            emptyMessage="No hay deudas para provisionar con los filtros actuales"
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column field="id" header="ID" sortable style={{ width: "5rem" }} />
            <Column field="personalNombre" header="Personal" sortable style={{ minWidth: "200px" }} />
            <Column field="tipoDeudaNombre" header="Tipo de Deuda" sortable style={{ minWidth: "160px" }} />
            <Column
              header="Fecha"
              body={(d) => formatearFecha(d.fecha, "-")}
              sortable
              sortField="fecha"
              style={{ width: "7rem" }}
            />
            <Column
              header="Monto"
              body={(d) => formatearNumero(d.montoOriginal)}
              sortable
              sortField="montoOriginal"
              style={{ textAlign: "right", width: "8rem" }}
            />
          </DataTable>
        </div>
      </Dialog>

      {/* Resultado: asiento de provisión generado */}
      <Dialog
        visible={Boolean(resultadoProvision)}
        onHide={() => setResultadoProvision(null)}
        header={`Provisión de Planilla generada - ${resultadoProvision?.numeroAsiento || ""}`}
        footer={
          <Button label="Cerrar" icon="pi pi-times" onClick={() => setResultadoProvision(null)} />
        }
        style={{ width: "1000px", maxWidth: "95vw" }}
        modal
      >
        {resultadoProvision && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="font-bold">
              {resultadoProvision.deudasProvisionadas} deuda(s) provisionada(s) · {resultadoProvision.lineas} línea(s) · Debe/Haber{" "}
              {formatearNumero(resultadoProvision.totalDebe)}
            </div>
            <AsientoContableViewer asientoContableId={resultadoProvision.asientoId} showHeader={true} />
          </div>
        )}
      </Dialog>
    </>
  );
};

export default ProvisionPlanillaButton;
