import React, { useState, useEffect } from "react";
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

const ModuloDocumentoSelector = ({
  visible,
  initialModuloId = 0,
  initialDocumentoId = 0,
  onSelect,
  onCancel,
  moduloLabel = "Módulo",
  documentoLabel = "Documento",
}) => {
  const [modulos, setModulos] = useState([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [moduloInfo, setModuloInfo] = useState(null);
  const [camposConfig, setCamposConfig] = useState(null);

  useEffect(() => {
    cargarModulos();
  }, []);

  useEffect(() => {
    if (visible && initialModuloId && initialModuloId !== 0) {
      const moduloInicial = modulos.find(
        (m) => Number(m.id) === Number(initialModuloId),
      );
      if (moduloInicial) {
        setModuloSeleccionado(moduloInicial);
        cargarDocumentos(moduloInicial.modeloDocumentoOrigen);
      }
    }
  }, [visible, initialModuloId, modulos]);

  useEffect(() => {
    if (
      documentos.length > 0 &&
      initialDocumentoId &&
      initialDocumentoId !== 0
    ) {
      const docInicial = documentos.find(
        (d) => Number(d.id) === Number(initialDocumentoId),
      );
      if (docInicial) {
        setDocumentoSeleccionado(docInicial);
        setExpandedRows({ [docInicial.id]: true });
      }
    }
  }, [documentos, initialDocumentoId]);

  const cargarModulos = async () => {
    try {
      const data = await getModulos();
      const modulosActivos = data.filter(
        (m) => m.activo && m.modeloDocumentoOrigen,
      );

      const modulosConOpcionSinModulo = [
        { id: 0, nombre: "Sin Módulo", modeloDocumentoOrigen: null },
        ...modulosActivos,
      ];

      setModulos(modulosConOpcionSinModulo);
    } catch (err) {
      console.error("Error al cargar módulos:", err);
      setError("Error al cargar módulos del sistema");
    }
  };

  const cargarDocumentos = async (modeloNombre) => {
    if (!modeloNombre) {
      setDocumentos([]);
      setModuloInfo(null);
      setCamposConfig(null);
      return;
    }

    setLoading(true);
    setError(null);
    setDocumentos([]);
    setDocumentoSeleccionado(null);
    setExpandedRows(null);

    try {
      const response = await getDocumentosPorModelo(modeloNombre);
      const { modulo, config, documentos: docs } = response;

      setModuloInfo(modulo);
      setCamposConfig(config);
      setDocumentos(docs || []);

      if (docs.length === 0) {
        setError("No se encontraron documentos para este módulo.");
      }
    } catch (err) {
      console.error("Error al cargar documentos:", err);
      setError(
        err.response?.data?.message ||
          "Error al cargar documentos. Verifique que el modelo existe.",
      );
      setDocumentos([]);
      setModuloInfo(null);
      setCamposConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleModuloChange = (e) => {
    const modulo = modulos.find((m) => Number(m.id) === Number(e.value));
    setModuloSeleccionado(modulo);

    if (modulo && modulo.id !== 0) {
      cargarDocumentos(modulo.modeloDocumentoOrigen);
    } else {
      setDocumentos([]);
      setModuloInfo(null);
      setCamposConfig(null);
      setError(null);
    }
  };

  const handleDocumentoSelect = (documento) => {
    if (moduloSeleccionado && moduloSeleccionado.id === 0) {
      onSelect(0, 0, null, null);
    } else {
      const documentoData = {
        numero: camposConfig ? documento[camposConfig.campoNumero] : null,
        fecha: camposConfig ? documento[camposConfig.campoFecha] : null,
        entidad: camposConfig?.campoEntidad
          ? getNestedValue(documento, camposConfig.campoEntidad)
          : null,
      };

      onSelect(
        Number(moduloSeleccionado.id),
        Number(documento.id),
        moduloInfo,
        documentoData,
      );
    }
  };

  const getNestedValue = (obj, path) => {
    if (!path) return null;
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const idBodyTemplate = (rowData) => {
    return camposConfig ? rowData[camposConfig.campoId] : rowData.id;
  };

  const numeroBodyTemplate = (rowData) => {
    if (!camposConfig) return "N/A";
    return rowData[camposConfig.campoNumero] || "N/A";
  };

  const fechaBodyTemplate = (rowData) => {
    if (!camposConfig) return "N/A";
    const fecha = rowData[camposConfig.campoFecha];
    return formatearFecha(fecha);
  };

  const entidadBodyTemplate = (rowData) => {
    if (!camposConfig || !camposConfig.campoEntidad) return null;
    const entidad = getNestedValue(rowData, camposConfig.campoEntidad);
    return entidad || "N/A";
  };

  const estadoBodyTemplate = (rowData) => {
    if (!rowData.estadoTemporada) return null;
    return (
      <Badge value={rowData.estadoTemporada.descripcion} severity="info" />
    );
  };

  const cuotaTotalBodyTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon) || 0;
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon) || 0;
    const cuotaTotal = cuotaPropia + cuotaAlquilada;

    return <Badge value={`${cuotaTotal.toFixed(2)} Ton`} severity="success" />;
  };

  const toneladasCapturadasBodyTemplate = (rowData) => {
    const capturadas = Number(rowData.toneladasCapturadasTemporada) || 0;
    return <Badge value={`${capturadas.toFixed(2)} Ton`} severity="warning" />;
  };

  const toneladasPendientesBodyTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon) || 0;
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon) || 0;
    const cuotaTotal = cuotaPropia + cuotaAlquilada;
    const capturadas = Number(rowData.toneladasCapturadasTemporada) || 0;
    const pendientes = cuotaTotal - capturadas;

    return <Badge value={`${pendientes.toFixed(2)} Ton`} severity="warning" />;
  };

  const porcentajeAvanzadoBodyTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon) || 0;
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon) || 0;
    const cuotaTotal = cuotaPropia + cuotaAlquilada;
    const capturadas = Number(rowData.toneladasCapturadasTemporada) || 0;

    if (cuotaTotal === 0) {
      return <Badge value="0%" severity="secondary" />;
    }

    const porcentaje = (capturadas / cuotaTotal) * 100;
    return <Badge value={`${porcentaje.toFixed(2)}%`} />;
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <Button
        label="Elegir"
        icon="pi pi-check"
        size="small"
        onClick={() => handleDocumentoSelect(rowData)}
      />
    );
  };

  const rowExpansionTemplate = (rowData) => {
    const esTemporadaPesca =
      moduloSeleccionado?.modeloDocumentoOrigen === "TemporadaPesca";

    if (!esTemporadaPesca || !rowData.estadisticas) {
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

    return (
      <div style={{ padding: "1rem", backgroundColor: "#2b2b2b" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "space-around",
          }}
        >
          {/* TARJETA FAENAS */}
          <div
            style={{
              flex: 1,
              border: "2px solid #FFC107",
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <i
                className="pi pi-list"
                style={{ fontSize: "1.2rem", color: "#FFC107" }}
              ></i>
              <strong style={{ color: "#FFFFFF", fontSize: "1rem" }}>
                FAENAS
              </strong>
            </div>
            <div style={{ color: "#FFFFFF", fontSize: "0.95rem" }}>
              <strong>Nro Faenas:</strong> {nroFaenas}
            </div>
          </div>

          {/* TARJETA CALAS */}
          <div
            style={{
              flex: 1,
              border: "2px solid #2196F3",
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <i
                className="pi pi-compass"
                style={{ fontSize: "1.2rem", color: "#2196F3" }}
              ></i>
              <strong style={{ color: "#FFFFFF", fontSize: "1rem" }}>
                CALAS
              </strong>
            </div>
            <div
              style={{
                color: "#FFFFFF",
                fontSize: "0.95rem",
                marginBottom: "0.5rem",
              }}
            >
              <strong>Nro Calas:</strong> {nroCalas}
            </div>
            <div
              style={{
                color: "#FFFFFF",
                fontSize: "0.95rem",
                marginBottom: "0.5rem",
              }}
            >
              <i
                className="pi pi-chart-bar"
                style={{ color: "#2196F3", marginRight: "0.5rem" }}
              ></i>
              <strong>ESPECIES CAPTURADAS:</strong>
            </div>
            {especiesCapturadas && especiesCapturadas.length > 0 ? (
              <>
                {especiesCapturadas.map((esp, idx) => (
                  <div
                    key={idx}
                    style={{
                      color: "#FFFFFF",
                      fontSize: "0.9rem",
                      marginLeft: "1.5rem",
                    }}
                  >
                    - {esp.especie}:{" "}
                    {Number(esp.kilaje).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Kg
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid #FFFFFF",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                  }}
                >
                  <strong style={{ color: "#FFC107", fontSize: "0.95rem" }}>
                    TOTAL:{" "}
                    {Number(totalCapturado).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Kg
                  </strong>
                </div>
              </>
            ) : (
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                  marginLeft: "1.5rem",
                }}
              >
                Sin datos
              </div>
            )}
          </div>

          {/* TARJETA DESCARGAS */}
          <div
            style={{
              flex: 1,
              border: "2px solid #4CAF50",
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <i
                className="pi pi-box"
                style={{ fontSize: "1.2rem", color: "#4CAF50" }}
              ></i>
              <strong style={{ color: "#FFFFFF", fontSize: "1rem" }}>
                DESCARGAS
              </strong>
            </div>
            <div
              style={{
                color: "#FFFFFF",
                fontSize: "0.95rem",
                marginBottom: "0.5rem",
              }}
            >
              <strong>Nro Descargas:</strong> {nroDescargas}
            </div>
            <div
              style={{
                color: "#FFFFFF",
                fontSize: "0.95rem",
                marginBottom: "0.5rem",
              }}
            >
              <i
                className="pi pi-chart-bar"
                style={{ color: "#4CAF50", marginRight: "0.5rem" }}
              ></i>
              <strong>ESPECIES DESCARGADAS:</strong>
            </div>
            {especiesDescargadas && especiesDescargadas.length > 0 ? (
              <>
                {especiesDescargadas.map((esp, idx) => (
                  <div
                    key={idx}
                    style={{
                      color: "#FFFFFF",
                      fontSize: "0.9rem",
                      marginLeft: "1.5rem",
                    }}
                  >
                    - {esp.especie}:{" "}
                    {Number(esp.kilaje).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Kg
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid #FFFFFF",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                  }}
                >
                  <strong style={{ color: "#FFC107", fontSize: "0.95rem" }}>
                    TOTAL:{" "}
                    {Number(totalDescargado).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Kg
                  </strong>
                </div>
              </>
            ) : (
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                  marginLeft: "1.5rem",
                }}
              >
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
      {moduloSeleccionado && moduloSeleccionado.id === 0 && (
        <Button
          label="Aceptar (Sin Módulo)"
          icon="pi pi-check"
          onClick={() => onSelect(0, 0)}
          className="p-button-success"
        />
      )}
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={onCancel}
        className="p-button-secondary"
      />
    </div>
  );

  const esTemporadaPesca =
    moduloSeleccionado?.modeloDocumentoOrigen === "TemporadaPesca";

  return (
    <Dialog
      header="Seleccionar Módulo y Documento Origen"
      visible={visible}
      style={{ width: "90vw", maxWidth: "1400px" }}
      onHide={onCancel}
      footer={footer}
      modal
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="block text-900 font-medium mb-2">
            {moduloLabel} <span style={{ color: "red" }}>*</span>
          </label>
          <Dropdown
            value={moduloSeleccionado?.id}
            options={modulos.map((m) => ({
              label: m.id === 0 ? m.nombre : `${m.id} - ${m.nombre}`,
              value: m.id,
            }))}
            onChange={handleModuloChange}
            placeholder="Seleccione módulo..."
            className="w-full"
            filter
            showClear
          />
        </div>

        <div>
          <label className="block text-900 font-medium mb-2">
            {documentoLabel} <span style={{ color: "red" }}>*</span>
          </label>

          {error && (
            <Message severity="warn" text={error} className="w-full mb-2" />
          )}

          {loading && (
            <Message
              severity="info"
              text="Cargando documentos..."
              className="w-full"
            />
          )}

          {!loading &&
            !error &&
            documentos.length > 0 &&
            moduloSeleccionado?.modeloDocumentoOrigen === "TemporadaPesca" && (
              <DataTable
                value={documentos}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                dataKey="id"
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
                <Column header="Nombre" body={numeroBodyTemplate} sortable />
                <Column header="Empresa" body={entidadBodyTemplate} sortable />
                <Column header="Resolución" field="numeroResolucion" sortable />
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
                  style={{ width: "120px" }}
                />
              </DataTable>
            )}

          {!loading &&
            !error &&
            documentos.length > 0 &&
            moduloSeleccionado?.modeloDocumentoOrigen !== "TemporadaPesca" && (
              <DataTable
                value={documentos}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                dataKey="id"
                emptyMessage="No hay documentos disponibles"
                className="p-datatable-sm"
                scrollable
                scrollHeight="500px"
              >
                <Column
                  header="ID"
                  body={idBodyTemplate}
                  sortable
                  style={{ width: "80px" }}
                />
                <Column header="Número" body={numeroBodyTemplate} sortable />
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
                  style={{ width: "120px" }}
                />
              </DataTable>
            )}

          {moduloSeleccionado && moduloSeleccionado.id === 0 && (
            <Message
              severity="info"
              text="Has seleccionado 'Sin Módulo'. Haz clic en 'Aceptar' para confirmar."
              className="w-full"
            />
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ModuloDocumentoSelector;
