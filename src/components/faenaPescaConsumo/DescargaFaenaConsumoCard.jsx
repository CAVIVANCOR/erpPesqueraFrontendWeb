// src/components/faenaPescaConsumo/DescargaFaenaConsumoCard.jsx
// Card para gestionar descarga de FaenaPescaConsumo
import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { Controller, useForm } from "react-hook-form";
import {
  getDescargasFaenaConsumo,
  crearDescargaFaenaConsumo,
  actualizarDescargaFaenaConsumo,
} from "../../api/descargaFaenaConsumo";

export default function DescargaFaenaConsumoCard({
  faenaPescaConsumoId,
  novedadPescaConsumoId,
  bahias = [],
  motoristas = [],
  patrones = [],
  puertosDescarga = [],
  clientes = [],
  especies = [],
  onDataChange,
  lastUpdate,
}) {
  const [descarga, setDescarga] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarDescarga();
    }
  }, [faenaPescaConsumoId, lastUpdate]);

  const cargarDescarga = async () => {
    try {
      setLoading(true);
      const data = await getDescargasFaenaConsumo();
      const descargaEncontrada = data.find(
        (d) => Number(d.faenaPescaConsumoId) === Number(faenaPescaConsumoId)
      );
      if (descargaEncontrada) {
        setDescarga(descargaEncontrada);
        reset({
          puertoDescargaId: descargaEncontrada.puertoDescargaId
            ? Number(descargaEncontrada.puertoDescargaId)
            : null,
          fechaHoraArriboPuerto: descargaEncontrada.fechaHoraArriboPuerto
            ? new Date(descargaEncontrada.fechaHoraArriboPuerto)
            : null,
          fechaHoraLlegadaPuerto: descargaEncontrada.fechaHoraLlegadaPuerto
            ? new Date(descargaEncontrada.fechaHoraLlegadaPuerto)
            : null,
          clienteId: descargaEncontrada.clienteId ? Number(descargaEncontrada.clienteId) : null,
          numPlataformaDescarga: descargaEncontrada.numPlataformaDescarga || "",
          turnoPlataformaDescarga: descargaEncontrada.turnoPlataformaDescarga || "",
          fechaHoraInicioDescarga: descargaEncontrada.fechaHoraInicioDescarga
            ? new Date(descargaEncontrada.fechaHoraInicioDescarga)
            : null,
          fechaHoraFinDescarga: descargaEncontrada.fechaHoraFinDescarga
            ? new Date(descargaEncontrada.fechaHoraFinDescarga)
            : null,
          numWinchaPesaje: descargaEncontrada.numWinchaPesaje || "",
          urlComprobanteWincha: descargaEncontrada.urlComprobanteWincha || "",
          patronId: descargaEncontrada.patronId ? Number(descargaEncontrada.patronId) : null,
          motoristaId: descargaEncontrada.motoristaId ? Number(descargaEncontrada.motoristaId) : null,
          bahiaId: descargaEncontrada.bahiaId ? Number(descargaEncontrada.bahiaId) : null,
          latitud: descargaEncontrada.latitud || null,
          longitud: descargaEncontrada.longitud || null,
          combustibleAbastecidoGalones: descargaEncontrada.combustibleAbastecidoGalones || null,
          urlValeAbastecimiento: descargaEncontrada.urlValeAbastecimiento || "",
          urlInformeDescargaProduce: descargaEncontrada.urlInformeDescargaProduce || "",
          observaciones: descargaEncontrada.observaciones || "",
          especieId: descargaEncontrada.especieId ? Number(descargaEncontrada.especieId) : null,
          toneladas: descargaEncontrada.toneladas || null,
          porcentajeJuveniles: descargaEncontrada.porcentajeJuveniles || null,
          fechaHoraFondeo: descargaEncontrada.fechaHoraFondeo
            ? new Date(descargaEncontrada.fechaHoraFondeo)
            : null,
          latitudFondeo: descargaEncontrada.latitudFondeo || null,
          longitudFondeo: descargaEncontrada.longitudFondeo || null,
          puertoFondeoId: descargaEncontrada.puertoFondeoId
            ? Number(descargaEncontrada.puertoFondeoId)
            : null,
        });
      }
    } catch (error) {
      console.error("Error al cargar descarga:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        faenaPescaConsumoId: Number(faenaPescaConsumoId),
        puertoDescargaId: data.puertoDescargaId
          ? Number(data.puertoDescargaId)
          : null,
        fechaHoraArriboPuerto: data.fechaHoraArriboPuerto
          ? new Date(data.fechaHoraArriboPuerto).toISOString()
          : null,
        fechaHoraLlegadaPuerto: data.fechaHoraLlegadaPuerto
          ? new Date(data.fechaHoraLlegadaPuerto).toISOString()
          : null,
        clienteId: data.clienteId ? Number(data.clienteId) : null,
        numPlataformaDescarga: data.numPlataformaDescarga?.trim() || null,
        turnoPlataformaDescarga: data.turnoPlataformaDescarga?.trim() || null,
        fechaHoraInicioDescarga: data.fechaHoraInicioDescarga
          ? new Date(data.fechaHoraInicioDescarga).toISOString()
          : null,
        fechaHoraFinDescarga: data.fechaHoraFinDescarga
          ? new Date(data.fechaHoraFinDescarga).toISOString()
          : null,
        numWinchaPesaje: data.numWinchaPesaje?.trim() || null,
        urlComprobanteWincha: data.urlComprobanteWincha?.trim() || null,
        patronId: data.patronId ? Number(data.patronId) : null,
        motoristaId: data.motoristaId ? Number(data.motoristaId) : null,
        bahiaId: data.bahiaId ? Number(data.bahiaId) : null,
        latitud: data.latitud || null,
        longitud: data.longitud || null,
        combustibleAbastecidoGalones: data.combustibleAbastecidoGalones || null,
        urlValeAbastecimiento: data.urlValeAbastecimiento?.trim() || null,
        urlInformeDescargaProduce: data.urlInformeDescargaProduce?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
        especieId: data.especieId ? Number(data.especieId) : null,
        toneladas: data.toneladas || null,
        porcentajeJuveniles: data.porcentajeJuveniles || null,
        fechaHoraFondeo: data.fechaHoraFondeo
          ? new Date(data.fechaHoraFondeo).toISOString()
          : null,
        latitudFondeo: data.latitudFondeo || null,
        longitudFondeo: data.longitudFondeo || null,
        puertoFondeoId: data.puertoFondeoId ? Number(data.puertoFondeoId) : null,
      };

      if (descarga?.id) {
        await actualizarDescargaFaenaConsumo(descarga.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearDescargaFaenaConsumo(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga creada correctamente",
          life: 3000,
        });
      }

      cargarDescarga();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar descarga:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar la descarga",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!faenaPescaConsumoId) {
    return (
      <Card title="Descarga de Faena">
        <p className="text-center text-500">
          Debe crear la faena primero para gestionar la descarga
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Descarga de Faena"
        subTitle="Información completa de la descarga de la faena"
      >
        <Toast ref={toast} />

        {!descarga && (
          <Message
            severity="info"
            text="Complete los datos de descarga y guarde"
            className="mb-3"
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid">
            {/* SECCIÓN: ARRIBO Y LLEGADA */}
            <div className="col-12">
              <h4>Arribo y Llegada</h4>
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="puertoDescargaId" className="block font-medium mb-2">
                Puerto de Descarga
              </label>
              <Controller
                name="puertoDescargaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="puertoDescargaId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={puertosDescarga}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione puerto"
                    filter
                    showClear
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label
                htmlFor="fechaHoraArriboPuerto"
                className="block font-medium mb-2"
              >
                Fecha/Hora Arribo
              </label>
              <Controller
                name="fechaHoraArriboPuerto"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraArriboPuerto"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showTime
                    hourFormat="24"
                    showIcon
                    placeholder="Seleccione fecha y hora"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label
                htmlFor="fechaHoraLlegadaPuerto"
                className="block font-medium mb-2"
              >
                Fecha/Hora Llegada
              </label>
              <Controller
                name="fechaHoraLlegadaPuerto"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraLlegadaPuerto"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showTime
                    hourFormat="24"
                    showIcon
                    placeholder="Seleccione fecha y hora"
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: PLATAFORMA Y DESCARGA */}
            <div className="col-12">
              <h4>Plataforma y Descarga</h4>
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="clienteId" className="block font-medium mb-2">
                Cliente
              </label>
              <Controller
                name="clienteId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="clienteId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={clientes}
                    optionLabel="razonSocial"
                    optionValue="id"
                    placeholder="Seleccione cliente"
                    filter
                    showClear
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label
                htmlFor="numPlataformaDescarga"
                className="block font-medium mb-2"
              >
                Nº Plataforma
              </label>
              <Controller
                name="numPlataformaDescarga"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numPlataformaDescarga"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Número de plataforma"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label
                htmlFor="turnoPlataformaDescarga"
                className="block font-medium mb-2"
              >
                Turno Plataforma
              </label>
              <Controller
                name="turnoPlataformaDescarga"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="turnoPlataformaDescarga"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Turno"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="fechaHoraInicioDescarga"
                className="block font-medium mb-2"
              >
                Fecha/Hora Inicio Descarga
              </label>
              <Controller
                name="fechaHoraInicioDescarga"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraInicioDescarga"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showTime
                    hourFormat="24"
                    showIcon
                    placeholder="Seleccione fecha y hora"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="fechaHoraFinDescarga"
                className="block font-medium mb-2"
              >
                Fecha/Hora Fin Descarga
              </label>
              <Controller
                name="fechaHoraFinDescarga"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraFinDescarga"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showTime
                    hourFormat="24"
                    showIcon
                    placeholder="Seleccione fecha y hora"
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: WINCHA Y PESAJE */}
            <div className="col-12">
              <h4>Wincha y Pesaje</h4>
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="numWinchaPesaje" className="block font-medium mb-2">
                Nº Wincha de Pesaje
              </label>
              <Controller
                name="numWinchaPesaje"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numWinchaPesaje"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Número de wincha"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="urlComprobanteWincha"
                className="block font-medium mb-2"
              >
                URL Comprobante Wincha
              </label>
              <Controller
                name="urlComprobanteWincha"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="urlComprobanteWincha"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="https://..."
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: PERSONAL */}
            <div className="col-12">
              <h4>Personal</h4>
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="patronId" className="block font-medium mb-2">
                Patrón
              </label>
              <Controller
                name="patronId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="patronId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={patrones}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione patrón"
                    filter
                    showClear
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="motoristaId" className="block font-medium mb-2">
                Motorista
              </label>
              <Controller
                name="motoristaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="motoristaId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={motoristas}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione motorista"
                    filter
                    showClear
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="bahiaId" className="block font-medium mb-2">
                Bahía Comercial
              </label>
              <Controller
                name="bahiaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="bahiaId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={bahias}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione bahía"
                    filter
                    showClear
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: COORDENADAS DESCARGA */}
            <div className="col-12">
              <h4>Coordenadas de Descarga</h4>
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="latitud" className="block font-medium mb-2">
                Latitud
              </label>
              <Controller
                name="latitud"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="latitud"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={6}
                    maxFractionDigits={6}
                    placeholder="0.000000"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="longitud" className="block font-medium mb-2">
                Longitud
              </label>
              <Controller
                name="longitud"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="longitud"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={6}
                    maxFractionDigits={6}
                    placeholder="0.000000"
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: FONDEO */}
            <div className="col-12">
              <h4>Datos de Fondeo</h4>
            </div>

            <div className="col-12 md:col-3">
              <label htmlFor="fechaHoraFondeo" className="block font-medium mb-2">
                Fecha/Hora Fondeo
              </label>
              <Controller
                name="fechaHoraFondeo"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraFondeo"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showTime
                    hourFormat="24"
                    showIcon
                    placeholder="Seleccione fecha y hora"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-3">
              <label htmlFor="puertoFondeoId" className="block font-medium mb-2">
                Puerto de Fondeo
              </label>
              <Controller
                name="puertoFondeoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="puertoFondeoId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={puertosDescarga}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione puerto"
                    filter
                    showClear
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-3">
              <label htmlFor="latitudFondeo" className="block font-medium mb-2">
                Latitud Fondeo
              </label>
              <Controller
                name="latitudFondeo"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="latitudFondeo"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={6}
                    maxFractionDigits={6}
                    placeholder="0.000000"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-3">
              <label htmlFor="longitudFondeo" className="block font-medium mb-2">
                Longitud Fondeo
              </label>
              <Controller
                name="longitudFondeo"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="longitudFondeo"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={6}
                    maxFractionDigits={6}
                    placeholder="0.000000"
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: COMBUSTIBLE */}
            <div className="col-12">
              <h4>Combustible</h4>
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="combustibleAbastecidoGalones"
                className="block font-medium mb-2"
              >
                Combustible Abastecido (Galones)
              </label>
              <Controller
                name="combustibleAbastecidoGalones"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="combustibleAbastecidoGalones"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    placeholder="0.00"
                    suffix=" gal"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="urlValeAbastecimiento"
                className="block font-medium mb-2"
              >
                URL Vale de Abastecimiento
              </label>
              <Controller
                name="urlValeAbastecimiento"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="urlValeAbastecimiento"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="https://..."
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: ESPECIE PRINCIPAL */}
            <div className="col-12">
              <h4>Especie Principal Descargada</h4>
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="especieId" className="block font-medium mb-2">
                Especie
              </label>
              <Controller
                name="especieId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="especieId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={especies}
                    optionLabel="nombreCientifico"
                    optionValue="id"
                    placeholder="Seleccione especie"
                    filter
                    showClear
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="toneladas" className="block font-medium mb-2">
                Toneladas
              </label>
              <Controller
                name="toneladas"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="toneladas"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    placeholder="0.00"
                    suffix=" TM"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-4">
              <label
                htmlFor="porcentajeJuveniles"
                className="block font-medium mb-2"
              >
                % Juveniles
              </label>
              <Controller
                name="porcentajeJuveniles"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="porcentajeJuveniles"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    max={100}
                    placeholder="0.00"
                    suffix=" %"
                  />
                )}
              />
            </div>

            <Divider />

            {/* SECCIÓN: DOCUMENTOS */}
            <div className="col-12">
              <h4>Documentos</h4>
            </div>

            <div className="col-12">
              <label
                htmlFor="urlInformeDescargaProduce"
                className="block font-medium mb-2"
              >
                URL Informe Descarga Produce
              </label>
              <Controller
                name="urlInformeDescargaProduce"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="urlInformeDescargaProduce"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="https://..."
                  />
                )}
              />
            </div>

            {/* Observaciones */}
            <div className="col-12">
              <label htmlFor="observaciones" className="block font-medium mb-2">
                Observaciones
              </label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={4}
                    placeholder="Observaciones sobre la descarga..."
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-content-end mt-4">
            <Button
              type="submit"
              label={descarga ? "Actualizar Descarga" : "Crear Descarga"}
              icon="pi pi-save"
              loading={loading}
              severity="success"
            />
          </div>
        </form>
      </Card>
    </>
  );
}