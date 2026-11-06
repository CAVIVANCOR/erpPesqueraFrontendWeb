## RESUMEN
| ANEXO 3: ESTRUCTURA DE LOS ARCHIVOS DE IMPORTACIÓN DE | Unnamed: 1 |
| --- | --- |
| T - REGISTRO Y DE LA PLANILLA MENSUAL | NaN |
| NaN | NaN |
| DESCRIPCIÓN DE LOS ARCHIVOS DE IMPORTACIÓN | ESTRUCTURA |
| PARA LA IMPORTACIÓN EN T-REGISTRO | ESTRUCTURA |
| - Establecimientos Propios del Empleador". Identifique establecimientos de riesgo SCTR. | 1 |
| - Empleadores a quienes destaco o desplazo personal. | 2 |
| - Empleadores que me destacan o desplazan personal". | 3 |
| - Datos personales del trabajador, pensionista, personal en formación - modalidad formativa laboral y otros y personal de terceros. | 4 |
| - Datos del trabajador. | 5 |
| - Datos del pensionista. | 6 |
| - Datos del personal en formación -  modalidad formativa laboral y otros. | 9 |
| - Datos del personal de terceros. | 10 |
| - Períodos. | 11 |
| - Datos de los establecimientos donde labora el trabajador. | 17 |
| - Lugar de formación de Personal en formación - modalidad formativa laboral y otros y de destaque del Personal de Terceros. | 23 |
| - Datos de estudios concluidos. | 29 |
| - Datos de cuenta de abono de remuneraciones. | 30 |
| - Datos de afiliación a una organización sindical de servidores públicos  (Resolución Ministerial N° 170-2023-TR) | 31 |
| DE USO EXCLUSIVO EN EL REGISTRO DE DERECHOHABIENTES | NaN |
| -  Datos de derechohabientes - ALTAS. | 13 |
| - Baja de derechohabientes - BAJAS. | 24 |
| NaN | NaN |
| PARA LA IMPORTACIÓN EN LA PLANILLA MENSUAL - PLAME | NaN |
| - Prestador de Servicios con Rentas de Cuarta categoría. | 7 |
| - Trabajador: Otras Rentas de Quinta categoría. | 12 |
| - Trabajador: Datos de la jornada laboral. | 14 |
| - Trabajador: Días subsidiados y otros no laborados. | 15 |
| - Trabajador: Detalle de los ingresos, tributos y descuentos. | 18 |
| - Pensionista: Detalle de los ingresos, tributos y descuentos. | 19 |
| - Prestador de Servicios con Rentas de Cuarta categoría: Detalle de comprobantes. | 20 |
| - Personal en Formación - modalidad formativa laboral y otros: Monto pagado. | 21 |
| - Personal de terceros - SCTR ESSALUD. | 22 |
| - Trabajador: Tasas SCTR-EsSalud y/o convenio IES. | 25 |
| - Trabajador: Otras condiciones. | 26 |
| - Pensionista: Otras condiciones. | 27 |
| - Trabajador: Semanas contributivas (trabajadores pesqueros afiliados al REP). | 28 |

