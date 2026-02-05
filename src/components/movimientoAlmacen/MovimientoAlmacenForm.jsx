// src/components/movimientoAlmacen/MovimientoAlmacenForm.jsx
// Formulario modular para MovimientoAlmacen con cabecera y CRUD de detalles
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Panel } from "primereact/panel";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { TabView, TabPanel } from "primereact/tabview";
import DetalleMovimientoList from "./DetalleMovimientoList";
import DetalleMovimientoForm from "./DetalleMovimientoForm";
import KardexProductoDialog from "./KardexProductoDialog";
import VerImpresionMovimientoPDF from "./VerImpresionMovimientoPDF";
import VerImpresionMovimientoConCostosPDF from "./VerImpresionMovimientoConCostosPDF";
import EntregaARendirMovAlmacenCard from "./EntregaARendirMovAlmacenCard";
import {
  getSeriesDoc,
  getMovimientoAlmacenPorId,
} from "../../api/movimientoAlmacen";
import { getAlmacenById } from "../../api/almacen";
import { getDireccionesEntidad } from "../../api/direccionEntidad";
import { getVehiculosEntidad } from "../../api/vehiculoEntidad";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getParametrosAprobador } from "../../api/parametroAprobador";
import { useAuthStore } from "../../shared/stores/useAuthStore";

