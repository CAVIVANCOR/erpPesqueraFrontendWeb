// src/components/accesoInstalacion/cards/VehiculoEquiposCard.jsx
// Card moderno para datos de vehículo y equipos del visitante
// Usa Card de PrimeReact para diseño profesional y responsive

import React from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Controller } from "react-hook-form";

/**
 * Card para datos de vehículo y equipos del visitante
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de react-hook-form
 * @param {Function} props.watch - Función watch de react-hook-form
 * @param {Function} props.getFormErrorMessage - Función para obtener mensajes de error
 * @param {Array} props.tiposEquipo - Array de tipos de equipo
 * @param {boolean} props.buscandoVehiculo - Si está buscando vehículo
 * @param {Function} props.onPlacaBlur - Callback cuando se pierde foco en placa
 * @param {boolean} props.accesoSellado - Si el acceso está sellado (deshabilita todos los campos)
 */
const VehiculoEquiposCard = ({
  control,
  watch,
  getFormErrorMessage,
  tiposEquipo,
  buscandoVehiculo,
  onPlacaBlur,
  accesoSellado = false,
}) => {
  return (
    <Card
      title="Vehículo y Equipos"
      subTitle="Información del vehículo y equipos que ingresa el visitante"
    >
      <div className="formgrid grid">
        {/* SECCIÓN VEHÍCULO */}
        {/* Número de Placa */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="vehiculoNroPlaca" className="font-semibold">
              N°Placa
            </label>
            <div className="p-inputgroup">
              <Controller
                name="vehiculoNroPlaca"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="vehiculoNroPlaca"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur(e);
                      if (onPlacaBlur) {
                        onPlacaBlur(e.target.value);
                      }
                    }}
                    placeholder="Número de placa"
                    className="w-full"
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                    disabled={accesoSellado || buscandoVehiculo}
                  />
                )}
              />
              {buscandoVehiculo && (
                <span className="p-inputgroup-addon">
                  <ProgressSpinner
                    style={{ width: "20px", height: "20px" }}
                    strokeWidth="4"
                  />
                </span>
              )}
            </div>
            {getFormErrorMessage("vehiculoNroPlaca")}
          </div>
          {/* Marca del Vehículo */}
          <div style={{ flex: 1 }}>
            <label htmlFor="vehiculoMarca" className="font-semibold">
              Marca
            </label>
            <Controller
              name="vehiculoMarca"
              control={control}
              render={({ field }) => (
                <InputText
                  id="vehiculoMarca"
                  {...field}
                  placeholder="Marca del vehículo"
                  className="w-full"
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  disabled={accesoSellado || buscandoVehiculo}
                />
              )}
            />
            {getFormErrorMessage("vehiculoMarca")}
          </div>

          {/* Modelo del Vehículo */}
          <div style={{ flex: 1 }}>
            <label htmlFor="vehiculoModelo" className="font-semibold">
              Modelo
            </label>
            <Controller
              name="vehiculoModelo"
              control={control}
              render={({ field }) => (
                <InputText
                  id="vehiculoModelo"
                  {...field}
                  placeholder="Modelo del vehículo"
                  className="w-full"
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  disabled={accesoSellado || buscandoVehiculo}
                />
              )}
            />
            {getFormErrorMessage("vehiculoModelo")}
          </div>

          {/* Color del Vehículo */}
          <div style={{ flex: 1 }}>
            <label htmlFor="vehiculoColor" className="font-semibold">
              Color
            </label>
            <Controller
              name="vehiculoColor"
              control={control}
              render={({ field }) => (
                <InputText
                  id="vehiculoColor"
                  {...field}
                  placeholder="Color del vehículo"
                  className="w-full"
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  disabled={accesoSellado || buscandoVehiculo}
                />
              )}
            />
            {getFormErrorMessage("vehiculoColor")}
          </div>
        </div>

        {/* SEPARADOR */}
        <div className="field col-12">
          <hr className="my-4" />
        </div>

        {/* SECCIÓN EQUIPOS */}
        <div className="field col-12">
          <h6 className="text-primary mb-3">📱 Equipos del Visitante</h6>
        </div>

        {/* Tipo de Equipo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="tipoEquipoId" className="font-semibold">
            Tipo de Equipo
          </label>
          <Controller
            name="tipoEquipoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoEquipoId"
                value={field.value}
                options={tiposEquipo}
                onChange={field.onChange}
                placeholder="Seleccione tipo de equipo"
                className="w-full"
                style={{ fontWeight: "bold" }}
                showClear
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("tipoEquipoId")}
        </div>

        {/* Marca del Equipo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="equipoMarca" className="font-semibold">
            Marca del Equipo
          </label>
          <Controller
            name="equipoMarca"
            control={control}
            render={({ field }) => (
              <InputText
                id="equipoMarca"
                {...field}
                placeholder="Marca del equipo"
                className="w-full"
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("equipoMarca")}
        </div>

        {/* Serie del Equipo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="equipoSerie" className="font-semibold">
            Serie del Equipo
          </label>
          <Controller
            name="equipoSerie"
            control={control}
            render={({ field }) => (
              <InputText
                id="equipoSerie"
                {...field}
                placeholder="Serie del equipo"
                className="w-full"
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
                disabled={accesoSellado}
              />
            )}
          />
          {getFormErrorMessage("equipoSerie")}
        </div>

        {/* Información adicional */}
        <div className="field col-12">
          <small className="text-500">
            💡 Los campos de vehículo y equipos son opcionales. Complete solo
            los que apliquen al visitante.
          </small>
        </div>
      </div>
    </Card>
  );
};

export default VehiculoEquiposCard;