## E1 Dec. - Estab. Propios
| ESTRUCTURA 1: "Establecimientos Propios del Empleador" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| Identificar aquellos en los que se desarrolla actividades de riesgo SCTR. Se elaborará este archivo solo si ha repondido que desarolla actividades de riesgo SCTR. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro la información de los establecimientos, indicador de centro de riesgo, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.esp | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que efectúa el registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Código de establecimiento | Texto | 4 | De acuerdo a los datos existentes en el RUC. El aplicativo validará que exista el código del establecimiento en el RUC. Para obtener los códigos que usted registra en el RUC ingrese a la "Consulta RUC" existente en SUNAT Virtual. |
| 2 | Centro de riesgo | Texto | 1 | 0 = No es Centro de Riesgo y  1= Es Centro de Riesgo. |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Este archivo de importación podrá ser importado desde la opción de Registro del Empleador del T-REGISTRO. | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E2 Emp. a quienes destaco
| ESTRUCTURA 2: "Empleadores a quienes destaco o desplazo personal" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro el nombre o razón social de los empleadores a quienes destaco/desplazo personal y el servicio prestado, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.edd | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que efectúa el registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | RUC del empleador a quien destaco o desplazo personal | Texto | 11 | Solo si el empleador a quien destaco o desplazo es domiciliado. |
| 2 | Servicio prestado al empleador al que destaco o desplazo personal | Texto | 6 | Ver tabla 1. |
| 3 | Fecha de inicio de la prestación del servicio | Fecha | - | En formato dd/mm/aaaa. |
| 4 | Fecha de fin de la prestación del servicio | Fecha | - | En formato dd/mm/aaaa. |
| NaN | NaN | NaN | NaN | NaN |
| Para importar información del establecimiento a donde destaca o desplaza personal y el indicador si dicho personal desarrollará actividad de riesgo SCTR, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo : RP\_###########.ldd | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | RUC del empleador a quien destaco o desplazo personal | Texto | 11 | Solo empleador domiciliado. |
| 2 | Código del establecimiento del empleador a donde destaco o desplazo personal. | Texto | 4 | Obtenga los códigos del establecimiento del empleador a quien destaca/desplaza personal ingresando a la "Consulta RUC" existente en SUNAT Virtual. Si el código no existe en el RUC no se carga. |
| 3 | Indicador si personal desarrollará actividad de riesgo SCTR. | Texto | 1 | 0 = No realizará actividad de riesgo\n1 = Realizará actividad  de riesgo. |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Este archivo de importación podrá ser importado desde  la opción de Registro del Empleador  del T-REGISTRO. | NaN | NaN | NaN | NaN |
| - Primero se debe importar el archivo de empleadores a quienes destaco/desplazo y el servicio prestado (RUC y servicio prestado). | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E3 Emp. que me destacan
| ESTRUCTURA 3: "Empleadores que me destacan o desplazan personal" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro el nombre o razón social de los empleadores que me destacan o desplazan personal, así como el servicio recibido, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.med | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que efectúa el registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | RUC del empleador que me destaca o desplaza. | Texto | 11 | Debe existir en Padrón RUC. |
| 2 | Servicio recibido del empleador que me destaca o desplaza personal | Texto | 6 | Ver tabla 1. |
| 3 | Fecha de inicio de la prestación del sevicio | Fecha | - | En formato dd/mm/aaaa. |
| 4 | Fecha de fin de la prestación del sevicio | Fecha | - | En formato dd/mm/aaaa. |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Este archivo de importación podrá ser importado desde la opción de Registro del Empleador del T-REGISTRO. | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E4 Datos Personales
| ESTRUCTURA 4: "Datos personales del trabajador, pensionista, personal en formación - modalidad formativa laboral y personal de terceros" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| Para importar en el T-Registro los datos personales de los trabajadores, pensionistas, personal en formación - modalidad formativa laboral y otros y personal de terceros de un determinado empleador, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo : RP\_###########.ide | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que realizará la inscripción en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Long máxima | Observaciones |
| 1 | Tipo de documento (TD) | Texto | 2 | Ver tabla 3. Dato obligatorio. |
| 2 | N° de documento | Texto | 15 | Dato obligatorio. |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero”. |
| 4 | Fecha de nacimiento | Fecha | - | En formato dd/mm/aaaa. Dato obligatorio. |
| 5 | Apellido paterno | Texto | 40 | Si TD es "01" (DNI), estos datos serán validados con RENIEC. |
| 6 | Apellido materno | Texto | 40 | NaN |
| 7 | Nombres | Texto | 40 | NaN |
| 8 | Sexo | Texto | 1 | 1: masculino / 2: femenino. Dato obligatorio |
| 9 | Nacionalidad | Texto | 4 | Ver tabla 4.  Obligatorio para TD: 04 - Carné Extr. y 07- Pasaporte. |
| 10 | Teléfono - Código Larga Distancia Nacional | Texto | 3 | Ver tabla 29. Dato no vigente a partir del 01 de marzo de 2018. |
| 11 | Teléfono - Número (Teléfono móvil) | Texto | 9 | Dato obligatorio para trabajadores cuya alta se registre en el T-Registro desde el 1 de marzo de 2018. |
| 12 | Correo electrónico | Texto | 50 | Dato obligatorio para trabajadores cuya alta se registre en el T-Registro desde el 1 de marzo de 2018. |
| 13 | Dirección 1 - Tipo de vía | Texto | 2 | Ver tabla 5. |
| 14 | Dirección 1 - Nombre de vía | Texto | 20 | NaN |
| 15 | Dirección 1  - Número de vía | Texto | 4 | NaN |
| 16 | Dirección 1  - Departamento | Texto | 4 | NaN |
| 17 | Dirección 1  - Interior | Texto | 4 | NaN |
| 18 | Dirección 1 - Manzana | Texto | 4 | NaN |
| 19 | Dirección 1  - Lote | Texto | 4 | NaN |
| 20 | Dirección 1  - Kilometro | Texto | 4 | NaN |
| 21 | Dirección 1  - Block | Texto | 4 | NaN |
| 22 | Dirección 1  - Etapa | Texto | 4 | NaN |
| 23 | Dirección 1  - Tipo de zona | Texto | 2 | Ver tabla 6. |
| 24 | Dirección 1 - Nombre de zona | Texto | 20 | NaN |
| 25 | Dirección 1 - Referencia | Texto | 40 | NaN |
| 26 | Dirección 1 - UBIGEO | Texto | 6 | Ver tabla 28. |
| 27 | Dirección 2 - Tipo de vía | Texto | 2 | Ver tabla 5.  La Dirección 2 es opcional. |
| 28 | Dirección 2  - Nombre de vía | Texto | 20 | NaN |
| 29 | Dirección 2 - Número de vía | Texto | 4 | NaN |
| 30 | Dirección 2 - Departamento | Texto | 4 | NaN |
| 31 | Dirección 2 - Interior | Texto | 4 | NaN |
| 32 | Dirección 2 - Manzana | Texto | 4 | NaN |
| 33 | Dirección 2 - Lote | Texto | 4 | NaN |
| 34 | Dirección 2 - Kilometro | Texto | 4 | NaN |
| 35 | Dirección 2 - Block | Texto | 4 | NaN |
| 36 | Dirección 2 - Etapa | Texto | 4 | NaN |
| 37 | Dirección 2 - Tipo de zona | Texto | 2 | Ver tabla 6. |
| 38 | Dirección 2 - Nombre de zona | Texto | 20 | NaN |
| 39 | Dirección 2 - Referencia | Texto | 40 | NaN |
| 40 | Dirección 2 - UBIGEO | Texto | 6 | Ver tabla 28. |
| 41 | Indicador Centro Asistencial EsSalud (solo asegurados al EsSalud) | Texto | 1 | Se registra cuando el Trab/Pens registre 2 direcciones. La dirección que seleccione será tomada por el EsSalud para la asignación a un Centro Asistencial.  Indicará  "1" para señalar la dirección 1 y "2" para la dirección 2. |
| Importante: | NaN | NaN | NaN | NaN |
| - Si el TD es 01: DNI y la información de RENIEC obra en poder de la SUNAT, la información de apellidos y nombres, sexo, estado civil y la primera dirección, será contrastada con SUNAT, tomándose la información de RENIEC como válida. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| - Opcionalmente, el empleador podrá informar una dirección adicional (Dirección 2) para el sujeto a registrar. | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E5 Datos Trabajador
| ESTRUCTURA 5: "Datos del TRABAJADOR" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro la información de los trabajadores de un empleador, incluyendo a prestadores de servicios a que se refiere el numeral ii) y iii) del literal d) del artículo 1° del Decreto Supremo N.° 018-2007-TR y modificatorias, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.tra | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que realizará la inscripción en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador (TD) | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - Carné PTP y 24 - Documento de identidad extranjero. |
| 2 | N.° de documento del trabajador | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero”. |
| 4 | Regimen Laboral (1) | Texto | 2 | Ver tabla 33 |
| 5 | Situación Educativa (2) | Texto | 2 | Ver tabla 9. No aplica a los TT: 23, 66 y 71. |
| 6 | Ocupación | Texto | 6 | Ver tabla 10(S.Púb y otras entid) y T30 (Sector Privado). No aplica a los TT:23, 66 y 71. |
| 7 | Discapacidad | Texto | 1 | 1:Si / 0:No. No aplica al TT 66. |
| 8 | CUSPP | Texto | 12 | Solo para trabajadores afiliados a una AFP. |
| 9 | SCTR Pensión | Texto | 1 | 0:Ninguno / 1:ONP / 2: Cía privada. No se habilita para los TT: 88 y 98. |
| 10 | Tipo de contrato de trabajo/condición laboral (1) | Texto | 2 | Ver tabla 12. |
| 11 | Sujeto a régimen alternativo, acumulativo o atípico de jornada de trabajo y descanso. | Texto | 1 | 1:Si / 0:No. No aplica a los TT: 23, 66 y 71. |
| 12 | Sujeto a jornada de trabajo máxima | Texto | 1 | 1:Si / 0:No. No aplica a los TT: 23, 66 y 71. |
| 13 | Sujeto a horario nocturno | Texto | 1 | 1:Si / 0:No. No aplica a los TT: 23, 66 y 71. |
| 14 | Es sindicalizado (1) | Texto | 1 | 1:Si / 0:No. |
| 15 | Periodicidad de la remuneración o ingreso (1) | Texto | 1 | Ver tabla 13. |
| 16 | Monto de la remuneración básica inicial de los trabajadores sujetos al régimen del D.Leg. 728 | Numérico | 7,2 | Aplicable a los trabajadores que se inscriban a partir de la entrada del T-Registro. |
| 17 | Situación | Texto | 2 | Ver tabla 15. |
| 18 | Rentas de 5ta categoría exoneradas (inciso e) del Art. 19 de la Ley del Impuesto a la Renta) | Texto | 1 | 1:Si / 0:No. No aplica a los TT: 23, 66, 67 y 71. |
| 19 | Situación especial del trabajador | Texto | 1 | Ver tabla 35. No aplica a los TT:23, 66 y 71. |
| 20 | Tipo de pago (1) | Texto | 1 | Ver tabla 16. |
| 21 | Categoría ocupacional del trabajador | Texto | 2 | Ver tabla 24. No aplica a los TT: 19, 20, 21, 23, 66 71, 88, 89, 90, 91 y 98. |
| 22 | Convenio para evitar la doble tributación | Texto | 1 | Ver tabla 25. No aplica a los TT: 23, 66, 67 y 71. |
| 23 | N.° de RUC | Texto | 11 | Solo para los CAS (tipo de trabajador = 67). |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| (1) Datos no aplicables al tipo de trabajador 23, 66, 71 y 73. | NaN | NaN | NaN | NaN |
| (2) Antes Nivel Educativo. Vigente a partir del 01/07/2014. | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| Los datos numéricos deben registrarse sin comas. | NaN | NaN | NaN | NaN |
| Pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo | NaN | NaN | NaN | NaN |