export default function MovimientoAlmacenForm({
  isEdit,
  defaultValues,
  empresas,
  tiposDocumento,
  entidadesComerciales,
  conceptosMovAlmacen = [],
  productos = [],
  faenasPesca = [],
  embarcaciones = [],
  ordenesTrabajoOptions = [],
  transportistas = [],
  vehiculos = [],
  agenciasEnvio = [],
  personalOptions = [],
  ordenesCompraOptions = [],
  pedidosVentaOptions = [],
  estadosDocAlmacen = [],
  estadosMercaderia = [],
  estadosCalidad = [],
  detallesReqCompra = [],
  empresaFija = null, // Empresa pre-seleccionada desde el filtro
  centrosCosto = [], // Para entregas a rendir
  tiposMovimiento = [], // Para entregas a rendir
  monedas = [], // Para entregas a rendir
  unidadesNegocio = [],
  onSubmit,
  onCancel,
  onCerrar,
  onAnular,
  onReactivar,
  onGenerarKardex,
  onIrAOrdenCompra,
  onIrAPreFactura,
  loading,
  toast, // Toast ref pasado desde el componente padre
  permisos = {}, // Permisos del usuario
  readOnly = false, // Modo solo lectura
}) {
  // Estados de la cabecera - Conforme al modelo MovimientoAlmacen
  const [empresaId, setEmpresaId] = useState(defaultValues.empresaId || null);
  const [tipoDocumentoId, setTipoDocumentoId] = useState(
    defaultValues.tipoDocumentoId || null,
  );
  const [conceptoMovAlmacenId, setConceptoMovAlmacenId] = useState(
    defaultValues.conceptoMovAlmacenId || null,
  );
  const [serieDocId, setSerieDocId] = useState(
    defaultValues.serieDocId || null,
  );
  const [numSerieDoc, setNumSerieDoc] = useState(
    defaultValues.numSerieDoc || "",
  );
  const [numCorreDoc, setNumCorreDoc] = useState(
    defaultValues.numCorreDoc || "",
  );
  const [numeroDocumento, setNumeroDocumento] = useState(
    defaultValues.numeroDocumento || "",
  );
  const [fechaDocumento, setFechaDocumento] = useState(
    defaultValues.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date(),
  );
  const [entidadComercialId, setEntidadComercialId] = useState(
    defaultValues.entidadComercialId || null,
  );
  const [faenaPescaId, setFaenaPescaId] = useState(
    defaultValues.faenaPescaId || null,
  );
  const [embarcacionId, setEmbarcacionId] = useState(
    defaultValues.embarcacionId || null,
  );
  const [ordenTrabajoId, setOrdenTrabajoId] = useState(
    defaultValues.ordenTrabajoId || null,
  );
  const [dirOrigenId, setDirOrigenId] = useState(
    defaultValues.dirOrigenId || null,
  );
  const [dirDestinoId, setDirDestinoId] = useState(
    defaultValues.dirDestinoId || null,
  );
  const [numGuiaSunat, setNumGuiaSunat] = useState(
    defaultValues.numGuiaSunat || "",
  );
  const [fechaGuiaSunat, setFechaGuiaSunat] = useState(
    defaultValues.fechaGuiaSunat
      ? new Date(defaultValues.fechaGuiaSunat)
      : null,
  );
  const [transportistaId, setTransportistaId] = useState(
    defaultValues.transportistaId || null,
  );
  const [vehiculoId, setVehiculoId] = useState(
    defaultValues.vehiculoId || null,
  );
  const [agenciaEnvioId, setAgenciaEnvioId] = useState(
    defaultValues.agenciaEnvioId || null,
  );
  const [dirAgenciaEnvioId, setDirAgenciaEnvioId] = useState(
    defaultValues.dirAgenciaEnvioId || null,
  );
  const [personalRespAlmacen, setPersonalRespAlmacen] = useState(
    defaultValues.personalRespAlmacen || null,
  );
  const [ordenCompraId, setOrdenCompraId] = useState(
    defaultValues.ordenCompraId || null,
  );
  const [pedidoVentaId, setPedidoVentaId] = useState(
    defaultValues.pedidoVentaId || null,
  );
  const [estadoDocAlmacenId, setEstadoDocAlmacenId] = useState(
    defaultValues.estadoDocAlmacenId || null,
  );
  const [esCustodia, setEsCustodia] = useState(
    defaultValues.esCustodia !== undefined ? defaultValues.esCustodia : false,
  );
  const [observaciones, setObservaciones] = useState(
    defaultValues.observaciones || "",
  );
  const [unidadNegocioId, setUnidadNegocioId] = useState(
    defaultValues.unidadNegocioId || null,
  );
  // Estados para información de almacenes del concepto
  const [almacenOrigenInfo, setAlmacenOrigenInfo] = useState(null);
  const [almacenDestinoInfo, setAlmacenDestinoInfo] = useState(null);
  const [llevaKardexOrigen, setLlevaKardexOrigen] = useState(false);
  const [llevaKardexDestino, setLlevaKardexDestino] = useState(false);

  // Estados dinámicos para filtros
  const [entidadesFiltradas, setEntidadesFiltradas] = useState([]);
  const [direccionesOrigen, setDireccionesOrigen] = useState([]);
  const [direccionesDestino, setDireccionesDestino] = useState([]);
  const [direccionesAgencia, setDireccionesAgencia] = useState([]);
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState([]);
  const [transportistasFiltrados, setTransportistasFiltrados] = useState([]);
  const [agenciasFiltradas, setAgenciasFiltradas] = useState([]);
  const [estadosDocumento, setEstadosDocumento] = useState([]);

  // Usuario logueado
  const usuarioLogueado = useAuthStore((state) => state.user);

  // Verificar si el documento está cerrado o con kardex generado (estadoDocAlmacenId = 31 o 33)
  const documentoCerrado =
    defaultValues?.estadoDocAlmacenId === 31 ||
    defaultValues?.estadoDocAlmacenId === "31" ||
    defaultValues?.estadoDocAlmacenId === 33 ||
    defaultValues?.estadoDocAlmacenId === "33";

  // Estados para detalles
  const [detalles, setDetalles] = useState(defaultValues.detalles || []);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [showKardexDialog, setShowKardexDialog] = useState(false);
  const [detalleKardex, setDetalleKardex] = useState(null);

  // Estado para contador de entregas a rendir
  const [entregasCount, setEntregasCount] = useState(0);

  // Función para recargar detalles desde la BD
  const recargarDetalles = async () => {
    if (defaultValues?.id) {
      try {
        const { getMovimientoAlmacenPorId } =
          await import("../../api/movimientoAlmacen");
        const movimientoActualizado = await getMovimientoAlmacenPorId(
          defaultValues.id,
        );
        setDetalles(movimientoActualizado.detalles || []);
      } catch (error) {
        console.error("Error al recargar detalles:", error);
      }
    }
  };

  // Cargar detalles con producto al montar si es edición
  useEffect(() => {
    if (isEdit && defaultValues?.id) {
      recargarDetalles();
    }
  }, [isEdit, defaultValues?.id]);

  // Estados para series de documentos
  const [seriesDoc, setSeriesDoc] = useState([]);

  useEffect(() => {
    // Si hay empresaFija, usarla; sino usar defaultValues.empresaId
    setEmpresaId(
      empresaFija
        ? Number(empresaFija)
        : defaultValues.empresaId
          ? Number(defaultValues.empresaId)
          : null,
    );
    setTipoDocumentoId(
      defaultValues.tipoDocumentoId
        ? Number(defaultValues.tipoDocumentoId)
        : null,
    );
    setConceptoMovAlmacenId(
      defaultValues.conceptoMovAlmacenId
        ? Number(defaultValues.conceptoMovAlmacenId)
        : null,
    );
    setSerieDocId(
      defaultValues.serieDocId ? Number(defaultValues.serieDocId) : null,
    );
    setNumSerieDoc(defaultValues.numSerieDoc || "");
    setNumCorreDoc(defaultValues.numCorreDoc || "");
    setNumeroDocumento(defaultValues.numeroDocumento || "");
    setFechaDocumento(
      defaultValues.fechaDocumento
        ? new Date(defaultValues.fechaDocumento)
        : new Date(),
    );
    setEntidadComercialId(
      defaultValues.entidadComercialId
        ? Number(defaultValues.entidadComercialId)
        : null,
    );
    setEsCustodia(
      defaultValues.esCustodia !== undefined ? defaultValues.esCustodia : false,
    );
    setObservaciones(defaultValues.observaciones || "");
    setEstadoDocAlmacenId(
      defaultValues.estadoDocAlmacenId
        ? Number(defaultValues.estadoDocAlmacenId)
        : null,
    );
    setDetalles(defaultValues.detalles || []);
  }, [defaultValues, empresaFija]);

  // Cargar esCustodia e información de almacenes automáticamente cuando cambie el concepto
  useEffect(() => {
    const cargarInfoAlmacenes = async () => {
      if (conceptoMovAlmacenId) {
        const concepto = conceptosMovAlmacen.find(
          (c) => Number(c.id) === Number(conceptoMovAlmacenId),
        );
        if (concepto) {
          setEsCustodia(concepto.esCustodia || false);
          setLlevaKardexOrigen(concepto.llevaKardexOrigen || false);
          setLlevaKardexDestino(concepto.llevaKardexDestino || false);

          // Obtener información del almacén origen
          if (concepto.almacenOrigenId) {
            try {
              const almacen = await getAlmacenById(concepto.almacenOrigenId);
              setAlmacenOrigenInfo({
                id: almacen.id,
                nombre: almacen.nombre,
                seLlevaKardex: almacen.seLlevaKardex,
              });
            } catch (err) {
              console.error("Error al cargar almacén origen:", err);
              setAlmacenOrigenInfo(null);
            }
          } else {
            setAlmacenOrigenInfo(null);
          }

          // Obtener información del almacén destino
          if (concepto.almacenDestinoId) {
            try {
              const almacen = await getAlmacenById(concepto.almacenDestinoId);
              setAlmacenDestinoInfo({
                id: almacen.id,
                nombre: almacen.nombre,
                seLlevaKardex: almacen.seLlevaKardex,
              });
            } catch (err) {
              console.error("Error al cargar almacén destino:", err);
              setAlmacenDestinoInfo(null);
            }
          } else {
            setAlmacenDestinoInfo(null);
          }
        }
      } else {
        setAlmacenOrigenInfo(null);
        setAlmacenDestinoInfo(null);
        setLlevaKardexOrigen(false);
        setLlevaKardexDestino(false);
      }
    };

    cargarInfoAlmacenes();
  }, [conceptoMovAlmacenId, conceptosMovAlmacen]);

  // Cargar series de documentos cuando cambien empresaId, tipoDocumentoId o conceptoMovAlmacenId
  useEffect(() => {
    const cargarSeriesDoc = async () => {
      if (empresaId && tipoDocumentoId && conceptoMovAlmacenId) {
        try {
          // Obtener el concepto para sacar el tipoAlmacenId
          const concepto = conceptosMovAlmacen.find(
            (c) => Number(c.id) === Number(conceptoMovAlmacenId),
          );

          if (concepto && concepto.tipoAlmacenId) {
            const series = await getSeriesDoc(
              empresaId,
              tipoDocumentoId,
              concepto.tipoAlmacenId,
            );
            setSeriesDoc(series);
          } else {
            setSeriesDoc([]);
          }
        } catch (err) {
          console.error("Error al cargar series de documentos:", err);
          setSeriesDoc([]);
        }
      } else {
        setSeriesDoc([]);
      }
    };
    cargarSeriesDoc();
  }, [empresaId, tipoDocumentoId, conceptoMovAlmacenId, conceptosMovAlmacen]);

  // Cargar direcciones origen según reglas de negocio
  useEffect(() => {
    async function cargarDireccionesOrigen() {
      try {
        if (conceptoMovAlmacenId && empresaId) {
          const concepto = conceptosMovAlmacen.find(
            (c) => Number(c.id) === Number(conceptoMovAlmacenId),
          );

          if (concepto) {
            const empresa = empresas.find(
              (e) => Number(e.id) === Number(empresaId),
            );
            const entidadEmpresaId = empresa?.entidadComercialId;

            if (entidadEmpresaId) {
              const direcciones = await getDireccionesEntidad();
              let direccionesFiltradas = [];

              if (concepto.llevaKardexOrigen) {
                // Solo direcciones de la empresa
                direccionesFiltradas = direcciones.filter(
                  (d) =>
                    Number(d.entidadComercialId) === Number(entidadEmpresaId),
                );
              } else {
                // Direcciones de la empresa + entidad comercial del movimiento
                const entidadesPermitidas = [entidadEmpresaId];
                if (entidadComercialId) {
                  entidadesPermitidas.push(entidadComercialId);
                }
                direccionesFiltradas = direcciones.filter((d) =>
                  entidadesPermitidas.includes(Number(d.entidadComercialId)),
                );
              }

              setDireccionesOrigen(direccionesFiltradas);
            } else {
              setDireccionesOrigen([]);
            }
          }
        } else {
          setDireccionesOrigen([]);
        }
      } catch (err) {
        console.error("Error al cargar direcciones origen:", err);
        setDireccionesOrigen([]);
      }
    }
    cargarDireccionesOrigen();
  }, [
    conceptoMovAlmacenId,
    empresaId,
    entidadComercialId,
    conceptosMovAlmacen,
    empresas,
  ]);

  // Cargar direcciones destino según reglas de negocio
  useEffect(() => {
    async function cargarDireccionesDestino() {
      try {
        if (conceptoMovAlmacenId && empresaId) {
          const concepto = conceptosMovAlmacen.find(
            (c) => Number(c.id) === Number(conceptoMovAlmacenId),
          );

          if (concepto) {
            const empresa = empresas.find(
              (e) => Number(e.id) === Number(empresaId),
            );
            const entidadEmpresaId = empresa?.entidadComercialId;

            if (entidadEmpresaId) {
              const direcciones = await getDireccionesEntidad();
              let direccionesFiltradas = [];

              if (concepto.llevaKardexDestino) {
                // Solo direcciones de la empresa
                direccionesFiltradas = direcciones.filter(
                  (d) =>
                    Number(d.entidadComercialId) === Number(entidadEmpresaId),
                );
              } else {
                // Direcciones de la empresa + entidad comercial del movimiento
                const entidadesPermitidas = [entidadEmpresaId];
                if (entidadComercialId) {
                  entidadesPermitidas.push(entidadComercialId);
                }
                direccionesFiltradas = direcciones.filter((d) =>
                  entidadesPermitidas.includes(Number(d.entidadComercialId)),
                );
              }

              setDireccionesDestino(direccionesFiltradas);
            } else {
              setDireccionesDestino([]);
            }
          }
        } else {
          setDireccionesDestino([]);
        }
      } catch (err) {
        console.error("Error al cargar direcciones destino:", err);
        setDireccionesDestino([]);
      }
    }
    cargarDireccionesDestino();
  }, [
    conceptoMovAlmacenId,
    empresaId,
    entidadComercialId,
    conceptosMovAlmacen,
    empresas,
  ]);

  // Filtrar entidades comerciales por empresaId
  useEffect(() => {
    if (entidadesComerciales && entidadesComerciales.length > 0 && empresaId) {
      const entidadesPorEmpresa = entidadesComerciales.filter(
        (e) => Number(e.empresaId) === Number(empresaId),
      );
      setEntidadesFiltradas(entidadesPorEmpresa);
    } else {
      setEntidadesFiltradas([]);
    }
  }, [entidadesComerciales, empresaId]);

  // Filtrar transportistas: tipoEntidadId=11 + entidadComercialId seleccionada
  useEffect(() => {
    if (entidadesComerciales && entidadesComerciales.length > 0) {
      const transportistasFiltrados = entidadesComerciales.filter(
        (e) => Number(e.tipoEntidadId) === 11,
      );

      // Agregar la entidad comercial seleccionada si existe
      if (entidadComercialId) {
        const entidadSeleccionada = entidadesComerciales.find(
          (e) => Number(e.id) === Number(entidadComercialId),
        );
        if (
          entidadSeleccionada &&
          !transportistasFiltrados.find(
            (t) => Number(t.id) === Number(entidadSeleccionada.id),
          )
        ) {
          transportistasFiltrados.push(entidadSeleccionada);
        }
      }

      setTransportistasFiltrados(transportistasFiltrados);
    } else {
      setTransportistasFiltrados([]);
    }
  }, [entidadesComerciales, entidadComercialId]);

  // Filtrar agencias: tipoEntidadId=7 + entidadComercialId seleccionada
  useEffect(() => {
    if (entidadesComerciales && entidadesComerciales.length > 0) {
      const agenciasFiltradas = entidadesComerciales.filter(
        (e) => Number(e.tipoEntidadId) === 7,
      );

      // Agregar la entidad comercial seleccionada si existe
      if (entidadComercialId) {
        const entidadSeleccionada = entidadesComerciales.find(
          (e) => Number(e.id) === Number(entidadComercialId),
        );
        if (
          entidadSeleccionada &&
          !agenciasFiltradas.find(
            (a) => Number(a.id) === Number(entidadSeleccionada.id),
          )
        ) {
          agenciasFiltradas.push(entidadSeleccionada);
        }
      }

      setAgenciasFiltradas(agenciasFiltradas);
    } else {
      setAgenciasFiltradas([]);
    }
  }, [entidadesComerciales, entidadComercialId]);

  // Cargar vehículos filtrados por transportistaId
  useEffect(() => {
    async function cargarVehiculos() {
      try {
        if (transportistaId) {
          const vehiculos = await getVehiculosEntidad();
          const vehiculosFiltrados = vehiculos.filter(
            (v) => Number(v.entidadComercialId) === Number(transportistaId),
          );
          setVehiculosFiltrados(vehiculosFiltrados);
        } else {
          setVehiculosFiltrados([]);
          setVehiculoId(null); // Limpiar selección
        }
      } catch (err) {
        console.error("Error al cargar vehículos:", err);
        setVehiculosFiltrados([]);
      }
    }
    cargarVehiculos();
  }, [transportistaId]);

  // Cargar direcciones de agencia filtradas por agenciaEnvioId
  useEffect(() => {
    async function cargarDireccionesAgencia() {
      try {
        if (agenciaEnvioId) {
          const direcciones = await getDireccionesEntidad();
          const direccionesFiltradas = direcciones.filter(
            (d) => Number(d.entidadComercialId) === Number(agenciaEnvioId),
          );
          setDireccionesAgencia(direccionesFiltradas);
        } else {
          setDireccionesAgencia([]);
          setDirAgenciaEnvioId(null); // Limpiar selección
        }
      } catch (err) {
        console.error("Error al cargar direcciones de agencia:", err);
        setDireccionesAgencia([]);
      }
    }
    cargarDireccionesAgencia();
  }, [agenciaEnvioId]);

  // Cargar estados de documento al montar
  useEffect(() => {
    async function cargarEstados() {
      try {
        const estados = await getEstadosMultiFuncion();

        // Filtrar estados para Inventarios (tipoProvieneDeId = 9)
        // Estados: 30=Pendiente, 31=Cerrado, 32=Anulado
        const estadosFiltrados = estados.filter(
          (e) => Number(e.tipoProvieneDeId) === 9 && !e.cesado,
        );
        setEstadosDocumento(estadosFiltrados);

        // Si no hay estado asignado, asignar estado "Pendiente" (id=30) por defecto
        if (!estadoDocAlmacenId && estadosFiltrados.length > 0) {
          const estadoPendiente = estadosFiltrados.find(
            (e) => Number(e.id) === 30,
          );
          if (estadoPendiente) {
            setEstadoDocAlmacenId(Number(estadoPendiente.id));
          }
        }
      } catch (err) {
        console.error("Error al cargar estados:", err);
      }
    }
    cargarEstados();
  }, [isEdit]);

  // Asignar personalRespAlmacen desde ParametroAprobador
  useEffect(() => {
    async function cargarPersonalResponsable() {
      try {
        if (empresaId) {
          const parametros = await getParametrosAprobador();
          // Filtrar por empresaId, moduloSistemaId=6 (Inventarios) y cesado=false
          const parametroInventario = parametros.find(
            (p) =>
              Number(p.empresaId) === Number(empresaId) &&
              Number(p.moduloSistemaId) === 6 &&
              p.cesado === false,
          );
          if (parametroInventario && parametroInventario.personalRespId) {
            setPersonalRespAlmacen(Number(parametroInventario.personalRespId));
          }
        }
      } catch (err) {
        console.error("Error al cargar personal responsable:", err);
      }
    }
    cargarPersonalResponsable();
  }, [empresaId]);

  // Mostrar información de referencia cuando se seleccione una serie
  // El número real se generará al guardar
  const handleSerieDocChange = (serieId) => {
    setSerieDocId(serieId);

    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        // Mostrar formato de referencia (no el número real)
        const proximoCorrelativo = Number(serie.correlativo) + 1;
        const numSerie = String(serie.serie).padStart(
          serie.numCerosIzqSerie,
          "0",
        );

        setNumSerieDoc(numSerie);
        setNumCorreDoc(`Próximo: ${proximoCorrelativo}`);
        setNumeroDocumento("Se generará al guardar");
      }
    } else {
      setNumSerieDoc("");
      setNumCorreDoc("");
      setNumeroDocumento("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Normalizar fechaDocumento a medianoche (00:00:00) para guardar solo la fecha
    const fechaNormalizada = fechaDocumento ? new Date(fechaDocumento) : null;
    if (fechaNormalizada) {
      fechaNormalizada.setHours(0, 0, 0, 0);
    }

    onSubmit({
      empresaId: empresaId ? Number(empresaId) : null,
      tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
      conceptoMovAlmacenId: conceptoMovAlmacenId
        ? Number(conceptoMovAlmacenId)
        : null,
      serieDocId: serieDocId ? Number(serieDocId) : null,
      numSerieDoc,
      numCorreDoc,
      numeroDocumento,
      fechaDocumento: fechaNormalizada,
      entidadComercialId: entidadComercialId
        ? Number(entidadComercialId)
        : null,
      faenaPescaId: faenaPescaId ? Number(faenaPescaId) : null,
      embarcacionId: embarcacionId ? Number(embarcacionId) : null,
      ordenTrabajoId: ordenTrabajoId ? Number(ordenTrabajoId) : null,
      dirOrigenId: dirOrigenId ? Number(dirOrigenId) : null,
      dirDestinoId: dirDestinoId ? Number(dirDestinoId) : null,
      numGuiaSunat,
      fechaGuiaSunat,
      transportistaId: transportistaId ? Number(transportistaId) : null,
      vehiculoId: vehiculoId ? Number(vehiculoId) : null,
      agenciaEnvioId: agenciaEnvioId ? Number(agenciaEnvioId) : null,
      dirAgenciaEnvioId: dirAgenciaEnvioId ? Number(dirAgenciaEnvioId) : null,
      personalRespAlmacen: personalRespAlmacen
        ? Number(personalRespAlmacen)
        : null,
      ordenCompraId: ordenCompraId ? Number(ordenCompraId) : null,
      pedidoVentaId: pedidoVentaId ? Number(pedidoVentaId) : null,
      estadoDocAlmacenId: estadoDocAlmacenId
        ? Number(estadoDocAlmacenId)
        : null,
      esCustodia,
      observaciones,
      unidadNegocioId: unidadNegocioId ? Number(unidadNegocioId) : null,
      detalles,
    });
  };

  // Normalizar opciones para dropdowns
  const empresasOptions = empresas.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id),
  }));

  // Filtrar solo tipos de documento para Almacén (esParaAlmacen = true)
  const tiposDocumentoOptions = tiposDocumento
    .filter((t) => t.esParaAlmacen === true)
    .map((t) => ({
      ...t,
      id: Number(t.id),
      label: t.descripcion, // TipoDocumento usa 'descripcion' no 'nombre'
      value: Number(t.id),
    }));

  const entidadesOptions = entidadesFiltradas.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const conceptosMovAlmacenOptions = conceptosMovAlmacen.map((c) => ({
    ...c,
    id: Number(c.id),
    label: c.descripcionArmada, // ConceptoMovAlmacen usa 'descripcionArmada'
    value: Number(c.id),
  }));

  const seriesDocOptions = seriesDoc.map((s) => ({
    ...s,
    id: Number(s.id),
    label: `${s.serie} (Correlativo: ${s.correlativo})`,
    value: Number(s.id),
  }));

  const unidadesNegocioOptions = unidadesNegocio.map((unidad) => ({
    label: unidad.nombre,
    value: Number(unidad.id),
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      {/* TABVIEW PRINCIPAL */}
      <TabView>
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales">
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <label htmlFor="empresaId">Empresa*</label>
              <Dropdown
                id="empresaId"
                value={empresaId ? Number(empresaId) : null}
                options={empresasOptions}
                onChange={(e) => setEmpresaId(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar empresa"
                disabled={
                  readOnly ||
                  loading ||
                  !!empresaFija ||
                  isEdit ||
                  detalles.length > 0
                }
                required
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 1.25 }}>
              <label htmlFor="fechaDocumento">Fecha Documento*</label>
              <Calendar
                id="fechaDocumento"
                value={fechaDocumento}
                onChange={(e) => setFechaDocumento(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                required
                disabled={readOnly || loading}
                inputStyle={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tipoDocumentoId">Tipo de Documento*</label>
              <Dropdown
                id="tipoDocumentoId"
                value={tipoDocumentoId ? Number(tipoDocumentoId) : null}
                options={tiposDocumentoOptions}
                onChange={(e) => setTipoDocumentoId(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo"
                disabled={readOnly || loading || detalles.length > 0}
                required
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="serieDocId">Serie Documento*</label>
              <Dropdown
                id="serieDocId"
                value={serieDocId ? Number(serieDocId) : null}
                options={seriesDocOptions}
                onChange={(e) => handleSerieDocChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar serie"
                disabled={
                  loading ||
                  !tipoDocumentoId ||
                  !conceptoMovAlmacenId ||
                  !!serieDocId
                }
                required
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="numSerieDoc">N° Serie</label>
              <InputText
                id="numSerieDoc"
                value={numSerieDoc}
                disabled
                maxLength={40}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  backgroundColor: "#f0f0f0",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numCorreDoc">N° Correlativo</label>
              <InputText
                id="numCorreDoc"
                value={numCorreDoc}
                disabled
                maxLength={40}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  backgroundColor: "#f0f0f0",
                }}
              />
            </div>
            <div style={{ flex: 1.5 }}>
              <label htmlFor="numeroDocumento">Número de Documento</label>
              <InputText
                id="numeroDocumento"
                value={numeroDocumento}
                disabled
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  backgroundColor: "#f0f0f0",
                }}
              />
            </div>
            <div style={{ flex: 1.5 }}>
              <label htmlFor="estadoDocAlmacenId">Estado Documento*</label>
              <Dropdown
                id="estadoDocAlmacenId"
                value={estadoDocAlmacenId ? Number(estadoDocAlmacenId) : null}
                options={estadosDocumento.map((e) => ({
                  label: e.descripcion,
                  value: Number(e.id),
                }))}
                onChange={(e) => setEstadoDocAlmacenId(e.value)}
                placeholder="Seleccionar estado"
                disabled={loading || isEdit}
                filter
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  backgroundColor:
                    estadoDocAlmacenId === 30
                      ? "#f97316"
                      : estadoDocAlmacenId === 31
                        ? "#22c55e"
                        : estadoDocAlmacenId === 32
                          ? "#ef4444"
                          : "#ffffff",
                  color:
                    estadoDocAlmacenId === 30
                      ? "#ffffff"
                      : estadoDocAlmacenId === 31
                        ? "#ffffff"
                        : estadoDocAlmacenId === 32
                          ? "#ffffff"
                          : "#000000",
                }}
              />
            </div>
          </div>
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              marginTop: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1.5 }}>
              <label htmlFor="unidadNegocioId">Unidad de Negocio*</label>
              <Dropdown
                id="unidadNegocioId"
                value={unidadNegocioId ? Number(unidadNegocioId) : null}
                options={unidadesNegocioOptions}
                onChange={(e) => setUnidadNegocioId(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar unidad de negocio"
                filter
                showClear
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
                disabled={readOnly || loading}
              />
            </div>
            <div style={{ flex: 4 }}>
              <label htmlFor="conceptoMovAlmacenId">Concepto Movimiento*</label>
              <Dropdown
                id="conceptoMovAlmacenId"
                value={
                  conceptoMovAlmacenId ? Number(conceptoMovAlmacenId) : null
                }
                options={conceptosMovAlmacenOptions}
                onChange={(e) => setConceptoMovAlmacenId(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar concepto"
                disabled={readOnly || loading || detalles.length > 0}
                required
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="esCustodia">Mercaderia</label>
              <Button
                type="button"
                id="esCustodia"
                label={esCustodia ? "CUSTODIA" : "PROPIA"}
                className={esCustodia ? "p-button-danger" : "p-button-success"}
                style={{
                  fontWeight: "bold",
                  width: "100%",
                  cursor: "not-allowed",
                }}
              />
            </div>
            {(ordenCompraId || pedidoVentaId) && (
              <>
                {ordenCompraId && (
                  <div style={{ flex: 0.5 }}>
                    <label htmlFor="ordenCompra">O/C (Origen)</label>
                    <Button
                      type="button"
                      id="ordenCompra"
                      label={`ID: ${ordenCompraId}`}
                      icon="pi pi-shopping-cart"
                      severity="info"
                      onClick={() =>
                        onIrAOrdenCompra && onIrAOrdenCompra(ordenCompraId)
                      }
                      outlined
                      style={{
                        width: "100%",
                        fontWeight: "bold",
                        justifyContent: "center",
                      }}
                    />
                  </div>
                )}
                {pedidoVentaId && (
                  <div style={{ flex: 0.5 }}>
                    <label htmlFor="preFactura">PreFactura (Destino)</label>
                    <Button
                      type="button"
                      id="preFactura"
                      label={`ID: ${pedidoVentaId}`}
                      icon="pi pi-file-edit"
                      severity="success"
                      onClick={() =>
                        onIrAPreFactura && onIrAPreFactura(pedidoVentaId)
                      }
                      outlined
                      style={{
                        width: "100%",
                        fontWeight: "bold",
                        justifyContent: "center",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Información de Almacenes del Concepto */}
          {((almacenOrigenInfo && almacenOrigenInfo.nombre) ||
            (almacenDestinoInfo && almacenDestinoInfo.nombre)) && (
            <div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginTop: 10,
                }}
              >
                {almacenOrigenInfo && almacenOrigenInfo.nombre && (
                  <div style={{ flex: 4 }}>
                    <label style={{ fontWeight: "bold", color: "#1976d2" }}>
                      Almacen Origen
                    </label>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <InputText
                        value={almacenOrigenInfo.nombre}
                        disabled
                        style={{
                          backgroundColor: "#e3f2fd",
                          fontWeight: "bold",
                          color: "#0d47a1",
                          textTransform: "uppercase",
                          flex: 1,
                        }}
                      />
                    </div>
                  </div>
                )}
                {almacenOrigenInfo && almacenOrigenInfo.nombre && (
                  <div style={{ flex: 0.5 }}>
                    <label>Kardex</label>
                    <Button
                      type="button"
                      label={llevaKardexOrigen ? "SI" : "NO"}
                      className={
                        llevaKardexOrigen
                          ? "p-button-success"
                          : "p-button-secondary"
                      }
                      disabled
                      style={{ fontWeight: "bold" }}
                    />
                  </div>
                )}
                {almacenDestinoInfo && almacenDestinoInfo.nombre && (
                  <div style={{ flex: 4 }}>
                    <label style={{ fontWeight: "bold", color: "#388e3c" }}>
                      Almacen Destino
                    </label>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <InputText
                        value={almacenDestinoInfo.nombre}
                        disabled
                        style={{
                          backgroundColor: "#e8f5e9",
                          fontWeight: "bold",
                          color: "#1b5e20",
                          textTransform: "uppercase",
                          flex: 1,
                        }}
                      />
                    </div>
                  </div>
                )}
                {almacenDestinoInfo && almacenDestinoInfo.nombre && (
                  <div style={{ flex: 0.5 }}>
                    <label>Kardex</label>
                    <Button
                      type="button"
                      label={llevaKardexDestino ? "SI" : "NO"}
                      className={
                        llevaKardexDestino
                          ? "p-button-success"
                          : "p-button-secondary"
                      }
                      disabled
                      style={{
                        fontWeight: "bold",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              marginTop: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="entidadComercialId">Entidad Comercial</label>
              <Dropdown
                id="entidadComercialId"
                value={entidadComercialId ? Number(entidadComercialId) : null}
                options={entidadesOptions}
                onChange={(e) => setEntidadComercialId(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar entidad"
                disabled={loading || detalles.length > 0}
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="dirOrigenId">Dirección Origen</label>
              <Dropdown
                id="dirOrigenId"
                value={dirOrigenId ? Number(dirOrigenId) : null}
                options={(direccionesOrigen || []).map((d) => ({
                  label:
                    d.direccionArmada ||
                    d.direccion ||
                    d.descripcion ||
                    "Sin dirección",
                  value: Number(d.id),
                }))}
                onChange={(e) => setDirOrigenId(e.value)}
                placeholder="Seleccionar dirección origen"
                disabled={
                  loading ||
                  !direccionesOrigen ||
                  direccionesOrigen.length === 0
                }
                showClear
                filter
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="dirDestinoId">Dirección Destino</label>
              <Dropdown
                id="dirDestinoId"
                value={dirDestinoId ? Number(dirDestinoId) : null}
                options={(direccionesDestino || []).map((d) => ({
                  label:
                    d.direccionArmada ||
                    d.direccion ||
                    d.descripcion ||
                    "Sin dirección",
                  value: Number(d.id),
                }))}
                onChange={(e) => setDirDestinoId(e.value)}
                placeholder="Seleccionar dirección destino"
                disabled={
                  loading ||
                  !direccionesDestino ||
                  direccionesDestino.length === 0
                }
                showClear
                filter
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>
          </div>

          {/* Sección de Detalles del Movimiento */}
          <Panel header="Detalles del Movimiento" toggleable className="p-mt-3">
            <div className="p-mb-3">
              {!isEdit && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "4px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <i
                    className="pi pi-info-circle"
                    style={{ color: "#856404" }}
                  ></i>
                  <span style={{ color: "#856404", fontSize: "0.9em" }}>
                    <strong>Importante:</strong> Primero debes guardar el
                    movimiento para poder agregar detalles.
                  </span>
                </div>
              )}
              <Button
                label="Agregar Detalle"
                icon="pi pi-plus"
                className="p-button-success p-button-sm"
                onClick={() => {
                  setEditingDetalle(null);
                  setShowDetalleDialog(true);
                }}
                disabled={
                  loading ||
                  !isEdit ||
                  (!permisos.puedeCrear && !permisos.puedeEditar)
                }
                type="button"
                tooltip={
                  !isEdit
                    ? "Primero debes guardar el movimiento"
                    : !permisos.puedeCrear && !permisos.puedeEditar
                      ? "No tiene permisos para agregar detalles"
                      : ""
                }
                tooltipOptions={{ position: "top" }}
              />
            </div>
            <DetalleMovimientoList
              detalles={detalles}
              productos={productos}
              readOnly={documentoCerrado || !permisos.puedeEditar}
              onEdit={(detalle) => {
                setEditingDetalle(detalle);
                setShowDetalleDialog(true);
              }}
              onVerKardex={(detalle) => {
                setDetalleKardex(detalle);
                setShowKardexDialog(true);
              }}
              permisos={permisos}
              onSave={(detalleData) => {
                if (editingDetalle) {
                  setDetalles(
                    detalles.map((d) =>
                      d === editingDetalle
                        ? { ...editingDetalle, ...detalleData }
                        : d,
                    ),
                  );
                } else {
                  setDetalles([
                    ...detalles,
                    { ...detalleData, tempId: Date.now() },
                  ]);
                }
                setShowDetalleDialog(false);
                setEditingDetalle(null);
              }}
              onDelete={async (detalle) => {
                confirmDialog({
                  message: "¿Está seguro que desea eliminar este detalle?",
                  header: "Confirmar eliminación",
                  icon: "pi pi-exclamation-triangle",
                  acceptClassName: "p-button-danger",
                  accept: async () => {
                    if (
                      defaultValues?.id &&
                      detalle?.id &&
                      !isNaN(Number(detalle.id))
                    ) {
                      try {
                        const { eliminarDetalleMovimiento } =
                          await import("../../api/movimientoAlmacen");
                        await eliminarDetalleMovimiento(Number(detalle.id));
                        await recargarDetalles();
                      } catch (error) {
                        console.error("Error al eliminar detalle:", error);
                      }
                    } else {
                      setDetalles(detalles.filter((d) => d !== detalle));
                    }
                  },
                });
              }}
            />
          </Panel>

          {/* Sección de Información Adicional */}
          <Panel
            header="Información Adicional"
            toggleable
            collapsed
            className="p-mt-3"
          >
            {/* Información de Direcciones */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            ></div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            ></div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="numGuiaSunat">Número Guía SUNAT</label>
                <InputText
                  id="numGuiaSunat"
                  value={numGuiaSunat}
                  onChange={(e) =>
                    setNumGuiaSunat(e.target.value.toUpperCase())
                  }
                  disabled={loading}
                  maxLength={40}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaGuiaSunat">Fecha Guía SUNAT</label>
                <Calendar
                  id="fechaGuiaSunat"
                  value={fechaGuiaSunat}
                  onChange={(e) => setFechaGuiaSunat(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading}
                  inputStyle={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
              </div>
              <div style={{ flex: 3 }}>
                <label htmlFor="observaciones">Observaciones</label>
                <InputText
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) =>
                    setObservaciones(e.target.value.toUpperCase())
                  }
                  disabled={loading}
                  rows={1}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              </div>
            </div>

            {/* Campos generados automáticamente - Solo lectura */}
            {(faenaPescaId || embarcacionId || ordenTrabajoId) && (
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  marginTop: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                {faenaPescaId && (
                  <div style={{ flex: 1 }}>
                    <label htmlFor="faenaPescaId">Faena Pesca (Generado)</label>
                    <InputText
                      id="faenaPescaId"
                      value={`ID: ${faenaPescaId}`}
                      disabled
                      style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                    />
                  </div>
                )}
                {embarcacionId && (
                  <div style={{ flex: 1 }}>
                    <label htmlFor="embarcacionId">
                      Embarcación (Generado)
                    </label>
                    <InputText
                      id="embarcacionId"
                      value={`ID: ${embarcacionId}`}
                      disabled
                      style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                    />
                  </div>
                )}
                {ordenTrabajoId && (
                  <div style={{ flex: 1 }}>
                    <label htmlFor="ordenTrabajoId">
                      Orden Trabajo (Generado)
                    </label>
                    <InputText
                      id="ordenTrabajoId"
                      value={`ID: ${ordenTrabajoId}`}
                      disabled
                      style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Información de Transporte */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="transportistaId">Transportista</label>
                <Dropdown
                  id="transportistaId"
                  value={transportistaId ? Number(transportistaId) : null}
                  options={(transportistasFiltrados || []).map((t) => ({
                    label: t.razonSocial || t.nombre,
                    value: Number(t.id),
                  }))}
                  onChange={(e) => setTransportistaId(e.value)}
                  placeholder="Seleccionar transportista"
                  disabled={loading}
                  showClear
                  filter
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="vehiculoId">Vehículo</label>
                <Dropdown
                  id="vehiculoId"
                  value={vehiculoId ? Number(vehiculoId) : null}
                  options={(vehiculosFiltrados || []).map((v) => ({
                    label: `${v.placa || ""} - ${v.marca || ""} ${
                      v.modelo || ""
                    }`,
                    value: Number(v.id),
                  }))}
                  onChange={(e) => setVehiculoId(e.value)}
                  placeholder={
                    transportistaId
                      ? "Seleccionar vehículo"
                      : "Seleccione primero un transportista"
                  }
                  disabled={
                    loading ||
                    !transportistaId ||
                    !vehiculosFiltrados ||
                    vehiculosFiltrados.length === 0
                  }
                  showClear
                  filter
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              </div>
            </div>

            {/* Información de Agencia de Envío */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="agenciaEnvioId">Agencia de Envío</label>
                <Dropdown
                  id="agenciaEnvioId"
                  value={agenciaEnvioId ? Number(agenciaEnvioId) : null}
                  options={(agenciasFiltradas || []).map((a) => ({
                    label: a.razonSocial || a.nombre,
                    value: Number(a.id),
                  }))}
                  onChange={(e) => setAgenciaEnvioId(e.value)}
                  placeholder="Seleccionar agencia"
                  disabled={loading}
                  showClear
                  filter
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="dirAgenciaEnvioId">Dirección Agencia</label>
                <Dropdown
                  id="dirAgenciaEnvioId"
                  value={dirAgenciaEnvioId ? Number(dirAgenciaEnvioId) : null}
                  options={(direccionesAgencia || []).map((d) => ({
                    label:
                      d.direccionArmada ||
                      d.direccion ||
                      d.descripcion ||
                      "Sin dirección",
                    value: Number(d.id),
                  }))}
                  onChange={(e) => setDirAgenciaEnvioId(e.value)}
                  placeholder={
                    agenciaEnvioId
                      ? "Seleccionar dirección agencia"
                      : "Seleccione primero una agencia"
                  }
                  disabled={
                    loading ||
                    !agenciaEnvioId ||
                    !direccionesAgencia ||
                    direccionesAgencia.length === 0
                  }
                  showClear
                  filter
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              </div>
            </div>

            {/* Información de Responsable */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="personalRespAlmacen">
                  Responsable Almacén*
                </label>
                <Dropdown
                  id="personalRespAlmacen"
                  value={
                    personalRespAlmacen ? Number(personalRespAlmacen) : null
                  }
                  options={personalOptions.map((p) => ({
                    label: p.nombreCompleto || p.nombre,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setPersonalRespAlmacen(e.value)}
                  placeholder="Responsable asignado automáticamente"
                  disabled={true}
                  filter
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
                <small style={{ color: "#888", marginTop: 4 }}>
                  Asignado automáticamente desde Parámetros de Aprobador (Solo
                  lectura)
                </small>
              </div>
            </div>

            {/* Información de Estado y Órdenes Generadas */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            ></div>
          </Panel>

          {/* Diálogo para agregar/editar detalle */}
          <DetalleMovimientoForm
            visible={showDetalleDialog}
            onHide={() => {
              setShowDetalleDialog(false);
              setEditingDetalle(null);
            }}
            detalle={editingDetalle}
            movimientoAlmacen={{
              id: defaultValues.id,
              empresaId,
              entidadComercialId,
              esCustodia,
              fechaDocumento,
              empresa: empresas.find((e) => Number(e.id) === Number(empresaId)),
              conceptoMovAlmacen: conceptosMovAlmacen.find(
                (c) => Number(c.id) === Number(conceptoMovAlmacenId),
              ),
            }}
            estadosMercaderia={estadosMercaderia}
            estadosCalidad={estadosCalidad}
            readOnly={documentoCerrado || readOnly || !permisos.puedeEditar}
            onSave={async (detalleData) => {
              if (defaultValues?.id) {
                await recargarDetalles();
              } else {
                if (editingDetalle) {
                  setDetalles(
                    detalles.map((d) =>
                      d === editingDetalle
                        ? { ...editingDetalle, ...detalleData }
                        : d,
                    ),
                  );
                } else {
                  setDetalles([
                    ...detalles,
                    { ...detalleData, tempId: Date.now() },
                  ]);
                }
              }
              setShowDetalleDialog(false);
              setEditingDetalle(null);
            }}
            loading={loading}
          />

          <ConfirmDialog />
        </TabPanel>

        {/* TAB 2: PDF SIN COSTOS */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="PDF sin Costos">
            <VerImpresionMovimientoPDF
              movimientoId={defaultValues?.id}
              datosMovimiento={defaultValues}
              toast={toast}
              personalOptions={personalOptions}
              onPdfGenerated={(urlPdf) => {
                if (defaultValues) {
                  defaultValues.urlMovAlmacenPdf = urlPdf;
                }
              }}
            />
          </TabPanel>
        )}

        {/* TAB 3: PDF CON COSTOS */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="PDF con Costos">
            <VerImpresionMovimientoConCostosPDF
              movimientoId={defaultValues?.id}
              datosMovimiento={defaultValues}
              toast={toast}
              personalOptions={personalOptions}
              onPdfGenerated={(urlPdf) => {
                if (defaultValues) {
                  defaultValues.urlMovAlmacenConCostosPdf = urlPdf;
                }
              }}
            />
          </TabPanel>
        )}

        {/* TAB 4: ENTREGAS A RENDIR */}
        <TabPanel
          header={`Entregas a Rendir ${
            entregasCount > 0 ? `(${entregasCount})` : ""
          }`}
          leftIcon="pi pi-money-bill"
          disabled={!isEdit}
        >
          <EntregaARendirMovAlmacenCard
            movimientoAlmacen={defaultValues}
            personal={personalOptions}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            puedeEditar={!documentoCerrado && permisos.puedeEditar}
            onCountChange={setEntregasCount}
            permisos={permisos}
            readOnly={readOnly}
          />
        </TabPanel>
      </TabView>

      {/* BOTONES DE ACCIÓN */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "1rem",
          justifyContent: "flex-end",
        }}
      >
        {/* Botón Cerrar Documento - Solo en edición y si está pendiente */}
        {isEdit && defaultValues?.id && !documentoCerrado && (
          <Button
            type="button"
            label="Cerrar Documento"
            icon="pi pi-lock"
            onClick={() => onCerrar && onCerrar(defaultValues.id)}
            disabled={loading || readOnly || !permisos.puedeEditar}
            className="p-button-success"
            severity="success"
            raised
            size="small"
            outlined
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !permisos.puedeEditar
                  ? "No tiene permisos para cerrar documentos (requiere permiso de Editar)"
                  : "Cerrar el documento (no se podrá editar)"
            }
            tooltipOptions={{ position: "top" }}
          />
        )}

        {/* Botón Anular Documento - Solo en edición y si está cerrado */}
        {isEdit && defaultValues?.id && documentoCerrado && (
          <Button
            type="button"
            label="Anular Documento"
            icon="pi pi-times-circle"
            onClick={() =>
              onAnular && onAnular(defaultValues.id, defaultValues.empresaId)
            }
            disabled={loading || readOnly || !permisos.puedeEliminar}
            className="p-button-danger"
            severity="danger"
            raised
            size="small"
            outlined
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !permisos.puedeEliminar
                  ? "No tiene permisos para anular documentos (requiere permiso de Eliminar)"
                  : "Anular el documento y revertir kardex"
            }
            tooltipOptions={{ position: "top" }}
          />
        )}

        {/* Botón Reactivar Documento - Siempre visible, disabled si está PENDIENTE o no tiene permiso */}
        {isEdit && defaultValues?.id && (
          <Button
            type="button"
            label="Reactivar Documento"
            icon="pi pi-replay"
            onClick={() => onReactivar && onReactivar(defaultValues.id)}
            disabled={
              loading || !documentoCerrado || !permisos.puedeReactivarDocs
            }
            className="p-button-warning"
            severity="warning"
            raised
            size="small"
            outlined
            tooltip={
              !permisos.puedeReactivarDocs
                ? "No tiene permisos para reactivar documentos"
                : !documentoCerrado
                  ? "El documento debe estar cerrado para poder reactivarlo"
                  : "Reactivar el documento para permitir edición"
            }
            tooltipOptions={{ position: "top" }}
          />
        )}

        {/* Botón Generar Kardex - Siempre visible, disabled solo si está PENDIENTE */}
        {isEdit && defaultValues?.id && (
          <Button
            type="button"
            label="Generar Kardex"
            icon="pi pi-chart-line"
            onClick={() => onGenerarKardex && onGenerarKardex(defaultValues.id)}
            disabled={loading || !documentoCerrado || !permisos.puedeCrear}
            className="p-button-info"
            severity="info"
            raised
            size="small"
            outlined
            tooltip={
              !permisos.puedeCrear
                ? "No tiene permisos para generar kardex (requiere permiso de Crear)"
                : !documentoCerrado
                  ? "Debe cerrar el documento antes de generar kardex"
                  : "Generar registros de kardex"
            }
            tooltipOptions={{ position: "top" }}
          />
        )}
        <Button
          type="button"
          label="Cancelar"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
          outlined
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          disabled={
            readOnly || (isEdit ? !permisos.puedeEditar : !permisos.puedeCrear)
          }
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
          tooltip={
            readOnly
              ? "Modo solo lectura"
              : isEdit
                ? !permisos.puedeEditar
                  ? "No tiene permisos para editar"
                  : ""
                : !permisos.puedeCrear
                  ? "No tiene permisos para crear"
                  : ""
          }
        />
      </div>

      {/* Diálogo de Kardex de Producto */}
      <KardexProductoDialog
        visible={showKardexDialog}
        onHide={() => setShowKardexDialog(false)}
        empresaId={defaultValues.empresaId}
        almacenId={(() => {
          // Construir lista de almacenes según flags llevaKardex del concepto (WMS estándar)
          const almacenes = [];
          const concepto = defaultValues.conceptoMovAlmacen;

          if (concepto?.llevaKardexOrigen && concepto?.almacenOrigenId) {
            almacenes.push(concepto.almacenOrigenId);
          }
          if (concepto?.llevaKardexDestino && concepto?.almacenDestinoId) {
            almacenes.push(concepto.almacenDestinoId);
          }

          // Retornar como string separado por comas para el backend
          return almacenes.length > 0 ? almacenes.join(",") : null;
        })()}
        productoId={detalleKardex?.productoId}
        esCustodia={defaultValues.esCustodia}
        clienteId={
          defaultValues.esCustodia
            ? defaultValues.entidadComercialId // Custodia: cliente del movimiento
            : null // Propia: NO filtrar por cliente
        }
        productoNombre={
          detalleKardex?.producto?.descripcionArmada || "Producto"
        }
      />
    </form>
  );
}
