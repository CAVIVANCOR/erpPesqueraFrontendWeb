// src/components/common/AuditoriaDialog.jsx
/**
 * Componente genérico para mostrar/editar datos de auditoría
 * Funciona con cualquier modelo del sistema
 * 
 * USO EN LISTA (DataTable) - SOLO LECTURA:
 * <AuditoriaDialog
 *   data={rowData}
 *   fieldMapping={{
 *     fechaCreacion: "fechaCreacion",
 *     creadoPor: "creadoPor",
 *     fechaActualizacion: "fechaActualizacion",
 *     actualizadoPor: "actualizadoPor"
 *   }}
 *   usuarios={personalOptions}
 *   buttonProps={{ size: "small", rounded: true, outlined: true }}
 * />
 * 
 * USO EN FORMULARIO - SOLO LECTURA:
 * {isEdit && (
 *   <AuditoriaDialog
 *     data={formData}
 *     fieldMapping={{
 *       fechaCreacion: "fechaCreacion",
 *       creadoPor: "creadoPor",
 *       fechaActualizacion: "fechaActualizacion",
 *       actualizadoPor: "actualizadoPor"
 *     }}
 *     usuarios={personalOptions}
 *     buttonProps={{ label: "Ver Auditoría", className: "p-button-info" }}
 *   />
 * )}
 * 
 * USO EDITABLE (SOLO SUPERUSUARIO):
 * {isEdit && esSuperUsuario && (
 *   <AuditoriaDialog
 *     data={formData}
 *     fieldMapping={{
 *       fechaCreacion: "fechaCreacion",
 *       creadoPor: "creadoPor",
 *       fechaActualizacion: "fechaActualizacion",
 *       actualizadoPor: "actualizadoPor"
 *     }}
 *     usuarios={personalOptions}
 *     editable={true}
 *     onSave={(datosCorregidos) => {
 *       onChange("creadoPor", datosCorregidos.creadoPor);
 *       onChange("actualizadoPor", datosCorregidos.actualizadoPor);
 *       onChange("fechaCreacion", datosCorregidos.fechaCreacion);
 *       onChange("fechaActualizacion", datosCorregidos.fechaActualizacion);
 *     }}
 *     buttonProps={{ 
 *       label: "Editar Auditoría", 
 *       icon: "pi pi-pencil",
 *       className: "p-button-warning" 
 *     }}
 *   />
 * )}
 */

import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Message } from "primereact/message";
import { formatearFecha } from "../../utils/utils";

