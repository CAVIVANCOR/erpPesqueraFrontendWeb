// src/components/contabilidad/AsientoContableForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { getPlanCuentasContable } from "../../api/contabilidad/planCuentasContable";
import {
  createAsientoContable,
  updateAsientoContable,
} from "../../api/contabilidad/asientoContable";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";

export default function AsientoContableForm({
  isEdit = false,
  defaultValues = {},
  empresaFija = null,
  periodoFijo = null,
  empresas = [],
  periodos = [],
  estados = [],
  monedas = [],
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const { usuario } = useAuthStore();
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
      ? Number(empresaFija)
      : null,
    periodoContableId: defaultValues?.periodoContableId
      ? Number(defaultValues.periodoContableId)
      : periodoFijo
      ? Number(periodoFijo)
      : null,
    numeroAsiento: defaultValues?.numeroAsiento || "",
    correlativo: defaultValues?.correlativo || null,
    fechaAsiento: defaultValues?.fechaAsiento
      ? new Date(defaultValues.fechaAsiento)
      : new Date(),
    glosa: defaultValues?.glosa || "",
    tipoLibro: defaultValues?.tipoLibro || "FISCAL",
    origenAsiento: defaultValues?.origenAsiento || "MANUAL",
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 76,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : 1,
    tipoCambio: defaultValues?.tipoCambio || null,
    totalDebe: defaultValues?.totalDebe || 0,
    totalHaber: defaultValues?.totalHaber || 0,
    diferencia: defaultValues?.diferencia || 0,
    estaCuadrado: defaultValues?.estaCuadrado || false,
  });

  const [detalles, setDetalles] = useState(defaultValues?.detalles || []);
  const [planCuentas, setPlanCuentas] = useState([]);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [detalleFormData, setDetalleFormData] = useState({
    planCuentaId: null,
    codigoCuenta: "",
    nombreCuenta: "",
    glosa: "",
    debe: 0,
    haber: 0,
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarPlanCuentas();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setFormData((prev) => ({ ...prev, estadoId: 76 }));
    }
  }, [isEdit]);

  useEffect(() => {
    calcularTotales();
  }, [detalles]);

  const cargarPlanCuentas = async () => {
    try {
      const data = await getPlanCuentasContable();
      const cuentasImputables = data.filter(
        (c) => c.esImputable === true && c.activo === true
      );
      setPlanCuentas(cuentasImputables);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar plan de cuentas",
        life: 3000,
      });
    }
  };

  const calcularTotales = () => {
    const totalDebe = detalles.reduce((sum, d) => sum + Number(d.debe || 0), 0);
    const totalHaber = detalles.reduce(
      (sum, d) => sum + Number(d.haber || 0),
      0
    );
    const diferencia = totalDebe - totalHaber;
    const estaCuadrado = Math.abs(diferencia) < 0.01;

    setFormData((prev) => ({
      ...prev,
      totalDebe,
      totalHaber,
      diferencia,
      estaCuadrado,
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openNewDetalle = () => {
    setEditingDetalle(null);
    setDetalleFormData({
      planCuentaId: null,
      codigoCuenta: "",
      nombreCuenta: "",
      glosa: "",
      debe: 0,
      haber: 0,
    });
    setShowDetalleDialog(true);
  };

  const openEditDetalle = (detalle) => {
    setEditingDetalle(detalle);
    setDetalleFormData({
      planCuentaId: detalle.planCuentaId,
      codigoCuenta: detalle.codigoCuenta,
      nombreCuenta: detalle.nombreCuenta,
      glosa: detalle.glosa,
      debe: detalle.debe,
      haber: detalle.haber,
    });
    setShowDetalleDialog(true);
  };

  const handleCuentaChange = (planCuentaId) => {
    const cuenta = planCuentas.find(
      (c) => Number(c.id) === Number(planCuentaId)
    );
    if (cuenta) {
      setDetalleFormData({
        ...detalleFormData,
        planCuentaId: Number(cuenta.id),
        codigoCuenta: cuenta.codigoCuenta,
        nombreCuenta: cuenta.nombreCuenta,
      });
    }
  };

  const handleSaveDetalle = () => {
    if (!detalleFormData.planCuentaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una cuenta contable",
        life: 3000,
      });
      return;
    }

    if (!detalleFormData.glosa) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar una glosa",
        life: 3000,
      });
      return;
    }

    const debe = Number(detalleFormData.debe || 0);
    const haber = Number(detalleFormData.haber || 0);

    if (debe === 0 && haber === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar un monto en Debe o Haber",
        life: 3000,
      });
      return;
    }

    if (debe > 0 && haber > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "No puede tener monto en Debe y Haber al mismo tiempo",
        life: 3000,
      });
      return;
    }

    let nuevosDetalles;
    if (editingDetalle) {
      nuevosDetalles = detalles.map((d) =>
        d === editingDetalle
          ? {
              ...detalleFormData,
              numeroLinea: d.numeroLinea,
              debe,
              haber,
            }
          : d
      );
    } else {
      const nuevoDetalle = {
        ...detalleFormData,
        numeroLinea: detalles.length + 1,
        debe,
        haber,
      };
      nuevosDetalles = [...detalles, nuevoDetalle];
    }

    setDetalles(nuevosDetalles);
    setShowDetalleDialog(false);
  };

  const handleDeleteDetalle = (detalle) => {
    const nuevosDetalles = detalles
      .filter((d) => d !== detalle)
      .map((d, index) => ({ ...d, numeroLinea: index + 1 }));
    setDetalles(nuevosDetalles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.empresaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una empresa",
        life: 3000,
      });
      return;
    }

    if (!formData.periodoContableId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un período contable",
        life: 3000,
      });
      return;
    }

    if (!formData.glosa) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe ingresar una glosa",
        life: 3000,
      });
      return;
    }

    if (detalles.length > 0 && !formData.estaCuadrado) {
      toast.current?.show({
        severity: "error",
        summary: "Asiento Descuadrado",
        detail: `El asiento no está balanceado. Debe: ${formData.totalDebe.toFixed(
          2
        )}, Haber: ${formData.totalHaber.toFixed(2)}, Diferencia: ${Math.abs(
          formData.diferencia
        ).toFixed(2)}`,
        life: 5000,
      });
      return;
    }

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      periodoContableId: Number(formData.periodoContableId),
      fechaAsiento: formData.fechaAsiento?.toISOString(),
      glosa: formData.glosa,
      tipoLibro: formData.tipoLibro,
      origenAsiento: formData.origenAsiento,
      estadoId: Number(formData.estadoId),
      monedaId: Number(formData.monedaId),
      tipoCambio: formData.tipoCambio ? Number(formData.tipoCambio) : null,
      totalDebe: Number(formData.totalDebe),
      totalHaber: Number(formData.totalHaber),
      diferencia: Number(formData.diferencia),
      estaCuadrado: formData.estaCuadrado,
      detalles:
        detalles.length > 0
          ? detalles.map((d) => ({
              numeroLinea: d.numeroLinea,
              planCuentaId: Number(d.planCuentaId),
              codigoCuenta: d.codigoCuenta,
              nombreCuenta: d.nombreCuenta,
              glosa: d.glosa,
              debe: Number(d.debe || 0),
              haber: Number(d.haber || 0),
              monedaId: Number(formData.monedaId),
              tipoCambio: formData.tipoCambio
                ? Number(formData.tipoCambio)
                : null,
            }))
          : [],
    };

    if (!isEdit) {
      dataToSend.creadoPor = usuario?.personalId;
    } else {
      dataToSend.actualizadoPor = usuario?.personalId;
    }

    setGuardando(true);
    try {
      if (isEdit) {
        await updateAsientoContable(defaultValues.id, dataToSend);
      } else {
        await createAsientoContable(dataToSend);
      }
      onSubmit(dataToSend);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail:
          error.response?.data?.message || "Error al guardar asiento contable",
        life: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const estadoId = Number(formData.estadoId);
  const esPendiente = estadoId === 76;
  const isReadOnly = readOnly || !esPendiente;

  const montoBodyTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(rowData[field] || 0);
  };

  const actionBodyTemplate = (rowData) => {
    if (isReadOnly) return null;
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

  const cuentasOptions = planCuentas.map((c) => ({
    label: `${c.codigoCuenta} - ${c.nombreCuenta}`,
    value: Number(c.id),
  }));

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit} className="p-fluid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
              Empresa <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="empresaId"
              value={formData.empresaId}
              options={empresas.map((e) => ({
                label: e.razonSocial,
                value: Number(e.id),
              }))}
              onChange={(e) => handleChange("empresaId", e.value)}
              placeholder="Seleccione empresa"
              disabled={!!empresaFija || isReadOnly}
              filter
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="periodoContableId" style={{ fontWeight: "bold" }}>
              Período Contable <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="periodoContableId"
              value={formData.periodoContableId}
              options={periodos.map((p) => ({
                label: p.nombrePeriodo,
                value: Number(p.id),
              }))}
              onChange={(e) => handleChange("periodoContableId", e.value)}
              placeholder="Seleccione período"
              disabled={!!periodoFijo || isReadOnly}
              filter
              required
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="fechaAsiento" style={{ fontWeight: "bold" }}>
              Fecha Asiento <span style={{ color: "red" }}>*</span>
            </label>
            <Calendar
              id="fechaAsiento"
              value={formData.fechaAsiento}
              onChange={(e) => handleChange("fechaAsiento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={isReadOnly}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="numeroAsiento">Número Asiento</label>
            <InputText
              id="numeroAsiento"
              value={formData.numeroAsiento}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoLibro">Tipo Libro</label>
            <Dropdown
              id="tipoLibro"
              value={formData.tipoLibro}
              options={[
                { label: "FISCAL", value: "FISCAL" },
                { label: "GERENCIAL", value: "GERENCIAL" },
              ]}
              onChange={(e) => handleChange("tipoLibro", e.value)}
              disabled={isReadOnly}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label htmlFor="monedaId">Moneda</label>
            <Dropdown
              id="monedaId"
              value={formData.monedaId}
              onChange={(e) => handleChange("monedaId", e.value)}
              options={monedas.map((m) => ({
                label: m.descripcion || m.codigoSunat,
                value: Number(m.id),
              }))}
              disabled={isReadOnly}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label htmlFor="tipoCambio">Tipo Cambio</label>
            <InputNumber
              id="tipoCambio"
              value={formData.tipoCambio}
              onValueChange={(e) => handleChange("tipoCambio", e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              disabled={isReadOnly}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="estadoId">Estado</label>
            <Dropdown
              id="estadoId"
              value={formData.estadoId}
              options={estados.map((e) => ({
                label: e.descripcion,
                value: Number(e.id),
              }))}
              disabled
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="glosa" style={{ fontWeight: "bold" }}>
              Glosa <span style={{ color: "red" }}>*</span>
            </label>
            <InputTextarea
              id="glosa"
              value={formData.glosa}
              onChange={(e) => handleChange("glosa", e.target.value)}
              rows={3}
              disabled={isReadOnly}
              required
            />
          </div>
        </div>

        <DataTable
          value={detalles}
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={20}
          rowsPerPageOptions={[20, 40, 80, 160]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
          emptyMessage="No hay detalles agregados"
          style={{
            cursor: !isReadOnly ? "pointer" : "default",
            fontSize: getResponsiveFontSize(),
          }}
          onRowClick={(e) => !isReadOnly && openEditDetalle(e.data)}
          header={
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h5>Detalles del Asiento</h5>
              </div>
              <div style={{ flex: 1 }}>
                {!isReadOnly && (
                  <Button
                    label="Agregar Detalle"
                    icon="pi pi-plus"
                    className="p-button-success"
                    size="small"
                    raised
                    outlined
                    onClick={openNewDetalle}
                    type="button"
                  />
                )}
              </div>
            </div>
          }
        >
          <Column field="numeroLinea" header="#" style={{ width: "5%" }} />
          <Column
            field="codigoCuenta"
            header="Código"
            style={{ width: "10%" }}
          />
          <Column
            field="nombreCuenta"
            header="Cuenta"
            style={{ width: "20%" }}
          />
          <Column field="glosa" header="Glosa" style={{ width: "30%" }} />
          <Column
            header="Debe"
            body={(rowData) => montoBodyTemplate(rowData, "debe")}
            style={{ width: "12%", textAlign: "right" }}
          />
          <Column
            header="Haber"
            body={(rowData) => montoBodyTemplate(rowData, "haber")}
            style={{ width: "12%", textAlign: "right" }}
          />
          {!isReadOnly && (
            <Column
              header="Acciones"
              body={actionBodyTemplate}
              style={{ width: "8%" }}
            />
          )}
        </DataTable>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label>Total Debe</label>
            <InputNumber
              value={formData.totalDebe}
              mode="decimal"
              minFractionDigits={2}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Total Haber</label>
            <InputNumber
              value={formData.totalHaber}
              mode="decimal"
              minFractionDigits={2}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Diferencia</label>
            <InputNumber
              value={formData.diferencia}
              mode="decimal"
              minFractionDigits={2}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Estado Cuadre</label>
            <div className="mt-2">
              {formData.estaCuadrado ? (
                <Tag
                  severity="success"
                  value="CUADRADO"
                  icon="pi pi-check"
                  size="small"
                />
              ) : (
                <Tag
                  severity="danger"
                  value="DESCUADRADO"
                  icon="pi pi-times"
                  size="small"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            severity="secondary"
            size="small"
            raised
            outlined
            onClick={onCancel}
            type="button"
            disabled={loading || guardando}
          />
          <Button
            label={isEdit ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            type="submit"
            loading={loading || guardando}
            disabled={isReadOnly || loading || guardando}
            className="p-button-success"
            severity="success"
            raised
            size="small"
            outlined
          />
        </div>

        <Dialog
          visible={showDetalleDialog}
          style={{ width: "600px" }}
          header={editingDetalle ? "Editar Detalle" : "Nuevo Detalle"}
          modal
          className="p-fluid"
          onHide={() => setShowDetalleDialog(false)}
        >
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
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
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
                rows={3}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="debe">Debe</label>
              <InputNumber
                id="debe"
                value={detalleFormData.debe}
                onValueChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    debe: e.value || 0,
                    haber: 0,
                  })
                }
                mode="currency"
                currency="PEN"
                locale="es-PE"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="haber">Haber</label>
              <InputNumber
                id="haber"
                value={detalleFormData.haber}
                onValueChange={(e) =>
                  setDetalleFormData({
                    ...detalleFormData,
                    haber: e.value || 0,
                    debe: 0,
                  })
                }
                mode="currency"
                currency="PEN"
                locale="es-PE"
              />
            </div>
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowDetalleDialog(false)}
              type="button"
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              className="p-button-primary"
              onClick={handleSaveDetalle}
              type="button"
            />
          </div>
        </Dialog>
      </form>
    </>
  );
}
