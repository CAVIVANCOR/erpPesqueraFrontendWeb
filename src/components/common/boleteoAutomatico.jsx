/**
 * boleteoAutomatico.jsx
 *
 * Componente autónomo tipo botón para crear PreFactura + DetallePreFactura a partir
 * de boletas ya emitidas, cargadas desde un archivo JSON.
 *
 * Flujo:
 *   1. El botón pide el archivo JSON.
 *   2. Se abre un diálogo con el resumen (boletas, rango, total) y el botón "Iniciar".
 *   3. Al iniciar: consulta el tipo de cambio de VENTA (Decolecta) una vez por fecha y
 *      envía las boletas al backend en lotes pequeños, en orden, mostrando el avance
 *      con barra de progreso, porcentaje y un registro de cada PreFactura creada.
 *
 * Es idempotente: las boletas que ya existen se omiten, de modo que un proceso
 * interrumpido puede repetirse con el mismo archivo sin duplicar nada.
 *
 * Columnas esperadas del JSON (los espacios sobrantes en los nombres se ignoran):
 *   FECHA DOCUMENTO, FECHA VENCIMIENTO, ID TIPO DOCUMENTO, ID SERIE DOC,
 *   ID TIPO DOC FINAL, SERIE, CORRELATIVO, NUMERO COMPLETO, ID CLIENTE, ID VENDEDOR,
 *   ID FORMA PAGO, ID UNIDAD NEGOCIO, ID TIPO PRODUCTO, ID PRODUCTO, CANTIDAD,
 *   ID MONEDA, PRECIO TOTAL (con IGV incluido)
 *
 * Props:
 * - label: texto del botón
 * - icon: ícono del botón
 * - className / style: estilo del botón
 * - disabled: deshabilita el botón
 * - toast: ref de Toast (opcional)
 * - onFinalizado: callback al terminar (para refrescar la lista)
 * - parametros: { estadoId, tipoOperacionSunatId }
 *               (estadoId vacío = PENDIENTE, lo resuelve el backend)
 *               El tratamiento del IGV (afecto, exonerado, inafecto) se toma de
 *               Producto.tipoAfectacionIGVId; el PRECIO TOTAL del archivo es el total de la boleta.
 * - tamanoLote: boletas por llamada al backend (por defecto 5)
 */
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { importarBoletasAutomatico } from "../../api/preFactura";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { formatearNumero } from "../../utils/utils";

const COLUMNAS_REQUERIDAS = [
  "FECHA DOCUMENTO",
  "FECHA VENCIMIENTO",
  "ID TIPO DOCUMENTO",
  "ID SERIE DOC",
  "ID TIPO DOC FINAL",
  "SERIE",
  "CORRELATIVO",
  "NUMERO COMPLETO",
  "ID CLIENTE",
  "ID VENDEDOR",
  "ID FORMA PAGO",
  "ID TIPO PRODUCTO",
  "ID PRODUCTO",
  "CANTIDAD",
  "ID MONEDA",
  "PRECIO TOTAL",
];

// El tipo de afectación del IGV no es parámetro: el backend lo toma de cada producto
const PARAMETROS_POR_DEFECTO = {
  estadoId: null,
  tipoOperacionSunatId: 1,
};

