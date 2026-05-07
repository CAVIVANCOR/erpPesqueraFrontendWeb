// src/components/contabilidad/asientoContable/DetalleDialog.jsx
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import CrearEntidadComercialButton from "../../shared/CrearEntidadComercialButton";

export default function DetalleDialog({
  visible,
  onHide,
  editingDetalle,
  detalleFormData,
  setDetalleFormData,
  planCuentas,
  monedas,
  tiposDocumento,
  centrosCosto,
  entidadesComerciales,
  activos,
  submodulosOptions,
  preFacturas,
  formData,
  handleCuentaChange,
  handleSubmoduloOrigenChange,
  handlePreFacturaChange,
  handleEntidadComercialChange,
  handleEntidadComercialCreada,
  handleSaveDetalle,
  nombreUsuarioCreador,
  nombreUsuarioActualizador,
  setNombreUsuarioCreador,
  setNombreUsuarioActualizador,
  isReadOnly,
  toast,
}) {
  const cuentasOptions = planCuentas.map((c) => ({
    label: `${c.codigoCuenta} - ${c.nombreCuenta}`,
    value: Number(c.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    label: m.codigoSunat,
    value: Number(m.id),
  }));

  const centrosCostoOptions = centrosCosto.map((cc) => ({
    label: `${cc.Codigo} - ${cc.Nombre}`,
    value: Number(cc.id),
  }));

  const entidadesComercialesOptions = entidadesComerciales.map((ec) => ({
    label: ec.label || ec.razonSocial || ec.nombreComercial,
    value: Number(ec.value || ec.id),
  }));

  const activosOptions = activos.map((a) => ({
    label: `${a.nombre}${a.descripcion ? ` - ${a.descripcion}` : ""}`,
    value: Number(a.id),
  }));

  const preFacturasOptions = preFacturas.map((pf) => ({
    label: `${pf.numeroDocumento} - ${new Date(pf.fechaDocumento).toLocaleDateString()}${pf.estado ? ` - ${pf.estado.descripcion}` : ""}`,
    value: Number(pf.id),
    data: pf,
  }));

  return (
    <Dialog
      header={editingDetalle ? "Editar Detalle" : "Nuevo Detalle"}
      visible={visible}
      style={{ width: "1300px" }}
      onHide={onHide}
      modal
      maximizable
      maximized={true}
    >
      <div className="p-fluid">
        {/* CUENTA CONTABLE */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="planCuentaId" style={{ fontWeight: "bold" }}>
              Cuenta Contable <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="planCuentaId"
              value={detalleFormData.planCuentaId}
              options={cuentasOptions}
              onChange={(e) => handleCuentaChange(e.value)}
              placeholder="Seleccionar cuenta"
              filter
              filterBy="label"
            />
          </div>
        </div>

        {/* SUBMÓDULO, DOCUMENTO ORIGEN, ENTIDAD COMERCIAL */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="submoduloOrigenLineaId">Submódulo Origen</label>
            <Dropdown
              id="submoduloOrigenLineaId"
              value={detalleFormData.submoduloOrigenLineaId}
              options={submodulosOptions}
              onChange={(e) => handleSubmoduloOrigenChange(e.value)}
              placeholder="Seleccionar submódulo"
              showClear
              disabled={!formData.empresaId}
              filter
              filterBy="label"
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="procesoOrigenLineaId">Documento Origen</label>
            <Dropdown
              id="procesoOrigenLineaId"
              value={detalleFormData.procesoOrigenLineaId}
              options={preFacturasOptions}
              onChange={(e) => handlePreFacturaChange(e.value)}
              placeholder={
                detalleFormData.submoduloOrigenLineaId
                  ? "Seleccionar documento"
                  : "Primero seleccione submódulo"
              }
              disabled={!detalleFormData.submoduloOrigenLineaId}
              showClear
              filter
              filterBy="label"
            />
          </div>

          <div style={{ flex: 2 }}>
            <label htmlFor="entidadComercialId">Entidad Comercial</label>
            <Dropdown
              id="entidadComercialId"
              value={detalleFormData.entidadComercialId}
              options={entidadesComercialesOptions}
              onChange={(e) => handleEntidadComercialChange(e.value)}
              placeholder="Seleccionar entidad"
              showClear
              filter
              filterBy="label"
            />
          </div>

          <div style={{ flex: 0.25 }}>
            <CrearEntidadComercialButton
              empresaId={formData.empresaId}
              tipoEntidad="ambos"
              onEntidadCreada={handleEntidadComercialCreada}
              label="Crear"
              icon="pi pi-building"
              severity="info"
              outlined={true}
              disabled={!formData.empresaId}
              className="w-full"
              toast={toast}
              tooltip="Crear nueva entidad comercial"
            />
          </div>
        </div>

        {/* TIPO DOC, ID, NÚMERO, FECHAS */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoDocumentoOrigenId">Tipo Doc. Origen</label>
            <Dropdown
              id="tipoDocumentoOrigenId"
              value={detalleFormData.tipoDocumentoOrigenId}
              options={tiposDocumento.map((td) => ({
                label: td.descripcion,
                value: Number(td.id),
              }))}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  tipoDocumentoOrigenId: e.value,
                })
              }
              placeholder="Seleccionar tipo"
              showClear
              disabled={isReadOnly}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="procesoOrigenLineaIdDisplay"
              style={{ fontWeight: "bold" }}
            >
              ID (Doc. Origen)
            </label>
            <InputNumber
              id="procesoOrigenLineaIdDisplay"
              value={detalleFormData.procesoOrigenLineaId}
              onValueChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  procesoOrigenLineaId: e.value,
                })
              }
              useGrouping={false}
              disabled={true}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="numeroDocumentoOrigen"
              style={{ fontWeight: "bold" }}
            >
              Número Doc. Origen
            </label>
            <InputText
              id="numeroDocumentoOrigen"
              value={detalleFormData.numeroDocumentoOrigen}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  numeroDocumentoOrigen: e.target.value,
                })
              }
              disabled={isReadOnly}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="fechaDocumentoOrigen"
              style={{ fontWeight: "bold" }}
            >
              Fecha Doc. Origen
            </label>
            <Calendar
              id="fechaDocumentoOrigen"
              value={detalleFormData.fechaDocumentoOrigen}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  fechaDocumentoOrigen: e.value,
                })
              }
              dateFormat="dd/mm/yy"
              showIcon
              disabled={isReadOnly}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="fechaVenceDocumentoOrigen">
              Fecha Vence Doc. Origen
            </label>
            <Calendar
              id="fechaVenceDocumentoOrigen"
              value={detalleFormData.fechaVenceDocumentoOrigen}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  fechaVenceDocumentoOrigen: e.value,
                })
              }
              dateFormat="dd/mm/yy"
              showIcon
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* GLOSA */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="glosaDetalle" style={{ fontWeight: "bold" }}>
              Glosa <span style={{ color: "red" }}>*</span>
            </label>
            <InputTextarea
              id="glosaDetalle"
              value={detalleFormData.glosa}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  glosa: e.target.value,
                })
              }
              rows={2}
            />
          </div>
        </div>

        {/* MONEDA, DEBE, HABER */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="monedaIdDetalle" style={{ fontWeight: "bold" }}>
              Moneda <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="monedaIdDetalle"
              value={detalleFormData.monedaId}
              options={monedasOptions}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  monedaId: e.value,
                })
              }
              placeholder="Seleccionar moneda"
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="debe">Debe</label>
            <InputNumber
              id="debe"
              value={
                Number(detalleFormData.monedaId) !== 1
                  ? detalleFormData.debeMonedaExtranjera || 0
                  : detalleFormData.debe || 0
              }
              onValueChange={(e) => {
                const valor = e.value || 0;
                if (Number(detalleFormData.monedaId) !== 1) {
                  setDetalleFormData({
                    ...detalleFormData,
                    debeMonedaExtranjera: valor,
                    haberMonedaExtranjera: 0,
                    debe: 0,
                    haber: 0,
                  });
                } else {
                  setDetalleFormData({
                    ...detalleFormData,
                    debe: valor,
                    haber: 0,
                    debeMonedaExtranjera: null,
                    haberMonedaExtranjera: null,
                  });
                }
              }}
              mode="currency"
              currency={Number(detalleFormData.monedaId) === 2 ? "USD" : "PEN"}
              locale="es-PE"
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="haber">Haber</label>
            <InputNumber
              id="haber"
              value={
                Number(detalleFormData.monedaId) !== 1
                  ? detalleFormData.haberMonedaExtranjera || 0
                  : detalleFormData.haber || 0
              }
              onValueChange={(e) => {
                const valor = e.value || 0;
                if (Number(detalleFormData.monedaId) !== 1) {
                  setDetalleFormData({
                    ...detalleFormData,
                    haberMonedaExtranjera: valor,
                    debeMonedaExtranjera: 0,
                    debe: 0,
                    haber: 0,
                  });
                } else {
                  setDetalleFormData({
                    ...detalleFormData,
                    haber: valor,
                    debe: 0,
                    debeMonedaExtranjera: null,
                    haberMonedaExtranjera: null,
                  });
                }
              }}
              mode="currency"
              currency={Number(detalleFormData.monedaId) === 2 ? "USD" : "PEN"}
              locale="es-PE"
            />
          </div>
        </div>

               {/* CENTRO DE COSTO */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="centroCostoId">Centro de Costo</label>
            <Dropdown
              id="centroCostoId"
              value={detalleFormData.centroCostoId}
              options={centrosCostoOptions}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  centroCostoId: e.value,
                })
              }
              placeholder="Seleccionar centro de costo"
              showClear
            />
          </div>
        </div>

        {/* ACTIVO FIJO */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="activoId">Activo Fijo</label>
            <Dropdown
              id="activoId"
              value={detalleFormData.activoId}
              options={activosOptions}
              onChange={(e) =>
                setDetalleFormData({
                  ...detalleFormData,
                  activoId: e.value,
                })
              }
              placeholder="Seleccionar activo fijo"
              showClear
              filter
              filterBy="label"
            />
          </div>
        </div>

        {/* AUDITORÍA */}
        {editingDetalle &&
          (editingDetalle.creadoEn || editingDetalle.actualizadoEn) && (
            <div
              style={{
                marginTop: 20,
                padding: 10,
                backgroundColor: "#f5f5f5",
                borderRadius: 5,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 10,
                }}
              >
                <div>
                  <label style={{ fontSize: "12px", color: "#666" }}>
                    Creado
                  </label>
                  <InputText
                    value={
                      editingDetalle.creadoEn
                        ? new Date(editingDetalle.creadoEn).toLocaleString(
                            "es-PE",
                          )
                        : "N/A"
                    }
                    disabled
                    style={{ fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#666" }}>
                    Creado Por
                  </label>
                  <InputText
                    value={nombreUsuarioCreador}
                    disabled
                    style={{ fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#666" }}>
                    Actualizado
                  </label>
                  <InputText
                    value={
                      editingDetalle.actualizadoEn
                        ? new Date(editingDetalle.actualizadoEn).toLocaleString(
                            "es-PE",
                          )
                        : "N/A"
                    }
                    disabled
                    style={{ fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#666" }}>
                    Actualizado Por
                  </label>
                  <InputText
                    value={nombreUsuarioActualizador}
                    disabled
                    style={{ fontSize: "12px" }}
                  />
                </div>
              </div>
            </div>
          )}

        {/* BOTONES */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={() => {
              onHide();
              setNombreUsuarioCreador("N/A");
              setNombreUsuarioActualizador("N/A");
            }}
            type="button"
            className="p-button-warning"
            severity="warning"
            raised
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleSaveDetalle}
            type="button"
            className="p-button-success"
            severity="success"
            raised
          />
        </div>
      </div>
    </Dialog>
  );
}
