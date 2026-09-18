# ClonadorEntidadesDialog - Componente Genérico

## 📋 Descripción

Componente totalmente independiente y reutilizable para clonar cualquier tipo de entidad (productos, clientes, proveedores, servicios, etc.) a múltiples destinos (empresas, sucursales, almacenes, etc.).

## 🎯 Características

- ✅ **Totalmente genérico**: Funciona con cualquier tipo de entidad
- ✅ **Independiente**: No depende de lógica específica de negocio
- ✅ **Configurable**: Personalizable mediante props
- ✅ **Reutilizable**: Puede usarse en cualquier parte del sistema
- ✅ **Profesional**: Incluye validaciones, progreso y resultados detallados

## 📦 Props

### Props Requeridas

| Prop | Tipo | Descripción |
|------|------|-------------|
| `visible` | `boolean` | Controla la visibilidad del diálogo |
| `onHide` | `function` | Callback cuando se cierra el diálogo |
| `entidadesSeleccionadas` | `array` | Array de entidades a clonar |
| `destinosDisponibles` | `array` | Array de destinos disponibles |
| `origenId` | `string\|number` | ID del origen (se excluye de destinos) |
| `onClonar` | `function` | Función que ejecuta la clonación |
| `configuracion` | `object` | Objeto de configuración |
| `toast` | `ref` | Referencia al componente Toast |

### Objeto de Configuración

```javascript
{
  // Textos
  titulo: string,                    // Título del diálogo
  nombreEntidad: string,             // Nombre de la entidad (ej: "Producto")
  nombreDestino: string,             // Nombre del destino (ej: "Empresa")
  mensajeAdvertencia: string,        // Mensaje de advertencia personalizado
  
  // Campos de datos
  campoIdDestino: string,            // Campo ID del destino (ej: "id")
  campoNombreDestino: string,        // Campo nombre del destino (ej: "razonSocial")
  campoSecundarioDestino: string,    // Campo secundario (ej: "ruc")
  campoBusquedaDestino: array,       // Campos para búsqueda (ej: ["razonSocial", "ruc"])
  
  // Iconos
  iconoEntidad: string,              // Icono de PrimeIcons (ej: "pi-box")
  iconoDestino: string,              // Icono de PrimeIcons (ej: "pi-building")
  
  // Renderizado
  renderEntidad: function,           // Función para renderizar cada entidad
  renderResumenEntidad: function,    // Función para renderizar resumen
  
  // Resultados
  columnasResultado: array,          // Columnas para tabla de resultados
}
```

## 🚀 Ejemplos de Uso

### Ejemplo 1: Clonar Productos a Empresas

```javascript
import ClonadorEntidadesDialog from '../components/common/ClonadorEntidadesDialog';
import { clonarProductosAEmpresas } from '../api/producto';

function ProductosPage() {
  const [visible, setVisible] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const toast = useRef(null);

  return (
    <>
      <ClonadorEntidadesDialog
        visible={visible}
        onHide={() => setVisible(false)}
        entidadesSeleccionadas={productosSeleccionados}
        destinosDisponibles={empresas}
        origenId={empresaActualId}
        onClonar={async (productosIds, empresasIds) => {
          const resultado = await clonarProductosAEmpresas(productosIds, empresasIds);
          await recargarProductos();
          return resultado;
        }}
        configuracion={{
          titulo: "Clonar Productos a Otras Empresas",
          nombreEntidad: "Producto",
          nombreDestino: "Empresa",
          campoIdDestino: "id",
          campoNombreDestino: "razonSocial",
          campoSecundarioDestino: "ruc",
          campoBusquedaDestino: ["razonSocial", "ruc"],
          iconoEntidad: "pi-box",
          iconoDestino: "pi-building",
          renderEntidad: (producto) => (
            <div>
              <span className="font-semibold">{producto.codigo}</span> - {producto.nombre}
            </div>
          ),
          columnasResultado: [
            { field: "productoOrigenCodigo", header: "Código" },
            { field: "productoOrigenNombre", header: "Producto" },
            { field: "empresaNombre", header: "Empresa Destino" }
          ]
        }}
        toast={toast}
      />
    </>
  );
}
```

### Ejemplo 2: Clonar Clientes a Sucursales

