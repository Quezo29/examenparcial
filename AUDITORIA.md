# Auditoría · Versión B
Código: e4102
Repositorio público propio: https://github.com/Quezo29/examenparcial
Rama: examen/e4102

Los cuatro reportes quedaron resueltos. La semilla se restauró después de las pruebas: Leslie Yepp sigue en Parque Ramsett asociada a La Ardilla del Martes, y El Dragón del Estacionamiento volvió a tipo mitica. El SHA de entrega va en D2L, no en este archivo. Los commits de corrección son los citados en cada reporte.

## B-01 · No se guarda la edición del avistamiento
### Síntoma
Antes, en el avistamiento `65a000000000000000000201` (Leslie Yepp, criatura `65a000000000000000000101`, ubicación Parque Ramsett), un PUT con el cuerpo que armaba el formulario de edición —testigo, ubicación Plaza Lotus, fecha, descripción y `criaturaId` del Dragón— respondió 400 `Campos no permitidos en el cuerpo`. Un GET posterior conservó Parque Ramsett y la criatura original. Evidencia: `evidencias/antes-api.txt`.

### Causa
`frontend/src/paginas/FormularioAvistamiento.tsx` enviaba `criatura` al crear y `criaturaId` al editar. El servicio solo acepta `criatura` en la lista blanca de `cuerpo()`, así que cualquier edición con criatura se rechazaba entera y no se guardaba tampoco la ubicación. La comprobación de referencia inexistente en `avistamientos.service.ts` ya devolvía 404 antes de escribir: un PUT con `criatura` `65a000000000000000000999` respondió 404 y el GET conservó la asociación. Ese camino no había que reescribirlo.

### Cambio
El formulario envía siempre `criatura` junto con el resto de campos del contrato. Commit `f84960983b9272b5b35cd1c1b62ce864a4ab0534`.

### Prueba
PUT del mismo avistamiento con `criatura` `65a000000000000000000102` y ubicación Plaza Lotus: 200. Testigo y descripción no cambiaron. GET devolvió criatura poblada El Dragón del Estacionamiento y ubicación Plaza Lotus. Un PUT siguiente con criatura inexistente: 404 `Criatura referenciada no encontrada`, y el GET siguió en el Dragón y Plaza Lotus. En el navegador, Editar ese avistamiento, elegir el Dragón, escribir Plaza Lotus y Guardar navegó al detalle con esos datos; al recargar siguieron. Después se restauró la semilla. Evidencia: `evidencias/despues-api.txt`, `evidencias/regresion-api.txt`, `evidencias/recorrido-ui.txt`.

### Estado
Resuelto.

## B-02 · El detalle no identifica a la criatura
### Síntoma
Antes, GET `/api/avistamientos/65a000000000000000000201` respondió 200 con `criatura` igual al string `65a000000000000000000101`, sin nombre. El mismo registro en el listado filtrado sí traía el objeto con `nombre` La Ardilla del Martes. `nombreCriatura` en React muestra `ID: …` cuando el valor es string, así que el detalle no identificaba a la criatura. Un id válido inexistente (`…0299`) ya respondía 404 `Avistamiento no encontrado`. Evidencia: `evidencias/antes-api.txt`.

### Causa
`obtener` en `backend/src/services/avistamientos.service.ts` hacía `findById` sin `populate('criatura')`. `listar` sí poblaba la referencia. El tipo `Avistamiento.criatura` ya admite objeto, string o null, y el detalle usa `nombreCriatura` y `idCriatura`; el dato del GET no coincidía con ese uso.

### Cambio
`obtener` popula `criatura` antes de responder. Si no hay documento, sigue el 404. Commit `91eb047a89b584b3630abd07ccca7b10d34ed574`.

### Prueba
GET del avistamiento `…0201`: 200 y `criatura.nombre` = La Ardilla del Martes. GET `…0299`: 404. GET con id mal formado: 400 `Identificador inválido`. En `/avistamientos/65a000000000000000000201` el texto de la ficha fue `Criatura / La Ardilla del Martes`. En `/avistamientos/65a000000000000000000299` la página mostró `Avistamiento no encontrado` y el encabezado, sin pantalla en blanco. Evidencia: `evidencias/despues-api.txt`, `evidencias/recorrido-ui.txt`.

