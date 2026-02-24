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
} from "../../api/tesoreria/sublineaCredito";
import {
  getPrestamoBancariosPorSublinea,
  getPrestamosDisponiblesParaSublinea,
  asignarPrestamoASublinea,
  desvincularPrestamoDeSublinea,
} from "../../api/tesoreria/prestamoBancarios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

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

  useEffect(() => {
    if (sublinea) {
      setFormData({
        lineaCreditoId: sublinea.lineaCreditoId,
        tipoPrestamoId: sublinea.tipoPrestamoId,
        descripcion: sublinea.descripcion || "",
        montoAsignado: parseFloat(sublinea.montoAsignado),
        activo: sublinea.activo,
        observaciones: sublinea.observaciones || "",
      });
      cargarPrestamosAsignados();
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

  const cargarPrestamosDisponibles = async () => {
    if (!lineaCreditoId || !formData.tipoPrestamoId) return;

    try {
      setLoadingPrestamos(true);
      const data = await getPrestamosDisponiblesParaSublinea(
        lineaCreditoId,
        formData.tipoPrestamoId
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

  // Templates para DataTable de préstamos asignados
  const montoTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: lineaCredito?.moneda?.codigoSunat || "PEN",
    }).format(rowData.monto || 0);
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
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3rem" }}
            />
            <Column
              field="numeroPrestamo"
              header="Número Préstamo"
              sortable
            />
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