# Ficha Técnica del Proyecto: Juego de Matemáticas "Tira y Afloja"

## 1. Información General
- **Nombre del Proyecto:** Juego Interactivo de Matemáticas - Tira y Afloja
- **Versión:** 1.0.0
- **Desarrollado por:** EDUTEC - UNIFSLB - CICLO VI (con la asistencia de Gemini)
- **Tecnologías Principales:** React (con Vite), JavaScript (ES6+), HTML5, CSS3 (inline styles).

## 2. Descripción Funcional
Juego educativo diseñado para dos jugadores que compiten resolviendo problemas matemáticos. El objetivo es responder correctamente para "jalar la cuerda" hacia el lado de su equipo. El juego termina cuando se alcanza el número máximo de intentos o un jugador pierde todas sus vidas.

## 3. Características Implementadas
- **Pantalla de Inicio:** Permite seleccionar las operaciones matemáticas a practicar (suma, resta, multiplicación, división) antes de comenzar.
- **Modo de Juego Dual:**
    - **Jugador 1 (Equipo 🔴):** Controla el lado izquierdo.
    - **Jugador 2 (Equipo 🔵):** Controla el lado derecho.
- **Sistema de Vidas y Rachas:** Cada jugador cuenta con vidas limitadas y una racha de aciertos que se reinicia al fallar.
- **Power Up:** Al alcanzar una racha de 3 aciertos (`POWER_STREAK`), el jugador activa un "Power Up" que duplica los puntos por respuesta correcta.
- **Controles Duales (Teclado y Ratón):**
    - **Interfaz Gráfica (Ratón/Táctil):** Botones numéricos, de borrado y de envío funcionales para ambos jugadores.
    - **Teclado Físico:** Controles individuales para una experiencia de juego en un solo teclado.
- **Final de Partida:** Muestra una pantalla de resultados con el equipo ganador o un empate, e invita a jugar de nuevo.

## 4. Lógica de Controles por Teclado (`App.jsx`)
Se utiliza un `useEffect` para capturar eventos `keydown`.

- **Jugador 1 (Izquierda):**
    - **Números:** Teclas numéricas del teclado principal.
    - **Enviar Respuesta:** `Control`.
    - **Borrar Dígito:** `Tab`.

- **Jugador 2 (Derecha):**
    - **Números:** Teclas numéricas del Numpad.
    - **Enviar Respuesta:** `Enter` o `NumpadEnter`.
    - **Borrar Dígito:** `Suprimir` (`Delete`).

## 5. Estructura y Componentes Clave (`App.jsx`)
El proyecto está centralizado en un único componente principal para facilitar la gestión del estado.

- **`App` (Componente Principal):**
    - Gestiona todos los estados del juego: `screen`, `score`, `attempts`, `lives`, `streaks`, `questions`, `answers`, etc.
    - Contiene la lógica principal (`startGame`, `handleAnswer`).
    - Renderiza los componentes condicionalmente según la pantalla (`home`, `game`, `result`).
- **`QuestionCard` (Componente Hijo):**
    - Muestra la interfaz de cada jugador: pregunta, vidas, intentos, racha, botones y campo de respuesta.
    - Es un componente reutilizable que recibe sus datos y funciones a través de props desde `App`.
- **`TugVisual` (Componente Visual):**
    - Renderiza la animación central de "tira y afloja" en un elemento `<canvas>`.
- **`AnimatedBackground` y `Confetti`:** Componentes visuales para el fondo animado y los efectos de celebración.

## 6. Constantes Configurables (en `App.jsx`)
- `MAX_ATTEMPTS`: Define el número máximo de intentos por jugador (actualmente `10`).
- `MAX_LIVES`: Número de vidas iniciales (actualmente `3`).
- `POWER_STREAK`: Racha de aciertos para activar el Power Up (actualmente `3`).