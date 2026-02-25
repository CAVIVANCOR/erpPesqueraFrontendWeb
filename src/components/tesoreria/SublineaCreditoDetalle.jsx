import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import {
  createSublineaCredito,
  updateSublineaCredito,
  obtenerSobregiros,
  crearSobregiro,
  actualizarSobregiro,
  cancelarSobregiro,
} from "../../api/tesoreria/sublineaCredito";
import {
  getPrestamoBancariosPorSublinea,
  getPrestamosDisponiblesParaSublinea,
  asignarPrestamoASublinea,
  desvincularPrestamoDeSublinea,
} from "../../api/tesoreria/prestamoBancarios";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { Calendar } from "primereact/calendar";

const SublineaCreditoDetalle = ({
  sublinea,
  lineaCreditoId,
  lineaCredito,
  tiposPrestamo,
  onGuardar,
  onCancelar,
  toast,
}) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    lineaCreditoId: lineaCreditoId,
    tipoPrestamoId: "",
    descripcion: "",
    montoAsignado: 0,
    activo: true,
    excluirDeCalculo: false,
    observaciones: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Estados para préstamos
  const [prestamosAsignados, setPrestamosAsignados] = useState([]);
  const [prestamosDisponibles, setPrestamosDisponibles] = useState([]);
  const [prestamosSeleccionados, setPrestamosSeleccionados] = useState([]);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  const [dialogAgregarVisible, setDialogAgregarVisible] = useState(false);

  // Estados para sobregiros
  const [sobregiros, setSobregiros] = useState([]);
  const [loadingSobregiros, setLoadingSobregiros] = useState(false);
  const [dialogSobregirosVisible, setDialogSobregirosVisible] = useState(false);
  const [sobregirosFormData, setSobregirosFormData] = useState({
    montoAutorizado: 0,
    fechaSolicitud: new Date(),
    fechaAprobacion: null,
    autorizadoPorBanco: "",
    numeroAutorizacionBanco: "",
    motivoSolicitud: "",
  });
  const [sobregirosEditando, setSobregirosEditando] = useState(null);

  useEffect(() => {
    if (sublinea) {
      setFormData({
        lineaCreditoId: sublinea.lineaCreditoId,
        tipoPrestamoId: sublinea.tipoPrestamoId,
        descripcion: sublinea.descripcion || "",
        montoAsignado: parseFloat(sublinea.montoAsignado),
        activo: sublinea.activo,
        excluirDeCalculo: sublinea.excluirDeCalculo || false,
        observaciones: sublinea.observaciones || "",
      });
      cargarPrestamosAsignados();
      cargarSobregiros(); // ✅ AGREGAR ESTA LÍNEA
    }
  }, [sublinea]);

  const cargarPrestamosAsignados = async () => {
    if (!sublinea?.id) return;

    try {
      setLoadingPrestamos(true);
      const data = await getPrestamoBancariosPorSublinea(sublinea.id);
      setPrestamosAsignados(data);
    } catch (error) {
      console.error("Error al cargar préstamos asignados:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los préstamos asignados",
        life: 3000,
      });
    } finally {
      setLoadingPrestamos(false);
    }
  };

  const cargarSobregiros = async () => {
    if (!sublinea?.id) return;

    try {
      setLoadingSobregiros(true);
      const data = await obtenerSobregiros(sublinea.id);
      setSobregiros(data);
    } catch (error) {
      console.error("Error al cargar sobregiros:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los sobregiros",
        life: 3000,
      });
    } finally {
      setLoadingSobregiros(false);
    }
  };

  const cargarPrestamosDisponibles = async () => {
    if (!lineaCreditoId || !formData.tipoPrestamoId) return;

    try {
      setLoadingPrestamos(true);
      const data = await getPrestamosDisponiblesParaSublinea(
        lineaCreditoId,
        formData.tipoPrestamoId,
      );
      setPrestamosDisponibles(data);
      setPrestamosSeleccionados([]);
      setDialogAgregarVisible(true);
    } catch (error) {
      console.error("Error al cargar préstamos disponibles:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los préstamos disponibles",
        life: 3000,
      });
    } finally {
      setLoadingPrestamos(false);
    }
  };

  const handleAsignarPrestamosSeleccionados = async () => {
    if (!prestamosSeleccionados || prestamosSeleccionados.length === 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar al menos un préstamo",
        life: 3000,
      });
      return;
    }

    if (!sublinea?.id) return;

    try {
      setLoading(true);

      // Asignar todos los préstamos seleccionados
      for (const prestamo of prestamosSeleccionados) {
        await asignarPrestamoASublinea(prestamo.id, sublinea.id);
      }

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `${prestamosSeleccionados.length} préstamo(s) asignado(s) correctamente`,
        life: 3000,
      });

      setDialogAgregarVisible(false);
      setPrestamosSeleccionados([]);
      await cargarPrestamosAsignados();
    } catch (error) {
      console.error("Error al asignar préstamos:", error);
      const mensaje =
        error.response?.data?.message || "Error al asignar los préstamos";
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDesvincularPrestamo = async (prestamoId) => {
    try {
      setLoading(true);
      await desvincularPrestamoDeSublinea(prestamoId);

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Préstamo desvinculado correctamente",
        life: 3000,
      });

      await cargarPrestamosAsignados();
    } catch (error) {
      console.error("Error al desvincular préstamo:", error);
      const mensaje =
        error.response?.data?.message || "Error al desvincular el préstamo";
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

    const abrirDialogSobregiro = (sobregiro = null) => {
    if (sobregiro) {
      setSobregirosEditando(sobregiro);
      setSobregirosFormData({
        montoAutorizado: parseFloat(sobregiro.montoAutorizado),
        fechaSolicitud: sobregiro.fechaSolicitud ? new Date(sobregiro.fechaSolicitud) : new Date(),
        fechaAprobacion: sobregiro.fechaAprobacion ? new Date(sobregiro.fechaAprobacion) : null,
        autorizadoPorBanco: sobregiro.autorizadoPorBanco || "",
        numeroAutorizacionBanco: sobregiro.numeroAutorizacionBanco || "",
        motivoSolicitud: sobregiro.motivoSolicitud || "",
      });
    } else {
      setSobregirosEditando(null);
      setSobregirosFormData({
        montoAutorizado: 0,
        fechaSolicitud: new Date(),
        fechaAprobacion: null,
        autorizadoPorBanco: "",
        numeroAutorizacionBanco: "",
        motivoSolicitud: "",
      });
    }
    setDialogSobregirosVisible(true);
  };

  const handleGuardarSobregiro = async () => {
    try {
      setLoading(true);

      const dataToSend = {
        ...sobregirosFormData,
        fechaSolicitud: sobregirosFormData.fechaSolicitud?.toISOString(),
        fechaAprobacion: sobregirosFormData.fechaAprobacion?.toISOString() || null,
        creadoPor: user?.personalId ? Number(user.personalId) : null,
        actualizadoPor: user?.personalId ? Number(user.personalId) : null,
      };

      if (sobregirosEditando) {
        await actualizarSobregiro(sobregirosEditando.id, dataToSend);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Sobregiro actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearSobregiro(sublinea.id, dataToSend);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Sobregiro registrado correctamente",
          life: 3000,
        });
      }

      setDialogSobregirosVisible(false);
      await cargarSobregiros();
    } catch (error) {
      console.error("Error al guardar sobregiro:", error);
      const mensaje = error.response?.data?.message || "Error al guardar el sobregiro";
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarSobregiro = async (sobregiroid) => {
    try {
      setLoading(true);
      await cancelarSobregiro(sobregiroid);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Sobregiro cancelado correctamente",
        life: 3000,
      });
      await cargarSobregiros();
    } catch (error) {
      console.error("Error al cancelar sobregiro:", error);
      const mensaje = error.response?.data?.message || "Error al cancelar el sobregiro";
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleNumberChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.tipoPrestamoId) {
      newErrors.tipoPrestamoId = "El tipo de préstamo es obligatorio";
    }

    if (!formData.montoAsignado || formData.montoAsignado <= 0) {
      newErrors.montoAsignado = "El monto asignado debe ser mayor a cero";
    }

    if (
      lineaCredito &&
      formData.montoAsignado > parseFloat(lineaCredito.montoAprobado)
    ) {
      newErrors.montoAsignado =
        "El monto asignado no puede exceder el monto aprobado de la línea";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        lineaCreditoId: Number(formData.lineaCreditoId),
        tipoPrestamoId: Number(formData.tipoPrestamoId),
      };

      if (sublinea) {
        dataToSend.actualizadoPor = user?.personalId
          ? Number(user.personalId)
          : null;
        await updateSublineaCredito(sublinea.id, dataToSend);
      } else {
        dataToSend.creadoPor = user?.personalId
          ? Number(user.personalId)
          : null;
        await createSublineaCredito(dataToSend);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar sublínea:", error);
      console.error("Error completo:", error.response?.data);

      let mensaje = "Error al guardar la sublínea";
      if (error.response?.data?.message) {
        mensaje = error.response.data.message;
      } else if (error.response?.data?.error) {
        mensaje = error.response.data.error;
      } else if (error.message) {
        mensaje = error.message;
      }

      toast?.current?.show({
        severity: "error",
        summary: "Error de Validación",
        detail: mensaje,
        life: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const montoTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: lineaCredito?.moneda?.codigoSunat || "PEN",
    }).format(rowData.saldoCapital || 0);
  };

  const fechaTemplate = (rowData) => {
    return rowData.fechaDesembolso
      ? new Date(rowData.fechaDesembolso).toLocaleDateString("es-PE")
      : "-";
  };

  const accionesTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-times"
        className="p-button-rounded p-button-danger p-button-text"
        onClick={() => handleDesvincularPrestamo(rowData.id)}
        tooltip="Desvincular préstamo"
        tooltipOptions={{ position: "top" }}
        type="button"
      />
    );
  };

  // Templates para DataTable de préstamos disponibles
  const montoDisponibleTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigoSunat || "PEN",
    }).format(rowData.montoDesembolsado || 0);
  };

  const fechaDisponibleTemplate = (rowData) => {
    return rowData.fechaDesembolso
      ? new Date(rowData.fechaDesembolso).toLocaleDateString("es-PE")
      : "-";
  };

    // Templates para sobregiros
  const montoSobregirosTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: lineaCredito?.moneda?.codigoSunat || "PEN",
    }).format(rowData.montoAutorizado || 0);
  };

  const fechaSobregirosTemplate = (rowData, field) => {
    const fecha = rowData[field];
    return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-";
  };

  const estadoSobregirosTemplate = (rowData) => {
    if (!rowData.activo) {
      return <span className="text-red-500 font-bold">CANCELADO</span>;
    }
    if (rowData.fechaAprobacion) {
      return <span className="text-green-500 font-bold">APROBADO</span>;
    }
    return <span className="text-yellow-500 font-bold">SOLICITADO</span>;
  };

  const accionesSobregirosTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.activo && (
          <>
            <Button
              icon="pi pi-pencil"
              className="p-button-rounded p-button-info p-button-text"
              onClick={() => abrirDialogSobregiro(rowData)}
              tooltip="Editar"
              tooltipOptions={{ position: "top" }}
              type="button"
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-text"
              onClick={() => handleCancelarSobregiro(rowData.id)}
              tooltip="Cancelar sobregiro"
              tooltipOptions={{ position: "top" }}
              type="button"
            />
          </>
        )}
      </div>
    );
  };

  const headerSobregiros = (
    <div className="flex justify-content-between align-items-center">
      <span className="text-xl font-bold">Sobregiros Autorizados</span>
      {sublinea && (
        <Button
          label="Registrar Sobregiro"
          icon="pi pi-plus"
          className="p-button-danger p-button-sm"
          onClick={() => abrirDialogSobregiro()}
          type="button"
          disabled={loadingSobregiros}
        />
      )}
    </div>
  );

  const headerPrestamos = (
    <div className="flex justify-content-between align-items-center">
      <span className="text-xl font-bold">Préstamos Asignados</span>
      {sublinea && (
        <Button
          label="Agregar Préstamos"
          icon="pi pi-plus"
          className="p-button-success p-button-sm"
          onClick={cargarPrestamosDisponibles}
          type="button"
          disabled={loadingPrestamos}
        />
      )}
    </div>
  );

  const headerDialogDisponibles = (
    <div className="flex justify-content-between align-items-center">
      <span>Préstamos Disponibles</span>
      <span className="text-sm text-gray-600">
        {prestamosSeleccionados.length} seleccionado(s)
      </span>
    </div>
  );

  return (
    <div className="p-fluid">
      <form onSubmit={handleSubmit}>
        {/* DATOS DE LA SUBLÍNEA EN UNA LÍNEA */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoPrestamoId">
              Tipo de Préstamo <span className="text-red-500">*</span>
            </label>
            <Dropdown
              id="tipoPrestamoId"
              name="tipoPrestamoId"
              value={formData.tipoPrestamoId}
              options={tiposPrestamo}
              onChange={handleChange}
              optionLabel="descripcion"
              optionValue="id"
              placeholder="Seleccione"
              className={errors.tipoPrestamoId ? "p-invalid" : ""}
              disabled={!!sublinea}
            />
            {errors.tipoPrestamoId && (
              <small className="p-error">{errors.tipoPrestamoId}</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="descripcion">Descripción</label>
            <InputText
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="montoAsignado">
              Monto ({lineaCredito?.moneda?.codigoSunat || "PEN"}){" "}
              <span className="text-red-500">*</span>
            </label>
            <InputNumber
              id="montoAsignado"
              value={formData.montoAsignado}
              onValueChange={(e) =>
                handleNumberChange("montoAsignado", e.value)
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              className={errors.montoAsignado ? "p-invalid" : ""}
            />
            {errors.montoAsignado && (
              <small className="p-error">{errors.montoAsignado}</small>
            )}
          </div>

          <div style={{ flex: 0.5 }}>
            <label htmlFor="activo">Estado</label>
            <Button
              type="button"
              label={formData.activo ? "ACTIVO" : "INACTIVO"}
              className={
                formData.activo ? "p-button-success" : "p-button-danger"
              }
              icon={
                formData.activo ? "pi pi-check-circle" : "pi pi-times-circle"
              }
              onClick={() =>
                setFormData((prev) => ({ ...prev, activo: !prev.activo }))
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="observaciones">Observaciones</label>
            <InputText
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Observaciones"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 0.5 }}>
            <label htmlFor="excluirDeCalculo">Excluir del Cálculo</label>
            <Button
              type="button"
              label={formData.excluirDeCalculo ? "EXCLUIDA" : "INCLUIDA"}
              className={
                formData.excluirDeCalculo ? "p-button-warning" : "p-button-info"
              }
              icon={
                formData.excluirDeCalculo ? "pi pi-ban" : "pi pi-calculator"
              }
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  excluirDeCalculo: !prev.excluirDeCalculo,
                }))
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* DIVIDER */}
        {sublinea && <Divider />}

        {/* LISTA DE PRÉSTAMOS ASIGNADOS */}
        {sublinea && (
          <div className="mt-3">
            <DataTable
              value={prestamosAsignados}
              loading={loadingPrestamos}
              header={headerPrestamos}
              emptyMessage="No hay préstamos asignados a esta sublínea"
              stripedRows
              size="small"
              showGridlines
              style={{ fontSize: "12px" }}
            >
              <Column
                field="numeroPrestamo"
                header="Número Préstamo"
                sortable
              />
              <Column
                field="fechaDesembolso"
                header="Fecha Desembolso"
                body={fechaTemplate}
                sortable
              />
              <Column
                field="monto"
                header="Monto"
                body={montoTemplate}
                sortable
              />
              <Column field="estado.descripcion" header="Estado" sortable />

              <Column
                header="Acciones"
                body={accionesTemplate}
                style={{ width: "80px" }}
              />
            </DataTable>
          </div>
        )}
        {/* DIVIDER */}
        {sublinea && <Divider />}

        {/* LISTA DE SOBREGIROS */}
        {sublinea && (
          <div className="mt-3">
            <DataTable
              value={sobregiros}
              loading={loadingSobregiros}
              header={headerSobregiros}
              emptyMessage="No hay sobregiros registrados"
              stripedRows
              size="small"
              showGridlines
              style={{ fontSize: "12px" }}
            >
              <Column
                field="montoAutorizado"
                header="Monto Autorizado"
                body={montoSobregirosTemplate}
                sortable
              />
              <Column
                field="fechaSolicitud"
                header="Fecha Solicitud"
                body={(rowData) => fechaSobregirosTemplate(rowData, "fechaSolicitud")}
                sortable
              />
              <Column
                field="fechaAprobacion"
                header="Fecha Aprobación"
                body={(rowData) => fechaSobregirosTemplate(rowData, "fechaAprobacion")}
                sortable
              />
              <Column
                field="autorizadoPorBanco"
                header="Autorizado Por"
                sortable
              />
              <Column
                field="numeroAutorizacionBanco"
                header="Nº Autorización"
                sortable
              />
              <Column
                header="Estado"
                body={estadoSobregirosTemplate}
                style={{ width: "120px" }}
              />
              <Column
                header="Acciones"
                body={accionesSobregirosTemplate}
                style={{ width: "100px" }}
              />
            </DataTable>
          </div>
        )}
        {/* DIALOG PARA AGREGAR PRÉSTAMOS CON DATATABLE Y CHECKBOXES */}
        <Dialog
          visible={dialogAgregarVisible}
          style={{ width: "900px" }}
          header={headerDialogDisponibles}
          modal
          onHide={() => {
            setDialogAgregarVisible(false);
            setPrestamosSeleccionados([]);
          }}
        >
          <DataTable
            value={prestamosDisponibles}
            selection={prestamosSeleccionados}
            onSelectionChange={(e) => setPrestamosSeleccionados(e.value)}
            dataKey="id"
            emptyMessage="No hay préstamos disponibles"
            stripedRows
            size="small"
            showGridlines
            style={{ fontSize: "12px" }}
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column field="numeroPrestamo" header="Número Préstamo" sortable />
            <Column
              field="fechaDesembolso"
              header="Fecha Desembolso"
              body={fechaDisponibleTemplate}
              sortable
            />
            <Column
              field="montoDesembolsado"
              header="Monto"
              body={montoDisponibleTemplate}
              sortable
            />
            <Column field="estado.descripcion" header="Estado" sortable />
          </DataTable>

          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => {
                setDialogAgregarVisible(false);
                setPrestamosSeleccionados([]);
              }}
              type="button"
            />
            <Button
              label={`Asignar (${prestamosSeleccionados.length})`}
              icon="pi pi-check"
              onClick={handleAsignarPrestamosSeleccionados}
              disabled={prestamosSeleccionados.length === 0}
              loading={loading}
              type="button"
              className="p-button-success"
            />
          </div>
        </Dialog>
        {/* DIALOG PARA CREAR/EDITAR SOBREGIRO */}
        <Dialog
          visible={dialogSobregirosVisible}
          style={{ width: "600px" }}
          header={sobregirosEditando ? "Editar Sobregiro" : "Registrar Sobregiro"}
          modal
          onHide={() => setDialogSobregirosVisible(false)}
        >
          <div className="p-fluid">
            <div className="field">
              <label htmlFor="montoAutorizado">Monto Autorizado *</label>
              <InputNumber
                id="montoAutorizado"
                value={sobregirosFormData.montoAutorizado}
                onValueChange={(e) =>
                  setSobregirosFormData({ ...sobregirosFormData, montoAutorizado: e.value })
                }
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
              />
            </div>

            <div className="field">
              <label htmlFor="fechaSolicitud">Fecha Solicitud</label>
              <Calendar
                id="fechaSolicitud"
                value={sobregirosFormData.fechaSolicitud}
                onChange={(e) =>
                  setSobregirosFormData({ ...sobregirosFormData, fechaSolicitud: e.value })
                }
                dateFormat="dd/mm/yy"
                showIcon
              />
            </div>

            <div className="field">
              <label htmlFor="fechaAprobacion">Fecha Aprobación</label>
              <Calendar
                id="fechaAprobacion"
                value={sobregirosFormData.fechaAprobacion}
                onChange={(e) =>
                  setSobregirosFormData({ ...sobregirosFormData, fechaAprobacion: e.value })
                }
                dateFormat="dd/mm/yy"
                showIcon
              />
            </div>

            <div className="field">
              <label htmlFor="autorizadoPorBanco">Autorizado Por (Banco)</label>
              <InputText
                id="autorizadoPorBanco"
                value={sobregirosFormData.autorizadoPorBanco}
                onChange={(e) =>
                  setSobregirosFormData({ ...sobregirosFormData, autorizadoPorBanco: e.target.value })
                }
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="field">
              <label htmlFor="numeroAutorizacionBanco">Número Autorización Banco</label>
              <InputText
                id="numeroAutorizacionBanco"
                value={sobregirosFormData.numeroAutorizacionBanco}
                onChange={(e) =>
                  setSobregirosFormData({ ...sobregirosFormData, numeroAutorizacionBanco: e.target.value })
                }
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="field">
              <label htmlFor="motivoSolicitud">Motivo de Solicitud</label>
              <InputTextarea
                id="motivoSolicitud"
                value={sobregirosFormData.motivoSolicitud}
                onChange={(e) =>
                  setSobregirosFormData({ ...sobregirosFormData, motivoSolicitud: e.target.value })
                }
                rows={3}
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>

          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setDialogSobregirosVisible(false)}
              type="button"
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              onClick={handleGuardarSobregiro}
              loading={loading}
              type="button"
              className="p-button-success"
            />
          </div>
        </Dialog>
        {/* Botones de acción */}
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
            type="button"
            onClick={onCancelar}
            disabled={loading}
            className="p-button-warning"
            severity="warning"
            raised
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            type="submit"
            loading={loading}
            disabled={loading}
            className="p-button-success"
            severity="success"
            raised
          />
        </div>
      </form>
    </div>
  );
};

export default SublineaCreditoDetalle;
