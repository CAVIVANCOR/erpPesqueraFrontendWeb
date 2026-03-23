import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { confirmDialog } from "primereact/confirmdialog";
import { getResponsiveFontSize } from "../../../utils/utils";
import {
  puedeAprobar,
  puedeRechazar,
  puedeRevertir,
  puedeEditar,
  puedeEliminar,
} from "../utils/helpers";

const MovimientoCajaTable = ({
  movimientos,
  loading,
  onRowClick,
  onSelectionChange,
  permisos,
  onAprobar,
  onRechazar,
  onRevertir,
  onEliminar,
  selectedMovimiento,
  empresas,
  cuentasCorrientes,
}) => {
  const [expandedRows, setExpandedRows] = useState([]);

  // Template para fecha
  const fechaBodyTemplate = (rowData) => {
    return rowData.fechaOperacionMovCaja
      ? new Date(rowData.fechaOperacionMovCaja).toLocaleDateString("es-PE")
      : "N/A";
  };

  // Template para tipo de movimiento
  const tipoMovimientoBodyTemplate = (rowData) => {
    return rowData.tipoMovimiento?.nombre || "N/A";
  };

  // Template para monto con formato de moneda
  const montoBodyTemplate = (rowData) => {
    const codigoMoneda = rowData.moneda?.codigoSunat || "S/M";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: codigoMoneda,
    }).format(rowData.monto || 0);
  };

  // Template para empresa origen
  const empresaOrigenBodyTemplate = (rowData) => {
    const empresa = empresas?.find(
      (e) => Number(e.id) === Number(rowData.empresaOrigenId),
    );
    return empresa ? empresa.razonSocial : "N/A";
  };

  // Template para empresa destino
  const empresaDestinoBodyTemplate = (rowData) => {
    const empresa = empresas?.find(
      (e) => Number(e.id) === Number(rowData.empresaDestinoId),
    );
    return empresa ? empresa.razonSocial : "N/A";
  };

  // Template para cuenta origen
  const cuentaOrigenBodyTemplate = (rowData) => {
    const cuenta = cuentasCorrientes?.find(
      (c) => Number(c.id) === Number(rowData.cuentaCorrienteOrigenId),
    );
    return cuenta ? cuenta.numeroCuenta : "N/A";
  };

  // Template para cuenta destino
  const cuentaDestinoBodyTemplate = (rowData) => {
    const cuenta = cuentasCorrientes?.find(
      (c) => Number(c.id) === Number(rowData.cuentaCorrienteDestinoId),
    );
    return cuenta ? cuenta.numeroCuenta : "N/A";
  };

  // Template para operación sin factura
  const sinFacturaBodyTemplate = (rowData) => {
    return rowData.operacionSinFactura === true ? (
      <Badge value="SÍ" severity="warning" />
    ) : (
      <Badge value="NO" severity="info" />
    );
  };

  // ✅ TEMPLATE PARA ESTADO - CORRECCIÓN APLICADA
  const estadoBodyTemplate = (rowData) => {
    const estado =
      rowData.estadoMovimientoCaja ||
      (rowData.estadoId
        ? {
            descripcion: "PENDIENTE",
            severityColor: "warning",
          }
        : null);

    return estado ? (
      <Badge value={estado.descripcion} severity={estado.severityColor} />
    ) : (
      <Badge value="N/A" severity="secondary" />
    );
  };

  // ✅ CORRECCIÓN: Template para acciones de workflow - MOSTRAR SIEMPRE CON DISABLED
  const accionesWorkflowBodyTemplate = (rowData) => {
    const puedeAprobarMovimiento = puedeAprobar(rowData, permisos);
    const puedeRechazarMovimiento = puedeRechazar(rowData, permisos);
    const puedeRevertirMovimiento = puedeRevertir(rowData, permisos);

    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-check"
          rounded
          text
          severity="success"
          size="small"
          tooltip={puedeAprobarMovimiento ? "Aprobar" : "No puede aprobar este movimiento"}
          tooltipOptions={{ position: 'top' }}
          onClick={() => onAprobar(rowData)}
          disabled={!puedeAprobarMovimiento}
        />
        <Button
          icon="pi pi-times"
          rounded
          text
          severity="danger"
          size="small"
          tooltip={puedeRechazarMovimiento ? "Rechazar" : "No puede rechazar este movimiento"}
          tooltipOptions={{ position: 'top' }}
          onClick={() => onRechazar(rowData)}
          disabled={!puedeRechazarMovimiento}
        />
        <Button
          icon="pi pi-undo"
          rounded
          text
          severity="warning"
          size="small"
          tooltip={puedeRevertirMovimiento ? "Revertir" : "No puede revertir este movimiento"}
          tooltipOptions={{ position: 'top' }}
          onClick={() => onRevertir(rowData)}
          disabled={!puedeRevertirMovimiento}
        />
      </div>
    );
  };

  // ✅ CORRECCIÓN: Template para acciones principales - MOSTRAR SIEMPRE CON DISABLED
  const actionBodyTemplate = (rowData) => {
    const puedeEditarMovimiento = puedeEditar(rowData, permisos);
    const puedeEliminarMovimiento = puedeEliminar(rowData, permisos);

    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          size="small"
          tooltip={puedeEditarMovimiento ? "Editar" : "No puede editar este movimiento"}
          tooltipOptions={{ position: 'top' }}
          onClick={() => onRowClick(rowData)}
          disabled={!puedeEditarMovimiento}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          size="small"
          tooltip={puedeEliminarMovimiento ? "Eliminar" : "No puede eliminar este movimiento"}
          tooltipOptions={{ position: 'top' }}
          onClick={() => {
            confirmDialog({
              message: `¿Está seguro de eliminar el movimiento ${rowData.id}?`,
              header: "Confirmar Eliminación",
              icon: "pi pi-exclamation-triangle",
              accept: () => onEliminar(rowData),
              reject: () => {},
            });
          }}
          disabled={!puedeEliminarMovimiento}
        />
      </div>
    );
  };

  // Template de expansión de fila
  const rowExpansionTemplate = (rowData) => {
    return (
      <div className="p-4">
        <Card>
          <div className="grid">
            <div className="col-12 md:col-6">
              <h5 className="text-lg font-semibold mb-3">
                Información Adicional
              </h5>
              <div className="space-y-2">
                <div className="flex justify-content-between">
                  <span className="text-600">Referencia Externa:</span>
                  <span className="font-medium">
                    {rowData.referenciaExtId || "N/A"}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Tipo Referencia:</span>
                  <span className="font-medium">
                    {rowData.tipoReferencia?.descripcion || "N/A"}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Centro Costo:</span>
                  <span className="font-medium">
                    {rowData.centroCosto?.Codigo || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 md:col-6">
              <h5 className="text-lg font-semibold mb-3">Fechas y Estados</h5>
              <div className="space-y-2">
                <div className="flex justify-content-between">
                  <span className="text-600">Fecha Creación:</span>
                  <span className="font-medium">
                    {rowData.fechaCreacion
                      ? new Date(rowData.fechaCreacion).toLocaleDateString(
                          "es-PE",
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Fecha Actualización:</span>
                  <span className="font-medium">
                    {rowData.fechaActualizacion
                      ? new Date(rowData.fechaActualizacion).toLocaleDateString(
                          "es-PE",
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Operación sin Factura:</span>
                  <Tag
                    value={rowData.operacionSinFactura ? "Sí" : "No"}
                    severity={
                      rowData.operacionSinFactura ? "warning" : "success"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <Card>
      <DataTable
        value={movimientos}
        loading={loading}
        selection={selectedMovimiento}
        onSelectionChange={onSelectionChange}
        onRowClick={onRowClick}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        paginator
        rows={50}
        rowsPerPageOptions={[50, 100, 250, 500]}
        emptyMessage="No hay movimientos de caja registrados"
        size="small"
        stripedRows
        showGridlines
        sortField="id"
        sortOrder={-1}
        selectionMode="single"
        style={{
          cursor:"pointer",
          fontSize: getResponsiveFontSize(),
        }}
      >
        {/* Columna ID */}
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />

        {/* Columna Fecha */}
        <Column
          field="fechaOperacionMovCaja"
          header="Fecha"
          sortable
          body={fechaBodyTemplate}
          style={{ width: "2rem" }}
        />

        {/* Columna Tipo Movimiento */}
        <Column
          field="tipoMovimientoId"
          header="Tipo Movimiento"
          sortable
          body={tipoMovimientoBodyTemplate}
          style={{ width: "150px" }}
        />

        {/* Columna Monto */}
        <Column
          field="monto"
          header="Monto"
          sortable
          body={montoBodyTemplate}
          style={{ width: "120px", textAlign: "right" }}
        />

        {/* Columna Descripción */}
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ width: "12rem" }}
        />

        {/* Columna Empresa Origen */}
        <Column
          field="empresaOrigenId"
          header="Empresa Origen"
          sortable
          body={empresaOrigenBodyTemplate}
          style={{ width: "150px" }}
        />

        {/* Columna Empresa Destino */}
        <Column
          field="empresaDestinoId"
          header="Empresa Destino"
          sortable
          body={empresaDestinoBodyTemplate}
          style={{ width: "150px" }}
        />

        {/* Columna Cuenta Origen */}
        <Column
          field="cuentaCorrienteOrigenId"
          header="Cuenta Origen"
          sortable
          body={cuentaOrigenBodyTemplate}
          style={{ width: "130px" }}
        />

        {/* Columna Cuenta Destino */}
        <Column
          field="cuentaCorrienteDestinoId"
          header="Cuenta Destino"
          sortable
          body={cuentaDestinoBodyTemplate}
          style={{ width: "130px" }}
        />

        {/* Columna Sin Factura */}
        <Column
          field="operacionSinFactura"
          header="S/F"
          sortable
          body={sinFacturaBodyTemplate}
          style={{ width: "3rem", textAlign: "center" }}
        />

        {/* Columna Estado - CORREGIDO */}
        <Column
          field="estadoId"
          header="Estado"
          sortable
          body={estadoBodyTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />

        {/* Columna Workflow */}
        <Column
          header="Workflow"
          body={accionesWorkflowBodyTemplate}
          style={{ width: "10rem", textAlign: "center" }}
        />

        {/* Columna Acciones */}
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ width: "7rem", textAlign: "center" }}
        />
      </DataTable>
    </Card>
  );
};

export default MovimientoCajaTable;