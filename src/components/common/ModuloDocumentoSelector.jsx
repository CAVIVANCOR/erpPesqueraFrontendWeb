/**
 * ModuloDocumentoSelector.jsx
 *
 * Componente reutilizable e independiente para seleccionar un módulo y un
 * documento de origen. Renderiza su propio botón con label enriquecido,
 * carga módulos y documentos internamente y notifica los cambios mediante
 * la prop onChange.
 *
 * Props:
 * - value: { moduloOrigenId, documentoOrigenId }
 * - onChange({ moduloOrigenId, documentoOrigenId })
 * - disabled
 * - moduloLabel
 * - documentoLabel
 * - allowSinModulo
 */
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Badge } from "primereact/badge";
import { getModulos } from "../../api/moduloSistema";
import { getDocumentosPorModelo } from "../../api/documentoDinamico";
import { getResponsiveFontSize } from "../../utils/utils";

const COLORES_LABEL = {
  modulo: {
    color: "#FFFFFF",
    backgroundColor: "#1565C0",
    padding: "0.15rem 0.5rem",
    borderRadius: "4px",
    fontWeight: "700",
    border: "2px solid #0D47A1",
  },
  documentoId: "#D32F2F",
  documentoNumero: "#1976D2",
  fecha: "#2E7D32",
  entidad: "#F57C00",
  separador: "#666",
};