// ════════════════════════════════════════════════════════════
// NORMALIZACIÓN DEL ARCHIVO
// ════════════════════════════════════════════════════════════
const aNumero = (valor) => {
  const numero = parseFloat(String(valor ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(numero) ? null : numero;
};

// "30/05/2026" → { iso: fecha local a ISO, ymd: "2026-05-30" }
const parsearFecha = (texto) => {
  const partes = String(texto ?? "").trim().split("/");
  if (partes.length !== 3) return null;
  const [dia, mes, anio] = partes.map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.getDate() !== dia ||
    fecha.getMonth() !== mes - 1
  ) {
    return null;
  }
  const ymd = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  return { iso: fecha.toISOString(), ymd };
};

const normalizarFila = (filaOriginal) => {
  // Las claves se normalizan: el archivo puede traer espacios (ej: " PRECIO TOTAL ")
  const fila = {};
  Object.entries(filaOriginal || {}).forEach(([clave, valor]) => {
    fila[String(clave).trim().toUpperCase()] = valor;
  });

  const faltantes = COLUMNAS_REQUERIDAS.filter(
    (c) => fila[c] === undefined || fila[c] === null || String(fila[c]).trim() === "",
  );
  if (faltantes.length > 0) {
    return { error: `Faltan columnas: ${faltantes.join(", ")}` };
  }

  const fechaDocumento = parsearFecha(fila["FECHA DOCUMENTO"]);
  const fechaVencimiento = parsearFecha(fila["FECHA VENCIMIENTO"]);
  if (!fechaDocumento || !fechaVencimiento) return { error: "Fecha inválida" };

  const cantidad = aNumero(fila["CANTIDAD"]);
  const totalConIGV = aNumero(fila["PRECIO TOTAL"]);
  if (!(cantidad > 0) || !(totalConIGV > 0)) {
    return { error: "Cantidad o total inválido" };
  }

  return {
    boleta: {
      fechaDocumento: fechaDocumento.iso,
      fechaVencimiento: fechaVencimiento.iso,
      ymd: fechaDocumento.ymd,
      tipoDocumentoId: aNumero(fila["ID TIPO DOCUMENTO"]),
      serieDocId: aNumero(fila["ID SERIE DOC"]),
      tipoDocumentoFinalId: aNumero(fila["ID TIPO DOC FINAL"]),
      numSerieDocFinal: String(fila["SERIE"]).trim(),
      numCorreDocFinal: String(fila["CORRELATIVO"]).trim(),
      numeroDocumentoFinal: String(fila["NUMERO COMPLETO"]).trim(),
      clienteId: aNumero(fila["ID CLIENTE"]),
      respVentasId: aNumero(fila["ID VENDEDOR"]),
      formaPagoId: aNumero(fila["ID FORMA PAGO"]),
      unidadNegocioId: aNumero(fila["ID UNIDAD NEGOCIO"]),
      tipoProductoId: aNumero(fila["ID TIPO PRODUCTO"]),
      productoId: aNumero(fila["ID PRODUCTO"]),
      monedaId: aNumero(fila["ID MONEDA"]),
      cantidad,
      totalConIGV,
    },
  };
};

const normalizarArchivo = (filas) => {
  const boletas = [];
  const invalidas = [];
  const vistos = new Set();
  let duplicadasEnArchivo = 0;

  filas.forEach((filaOriginal, indice) => {
    const { boleta, error } = normalizarFila(filaOriginal);
    if (error) {
      invalidas.push({ fila: indice + 1, error });
      return;
    }
    if (vistos.has(boleta.numeroDocumentoFinal)) {
      duplicadasEnArchivo += 1;
      return;
    }
    vistos.add(boleta.numeroDocumentoFinal);
    boletas.push(boleta);
  });

  // La numeración interna se asigna en el orden en que se procesan: se ordena por boleta
  boletas.sort(
    (a, b) =>
      a.numSerieDocFinal.localeCompare(b.numSerieDocFinal) ||
      Number(a.numCorreDocFinal) - Number(b.numCorreDocFinal),
  );

  return { boletas, invalidas, duplicadasEnArchivo };
};

// ════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════
const BoleteoAutomatico = ({
  label = "Boleteo",
  icon = "pi pi-file-import",
  className = "p-button-help",
  style,
  disabled = false,
  toast,
  onFinalizado,
  parametros = PARAMETROS_POR_DEFECTO,
  tamanoLote = 5,
}) => {
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const cancelarRef = useRef(false);

  const [visible, setVisible] = useState(false);
  // listo → procesando → finalizado
  const [fase, setFase] = useState("listo");
  const [archivo, setArchivo] = useState("");
  const [datos, setDatos] = useState({ boletas: [], invalidas: [], duplicadasEnArchivo: 0 });
  const [procesadas, setProcesadas] = useState(0);
  const [conteo, setConteo] = useState({ creadas: 0, omitidas: 0, errores: 0 });
  const [registro, setRegistro] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [aviso, setAviso] = useState(null);

  const total = datos.boletas.length;
  const porcentaje = total > 0 ? Math.round((procesadas / total) * 100) : 0;
  const procesando = fase === "procesando";

  // Mantener el registro siempre mostrando la última línea
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [registro]);

  const mostrarToast = (severity, summary, detail, life = 4000) =>
    toast?.current?.show({ severity, summary, detail, life });

  // ────────────────────────────────────────────────────────
  // 1. Elegir y leer el archivo
  // ────────────────────────────────────────────────────────
  const handleArchivo = async (evento) => {
    const seleccionado = evento.target.files?.[0];
    evento.target.value = ""; // permite volver a elegir el mismo archivo
    if (!seleccionado) return;

    try {
      const filas = JSON.parse(await seleccionado.text());
      if (!Array.isArray(filas) || filas.length === 0) {
        throw new Error("El archivo debe contener una lista de boletas.");
      }

      const normalizado = normalizarArchivo(filas);
      if (normalizado.boletas.length === 0) {
        throw new Error("Ninguna fila del archivo es válida.");
      }

      setArchivo(seleccionado.name);
      setDatos(normalizado);
      setProcesadas(0);
      setConteo({ creadas: 0, omitidas: 0, errores: 0 });
      setRegistro([]);
      setMensaje("");
      setAviso(null);
      setFase("listo");
      setVisible(true);
    } catch (error) {
      mostrarToast("error", "Archivo no válido", error.message || "No se pudo leer el archivo JSON", 6000);
    }
  };

  // ────────────────────────────────────────────────────────
  // 2. Procesar
  // ────────────────────────────────────────────────────────
  const agregarRegistro = (lineas) => setRegistro((previo) => [...previo, ...lineas]);

  const iniciar = async () => {
    cancelarRef.current = false;
    setFase("procesando");
    setAviso(null);
    let detenido = false;
    let acumulado = { creadas: 0, omitidas: 0, errores: 0 };

    // Tipo de cambio de VENTA (sell_price), una consulta por fecha
    const tipoCambioPorFecha = {};
    try {
      setMensaje("Consultando tipo de cambio de venta (Decolecta)...");
      for (const ymd of [...new Set(datos.boletas.map((b) => b.ymd))]) {
        const respuesta = await consultarTipoCambioSunat({ date: ymd });
        const tipoCambio = Number(respuesta?.sell_price);
        if (!(tipoCambio > 0)) throw new Error(`Sin tipo de cambio de venta para ${ymd}`);
        tipoCambioPorFecha[ymd] = Number(tipoCambio.toFixed(3));
        agregarRegistro([{ tipo: "info", texto: `TC venta ${ymd}: ${tipoCambioPorFecha[ymd]}` }]);
      }
    } catch (error) {
      setAviso(`No se pudo obtener el tipo de cambio: ${error.message}. No se creó ninguna PreFactura.`);
      setMensaje("");
      setFase("finalizado");
      return;
    }

    for (let i = 0; i < datos.boletas.length; i += tamanoLote) {
      if (cancelarRef.current) {
        detenido = true;
        setAviso("Proceso detenido por el usuario. Puede repetirlo con el mismo archivo: lo ya creado se omite.");
        break;
      }

      const lote = datos.boletas.slice(i, i + tamanoLote);
      const primera = lote[0].numeroDocumentoFinal;
      const ultima = lote[lote.length - 1].numeroDocumentoFinal;
      setMensaje(
        lote.length > 1
          ? `Creando PreFacturas ${primera} a ${ultima}...`
          : `Creando PreFactura ${primera}...`,
      );

      try {
        const { resultados } = await importarBoletasAutomatico(
          lote.map(({ ymd, ...boleta }) => ({ ...boleta, tipoCambio: tipoCambioPorFecha[ymd] })),
          parametros,
        );

        const lineas = resultados.map((r) => {
          if (r.estado === "CREADA") {
            acumulado.creadas += 1;
            return {
              tipo: "ok",
              texto: `${r.numeroDocumentoFinal} → ${r.numeroDocumento} · total ${formatearNumero(r.total)}`,
            };
          }
          if (r.estado === "OMITIDA") {
            acumulado.omitidas += 1;
            return { tipo: "omitida", texto: `${r.numeroDocumentoFinal} · ${r.mensaje}` };
          }
          acumulado.errores += 1;
          return { tipo: "error", texto: `${r.numeroDocumentoFinal} · ${r.mensaje}` };
        });

        agregarRegistro(lineas);
        setConteo({ ...acumulado });
        setProcesadas(i + lote.length);
      } catch (error) {
        // Error de comunicación: se detiene. Lo ya creado se omite al repetir el proceso.
        agregarRegistro([
          {
            tipo: "error",
            texto: `Error de comunicación en el lote ${primera} a ${ultima}: ${error.response?.data?.message || error.message}`,
          },
        ]);
        setAviso(
          "El proceso se detuvo por un error de comunicación. Vuelva a cargar el mismo archivo: las PreFacturas ya creadas se omitirán.",
        );
        detenido = true;
        break;
      }
    }

    setMensaje("");
    setFase("finalizado");

    mostrarToast(
      acumulado.errores > 0 || detenido ? "warn" : "success",
      "Boleteo automático",
      `Creadas: ${acumulado.creadas} · Omitidas: ${acumulado.omitidas} · Errores: ${acumulado.errores}`,
      6000,
    );
    onFinalizado?.();
  };

  const cerrar = () => {
    if (procesando) return;
    setVisible(false);
  };

  // ────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────
  const sumaTotal = datos.boletas.reduce((suma, b) => suma + b.totalConIGV, 0);
  const rango =
    total > 0
      ? `${datos.boletas[0].numeroDocumentoFinal} → ${datos.boletas[total - 1].numeroDocumentoFinal}`
      : "";

  const colorLinea = {
    ok: "#2E7D32",
    omitida: "#F57C00",
    error: "#D32F2F",
    info: "#1976D2",
  };
  const iconoLinea = { ok: "✔", omitida: "⚠", error: "✖", info: "ℹ" };

  const footer = (
    <div>
      {fase === "listo" && (
        <>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={cerrar} />
          <Button label="Iniciar importación" icon="pi pi-play" onClick={iniciar} />
        </>
      )}
      {procesando && (
        <Button
          label="Detener"
          icon="pi pi-stop"
          className="p-button-danger p-button-outlined"
          onClick={() => {
            cancelarRef.current = true;
          }}
        />
      )}
      {fase === "finalizado" && <Button label="Cerrar" icon="pi pi-check" onClick={cerrar} />}
    </div>
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleArchivo}
      />
      <Button
        type="button"
        label={label}
        icon={icon}
        className={className}
        style={style}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        tooltip="Crear PreFacturas desde un archivo JSON de boletas"
        tooltipOptions={{ position: "top" }}
      />

      <Dialog
        visible={visible}
        onHide={cerrar}
        header="Boleteo Automático"
        footer={footer}
        style={{ width: "800px", maxWidth: "95vw" }}
        closable={!procesando}
        closeOnEscape={!procesando}
        modal
        blockScroll
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div className="font-bold">Archivo</div>
              <div>{archivo}</div>
            </div>
            <div>
              <div className="font-bold">Boletas a procesar</div>
              <div>{total}</div>
            </div>
            <div>
              <div className="font-bold">Rango</div>
              <div>{rango}</div>
            </div>
            <div>
              <div className="font-bold">Total</div>
              <div>{formatearNumero(sumaTotal)}</div>
            </div>
          </div>

          {(datos.invalidas.length > 0 || datos.duplicadasEnArchivo > 0) && (
            <div style={{ color: "#F57C00" }}>
              {datos.invalidas.length > 0 && (
                <div>
                  ⚠ {datos.invalidas.length} fila(s) inválida(s) no se procesarán (ej: fila{" "}
                  {datos.invalidas[0].fila}: {datos.invalidas[0].error})
                </div>
              )}
              {datos.duplicadasEnArchivo > 0 && (
                <div>⚠ {datos.duplicadasEnArchivo} boleta(s) repetida(s) en el archivo se ignoraron</div>
              )}
            </div>
          )}

          {fase !== "listo" && (
            <>
              <div>
                <ProgressBar
                  value={porcentaje}
                  showValue
                  displayValueTemplate={(valor) => `${valor}%`}
                  style={{ height: "1.8rem" }}
                />
                <div style={{ textAlign: "center", marginTop: "0.25rem" }}>
                  {procesadas} de {total} boletas
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Tag severity="success" value={`Creadas: ${conteo.creadas}`} />
                <Tag severity="warning" value={`Omitidas: ${conteo.omitidas}`} />
                <Tag severity="danger" value={`Errores: ${conteo.errores}`} />
                <Tag severity="info" value={`Pendientes: ${total - procesadas}`} />
              </div>

              {mensaje && (
                <div style={{ fontStyle: "italic" }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: "0.5rem" }} />
                  {mensaje}
                </div>
              )}

              {aviso && <div style={{ color: "#D32F2F", fontWeight: "bold" }}>{aviso}</div>}

              <div
                ref={logRef}
                style={{
                  height: "260px",
                  overflowY: "auto",
                  background: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  padding: "0.5rem",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                }}
              >
                {registro.map((linea, indice) => (
                  <div key={indice} style={{ color: colorLinea[linea.tipo] }}>
                    {iconoLinea[linea.tipo]} {linea.texto}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default BoleteoAutomatico;