### Estado
Resuelto.

## B-03 · Se acepta un tipo de criatura inválido
### Síntoma
Antes, PUT `/api/criaturas/65a000000000000000000101` con `{"tipo":"fantasma"}` respondió 200 y el GET quedó con tipo fantasma. El selector HTML solo ofrece mitica, elemental, mecanica y espectral, pero no protege a la API. Se restauró de inmediato a elemental para no dejar la semilla inválida. Evidencia: `evidencias/antes-api.txt`.

### Causa
`actualizar` en `backend/src/services/criaturas.service.ts` usaba `findByIdAndUpdate` sin `runValidators`. Mongoose no aplica el `enum` del esquema en una actualización salvo que se pida. `create` sí valida, por eso el fallo era solo del PUT. El servicio no contrastaba `tipo` con `TIPOS` antes de escribir.

### Cambio
Si el cuerpo trae `tipo` y no está en mitica, elemental, mecanica o espectral, el servicio lanza 400 y no escribe. La actualización también usa `runValidators: true` para el resto de reglas del esquema. Commit `bd32537ecbd0dd456b12e55e5845dbab67d9ac72`.

### Prueba
PUT del Dragón (`…0102`) con tipo mecanica: 200 y el nombre y el peligro se conservaron. PUT con fantasma: 400 `Tipo inválido: solo se admiten mitica, elemental, mecanica y espectral`. GET posterior: tipo mecanica. Más tarde, con el tipo elemental guardado desde el formulario, otro PUT fantasma volvió a 400 y el GET siguió en elemental. Se restauró mitica. En la UI, Editar el Dragón y guardar tipo elemental mostró la ficha con Tipo elemental. Evidencia: `evidencias/despues-api.txt`, `evidencias/regresion-api.txt`, `evidencias/recorrido-ui.txt`.

### Estado
Resuelto.

## B-04 · El filtro de avistamientos no actualiza
### Síntoma
Antes, en Avistamientos el selector cambiaba `criaturaId`, pero la lista no se volvía a pedir hasta pulsar Actualizar lista. El efecto de `frontend/src/paginas/ListaAvistamientos.tsx` dependía solo de `recarga`.

### Causa
`listarAvistamientos(criaturaId)` se ejecutaba dentro de un `useEffect` con dependencias `[recarga]`. React no volvía a correr el efecto al cambiar el selector, así que la petición seguía usando la selección anterior.

### Cambio
El efecto depende de `[criaturaId, recarga]`. El botón Actualizar lista se mantiene. Cargando, error y vacío ya los distinguía `EstadoCarga`. Commit `92f267a8ac7754aa5587403a4f0fa8e3592dc303`.

### Prueba
En http://127.0.0.1:5173/avistamientos, sin pulsar Actualizar lista: Dragón mostró solo Tom Haverford; Brillo, solo April Ludgate; una criatura creada sin avistamientos (`Criatura Sin Avistamientos`, luego borrada) mostró `No hay resultados para esta consulta.`; Todas restauró los cuatro registros. Al abrir la página se vio `Cargando...`. Con el backend detenido, cambiar el selector mostró `Error: HTTP 500` y ocultó la lista; al reiniciar el backend y pulsar Actualizar lista volvió Tom Haverford para el Dragón. Evidencia: `evidencias/recorrido-ui.txt`.

### Estado
Resuelto.

## Recorrido integrado y regresión
1. Filtrar por Dragón mostró solo su avistamiento.
2. El detalle de Leslie, antes de editarlo, mostró La Ardilla del Martes.
3. La edición cambió la criatura al Dragón y la ubicación a Plaza Lotus, con testigo y descripción iguales.
4. La recarga confirmó Dragón y Plaza Lotus.
5. El formulario guardó tipo elemental en el Dragón (200).
6. `fantasma` respondió 400 y el GET conservó elemental.
Regresión: POST de criatura válida 201; DELETE de esa criatura sin avistamientos 204 y el GET siguiente 404; DELETE de la Ardilla, que tiene avistamientos, 409 `Elimina primero los avistamientos asociados`. `npm run check` en la raíz terminó sin errores de TypeScript. La semilla quedó restaurada.
