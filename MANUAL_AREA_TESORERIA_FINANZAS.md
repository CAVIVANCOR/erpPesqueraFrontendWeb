# 💰 MANUAL DE PROCEDIMIENTOS - ÁREA TESORERÍA Y FINANZAS

**ERP MEGUI - Sistema de Gestión Empresarial**  
**Versión:** 1.0  
**Fecha:** Abril 2026

---

## 📋 ÍNDICE

1. [Responsabilidades del Área](#responsabilidades)
2. [Saldos de Cuentas Corrientes](#saldos-cuentas-corrientes)
3. [Saldo de Caja](#saldo-caja)
4. [Préstamos Bancarios](#prestamos-bancarios)
5. [Movimientos de Caja](#movimientos-caja)
6. [Conciliación Bancaria](#conciliacion-bancaria)
7. [Checklist de Implementación](#checklist)

---

## 🎯 RESPONSABILIDADES DEL ÁREA {#responsabilidades}

El área de Tesorería y Finanzas es responsable de:

- ✅ Registrar saldos iniciales de cuentas corrientes
- ✅ Registrar saldo inicial de caja
- ✅ Registrar préstamos bancarios vigentes
- ✅ Gestionar movimientos de caja diarios
- ✅ Realizar conciliaciones bancarias
- ✅ Controlar flujo de caja
- ✅ Gestionar líneas de crédito
- ✅ Administrar inversiones financieras
- ✅ Verificar asientos contables automáticos

---

## 🏦 SALDOS DE CUENTAS CORRIENTES {#saldos-cuentas-corrientes}

### **PASO 1: Crear Cuentas Corrientes**

**Módulo:** Tesorería → Cuenta Corriente

**Datos requeridos:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Banco | Seleccionar banco | BCP |
| Tipo Cuenta | AHORROS / CORRIENTE | CORRIENTE |
| Número Cuenta | Número de cuenta bancaria | 0012-3456-7890 |
| Moneda | PEN / USD | PEN |
| Empresa | Empresa titular | PESQUERA MEGUI SAC |
| Cuenta Contable | Cuenta del plan contable | 10411 - Banco BCP Soles |
| Estado | ACTIVO | ACTIVO |
| Código SWIFT | Código internacional (opcional) | BCPLPEPL |
| Número CCI | Código interbancario | 00201234567890123456 |

**Procedimiento:**
1. Ingresar al módulo **Tesorería → Cuenta Corriente**
2. Clic en **"Nueva Cuenta"**
3. Completar todos los campos
4. Asignar la cuenta contable correspondiente
5. Guardar
6. **Repetir para cada cuenta bancaria**

---

### **PASO 2: Registrar Saldos Iniciales al 31/12/2025**

**Módulo:** Tesorería → Saldos Cuentas Corrientes

**Preparar tabla de saldos:**

| Banco | Nro Cuenta | Moneda | Saldo al 31/12/2025 | Extracto Bancario |
|-------|------------|--------|---------------------|-------------------|
| BCP | 0012-3456 | PEN | S/. 150,000.00 | Verificado ✅ |
| BBVA | 0089-7654 | USD | $ 25,000.00 | Verificado ✅ |
| Scotiabank | 0045-1122 | PEN | S/. 80,000.00 | Verificado ✅ |
| Interbank | 0067-8899 | USD | $ 15,000.00 | Verificado ✅ |

**Procedimiento:**
1. Obtener extractos bancarios al 31/12/2025
2. Verificar saldos con extractos
3. Ingresar al módulo **Tesorería → Saldos Cuentas Corrientes**
4. Clic en **"Nuevo Saldo"**
5. Completar datos:

| Campo | Valor |
|-------|-------|
| Cuenta Corriente | Seleccionar cuenta |
| Fecha | 31/12/2025 |
| Saldo Contable | Saldo según libros |
| Saldo Bancario | Saldo según extracto |
| Estado | CONCILIADO |
| Observaciones | "Saldo inicial ejercicio 2026" |

6. Guardar
7. **El sistema genera automáticamente el asiento contable:**

```
ASIENTO AUTOMÁTICO:
─────────────────────────────────────────
1041 - Cuentas Corrientes (DEBE)  150,000.00
  591 - Resultados Acumulados (HABER)  150,000.00

Glosa: Saldo inicial Banco BCP Soles al 31/12/2025
```

8. **Repetir para cada cuenta bancaria**

---

### **Verificación:**

```
□ Todos los saldos registrados
□ Saldos coinciden con extractos bancarios
□ Estado: CONCILIADO
□ Asientos automáticos generados
□ Total Bancos en Balance = Suma de saldos registrados
```

---

## 💵 SALDO DE CAJA {#saldo-caja}

### **PASO 1: Registrar Saldo Inicial de Caja**

**Módulo:** Tesorería → Movimientos de Caja

**Datos requeridos:**

| Campo | Valor |
|-------|-------|
| Fecha | 31/12/2025 |
| Tipo Movimiento | "Saldo Inicial Caja" |
| Categoría | INGRESO |
| Monto | Saldo en caja al 31/12/2025 |
| Moneda | PEN |
| Responsable | Cajero(a) |
| Observaciones | "Saldo inicial ejercicio 2026" |
| Estado | APROBADO |

**Procedimiento:**
1. Realizar arqueo de caja al 31/12/2025
2. Documentar el arqueo:

```
ARQUEO DE CAJA - 31/12/2025
─────────────────────────────────────────
Billetes:
  S/. 200.00 x 10 = S/. 2,000.00
  S/. 100.00 x 15 = S/. 1,500.00
  S/. 50.00  x 20 = S/. 1,000.00
  S/. 20.00  x 25 = S/.   500.00

Monedas:
  S/. 5.00   x 20 = S/.   100.00
  S/. 2.00   x 50 = S/.   100.00
  S/. 1.00   x 50 = S/.    50.00

TOTAL CAJA:         S/. 5,250.00
─────────────────────────────────────────
```

3. Ingresar al módulo **Tesorería → Movimientos de Caja**
4. Clic en **"Nuevo Movimiento"**
5. Completar datos según tabla
6. Guardar

**Asiento automático generado:**

```
1011 - Caja (DEBE)  5,250.00
  591 - Resultados Acumulados (HABER)  5,250.00

Glosa: Saldo inicial de caja al 31/12/2025
```

---

## 🏦 PRÉSTAMOS BANCARIOS {#prestamos-bancarios}

### **PASO 1: Preparar Información de Préstamos**

**Documentos necesarios:**
- ✅ Contratos de préstamos
- ✅ Cronogramas de pago
- ✅ Estados de cuenta al 31/12/2025
- ✅ Comprobantes de pago realizados

**Tabla de préstamos vigentes:**

| Banco | Nro Préstamo | Fecha Desembolso | Monto Original | Capital Pagado | **Saldo Capital** | Interés Pagado | **Saldo Interés** | Vencimiento |
|-------|--------------|------------------|----------------|----------------|-------------------|----------------|-------------------|-------------|
| BCP | PREST-001 | 20/06/2024 | S/. 100,000 | S/. 30,000 | **S/. 70,000** | S/. 8,500 | **S/. 1,200** | 20/06/2026 |
| BBVA | PREST-002 | 15/03/2025 | S/. 50,000 | S/. 10,000 | **S/. 40,000** | S/. 3,200 | **S/. 800** | 15/03/2027 |

---

### **PASO 2: Registrar Préstamos Bancarios**

**Módulo:** Finanzas → Préstamo Bancario

**Datos del préstamo:**

#### **A. IDENTIFICACIÓN**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Empresa | Empresa deudora | PESQUERA MEGUI SAC |
| Banco | Banco acreedor | BCP |
| Cuenta Corriente | Cuenta donde se desembolsó | BCP 0012-3456 |
| Número Préstamo | Código interno | PREST-2024-001 |
| Número Contrato | Número del banco | CONT-BCP-789456 |

#### **B. FECHAS**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Fecha Contrato | Firma del contrato | 15/06/2024 |
| Fecha Desembolso | Recepción del dinero | 20/06/2024 |
| Fecha Vencimiento | Fin del préstamo | 20/06/2026 |

#### **C. MONTOS (AL 31/12/2025)**

| Campo | Descripción | Valor |
|-------|-------------|-------|
| Monto Aprobado | Total aprobado | S/. 100,000.00 |
| Monto Desembolsado | Total recibido | S/. 100,000.00 |
| **Capital Pagado** | Lo que YA pagaste | **S/. 30,000.00** |
| **Saldo Capital** | Lo que AÚN debes | **S/. 70,000.00** |
| **Interés Pagado** | Intereses ya pagados | **S/. 8,500.00** |
| **Saldo Interés** | Intereses devengados | **S/. 1,200.00** |
| Moneda | PEN / USD | PEN |

#### **D. CONDICIONES FINANCIERAS**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Tasa Interés Anual | Tasa nominal anual | 18.00% |
| Tasa Efectiva Anual | TEA | 19.56% |
| Tasa Moratoria | Por atraso | 24.00% |
| Comisión Inicial | Apertura | S/. 1,000.00 |
| Seguro Desgravamen | Mensual | S/. 150.00 |

#### **E. PLAZO Y ESTRUCTURA**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Plazo Meses | Duración total | 24 meses |
| Número Cuotas | Total de cuotas | 24 |
| Frecuencia Pago | MENSUAL / TRIMESTRAL | MENSUAL |
| Día de Pago | Día del mes | 20 |
| Período Gracia | Meses solo interés | 0 |

#### **F. TIPO Y CLASIFICACIÓN**

| Campo | Descripción | Opciones |
|-------|-------------|----------|
| Tipo Préstamo | Clasificación | CAPITAL_TRABAJO / ACTIVO_FIJO / HIPOTECARIO |
| Tipo Amortización | Sistema | FRANCES / ALEMAN / AMERICANO |
| Tipo Garantía | Respaldo | HIPOTECARIA / PRENDARIA / FIANZA / SIN_GARANTIA |
| Destino Fondos | Para qué se usó | "Capital de trabajo operativo" |

#### **G. ESTADO**

| Campo | Valor |
|-------|-------|
| Estado | ACTIVO |

---

### **PASO 3: Procedimiento de Registro**

1. Ingresar al módulo **Finanzas → Préstamo Bancario**
2. Clic en **"Nuevo Préstamo"**
3. Completar **TODOS** los campos de las secciones A-G
4. **IMPORTANTE:** En los montos, registrar los valores **AL 31/12/2025**:
   - Capital Pagado = Lo que ya pagaste hasta el 31/12/2025
   - Saldo Capital = Lo que aún debes al 31/12/2025
   - Interés Pagado = Intereses ya pagados
   - Saldo Interés = Intereses devengados pendientes
5. Guardar
6. **Repetir para cada préstamo vigente**

---

### **PASO 4: Asiento Contable Generado**

El sistema genera automáticamente:

```
ASIENTO AUTOMÁTICO:
─────────────────────────────────────────
591 - Resultados Acumulados (DEBE)  70,000.00
  4511 - Préstamos Bancarios CP (HABER)  70,000.00

Glosa: Saldo préstamo BCP PREST-001 al 31/12/2025
```

**⚠️ IMPORTANTE:**
- NO registrar las cuotas pasadas (2024-2025)
- Solo el **saldo al 31/12/2025**
- El sistema generará automáticamente las cuotas futuras (2026)

---

### **Verificación de Préstamos:**

```
□ Todos los préstamos vigentes registrados
□ Saldos coinciden con estados de cuenta bancarios
□ Capital Pagado + Saldo Capital = Monto Desembolsado
□ Estado: ACTIVO
□ Asientos automáticos generados
□ Total Préstamos en Balance = Suma de saldos capital
```

---

## 💸 MOVIMIENTOS DE CAJA {#movimientos-caja}

### **Tipos de Movimientos**

| Tipo | Categoría | Ejemplo |
|------|-----------|---------|
| Ingreso a Caja | INGRESO | Cobro de factura en efectivo |
| Egreso de Caja | EGRESO | Pago a proveedor en efectivo |
| Entrega a Rendir | EGRESO | Adelanto a empleado |
| Rendición de Gastos | INGRESO/EGRESO | Devolución o gasto de adelanto |
| Transferencia a Banco | EGRESO | Depósito en cuenta bancaria |
| Retiro de Banco | INGRESO | Retiro de efectivo del banco |

---

### **Registrar Movimiento de Caja**

**Módulo:** Tesorería → Movimientos de Caja

**Ejemplo: Cobro de factura en efectivo**

| Campo | Valor |
|-------|-------|
| Fecha | Fecha del movimiento |
| Tipo Movimiento | "Cobro Cliente" |
| Categoría | INGRESO |
| Monto | S/. 5,000.00 |
| Moneda | PEN |
| Cliente | Seleccionar cliente |
| Cuenta por Cobrar | Seleccionar CxC (si aplica) |
| Medio Pago | EFECTIVO |
| Responsable | Cajero(a) |
| Observaciones | "Cobro Factura F001-1234" |
| Estado | APROBADO |

**Procedimiento:**
1. Ingresar al módulo **Tesorería → Movimientos de Caja**
2. Clic en **"Nuevo Movimiento"**
3. Completar datos
4. Si es pago de CxC o CxP, vincular con el documento
5. Guardar

**Asiento automático:**

```
1011 - Caja (DEBE)  5,000.00
  1212 - Facturas por Cobrar (HABER)  5,000.00

Glosa: Cobro Factura F001-1234 en efectivo
```

---

### **Arqueo de Caja Diario**

**Procedimiento:**
1. Al final del día, realizar arqueo físico
2. Comparar con saldo del sistema
3. Investigar diferencias
4. Documentar en formato de arqueo
5. Firmar responsable y supervisor

**Formato de arqueo:**

```
ARQUEO DE CAJA - [FECHA]
─────────────────────────────────────────
Saldo Inicial:           S/. 5,250.00
(+) Ingresos del día:    S/. 8,500.00
(-) Egresos del día:     S/. 6,200.00
─────────────────────────────────────────
Saldo Teórico:           S/. 7,550.00

Efectivo Contado:        S/. 7,550.00
─────────────────────────────────────────
Diferencia:              S/.     0.00

Responsable: ____________  Supervisor: ____________
```

---

## 🔄 CONCILIACIÓN BANCARIA {#conciliacion-bancaria}

### **Frecuencia:** Mensual (mínimo)

**Módulo:** Tesorería → Saldos Cuentas Corrientes

**Procedimiento:**

1. **Obtener extracto bancario** del mes
2. **Generar reporte** de movimientos del sistema
3. **Comparar** ambos documentos
4. **Identificar diferencias:**
   - Cheques girados no cobrados
   - Depósitos en tránsito
   - Notas de débito/crédito bancarias
   - Errores de registro

5. **Registrar ajustes** necesarios
6. **Actualizar saldo** en el sistema

**Formato de conciliación:**

```
CONCILIACIÓN BANCARIA - ENERO 2026
Banco: BCP Cuenta: 0012-3456
─────────────────────────────────────────
Saldo según Extracto Bancario:  S/. 155,000.00

(+) Depósitos en tránsito:       S/.   5,000.00
(-) Cheques no cobrados:         S/. (10,000.00)
(+) Nota de crédito no registrada: S/. 2,000.00
(-) Nota de débito no registrada:  S/.  (500.00)
─────────────────────────────────────────
Saldo según Libros:              S/. 151,500.00

Diferencia:                      S/.       0.00
─────────────────────────────────────────
Conciliado por: ____________  Fecha: ____________
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN {#checklist}

### **Semana 1: Preparación**

```
□ Bancos registrados en el sistema
□ Cuentas corrientes creadas
□ Medios de pago configurados
□ Tipos de movimiento de caja creados
□ Responsables de caja asignados
```

### **Semana 2: Saldos Iniciales**

```
□ Extractos bancarios al 31/12/2025 obtenidos
□ Saldos de cuentas corrientes verificados
□ Saldos bancarios registrados en el sistema
□ Arqueo de caja al 31/12/2025 realizado
□ Saldo de caja registrado
□ Asientos automáticos verificados
```

### **Semana 3: Préstamos**

```
□ Contratos de préstamos recopilados
□ Estados de cuenta al 31/12/2025 obtenidos
□ Cronogramas de pago verificados
□ Capital pagado calculado
□ Saldo capital al 31/12/2025 confirmado
□ Préstamos registrados en el sistema
□ Asientos automáticos verificados
```

### **Semana 4: Verificación**

```
□ Total Bancos en Balance = Suma saldos registrados
□ Total Caja en Balance = Saldo caja registrado
□ Total Préstamos en Balance = Suma saldos capital
□ Todos los asientos cuadrados
□ Conciliación bancaria inicial realizada
```

### **Semana 5: Operación**

```
□ Procedimientos de caja implementados
□ Arqueos diarios iniciados
□ Movimientos de caja registrándose correctamente
□ Conciliaciones bancarias programadas
□ Personal capacitado
□ ¡Sistema operativo!
```

---

## 📊 REPORTES IMPORTANTES

| Reporte | Frecuencia | Responsable |
|---------|------------|-------------|
| Saldo de Caja | Diario | Cajero |
| Arqueo de Caja | Diario | Cajero + Supervisor |
| Movimientos Bancarios | Diario | Tesorero |
| Conciliación Bancaria | Mensual | Tesorero |
| Flujo de Caja | Semanal | Jefe Finanzas |
| Estado de Préstamos | Mensual | Jefe Finanzas |
| Proyección Flujo Caja | Mensual | Jefe Finanzas |