## E6 Datos Pensionista
| ESTRUCTURA 6: "Datos del PENSIONISTA" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro la información de los pensionistas, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo : RP\_###########.pen | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que realizará la inscripción en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del pensionista (TD) | Texto | 2 | Ver tabla 3. Solo TD 01:DNI; 04:C.Extranjería y 07:Pasaporte. |
| 2 | N.° de documento del pensionista | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | ver tabla 26. Solo para TD: 07 - Pasaporte. |
| 4 | Tipo de pensionista | Texto | 2 | Ver tabla 8. Solo tipo 24 y 26. |
| 5 | Régimen pensionario | Texto | 2 | Ver tabla 11. |
| 6 | CUSPP | Texto | 12 | Solo pensionistas de la AFP. Dato opcional. |
| 7 | Tipo de pago | Texto | 1 | Ver tabla 16. |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Se declara como pensionista a quien recibe pensión y es asegurado regular al Régimen Contributivo de la Seguridad Social en Salud - EsSalud. | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E7-PS 4ta
| ESTRUCTURA 7:  Prestadores de Servicios con Rentas de 4ta. Categoría. | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de los prestadores de servicios con rentas de cuarta categoría a que se refiere el numeral i) del literal d) del artículo 1° del Decreto Supremo N.° 018-2007-TR y modificatorias, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.ps4 | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período de la declaración que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo de la declaración que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del  prestador de servicios - 4ta. categoría | Texto | 2 | Ver tabla 3.  Si es Domiciliado, debe registrarse con tipo 06 (RUC). |
| 2 | Número de documento del  prestador de servicios - 4ta. categoría | Texto | 15 | Para RUC, máximo 11 dígitos. |
| 3 | Apellido paterno | Texto | 40 | NaN |
| 4 | Aperllido materno | Texto | 40 | NaN |
| 5 | Nombres | Texto | 40 | NaN |
| 6 | Domiciliado | Texto | 1 | 1: Domiciliado / 2: No domiciliado |
| 7 | Convenio para evitar la doble tributación | Texto | 1 | Ver Tabla 25 |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos deben registrarse sin comas. | NaN | NaN | NaN | NaN |
| - No aplica el tipo de documento Partida de Nacimiento ("11") de la Tabla 3. | NaN | NaN | NaN | NaN |

## E9 Datos-Mod. Formativa
| ESTRUCTURA 9: "Datos del PERSONAL EN FORMACIÓN -  modalidad formativa laboral y otros" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro información del personal en formación - modalidad formativa laboral y otros, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo : RP\_###########.pfl | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que ha suscrito el convenio de formación laboral con las personas a inscribir en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del personal en formación | Texto | 2 | Ver tabla 3. |
| 2 | N.° de documento del personal en formación | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero. |
| 4 | Tipo de modalidad formativa laboral | Texto | 2 | Ver tabla  18. |
| 5 | Seguro Médico (1) | Texto | 1 | 1:ESSALUD / 2:Seguro Privado. |
| 6 | Situación Educativa (2) | Texto | 2 | Ver tabla 9. |
| 7 | Ocupación (1) | Texto | 6 | Ver tabla 10. |
| 8 | Madre con responsabilidad Familiar (1) | Texto | 1 | 1:Sí / 0:No. Se ingresa solo para personal en formación de sexo femenino. |
| 9 | Discapacidad (1) | Texto | 1 | 1:Sí / 0:No. |
| 10 | Tipo de Centro de Formación Profesional (1) | Texto | 1 | 1: Centro Educativo / 2: Universidad / 3:Instituto / 4:Otros. |
| 11 | Sujeto a trabajo en horario nocturno (1) | Texto | 1 | 1:Sí / 0:No. |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| (1) Datos no aplicables a la modalidad SECIGRA. | NaN | NaN | NaN | NaN |
| (2) Antes Nivel Educativo. Vigente a partir del 01/07/2014. | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E10 Datos-Pers. Terceros
| ESTRUCTURA 10: "Datos del PERSONAL DE TERCEROS" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro información del personal de terceros, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.ter | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador declarante que asume el pago del SCTR que realizará la inscripción en el T-Registro, respecto del personal destacado o desplazado. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del personal de terceros | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - Carné PTP y 24 - Documento de identidad extranjero. |
| 2 | N° documento del personal de terceros | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero. |
| 4 | RUC del empleador que me destaca/desplaza personal | Texto | 11 | Este empleador debe encontrarse habilitado en Empleadores que me destacan o desplazan personal. |
| 5 | SCTR Pensión | Texto | 1 | 1:ONP / 2: Seguro Privado. |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E11 - Períodos
| ESTRUCTURA 11: "Datos de períodos" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro los datos que registran periodicidad., elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo : RP\_###########.per | NaN | NaN | NaN | NaN |
| ########## = Es el RUC del empleador que realiza la inscripción en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - Carné PTP y 24 - Documento de identidad extranjero. |
| 2 | N.° de documento | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero. |
| 4 | Categoría | Texto | 1 | Categoría: 1: Trabajador; 2: Pensionista;  4:Personal de Terceros y 5:Personal en Formación-modalidad formativa laboral. |
| 5 | Tipo de registro | Texto | 1 | Tipo de registro: |
| NaN | NaN | NaN | NaN | 1: Período: De vínculo (trabajador), de pensionista, de formación (Personal en Formación modalidad formativa laboral y otros) y de destaque/desplace (Personal de Terceros). |
| NaN | NaN | NaN | NaN | 2: Tipo de trabajador. |
| NaN | NaN | NaN | NaN | 3: Régimen de Aseguramiento de Salud. |
| NaN | NaN | NaN | NaN | 4: Régimen pensionario. |
| NaN | NaN | NaN | NaN | 5: SCTR Salud. |
| 6 | Fecha de inicio o reinicio | Fecha | - | En formato dd/mm/aaaa. |
| 7 | Fecha de fin | Fecha | - | En formato dd/mm/aaaa. |
| 8 | Indicador del tipo de registro a dar de alta o baja. | Texto | 2 | Motivo de fin de período: ver tabla 17. |
| NaN | NaN | NaN | NaN | Tipo de trabajador: ver tabla 8. |
| NaN | NaN | NaN | NaN | Régimen de Aseguramiento de Salud: ver tabla 32. |
| NaN | NaN | NaN | NaN | Régimen Pensionario: ver tabla 11. |
| NaN | NaN | NaN | NaN | SCTR Salud: 1 EsSalud y 2: EPS. |
| 9 | EPS/Servicios Propios | Texto | 1 | Se registrará la EPS cuando se seleccione el Régimen de aseguramiento de salud del tipo 01 y 03.  Ver tabla 14. |