const AuditoriaDialog = ({
  data = {},
  fieldMapping = {
    fechaCreacion: "fechaCreacion",
    creadoPor: "creadoPor",
    fechaActualizacion: "fechaActualizacion",
    actualizadoPor: "actualizadoPor",
  },
  usuarios = [],
  esSuperUsuario = false, // ← AGREGAR
  onSave = null,
  buttonProps = {},
}) => {
  const [visible, setVisible] = useState(false);
  const [editando, setEditando] = useState(false);

  // Estados para los campos editables
  const [creadoPor, setCreadoPor] = useState(null);
  const [actualizadoPor, setActualizadoPor] = useState(null);
  const [fechaCreacion, setFechaCreacion] = useState(null);
  const [fechaActualizacion, setFechaActualizacion] = useState(null);

  // Valores originales para comparación
  const [valoresOriginales, setValoresOriginales] = useState({});

  // Extraer valores usando el mapeo
  const fechaCreacionOriginal = data[fieldMapping.fechaCreacion];
  const creadoPorOriginal = data[fieldMapping.creadoPor];
  const fechaActualizacionOriginal = data[fieldMapping.fechaActualizacion];
  const actualizadoPorOriginal = data[fieldMapping.actualizadoPor];

  // Cargar valores cuando se abre el diálogo
  useEffect(() => {
    if (visible) {
      const valores = {
        creadoPor: creadoPorOriginal ? Number(creadoPorOriginal) : null,
        actualizadoPor: actualizadoPorOriginal ? Number(actualizadoPorOriginal) : null,
        fechaCreacion: fechaCreacionOriginal ? new Date(fechaCreacionOriginal) : null,
        fechaActualizacion: fechaActualizacionOriginal ? new Date(fechaActualizacionOriginal) : null,
      };

      setCreadoPor(valores.creadoPor);
      setActualizadoPor(valores.actualizadoPor);
      setFechaCreacion(valores.fechaCreacion);
      setFechaActualizacion(valores.fechaActualizacion);
      setValoresOriginales(valores);
      setEditando(false);
    }
  }, [visible, creadoPorOriginal, actualizadoPorOriginal, fechaCreacionOriginal, fechaActualizacionOriginal]);

  // Buscar nombres de usuarios
  const getNombreUsuario = (userId) => {
    if (!userId) return "N/A";
    const usuario = usuarios.find((u) => Number(u.id) === Number(userId));
    return usuario
      ? `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim() ||
      usuario.label ||
      `ID: ${userId}`
      : `ID: ${userId}`;
  };

  // Verificar si hay cambios
  const hayCambios = () => {
    return (
      creadoPor !== valoresOriginales.creadoPor ||
      actualizadoPor !== valoresOriginales.actualizadoPor ||
      fechaCreacion?.getTime() !== valoresOriginales.fechaCreacion?.getTime() ||
      fechaActualizacion?.getTime() !== valoresOriginales.fechaActualizacion?.getTime()
    );
  };

  // Guardar cambios
  const handleGuardar = () => {
    if (onSave && hayCambios()) {
      onSave({
        creadoPor,
        actualizadoPor,
        fechaCreacion,
        fechaActualizacion,
      });
      setVisible(false);
    }
  };

  // Cancelar edición
  const handleCancelar = () => {
    setCreadoPor(valoresOriginales.creadoPor);
    setActualizadoPor(valoresOriginales.actualizadoPor);
    setFechaCreacion(valoresOriginales.fechaCreacion);
    setFechaActualizacion(valoresOriginales.fechaActualizacion);
    setEditando(false);
  };

  // Si no hay datos de auditoría, no mostrar el botón
  if (!fechaCreacionOriginal && !fechaActualizacionOriginal) {
    return null;
  }

  // Props por defecto del botón
  const defaultButtonProps = {
    icon: "pi pi-info-circle",
    tooltip: "Ver datos de auditoría",
    tooltipOptions: { position: "top" },
    className: "p-button-secondary",
    size: "small",
    rounded: true,
    outlined: true,
    ...buttonProps,
  };

  return (
    <>
      <Button
        {...defaultButtonProps}
        onClick={(e) => {
          e.stopPropagation();
          setVisible(true);
        }}
      />

      {/* Botón Editar (solo SuperUsuario) */}
      {esSuperUsuario && onSave && (
        <Button
          icon="pi pi-pencil"
          tooltip="Editar Auditoría (SuperUsuario)"
          tooltipOptions={{ position: "top" }}
          className="p-button-warning"
          size="small"
          outlined
          onClick={(e) => {
            e.stopPropagation();
            setVisible(true);
            setEditando(true); // Abrir directamente en modo edición
          }}
          style={{ marginLeft: "8px" }}
        />
      )}

      <Dialog
        header={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <i
              className={editando ? "pi pi-shield" : "pi pi-info-circle"}
              style={{ fontSize: "1.2rem", color: editando ? "#F59E0B" : "#6B7280" }}
            />
            <span>{editando ? "Editar Auditoría (SuperUsuario)" : "Datos de Auditoría"}</span>
          </div>
        }
        visible={visible}
        style={{ width: esSuperUsuario ? "550px" : "450px" }}
        onHide={() => setVisible(false)}
        modal
        dismissableMask={!editando}
      >
        <div style={{ padding: "10px 0" }}>
          {/* ADVERTENCIA SOLO EN MODO EDITABLE */}
          {esSuperUsuario && editando && (
            <Message
              severity="warn"
              text="⚠️ Solo use esta función para corregir datos incorrectos. Los cambios quedarán registrados."
              style={{ marginBottom: "20px", width: "100%" }}
            />
          )}

          {/* SECCIÓN CREACIÓN */}
          {(fechaCreacion || fechaCreacionOriginal) && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <i
                  className="pi pi-calendar-plus"
                  style={{ fontSize: "1.1rem", color: "#22C55E" }}
                />
                <strong style={{ fontSize: "0.95rem", color: "#22C55E" }}>
                  CREACIÓN
                </strong>
              </div>

              <div style={{ marginLeft: "28px", marginBottom: "16px" }}>
                {/* Fecha Creación */}
                <div style={{ marginBottom: esSuperUsuario ? "12px" : "4px" }}>
                  {esSuperUsuario && (
                    <label
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        fontSize: "0.9rem",
                        color: "#666",
                      }}
                    >
                      📅 Fecha:
                    </label>
                  )}
                  {esSuperUsuario && editando ? (
                    <Calendar
                      value={fechaCreacion}
                      onChange={(e) => setFechaCreacion(e.value)}
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      {!esSuperUsuario && (
                        <span style={{ color: "#666", fontSize: "0.9rem" }}>
                          📅 Fecha:
                        </span>
                      )}
                      <strong style={{ fontSize: "0.9rem" }}>
                        {formatearFecha(editando ? fechaCreacion : fechaCreacionOriginal)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Usuario Creador */}
                {(creadoPor || creadoPorOriginal) && (
                  <div style={{ marginBottom: esSuperUsuario ? "12px" : "0" }}>
                    {esSuperUsuario && (
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "0.9rem",
                          color: "#666",
                        }}
                      >
                        👤 Usuario:
                      </label>
                    )}
                    {esSuperUsuario && editando ? (
                      <Dropdown
                        value={creadoPor}
                        options={usuarios}
                        onChange={(e) => setCreadoPor(e.value)}
                        optionLabel="label"
                        optionValue="id"
                        placeholder="Seleccionar usuario"
                        filter
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {!esSuperUsuario && (
                          <span style={{ color: "#666", fontSize: "0.9rem" }}>
                            👤 Usuario:
                          </span>
                        )}
                        <strong style={{ fontSize: "0.9rem" }}>
                          {getNombreUsuario(editando ? creadoPor : creadoPorOriginal)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* DIVIDER */}
          {(fechaCreacionOriginal || fechaCreacion) && (fechaActualizacionOriginal || fechaActualizacion) && (
            <Divider style={{ margin: "16px 0" }} />
          )}

          {/* SECCIÓN ACTUALIZACIÓN */}
          {(fechaActualizacion || fechaActualizacionOriginal) && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <i
                  className="pi pi-refresh"
                  style={{ fontSize: "1.1rem", color: "#3B82F6" }}
                />
                <strong style={{ fontSize: "0.95rem", color: "#3B82F6" }}>
                  ÚLTIMA ACTUALIZACIÓN
                </strong>
              </div>

              <div style={{ marginLeft: "28px", marginBottom: "16px" }}>
                {/* Fecha Actualización */}
                <div style={{ marginBottom: esSuperUsuario ? "12px" : "4px" }}>
                  {esSuperUsuario && (
                    <label
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        fontSize: "0.9rem",
                        color: "#666",
                      }}
                    >
                      📅 Fecha:
                    </label>
                  )}
                  {esSuperUsuario && editando ? (
                    <Calendar
                      value={fechaActualizacion}
                      onChange={(e) => setFechaActualizacion(e.value)}
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      {!esSuperUsuario && (
                        <span style={{ color: "#666", fontSize: "0.9rem" }}>
                          📅 Fecha:
                        </span>
                      )}
                      <strong style={{ fontSize: "0.9rem" }}>
                        {formatearFecha(editando ? fechaActualizacion : fechaActualizacionOriginal)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Usuario Actualizador */}
                {(actualizadoPor || actualizadoPorOriginal) && (
                  <div style={{ marginBottom: esSuperUsuario ? "12px" : "0" }}>
                    {esSuperUsuario && (
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "0.9rem",
                          color: "#666",
                        }}
                      >
                        👤 Usuario:
                      </label>
                    )}
                    {esSuperUsuario && editando ? (
                      <Dropdown
                        value={actualizadoPor}
                        options={usuarios}
                        onChange={(e) => setActualizadoPor(e.value)}
                        optionLabel="label"
                        optionValue="id"
                        placeholder="Seleccionar usuario"
                        filter
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {!esSuperUsuario && (
                          <span style={{ color: "#666", fontSize: "0.9rem" }}>
                            👤 Usuario:
                          </span>
                        )}
                        <strong style={{ fontSize: "0.9rem" }}>
                          {getNombreUsuario(editando ? actualizadoPor : actualizadoPorOriginal)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* MENSAJE SI NO HAY DATOS */}
          {!fechaCreacionOriginal && !fechaActualizacionOriginal && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#999",
              }}
            >
              <i
                className="pi pi-info-circle"
                style={{ fontSize: "2rem", marginBottom: "10px" }}
              />
              <p>No hay datos de auditoría disponibles</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: esSuperUsuario ? "space-between" : "flex-end",
            marginTop: "20px",
          }}
        >
          {/* Botones izquierda (solo en modo editable) */}
          {esSuperUsuario && (
            <div>
              {!editando ? (
                <Button
                  label="Editar"
                  icon="pi pi-pencil"
                  onClick={() => setEditando(true)}
                  className="p-button-warning"
                  size="small"
                />
              ) : (
                <Button
                  label="Cancelar"
                  icon="pi pi-times"
                  onClick={handleCancelar}
                  className="p-button-secondary"
                  size="small"
                />
              )}
            </div>
          )}

          {/* Botones derecha */}
          <div style={{ display: "flex", gap: "8px" }}>
            {esSuperUsuario && editando && (
              <Button
                label="Guardar"
                icon="pi pi-check"
                onClick={handleGuardar}
                className="p-button-success"
                size="small"
                disabled={!hayCambios()}
              />
            )}
            {(!esSuperUsuario || !editando) && (
              <Button
                label="Cerrar"
                icon="pi pi-times"
                onClick={() => setVisible(false)}
                className="p-button-secondary"
                size="small"
              />
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default AuditoriaDialog;