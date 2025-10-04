// src/components/faenaPescaConsumo/InformeFaenaPescaConsumoForm.jsx
// Componente para gestionar informe de FaenaPescaConsumo
import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { Panel } from "primereact/panel";
import { actualizarFaenaPescaConsumo } from "../../api/faenaPescaConsumo";

export default function InformeFaenaPescaConsumoForm({
  faenaData,
  novedadData,
  onFaenaDataChange,
}) {
  const [urlInformeFaena, setUrlInformeFaena] = useState(
    faenaData?.urlInformeFaena || ""
  );
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const handleGuardarUrl = async () => {
    try {
      setLoading(true);

      const payload = {
        ...faenaData,
        urlInformeFaena: urlInformeFaena?.trim() || null,
      };

      await actualizarFaenaPescaConsumo(faenaData.id, payload);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "URL del informe actualizada correctamente",
        life: 3000,
      });

      onFaenaDataChange?.({ ...faenaData, urlInformeFaena: urlInformeFaena });
    } catch (error) {
      console.error("Error al guardar URL:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar la URL del informe",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirInforme = () => {
    if (urlInformeFaena) {
      window.open(urlInformeFaena, "_blank");
    }
  };

  if (!faenaData?.id) {
    return (
      <Card title="Informe de Faena">
        <p className="text-center text-500">
          Debe crear la faena primero para gestionar el informe
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Informe de Faena de Pesca Consumo"
        subTitle="Gestión del informe final de la faena"
      >
        <Toast ref={toast} />

        <Message
          severity="info"
          text="Ingrese la URL del informe de faena generado"
          className="mb-3"
        />

        {/* Resumen de la Faena */}
        <Panel header="Resumen de la Faena" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <p>
                <strong>ID Faena:</strong> {faenaData.id}
              </p>
              <p>
                <strong>Novedad:</strong> {novedadData?.nombre || "N/A"}
              </p>
              <p>
                <strong>Descripción:</strong> {faenaData.descripcion || "N/A"}
              </p>
            </div>
            <div className="col-12 md:col-6">
              <p>
                <strong>Fecha Salida:</strong>{" "}
                {faenaData.fechaSalida
                  ? new Date(faenaData.fechaSalida).toLocaleDateString("es-PE")
                  : "N/A"}
              </p>
              <p>
                <strong>Fecha Descarga:</strong>{" "}
                {faenaData.fechaDescarga
                  ? new Date(faenaData.fechaDescarga).toLocaleDateString("es-PE")
                  : "N/A"}
              </p>
              <p>
                <strong>Toneladas Capturadas:</strong>{" "}
                {faenaData.toneladasCapturadasFaena
                  ? `${Number(faenaData.toneladasCapturadasFaena).toFixed(2)} TM`
                  : "N/A"}
              </p>
            </div>
          </div>
        </Panel>

        <Divider />

        {/* URL del Informe */}
        <div className="grid">
          <div className="col-12">
            <h4>URL del Informe de Faena</h4>
          </div>

          <div className="col-12">
            <label htmlFor="urlInformeFaena" className="block font-medium mb-2">
              URL del Documento
            </label>
            <div className="p-inputgroup">
              <InputText
                id="urlInformeFaena"
                value={urlInformeFaena}
                onChange={(e) => setUrlInformeFaena(e.target.value)}
                placeholder="https://..."
              />
              <Button
                icon="pi pi-external-link"
                className="p-button-info"
                onClick={handleAbrirInforme}
                disabled={!urlInformeFaena}
                tooltip="Abrir informe"
              />
            </div>
          </div>

          <div className="col-12">
            <Button
              label="Guardar URL"
              icon="pi pi-save"
              onClick={handleGuardarUrl}
              loading={loading}
              severity="success"
            />
          </div>
        </div>

        <Divider />

        {/* Información Adicional */}
        <Panel header="Información del Informe" className="mt-4">
          <div className="grid">
            <div className="col-12">
              <p className="text-600">
                El informe de faena debe contener toda la información relevante
                sobre la operación de pesca, incluyendo:
              </p>
              <ul className="text-600">
                <li>Datos generales de la faena</li>
                <li>Personal involucrado (patrón, motorista, tripulantes)</li>
                <li>Embarcación y equipo utilizado</li>
                <li>Calas realizadas y especies capturadas</li>
                <li>Información de descarga</li>
                <li>Documentación verificada</li>
                <li>Observaciones y novedades</li>
              </ul>
            </div>

            {faenaData.urlInformeFaena && (
              <div className="col-12">
                <Message
                  severity="success"
                  text={`Informe registrado: ${faenaData.urlInformeFaena}`}
                />
              </div>
            )}
          </div>
        </Panel>

        {/* Estadísticas Rápidas */}
        <Panel header="Estadísticas de la Faena" className="mt-4">
          <div className="grid">
            <div className="col-12 md:col-3">
              <div className="text-center p-3 border-round bg-blue-50">
                <i className="pi pi-calendar text-4xl text-blue-500 mb-2"></i>
                <div className="text-900 font-bold text-xl">
                  {faenaData.fechaSalida && faenaData.fechaDescarga
                    ? Math.ceil(
                        (new Date(faenaData.fechaDescarga) -
                          new Date(faenaData.fechaSalida)) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0}
                </div>
                <div className="text-600">Días de Faena</div>
              </div>
            </div>

            <div className="col-12 md:col-3">
              <div className="text-center p-3 border-round bg-green-50">
                <i className="pi pi-chart-line text-4xl text-green-500 mb-2"></i>
                <div className="text-900 font-bold text-xl">
                  {faenaData.toneladasCapturadasFaena
                    ? Number(faenaData.toneladasCapturadasFaena).toFixed(2)
                    : "0.00"}
                </div>
                <div className="text-600">Toneladas (TM)</div>
              </div>
            </div>

            <div className="col-12 md:col-3">
              <div className="text-center p-3 border-round bg-orange-50">
                <i className="pi pi-map-marker text-4xl text-orange-500 mb-2"></i>
                <div className="text-900 font-bold text-xl">
                  {faenaData.calas?.length || 0}
                </div>
                <div className="text-600">Calas Realizadas</div>
              </div>
            </div>

            <div className="col-12 md:col-3">
              <div className="text-center p-3 border-round bg-purple-50">
                <i className="pi pi-users text-4xl text-purple-500 mb-2"></i>
                <div className="text-900 font-bold text-xl">
                  {faenaData.tripulantes?.length || 0}
                </div>
                <div className="text-600">Tripulantes</div>
              </div>
            </div>
          </div>
        </Panel>
      </Card>
    </>
  );
}