## E12-Trab.Otras Rta5ta
| ESTRUCTURA 12:  Trabajador - Otras Rentas de 5ta. Categoría (del período y regularización) | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Rentas y retenciones del ejercicio | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de los trabajadores que perciben rentas de quinta categoría de otros empleadores, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.or5 | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########## = Es el RUC de la empresa a la que pertenece el trabajador. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP y 24 - Documento de identidad extranjero y 26 - Carné CPP. |
| 2 | Número de documento del trabajador | Texto | 15 | NaN |
| 3 | RUC del otro empleador | Texto | 11 | NaN |
| 4 | Monto de la renta de quinta percibida en el otro empleador. | Numérico | 7,2 | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN |
| - No aplica para los tipos 23, 66, 67, 71 y 73 de la Tabla 8. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Rentas de 5ta Categoría otros empleadores del ejercicio anterior (regularización) | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de los trabajadores que en los meses de enero y febrero informaron haber percibido ingresos de 5ta en el ejercicio anterior, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.REG | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########## = Es el RUC de la empresa a la que pertenece el trabajador (declarante) | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipos  01, 04 , 07 y 09. |
| 2 | Número de documento del trabajador | Texto | 15 | NaN |
| 3 | RUC del otro empleador | Texto | 11 | NaN |
| 4 | Monto de la renta de quinta percibida en otro empleador en el ejercicio anterior - regularización. | Numérico | 7,2 |  |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN |
| - De ingresarse información en el archivo ffffaaaamm###########.REG, deberá ingresa información en la casilla 621 - Renta Quinta Categoría Regul. Ejerc anterior, pudiendo ser cero (0). | NaN | NaN | NaN | NaN |

## E13 Derechohab Alta
| ESTRUCTURA 13: "Importar Datos de derechohabientes - ALTAS" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar información de los derechohabientes de los trabajadores, pensionistas  Prestadores de Servicios a que se refiere el numeral iii) del literal d) del artículo 1° del D.S. N.° 15-2010/TR de un determinado empleador, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo: RD\_RRRRRRRRRRR\_DDMMAAAA\_ALTA.TXT | NaN | NaN | NaN | NaN |
| DONDE: | NaN | NaN | NaN | NaN |
| RD: PREFIJO | NaN | NaN | NaN | NaN |
| RRRRRRRRRRR = Es el RUC del empleador al que pertenece el trabajador o pensionista | NaN | NaN | NaN | NaN |
| DDMMAAAA= Es la fecha en que se va a remitir el archivo a través de SOL. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador o pensionista | Texto | 2 | Ver tabla 3.  Sólo tipos 01, 04 y 07. |
| 2 | Número de documento del trabajador o pensionista | Texto | 15 | NaN |
| 3 | Tipo de documento del derechohabiente | Texto | 2 | Ver tabla 3. Sólo tipos 01, 04 y 07. |
| 4 | Número de documento del derechohabiente | Texto | 15 | NaN |
| 5 | País emisor del documento | Texto | 3 | Ver tabla 26. |
| 6 | Fecha de nacimiento | Fecha | - | En formato dd/mm/aaaa |
| 7 | Apellido paterno del derechohabiente | Texto | 40 | NaN |
| 8 | Apellido materno del derechohabiente | Texto | 40 | NaN |
| 9 | Nombres del derechohabiente | Texto | 40 | NaN |
| 10 | Sexo | Texto | 1 | 1: Masculino / 2:Femenino |
| 11 | Vínculo familiar | Texto | 2 | Ver tabla 19 |
| 12 | Tipo de Documento que acredita el vínculo | Texto | 2 | Ver tabla 27. |
| 13 | N.° de Documento que acredita el vínculo | Texto | 20 | Obligatorio para el vínculo Concubino(a) e Hijo mayor de edad incapacitado permanente. |
| 14 | Mes de concepción | Texto | 6 | Solo para Gestante. En formato mmaaaa. |
| 15 | Dirección 1 del derechohabiente - tipo de vía (1) | Texto | 2 | Ver tabla 5. |
| 16 | Dirección 1 del derechohabiente - Nombre de vía (1) | Texto | 20 | NaN |
| 17 | Dirección 1 del derechohabiente - Número de vía (1) | Texto | 4 | NaN |
| 18 | Dirección 1 del derechohabiente - Departamento (1) | Texto | 4 | NaN |
| 19 | Dirección 1 del derechohabiente - Interior (1) | Texto | 4 | NaN |
| 20 | Dirección 1 del derechohabiente - Manzana (1) | Texto | 4 | NaN |
| 21 | Dirección 1 del derechohabiente - Lote (1) | Texto | 4 | NaN |
| 22 | Dirección 1 del derechohabiente - Kilometro (1) | Texto | 4 | NaN |
| 23 | Dirección 1 del derechohabiente - Block (1) | Texto | 4 | NaN |
| 24 | Dirección 1 del derechohabiente - Etapa (1) | Texto | 4 | NaN |
| 25 | Dirección 1 del derechohabiente - Tipo de zona (1) | Texto | 2 | Ver tabla 6 |
| 26 | Dirección 1 del derechohabiente - Nombre de zona (1) | Texto | 20 | NaN |
| 27 | Dirección 1 del derechohabiente - Referencia (1) | Texto | 40 | NaN |
| 28 | Dirección 1 del derechohabiente - UBIGEO (1) | Texto | 6 | Ver tabla 28 |
| 29 | Dirección 2 del derechohabiente - Tipo de vía | Texto | 2 | Ver tabla 5 |
| 30 | Dirección 2 del derechohabiente - Nombre de vía | Texto | 20 | NaN |
| 31 | Dirección 2 del derechohabiente - Número de vía | Texto | 4 | NaN |
| 32 | Dirección 2 del derechohabiente - Departamento | Texto | 4 | NaN |
| 33 | Dirección 2 del derechohabiente - Interior | Texto | 4 | NaN |
| 34 | Dirección 2 del derechohabiente - Manzana | Texto | 4 | NaN |
| 35 | Dirección 2 del derechohabiente - Lote | Texto | 4 | NaN |
| 36 | Dirección 2 del derechohabiente - Kilometro | Texto | 4 | NaN |
| 37 | Dirección 1 del derechohabiente - Block | Texto | 4 | NaN |
| 38 | Dirección 1 del derechohabiente - Etapa | Texto | 4 | NaN |
| 39 | Dirección 2 del derechohabiente - Tipo de zona | Texto | 2 | Ver tabla 6 |
| 40 | Dirección 2 del derechohabiente - Nombre de zona | Texto | 20 | NaN |
| 41 | Dirección 2 del derechohabiente - Referencia | Texto | 40 | NaN |
| 42 | Dirección 2 del derechohabiente - UBIGEO | Texto | 6 | Ver tabla 28 |
| 43 | Indicador Centro Asistencial EsSalud | Texto | 1 | Se registrará este dato cuando el derechohabiente registre 2 direcciones. Indicará  1 para que se considere la Dirección 1 y 2 cuando se tome como referente la Dirección 2. La dirección que seleccione será considerada por el EsSalud para la asignación del Centro donde le brindará las prestaciones de salud. |
| 44 | Teléfono – código de la ciudad  (larga distancia nacional) | Texto | 2 | Ver tabla 29 |
| 45 | Teléfono – número de teléfono | Texto | 10 | NaN |
| 46 | Correo electrónico | Texto | 50 | Debe contener el símbolo arroba "@". |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| (1) Solo se debe registrar información en los campos del 15 al 28, cuando el derechohabiente se identifique con Pasaporte, Carné de extranjería o DNI de menor de edad. Para DNI de mayores de edad, de consignarse información en la dirección 1, ésta no será registrada. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Adicionalmente, el empleador podrá registrar una segunda dirección para todos los derechohabientes. | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| Los datos numéricos deben registrarse sin comas. | NaN | NaN | NaN | NaN |

