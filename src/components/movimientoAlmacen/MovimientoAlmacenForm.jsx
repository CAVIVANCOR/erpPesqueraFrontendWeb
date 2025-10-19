// src/components/movimientoAlmacen/MovimientoAlmacenForm.jsx
// Formulario modular para MovimientoAlmacen con cabecera y CRUD de detalles
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import ProcessProgressDialog from "../../shared/ProcessProgressDialog";
import DetalleMovimientoList from "./DetalleMovimientoList";
import DetalleMovimientoForm from "./DetalleMovimientoForm";
import KardexProductoDialog from "./KardexProductoDialog";
import { generarPDFMovimientoAlmacen, generarPDFMovimientoAlmacenConCostos } from "./MovimientoAlmacenPDF";
import { getSeriesDoc, getMovimientoAlmacenPorId } from "../../api/movimientoAlmacen";
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
  onSubmit,
  onCancel,
  onCerrar,
  onAnular,
  loading,
  toast, // Toast ref pasado desde el componente padre
}) {
  // Estados de la cabecera - Conforme al modelo MovimientoAlmacen
  const [empresaId, setEmpresaId] = useState(defaultValues.empresaId || null);
  const [tipoDocumentoId, setTipoDocumentoId] = useState(
    defaultValues.tipoDocumentoId || null
  );
  const [conceptoMovAlmacenId, setConceptoMovAlmacenId] = useState(
    defaultValues.conceptoMovAlmacenId || null
  );
  const [serieDocId, setSerieDocId] = useState(
    defaultValues.serieDocId || null
  );
  const [numSerieDoc, setNumSerieDoc] = useState(
    defaultValues.numSerieDoc || ""
  );
  const [numCorreDoc, setNumCorreDoc] = useState(
    defaultValues.numCorreDoc || ""
  );
  const [numeroDocumento, setNumeroDocumento] = useState(
    defaultValues.numeroDocumento || ""
  );
  const [fechaDocumento, setFechaDocumento] = useState(
    defaultValues.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date()
  );
  const [entidadComercialId, setEntidadComercialId] = useState(
    defaultValues.entidadComercialId || null
  );
  const [faenaPescaId, setFaenaPescaId] = useState(
    defaultValues.faenaPescaId || null
  );
  const [embarcacionId, setEmbarcacionId] = useState(
    defaultValues.embarcacionId || null
  );
  const [ordenTrabajoId, setOrdenTrabajoId] = useState(
    defaultValues.ordenTrabajoId || null
  );
  const [dirOrigenId, setDirOrigenId] = useState(
    defaultValues.dirOrigenId || null
  );
  const [dirDestinoId, setDirDestinoId] = useState(
    defaultValues.dirDestinoId || null
  );
  const [numGuiaSunat, setNumGuiaSunat] = useState(
    defaultValues.numGuiaSunat || ""
  );
  const [fechaGuiaSunat, setFechaGuiaSunat] = useState(
    defaultValues.fechaGuiaSunat ? new Date(defaultValues.fechaGuiaSunat) : null
  );
  const [transportistaId, setTransportistaId] = useState(
    defaultValues.transportistaId || null
  );
  const [vehiculoId, setVehiculoId] = useState(
    defaultValues.vehiculoId || null
  );
  const [agenciaEnvioId, setAgenciaEnvioId] = useState(
    defaultValues.agenciaEnvioId || null
  );
  const [dirAgenciaEnvioId, setDirAgenciaEnvioId] = useState(
    defaultValues.dirAgenciaEnvioId || null
  );
  const [personalRespAlmacen, setPersonalRespAlmacen] = useState(
    defaultValues.personalRespAlmacen || null
  );
  const [ordenCompraId, setOrdenCompraId] = useState(
    defaultValues.ordenCompraId || null
  );
  const [pedidoVentaId, setPedidoVentaId] = useState(
    defaultValues.pedidoVentaId || null
  );
  const [estadoDocAlmacenId, setEstadoDocAlmacenId] = useState(
    defaultValues.estadoDocAlmacenId || null
  );
  const [esCustodia, setEsCustodia] = useState(
    defaultValues.esCustodia !== undefined ? defaultValues.esCustodia : false
  );
  const [observaciones, setObservaciones] = useState(
    defaultValues.observaciones || ""
  );

  // Estados para información de almacenes del concepto
  const [almacenOrigenInfo, setAlmacenOrigenInfo] = useState(null);
  const [almacenDestinoInfo, setAlmacenDestinoInfo] = useState(null);
  const [llevaKardexOrigen, setLlevaKardexOrigen] = useState(false);
  const [llevaKardexDestino, setLlevaKardexDestino] = useState(false);

  // Estados dinámicos para filtros
  const [direccionesOrigen, setDireccionesOrigen] = useState([]);
  const [direccionesDestino, setDireccionesDestino] = useState([]);
  const [direccionesAgencia, setDireccionesAgencia] = useState([]);
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState([]);
  const [transportistasFiltrados, setTransportistasFiltrados] = useState([]);
  const [agenciasFiltradas, setAgenciasFiltradas] = useState([]);
  const [estadosDocumento, setEstadosDocumento] = useState([]);

  // Usuario logueado
  const usuarioLogueado = useAuthStore((state) => state.user);

  // Verificar si el documento está cerrado (estadoDocAlmacenId = 31)
  const documentoCerrado =
    defaultValues?.estadoDocAlmacenId === 31 ||
    defaultValues?.estadoDocAlmacenId === "31";

  // Estados para detalles
  const [detalles, setDetalles] = useState(defaultValues.detalles || []);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [showKardexDialog, setShowKardexDialog] = useState(false);
  const [detalleKardex, setDetalleKardex] = useState(null);

  // Estados para el progreso de generación de kardex
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const [progressComplete, setProgressComplete] = useState(false);
  const [progressError, setProgressError] = useState(false);
  const [progressErrorMessage, setProgressErrorMessage] = useState("");
  const [progressSummary, setProgressSummary] = useState(null);

  // Función para recargar detalles desde la BD
  const recargarDetalles = async () => {
    if (defaultValues?.id) {
      try {
        const { getMovimientoAlmacenPorId } = await import(
          "../../api/movimientoAlmacen"
        );
        const movimientoActualizado = await getMovimientoAlmacenPorId(
          defaultValues.id
        );
        console.log("🔄 Movimiento actualizado:", movimientoActualizado);
        console.log("🔄 Detalles recibidos:", movimientoActualizado.detalles);
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
        : null
    );
    setTipoDocumentoId(
      defaultValues.tipoDocumentoId
        ? Number(defaultValues.tipoDocumentoId)
        : null
    );
    setConceptoMovAlmacenId(
      defaultValues.conceptoMovAlmacenId
        ? Number(defaultValues.conceptoMovAlmacenId)
        : null
    );
    setSerieDocId(
      defaultValues.serieDocId ? Number(defaultValues.serieDocId) : null
    );
    setNumSerieDoc(defaultValues.numSerieDoc || "");
    setNumCorreDoc(defaultValues.numCorreDoc || "");
    setNumeroDocumento(defaultValues.numeroDocumento || "");
    setFechaDocumento(
      defaultValues.fechaDocumento
        ? new Date(defaultValues.fechaDocumento)
        : new Date()
    );
    setEntidadComercialId(
      defaultValues.entidadComercialId
        ? Number(defaultValues.entidadComercialId)
        : null
    );
    setEsCustodia(
      defaultValues.esCustodia !== undefined ? defaultValues.esCustodia : false
    );
    setObservaciones(defaultValues.observaciones || "");
    setEstadoDocAlmacenId(
      defaultValues.estadoDocAlmacenId
        ? Number(defaultValues.estadoDocAlmacenId)
        : null
    );
    setDetalles(defaultValues.detalles || []);
  }, [defaultValues, empresaFija]);

  // Cargar esCustodia e información de almacenes automáticamente cuando cambie el concepto
  useEffect(() => {
    const cargarInfoAlmacenes = async () => {
      if (conceptoMovAlmacenId) {
        const concepto = conceptosMovAlmacen.find(
          (c) => Number(c.id) === Number(conceptoMovAlmacenId)
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
            (c) => Number(c.id) === Number(conceptoMovAlmacenId)
          );

          if (concepto && concepto.tipoAlmacenId) {
            const series = await getSeriesDoc(
              empresaId,
              tipoDocumentoId,
              concepto.tipoAlmacenId
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
            (c) => Number(c.id) === Number(conceptoMovAlmacenId)
          );

          if (concepto) {
            const empresa = empresas.find(
              (e) => Number(e.id) === Number(empresaId)
            );
            const entidadEmpresaId = empresa?.entidadComercialId;

            if (entidadEmpresaId) {
              const direcciones = await getDireccionesEntidad();
              let direccionesFiltradas = [];

              if (concepto.llevaKardexOrigen) {
                // Solo direcciones de la empresa
                direccionesFiltradas = direcciones.filter(
                  (d) =>
                    Number(d.entidadComercialId) === Number(entidadEmpresaId)
                );
              } else {
                // Direcciones de la empresa + entidad comercial del movimiento
                const entidadesPermitidas = [entidadEmpresaId];
                if (entidadComercialId) {
                  entidadesPermitidas.push(entidadComercialId);
                }
                direccionesFiltradas = direcciones.filter((d) =>
                  entidadesPermitidas.includes(Number(d.entidadComercialId))
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
            (c) => Number(c.id) === Number(conceptoMovAlmacenId)
          );

          if (concepto) {
            const empresa = empresas.find(
              (e) => Number(e.id) === Number(empresaId)
            );
            const entidadEmpresaId = empresa?.entidadComercialId;

            if (entidadEmpresaId) {
              const direcciones = await getDireccionesEntidad();
              let direccionesFiltradas = [];

              if (concepto.llevaKardexDestino) {
                // Solo direcciones de la empresa
                direccionesFiltradas = direcciones.filter(
                  (d) =>
                    Number(d.entidadComercialId) === Number(entidadEmpresaId)
                );
              } else {
                // Direcciones de la empresa + entidad comercial del movimiento
                const entidadesPermitidas = [entidadEmpresaId];
                if (entidadComercialId) {
                  entidadesPermitidas.push(entidadComercialId);
                }
                direccionesFiltradas = direcciones.filter((d) =>
                  entidadesPermitidas.includes(Number(d.entidadComercialId))
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

  // Filtrar transportistas: tipoEntidadId=11 + entidadComercialId seleccionada
  useEffect(() => {
    if (entidadesComerciales && entidadesComerciales.length > 0) {
      const transportistasFiltrados = entidadesComerciales.filter(
        (e) => Number(e.tipoEntidadId) === 11
      );

      // Agregar la entidad comercial seleccionada si existe
      if (entidadComercialId) {
        const entidadSeleccionada = entidadesComerciales.find(
          (e) => Number(e.id) === Number(entidadComercialId)
        );
        if (
          entidadSeleccionada &&
          !transportistasFiltrados.find(
            (t) => Number(t.id) === Number(entidadSeleccionada.id)
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
        (e) => Number(e.tipoEntidadId) === 7
      );

      // Agregar la entidad comercial seleccionada si existe
      if (entidadComercialId) {
        const entidadSeleccionada = entidadesComerciales.find(
          (e) => Number(e.id) === Number(entidadComercialId)
        );
        if (
          entidadSeleccionada &&
          !agenciasFiltradas.find(
            (a) => Number(a.id) === Number(entidadSeleccionada.id)
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
            (v) => Number(v.entidadComercialId) === Number(transportistaId)
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
            (d) => Number(d.entidadComercialId) === Number(agenciaEnvioId)
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
          (e) => Number(e.tipoProvieneDeId) === 9 && !e.cesado
        );
        setEstadosDocumento(estadosFiltrados);

        // Si no hay estado asignado, asignar estado "Pendiente" (id=30) por defecto
        if (!estadoDocAlmacenId && estadosFiltrados.length > 0) {
          const estadoPendiente = estadosFiltrados.find(
            (e) => Number(e.id) === 30
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
              p.cesado === false
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
          "0"
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

  const entidadesOptions = entidadesComerciales.map((e) => ({
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

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
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
            disabled={loading || !!empresaFija || isEdit || detalles.length > 0} // Deshabilitar si hay empresaFija, es edición o hay detalles
            required
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={{ flex: 1.5 }}>
          <label htmlFor="fechaDocumento">Fecha Documento*</label>
          <Calendar
            id="fechaDocumento"
            value={fechaDocumento}
            onChange={(e) => setFechaDocumento(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            required
            disabled={loading}
            inputStyle={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label htmlFor="tipoDocumentoId">Tipo de Documento*</label>
          <Dropdown
            id="tipoDocumentoId"
            value={tipoDocumentoId ? Number(tipoDocumentoId) : null}
            options={tiposDocumentoOptions}
            onChange={(e) => setTipoDocumentoId(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
            disabled={loading || detalles.length > 0} // Deshabilitar solo si hay detalles
            required
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
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
        <div style={{ flex: 4 }}>
          <label htmlFor="conceptoMovAlmacenId">Concepto Movimiento*</label>
          <Dropdown
            id="conceptoMovAlmacenId"
            value={conceptoMovAlmacenId ? Number(conceptoMovAlmacenId) : null}
            options={conceptosMovAlmacenOptions}
            onChange={(e) => setConceptoMovAlmacenId(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar concepto"
            disabled={loading || isEdit || detalles.length > 0} // Deshabilitar si es edición o hay detalles
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
            id="esCustodia"
            label={esCustodia ? "CUSTODIA" : "PROPIA"}
            className={esCustodia ? "p-button-danger" : "p-button-success"}
            disabled
            style={{
              fontWeight: "bold",
              width: "100%",
              cursor: "not-allowed",
            }}
          />
        </div>
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
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
        <div style={{ flex: 2 }}>
          <label htmlFor="serieDocId">Serie de Documento*</label>
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
        <div style={{ flex: 2 }}>
          <label htmlFor="numSerieDoc">Número Serie Doc.</label>
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
        <div style={{ flex: 2 }}>
          <label htmlFor="numCorreDoc">Número Correlativo Doc.</label>
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
                  ? "#f97316" // Pendiente - Naranja warning (igual que p-button-warning)
                  : estadoDocAlmacenId === 31
                  ? "#22c55e" // Cerrado - Verde success (igual que p-button-success)
                  : estadoDocAlmacenId === 32
                  ? "#ef4444" // Anulado - Rojo danger (igual que p-button-danger)
                  : "#ffffff", // Default - Blanco
              color:
                estadoDocAlmacenId === 30
                  ? "#ffffff" // Texto blanco para warning
                  : estadoDocAlmacenId === 31
                  ? "#ffffff" // Texto blanco para success
                  : estadoDocAlmacenId === 32
                  ? "#ffffff" // Texto blanco para danger
                  : "#000000", // Default - Negro
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
        <div style={{ flex: 2 }}>
          <label htmlFor="entidadComercialId">Entidad Comercial</label>
          <Dropdown
            id="entidadComercialId"
            value={entidadComercialId ? Number(entidadComercialId) : null}
            options={entidadesOptions}
            onChange={(e) => setEntidadComercialId(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar entidad"
            disabled={loading || isEdit || detalles.length > 0} // Deshabilitar si es edición o hay detalles
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
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
              <i className="pi pi-info-circle" style={{ color: "#856404" }}></i>
              <span style={{ color: "#856404", fontSize: "0.9em" }}>
                <strong>Importante:</strong> Primero debes guardar el movimiento
                para poder agregar detalles.
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
            disabled={loading || !isEdit}
            type="button"
            tooltip={!isEdit ? "Primero debes guardar el movimiento" : ""}
            tooltipOptions={{ position: "top" }}
          />
        </div>
        <DetalleMovimientoList
          detalles={detalles}
          productos={productos}
          readOnly={documentoCerrado}
          onEdit={(detalle) => {
            setEditingDetalle(detalle);
            setShowDetalleDialog(true);
          }}
          onVerKardex={(detalle) => {
            setDetalleKardex(detalle);
            setShowKardexDialog(true);
          }}
          onSave={(detalleData) => {
            // Solo actualizar el estado local - NO guardar en BD
            // El guardado en BD lo hace DetalleMovimientoForm.jsx
            if (editingDetalle) {
              // Actualizar detalle existente
              setDetalles(
                detalles.map((d) =>
                  d === editingDetalle
                    ? { ...editingDetalle, ...detalleData }
                    : d
                )
              );
            } else {
              // Agregar nuevo detalle
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
                // Si el movimiento existe y el detalle tiene ID, eliminar en BD
                if (
                  defaultValues?.id &&
                  detalle?.id &&
                  !isNaN(Number(detalle.id))
                ) {
                  try {
                    const { eliminarDetalleMovimiento } = await import(
                      "../../api/movimientoAlmacen"
                    );
                    await eliminarDetalleMovimiento(Number(detalle.id));
                    // Recargar detalles desde BD
                    await recargarDetalles();
                  } catch (error) {
                    console.error("Error al eliminar detalle:", error);
                  }
                } else {
                  // Detalle nuevo (sin ID) - solo eliminar del estado local
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
        >
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
                loading || !direccionesOrigen || direccionesOrigen.length === 0
              }
              showClear
              filter
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
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
              onChange={(e) => setNumGuiaSunat(e.target.value.toUpperCase())}
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
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 3 }}>
            <label htmlFor="observaciones">Observaciones</label>
            <InputText
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value.toUpperCase())}
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
                <label htmlFor="embarcacionId">Embarcación (Generado)</label>
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
                <label htmlFor="ordenTrabajoId">Orden Trabajo (Generado)</label>
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
                label: `${v.placa || ""} - ${v.marca || ""} ${v.modelo || ""}`,
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
            <label htmlFor="personalRespAlmacen">Responsable Almacén*</label>
            <Dropdown
              id="personalRespAlmacen"
              value={personalRespAlmacen ? Number(personalRespAlmacen) : null}
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
        >
          {(ordenCompraId || pedidoVentaId) && (
            <>
              {ordenCompraId && (
                <div style={{ flex: 1 }}>
                  <label htmlFor="ordenCompraId">
                    Orden de Compra (Generado)
                  </label>
                  <InputText
                    id="ordenCompraId"
                    value={`ID: ${ordenCompraId}`}
                    disabled
                    style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                  />
                </div>
              )}
              {pedidoVentaId && (
                <div style={{ flex: 1 }}>
                  <label htmlFor="pedidoVentaId">
                    Pedido de Venta (Generado)
                  </label>
                  <InputText
                    id="pedidoVentaId"
                    value={`ID: ${pedidoVentaId}`}
                    disabled
                    style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                  />
                </div>
              )}
            </>
          )}
        </div>
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
            (c) => Number(c.id) === Number(conceptoMovAlmacenId)
          ),
        }}
        estadosMercaderia={estadosMercaderia}
        estadosCalidad={estadosCalidad}
        readOnly={documentoCerrado}
        onSave={async (detalleData) => {
          // Si el movimiento existe, recargar desde BD
          if (defaultValues?.id) {
            await recargarDetalles();
          } else {
            // Movimiento nuevo - actualizar estado local
            if (editingDetalle) {
              // Actualizar detalle existente
              setDetalles(
                detalles.map((d) =>
                  d === editingDetalle
                    ? { ...editingDetalle, ...detalleData }
                    : d
                )
              );
            } else {
              // Agregar nuevo detalle
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

      <Divider />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        {/* Botones de acciones del documento */}
        {isEdit && detalles.length > 0 && (
          <>
            {/* Botón Cerrar Documento - Estado 31 */}
            <Button
              type="button"
              label="Cerrar Documento"
              icon="pi pi-lock"
              onClick={() => {
                confirmDialog({
                  message:
                    "¿Está seguro que desea cerrar este documento? El estado cambiará a CERRADO (31).",
                  header: "Confirmar Cierre",
                  icon: "pi pi-exclamation-triangle",
                  acceptClassName: "p-button-warning",
                  accept: async () => {
                    if (onCerrar) {
                      await onCerrar(defaultValues.id);
                    }
                  },
                });
              }}
              disabled={loading || estadoDocAlmacenId !== 30}
              className="p-button-warning"
              severity="warning"
              raised
              size="small"
              tooltip={estadoDocAlmacenId === 30 ? "Cerrar documento (estado CERRADO - 31)" : "Solo disponible para documentos en estado PENDIENTE"}
              tooltipOptions={{ position: "top" }}
            />

            {/* Botón Anular Documento - Estado 32 */}
            <Button
              type="button"
              label="Anular Documento"
              icon="pi pi-times-circle"
              onClick={() => {
                confirmDialog({
                  message:
                    "¿Está seguro que desea anular este documento? El estado cambiará a ANULADO (32).",
                  header: "Confirmar Anulación",
                  icon: "pi pi-exclamation-triangle",
                  acceptClassName: "p-button-danger",
                  accept: async () => {
                    if (onAnular) {
                      await onAnular(defaultValues.id, defaultValues.empresaId);
                    }
                  },
                });
              }}
              disabled={loading}
              className="p-button-danger"
              severity="danger"
              raised
              size="small"
              tooltip="Anular documento (estado ANULADO - 32)"
              tooltipOptions={{ position: "top" }}
            />

            {/* Botón Generar Kardex - Estado 33 */}
            <Button
              type="button"
              label="Generar Kardex"
              icon="pi pi-chart-line"
              onClick={async () => {
                confirmDialog({
                  message:
                    "¿Está seguro que desea generar el kardex y los saldos?",
                  header: "Confirmar Generación",
                  icon: "pi pi-question-circle",
                  acceptClassName: "p-button-success",
                  accept: async () => {
                    try {
                      // Inicializar pasos del proceso
                      const steps = [
                        {
                          label: "Iniciando generación de kardex...",
                          completed: false,
                        },
                        {
                          label: "Procesando detalles del movimiento...",
                          completed: false,
                        },
                        {
                          label: "Calculando saldos de kardex...",
                          completed: false,
                        },
                        {
                          label: "Actualizando saldos de productos...",
                          completed: false,
                        },
                        { label: "Finalizando proceso...", completed: false },
                      ];

                      setProgressSteps(steps);
                      setCurrentProgressStep(0);
                      setProgressComplete(false);
                      setProgressError(false);
                      setProgressErrorMessage("");
                      setProgressSummary(null);
                      setShowProgressDialog(true);

                      // Paso 1: Iniciar
                      await new Promise((resolve) => setTimeout(resolve, 500));
                      steps[0].completed = true;
                      setProgressSteps([...steps]);
                      setCurrentProgressStep(1);

                      // Paso 2: Generar kardex
                      const { generarKardex } = await import(
                        "../../api/generarKardex"
                      );
                      const resultado = await generarKardex(defaultValues.id);
                      steps[1].completed = true;
                      setProgressSteps([...steps]);
                      setCurrentProgressStep(2);

                      // Paso 3: Calcular saldos
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      steps[2].completed = true;
                      setProgressSteps([...steps]);
                      setCurrentProgressStep(3);

                      // Paso 4: Actualizar saldos
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      steps[3].completed = true;
                      setProgressSteps([...steps]);
                      setCurrentProgressStep(4);

                      // Paso 5: Finalizar
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      steps[4].completed = true;
                      setProgressSteps([...steps]);

                      // Preparar resumen
                      setProgressSummary({
                        creados: resultado.kardexCreados || 0,
                        actualizados: resultado.kardexActualizados || 0,
                        saldosDetActualizados:
                          resultado.saldosDetActualizados || 0,
                        saldosGenActualizados:
                          resultado.saldosGenActualizados || 0,
                        errores: resultado.errores?.length || 0,
                      });

                      setProgressComplete(true);

                      // Si hay errores, mostrarlos en consola
                      if (resultado.errores && resultado.errores.length > 0) {
                        console.error("Errores en kardex:", resultado.errores);
                      }

                      // Cerrar automáticamente después de 2 segundos
                      setTimeout(() => {
                        setShowProgressDialog(false);
                      }, 2000);
                    } catch (error) {
                      console.error("Error al generar kardex:", error);
                      setProgressError(true);
                      setProgressErrorMessage(
                        error.response?.data?.error ||
                          error.message ||
                          "No se pudo generar el kardex"
                      );
                      setProgressComplete(true);

                      // En caso de error, cerrar después de 4 segundos para que el usuario lea el mensaje
                      setTimeout(() => {
                        setShowProgressDialog(false);
                      }, 4000);
                    }
                  },
                });
              }}
              disabled={loading}
              className="p-button-success"
              severity="success"
              raised
              size="small"
              tooltip="Generar kardex y actualizar saldos"
              tooltipOptions={{ position: "top" }}
            />
          </>
        )}
        {/* Botones para generar PDF */}
        {isEdit && detalles.length > 0 && (
          <>
            <Button
              type="button"
              label="PDF sin Costos"
              icon="pi pi-file-pdf"
              onClick={async () => {
                try {
                  toast.current.show({
                    severity: "info",
                    summary: "Generando PDF",
                    detail: "Generando documento sin costos...",
                    life: 2000,
                  });

                  // Recargar movimiento completo desde el backend para obtener todas las relaciones
                  const movimientoCompleto = await getMovimientoAlmacenPorId(defaultValues.id);
                  
                  // Agregar personal responsable completo desde personalOptions
                  if (movimientoCompleto.personalRespAlmacen && personalOptions.length > 0) {
                    const personalId = typeof movimientoCompleto.personalRespAlmacen === 'string'
                      ? Number(movimientoCompleto.personalRespAlmacen)
                      : Number(movimientoCompleto.personalRespAlmacen.id || movimientoCompleto.personalRespAlmacen);
                    
                    const personalEncontrado = personalOptions.find(p => Number(p.id) === personalId);
                    if (personalEncontrado) {
                      movimientoCompleto.personalRespAlmacen = personalEncontrado;
                    }
                  }
                  
                  // Obtener empresa completa
                  const empresaSeleccionada = empresas.find(
                    (e) => Number(e.id) === Number(empresaId)
                  );

                  const resultado = await generarPDFMovimientoAlmacen(
                    movimientoCompleto,
                    movimientoCompleto.detalles || detalles,
                    empresaSeleccionada || {},
                    false // Sin costos
                  );

                  if (resultado.success) {
                    toast.current.show({
                      severity: "success",
                      summary: "Éxito",
                      detail: "PDF generado correctamente",
                      life: 3000,
                    });
                  } else {
                    toast.current.show({
                      severity: "error",
                      summary: "Error",
                      detail: resultado.error || "Error al generar PDF",
                      life: 5000,
                    });
                  }
                } catch (error) {
                  console.error("Error al generar PDF:", error);
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Error al generar el PDF",
                    life: 5000,
                  });
                }
              }}
              className="p-button-info"
              severity="info"
              raised
              size="small"
              outlined
              tooltip="Generar PDF sin información de costos"
              tooltipOptions={{ position: "top" }}
            />
            <Button
              type="button"
              label="PDF con Costos"
              icon="pi pi-file-pdf"
              onClick={async () => {
                try {
                  toast.current.show({
                    severity: "info",
                    summary: "Generando PDF",
                    detail: "Generando documento con costos...",
                    life: 2000,
                  });

                  // Obtener empresa completa
                  const empresaSeleccionada = empresas.find(
                    (e) => Number(e.id) === Number(empresaId)
                  );

                  const resultado = await generarPDFMovimientoAlmacenConCostos(
                    defaultValues,
                    detalles,
                    empresaSeleccionada || {}
                  );

                  if (resultado.success) {
                    toast.current.show({
                      severity: "success",
                      summary: "Éxito",
                      detail: "PDF generado correctamente",
                      life: 3000,
                    });
                  } else {
                    toast.current.show({
                      severity: "error",
                      summary: "Error",
                      detail: resultado.error || "Error al generar PDF",
                      life: 5000,
                    });
                  }
                } catch (error) {
                  console.error("Error al generar PDF:", error);
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Error al generar el PDF",
                    life: 5000,
                  });
                }
              }}
              className="p-button-help"
              severity="help"
              raised
              size="small"
              outlined
              tooltip="Generar PDF con información de costos"
              tooltipOptions={{ position: "top" }}
            />
          </>
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
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>

      {/* Diálogo de Progreso de Generación de Kardex */}
      <ProcessProgressDialog
        visible={showProgressDialog}
        onHide={() => setShowProgressDialog(false)}
        title="Generando Kardex"
        steps={progressSteps}
        currentStep={currentProgressStep}
        isComplete={progressComplete}
        hasError={progressError}
        errorMessage={progressErrorMessage}
        summary={progressSummary}
      />

      {/* Diálogo de Kardex de Producto */}
      <KardexProductoDialog
        visible={showKardexDialog}
        onHide={() => setShowKardexDialog(false)}
        empresaId={defaultValues.empresaId}
        almacenId={
          defaultValues.conceptoMovAlmacen?.almacenDestinoId ||
          defaultValues.conceptoMovAlmacen?.almacenOrigenId
        }
        productoId={detalleKardex?.productoId}
        esCustodia={defaultValues.esCustodia}
        clienteId={detalleKardex?.clienteId}
        productoNombre={
          detalleKardex?.producto?.descripcionArmada || "Producto"
        }
      />
    </form>
  );
}