```javascript
<ClonadorEntidadesDialog
  visible={visible}
  onHide={() => setVisible(false)}
  entidadesSeleccionadas={clientesSeleccionados}
  destinosDisponibles={sucursales}
  origenId={sucursalActualId}
  onClonar={async (clientesIds, sucursalesIds) => {
    return await clonarClientesASucursales(clientesIds, sucursalesIds);
  }}
  configuracion={{
    titulo: "Clonar Clientes a Otras Sucursales",
    nombreEntidad: "Cliente",
    nombreDestino: "Sucursal",
    campoIdDestino: "id",
    campoNombreDestino: "nombre",
    campoSecundarioDestino: "direccion",
    campoBusquedaDestino: ["nombre", "codigo"],
    iconoEntidad: "pi-users",
    iconoDestino: "pi-map-marker",
    renderEntidad: (cliente) => (
      <div>
        <span className="font-semibold">{cliente.razonSocial}</span>
        <small className="text-500 ml-2">RUC: {cliente.ruc}</small>
      </div>
    ),
    columnasResultado: [
      { field: "clienteRuc", header: "RUC" },
      { field: "clienteNombre", header: "Cliente" },
      { field: "sucursalNombre", header: "Sucursal Destino" }
    ]
  }}
  toast={toast}
/>
```

### Ejemplo 3: Clonar Servicios a Almacenes

```javascript
<ClonadorEntidadesDialog
  visible={visible}
  onHide={() => setVisible(false)}
  entidadesSeleccionadas={serviciosSeleccionados}
  destinosDisponibles={almacenes}
  origenId={almacenActualId}
  onClonar={async (serviciosIds, almacenesIds) => {
    return await clonarServiciosAAlmacenes(serviciosIds, almacenesIds);
  }}
  configuracion={{
    titulo: "Clonar Servicios a Otros Almacenes",
    nombreEntidad: "Servicio",
    nombreDestino: "Almacén",
    campoIdDestino: "id",
    campoNombreDestino: "nombre",
    campoSecundarioDestino: "ubicacion",
    campoBusquedaDestino: ["nombre", "codigo", "ubicacion"],
    iconoEntidad: "pi-cog",
    iconoDestino: "pi-warehouse",
    renderEntidad: (servicio) => (
      <div>
        <span className="font-semibold">{servicio.codigo}</span> - {servicio.descripcion}
      </div>
    ),
    columnasResultado: [
      { field: "servicioCodigo", header: "Código" },
      { field: "servicioNombre", header: "Servicio" },
      { field: "almacenNombre", header: "Almacén Destino" }
    ]
  }}
  toast={toast}
/>
```

## 📊 Función onClonar

La función `onClonar` debe:

1. Recibir dos parámetros:
   - `entidadesIds`: Array de IDs de entidades a clonar
   - `destinosIds`: Array de IDs de destinos

2. Ejecutar la lógica de clonación (llamada a API)

3. Retornar un objeto con la siguiente estructura:

```javascript
{
  totalProcesados: number,
  totalExitosos: number,
  totalOmitidos: number,
  totalErrores: number,
  exitosos: [
    {
      // Campos según columnasResultado
      productoOrigenCodigo: "PROD-001",
      productoOrigenNombre: "Producto 1",
      empresaNombre: "Empresa Destino"
    }
  ],
  omitidos: [
    {
      // Campos según columnasResultado + razon
      productoOrigenCodigo: "PROD-002",
      productoOrigenNombre: "Producto 2",
      empresaNombre: "Empresa Destino",
      razon: "Ya existe"
    }
  ],
  errores: [
    {
      // Campos según columnasResultado + error
      productoOrigenCodigo: "PROD-003",
      productoOrigenNombre: "Producto 3",
      empresaNombre: "Empresa Destino",
      error: "Error de validación"
    }
  ]
}
```

## 🎨 Personalización

### Renderizado Personalizado de Entidades

```javascript
renderEntidad: (entidad) => (
  <div className="flex align-items-center">
    <img src={entidad.foto} className="mr-2" style={{ width: '32px' }} />
    <div>
      <div className="font-semibold">{entidad.nombre}</div>
      <small className="text-500">{entidad.categoria}</small>
    </div>
  </div>
)
```

### Columnas de Resultado Personalizadas

```javascript
columnasResultado: [
  { field: "codigo", header: "Código" },
  { field: "nombre", header: "Nombre" },
  { field: "categoria", header: "Categoría" },
  { field: "destino", header: "Destino" },
  { field: "fecha", header: "Fecha" }
]
```

## ⚠️ Consideraciones

1. **Validación de Datos**: El componente no valida los datos, solo los presenta. La validación debe hacerse en la función `onClonar`.

2. **Manejo de Errores**: Los errores deben ser capturados y retornados en el objeto de resultado.

3. **Duplicados**: La lógica de detección de duplicados debe implementarse en el backend.

4. **Permisos**: La validación de permisos debe hacerse en el componente padre antes de mostrar el diálogo.

## 🔧 Requisitos

- PrimeReact >= 9.0.0
- React >= 18.0.0

## 📝 Notas

- El componente es completamente independiente y no tiene dependencias de lógica de negocio
- Puede ser usado en cualquier módulo del sistema
- La configuración es flexible y permite adaptarse a diferentes casos de uso
- Incluye feedback visual profesional (progreso, resultados, estadísticas)