## E14 - Trab.JorLab
| ESTRUCTURA 14:  Trabajador - Datos de la Jornada Laboral | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de la jornada laboral por trabajador, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.jor | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########## = Es el RUC de la empresa a la que pertenece el trabajador. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP, 24 - Documento de identidad extranjero y 26 - Carné CPP. |
| 2 | Número de documento del trabajador | Texto | 15 | NaN |
| 3 | Número de horas ordinarias trabajadas | Numérico | 3 | Máximo 360 |
| 4 | Número de minutos ordinarios trabajados | Numérico | 2 | Máximo 59 |
| 5 | Número de horas en sobretiempo trabajadas | Numérico | 3 | Máximo 360 |
| 6 | Número de minutos en sobretiempo trabajados | Numérico | 2 | Máximo 59 |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| Los datos numéricos deben registrarse sin comas. | NaN | NaN | NaN | NaN |
| No aplica para los tipo 66, 71, 88, 98 de la Tabla 8. | NaN | NaN | NaN | NaN |

## E15-Trab.DiaNoLabSub
| ESTRUCTURA 15: Trabajador - Días subsidiados y otros no laborados. | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME información de días subsidiados y otros días no laborados por tipo de suspensión de labores, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.snl | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa a la que pertenece el trabajador. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP , 24 - Documento de identidad extranjero y 26 - Carné CPP. |
| 2 | Número de documento del trabajador | Texto | 15 | NaN |
| 3 | Tipo de suspensión de la relación laboral | Texto | 2 | Ver tabla 21.                                                                      Los Días subsidiados por EsSalud deben registrarse con los tipo 21 y 22.   Los demás tipos de suspensión son Días no laborados y no subsidiados. |
| 4 | Número de días de suspensión de labores | Numérico | 2 | Mínimo 0,  Máximo 31, según el período. |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| - Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos deben registrarse sin comas. | NaN | NaN | NaN | NaN |
| -  Sólo se registran los tipos 21 y 22 cuando el Régimen de Aseguramiento de Salud corresponde a 00, 01, 02, 03 ó 04 de la Tabla 32. | NaN | NaN | NaN | NaN |
| -  No aplica para los tipos 66, 88 y 98 de la Tabla 8. | NaN | NaN | NaN | NaN |

## E17 TraxEst
| ESTRUCTURA 17: "Establecimientos donde labora el trabajador" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Para importar información en el T-Registro de los establecimientos donde labora el trabajador, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo: RP\_###########.est | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que efectua el registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3 |
| 2 | Número de documento del trabajador | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero. |
| 4 | RUC propio o del empleador a quien destaco o desplazo Personal | Texto | 11 | Si labora en establecimiento propio ingrese el RUC del empleador. Si labora en establecimiento de un tercero, ingrese el RUC del empleador al que lo destaca o desplaza. |
| 5 | Código de establecimiento | Texto | 4 | Ingrese el código del establecimiento donde labora, propio o de tercero. De laborar en el establecimiento de un tercero, este previamente debe haber sido seleccionado en Establecimientos donde destaco/Empleadores a quienes destaco o desplazo personal. De no existir el código esta información no se carga. |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| Para obtener los códigos de establecimiento que usted o el empleador a quien destaca o desplaza registran en el RUC, ingrese a la "Consulta RUC" existente en SUNAT Virtual. | NaN | NaN | NaN | NaN |

## E18-Trab.Rem
| ESTRUCTURA 18:  Trabajador - Detalle de ingresos, tributos y descuentos. | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de detalle de los conceptos remunerativos y/o no remunerativos, así como descuentos del trabajador, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.rem | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa a la que pertenece el trabajador | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP, 24 - Documento de identidad extranjero y 26 - Carné CPP. |
| 2 | Número de documento del trabajador | Texto | 15 | NaN |
| 3 | Código de concepto remunerativo y/o no remunerativo | Numérico | 4 | Ver tabla 22. No incluir códigos 0100, 0200, 0300, 0400, 0500, 0600, 0603, 0604, 0607, 0610, 0612, 0616, 0800, 0802, 0804, 0806 y 0808. |
| 4 | Monto devengado | Numérico | 7,2 | Obligatorio si se consignó importe en la columna de monto pagado /descontado. |
| 5 | Monto pagado/descontado | Numérico | 7,2 | Obligatorio si se consignó importe en la columna de monto devengado. |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| -   Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN |
| - Para el caso de los códigos 700s (descuentos), 601, 602, 605, 606, 608, 609, 611, 613, 614, 615, 617, 618, 801, 803, 805, 807, 809, 810 y 811 sólo se considera el monto consignado en la columna pagado/descontado. | NaN | NaN | NaN | NaN |
| - Para registrar los códigos 0601, 0606, 0608 y 0609, el régimen pensionario debe corresponder al Sistema Privado de Pensiones (Ver Tabla 11: tipos 21, 22, 23, 24 y 25). | NaN | NaN | NaN | NaN |
| - Para registrar el concepto 0613, el trabajador debe tener Régimen Pensionario D. Ley 20530  (Ver Tabla 11: tipo 3). | NaN | NaN | NaN | NaN |
| - Para registrar el concepto 0614, el trabajador debe tener Régimen Pensionario del Servicio Diplomático de la República SDR  (Ver Tabla 11: tipo 13). | NaN | NaN | NaN | NaN |
| - Para registrar el concepto 0615, el trabajador debe tener Régimen de Pensioniones Militar - Policial (Ver Tabla 11: tipo 10 ú 11). | NaN | NaN | NaN | NaN |
| - Sólo si empleador es microempresa inscrita en el REMYPE podrá registrar los conceptos 126 ó 127 de la Tabla 22. | NaN | NaN | NaN | NaN |
| - Para el concepto 617 en la columna monto devengado se consignará la base de cálculo y en la columna monto pagado se consignará la cuota retenida.  La base de cálculo corresponde a las remuneraciones devengadas hasta abril de 2012. (Concepto 617 incorporado en la versión 2.3 del PDT PLAME). | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| - El concepto 618 solo aplica para trabajadores con Contrato Administrativo de Servicios - CAS. | NaN | NaN | NaN | NaN |

