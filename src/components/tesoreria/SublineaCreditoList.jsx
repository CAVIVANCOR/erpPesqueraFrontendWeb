import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import SublineaCreditoDetalle from "./SublineaCreditoDetalle";
import {
  getSublineasCreditoPorLinea,
  deleteSublineaCredito,
} from "../../api/tesoreria/sublineaCredito";
import { getTipoPrestamo } from "../../api/tesoreria/tipoPrestamo";
import { getPrestamoBancariosPorSublinea } from "../../api/tesoreria/prestamoBancarios";
import { getResponsiveFontSize } from "../../utils/utils";
import { calcularTotalesSublineas, esSublineaBase, comparteCupo } from "../../utils/lineaCredito";

const SublineaCreditoList = ({
  lineaCreditoId,
  lineaCredito,
  onSublineasChange,
}) => {
  const [sublineas, setSublineas] = useState([]);
  const [tiposPrestamo, setTiposPrestamo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [sublineaSeleccionada, setSublineaSeleccionada] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [prestamosData, setPrestamosData] = useState({});
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sublineaToDelete, setSublineaToDelete] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    if (lineaCreditoId) {
      cargarSublineas();
      cargarTiposPrestamo();
    }
  }, [lineaCreditoId]);

  const cargarSublineas = async () => {
    try {
      setLoading(true);
      const data = await getSublineasCreditoPorLinea(lineaCreditoId);
      setSublineas(data);
      if (onSublineasChange) {
        onSublineasChange(data);
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar sublíneas de crédito",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarPrestamosPorSublinea = async (sublineaId) => {
    try {
      const prestamos = await getPrestamoBancariosPorSublinea(sublineaId);
      setPrestamosData((prevData) => ({
        ...prevData,
        [sublineaId]: prestamos,
      }));
    } catch (error) {
      console.error("Error al cargar préstamos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar préstamos de la sublínea",
        life: 3000,
      });
    }
  };

  const onRowExpand = async (event) => {
    const sublineaId = event.data.id;
    await cargarPrestamosPorSublinea(sublineaId);
    toast.current?.show({
      severity: "success",
      summary: "Sublínea Expandida",
      detail: `Cargando préstamos de sublínea ${sublineaId}`,
      life: 2000,
    });
  };

  const onRowCollapse = (event) => {
    toast.current?.show({
      severity: "info",
      summary: "Sublínea Contraída",
      detail: `Sublínea ${event.data.id}`,
      life: 2000,
    });
  };

  // Botones para expandir y contraer todas las filas
  const expandAll = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Expandir todas las sublíneas
      let _expandedRows = {};
      sublineas.forEach((sublinea) => (_expandedRows[`${sublinea.id}`] = true));
      setExpandedRows(_expandedRows);

      // Cargar préstamos para todas las sublíneas
      const prestamosPromises = sublineas.map(async (sublinea) => {
        if (!prestamosData[sublinea.id]) {
          try {
            const prestamos = await getPrestamoBancariosPorSublinea(
              sublinea.id,
            );
            return { sublineaId: sublinea.id, prestamos };
          } catch (error) {
            console.error(
              `Error cargando préstamos para sublínea ${sublinea.id}:`,
              error,
            );
            return { sublineaId: sublinea.id, prestamos: [] };
          }
        }
        return {
          sublineaId: sublinea.id,
          prestamos: prestamosData[sublinea.id],
        };
      });

      const prestamosResults = await Promise.all(prestamosPromises);

      // Actualizar estado de préstamos
      const newPrestamosData = { ...prestamosData };
      prestamosResults.forEach(({ sublineaId, prestamos }) => {
        newPrestamosData[sublineaId] = prestamos;
      });
      setPrestamosData(newPrestamosData);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Todas las sublíneas expandidas correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error expandiendo todas las sublíneas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al expandir todas las sublíneas",
        life: 3000,
      });
    }
  };

  const collapseAll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedRows({});
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Todas las sublíneas contraídas correctamente",
      life: 3000,
    });
  };

  const rowExpansionTemplate = (data) => {
    const prestamos = prestamosData[data.id] || [];

    // Totales por moneda de los préstamos listados (nunca se suman soles con dólares)
    const totalesPorMoneda = Object.values(
      prestamos.reduce((acumulado, prestamo) => {
        const codigo = prestamo.moneda?.codigoSunat;
        if (!codigo) return acumulado;
        if (!acumulado[codigo]) {
          acumulado[codigo] = {
            codigo,
            nombre: prestamo.moneda?.nombreLargo || codigo,
            colorFondo: prestamo.moneda?.colorFondo || undefined,
            cantidad: 0,
            desembolsado: 0,
            saldoCapital: 0,
          };
        }
        acumulado[codigo].cantidad += 1;
        acumulado[codigo].desembolsado += parseFloat(prestamo.montoDesembolsado || 0);
        acumulado[codigo].saldoCapital += parseFloat(prestamo.saldoCapital || 0);
        return acumulado;
      }, {}),
    ).sort((a, b) => a.codigo.localeCompare(b.codigo));

    // Por cada moneda: una fila de rótulos y otra de importes, con el color de fondo de la moneda
    const footerPrestamos =
      totalesPorMoneda.length > 0 ? (
        <ColumnGroup>
          {totalesPorMoneda.flatMap((total) => {
            const importe = (valor) =>
              new Intl.NumberFormat("es-PE", { style: "currency", currency: total.codigo, minimumFractionDigits: 2 }).format(valor);
            const fondo = total.colorFondo;
            const estiloTitulo = { textAlign: "left", fontWeight: "bold", backgroundColor: fondo, color: "#000" };
            const estiloRotulo = {
              textAlign: "right",
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              backgroundColor: fondo,
              color: "#000",
            };
            const estiloImporte = { textAlign: "right", fontWeight: "bold", backgroundColor: fondo, color: "#000" };
            return [
              <Row key={`${total.codigo}-rotulos`}>
                <Column footer={`TOTALES EN ${total.nombre} (${total.codigo})`} colSpan={2} footerStyle={estiloTitulo} />
                <Column footer="Monto desembolsado" footerStyle={estiloRotulo} />
                <Column footer="Saldo capital" footerStyle={estiloRotulo} />
                <Column footer="" footerStyle={estiloRotulo} />
              </Row>,
              <Row key={`${total.codigo}-importes`}>
                <Column
                  footer={`${total.cantidad} préstamo${total.cantidad === 1 ? "" : "s"} en ${total.codigo}`}
                  colSpan={2}
                  footerStyle={{ ...estiloTitulo, fontWeight: "normal" }}
                />
                <Column footer={importe(total.desembolsado)} footerStyle={estiloImporte} />
                <Column footer={importe(total.saldoCapital)} footerStyle={estiloImporte} />
                <Column footer="" footerStyle={estiloImporte} />
              </Row>,
            ];
          })}
        </ColumnGroup>
      ) : null;

    return (
      <div className="p-3">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <Tag
            value={`Préstamos de Sublínea: ${data.tipoPrestamo?.descripcion || data.id}`}
            severity="info"
            style={{
              width: "100%",
              fontSize: "1rem",
              padding: "0.5rem",
            }}
          />
        </div>

        {prestamos.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No hay préstamos registrados para esta sublínea
          </p>
        ) : (
          <DataTable
            value={prestamos}
            size="small"
            stripedRows
            showGridlines
            emptyMessage="No hay préstamos"
            footerColumnGroup={footerPrestamos}
          >
            <Column
              field="numeroPrestamo"
              header="Número Préstamo"
              style={{ fontWeight: "bold", minWidth: "150px" }}
              sortable
            />
            <Column
              field="fechaDesembolso"
              header="Fecha Desembolso"
              body={(rowData) => {
                if (!rowData.fechaDesembolso) return "N/A";
                return new Date(rowData.fechaDesembolso).toLocaleDateString(
                  "es-PE",
                  {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  },
                );
              }}
              sortable
            />
            <Column
              field="montoDesembolsado"
              header="Monto Desembolsado"
              body={(rowData) => {
                const moneda = rowData.moneda?.codigoSunat || "PEN";
                const monto = parseFloat(rowData.montoDesembolsado || 0);
                return new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: moneda,
                  minimumFractionDigits: 2,
                }).format(monto);
              }}
              style={{ textAlign: "right", fontWeight: "bold" }}
              sortable
            />
            <Column
              field="saldoCapital"
              header="Saldo Capital"
              body={(rowData) => {
                const moneda = rowData.moneda?.codigoSunat || "PEN";
                const saldo = parseFloat(rowData.saldoCapital || 0);
                return new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: moneda,
                  minimumFractionDigits: 2,
                }).format(saldo);
              }}
              style={{ textAlign: "right" }}
              sortable
            />
            <Column
              field="estado.descripcion"
              header="Estado"
              body={(rowData) => (
                <Tag
                  value={rowData.estado?.descripcion || "N/A"}
                  severity={
                    rowData.estado?.descripcion === "VIGENTE"
                      ? "success"
                      : rowData.estado?.descripcion === "CANCELADO"
                        ? "danger"
                        : "warning"
                  }
                />
              )}
              sortable
            />
          </DataTable>
        )}
      </div>
    );
  };

  const cargarTiposPrestamo = async () => {
    try {
      const data = await getTipoPrestamo();
      setTiposPrestamo(data);
    } catch (error) {
      console.error("Error al cargar tipos de préstamo:", error);
    }
  };

  const abrirNuevo = () => {
    setSublineaSeleccionada(null);
    setDialogVisible(true);
  };

  const editarSublinea = (sublinea) => {
    setSublineaSeleccionada(sublinea);
    setDialogVisible(true);
  };

  const handleEliminarSublinea = (sublinea) => {
    setSublineaToDelete(sublinea);
    setConfirmVisible(true);
  };

  const confirmarEliminacion = async () => {
    try {
      await deleteSublineaCredito(sublineaToDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Sublínea eliminada correctamente",
        life: 3000,
      });
      setConfirmVisible(false);
      cargarSublineas();
    } catch (error) {
      const mensaje =
        error.response?.data?.message || "Error al eliminar sublínea";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 3000,
      });
      setConfirmVisible(false);
    }
  };

  const onGuardar = () => {
    setDialogVisible(false);
    cargarSublineas();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: "Sublínea guardada correctamente",
      life: 3000,
    });
  };

  const onCancelar = () => {
    setDialogVisible(false);
  };

  const tipoPrestamoTemplate = (rowData) => {
    return (
      <span>
        {rowData.tipoPrestamo?.descripcion || "-"}
        {comparteCupo(rowData, sublineas) && (
          <Tag
            value="CUPO COMPARTIDO"
            severity="info"
            style={{ marginLeft: 6, fontSize: "0.65rem" }}
            title={`Comparte el cupo con las demás sublíneas "${rowData.descripcion}": el asignado cuenta una sola vez`}
          />
        )}
      </span>
    );
  };

  const montoAsignadoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#003366" }}>
        {new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: lineaCredito?.moneda?.codigoSunat || "PEN",
          minimumFractionDigits: 2,
        }).format(rowData.montoAsignado || 0)}
      </span>
    );
  };

  const montoUtilizadoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#006400" }}>
        {new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: lineaCredito?.moneda?.codigoSunat || "PEN",
          minimumFractionDigits: 2,
        }).format(rowData.montoUtilizado || 0)}
      </span>
    );
  };

  const montoDisponibleTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#4682B4" }}>
        {new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: lineaCredito?.moneda?.codigoSunat || "PEN",
          minimumFractionDigits: 2,
        }).format(rowData.montoDisponible || 0)}
      </span>
    );
  };

  const sobregirosTemplate = (rowData) => {
    const totalSobregiros = parseFloat(rowData.totalSobregiros || 0);

    if (totalSobregiros === 0) {
      return <span style={{ color: "#6c757d" }}>-</span>;
    }

    return (
      <span
        style={{
          color: "#dc3545",
          fontWeight: "bold",
          fontSize: "0.95rem",
        }}
      >
        {new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: lineaCredito?.moneda?.codigoSunat || "PEN",
          minimumFractionDigits: 2,
        }).format(totalSobregiros)}
      </span>
    );
  };
  const porcentajeUtilizadoTemplate = (rowData) => {
    const montoAsignado = parseFloat(rowData.montoAsignado || 0);
    const totalSobregiros = parseFloat(rowData.totalSobregiros || 0);
    const montoUtilizado = parseFloat(rowData.montoUtilizado || 0);
    const montoTotal = montoAsignado + totalSobregiros;

    const porcentaje =
      montoTotal > 0 ? ((montoUtilizado / montoTotal) * 100).toFixed(2) : 0;

    let severity = "success";
    if (porcentaje >= 90) severity = "danger";
    else if (porcentaje >= 70) severity = "warning";

    return (
      <div className="flex align-items-center gap-2">
        <span
          className={`text-${severity}`}
          style={{ fontWeight: "bold", fontSize: "0.95rem" }}
        >
          {porcentaje}%
        </span>
        <div
          className="w-full bg-gray-200"
          style={{ height: "8px", borderRadius: "4px" }}
        >
          <div
            className={`bg-${severity}`}
            style={{
              width: `${porcentaje}%`,
              height: "100%",
              borderRadius: "4px",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>
    );
  };

  const activoTemplate = (rowData) => {
    return (
      <i
        className={`pi ${rowData.activo ? "pi-check-circle text-green-500" : "pi-times-circle text-red-500"}`}
        style={{ fontSize: "1.5rem" }}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={(e) => {
            e.stopPropagation();
            editarSublinea(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            handleEliminarSublinea(rowData);
          }}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Las sublíneas con la misma descripción comparten cupo: ver utils/lineaCredito.js
  const calcularTotales = () => calcularTotalesSublineas(sublineas);

  const esFilaSumada = (rowData) => esSublineaBase(rowData, sublineas);

  const rowClassName = (rowData) => {
    return esFilaSumada(rowData) ? "fila-sumada" : "";
  };

  // Totales con cupo compartido (ver utils/lineaCredito.js): una fila de rótulos y otra de importes,
  // ambas con el color de fondo de la moneda de la línea (Moneda.colorFondo)
  const footerGroup = (() => {
    const totales = calcularTotales();
    const codigoMoneda = lineaCredito?.moneda?.codigoSunat || "PEN";
    const importe = (valor) =>
      new Intl.NumberFormat("es-PE", { style: "currency", currency: codigoMoneda, minimumFractionDigits: 2 }).format(valor);
    const fondo = lineaCredito?.moneda?.colorFondo || undefined;
    const estiloTitulo = { textAlign: "left", fontWeight: "bold", backgroundColor: fondo, color: "#000" };
    const estiloRotulo = {
      textAlign: "right",
      fontSize: "0.7rem",
      fontWeight: 600,
      textTransform: "uppercase",
      backgroundColor: fondo,
      color: "#000",
    };
    const estiloImporte = { textAlign: "right", fontWeight: "bold", fontSize: "0.95rem", backgroundColor: fondo, color: "#000" };
    const estiloVacio = { backgroundColor: fondo };

    return (
      <ColumnGroup>
        <Row>
          <Column footer="" footerStyle={estiloVacio} />
          <Column footer={`TOTALES EN ${codigoMoneda}`} colSpan={2} footerStyle={estiloTitulo} />
          <Column footer="Asignado" footerStyle={estiloRotulo} />
          <Column footer="Utilizado" footerStyle={estiloRotulo} />
          <Column footer="Disponible" footerStyle={estiloRotulo} />
          <Column footer="Sobregiro autorizado" footerStyle={estiloRotulo} />
          <Column footer="" colSpan={3} footerStyle={estiloVacio} />
        </Row>
        <Row>
          <Column footer="" footerStyle={estiloVacio} />
          <Column
            footer="Las sublíneas con cupo compartido cuentan una sola vez"
            colSpan={2}
            footerStyle={{ ...estiloTitulo, fontWeight: "normal", fontSize: "0.8rem" }}
          />
          <Column footer={importe(totales.totalAsignado)} footerStyle={estiloImporte} />
          <Column footer={importe(totales.totalUtilizado)} footerStyle={estiloImporte} />
          <Column footer={importe(totales.totalDisponible)} footerStyle={estiloImporte} />
          <Column footer={importe(totales.totalSobregiros)} footerStyle={estiloImporte} />
          <Column footer="" colSpan={3} footerStyle={estiloVacio} />
        </Row>
      </ColumnGroup>
    );
  })();

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
      }}
    >
      <div style={{ flex: 2 }}>
        <h3 className="m-0">Sublíneas de Crédito</h3>
        {calcularTotales().totalAsignado > parseFloat(lineaCredito?.montoAprobado || 0) && (
          <small style={{ color: "#dc3545", fontWeight: "bold" }}>
            El cupo asignado a las sublíneas supera el monto aprobado de la línea.
          </small>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Nueva Sublínea"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirNuevo}
          raised
          size="small"
          tooltip="Crear nueva sublínea"
          tooltipOptions={{ position: "bottom" }}
          severity="success"
        />
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Expandir Todo"
          icon="pi pi-plus"
          onClick={expandAll}
          raised
          size="small"
          tooltip="Expandir Todas las Sublíneas"
          tooltipOptions={{ position: "bottom" }}
          className="p-button-info"
          severity="info"
        />
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Contraer Todo"
          icon="pi pi-minus"
          onClick={collapseAll}
          raised
          size="small"
          tooltip="Contraer Todas las Sublíneas"
          tooltipOptions={{ position: "bottom" }}
          className="p-button-warning"
          severity="warning"
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message="¿Está seguro de eliminar esta sublínea de crédito?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={confirmarEliminacion}
        reject={() => setConfirmVisible(false)}
        acceptClassName="p-button-danger"
        acceptLabel="Sí"
        rejectLabel="No"
      />
      <style>{`
        .fila-sumada {
          background-color: #e8f5e9 !important;
        }
        .fila-sumada:hover {
          background-color: #c8e6c9 !important;
        }
      `}</style>
      <DataTable
        value={sublineas}
        loading={loading}
        header={header}
        footerColumnGroup={footerGroup}
        emptyMessage="No hay sublíneas registradas"
        stripedRows
        size="small"
        showGridlines
        rowExpansionTemplate={rowExpansionTemplate}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        onRowExpand={onRowExpand}
        onRowCollapse={onRowCollapse}
        dataKey="id"
        rowClassName={rowClassName}
        onRowClick={(e) => {
          // Solo editar si no se hizo clic en el botón expander o en los botones de acción
          if (
            !e.originalEvent.target.closest(".p-row-toggler") &&
            !e.originalEvent.target.closest("button")
          ) {
            editarSublinea(e.data);
          }
        }}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column expander style={{ width: "5rem" }} />
        <Column
          field="tipoPrestamo.nombre"
          header="Tipo de Préstamo"
          body={tipoPrestamoTemplate}
          sortable
        />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="montoAsignado"
          header="Monto Asignado"
          body={montoAsignadoTemplate}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="montoUtilizado"
          header="Monto Utilizado"
          body={montoUtilizadoTemplate}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="montoDisponible"
          header="Monto Disponible"
          body={montoDisponibleTemplate}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="totalSobregiros"
          header="Sobregiro"
          body={sobregirosTemplate}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column header="% Utilizado" body={porcentajeUtilizadoTemplate} style={{ textAlign: "right" }}/>
        <Column field="activo" header="Activo" body={activoTemplate} sortable />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "1300px" }}
        header={sublineaSeleccionada ? "Editar Sublínea" : "Nueva Sublínea"}
        modal
        onHide={onCancelar}
        maximizable
      >
        <SublineaCreditoDetalle
          sublinea={sublineaSeleccionada}
          lineaCreditoId={lineaCreditoId}
          lineaCredito={lineaCredito}
          tiposPrestamo={tiposPrestamo}
          onGuardar={onGuardar}
          onCancelar={onCancelar}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default SublineaCreditoList;