const ModuloDocumentoSelector = ({
  value = { moduloOrigenId: 0, documentoOrigenId: 0 },
  onChange,
  disabled = false,
  moduloLabel = "Módulo",
  documentoLabel = "Documento",
  allowSinModulo = true,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [modulos, setModulos] = useState([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [loadingModulos, setLoadingModulos] = useState(false);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [moduloInfo, setModuloInfo] = useState(null);
  const [camposConfig, setCamposConfig] = useState(null);

  const moduloOrigenId = Number(value?.moduloOrigenId || 0);
  const documentoOrigenId = Number(value?.documentoOrigenId || 0);

  const getNestedValue = (obj, path) => {
    if (!path) return null;
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const construirDocumentoData = (documento, config) => {
    if (!documento || !config) return null;

    return {
      numero: documento[config.campoNumero] || null,
      fecha: documento[config.campoFecha] || null,
      entidad: config.campoEntidad
        ? getNestedValue(documento, config.campoEntidad)
        : null,
    };
  };

  const construirLabel = ({
    moduloNombre,
    documentoId,
    documentoNumero,
    documentoFecha,
    entidad,
  }) => {
    const partes = [];

    if (moduloNombre) {
      partes.push(
        <span key="modulo" style={COLORES_LABEL.modulo}>
          {moduloNombre.toUpperCase()}
        </span>,
      );
    }



    partes.push(
      <span key="docId" style={{ color: COLORES_LABEL.documentoId, fontWeight: "bold" }}>
       {" ID:"} {documentoId || 0}
      </span>,
    );

    if (documentoNumero && documentoNumero !== "N/A") {
      partes.push(
        <span key="sep2" style={{ color: COLORES_LABEL.separador }}>
          {" "}
          -{" "}
        </span>,
      );
      partes.push(
        <span key="docNum" style={{ color: COLORES_LABEL.documentoNumero, fontWeight: "bold" }}>
          {documentoNumero}
        </span>,
      );
    }

    if (documentoFecha) {
      partes.push(
        <span key="sep3" style={{ color: COLORES_LABEL.separador }}>
          {" "}
          ({formatearFecha(documentoFecha)}){" "}
        </span>,
      );
    }

    if (entidad) {
      partes.push(
        <span key="sep4" style={{ color: COLORES_LABEL.separador }}>
          {" "}
          -{" "}
        </span>,
      );
      partes.push(
        <span key="ent" style={{ color: COLORES_LABEL.entidad, fontWeight: "bold" }}>
          {entidad}
        </span>,
      );
    }

    return partes;
  };

  const labelBoton = useMemo(() => {
    if (
      !moduloSeleccionado ||
      moduloOrigenId <= 0 ||
      documentoOrigenId <= 0
    ) {
      return "Seleccionar Módulo y Documento";
    }

    const documentoData = construirDocumentoData(
      documentoSeleccionado,
      camposConfig,
    );

    return construirLabel({
      moduloNombre: moduloInfo?.nombre || moduloSeleccionado?.nombre || "N/A",
      documentoId: documentoOrigenId,
      documentoNumero: documentoData?.numero || "N/A",
      documentoFecha: documentoData?.fecha || null,
      entidad: documentoData?.entidad || null,
    });
  }, [
    moduloSeleccionado,
    moduloInfo,
    documentoSeleccionado,
    camposConfig,
    moduloOrigenId,
    documentoOrigenId,
  ]);

  const limpiarDocumentos = () => {
    setDocumentos([]);
    setDocumentoSeleccionado(null);
    setModuloInfo(null);
    setCamposConfig(null);
    setExpandedRows(null);
  };

  const cargarDocumentos = async (modulo, documentoIdInicial = 0) => {
    if (!modulo?.modeloDocumentoOrigen) {
      limpiarDocumentos();
      setError(null);
      return;
    }

    setLoadingDocumentos(true);
    setError(null);
    limpiarDocumentos();

    try {
      const response = await getDocumentosPorModelo(
        modulo.modeloDocumentoOrigen,
      );

      const {
        modulo: moduloData,
        config,
        documentos: documentosData,
      } = response;

      const documentosDisponibles = documentosData || [];

      setModuloInfo(moduloData || modulo);
      setCamposConfig(config || null);
      setDocumentos(documentosDisponibles);

      if (documentosDisponibles.length === 0) {
        setError("No se encontraron documentos para este módulo.");
        setLoadingDocumentos(false);
        return;
      }

      const documentoId = Number(documentoIdInicial || 0);

      if (documentoId > 0) {
        const documentoInicial = documentosDisponibles.find(
          (documento) => Number(documento.id) === Number(documentoId),
        );

        if (documentoInicial) {
          setDocumentoSeleccionado(documentoInicial);
          setExpandedRows({ [documentoInicial.id]: true });
        } else {
          setError("No se encontró el documento indicado.");
        }
      }
    } catch (err) {
      console.error("Error al cargar documentos:", err);
      limpiarDocumentos();
      setError(
        err.response?.data?.message ||
          "Error al cargar documentos. Verifique que el modelo existe.",
      );
    } finally {
      setLoadingDocumentos(false);
    }
  };

  useEffect(() => {
    const cargarModulos = async () => {
      setLoadingModulos(true);
      setError(null);

      try {
        const data = await getModulos();

        const modulosActivos = (data || []).filter(
          (modulo) =>
            modulo.activo === true && modulo.modeloDocumentoOrigen,
        );

        const opciones = allowSinModulo
          ? [
              {
                id: 0,
                nombre: "Sin Módulo",
                modeloDocumentoOrigen: null,
              },
              ...modulosActivos,
            ]
          : modulosActivos;

        setModulos(opciones);
      } catch (err) {
        console.error("Error al cargar módulos:", err);
        setModulos([]);
        setError("Error al cargar módulos del sistema");
      } finally {
        setLoadingModulos(false);
      }
    };

    cargarModulos();
  }, [allowSinModulo]);

  useEffect(() => {
    const resolverSeleccionInicial = async () => {
      if (moduloOrigenId <= 0) {
        setModuloSeleccionado(null);
        limpiarDocumentos();
        setError(null);

        if (allowSinModulo) {
          const moduloSinModulo = modulos.find(
            (modulo) => Number(modulo.id) === 0,
          );
          setModuloSeleccionado(moduloSinModulo || null);
        }

        return;
      }

      const moduloInicial = modulos.find(
        (modulo) => Number(modulo.id) === Number(moduloOrigenId),
      );

      if (!moduloInicial) {
        setModuloSeleccionado(null);
        limpiarDocumentos();
        setError("No se encontró el módulo indicado.");
        return;
      }

      setModuloSeleccionado(moduloInicial);
      await cargarDocumentos(moduloInicial, documentoOrigenId);
    };

    if (modulos.length > 0) {
      resolverSeleccionInicial();
    }
  }, [modulos, moduloOrigenId, documentoOrigenId, allowSinModulo]);

  const handleModuloChange = async (event) => {
    const moduloId = Number(event.value);
    const modulo = modulos.find(
      (item) => Number(item.id) === Number(moduloId),
    );

    setModuloSeleccionado(modulo || null);

    if (!modulo || moduloId === 0) {
      limpiarDocumentos();
      setError(null);

      if (onChange && allowSinModulo) {
        onChange({ moduloOrigenId: 0, documentoOrigenId: 0 });
      }

      return;
    }

    await cargarDocumentos(modulo);
  };

  const handleDocumentoSelect = (documento) => {
    if (!moduloSeleccionado || !documento) return;

    const nuevoValor = {
      moduloOrigenId: Number(moduloSeleccionado.id),
      documentoOrigenId: Number(documento.id),
    };

    setDocumentoSeleccionado(documento);
    setExpandedRows({ [documento.id]: true });

    if (typeof onChange === "function") {
      onChange(nuevoValor);
    }

    setDialogVisible(false);
  };

  const handleSinModulo = () => {
    if (!moduloSeleccionado) return;

    if (typeof onChange === "function") {
      onChange({ moduloOrigenId: 0, documentoOrigenId: 0 });
    }

    setDialogVisible(false);
  };

  const handleCancel = () => {
    setDialogVisible(false);
  };

  const idBodyTemplate = (rowData) => {
    const id = camposConfig?.campoId
      ? rowData[camposConfig.campoId]
      : rowData.id;

    return id != null ? Number(id) : "N/A";
  };

  const numeroBodyTemplate = (rowData) => {
    if (!camposConfig?.campoNumero) return "N/A";
    return rowData[camposConfig.campoNumero] || "N/A";
  };

  const fechaBodyTemplate = (rowData) => {
    if (!camposConfig?.campoFecha) return "N/A";
    return formatearFecha(rowData[camposConfig.campoFecha]);
  };

  const entidadBodyTemplate = (rowData) => {
    if (!camposConfig?.campoEntidad) return "N/A";
    return getNestedValue(rowData, camposConfig.campoEntidad) || "N/A";
  };

  const estadoBodyTemplate = (rowData) => {
    if (!rowData.estadoTemporada) return null;
    return <Badge value={rowData.estadoTemporada.descripcion} severity="info" />;
  };

  const cuotaTotalBodyTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon || 0);
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon || 0);
    const cuotaTotal = cuotaPropia + cuotaAlquilada;

    return (
      <Badge value={`${cuotaTotal.toFixed(2)} Ton`} severity="success" />
    );
  };

  const toneladasCapturadasBodyTemplate = (rowData) => {
    const capturadas = Number(rowData.toneladasCapturadasTemporada || 0);
    return (
      <Badge value={`${capturadas.toFixed(2)} Ton`} severity="warning" />
    );
  };

  const toneladasPendientesBodyTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon || 0);
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon || 0);
    const capturadas = Number(rowData.toneladasCapturadasTemporada || 0);
    const pendientes = cuotaPropia + cuotaAlquilada - capturadas;

    return (
      <Badge value={`${pendientes.toFixed(2)} Ton`} severity="warning" />
    );
  };

  const porcentajeAvanzadoBodyTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon || 0);
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon || 0);
    const capturadas = Number(rowData.toneladasCapturadasTemporada || 0);
    const cuotaTotal = cuotaPropia + cuotaAlquilada;

    if (cuotaTotal === 0) {
      return <Badge value="0%" severity="secondary" />;
    }

    const porcentaje = (capturadas / cuotaTotal) * 100;
    return <Badge value={`${porcentaje.toFixed(2)}%`} />;
  };

  const accionesBodyTemplate = (rowData) => (
    <Button
      label={
        Number(documentoSeleccionado?.id) === Number(rowData.id)
          ? "Seleccionado"
          : "Elegir"
      }
      icon={
        Number(documentoSeleccionado?.id) === Number(rowData.id)
          ? "pi pi-check-circle"
          : "pi pi-check"
      }
      size="small"
      severity={
        Number(documentoSeleccionado?.id) === Number(rowData.id)
          ? "success"
          : undefined
      }
      onClick={() => handleDocumentoSelect(rowData)}
    />
  );

  const rowExpansionTemplate = (rowData) => {
    if (
      moduloSeleccionado?.modeloDocumentoOrigen !== "TemporadaPesca" ||
      !rowData.estadisticas
    ) {
      return null;
    }

    const {
      nroFaenas,
      nroCalas,
      especiesCapturadas,
      totalCapturado,
      nroDescargas,
      especiesDescargadas,
      totalDescargado,
    } = rowData.estadisticas;

    const formatearKilaje = (kilaje) =>
      Number(kilaje || 0).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const tarjetaStyle = {
      flex: 1,
      borderRadius: "8px",
      padding: "1rem",
      backgroundColor: "transparent",
    };

    return (
      <div style={{ padding: "1rem", backgroundColor: "#2b2b2b" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "space-around",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              ...tarjetaStyle,
              border: "2px solid #FFC107",
            }}
          >
            <strong style={{ color: "#FFC107" }}>FAENAS</strong>
            <div style={{ color: "#FFFFFF", marginTop: "0.75rem" }}>
              <strong>Nro Faenas:</strong> {Number(nroFaenas || 0)}
            </div>
          </div>

          <div
            style={{
              ...tarjetaStyle,
              border: "2px solid #2196F3",
            }}
          >
            <strong style={{ color: "#2196F3" }}>CALAS</strong>

            <div style={{ color: "#FFFFFF", marginTop: "0.75rem" }}>
              <strong>Nro Calas:</strong> {Number(nroCalas || 0)}
            </div>

            <div style={{ color: "#FFFFFF", marginTop: "0.75rem" }}>
              <strong>ESPECIES CAPTURADAS:</strong>
            </div>

            {especiesCapturadas?.length > 0 ? (
              <>
                {especiesCapturadas.map((especie, index) => (
                  <div
                    key={`${especie.especie}-${index}`}
                    style={{ color: "#FFFFFF", marginLeft: "1rem" }}
                  >
                    - {especie.especie}: {formatearKilaje(especie.kilaje)} Kg
                  </div>
                ))}

                <div
                  style={{
                    color: "#FFC107",
                    borderTop: "1px solid #FFFFFF",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  TOTAL: {formatearKilaje(totalCapturado)} Kg
                </div>
              </>
            ) : (
              <div style={{ color: "#FFFFFF", marginLeft: "1rem" }}>
                Sin datos
              </div>
            )}
          </div>

          <div
            style={{
              ...tarjetaStyle,
              border: "2px solid #4CAF50",
            }}
          >
            <strong style={{ color: "#4CAF50" }}>DESCARGAS</strong>

            <div style={{ color: "#FFFFFF", marginTop: "0.75rem" }}>
              <strong>Nro Descargas:</strong> {Number(nroDescargas || 0)}
            </div>

            <div style={{ color: "#FFFFFF", marginTop: "0.75rem" }}>
              <strong>ESPECIES DESCARGADAS:</strong>
            </div>

            {especiesDescargadas?.length > 0 ? (
              <>
                {especiesDescargadas.map((especie, index) => (
                  <div
                    key={`${especie.especie}-${index}`}
                    style={{ color: "#FFFFFF", marginLeft: "1rem" }}
                  >
                    - {especie.especie}: {formatearKilaje(especie.kilaje)} Kg
                  </div>
                ))}

                <div
                  style={{
                    color: "#FFC107",
                    borderTop: "1px solid #FFFFFF",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  TOTAL: {formatearKilaje(totalDescargado)} Kg
                </div>
              </>
            ) : (
              <div style={{ color: "#FFFFFF", marginLeft: "1rem" }}>
                Sin datos
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
      {allowSinModulo &&
        moduloSeleccionado &&
        Number(moduloSeleccionado.id) === 0 && (
          <Button
            label="Aceptar (Sin Módulo)"
            icon="pi pi-check"
            onClick={handleSinModulo}
            className="p-button-success"
          />
        )}

      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleCancel}
        className="p-button-secondary"
      />
    </div>
  );

  const esTemporadaPesca =
    moduloSeleccionado?.modeloDocumentoOrigen === "TemporadaPesca";

  return (
    <div className="field">
      <label className="block text-900 font-medium mb-2">
        {moduloLabel} y {documentoLabel}{" "}
        <span style={{ color: "red" }}>*</span>
      </label>

      <Button
        type="button"
        icon="pi pi-search"
        onClick={() => {
          if (!disabled) {
            setDialogVisible(true);
          }
        }}
        disabled={disabled || loadingModulos}
        className="p-button-outlined w-full"
        style={{
          justifyContent: "flex-start",
          textAlign: "left",
          fontWeight: "bold",
        }}
      >
        {loadingModulos ? (
          <span style={{ color: "#999" }}>Cargando...</span>
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              flexWrap: "wrap",
            }}
          >
            {labelBoton}
          </span>
        )}
      </Button>

      <Dialog
        header={`Seleccionar ${moduloLabel} y ${documentoLabel}`}
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "1400px" }}
        onHide={handleCancel}
        footer={footer}
        modal
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>
            <label className="block text-900 font-medium mb-2">
              {moduloLabel} <span style={{ color: "red" }}>*</span>
            </label>

            <Dropdown
              value={
                moduloSeleccionado?.id != null
                  ? Number(moduloSeleccionado.id)
                  : null
              }
              options={modulos.map((modulo) => ({
                label:
                  Number(modulo.id) === 0
                    ? modulo.nombre
                    : `${Number(modulo.id)} - ${modulo.nombre}`,
                value: Number(modulo.id),
              }))}
              onChange={handleModuloChange}
              placeholder={
                loadingModulos
                  ? "Cargando módulos..."
                  : "Seleccione módulo..."
              }
              className="w-full"
              filter
              showClear
              disabled={loadingModulos}
            />
          </div>

          <div>
            <label className="block text-900 font-medium mb-2">
              {documentoLabel} <span style={{ color: "red" }}>*</span>
            </label>

            {error && (
              <Message severity="warn" text={error} className="w-full mb-2" />
            )}

            {loadingDocumentos && (
              <Message
                severity="info"
                text="Cargando documentos..."
                className="w-full"
              />
            )}

            {!loadingDocumentos &&
              !error &&
              documentos.length > 0 &&
              esTemporadaPesca && (
                <DataTable
                  value={documentos}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  expandedRows={expandedRows}
                  onRowToggle={(event) => setExpandedRows(event.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="id"
                  selectionMode="single"
                  selection={documentoSeleccionado}
                  onSelectionChange={(event) =>
                    setDocumentoSeleccionado(event.value)
                  }
                  emptyMessage="No hay documentos disponibles"
                  className="p-datatable-sm"
                  scrollable
                  scrollHeight="500px"
                  style={{ fontSize: getResponsiveFontSize() }}
                >
                  <Column expander style={{ width: "3rem" }} />
                  <Column
                    header="ID"
                    body={idBodyTemplate}
                    sortable
                    style={{ width: "80px" }}
                  />
                  <Column
                    header="Nombre"
                    body={numeroBodyTemplate}
                    sortable
                  />
                  <Column
                    header="Empresa"
                    body={entidadBodyTemplate}
                    sortable
                  />
                  <Column
                    header="Resolución"
                    field="numeroResolucion"
                    sortable
                  />
                  <Column header="Estado" body={estadoBodyTemplate} sortable />
                  <Column
                    header="Fecha Inicio"
                    body={fechaBodyTemplate}
                    sortable
                    style={{ width: "120px" }}
                  />
                  <Column
                    header="Fecha Fin"
                    body={(rowData) => formatearFecha(rowData.fechaFin)}
                    sortable
                    style={{ width: "120px" }}
                  />
                  <Column
                    header="Cuota Total"
                    body={cuotaTotalBodyTemplate}
                    sortable
                    style={{ width: "130px" }}
                  />
                  <Column
                    header="Toneladas Capturadas"
                    body={toneladasCapturadasBodyTemplate}
                    sortable
                    style={{ width: "150px" }}
                  />
                  <Column
                    header="Toneladas Pendientes"
                    body={toneladasPendientesBodyTemplate}
                    sortable
                    style={{ width: "150px" }}
                  />
                  <Column
                    header="Porcentaje Avanzado"
                    body={porcentajeAvanzadoBodyTemplate}
                    sortable
                    style={{ width: "150px" }}
                  />
                  <Column
                    header="Acciones"
                    body={accionesBodyTemplate}
                    style={{ width: "130px" }}
                  />
                </DataTable>
              )}

            {!loadingDocumentos &&
              !error &&
              documentos.length > 0 &&
              !esTemporadaPesca && (
                <DataTable
                  value={documentos}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  dataKey="id"
                  selectionMode="single"
                  selection={documentoSeleccionado}
                  onSelectionChange={(event) =>
                    setDocumentoSeleccionado(event.value)
                  }
                  emptyMessage="No hay documentos disponibles"
                  className="p-datatable-sm"
                  scrollable
                  scrollHeight="500px"
                  style={{ fontSize: getResponsiveFontSize() }}
                >
                  <Column
                    header="ID"
                    body={idBodyTemplate}
                    sortable
                    style={{ width: "80px" }}
                  />
                  <Column
                    header="Número"
                    body={numeroBodyTemplate}
                    sortable
                  />
                  <Column
                    header="Fecha"
                    body={fechaBodyTemplate}
                    sortable
                    style={{ width: "120px" }}
                  />
                  {camposConfig?.campoEntidad && (
                    <Column
                      header="Entidad"
                      body={entidadBodyTemplate}
                      sortable
                    />
                  )}
                  <Column
                    header="Acciones"
                    body={accionesBodyTemplate}
                    style={{ width: "130px" }}
                  />
                </DataTable>
              )}

            {allowSinModulo &&
              moduloSeleccionado &&
              Number(moduloSeleccionado.id) === 0 && (
                <Message
                  severity="info"
                  text="Has seleccionado 'Sin Módulo'. Haz clic en 'Aceptar' para confirmar."
                  className="w-full"
                />
              )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ModuloDocumentoSelector;