## E19-Pens.ing
| ESTRUCTURA 19:  Pensionista - Detalle de ingresos, tributos y descuentos | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de ingresos y demás conceptos del pensionista, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.pen | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa a la que pertenece el pensionista. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del pensionista | Texto | 2 | Ver tabla 3.  Sólo tipos 01, 04 y 07. |
| 2 | Número de documento del pensionista | Texto | 15 | NaN |
| 3 | Código de concepto o ingreso | Numérico | 4 | Ver tabla 22. No incluir códigos 0100, 0200, 0300, 0400, 0500, 0600, 0601, 0602, 0604, 0605, 0606, 0607, 0608, 0609, 0610, 0612, 0613, 0614, 0700, 0702, 0704, 0705, 0800, 0801, 0802, 0803, 0804, 0805, 0806, 0807, 0808, 0810, 811. |
| 4 | Monto devengado | Numérico | 7,2 | Obligatorio si se consignó importe en la columna de monto pagado /descontado. |
| 5 | Monto pagado / descontado | Numérico | 7,2 | Obligatorio si se consignó importe en la columna de monto devengado. |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN |
| - Para el caso de los códigos 703, 706, 707, 603, 611 y 809 sólo se considera el monto consignado en la columna pagado/descontado. | NaN | NaN | NaN | NaN |

## E20-PS4.Comp.
| ESTRUCTURA 20:  Prestador de Servicios con Rentas de cuarta categoría - Detalle de comprobantes | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 | Unnamed: 5 |
| --- | --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de comprobantes de prestadores de servicios con rentas de cuarta categoria, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.4ta | NaN | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones | NaN |
| 1 | Tipo de documento del prestador de servicios - 4ta categoría | Texto | 2 | Ver tabla 3.  Si es Domiciliado, debe registrarse con tipo 06 (RUC). | NaN |
| 2 | Número de documento del prestador de servicios - 4ta categoría | Texto | 15 | Para RUC, máximo 11 dígitos. | NaN |
| 3 | Tipo del comprobante emitido | Texto | 1 | Ver tabla 23 | NaN |
| 4 | Serie del comprobante emitido | Alfanumérico | 4 | Si es Recibo por honorarios o Nota de crédito. | NaN |
| 5 | Número del comprobante emitido | Texto | 8 | Si es Recibo por honorarios o Nota de crédito. | NaN |
| 6 | Monto total del servicio | Numérico | 12,2 | NaN | NaN |
| 7 | Fecha de emisión | Fecha | - | En formato dd/mm/aaaa | NaN |
| 8 | Fecha de pago | Fecha | - | En formato dd/mm/aaaa | NaN |
| 9 | Indicador de Retención de Cuarta Categoría | Texto | 1 | 1=SI / 0=NO | NaN |
| 10 | Indicador de Retención a Régimen Pensionario (obligatorio a partir del per. 08/2013). | Texto | 1 | Los valores pueden ser:                                1= Sistema Nacional de Pensiones (ONP)    2= Sistema Privado de Pensiones.       3=Sin retención / No aplica. | Modificado por R.S. N.°  235-2013/SUNAT. |
| 11 | Importe del aporte al Régimen Pensionario | Numérico | 7,2 | Dato obligatorio sólo si campo 10 es "1" o "2".  En caso el campo 10 sea 3, el campo debe estar vacío. | Modificado por R.S. N.°  027-2014/SUNAT. |
| NaN | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN | NaN |
| - No aplica el tipo de documento Partida de Nacimiento ("11") de la Tabla 3. | NaN | NaN | NaN | NaN | NaN |
| - La fecha de pago debe ser mayor o igual a la fecha de emisión, y debe corresponder al período de declaración. | NaN | NaN | NaN | NaN | NaN |

## E21-ModFor.pago
| ESTRUCTURA 21: Modalidad en Formación - Modalidad formativa laboral y Otros - Monto pagado | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de los montos pagados al Personal en Formación - modalidad formativa laboral y otros, elabore un archivo con el siguiente detalle. | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.for | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del personal en formación | Texto | 2 | Ver tabla 3. |
| 2 | Número de documento del personal en formación - modalidad formativa laboral | Texto | 15 | NaN |
| 3 | Monto pagado | Numérico | 7,2 | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN |

## E22-PersTercSCTR
| ESTRUCTURA 22:  Personal de terceros - SCTR ESSALUD | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME la información de detalle de personal de terceros con  SCTR-EsSalud, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.pte | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del personal de terceros | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP, 24 - Documento de identidad extranjero y 26 - Carné CPP. |
| 2 | Número de documento del personal de terceros | Texto | 15 | NaN |
| 3 | Tasa SCTR-EsSalud | Numérico | 3,2 | Desde 0.00  hasta 100.00, solo si SCTR Salud es 1: EsSalud. |
| 4 | Base de cálculo SCTR - EsSalud | Numérico | 7,2 | NaN |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN |

## E23 PFL y PERS TERC
| Unnamed: 0 | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| ESTRUCTURA 23: "Lugar de formación de Personal en Formación - modalidad formativa laboral y otros y de destaque del Personal de Terceros". | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el T-Registro la información de los establecimientos donde se forma el Personal en Formación - modalidad formativa laboral y otros y  el lugar de destaque/desplace del Personal de Terceros, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.lug | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que realiza el registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del personal en formación laboral o del personal de teceros. | Texto | 2 | Ver tabla 3. |
| 2 | Número de documento del personal en formación - modadlidad formativa laboral o del personal de teceros. | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero. |
| 4 | Categoría | Texto | 1 | 4: Personal de Terceros y 5: Personal en Formación - Modalidad Formativa. |
| 5 | Código de establecimiento (solo propios) | Texto | 4 | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E24 Derechohabientes Baja
| ESTRUCTURA 24: "Importar derechohabientes - BAJA" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar información de los derechohabientes a ser dados de baja, elabore un archivo texto. | NaN | NaN | NaN | NaN |
| Nombre del archivo: RD\_RRRRRRRRRRR\_DDMMAAAA\_BAJA.TXT | NaN | NaN | NaN | NaN |
| DONDE: | NaN | NaN | NaN | NaN |
| RD: PREFIJO | NaN | NaN | NaN | NaN |
| RRRRRRRRRRR = Es el RUC del empleador al que pertenece el trabajador o pensionista | NaN | NaN | NaN | NaN |
| DDMMAAAA= Es la fecha en que se va a remitir el archivo a través de SOL. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador o pensionista | Texto | 2 | Ver tabla 3. Solo tipos 01, 04 y 07. |
| 2 | Número de documento del trabajador o pensionista | Texto | 15 | NaN |
| 3 | Tipo de documento del derechohabiente | Texto | 2 | Ver tabla 3. Solo tipos 01, 04 y 07. |
| 4 | Número de documento del derechohabiente | Texto | 15 | NaN |
| 5 | País emisor del documento | Texto | 3 | Ver tabla 26 |
| 6 | Fecha de nacimiento | Fecha | - | En formato dd/mm/aaaa |
| 7 | Apellido paterno del derechohabiente | Texto | 40 | NaN |
| 8 | Apellido materno del derechohabiente | Texto | 40 | NaN |
| 9 | Nombres del derechohabiente | Texto | 40 | NaN |
| 10 | Vínculo familiar | Texto | 2 | Ver tabla 19 |
| 11 | Fecha de baja | Fecha | - | NaN |
| 12 | Motivo de baja | Texto | 2 | Ver tabla 20 |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |

