import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputTextarea } from "primereact/inputtextarea";

// Formulario principal
// NOTA: El formulario existe en components/movimientoCaja/
import MovimientoCajaForm from "../../../components/movimientoCaja/MovimientoCajaForm";
import { useState } from "react";

const MovimientoCajaDialogs = ({
  visible,
  onHide,
  movimiento,
  onSave,
  loading,
  permisos,
  empresas = [],
  monedas = [],
  tipoMovEntregaRendir = [],
  mediosPago = [],
  cuentasCorrientes = [],
  entidadesComerciales = [],
  cuentasEntidadComercial = [],
  centrosCosto = [],
  personal = [],
  modulos = [],
  productos = [],
  estadosMultiFuncion = [],
  cuentasOrigenFiltradas = [],
  cuentasDestinoFiltradas = [],
  onValidarMovimiento,
  onGenerarAsiento,
}) => {
  // ✅ ESTADOS WORKFLOW INTERNOS
  const [showAprobarDialog, setShowAprobarDialog] = useState(false);
  const [showRechazarDialog, setShowRechazarDialog] = useState(false);
  const [showRevertirDialog, setShowRevertirDialog] = useState(false);
  const [showSaldosDialog, setShowSaldosDialog] = useState(false);
  const [movimientoWorkflow, setMovimientoWorkflow] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [motivoReversion, setMotivoReversion] = useState("");
  const [saldosGenerados, setSaldosGenerados] = useState([]);

  // ✅ PATRÓN DE PERSONAL.JSX: Determinar isEdit y readOnly
  const isEdit = !!movimiento?.id;
  const readOnly = isEdit && !permisos?.puedeEditar;

  // Determinar título del diálogo principal
  const getDialogTitle = () => {
    if (!movimiento) return "Nuevo Movimiento de Caja";
    if (isEdit) {
      return permisos?.puedeEditar ? "Editar Movimiento de Caja" : "Ver Movimiento de Caja";
    }
    return "Nuevo Movimiento de Caja";
  };

  // Manejar guardado del formulario
  const handleSave = async (data) => {
    try {
      await onSave(data);
      // ✅ CORRECCIÓN: NO cerrar el diálogo después de guardar
      // El hook useMovimientoCajaCRUD ya actualiza editingMovimiento con los datos frescos
    } catch (error) {
      console.error("Error guardando movimiento:", error);
    }
  };

  // Manejar cancelación del formulario
  const handleCancel = () => {
    onHide();
  };

  return (
    <>
      {/* Diálogo principal - Formulario */}
      <Dialog
        visible={visible}
        header={getDialogTitle()}
        style={{ width:"1300px" }}
        onHide={handleCancel}
        modal
        resizable
        maximizable
        maximized={true}
        draggable={false}
        closable={!loading}
        dismissableMask={!loading}
            >
        <MovimientoCajaForm
          isEdit={isEdit}
          defaultValues={movimiento || {}}
          onSubmit={handleSave}
          onCancel={handleCancel}
          loading={loading}
          readOnly={readOnly}
          permisos={permisos}
          empresas={empresas}
          monedas={monedas}
          tipoMovEntregaRendir={tipoMovEntregaRendir}
          mediosPago={mediosPago}
          cuentasCorrientes={cuentasCorrientes}
          entidadesComerciales={entidadesComerciales}
          cuentasEntidadComercial={cuentasEntidadComercial}
          centrosCosto={centrosCosto}
          personal={personal}
          modulos={modulos}
          productos={productos}
          estadosMultiFuncion={estadosMultiFuncion}
          cuentasOrigenFiltradas={cuentasOrigenFiltradas}
          cuentasDestinoFiltradas={cuentasDestinoFiltradas}
          onValidarMovimiento={onValidarMovimiento}
        />
      </Dialog>

      {/* Diálogo de Aprobación */}
      <Dialog
        header="Aprobar Movimiento de Caja"
        visible={showAprobarDialog}
        style={{ width: "500px" }}
        onHide={() => setShowAprobarDialog(false)}
        modal
        resizable={false}
        draggable={false}
      >
        <div className="p-fluid">
          <p className="mb-4">
            ¿Está seguro que desea aprobar este movimiento de caja?
          </p>
          
          {movimientoWorkflow && (
            <div className="p-3 bg-gray-50 border-round mb-4">
              <div className="grid">
                <div className="col-12">
                  <strong>Tipo de Movimiento:</strong>{" "}
                  {movimientoWorkflow.tipoMovimiento?.nombre || "N/A"}
                </div>
                <div className="col-12">
                  <strong>Monto:</strong>{" "}
                  {new Intl.NumberFormat("es-PE", {
                    style: "currency",
                    currency: movimientoWorkflow.moneda?.codigoSunat || "PEN",
                  }).format(movimientoWorkflow.monto || 0)}
                </div>
                <div className="col-12">
                  <strong>Descripción:</strong>{" "}
                  {movimientoWorkflow.descripcion || "N/A"}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowAprobarDialog(false)}
              outlined
            />
            <Button
              label="Aprobar"
              icon="pi pi-check"
              onClick={() => {
                // Lógica de aprobación se maneja en el hook
                setShowAprobarDialog(false);
              }}
              loading={loading}
              severity="success"
              autoFocus
            />
          </div>
        </div>
      </Dialog>

      {/* Diálogo de Rechazo */}
      <Dialog
        header="Rechazar Movimiento de Caja"
        visible={showRechazarDialog}
        style={{ width: "500px" }}
        onHide={() => setShowRechazarDialog(false)}
        modal
        resizable={false}
        draggable={false}
      >
        <div className="p-fluid">
          <p className="mb-4">
            Indique el motivo del rechazo:
          </p>
          
          {movimientoWorkflow && (
            <div className="p-3 bg-gray-50 border-round mb-4">
              <div className="grid">
                <div className="col-12">
                  <strong>Tipo de Movimiento:</strong>{" "}
                  {movimientoWorkflow.tipoMovimiento?.nombre || "N/A"}
                </div>
                <div className="col-12">
                  <strong>Monto:</strong>{" "}
                  {new Intl.NumberFormat("es-PE", {
                    style: "currency",
                    currency: movimientoWorkflow.moneda?.codigoSunat || "PEN",
                  }).format(movimientoWorkflow.monto || 0)}
                </div>
                <div className="col-12">
                  <strong>Descripción:</strong>{" "}
                  {movimientoWorkflow.descripcion || "N/A"}
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="motivoRechazo" className="block font-medium mb-2">
              Motivo del Rechazo <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              id="motivoRechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={4}
              placeholder="Ingrese el motivo del rechazo..."
              className="w-full"
              autoFocus
            />
          </div>
          
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowRechazarDialog(false)}
              outlined
            />
            <Button
              label="Rechazar"
              icon="pi pi-times"
              onClick={() => {
                // Lógica de rechazo se maneja en el hook
                setShowRechazarDialog(false);
              }}
              loading={loading}
              severity="danger"
              disabled={!motivoRechazo?.trim()}
              autoFocus
            />
          </div>
        </div>
      </Dialog>

      {/* Diálogo de Reversión */}
      <Dialog
        header="Revertir Movimiento de Caja"
        visible={showRevertirDialog}
        style={{ width: "500px" }}
        onHide={() => setShowRevertirDialog(false)}
        modal
        resizable={false}
        draggable={false}
      >
        <div className="p-fluid">
          <p className="mb-4">
            Se creará un movimiento inverso. Indique el motivo de la reversión:
          </p>
          
          {movimientoWorkflow && (
            <div className="p-3 bg-gray-50 border-round mb-4">
              <div className="grid">
                <div className="col-12">
                  <strong>Tipo de Movimiento:</strong>{" "}
                  {movimientoWorkflow.tipoMovimiento?.nombre || "N/A"}
                </div>
                <div className="col-12">
                  <strong>Monto:</strong>{" "}
                  {new Intl.NumberFormat("es-PE", {
                    style: "currency",
                    currency: movimientoWorkflow.moneda?.codigoSunat || "PEN",
                  }).format(movimientoWorkflow.monto || 0)}
                </div>
                <div className="col-12">
                  <strong>Descripción:</strong>{" "}
                  {movimientoWorkflow.descripcion || "N/A"}
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="motivoReversion" className="block font-medium mb-2">
              Motivo de la Reversión <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              id="motivoReversion"
              value={motivoReversion}
              onChange={(e) => setMotivoReversion(e.target.value)}
              rows={4}
              placeholder="Ingrese el motivo de la reversión..."
              className="w-full"
              autoFocus
            />
          </div>
          
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowRevertirDialog(false)}
              outlined
            />
            <Button
              label="Revertir"
              icon="pi pi-replay"
              onClick={() => {
                // Lógica de reversión se maneja en el hook
                setShowRevertirDialog(false);
              }}
              loading={loading}
              severity="warning"
              disabled={!motivoReversion?.trim()}
              autoFocus
            />
          </div>
        </div>
      </Dialog>

      {/* Diálogo de Saldos Generados */}
      <Dialog
        header="Registros Generados - Saldos de Cuenta Corriente"
        visible={showSaldosDialog}
        style={{ width: "800px" }}
        onHide={() => setShowSaldosDialog(false)}
        modal
        resizable={false}
        draggable={false}
      >
        <div className="p-fluid">
          <p className="mb-4 text-color-secondary">
            Se han generado los siguientes registros de saldo:
          </p>

          {saldosGenerados && saldosGenerados.length > 0 ? (
            saldosGenerados.map((saldo, index) => (
              <div key={index} className="p-3 bg-gray-50 border-round mb-3">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <strong>Cuenta Corriente:</strong>
                    <div>{saldo.cuentaCorriente?.numeroCuenta || "N/A"}</div>
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>Banco:</strong>
                    <div>{saldo.cuentaCorriente?.banco?.nombre || "N/A"}</div>
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>Saldo Anterior:</strong>
                    <div className="text-color-secondary">
                      {(() => {
                        const moneda = monedas.find(m => Number(m.id) === Number(saldo.cuentaCorriente.monedaId));
                        const codigoMoneda = moneda?.codigoSunat || "S/M";
                        return new Intl.NumberFormat("es-PE", {
                          style: "currency",
                          currency: codigoMoneda,
                        }).format(saldo.saldoAnterior || 0);
                      })()}
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>Ingresos:</strong>
                    <div className="text-green-600 font-bold">
                      +{" "}
                      {(() => {
                        const moneda = monedas.find(m => Number(m.id) === Number(saldo.cuentaCorriente.monedaId));
                        const codigoMoneda = moneda?.codigoSunat || "S/M";
                        return new Intl.NumberFormat("es-PE", {
                          style: "currency",
                          currency: codigoMoneda,
                        }).format(saldo.ingresos || 0);
                      })()}
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>Egresos:</strong>
                    <div className="text-red-600 font-bold">
                      -{" "}
                      {(() => {
                        const moneda = monedas.find(m => Number(m.id) === Number(saldo.cuentaCorriente.monedaId));
                        const codigoMoneda = moneda?.codigoSunat || "S/M";
                        return new Intl.NumberFormat("es-PE", {
                          style: "currency",
                          currency: codigoMoneda,
                        }).format(saldo.egresos || 0);
                      })()}
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>Saldo Actual:</strong>
                    <div 
                      className={`font-bold text-lg ${
                        Number(saldo.saldoActual) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {(() => {
                        const moneda = monedas.find(m => Number(m.id) === Number(saldo.cuentaCorriente.monedaId));
                        const codigoMoneda = moneda?.codigoSunat || "S/M";
                        return new Intl.NumberFormat("es-PE", {
                          style: "currency",
                          currency: codigoMoneda,
                        }).format(saldo.saldoActual || 0);
                      })()}
                    </div>
                  </div>
                  <div className="col-12">
                    <strong>Fecha:</strong>{" "}
                    <div>
                      {saldo.fecha
                        ? new Date(saldo.fecha).toLocaleString("es-PE")
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-color-secondary p-4">
              No se generaron registros de saldo
            </div>
          )}

          <div className="flex justify-content-end mt-4">
            <Button
              label="Cerrar"
              icon="pi pi-check"
              onClick={() => setShowSaldosDialog(false)}
              severity="success"
              autoFocus
            />
          </div>
        </div>
      </Dialog>

      {/* ConfirmDialog global para confirmaciones */}
      <ConfirmDialog />
    </>
  );
};

export default MovimientoCajaDialogs;