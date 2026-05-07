// src/components/contabilidad/asientoContable/AsientoDetalles.jsx
import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";
import { Calendar } from "primereact/calendar";
import { getResponsiveFontSize } from "../../../utils/utils";
import {
  formatearMontoPEN,
  formatearMontoDecimal,
  obtenerMonedaExtranjera,
  calcularTotalesMonedaExtranjera,
} from "./asientoHelpers";

export default function AsientoDetalles({
  detalles,
  detallesFiltrados,
  formData,
  monedas,
  entidadesComerciales,
  submodulosOptions,
  detallesSeleccionados,
  setDetallesSeleccionados,
  openNewDetalle,
  openEditDetalle,
  handleDeleteDetalle,
  setShowClonarDialog,
  limpiarFiltros,
  filtroCodigoCuenta,
  setFiltroCodigoCuenta,
  filtroEntidadComercial,
  setFiltroEntidadComercial,
  filtroGlosa,
  setFiltroGlosa,
  filtroNumeroDocOrigen,
  setFiltroNumeroDocOrigen,
  filtroFechaDocRango,
  setFiltroFechaDocRango,
  filtroFechaVenceRango,
  setFiltroFechaVenceRango,
  filtroSubmodulo,
  setFiltroSubmodulo,
  asientoId,
  isReadOnly,
  obtenerOpcionesDinamicas, // ✅ NUEVO PROP
}) {
  const estadoId = Number(formData.estadoId);
  const esPendiente = estadoId === 76;
  const isTableReadOnly = isReadOnly || !esPendiente;
  // ✅ OBTENER OPCIONES DINÁMICAS
  const { entidadesComercialesFiltradas, submodulosFiltrados } =
    obtenerOpcionesDinamicas();

  const montoBodyTemplate = (rowData, field) => {
    return formatearMontoPEN(rowData[field]);
  };

  const { totalDebeME, totalHaberME, totalNetoME } =
    calcularTotalesMonedaExtranjera(detalles);

  const monedaExtranjeraCodigo = obtenerMonedaExtranjera(detalles, monedas);

  const footerMonedaMontoTemplate = () => {
    if (
      !monedaExtranjeraCodigo ||
      Math.abs(Number(totalNetoME || 0)) < 0.0001
    ) {
      return null;
    }

    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#059669",
          whiteSpace: "nowrap",
        }}
      >
        {monedaExtranjeraCodigo} {formatearMontoDecimal(totalNetoME)}
      </div>
    );
  };

  const footerDebeTemplate = () => {
    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#1d4ed8",
          whiteSpace: "nowrap",
        }}
      >
        {formatearMontoPEN(Number(formData.totalDebe || 0))}
      </div>
    );
  };

  const footerHaberTemplate = () => {
    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#dc2626",
          whiteSpace: "nowrap",
        }}
      >
        {formatearMontoPEN(Number(formData.totalHaber || 0))}
      </div>
    );
  };

  const monedaMontoBodyTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    if (codigoMoneda === "PEN") {
      return null;
    }

    const montoME =
      rowData.debeMonedaExtranjera || rowData.haberMonedaExtranjera || 0;

    return (
      <div
        style={{
          textAlign: "right",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <span style={{ fontWeight: "bold", color: "#059669" }}>
          {codigoMoneda}
        </span>
        <span style={{ marginLeft: 6, fontSize: "0.95em" }}>
          {formatearMontoDecimal(montoME)}
        </span>
      </div>
    );
  };

  const tipoCambioBodyTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    if (codigoMoneda === "PEN") {
      return null;
    }

    const tc = rowData.tipoCambio || formData.tipoCambio;

    return (
      <div style={{ textAlign: "center", fontSize: "0.9em" }}>
        {tc ? Number(tc).toFixed(3) : "-"}
      </div>
    );
  };

  const rowClassName = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    if (codigoMoneda === "USD" || codigoMoneda === "ME") {
      return "row-moneda-usd";
    }
    return "row-moneda-pen";
  };

  const actionBodyTemplate = (rowData) => {
    if (isTableReadOnly) return null;
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-warning"
          onClick={() => openEditDetalle(rowData)}
          tooltip="Editar"
          type="button"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          onClick={() => handleDeleteDetalle(rowData)}
          tooltip="Eliminar"
          type="button"
        />
      </div>
    );
  };

  const hayFiltrosActivos =
    filtroCodigoCuenta ||
    filtroEntidadComercial ||
    filtroGlosa ||
    filtroNumeroDocOrigen ||
    filtroFechaDocRango ||
    filtroFechaVenceRango ||
    filtroSubmodulo;

  const datosAMostrar =
    detallesFiltrados.length > 0 || hayFiltrosActivos
      ? detallesFiltrados
      : detalles;

  return (
    <DataTable
      value={datosAMostrar}
      paginator
      size="small"
      showGridlines
      stripedRows
      rows={40}
      rowsPerPageOptions={[40, 80, 160, 320]}
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
      emptyMessage="No hay detalles agregados"
      rowClassName={rowClassName}
      selection={detallesSeleccionados}
      onSelectionChange={(e) => setDetallesSeleccionados(e.value)}
      dataKey="id"
      style={{
        cursor: !isTableReadOnly ? "pointer" : "default",
        fontSize: getResponsiveFontSize(),
      }}
      onRowDoubleClick={(e) => {
        if (!isTableReadOnly) {
          openEditDetalle(e.data);
        }
      }}
      header={
        <>
          <Divider></Divider>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>
                Detalle
                {hayFiltrosActivos && (
                  <h6>
                    Muestro {detallesFiltrados.length} de {detalles.length}
                  </h6>
                )}
              </h2>
            </div>
            <div style={{ flex: 1 }}>
              {!isTableReadOnly && detallesSeleccionados.length > 0 && (
                <Button
                  label={`Clonar (${detallesSeleccionados.length})`}
                  icon="pi pi-clone"
                  className="p-button-info"
                  raised
                  outlined
                  onClick={() => setShowClonarDialog(true)}
                  type="button"
                />
              )}
            </div>

            <div style={{ flex: 0.5 }}>
              {!isTableReadOnly && (
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  serverity="primary"
                  raised
                  onClick={openNewDetalle}
                  type="button"
                  disabled={!asientoId}
                  tooltip={
                    !asientoId
                      ? "Primero debe guardar la cabecera del asiento"
                      : ""
                  }
                />
              )}
            </div>

            <div style={{ flex: 0.5 }}>
              <Button
                icon="pi pi-filter-slash"
                severity="secondary"
                onClick={limpiarFiltros}
                type="button"
              />
            </div>

            {/* FILTROS */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="filtroCodigoCuenta"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                Código Cuenta
              </label>
              <InputText
                id="filtroCodigoCuenta"
                value={filtroCodigoCuenta}
                onChange={(e) => setFiltroCodigoCuenta(e.target.value)}
                placeholder="Ej: 10, 101..."
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ flex: 2 }}>
              <label
                htmlFor="filtroEntidadComercial"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                Entidad Comercial
              </label>
              <Dropdown
                id="filtroEntidadComercial"
                value={filtroEntidadComercial}
                options={entidadesComercialesFiltradas.map((ec) => ({
                  label: ec.razonSocial,
                  value: Number(ec.id),
                }))}
                onChange={(e) => setFiltroEntidadComercial(e.value)}
                placeholder="Todas"
                showClear
                filter
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label
                htmlFor="filtroGlosa"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                Glosa
              </label>
              <InputText
                id="filtroGlosa"
                value={filtroGlosa}
                onChange={(e) => setFiltroGlosa(e.target.value)}
                placeholder="Buscar en glosa..."
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              marginTop: "1rem",
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="filtroNumeroDocOrigen"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                Nº Doc. Origen
              </label>
              <InputText
                id="filtroNumeroDocOrigen"
                value={filtroNumeroDocOrigen}
                onChange={(e) => setFiltroNumeroDocOrigen(e.target.value)}
                placeholder="Buscar número..."
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                htmlFor="filtroSubmodulo"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                Submódulo Origen
              </label>
              <Dropdown
                id="filtroSubmodulo"
                value={filtroSubmodulo}
                options={submodulosFiltrados}
                onChange={(e) => setFiltroSubmodulo(e.value)}
                placeholder="Todos"
                showClear
                style={{ width: "100%" }}
              />
            </div>

            {/* FILTROS DE FECHAS */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="filtroFechaDocDesde"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                Fecha Doc. Rango
              </label>
              <Calendar
                id="filtroFechaDocRango"
                value={filtroFechaDocRango}
                onChange={(e) => setFiltroFechaDocRango(e.value)}
                selectionMode="range"
                readOnlyInput
                hideOnRangeSelection
                placeholder="Rango Fecha Doc."
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                htmlFor="filtroFechaVenceDesde"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                Fecha Vence Rango
              </label>
              <Calendar
                id="filtroFechaVenceRango"
                value={filtroFechaVenceRango}
                onChange={(e) => setFiltroFechaVenceRango(e.value)}
                selectionMode="range"
                readOnlyInput
                hideOnRangeSelection
                placeholder="Rango Fecha Vence"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </>
      }
    >
      {!isTableReadOnly && (
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
      )}
      <Column field="numeroLinea" header="#" style={{ width: "5%" }} />
      <Column field="codigoCuenta" header="Código" style={{ width: "10%" }} />
      <Column field="nombreCuenta" header="Cuenta" style={{ width: "20%" }} />
      <Column
        header="Entidad Comercial"
        body={(rowData) =>
          rowData.entidadComercial?.razonSocial ||
          rowData.entidadComercial?.nombreComercial ||
          ""
        }
        style={{ width: "10%" }}
      />
      <Column
        header="Activo"
        body={(rowData) => rowData.activo?.nombre || ""}
        style={{ width: "10%" }}
      />
      <Column field="glosa" header="Glosa" style={{ width: "25%" }} />
      <Column
        header="Moneda/Monto"
        body={monedaMontoBodyTemplate}
        footer={footerMonedaMontoTemplate}
        style={{ width: "10%", textAlign: "right" }}
        headerStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          textAlign: "right",
        }}
        bodyStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.15rem",
          paddingBottom: "0.15rem",
          textAlign: "right",
        }}
        footerStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          textAlign: "right",
          backgroundColor: "#ecfdf5",
        }}
      />
      <Column
        header="T/C"
        body={tipoCambioBodyTemplate}
        style={{ width: "5%", textAlign: "center" }}
      />
      <Column
        header="Debe"
        body={(rowData) => montoBodyTemplate(rowData, "debe")}
        footer={footerDebeTemplate}
        style={{ width: "12%", textAlign: "right" }}
        headerStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          textAlign: "right",
        }}
        bodyStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.15rem",
          paddingBottom: "0.15rem",
          textAlign: "right",
        }}
        footerStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          textAlign: "right",
          backgroundColor: "#eff6ff",
        }}
      />
      <Column
        header="Haber"
        body={(rowData) => montoBodyTemplate(rowData, "haber")}
        footer={footerHaberTemplate}
        style={{ width: "12%", textAlign: "right" }}
        headerStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          textAlign: "right",
        }}
        bodyStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.15rem",
          paddingBottom: "0.15rem",
          textAlign: "right",
        }}
        footerStyle={{
          whiteSpace: "nowrap",
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          textAlign: "right",
          backgroundColor: "#fef2f2",
        }}
      />
      {!isTableReadOnly && (
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ width: "8%" }}
          headerStyle={{
            whiteSpace: "nowrap",
            paddingTop: "0.25rem",
            paddingBottom: "0.25rem",
          }}
          bodyStyle={{
            whiteSpace: "nowrap",
            paddingTop: "0.15rem",
            paddingBottom: "0.15rem",
          }}
        />
      )}
    </DataTable>
  );
}