## E25-Trab.SCTR-IES
| ESTRUCTURA 25:  Trabajador - Tasas SCTR-EsSalud y/o convenio IES | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME las tasas aplicables para el IES y el SCTR a cada trabajador, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.tas | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP , 24 - Documento de identidad extranjero y 26 - Carné CPP. |
| 2 | Número de documento del trabajador | Texto | 15 | NaN |
| 3 | Indicador:  SCTR-EsSalud o Convenio IES | Texto | 1 | 1:  SCTR - EsSalud / 2: Convenio IES |
| 4 | Tasa | Numérico | 3,2 | Desde 0.00  hasta 100.00. |
| NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Los datos numéricos pueden ser montos enteros (sin separador decimal). | NaN | NaN | NaN | NaN |
| Si son decimales deben llevar separador (punto decimal) y dos dígitos decimales como máximo. | NaN | NaN | NaN | NaN |
| -  Para el registro de la tasa para el cálculo del aporte al SCTR-EsSalud "1", se validará que el trabajador haya registrado que aporta al SCTR-EsSalud en el T-REGISTRO y que su Régimen de Salud corresponda al tipo 00, 01, 02, 03 y 04 de la Tabla 32. | NaN | NaN | NaN | NaN |
| -  Para el registro de la tasa para el cálculo del aporte al IES por trabajador, se validará que el empleador haya registrado dicha tasa en el módulo Empleadores del PLAME. | NaN | NaN | NaN | NaN |

## E26 Trab.Otras cond.
| ESTRUCTURA 26:  Trabajador - Otras condiciones | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 | Unnamed: 5 |
| --- | --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME los indicadores de otras condiciones de los trabajadores de una determinada empresa, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.toc | NaN | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones | NaN |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP,  24 - Documento de identidad extranjero y 26 - Carné CPP | NaN |
| 2 | Número de documento del trabajador | Texto | 15 | NaN | NaN |
| 3 | Indicador de aporte a Asegura tu Pensión | Texto | 1 | 0: No aporta | Derogado con R.S. N.° 223-2017/SUNAT. |
| 4 | Indicador de aporte a +Vida Seguro de Accidentes | Texto | 1 | 0: No aporta; 1: Aporte a cargo del trabajador y 2: Aporte a cargo del empleador. | Indicador 2: Incorporado 29.9.2022 |
| 5 | Indicador de aporte al Fondo de Derechos Sociales del Artista (FDSA) o de retención de Régimen Pensionario -Ley 29903. | Texto | 1 | Si Tipo de trabajador  es "56"(Artista), dato obligatorio con indicadores:                                                                       1:  CTS,  vacaciones y gratificaciones.                             2: Solo gratificaciones.                                                   Si Tipo de trabajador es 98: (Persona que genera ingresos de 4ta-5ta cat.). dato obligatorio con indicadores:  0:  No retiene y 1:  Sí retiene. | Modificado por R.S. N.°  235-2013/SUNAT. |
| 6 | Domiciliado | Texto | 1 | 1: Domiciliado / 2: No domiciliado | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN | NaN |
| -  El indicador de aporte a Asegura tu Pensión fue recaudado por la SUNAT hasta el periodo Mayo 2017.  (R.S. N.° 223-2017/SUNAT). | NaN | NaN | NaN | NaN | NaN |
| -  El indicador de aporte a + Vida Seguro de Accidentes podrá ser "1" o "2" si el Régimen de Salud es 00, 01, 02, 03 y 04 de la Tabla 32. | NaN | NaN | NaN | NaN | NaN |
| -  De no registrar datos de otras condiciones del trabajador, por defecto se consideran valores "0" (No aporta) en el Indicador de aporte a Asegura tu Pensión y +Vida Seguro de Accidentes, y el valor "1" en  los indicadores de Domiciliado y del Tipo de aporte al FDSA, cuando el tipo de trabajador sea 56 (Artista) de la Tabla 8. | NaN | NaN | NaN | NaN | NaN |

## E27 Pen.Otras cond.
| ESTRUCTURA 27:  Pensionista - Otras condiciones | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME, información adicional de los pensionistas, elabore un archivo texto con el siguiente detalle. | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.poc | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del pensionista | Texto | 2 | Ver tabla 3.  Sólo tipos 01, 04 y 07. |
| 2 | Número de documento del pensionista | Texto | 15 | NaN |
| 3 | Indicador de aporte a +Vida Seguro de Accidentes | Texto | 1 | 1: Aporta / 0: No aporta |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| -  El indicador de aporte a + Vida Seguro de Accidentes podrá ser "1" si el Régimen de Salud es 05 (Tabla 32). | NaN | NaN | NaN | NaN |
| -  De no registrar datos de otras condiciones del pensionista, por defecto se considera el valor "0" (No aporta) en el Indicador de aporte a +Vida Seguro de Accidentes. | NaN | NaN | NaN | NaN |

