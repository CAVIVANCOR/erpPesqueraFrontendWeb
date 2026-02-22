// src/components/tesoreria/ReporteLineasDisponiblesECharts.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { getReporteLineasDisponibles } from "../../api/tesoreria/lineaCredito";
import { getAllEmpresas } from "../../api/empresa";
import { generarPDFReporteLineasDisponibles, descargarPDFReporte } from "./ReporteLineasDisponiblesPDF";

export default function ReporteLineasDisponiblesECharts() {
  const toast = useRef(null);
  const [reporte, setReporte] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      const data = await getAllEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las empresas",
        life: 3000,
      });
    }
  };

  const cargarReporte = async () => {
    if (!empresaSeleccionada) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Seleccione una empresa",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const data = await getReporteLineasDisponibles(empresaSeleccionada);
      setReporte(data);

      if (!data || !data.resumen || !data.resumen.bancos || data.resumen.bancos.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "Sin resultados",
          detail: "No hay líneas de crédito para esta empresa",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al cargar reporte:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el reporte",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!reporte || !reporte.resumen || !reporte.resumen.bancos || reporte.resumen.bancos.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay datos para exportar",
        life: 3000,
      });
      return;
    }

    setGenerandoPDF(true);
    try {
      const empresaData = empresas.find(e => Number(e.id) === Number(empresaSeleccionada));
      const pdfBytes = await generarPDFReporteLineasDisponibles(reporte, empresaData);
      
      const nombreArchivo = `reporte-lineas-credito-${empresaData?.razonSocial || 'empresa'}.pdf`;
      descargarPDFReporte(pdfBytes, nombreArchivo);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "PDF generado correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo generar el PDF",
        life: 3000,
      });
    } finally {
      setGenerandoPDF(false);
    }
  };

  const formatCurrency = (value, moneda = "USD") => {
    const simbolo = moneda === "USD" ? "$" : "S/";
    return `${simbolo} ${new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0)}`;
  };

  const totales = reporte?.resumen?.totales || { limite: 0, utilizado: 0, disponible: 0, porcentajeUtilizado: 0 };

  // Opciones para gráfico de barras apiladas
  const getBarrasApiladasOptions = () => {
    if (!reporte?.resumen?.bancos) return {};

    const bancos = reporte.resumen.bancos.map(b => b.banco);
    const limites = reporte.resumen.bancos.map(b => b.limite);
    const utilizados = reporte.resumen.bancos.map(b => b.utilizado);
    const disponibles = reporte.resumen.bancos.map(b => b.disponible);

    return {
      title: {
        text: 'Líneas de Crédito por Banco',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#2d3748'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params) {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach(item => {
            result += `${item.marker} ${item.seriesName}: ${formatCurrency(item.value)}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Límite', 'Utilizado', 'Disponible'],
        top: 35,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: bancos,
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => `$${(value / 1000).toFixed(0)}K`
        }
      },
      series: [
        {
          name: 'Límite',
          type: 'bar',
          data: limites,
          itemStyle: {
            color: '#667eea'
          }
        },
        {
          name: 'Utilizado',
          type: 'bar',
          data: utilizados,
          itemStyle: {
            color: '#f5576c'
          }
        },
        {
          name: 'Disponible',
          type: 'bar',
          data: disponibles,
          itemStyle: {
            color: '#4facfe'
          }
        }
      ]
    };
  };

  // Opciones para pie chart 3D
  const getPieChartOptions = () => {
    if (!reporte?.resumen?.bancos) return {};

    const data = reporte.resumen.bancos.map(b => ({
      name: b.banco,
      value: b.utilizado
    }));

    return {
      title: {
        text: 'Distribución de Uso por Banco',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#2d3748'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `<strong>${params.name}</strong><br/>
                  Utilizado: ${formatCurrency(params.value)}<br/>
                  Porcentaje: ${params.percent}%`;
        }
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          fontSize: 11
        }
      },
      series: [
        {
          name: 'Uso por Banco',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '55%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: data
        }
      ]
    };
  };

  // Opciones para gauge charts (uno por banco)
  const getGaugeOptions = (banco) => {
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 10,
          itemStyle: {
            color: banco.porcentajeUtilizado > 80 ? '#f5576c' : 
                   banco.porcentajeUtilizado > 60 ? '#fee140' : '#4facfe'
          },
          progress: {
            show: true,
            width: 18
          },
          pointer: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: 18
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: '#2d3748',
            fontSize: 20,
            fontWeight: 'bold',
            offsetCenter: [0, '0%']
          },
          title: {
            show: true,
            offsetCenter: [0, '80%'],
            fontSize: 12,
            color: '#2d3748'
          },
          data: [
            {
              value: banco.porcentajeUtilizado.toFixed(2),
              name: banco.banco
            }
          ]
        }
      ]
    };
  };

  return (
    <div>
      <Toast ref={toast} />

      <Card>
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label htmlFor="empresa" style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Empresa
              </label>
              <Dropdown
                id="empresa"
                value={empresaSeleccionada}
                options={empresas.map((e) => ({
                  label: e.razonSocial,
                  value: Number(e.id),
                }))}
                onChange={(e) => setEmpresaSeleccionada(e.value)}
                placeholder="Seleccionar empresa"
                filter
                filterBy="label"
                style={{ width: "100%" }}
              />
            </div>

            <Button
              label="Generar Reporte"
              icon="pi pi-search"
              onClick={cargarReporte}
              loading={loading}
              disabled={!empresaSeleccionada}
            />

            <Button
              label="Exportar PDF"
              icon="pi pi-file-pdf"
              className="p-button-success"
              onClick={exportPDF}
              loading={generandoPDF}
              disabled={!reporte || !reporte.resumen || !reporte.resumen.bancos || reporte.resumen.bancos.length === 0}
            />
          </div>
        </div>

        {reporte && reporte.resumen && reporte.resumen.bancos && reporte.resumen.bancos.length > 0 && (
          <>
            {/* SECCIÓN 1: KPIs SUPERIORES */}
            <h2 style={{ marginBottom: "1rem", color: "#2d3748" }}>📊 Resumen de Líneas de Crédito</h2>
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <Card
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Total Límite
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {formatCurrency(totales.limite)}
                </p>
              </Card>

              <Card
                style={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Total Utilizado
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {formatCurrency(totales.utilizado)}
                </p>
              </Card>

              <Card
                style={{
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Total Disponible
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {formatCurrency(totales.disponible)}
                </p>
              </Card>

              <Card
                style={{
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "white",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  % Uso Total
                </h4>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {totales.porcentajeUtilizado.toFixed(2)}%
                </p>
              </Card>
            </div>

            {/* SECCIÓN 2: GRÁFICOS ECHARTS */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", 
              gap: "2rem",
              marginBottom: "2rem" 
            }}>
              <Card>
                <ReactECharts 
                  option={getBarrasApiladasOptions()} 
                  style={{ height: '400px' }}
                  opts={{ renderer: 'svg' }}
                />
              </Card>

              <Card>
                <ReactECharts 
                  option={getPieChartOptions()} 
                  style={{ height: '400px' }}
                  opts={{ renderer: 'svg' }}
                />
              </Card>
            </div>

            {/* SECCIÓN 3: GAUGE CHARTS POR BANCO */}
            <h2 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#2d3748" }}>
              📊 Porcentaje de Utilización por Banco
            </h2>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "1rem",
              marginBottom: "2rem" 
            }}>
              {reporte.resumen.bancos.map((banco, index) => (
                <Card key={index}>
                  <ReactECharts 
                    option={getGaugeOptions(banco)} 
                    style={{ height: '200px' }}
                    opts={{ renderer: 'svg' }}
                  />
                </Card>
              ))}
            </div>

            {/* SECCIÓN 4: TABLA RESUMEN */}
            <h2 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#2d3748" }}>
              📋 Tabla Resumen
            </h2>
            <DataTable
              value={reporte.resumen.bancos}
              responsiveLayout="scroll"
              stripedRows
              style={{ marginBottom: "2rem" }}
            >
              <Column field="banco" header="Banco" sortable />
              <Column field="moneda" header="Moneda" sortable />
              <Column
                field="limite"
                header="Límite"
                sortable
                body={(rowData) => formatCurrency(rowData.limite, rowData.moneda)}
              />
              <Column
                field="utilizado"
                header="Utilizado"
                sortable
                body={(rowData) => formatCurrency(rowData.utilizado, rowData.moneda)}
              />
              <Column
                field="disponible"
                header="Disponible"
                sortable
                body={(rowData) => formatCurrency(rowData.disponible, rowData.moneda)}
              />
              <Column
                field="porcentajeUtilizado"
                header="% Utilizado"
                sortable
                body={(rowData) => `${rowData.porcentajeUtilizado.toFixed(2)}%`}
              />
            </DataTable>

            {/* SECCIÓN 5: DETALLE POR BANCO */}
            <h2 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#2d3748" }}>📋 Detalle por Banco</h2>
            
            {reporte.detalle && reporte.detalle.map((banco, index) => (
              <div key={index} style={{ marginBottom: "2rem" }}>
                <Card style={{ background: "#f8f9fa", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, color: "#2d3748" }}>
                    🏦 {banco.banco}
                  </h3>
                </Card>

                <DataTable
                  value={banco.lineas}
                  responsiveLayout="scroll"
                  stripedRows
                  emptyMessage="No hay líneas de crédito"
                >
                  <Column field="numeroLinea" header="Número Línea" sortable />
                  <Column field="tipoLinea" header="Tipo Línea" sortable />
                  <Column field="moneda" header="Moneda" sortable />
                  <Column
                    field="limite"
                    header="Límite"
                    sortable
                    body={(rowData) => formatCurrency(rowData.limite, rowData.moneda)}
                  />
                  <Column
                    field="utilizado"
                    header="Utilizado"
                    sortable
                    body={(rowData) => formatCurrency(rowData.utilizado, rowData.moneda)}
                  />
                  <Column
                    field="disponible"
                    header="Disponible"
                    sortable
                    body={(rowData) => formatCurrency(rowData.disponible, rowData.moneda)}
                  />
                  <Column
                    field="tasa"
                    header="Tasa %"
                    sortable
                    body={(rowData) => `${rowData.tasa.toFixed(2)}%`}
                  />
                  <Column
                    header="Tipos de Préstamo"
                    body={(rowData) => (
                      <div>
                        {rowData.tiposPrestamo && rowData.tiposPrestamo.map((tipo, idx) => (
                          <div key={idx} style={{ fontSize: "0.85rem" }}>
                            <strong>{tipo.tipo}:</strong> {formatCurrency(tipo.saldo, rowData.moneda)}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </DataTable>
              </div>
            ))}

            {/* SECCIÓN 6: FACTORING INDIRECTO */}
            {reporte.factoring && reporte.factoring.length > 0 && (
              <>
                <h2 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#2d3748" }}>💼 Factoring Indirecto</h2>
                
                {reporte.factoring.map((banco, index) => (
                  <div key={index} style={{ marginBottom: "2rem" }}>
                    <Card style={{ background: "#f8f9fa", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0, color: "#2d3748" }}>
                          🏦 {banco.banco} - {banco.moneda}
                        </h3>
                        <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#2d3748" }}>
                          Total: {formatCurrency(banco.total, banco.moneda)}
                        </div>
                      </div>
                    </Card>

                    <DataTable
                      value={banco.clientes}
                      stripedRows
                      emptyMessage="No hay factoring indirecto"
                    >
                      <Column field="nombre" header="Cliente" sortable />
                      <Column
                        field="monto"
                        header="Monto"
                        sortable
                        body={(rowData) => formatCurrency(rowData.monto, banco.moneda)}
                      />
                    </DataTable>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