## E28 Semanas Contrib
| ESTRUCTURA 28:  Trabajador - Semanas contributivas | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 | Unnamed: 5 | Aprobada por RS 027-2014/SUNAT |
| --- | --- | --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN | NaN | NaN |
| Para importar en el PLAME, información adicional de los afiliados al Régimen Especial de Pensiones para los Trabajadores Pesqueros (Ley 30003), elabore un archivo texto con el siguiente detalle. | NaN | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN | NaN |
| Nombre del archivo: ffffaaaamm###########.sec | NaN | NaN | NaN | NaN | NaN | NaN |
| Donde: | NaN | NaN | NaN | NaN | NaN | NaN |
| ffff = Es el código del formulario (0601) | NaN | NaN | NaN | NaN | NaN | NaN |
| aaaa = Es el año del período que se está importando. | NaN | NaN | NaN | NaN | NaN | NaN |
| mm = Es el mes del periodo que se está importando. | NaN | NaN | NaN | NaN | NaN | NaN |
| ########### = Es el RUC de la empresa | NaN | NaN | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto: | NaN |  | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones | NaN | NaN |
| 1 | Tipo de documento del trabajador | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - PTP, 24 - Documento de identidad extranjero y 26 - Carné CPP | NaN | NaN |
| 2 | Número de documento del trabajador | Texto | 15 | NaN | NaN | NaN |
| 3 | Número de semana | Texto | 2 | Campo debe corresponder a la semana a informar en el período de la declaración. | NaN | NaN |
| 4 | Con actividad pesquera o relacionada a esta | Texto | 1 | 1: Si / 0: No | NaN | NaN |
| 5 | Cargo desempeñado en la semana. | Texto | 1 | Si campo 4 es “1”, puede tener los siguientes valores:  1(Patrón), 2 (Segundo patrón), 3 (Motorista), 4 (Segundo motorista), 5 (Cocinero),, 6 (Tripulante), 7 (Otra actividad relacionada a la pesca);  caso contrario, debe ser nulo. | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN | NaN | NaN |
| -  Sólo aplica para los afiliados al Régimen Especial de Pensiones para los trabajadores pesqueros - Ley 30003 (Código 15 de la Tabla 11) | NaN | NaN | NaN | NaN | NaN | NaN |
| -  Las semanas a informar corresponden al cronograma que aprueba la ONP, cuya fecha de término se encuentra comprendida en el periodo de la declaración. | NaN | NaN | NaN | NaN | NaN | NaN |

## E29 Estudios Concluidos
| ESTRUCTURA 29: "Datos de estudios concluidos" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Aprobada por R.M. N.° 107-2014-TR |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar información en el T-Registro de los estudios concluidos del trabajador, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.edu | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que realizará la inscripción en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador (TD) | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI; 04 – Carné de Extranjería; 07 - Pasaporte; 09 - Carné de Solicit. de Refugio; 22 - Carné de Ident.-RR EE; 23 - Carné PTP y 24 - Documento de identidad extranjero. |
| 2 | N.° de documento del trabajador | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero. |
| 4 | Formación Superior Completa (1) | Texto | 2 | Solo indicar Situación Educativa 11 o 13. |
| 5 | Indicador de educación completa en una Institución Educativa del Perú | Texto | 1 | 1: Si / 0: No                                                                                       No aplica para Situación Educativa: 01; 02; 03; 04; 05; 06; 07; 08; 09; 10 y 12.\nSi el indicador es valor "0",  los siguientes campos se deben enviar vacíos (palotes juntos “||”). |
| 6 | Código de la Institución Educativa | Texto | 9 | Ver tabla 34. |
| 7 | Código de la Carrera | Texto | 6 | Ver tabla 34. |
| 8 | Año de Egreso | Texto | 4 | A partir del año 1950. |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| (1) Para Situación Educativa del tipo 14 al 21, deberá indicarse como formación superior completa el tipo 13:"Educación universitaria completa". | NaN | NaN | NaN | NaN |
| No aplica para tipo de trabajador: 23, 66, 71, 73, 88 y 98. | NaN | NaN | NaN | NaN |
| La información del campo Código de la Institución Educativa y siguientes, será necesaria siempre que el trabajador tenga estudios concluidos en una | NaN | NaN | NaN | NaN |
| institución educativa del Perú. | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|". | NaN | NaN | NaN | NaN |

## E30 Cta. Abono Rem.
| ESTRUCTURA 30: "Datos de cuenta de abono de remuneraciones" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar información información en el T-Registro de la empresa del sistema financiero y de la cuenta en la que el empleador  abona al trabajador la remuneración, elabore un archivo texto con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.cta | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que realizará la inscripción en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Nro | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento del trabajador (TD) | Texto | 2 | Ver tabla 3.  Aplica para los tipos de documento del trabajador. |
| 2 | N.° de documento del trabajador | Texto | 15 | NaN |
| 3 | País emisor del documento | Texto | 3 | Observación: Ver tabla 26. Obligatorio para los tipos de documento 07 -  Pasaporte y 24 - Documento de identidad extranjero. |
| 4 | Código de la entidad del sistema financiero | Texto | 3 | Ver tabla 36. |
| 5 | Número de cuenta donde se abona la remuneración | Texto | 20 | Debe contener solo dato numérico. |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| Información obligatoria cuando el Tipo de pago de la remuneración o ingreso es "Depósito en cuenta" | NaN | NaN | NaN | NaN |
| No aplica para tipo de trabajador: 23, 66, 71 y 73. | NaN | NaN | NaN | NaN |
| Los campos deben estar separados por el carácter "|". | NaN | NaN | NaN | NaN |

## E31 Afil a Org.Sind S.Público
| ESTRUCTURA N° 31 - "Datos de Afiliación a un Organización Sindical de Servidores Públicos" | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | Unnamed: 4 |
| --- | --- | --- | --- | --- |
| NaN | NaN | NaN | NaN | NaN |
| Para importar al T-Registro la afiliación de los trabajadores a una Organización Sindical de Servidores Públicos, la entidad pública empleadora, elabora un archivo con el siguiente nombre: | NaN | NaN | NaN | NaN |
| Nombre del archivo :  RP\_###########.aos | NaN | NaN | NaN | NaN |
| ########### = Es el RUC del empleador que realizará la inscripción en el T-Registro. | NaN | NaN | NaN | NaN |
| NaN | NaN | NaN | NaN | NaN |
| Estructura del archivo de texto | NaN | NaN | NaN | NaN |
| Nro. | Descripción | Tipo | Longitud máxima | Observaciones |
| 1 | Tipo de documento de identidad | Texto | 2 | Ver tabla 3. Solo tipo 01 - DNI, 04 - Carné de Extranjería, 07 - Pasaporte, 09 - Carné de Solicit. de Refugio, 22 - Carné de indent. - RR EE, 23 - Carné PTP y 24 - Documento de Identidad Extranjero. |
| 2 | N° de documento de identidad | Texto | 15 | NaN |
| 3 | País emisior del documento | Texto | 3 | Observación: ver tabla 26. Obligatorio para los tipos de documento 07 - Pasaporte y 24 - Documento de identidad Extranjero. |
| 4 | categoría | Texto | 1 | Solo aplica para la categoría: 1: Trabajador. |
| 5 | Código de la Organización Sindical de Servidores Públicos a la que se encuentra el/la Trabajador (a) afiliado (a) | Texto | 8 | Ver Tabla N° 37, denominada: “Organizaciones Sindicales de Servidores Públicos”. |
| 6 | Fecha de Afiliación del Trabajador (a) a la Organización Sindical de Servidores Públicos | Fecha | ----- | En formato dd/mm/aaaa |
| 7 | Fecha de Desafiliación de la Organización Sindical de Servidores Públicos del Trabajador (a) | Fecha | ----- | En formato dd/mm/aaaa |
| NaN | NaN | NaN | NaN | NaN |
| Importante: | NaN | NaN | NaN | NaN |
| -  Los campos deben estar separados por el carácter "|" | NaN | NaN | NaN | NaN |
| - Estructura incorporada con la R.M. N° 170-2023-TR aprobada por el Ministerio de Trabajo y Promoción del Empleo. | NaN | NaN | NaN | NaN |