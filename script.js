"use strict";

/* =========================================================
   MICROSTOCK - FRONTEND
   ========================================================= */

const API_URL = "http://localhost:3000";

/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

function obtenerToken() {

    return sessionStorage.getItem(
        "microstock_token"
    );

}


/* =========================================================
   PETICIONES API
   ========================================================= */

async function apiFetch(endpoint, options = {}) {

    const token =
        obtenerToken();

    const headers = {
        ...(options.headers || {})
    };

    if (options.body) {

        headers["Content-Type"] =
            "application/json";

    }

    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }

    const respuesta =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );


    if (respuesta.status === 401) {

        sessionStorage.removeItem(
            "microstock_token"
        );

        sessionStorage.removeItem(
            "microstock_user"
        );

        alert(
            "La sesión ha expirado. Debe iniciar sesión nuevamente."
        );

        window.location.href =
            "login.html";

        return respuesta;

    }

    return respuesta;

}


/* =========================================================
   RESPUESTA JSON
   ========================================================= */

async function obtenerJSON(respuesta) {

    try {

        return await respuesta.json();

    } catch (error) {

        return {
            success: false,
            error:
                "Respuesta inválida del servidor."
        };

    }

}
/* =========================================================
   VENTAS
   ========================================================= */

let productosVenta = [];


/* =========================================================
   UTILIDADES
   ========================================================= */

function getToken() {

    return sessionStorage.getItem(
        "microstock_token"
    );

}


function getUsuarioActual() {

    try {

        return JSON.parse(
            sessionStorage.getItem(
                "microstock_user"
            )
        );

    } catch (error) {

        return null;

    }

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


function validarEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );

}


async function getJSON(response) {

    try {

        return await response.json();

    } catch (error) {

        return {

            success: false,

            message:
                "Respuesta inválida del servidor."

        };

    }

}


/* =========================================================
   PETICIONES API
   ========================================================= */

async function apiFetch(
    endpoint,
    options = {}
) {

    const token =
        getToken();


    const headers = {
        ...(options.headers || {})
    };


    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response =
        await fetch(

            `${API_URL}${endpoint}`,

            {
                ...options,
                headers
            }

        );


    if (
        response.status === 401
    ) {

        sessionStorage.removeItem(
            "microstock_token"
        );

        sessionStorage.removeItem(
            "microstock_user"
        );


        if (
            !window.location.pathname.endsWith(
                "login.html"
            )
        ) {

            window.location.href =
                "login.html";

        }

    }


    return response;

}


/* =========================================================
   MENSAJES
   ========================================================= */

function showMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        type === "success"

            ? "form-message success-message"

            : "form-message error-message";

}


function clearMessage(element) {

    if (!element) {
        return;
    }


    element.textContent =
        "";

    element.className =
        "form-message";

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    sessionStorage.removeItem(
        "microstock_token"
    );

    sessionStorage.removeItem(
        "microstock_user"
    );


        window.location.href =
        "login.html";

}


/* =========================================================
   CAMBIO 3: EDITAR / ELIMINAR (UTILIDADES COMUNES)
   ========================================================= */

// ¿El usuario con sesión es Administrador? Solo decide qué botones se
// muestran; la seguridad real la aplica el backend (middleware soloAdmin).
function esAdministrador() {

    const usuario =
        getUsuarioActual();

    return (
        Boolean(usuario) &&
        String(usuario.nombre_rol || "")
            .trim()
            .toLowerCase() === "administrador"
    );

}


// Obtiene el mensaje más útil de una respuesta del backend
function mensajeDeRespuesta(data, porDefecto) {

    if (data) {

        if (
            Array.isArray(data.errors) &&
            data.errors.length > 0 &&
            data.errors[0].message
        ) {

            return data.errors[0].message;

        }

        if (data.mensaje) return data.mensaje;
        if (data.error) return data.error;
        if (data.message) return data.message;

    }

    return porDefecto;

}


/* -----------------------------------------
   AVISOS (TOAST)
----------------------------------------- */

function mostrarToast(mensaje, tipo = "success") {

    let contenedor =
        document.getElementById("msToastContainer");

    if (!contenedor) {

        contenedor =
            document.createElement("div");

        contenedor.id = "msToastContainer";
        contenedor.className = "ms-toast-container";
        contenedor.setAttribute("aria-live", "polite");

        document.body.appendChild(contenedor);

    }

    const esError =
        tipo === "error";

    const toast =
        document.createElement("div");

    toast.className =
        esError
            ? "ms-toast ms-toast-error"
            : "ms-toast ms-toast-success";

    toast.setAttribute(
        "role",
        esError ? "alert" : "status"
    );

    // textContent (no innerHTML): el mensaje puede contener nombres
    // escritos por usuarios y nunca debe interpretarse como HTML.
    toast.textContent = mensaje;

    toast.addEventListener(
        "click",
        () => toast.remove()
    );

    contenedor.appendChild(toast);

    setTimeout(
        () => toast.remove(),
        esError ? 6000 : 3500
    );

}


/* -----------------------------------------
   DIÁLOGO BASE (overlay, ESC, foco)
----------------------------------------- */

// Monta un diálogo sobre la página y devuelve la función cerrar(resultado).
// opciones: { alCerrar, cerrarAlClicFuera, puedeCerrar }
function montarDialogo(dialogo, opciones = {}) {

    const elementoAnterior =
        document.activeElement;

    const overlay =
        document.createElement("div");

    overlay.className = "ms-overlay";

    overlay.appendChild(dialogo);

    document.body.appendChild(overlay);

    document.body.classList.add("ms-sin-scroll");

    function cerrar(resultado) {

        document.removeEventListener(
            "keydown",
            alTeclear,
            true
        );

        overlay.remove();

        document.body.classList.remove("ms-sin-scroll");

        if (
            elementoAnterior &&
            typeof elementoAnterior.focus === "function"
        ) {

            elementoAnterior.focus();

        }

        if (typeof opciones.alCerrar === "function") {

            opciones.alCerrar(resultado);

        }

    }

    // Cierre pedido por el usuario (ESC o clic fuera): respeta puedeCerrar
    function solicitarCierre() {

        if (
            typeof opciones.puedeCerrar === "function" &&
            !opciones.puedeCerrar()
        ) {

            return;

        }

        cerrar(false);

    }

    function alTeclear(evento) {

        if (evento.key === "Escape") {

            evento.preventDefault();

            solicitarCierre();

            return;

        }

        // Mantiene el foco dentro del diálogo al usar Tab
        if (evento.key === "Tab") {

            const enfocables =
                Array.from(
                    dialogo.querySelectorAll(
                        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
                    )
                );

            if (enfocables.length === 0) {

                return;

            }

            const primero = enfocables[0];
            const ultimo = enfocables[enfocables.length - 1];

            if (
                evento.shiftKey &&
                document.activeElement === primero
            ) {

                evento.preventDefault();
                ultimo.focus();

            } else if (
                !evento.shiftKey &&
                document.activeElement === ultimo
            ) {

                evento.preventDefault();
                primero.focus();

            }

        }

    }

    if (opciones.cerrarAlClicFuera) {

        overlay.addEventListener(
            "mousedown",
            evento => {

                if (evento.target === overlay) {

                    solicitarCierre();

                }

            }
        );

    }

    document.addEventListener(
        "keydown",
        alTeclear,
        true
    );

    return cerrar;

}


/* -----------------------------------------
   CONFIRMAR ELIMINACIÓN
----------------------------------------- */

// Devuelve una promesa: true si el usuario confirma, false si cancela.
function confirmarEliminacion(nombre) {

    return new Promise(resolve => {

        const dialogo =
            document.createElement("div");

        dialogo.className = "ms-dialog";
        dialogo.setAttribute("role", "alertdialog");
        dialogo.setAttribute("aria-modal", "true");
        dialogo.setAttribute("aria-labelledby", "msConfirmTitulo");
        dialogo.setAttribute("aria-describedby", "msConfirmMensaje");

        const titulo =
            document.createElement("h3");

        titulo.id = "msConfirmTitulo";
        titulo.textContent = "Confirmar eliminación";

        const mensaje =
            document.createElement("p");

        mensaje.id = "msConfirmMensaje";

        mensaje.textContent =
            `¿Está seguro de que desea eliminar "${nombre}"? ` +
            "Esta acción no se puede deshacer.";

        const acciones =
            document.createElement("div");

        acciones.className = "ms-dialog-acciones";

        const btnCancelar =
            document.createElement("button");

        btnCancelar.type = "button";
        btnCancelar.className = "ms-btn ms-btn-secundario";
        btnCancelar.textContent = "Cancelar";

        const btnEliminar =
            document.createElement("button");

        btnEliminar.type = "button";
        btnEliminar.className = "ms-btn ms-btn-peligro";
        btnEliminar.textContent = "Eliminar";

        acciones.appendChild(btnCancelar);
        acciones.appendChild(btnEliminar);

        dialogo.appendChild(titulo);
        dialogo.appendChild(mensaje);
        dialogo.appendChild(acciones);

        const cerrar =
            montarDialogo(
                dialogo,
                {
                    alCerrar: resolve,
                    cerrarAlClicFuera: true
                }
            );

        btnCancelar.addEventListener(
            "click",
            () => cerrar(false)
        );

        btnEliminar.addEventListener(
            "click",
            () => cerrar(true)
        );

        // El foco inicial queda en "Cancelar" (opción segura)
        btnCancelar.focus();

    });

}


// Flujo completo: confirmar -> DELETE -> aviso -> refrescar lista.
// onExito es la función que vuelve a consultar y pintar la tabla.
async function eliminarRegistro({ endpoint, nombre, onExito }) {

    const confirmado =
        await confirmarEliminacion(nombre);

    if (!confirmado) {

        return;

    }

    try {

        const response =
            await apiFetch(
                endpoint,
                {
                    method: "DELETE"
                }
            );

        const data =
            await getJSON(response);

        if (!response.ok) {

            mostrarToast(
                mensajeDeRespuesta(
                    data,
                    "No se pudo eliminar el registro."
                ),
                "error"
            );

            return;

        }

        mostrarToast(
            mensajeDeRespuesta(
                data,
                "Registro eliminado correctamente."
            ),
            "success"
        );

        if (typeof onExito === "function") {

            await onExito();

        }

    } catch (error) {

        console.error(
            "Error eliminando registro:",
            error
        );

        mostrarToast(
            "Error de conexión con el servidor.",
            "error"
        );

    }

}


/* -----------------------------------------
   MODAL DE EDICIÓN
----------------------------------------- */

// Valida un campo del modal. Devuelve el mensaje de error o "" si es válido.
function validarCampoEdicion(campo, valor) {

    if (campo.requerido && valor === "") {

        return `Complete el campo "${campo.etiqueta}".`;

    }

    if (valor === "") {

        return "";

    }

    if (
        campo.tipo === "email" &&
        !validarEmail(valor)
    ) {

        return "Ingrese un correo electrónico válido.";

    }

    if (campo.tipo === "number") {

        const numero =
            Number(valor);

        if (!Number.isFinite(numero)) {

            return "Ingrese un número válido.";

        }

        if (
            campo.entero &&
            !Number.isInteger(numero)
        ) {

            return "Ingrese un número entero.";

        }

        if (
            campo.min !== undefined &&
            numero < campo.min
        ) {

            return `El valor mínimo es ${campo.min}.`;

        }

    }

    if (
        campo.minLength &&
        valor.length < campo.minLength
    ) {

        return `Debe tener al menos ${campo.minLength} caracteres.`;

    }

    return "";

}


// Abre un modal de edición con los datos precargados.
//
// config = {
//   titulo:   "Editar producto",
//   campos:   [{ name, etiqueta, tipo, valor, requerido, maxLength, min,
//                entero, step, minLength, placeholder, ayuda, autocomplete,
//                opciones: [{ value, label }]   // solo para tipo "select"
//             }],
//   onGuardar: async (valores) => ({ ok: boolean, mensaje: string }),
//   onExito:   async () => { ...refrescar la lista... }
// }
function abrirModalEdicion(config) {

    const campos =
        config.campos || [];

    let guardando = false;

    const dialogo =
        document.createElement("div");

    dialogo.className = "ms-dialog";
    dialogo.setAttribute("role", "dialog");
    dialogo.setAttribute("aria-modal", "true");
    dialogo.setAttribute("aria-labelledby", "msEditTitulo");

    const titulo =
        document.createElement("h3");

    titulo.id = "msEditTitulo";
    titulo.textContent = config.titulo || "Editar registro";

    const form =
        document.createElement("form");

    form.noValidate = true;

    const avisoError =
        document.createElement("p");

    avisoError.className = "ms-form-error";
    avisoError.setAttribute("role", "alert");
    avisoError.hidden = true;

    form.appendChild(avisoError);

    campos.forEach(campo => {

        const idControl =
            `msCampo_${campo.name}`;

        const grupo =
            document.createElement("div");

        grupo.className = "ms-campo";

        const etiqueta =
            document.createElement("label");

        etiqueta.htmlFor = idControl;

        etiqueta.textContent =
            campo.requerido
                ? `${campo.etiqueta} *`
                : campo.etiqueta;

        let control;

        if (campo.tipo === "select") {

            control =
                document.createElement("select");

            (campo.opciones || []).forEach(opcion => {

                const option =
                    document.createElement("option");

                option.value = opcion.value;
                option.textContent = opcion.label;

                if (
                    String(opcion.value) ===
                    String(campo.valor ?? "")
                ) {

                    option.selected = true;

                }

                control.appendChild(option);

            });

        } else {

            control =
                document.createElement("input");

            control.type = campo.tipo || "text";

            control.value =
                campo.valor === null ||
                campo.valor === undefined
                    ? ""
                    : String(campo.valor);

            if (campo.maxLength) {

                control.maxLength = campo.maxLength;

            }

            if (campo.min !== undefined) {

                control.min = String(campo.min);

            }

            if (campo.step) {

                control.step = String(campo.step);

            }

            if (campo.placeholder) {

                control.placeholder = campo.placeholder;

            }

            if (campo.autocomplete) {

                control.autocomplete = campo.autocomplete;

            }

        }

        control.id = idControl;
        control.name = campo.name;

        if (campo.requerido) {

            control.setAttribute("aria-required", "true");

        }

        const mensajeCampo =
            document.createElement("span");

        mensajeCampo.className = "ms-campo-error";
        mensajeCampo.id = `${idControl}_error`;

        control.setAttribute(
            "aria-describedby",
            `${idControl}_error`
        );

        grupo.appendChild(etiqueta);
        grupo.appendChild(control);

        if (campo.ayuda) {

            const ayuda =
                document.createElement("small");

            ayuda.className = "ms-ayuda";
            ayuda.textContent = campo.ayuda;

            grupo.appendChild(ayuda);

        }

        grupo.appendChild(mensajeCampo);

        form.appendChild(grupo);

    });

    const acciones =
        document.createElement("div");

    acciones.className = "ms-dialog-acciones";

    const btnCancelar =
        document.createElement("button");

    btnCancelar.type = "button";
    btnCancelar.className = "ms-btn ms-btn-secundario";
    btnCancelar.textContent = "Cancelar";

    const btnGuardar =
        document.createElement("button");

    btnGuardar.type = "submit";
    btnGuardar.className = "ms-btn ms-btn-guardar";
    btnGuardar.textContent = "Guardar cambios";

    acciones.appendChild(btnCancelar);
    acciones.appendChild(btnGuardar);

    form.appendChild(acciones);

    dialogo.appendChild(titulo);
    dialogo.appendChild(form);

    const cerrar =
        montarDialogo(
            dialogo,
            {
                // Con cambios sin guardar no se cierra por un clic accidental
                cerrarAlClicFuera: false,
                puedeCerrar: () => !guardando
            }
        );

    function limpiarErrores() {

        avisoError.hidden = true;
        avisoError.textContent = "";

        form.querySelectorAll(".ms-campo-error")
            .forEach(elemento => {

                elemento.textContent = "";

            });

        form.querySelectorAll("[aria-invalid]")
            .forEach(elemento => {

                elemento.removeAttribute("aria-invalid");

            });

    }

    function mostrarErrorModal(mensaje) {

        avisoError.textContent = mensaje;
        avisoError.hidden = false;

    }

    btnCancelar.addEventListener(
        "click",
        () => cerrar(false)
    );

    form.addEventListener(
        "submit",
        async evento => {

            evento.preventDefault();

            if (guardando) {

                return;

            }

            limpiarErrores();

            const valores = {};

            let primerError = null;

            campos.forEach(campo => {

                const control =
                    form.elements[campo.name];

                let valor =
                    control.value;

                // Las contraseñas no se recortan; el resto sí
                if (campo.tipo !== "password") {

                    valor = valor.trim();

                }

                const error =
                    validarCampoEdicion(
                        campo,
                        valor
                    );

                if (error) {

                    control.setAttribute(
                        "aria-invalid",
                        "true"
                    );

                    document.getElementById(
                        `msCampo_${campo.name}_error`
                    ).textContent = error;

                    if (!primerError) {

                        primerError = control;

                    }

                }

                valores[campo.name] = valor;

            });

            if (primerError) {

                primerError.focus();

                return;

            }

            guardando = true;

            btnGuardar.disabled = true;
            btnCancelar.disabled = true;
            btnGuardar.textContent = "Guardando...";

            try {

                const resultado =
                    await config.onGuardar(valores);

                if (resultado && resultado.ok) {

                    guardando = false;

                    cerrar(true);

                    mostrarToast(
                        resultado.mensaje ||
                        "Cambios guardados correctamente.",
                        "success"
                    );

                    if (typeof config.onExito === "function") {

                        await config.onExito();

                    }

                    return;

                }

                mostrarErrorModal(
                    (resultado && resultado.mensaje) ||
                    "No se pudieron guardar los cambios."
                );

            } catch (error) {

                console.error(
                    "Error guardando cambios:",
                    error
                );

                mostrarErrorModal(
                    "Error de conexión con el servidor."
                );

            } finally {

                guardando = false;

                btnGuardar.disabled = false;
                btnCancelar.disabled = false;
                btnGuardar.textContent = "Guardar cambios";

            }

        }
    );

    if (campos.length > 0) {

        form.elements[campos[0].name].focus();

    }

}


// Envía un PUT y devuelve { ok, mensaje } (formato que espera onGuardar)
async function enviarEdicion(endpoint, cuerpo) {

    const response =
        await apiFetch(
            endpoint,
            {
                method: "PUT",
                body: JSON.stringify(cuerpo)
            }
        );

    const data =
        await getJSON(response);

    return {

        ok: response.ok,

        mensaje: mensajeDeRespuesta(
            data,
            response.ok
                ? "Cambios guardados correctamente."
                : "No se pudieron guardar los cambios."
        )

    };

}


/* -----------------------------------------
   BOTONES DE ACCIÓN EN LAS TABLAS
----------------------------------------- */

// Devuelve el <td> de acciones de una fila. Solo el Administrador ve los
// botones; para el resto se muestra un guion.
// opciones.sinEliminar = true oculta "Eliminar" (ej.: la propia cuenta).
function celdaAccionesHTML(id, nombre, opciones = {}) {

    if (!esAdministrador()) {

        return `<td class="ms-acciones">-</td>`;

    }

    const idSeguro =
        escapeHTML(id);

    const nombreSeguro =
        escapeHTML(nombre);

    const botonEliminar =
        opciones.sinEliminar
            ? ""
            : `<button type="button" class="ms-accion ms-accion-eliminar" data-accion="eliminar" data-id="${idSeguro}" aria-label="Eliminar ${nombreSeguro}">🗑️ Eliminar</button>`;

    return `
        <td class="ms-acciones">
            <button type="button" class="ms-accion ms-accion-editar" data-accion="editar" data-id="${idSeguro}" aria-label="Editar ${nombreSeguro}">✏️ Editar</button>
            ${botonEliminar}
        </td>
    `;

}


// Escucha los clics de los botones Editar/Eliminar mediante delegación de
// eventos (un solo listener por tabla, aunque se repinte la lista).
// manejadores = { editar: id => {...}, eliminar: id => {...} }
function activarAccionesTabla(selectorTbody, manejadores) {

    const tbody =
        document.querySelector(selectorTbody);

    if (
        !tbody ||
        tbody.dataset.accionesListas === "1"
    ) {

        return;

    }

    tbody.dataset.accionesListas = "1";

    tbody.addEventListener(
        "click",
        evento => {

            const boton =
                evento.target.closest("button[data-accion]");

            if (
                !boton ||
                !tbody.contains(boton)
            ) {

                return;

            }

            const manejador =
                manejadores[boton.dataset.accion];

            if (typeof manejador === "function") {

                manejador(Number(boton.dataset.id));

            }

        }
    );

}


/* =========================================================
   MOSTRAR / OCULTAR CONTRASEÑA
   ========================================================= */


/* =========================================================
   MOSTRAR / OCULTAR CONTRASEÑA
   ========================================================= */

function togglePassword(
    inputId,
    buttonId
) {

    const input =
        document.getElementById(
            inputId
        );


    const button =
        document.getElementById(
            buttonId
        );


    if (
        !input ||
        !button
    ) {

        return;

    }


    const esPassword =
        input.type === "password";


    input.type =
        esPassword
            ? "text"
            : "password";


    /*
     * Compatible con botones que
     * contienen texto.
     */

    button.textContent =
        esPassword
            ? "Ocultar"
            : "Mostrar";


    button.setAttribute(

        "aria-label",

        esPassword
            ? "Ocultar contraseña"
            : "Mostrar contraseña"

    );

}


/* =========================================================
   LOGIN
   ========================================================= */

function validarLogin() {

    const correo =
        document.getElementById(
            "correo"
        );


    const password =
        document.getElementById(
            "password"
        );


    const correoError =
        document.getElementById(
            "correoError"
        );


    const passwordError =
        document.getElementById(
            "passwordError"
        );


    let valido = true;


    if (correoError) {
        correoError.textContent = "";
    }


    if (passwordError) {
        passwordError.textContent = "";
    }


    if (correo) {
        correo.classList.remove(
            "input-error"
        );
    }


    if (password) {
        password.classList.remove(
            "input-error"
        );
    }


    if (
        !correo ||
        !correo.value.trim()
    ) {

        if (correoError) {

            correoError.textContent =
                "El correo electrónico es obligatorio.";

        }


        if (correo) {

            correo.classList.add(
                "input-error"
            );

        }


        valido = false;

    } else if (
        !validarEmail(
            correo.value.trim()
        )
    ) {

        if (correoError) {

            correoError.textContent =
                "Ingrese un correo electrónico válido.";

        }


        correo.classList.add(
            "input-error"
        );


        valido = false;

    }


    if (
        !password ||
        !password.value
    ) {

        if (passwordError) {

            passwordError.textContent =
                "La contraseña es obligatoria.";

        }


        if (password) {

            password.classList.add(
                "input-error"
            );

        }


        valido = false;

    }


    return valido;

}


async function iniciarSesion(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "loginButton"
        );


    const message =
        document.getElementById(
            "loginMessage"
        );


    if (
        !validarLogin()
    ) {

        return;

    }


    const correo =
        document
            .getElementById(
                "correo"
            )
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById(
                "password"
            )
            .value;


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Verificando...";

    }


    clearMessage(
        message
    );


    try {

        const response =
            await apiFetch(

                "/api/auth/login",

                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            correo,
                            password

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        if (
            !response.ok ||
            !data.success
        ) {

            showMessage(

                message,

                data.message ||
                "Credenciales inválidas.",

                "error"

            );

            return;

        }


        /*
         * GUARDAR SESIÓN
         */

        sessionStorage.setItem(

            "microstock_token",

            data.token

        );


        sessionStorage.setItem(

            "microstock_user",

            JSON.stringify(
                data.user
            )

        );


        showMessage(

            message,

            "Inicio de sesión exitoso. Redirigiendo...",

            "success"

        );


        setTimeout(

            () => {

                window.location.href =
                    "index.html";

            },

            500

        );


    } catch (error) {

        console.error(
            "Error de login:",
            error
        );


        showMessage(

            message,

            "No fue posible conectarse con el servidor.",

            "error"

        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Iniciar sesión";

        }

    }

}


/* =========================================================
   CARGAR ROLES
   ========================================================= */

async function cargarRoles() {

    const select =
        document.getElementById(
            "rol"
        );


    /*
     * También soportamos rolUsuario
     * para el formulario administrativo.
     */

    const selectAdmin =
        document.getElementById(
            "rolUsuario"
        );


    if (
        !select &&
        !selectAdmin
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/roles`
            );


        const data =
            await getJSON(
                response
            );


        if (!response.ok) {

            console.error(
                "No fue posible cargar roles:",
                data
            );

            return;

        }


        const selects = [];


        if (select) {

            selects.push(
                select
            );

        }


        if (
            selectAdmin &&
            selectAdmin !== select
        ) {

            selects.push(
                selectAdmin
            );

        }


        selects.forEach(
            currentSelect => {

                currentSelect.innerHTML =
                    "";

                const optionInicial =
                    document.createElement(
                        "option"
                    );

                optionInicial.value =
                    "";

                optionInicial.textContent =
                    "Seleccione un rol";

                currentSelect.appendChild(
                    optionInicial
                );


                data.forEach(
                    rol => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            rol.id_rol;

                        option.textContent =
                            rol.nombre_rol;

                        currentSelect.appendChild(
                            option
                        );

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando roles:",
            error
        );

    }

}


/* =========================================================
   REGISTRO DE CUENTA
   ========================================================= */

function validarRegistro() {

    const nombre =
        document.getElementById(
            "nombre"
        );


    const correo =
        document.getElementById(
            "correo"
        );


    const rol =
        document.getElementById(
            "rol"
        );


    const password =
        document.getElementById(
            "password"
        );


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        );


    const nombreError =
        document.getElementById(
            "nombreError"
        );


    const correoError =
        document.getElementById(
            "correoError"
        );


    const rolError =
        document.getElementById(
            "rolError"
        );


    const passwordError =
        document.getElementById(
            "passwordError"
        );


    const confirmPasswordError =
        document.getElementById(
            "confirmPasswordError"
        );


    let valido = true;


    [
        nombreError,
        correoError,
        rolError,
        passwordError,
        confirmPasswordError

    ].forEach(
        elemento => {

            if (elemento) {

                elemento.textContent =
                    "";

            }

        }
    );


    [
        nombre,
        correo,
        rol,
        password,
        confirmPassword

    ].forEach(
        elemento => {

            if (elemento) {

                elemento.classList.remove(
                    "input-error"
                );

            }

        }
    );


    if (
        !nombre ||
        !nombre.value.trim()
    ) {

        if (nombreError) {

            nombreError.textContent =
                "El nombre es obligatorio.";

        }


        if (nombre) {

            nombre.classList.add(
                "input-error"
            );

        }


        valido = false;

    }


    if (
        !correo ||
        !correo.value.trim()
    ) {

        if (correoError) {

            correoError.textContent =
                "El correo electrónico es obligatorio.";

        }


        if (correo) {

            correo.classList.add(
                "input-error"
            );

        }


        valido = false;

    } else if (
        !validarEmail(
            correo.value.trim()
        )
    ) {

        correoError.textContent =
            "Ingrese un correo electrónico válido.";

        correo.classList.add(
            "input-error"
        );

        valido = false;

    }


    if (
        !rol ||
        !rol.value
    ) {

        if (rolError) {

            rolError.textContent =
                "Seleccione un rol.";

        }


        if (rol) {

            rol.classList.add(
                "input-error"
            );

        }


        valido = false;

    }


    if (
        !password ||
        !password.value
    ) {

        if (passwordError) {

            passwordError.textContent =
                "La contraseña es obligatoria.";

        }


        if (password) {

            password.classList.add(
                "input-error"
            );

        }


        valido = false;

    } else if (
        password.value.length < 6
    ) {

        if (passwordError) {

            passwordError.textContent =
                "La contraseña debe tener mínimo 6 caracteres.";

        }


        password.classList.add(
            "input-error"
        );


        valido = false;

    }


    if (
        !confirmPassword ||
        !confirmPassword.value
    ) {

        if (confirmPasswordError) {

            confirmPasswordError.textContent =
                "Debe confirmar la contraseña.";

        }


        if (confirmPassword) {

            confirmPassword.classList.add(
                "input-error"
            );

        }


        valido = false;

    } else if (
        password.value !==
        confirmPassword.value
    ) {

        if (confirmPasswordError) {

            confirmPasswordError.textContent =
                "Las contraseñas no coinciden.";

        }


        confirmPassword.classList.add(
            "input-error"
        );


        valido = false;

    }


    return valido;

}


/*
 * IMPORTANTE:
 * Esta función reemplaza el antiguo
 * registrarUsuario() del registro público.
 */

async function registrarCuenta(event) {

    event.preventDefault();


    if (
        !validarRegistro()
    ) {

        return;

    }


    const form =
        document.getElementById(
            "registerForm"
        );


    const button =
        document.getElementById(
            "registerButton"
        );


    const message =
        document.getElementById(
            "registerMessage"
        );


    const nombre =
        document
            .getElementById(
                "nombre"
            )
            .value
            .trim();


    const correo =
        document
            .getElementById(
                "correo"
            )
            .value
            .trim()
            .toLowerCase();


    const rol =
        document
            .getElementById(
                "rol"
            )
            .value;


    const password =
        document
            .getElementById(
                "password"
            )
            .value;


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Registrando...";

    }


    clearMessage(
        message
    );


    try {

        const response =
            await fetch(

                `${API_URL}/api/auth/register`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            nombre,
                            correo,
                            password,
                            rol:
                                Number(rol)

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        if (
            !response.ok ||
            !data.success
        ) {

            showMessage(

                message,

                data.message ||
                data.error ||
                "No fue posible registrar el usuario.",

                "error"

            );

            return;

        }


        showMessage(

            message,

            "Registro exitoso. Redirigiendo al inicio de sesión...",

            "success"

        );


        if (form) {

            form.reset();

        }


        setTimeout(

            () => {

                window.location.href =
                    "login.html";

            },

            1500

        );


    } catch (error) {

        console.error(
            "Error de registro:",
            error
        );


        showMessage(

            message,

            "No fue posible conectarse con el servidor.",

            "error"

        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Crear cuenta";

        }

    }

}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

async function cargarCategorias() {

    const select =
        document.getElementById(
            "categoria"
        );


    if (!select) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/categorias"
            );


        const categorias =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        select.innerHTML =
            "";


        const inicial =
            document.createElement(
                "option"
            );

        inicial.value =
            "";

        inicial.textContent =
            "Seleccione categoría";

        select.appendChild(
            inicial
        );


        categorias.forEach(
            categoria => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    categoria.id_categoria;

                option.textContent =
                    categoria.nombre_categoria;

                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando categorías:",
            error
        );

    }

}


async function registrarCategoria(event) {

    event.preventDefault();


    const nombre =
        document
            .getElementById(
                "nombreCategoria"
            )
            ?.value
            .trim();


    const descripcion =
        document
            .getElementById(
                "descripcionCategoria"
            )
            ?.value
            .trim();


    if (!nombre) {

        alert(
            "El nombre de la categoría es obligatorio."
        );

        return;

    }


    try {

        const response =
            await apiFetch(

                "/categorias",

                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            nombre,
                            descripcion

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        alert(

            data.mensaje ||
            data.message ||
            data.error ||
            "Operación completada."

        );


        if (
            response.ok
        ) {

            document
                .getElementById(
                    "formCategoria"
                )
                ?.reset();


            mostrarCategorias();

            cargarCategorias();

        }

    } catch (error) {

        console.error(
            "Error registrando categoría:",
            error
        );

    }

}


// CAMBIO 3: copia del último listado recibido. Sirve para precargar el
// modal de edición y para mostrar el nombre en la confirmación de borrado.
let categoriasListado = [];


// PUNTO 2: control de la búsqueda de categorías
//  - temporizadorBusquedaCategorias: retraso (debounce) de 300 ms
//  - solicitudCategorias: contador para ignorar respuestas viejas que
//    lleguen después de una más reciente
let temporizadorBusquedaCategorias = null;
let solicitudCategorias = 0;


// PUNTO 2: conecta el campo "Buscar categoría" (se hace una sola vez)
function activarBuscadorCategorias() {

    const campo =
        document.getElementById(
            "buscarCategoria"
        );


    if (
        !campo ||
        campo.dataset.buscadorListo === "1"
    ) {

        return;

    }


    campo.dataset.buscadorListo = "1";


    // Al escribir: espera 300 ms sin teclear antes de consultar al servidor
    campo.addEventListener(
        "input",
        () => {

            clearTimeout(
                temporizadorBusquedaCategorias
            );

            temporizadorBusquedaCategorias =
                setTimeout(
                    mostrarCategorias,
                    300
                );

        }
    );


    // Enter busca de inmediato
    campo.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Enter") {

                evento.preventDefault();

                clearTimeout(
                    temporizadorBusquedaCategorias
                );

                mostrarCategorias();

            }

        }
    );

}


async function mostrarCategorias() {

    const tabla =
        document.querySelector(
            "#tablaCategorias tbody"
        );


    if (!tabla) {

        return;

    }


    // CAMBIO 3: listeners de Editar/Eliminar (se registran una sola vez
    // aunque la tabla se repinte muchas veces).
    activarAccionesTabla(
        "#tablaCategorias tbody",
        {
            editar: editarCategoria,
            eliminar: eliminarCategoria
        }
    );


    // PUNTO 2: se conecta el buscador (solo la primera vez) y se lee su texto
    activarBuscadorCategorias();

    const campoBusqueda =
        document.getElementById(
            "buscarCategoria"
        );

    const termino =
        campoBusqueda
            ? campoBusqueda.value.trim()
            : "";

    const idSolicitud =
        ++solicitudCategorias;


    try {

        // PUNTO 2: con texto se consulta /categorias?search=..., sin texto el listado completo
        const endpoint =
            termino
                ? `/categorias?search=${encodeURIComponent(termino)}`
                : "/categorias";

        const response =
            await apiFetch(
                endpoint
            );


        const categorias =
            await getJSON(
                response
            );


        // PUNTO 2: llegó una consulta más reciente; se descarta esta respuesta
        if (idSolicitud !== solicitudCategorias) {

            return;

        }


        if (!response.ok) {

            return;

        }


        // CAMBIO 3: se guarda el listado para el modal y el borrado
        categoriasListado =
            categorias;


        tabla.innerHTML =
            "";


        // PUNTO 2: mensaje cuando no hay resultados
        if (categorias.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;color:var(--text-light);padding:20px 0;">
                        ${
                            termino
                                ? "No se encontraron categorías con ese criterio."
                                : "No hay categorías registradas."
                        }
                    </td>
                </tr>
            `;

            return;

        }


        categorias.forEach(
            categoria => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            categoria.id_categoria
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            categoria.nombre_categoria
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            categoria.descripcion_categoria
                        )}
                    </td>

                    <td>
                        Activa
                    </td>

                    ${celdaAccionesHTML(
                        categoria.id_categoria,
                        categoria.nombre_categoria
                    )}

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error obteniendo categorías:",
            error
        );

    }

}


// CAMBIO 3: abre el modal de edición con los datos actuales de la categoría
function editarCategoria(id) {

    const categoria =
        categoriasListado.find(
            item => Number(item.id_categoria) === id
        );


    if (!categoria) {

        mostrarToast(
            "No se encontró la categoría. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    abrirModalEdicion({

        titulo: "Editar categoría",

        campos: [

            {
                name: "nombre",
                etiqueta: "Nombre de la categoría",
                tipo: "text",
                valor: categoria.nombre_categoria,
                requerido: true,
                maxLength: 100
            },

            {
                name: "descripcion",
                etiqueta: "Descripción",
                tipo: "text",
                valor: categoria.descripcion_categoria,
                requerido: false,
                maxLength: 500
            }

        ],

        // Los nombres del cuerpo coinciden con PUT /categorias/:id del backend
        onGuardar: valores =>
            enviarEdicion(
                `/categorias/${id}`,
                {
                    nombre: valores.nombre,
                    descripcion: valores.descripcion
                }
            ),

        onExito: mostrarCategorias

    });

}


// CAMBIO 3: confirma y elimina una categoría (el backend bloquea el borrado
// si la categoría tiene productos asociados)
function eliminarCategoria(id) {

    const categoria =
        categoriasListado.find(
            item => Number(item.id_categoria) === id
        );


    if (!categoria) {

        mostrarToast(
            "No se encontró la categoría. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    return eliminarRegistro({

        endpoint: `/categorias/${id}`,

        nombre: categoria.nombre_categoria,

        onExito: mostrarCategorias

    });

}


/* =========================================================
   PRODUCTOS
   ========================================================= */

async function registrarProducto(event) {

    event.preventDefault();


    const nombre =
        document
            .getElementById(
                "nombre"
            )
            ?.value
            .trim();


    const precio =
        document
            .getElementById(
                "precio"
            )
            ?.value;


    const stock =
        document
            .getElementById(
                "stock"
            )
            ?.value;


    const minimo =
        document
            .getElementById(
                "minimo"
            )
            ?.value;


    const categoria =
        document
            .getElementById(
                "categoria"
            )
            ?.value;


    if (
        !nombre ||
        precio === "" ||
        stock === "" ||
        minimo === "" ||
        !categoria
    ) {

        alert(
            "Todos los campos del producto son obligatorios."
        );

        return;

    }


    try {

        const response =
            await apiFetch(

                "/productos",

                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            nombre,
                            precio:
                                Number(precio),

                            stock:
                                Number(stock),

                            minimo:
                                Number(minimo),

                            categoria:
                                Number(categoria)

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        alert(

            data.mensaje ||
            data.message ||
            data.error ||
            "Operación completada."

        );


        if (
            response.ok
        ) {

            document
                .getElementById(
                    "formProducto"
                )
                ?.reset();


            mostrarProductos();

            cargarCategorias();

        }

    } catch (error) {

        console.error(
            "Error registrando producto:",
            error
        );

    }

}


// CAMBIO 3: copia del último listado recibido. Sirve para precargar el
// modal de edición y para mostrar el nombre en la confirmación de borrado.
let productosListado = [];


// CAMBIO 4: control de la búsqueda de productos
//  - temporizadorBusquedaProductos: retraso (debounce) de 300 ms
//  - solicitudProductos: contador para ignorar respuestas viejas que
//    lleguen después de una más reciente
let temporizadorBusquedaProductos = null;
let solicitudProductos = 0;


// CAMBIO 4: conecta el campo "Buscar producto" (se hace una sola vez)
function activarBuscadorProductos() {

    const campo =
        document.getElementById(
            "buscarProducto"
        );


    if (
        !campo ||
        campo.dataset.buscadorListo === "1"
    ) {

        return;

    }


    campo.dataset.buscadorListo = "1";


    // Al escribir: espera 300 ms sin teclear antes de consultar al servidor
    campo.addEventListener(
        "input",
        () => {

            clearTimeout(
                temporizadorBusquedaProductos
            );

            temporizadorBusquedaProductos =
                setTimeout(
                    mostrarProductos,
                    300
                );

        }
    );


    // Enter busca de inmediato
    campo.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Enter") {

                evento.preventDefault();

                clearTimeout(
                    temporizadorBusquedaProductos
                );

                mostrarProductos();

            }

        }
    );

}


async function mostrarProductos() {

    const tabla =
        document.querySelector(
            "#tablaProductos tbody"
        );


    if (!tabla) {

        return;

    }


    // CAMBIO 3: listeners de Editar/Eliminar (se registran una sola vez
    // aunque la tabla se repinte muchas veces).
    activarAccionesTabla(
        "#tablaProductos tbody",
        {
            editar: editarProducto,
            eliminar: eliminarProducto
        }
    );


    // CAMBIO 4: se conecta el buscador y se lee el texto actual del campo.
    // Así, al editar, eliminar o registrar un producto, la lista se vuelve
    // a pedir con el mismo filtro que el usuario tenía escrito.
    activarBuscadorProductos();


    const campoBusqueda =
        document.getElementById(
            "buscarProducto"
        );


    const termino =
        campoBusqueda
            ? campoBusqueda.value.trim()
            : "";


    const endpoint =
        termino
            ? `/productos?search=${encodeURIComponent(termino)}`
            : "/productos";


    const idSolicitud =
        ++solicitudProductos;


    try {

        const response =
            await apiFetch(
                endpoint
            );


        const productos =
            await getJSON(
                response
            );


        // CAMBIO 4: llegó una consulta más reciente; esta respuesta se descarta
        if (idSolicitud !== solicitudProductos) {

            return;

        }


        if (!response.ok) {

            // CAMBIO 4: antes fallaba en silencio; ahora se avisa
            mostrarToast(
                mensajeDeRespuesta(
                    productos,
                    "No se pudieron cargar los productos."
                ),
                "error"
            );

            return;

        }


        // CAMBIO 3: se guarda el listado para el modal y el borrado
        productosListado =
            productos;


        tabla.innerHTML =
            "";


        // CAMBIO 4: mensaje cuando no hay resultados
        if (productos.length === 0) {

            const mensajeVacio =
                termino
                    ? "No se encontraron productos con ese criterio."
                    : "No hay productos registrados.";

            tabla.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;color:var(--text-light);padding:20px 0;">
                        ${mensajeVacio}
                    </td>
                </tr>
            `;

            return;

        }


        productos.forEach(
            producto => {

                const stock =
                    Number(
                        producto.stock_actual
                    );


                const minimo =
                    Number(
                        producto.stock_minimo
                    );


                let estado =
                    "Disponible";


                if (
                    stock <= minimo
                ) {

                    estado =
                        "Stock Bajo";

                }


                if (
                    stock <= minimo * 0.5
                ) {

                    estado =
                        "Crítico";

                }


                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            producto.id_producto
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.nombre_producto
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.nombre_categoria
                        )}
                    </td>

                    <td>
                        $ ${Number(
                            producto.precio_unitario
                        ).toLocaleString()}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.stock_actual
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.stock_minimo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            estado
                        )}
                    </td>

                    ${celdaAccionesHTML(
                        producto.id_producto,
                        producto.nombre_producto
                    )}

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error obteniendo productos:",
            error
        );

    }

}


// CAMBIO 3: abre el modal de edición con los datos actuales del producto
async function editarProducto(id) {

    const producto =
        productosListado.find(
            item => Number(item.id_producto) === id
        );


    if (!producto) {

        mostrarToast(
            "No se encontró el producto. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    // El modal necesita la lista de categorías para el <select>
    let categorias = [];

    try {

        const response =
            await apiFetch(
                "/categorias"
            );


        const data =
            await getJSON(
                response
            );


        if (
            !response.ok ||
            !Array.isArray(data)
        ) {

            mostrarToast(
                mensajeDeRespuesta(
                    data,
                    "No se pudieron cargar las categorías."
                ),
                "error"
            );

            return;

        }


        categorias =
            data;

    } catch (error) {

        console.error(
            "Error cargando categorías para editar:",
            error
        );

        mostrarToast(
            "Error de conexión con el servidor.",
            "error"
        );

        return;

    }


    const opcionesCategoria = [
        {
            value: "",
            label: "Seleccione categoría"
        }
    ].concat(
        categorias.map(
            categoria => ({
                value: categoria.id_categoria,
                label: categoria.nombre_categoria
            })
        )
    );


    abrirModalEdicion({

        titulo: "Editar producto",

        campos: [

            {
                name: "nombre",
                etiqueta: "Nombre del producto",
                tipo: "text",
                valor: producto.nombre_producto,
                requerido: true,
                maxLength: 100
            },

            {
                name: "precio",
                etiqueta: "Precio de venta",
                tipo: "number",
                valor: producto.precio_unitario,
                requerido: true,
                min: 0,
                step: "any"
            },

            {
                name: "minimo",
                etiqueta: "Stock mínimo",
                tipo: "number",
                valor: producto.stock_minimo,
                requerido: true,
                min: 0,
                entero: true,
                step: 1,
                ayuda:
                    "El stock actual cambia con ventas, compras o reposición, no desde aquí."
            },

            {
                name: "categoria",
                etiqueta: "Categoría",
                tipo: "select",
                valor: producto.id_categoria,
                requerido: true,
                opciones: opcionesCategoria
            }

        ],

        // Los nombres del cuerpo coinciden con PUT /productos/:id del backend
        onGuardar: valores =>
            enviarEdicion(
                `/productos/${id}`,
                {
                    nombre: valores.nombre,
                    precio: Number(valores.precio),
                    minimo: Number(valores.minimo),
                    categoria: Number(valores.categoria)
                }
            ),

        onExito: mostrarProductos

    });

}


// CAMBIO 3: confirma y elimina un producto (el backend bloquea el borrado
// si el producto tiene ventas, compras o movimientos)
function eliminarProducto(id) {

    const producto =
        productosListado.find(
            item => Number(item.id_producto) === id
        );


    if (!producto) {

        mostrarToast(
            "No se encontró el producto. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    return eliminarRegistro({

        endpoint: `/productos/${id}`,

        nombre: producto.nombre_producto,

        onExito: mostrarProductos

    });

}


/* =========================================================
   CLIENTES
   ========================================================= */

async function registrarCliente(event) {

    event.preventDefault();


    const nombre =
        document
            .getElementById(
                "nombreCliente"
            )
            ?.value
            .trim();


    const telefono =
        document
            .getElementById(
                "telefonoCliente"
            )
            ?.value
            .trim();


    const correo =
        document
            .getElementById(
                "correoCliente"
            )
            ?.value
            .trim();


    const direccion =
        document
            .getElementById(
                "direccionCliente"
            )
            ?.value
            .trim();


    if (!nombre) {

        alert(
            "El nombre del cliente es obligatorio."
        );

        return;

    }


    try {

        const response =
            await apiFetch(

                "/clientes",

                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            nombre,
                            telefono,
                            correo,
                            direccion

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        alert(

            data.mensaje ||
            data.message ||
            data.error ||
            "Operación completada."

        );


        if (
            response.ok
        ) {

            document
                .getElementById(
                    "formCliente"
                )
                ?.reset();


            mostrarClientes();

        }

    } catch (error) {

        console.error(
            "Error registrando cliente:",
            error
        );

    }

}


// CAMBIO 3: copia del último listado recibido. Sirve para precargar el
// modal de edición y para mostrar el nombre en la confirmación de borrado.
let clientesListado = [];


// PUNTO 4: control de la búsqueda de clientes
//  - temporizadorBusquedaClientes: retraso (debounce) de 300 ms
//  - solicitudClientes: contador para ignorar respuestas viejas que
//    lleguen después de una más reciente
let temporizadorBusquedaClientes = null;
let solicitudClientes = 0;


// PUNTO 4: conecta el campo "Buscar cliente" (se hace una sola vez)
function activarBuscadorClientes() {

    const campo =
        document.getElementById(
            "buscarCliente"
        );


    if (
        !campo ||
        campo.dataset.buscadorListo === "1"
    ) {

        return;

    }


    campo.dataset.buscadorListo = "1";


    // Al escribir: espera 300 ms sin teclear antes de consultar al servidor
    campo.addEventListener(
        "input",
        () => {

            clearTimeout(
                temporizadorBusquedaClientes
            );

            temporizadorBusquedaClientes =
                setTimeout(
                    mostrarClientes,
                    300
                );

        }
    );


    // Enter busca de inmediato
    campo.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Enter") {

                evento.preventDefault();

                clearTimeout(
                    temporizadorBusquedaClientes
                );

                mostrarClientes();

            }

        }
    );

}


async function mostrarClientes() {

    const tabla =
        document.querySelector(
            "#tablaClientes tbody"
        );


    if (!tabla) {

        return;

    }


    // CAMBIO 3: listeners de Editar/Eliminar (se registran una sola vez
    // aunque la tabla se repinte muchas veces).
    activarAccionesTabla(
        "#tablaClientes tbody",
        {
            editar: editarCliente,
            eliminar: eliminarCliente
        }
    );


    // PUNTO 4: se conecta el buscador (solo la primera vez) y se lee su texto
    activarBuscadorClientes();

    const campoBusqueda =
        document.getElementById(
            "buscarCliente"
        );

    const termino =
        campoBusqueda
            ? campoBusqueda.value.trim()
            : "";

    const idSolicitud =
        ++solicitudClientes;


    try {

        // PUNTO 4: con texto se consulta /clientes?search=..., sin texto el listado completo
        const endpoint =
            termino
                ? `/clientes?search=${encodeURIComponent(termino)}`
                : "/clientes";

        const response =
            await apiFetch(
                endpoint
            );


        const clientes =
            await getJSON(
                response
            );


        // PUNTO 4: llegó una consulta más reciente; se descarta esta respuesta
        if (idSolicitud !== solicitudClientes) {

            return;

        }


        if (!response.ok) {

            return;

        }


        // CAMBIO 3: se guarda el listado para el modal y el borrado
        clientesListado =
            clientes;


        tabla.innerHTML =
            "";


        // PUNTO 4: mensaje cuando no hay resultados
        if (clientes.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;color:var(--text-light);padding:20px 0;">
                        ${
                            termino
                                ? "No se encontraron clientes con ese criterio."
                                : "No hay clientes registrados."
                        }
                    </td>
                </tr>
            `;

            return;

        }


        clientes.forEach(
            cliente => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            cliente.id_cliente
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            cliente.nombre_cliente
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            cliente.telefono
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            cliente.correo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            cliente.direccion
                        )}
                    </td>

                    <td>
                        Activo
                    </td>

                    ${celdaAccionesHTML(
                        cliente.id_cliente,
                        cliente.nombre_cliente
                    )}

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error obteniendo clientes:",
            error
        );

    }

}


// CAMBIO 3: abre el modal de edición con los datos actuales del cliente
function editarCliente(id) {

    const cliente =
        clientesListado.find(
            item => Number(item.id_cliente) === id
        );


    if (!cliente) {

        mostrarToast(
            "No se encontró el cliente. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    abrirModalEdicion({

        titulo: "Editar cliente",

        campos: [

            {
                name: "nombre",
                etiqueta: "Nombre del cliente",
                tipo: "text",
                valor: cliente.nombre_cliente,
                requerido: true,
                maxLength: 100
            },

            {
                name: "telefono",
                etiqueta: "Teléfono",
                tipo: "text",
                valor: cliente.telefono,
                requerido: false,
                maxLength: 15,
                autocomplete: "off"
            },

            {
                name: "correo",
                etiqueta: "Correo electrónico",
                tipo: "email",
                valor: cliente.correo,
                requerido: false,
                maxLength: 100,
                autocomplete: "off"
            },

            {
                name: "direccion",
                etiqueta: "Dirección",
                tipo: "text",
                valor: cliente.direccion,
                requerido: false,
                maxLength: 255,
                autocomplete: "off"
            }

        ],

        // Los nombres del cuerpo coinciden con PUT /clientes/:id del backend
        onGuardar: valores =>
            enviarEdicion(
                `/clientes/${id}`,
                {
                    nombre: valores.nombre,
                    telefono: valores.telefono,
                    correo: valores.correo,
                    direccion: valores.direccion
                }
            ),

        onExito: mostrarClientes

    });

}


// CAMBIO 3: confirma y elimina un cliente (el backend bloquea el borrado
// si el cliente tiene ventas registradas)
function eliminarCliente(id) {

    const cliente =
        clientesListado.find(
            item => Number(item.id_cliente) === id
        );


    if (!cliente) {

        mostrarToast(
            "No se encontró el cliente. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    return eliminarRegistro({

        endpoint: `/clientes/${id}`,

        nombre: cliente.nombre_cliente,

        onExito: mostrarClientes

    });

}


/* =========================================================
   PROVEEDORES
   ========================================================= */

async function registrarProveedor(event) {

    event.preventDefault();


    const nombre =
        document
            .getElementById(
                "nombreProveedor"
            )
            ?.value
            .trim();


    const telefono =
        document
            .getElementById(
                "telefonoProveedor"
            )
            ?.value
            .trim();


    const correo =
        document
            .getElementById(
                "correoProveedor"
            )
            ?.value
            .trim();


    const direccion =
        document
            .getElementById(
                "direccionProveedor"
            )
            ?.value
            .trim();


    if (!nombre) {

        alert(
            "El nombre del proveedor es obligatorio."
        );

        return;

    }


    try {

        const response =
            await apiFetch(

                "/proveedores",

                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            nombre,
                            telefono,
                            correo,
                            direccion

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        alert(

            data.mensaje ||
            data.message ||
            data.error ||
            "Operación completada."

        );


        if (
            response.ok
        ) {

            document
                .getElementById(
                    "formProveedor"
                )
                ?.reset();


            mostrarProveedores();

        }

    } catch (error) {

        console.error(
            "Error registrando proveedor:",
            error
        );

    }

}


// CAMBIO 3: copia del último listado recibido. Sirve para precargar el
// modal de edición y para mostrar el nombre en la confirmación de borrado.
let proveedoresListado = [];


// PUNTO 3: control de la búsqueda de proveedores
//  - temporizadorBusquedaProveedores: retraso (debounce) de 300 ms
//  - solicitudProveedores: contador para ignorar respuestas viejas que
//    lleguen después de una más reciente
let temporizadorBusquedaProveedores = null;
let solicitudProveedores = 0;


// PUNTO 3: conecta el campo "Buscar proveedor" (se hace una sola vez)
function activarBuscadorProveedores() {

    const campo =
        document.getElementById(
            "buscarProveedor"
        );


    if (
        !campo ||
        campo.dataset.buscadorListo === "1"
    ) {

        return;

    }


    campo.dataset.buscadorListo = "1";


    // Al escribir: espera 300 ms sin teclear antes de consultar al servidor
    campo.addEventListener(
        "input",
        () => {

            clearTimeout(
                temporizadorBusquedaProveedores
            );

            temporizadorBusquedaProveedores =
                setTimeout(
                    mostrarProveedores,
                    300
                );

        }
    );


    // Enter busca de inmediato
    campo.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Enter") {

                evento.preventDefault();

                clearTimeout(
                    temporizadorBusquedaProveedores
                );

                mostrarProveedores();

            }

        }
    );

}


async function mostrarProveedores() {

    const tabla =
        document.querySelector(
            "#tablaProveedores tbody"
        );


    if (!tabla) {

        return;

    }


    // CAMBIO 3: listeners de Editar/Eliminar (se registran una sola vez
    // aunque la tabla se repinte muchas veces).
    activarAccionesTabla(
        "#tablaProveedores tbody",
        {
            editar: editarProveedor,
            eliminar: eliminarProveedor
        }
    );


    // PUNTO 3: se conecta el buscador (solo la primera vez) y se lee su texto
    activarBuscadorProveedores();

    const campoBusqueda =
        document.getElementById(
            "buscarProveedor"
        );

    const termino =
        campoBusqueda
            ? campoBusqueda.value.trim()
            : "";

    const idSolicitud =
        ++solicitudProveedores;


    try {

        // PUNTO 3: con texto se consulta /proveedores?search=..., sin texto el listado completo
        const endpoint =
            termino
                ? `/proveedores?search=${encodeURIComponent(termino)}`
                : "/proveedores";

        const response =
            await apiFetch(
                endpoint
            );


        const proveedores =
            await getJSON(
                response
            );


        // PUNTO 3: llegó una consulta más reciente; se descarta esta respuesta
        if (idSolicitud !== solicitudProveedores) {

            return;

        }


        if (!response.ok) {

            return;

        }


        // CAMBIO 3: se guarda el listado para el modal y el borrado
        proveedoresListado =
            proveedores;


        tabla.innerHTML =
            "";


        // PUNTO 3: mensaje cuando no hay resultados
        if (proveedores.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;color:var(--text-light);padding:20px 0;">
                        ${
                            termino
                                ? "No se encontraron proveedores con ese criterio."
                                : "No hay proveedores registrados."
                        }
                    </td>
                </tr>
            `;

            return;

        }


        proveedores.forEach(
            proveedor => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            proveedor.id_proveedor
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.nombre_proveedor
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.telefono
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.correo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.direccion
                        )}
                    </td>

                    <td>
                        Activo
                    </td>

                    ${celdaAccionesHTML(
                        proveedor.id_proveedor,
                        proveedor.nombre_proveedor
                    )}

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error obteniendo proveedores:",
            error
        );

    }

}


async function mostrarProveedores() {

    const tabla =
        document.querySelector(
            "#tablaProveedores tbody"
        );


    if (!tabla) {

        return;

    }


    // CAMBIO 3: listeners de Editar/Eliminar (se registran una sola vez
    // aunque la tabla se repinte muchas veces).
    activarAccionesTabla(
        "#tablaProveedores tbody",
        {
            editar: editarProveedor,
            eliminar: eliminarProveedor
        }
    );


    // PUNTO 3: se conecta el buscador (solo la primera vez) y se lee su texto
    activarBuscadorProveedores();

    const campoBusqueda =
        document.getElementById(
            "buscarProveedor"
        );

    const termino =
        campoBusqueda
            ? campoBusqueda.value.trim()
            : "";

    const idSolicitud =
        ++solicitudProveedores;


    try {

        // PUNTO 3: con texto se consulta /proveedores?search=..., sin texto el listado completo
        const endpoint =
            termino
                ? `/proveedores?search=${encodeURIComponent(termino)}`
                : "/proveedores";

        const response =
            await apiFetch(
                endpoint
            );


        const proveedores =
            await getJSON(
                response
            );


        // PUNTO 3: llegó una consulta más reciente; se descarta esta respuesta
        if (idSolicitud !== solicitudProveedores) {

            return;

        }


        if (!response.ok) {

            return;

        }


        // CAMBIO 3: se guarda el listado para el modal y el borrado
        proveedoresListado =
            proveedores;


        tabla.innerHTML =
            "";


        // PUNTO 3: mensaje cuando no hay resultados
        if (proveedores.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;color:var(--text-light);padding:20px 0;">
                        ${
                            termino
                                ? "No se encontraron proveedores con ese criterio."
                                : "No hay proveedores registrados."
                        }
                    </td>
                </tr>
            `;

            return;

        }


        proveedores.forEach(
            proveedor => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            proveedor.id_proveedor
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.nombre_proveedor
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.telefono
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.correo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            proveedor.direccion
                        )}
                    </td>

                    <td>
                        Activo
                    </td>

                    ${celdaAccionesHTML(
                        proveedor.id_proveedor,
                        proveedor.nombre_proveedor
                    )}

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error obteniendo proveedores:",
            error
        );

    }

}


// CAMBIO 3: abre el modal de edición con los datos actuales del proveedor
function editarProveedor(id) {

    const proveedor =
        proveedoresListado.find(
            item => Number(item.id_proveedor) === id
        );


    if (!proveedor) {

        mostrarToast(
            "No se encontró el proveedor. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    abrirModalEdicion({

        titulo: "Editar proveedor",

        campos: [

            {
                name: "nombre",
                etiqueta: "Nombre del proveedor",
                tipo: "text",
                valor: proveedor.nombre_proveedor,
                requerido: true,
                maxLength: 100
            },

            {
                name: "telefono",
                etiqueta: "Teléfono",
                tipo: "text",
                valor: proveedor.telefono,
                requerido: false,
                maxLength: 15,
                autocomplete: "off"
            },

            {
                name: "correo",
                etiqueta: "Correo electrónico",
                tipo: "email",
                valor: proveedor.correo,
                requerido: false,
                maxLength: 100,
                autocomplete: "off"
            },

            {
                name: "direccion",
                etiqueta: "Dirección",
                tipo: "text",
                valor: proveedor.direccion,
                requerido: false,
                maxLength: 255,
                autocomplete: "off"
            }

        ],

        // Los nombres del cuerpo coinciden con PUT /proveedores/:id del backend
        onGuardar: valores =>
            enviarEdicion(
                `/proveedores/${id}`,
                {
                    nombre: valores.nombre,
                    telefono: valores.telefono,
                    correo: valores.correo,
                    direccion: valores.direccion
                }
            ),

        onExito: mostrarProveedores

    });

}


// CAMBIO 3: confirma y elimina un proveedor (el backend bloquea el borrado
// si el proveedor tiene compras registradas)
function eliminarProveedor(id) {

    const proveedor =
        proveedoresListado.find(
            item => Number(item.id_proveedor) === id
        );


    if (!proveedor) {

        mostrarToast(
            "No se encontró el proveedor. Actualice la página e intente de nuevo.",
            "error"
        );

        return;

    }


    return eliminarRegistro({

        endpoint: `/proveedores/${id}`,

        nombre: proveedor.nombre_proveedor,

        onExito: mostrarProveedores

    });

}


/* =========================================================
   VENTAS
   ========================================================= */

async function conectarVentas() {

    const tabla =
        document.querySelector(
            "#tablaVentas tbody"
        );


    if (!tabla) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/ventas"
            );


        const ventas =
            await getJSON(
                response
            );


        if (!response.ok) {

            console.error(
                "Error obteniendo ventas:",
                ventas
            );

            return;

        }


        tabla.innerHTML =
            "";


        ventas.forEach(
            venta => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            venta.id_venta
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            venta.fecha_venta
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            venta.nombre_cliente ||
                            "Sin cliente"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            venta.nombre_usuario ||
                            "Sin usuario"
                        )}
                    </td>

                    <td>
                        $ ${Number(
                            venta.total_venta || 0
                        ).toLocaleString()}
                    </td>

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando ventas:",
            error
        );

    }

}


/* =========================================================
   COMPRAS
   ========================================================= */

let productosCompra = [];


async function inicializarCompras() {

    try {

        await cargarProveedoresCompra();

        await cargarProductosCompra();

        await cargarUsuariosSelect(
            "usuarioCompra"
        );


        productosCompra =
            [];


        mostrarDetalleCompra();


        const formCompra =
            document.getElementById(
                "formCompra"
            );


        if (formCompra) {

            formCompra.addEventListener(
                "submit",
                registrarCompraCompleta
            );

        }


        const botonAgregar =
            document.getElementById(
                "agregarProductoCompra"
            );


        if (
            botonAgregar
        ) {

            botonAgregar.addEventListener(
                "click",
                agregarProductoCompra
            );

        }

    } catch (error) {

        console.error(
            "Error inicializando compras:",
            error
        );

    }

}


async function cargarProveedoresCompra() {

    const select =
        document.getElementById(
            "proveedorCompra"
        );


    if (!select) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/proveedores"
            );


        const proveedores =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        select.innerHTML =
            `
            <option value="">
                Seleccione proveedor
            </option>
            `;


        proveedores.forEach(
            proveedor => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    proveedor.id_proveedor;


                option.textContent =
                    proveedor.nombre_proveedor;


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando proveedores:",
            error
        );

    }

}


async function cargarProductosCompra() {

    const select =
        document.getElementById(
            "productoCompra"
        );


    if (!select) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/productos"
            );


        const productos =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        select.innerHTML =
            `
            <option value="">
                Seleccione producto
            </option>
            `;


        productos.forEach(
            producto => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    producto.id_producto;


                option.dataset.precio =
                    producto.precio_unitario;


                option.textContent =
                    producto.nombre_producto;


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando productos para compra:",
            error
        );

    }

}


function agregarProductoCompra() {

    const select =
        document.getElementById(
            "productoCompra"
        );


    const cantidadInput =
        document.getElementById(
            "cantidadCompra"
        );


    const precioInput =
        document.getElementById(
            "precioCompra"
        );


    if (
        !select ||
        !cantidadInput ||
        !precioInput
    ) {

        return;

    }


    const idProducto =
        select.value;


    if (!idProducto) {

        alert(
            "Seleccione un producto."
        );

        return;

    }


    const nombreProducto =
        select
            .options[
                select.selectedIndex
            ]
            ?.text;


    const cantidad =
        Number(
            cantidadInput.value
        );


    const precio =
        Number(
            precioInput.value
        );


    if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {

        alert(
            "La cantidad debe ser un número entero mayor que cero."
        );

        return;

    }


    if (
        !Number.isFinite(precio) ||
        precio < 0
    ) {

        alert(
            "Ingrese un precio válido."
        );

        return;

    }


    const existente =
        productosCompra.find(
            producto =>
                Number(
                    producto.id_producto
                ) ===
                Number(idProducto)
        );


    if (existente) {

        existente.cantidad +=
            cantidad;

        existente.precio =
            precio;

    } else {

        productosCompra.push({

            id_producto:
                Number(idProducto),

            nombre_producto:
                nombreProducto,

            cantidad,

            precio

        });

    }


    mostrarDetalleCompra();


    cantidadInput.value =
        "";

    precioInput.value =
        "";

}


function mostrarDetalleCompra() {

    const tabla =
        document.querySelector(
            "#tablaDetalleCompra tbody"
        );


    if (!tabla) {

        return;

    }


    tabla.innerHTML =
        "";


    let total =
        0;


    productosCompra.forEach(
        (producto, index) => {

            const subtotal =
                Number(
                    producto.cantidad
                ) *
                Number(
                    producto.precio
                );


            total +=
                subtotal;


            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `

                <td>
                    ${escapeHTML(
                        producto.nombre_producto
                    )}
                </td>

                <td>
                    ${producto.cantidad}
                </td>

                <td>
                    $ ${Number(
                        producto.precio
                    ).toLocaleString()}
                </td>

                <td>
                    $ ${subtotal.toLocaleString()}
                </td>

                <td>

                    <button
                        type="button"
                        onclick="eliminarProductoCompra(${index})"
                    >
                        Eliminar
                    </button>

                </td>

            `;


            tabla.appendChild(
                fila
            );

        }
    );


    const totalElemento =
        document.getElementById(
            "totalCompra"
        );


    if (totalElemento) {

        totalElemento.textContent =
            "$ " +
            total.toLocaleString();

    }

}


function eliminarProductoCompra(index) {

    productosCompra.splice(
        index,
        1
    );


    mostrarDetalleCompra();

}


async function registrarCompraCompleta(event) {

    event.preventDefault();


    const proveedor =
        document.getElementById(
            "proveedorCompra"
        )?.value;


    const usuario =
        document.getElementById(
            "usuarioCompra"
        )?.value;


    if (!proveedor) {

        alert(
            "Seleccione un proveedor."
        );

        return;

    }


    if (!usuario) {

        alert(
            "Seleccione un usuario."
        );

        return;

    }


    if (
        productosCompra.length === 0
    ) {

        alert(
            "Debe agregar al menos un producto."
        );

        return;

    }


    try {

        const response =
            await apiFetch(

                "/compras/completa",

                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            proveedor:
                                Number(proveedor),

                            usuario:
                                Number(usuario),

                            productos:
                                productosCompra.map(
                                    producto => ({

                                        id_producto:
                                            Number(
                                                producto.id_producto
                                            ),

                                        cantidad:
                                            Number(
                                                producto.cantidad
                                            ),

                                        precio:
                                            Number(
                                                producto.precio
                                            )

                                    })
                                )

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        if (!response.ok) {

            throw new Error(

                data.error ||
                data.message ||
                "Error registrando compra."

            );

        }


        alert(

            data.mensaje ||
            "Compra registrada correctamente."

        );


        productosCompra =
            [];


        mostrarDetalleCompra();


        document
            .getElementById(
                "formCompra"
            )
            ?.reset();


        cargarInventario();

        mostrarMovimientos();

        mostrarAlertas();

    } catch (error) {

        console.error(
            "Error registrando compra:",
            error
        );

        alert(
            error.message
        );

    }

}


/* =========================================================
   INVENTARIO
   ========================================================= */

async function cargarInventario() {

    const tabla =
        document.querySelector(
            "#tablaInventario tbody"
        );


    if (!tabla) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/productos"
            );


        const productos =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        tabla.innerHTML =
            "";


        productos.forEach(
            producto => {

                const stock =
                    Number(
                        producto.stock_actual
                    );


                const minimo =
                    Number(
                        producto.stock_minimo
                    );


                let estado =
                    "Disponible";


                if (
                    stock <= minimo
                ) {

                    estado =
                        "Stock Bajo";

                }


                if (
                    stock <= minimo * 0.5
                ) {

                    estado =
                        "Crítico";

                }


                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            producto.id_producto
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.nombre_producto
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.nombre_categoria
                        )}
                    </td>

                    <td>
                        $ ${Number(
                            producto.precio_unitario
                        ).toLocaleString()}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.stock_actual
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            producto.stock_minimo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            estado
                        )}
                    </td>

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando inventario:",
            error
        );

    }

}


/* =========================================================
   MOVIMIENTOS
   ========================================================= */

async function mostrarMovimientos() {

    const tabla =
        document.querySelector(
            "#tablaMovimientos tbody"
        );


    if (!tabla) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/movimientos"
            );


        const movimientos =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        tabla.innerHTML =
            "";


        movimientos.forEach(
            movimiento => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            movimiento.id_movimiento
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movimiento.fecha_movimiento
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movimiento.nombre_producto
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movimiento.tipo_movimiento
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movimiento.cantidad
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movimiento.referencia_tipo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movimiento.observaciones
                        )}
                    </td>

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando movimientos:",
            error
        );

    }

}


/* =========================================================
   ALERTAS
   ========================================================= */

async function mostrarAlertas() {

    const tabla =
        document.querySelector(
            "#tablaAlertas tbody"
        );


    if (!tabla) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/alertas"
            );


        const alertas =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        tabla.innerHTML =
            "";


        alertas.forEach(
            alerta => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            alerta.id_producto
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            alerta.nombre_producto
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            alerta.stock_actual
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            alerta.stock_minimo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            alerta.prioridad
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="reponerStock(${Number(
                                alerta.id_producto
                            )})"
                        >
                            Reponer
                        </button>

                    </td>

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando alertas:",
            error
        );

    }

}


/* =========================================================
   REPONER STOCK
   ========================================================= */

async function reponerStock(
    idProducto
) {

    const cantidad =
        prompt(
            "Ingrese la cantidad que desea reponer:"
        );


    if (
        cantidad === null ||
        cantidad === "" ||
        !Number.isInteger(
            Number(cantidad)
        ) ||
        Number(cantidad) <= 0
    ) {

        alert(
            "Ingrese una cantidad válida."
        );

        return;

    }


    try {

        const response =
            await apiFetch(

                `/productos/${idProducto}/reponer`,

                {

                    method: "PUT",

                    body:
                        JSON.stringify({

                            cantidad:
                                Number(cantidad)

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        if (!response.ok) {

            throw new Error(

                data.error ||
                data.message ||
                "Error reponiendo stock."

            );

        }


        alert(

            data.mensaje ||
            "Stock actualizado correctamente."

        );


        await cargarInventario();

        await mostrarAlertas();

        await mostrarMovimientos();

        await cargarDashboard();

    } catch (error) {

        console.error(
            "Error reponiendo stock:",
            error
        );

        alert(
            error.message
        );

    }

}


/* =========================================================
   USUARIOS
   ========================================================= */

async function mostrarUsuarios() {

    const tabla =
        document.querySelector(
            "#tablaUsuarios tbody"
        );


    if (!tabla) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/usuarios"
            );


        const usuarios =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        tabla.innerHTML =
            "";


        usuarios.forEach(
            usuario => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                fila.innerHTML = `

                    <td>
                        ${escapeHTML(
                            usuario.id_usuario
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            usuario.nombre_usuario
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            usuario.correo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            usuario.nombre_rol
                        )}
                    </td>

                    <td>
                        Activo
                    </td>

                `;


                tabla.appendChild(
                    fila
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );

    }

}


/* =========================================================
   REGISTRAR USUARIO ADMINISTRATIVO
   ========================================================= */

async function registrarUsuarioAdmin(event) {

    event.preventDefault();


    const nombre =
        document
            .getElementById(
                "nombreUsuario"
            )
            ?.value
            .trim();


    const correo =
        document
            .getElementById(
                "correoUsuario"
            )
            ?.value
            .trim()
            .toLowerCase();


    const rol =
        document
            .getElementById(
                "rolUsuario"
            )
            ?.value;


    const password =
        document
            .getElementById(
                "passwordUsuario"
            )
            ?.value;


    if (
        !nombre ||
        !correo ||
        !rol
    ) {

        alert(
            "Todos los campos obligatorios deben estar completos."
        );

        return;

    }


    if (
        !validarEmail(correo)
    ) {

        alert(
            "Ingrese un correo electrónico válido."
        );

        return;

    }


    try {

        const response =
            await apiFetch(

                "/usuarios",

                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            nombre,

                            correo,

                            rol:
                                Number(rol),

                            ...(password
                                ? {
                                    password
                                }
                                : {})

                        })

                }

            );


        const data =
            await getJSON(
                response
            );


        if (!response.ok) {

            throw new Error(

                data.error ||
                data.message ||
                "Error registrando usuario."

            );

        }


        alert(

            data.mensaje ||
            data.message ||
            "Usuario registrado correctamente."

        );


        document
            .getElementById(
                "formUsuario"
            )
            ?.reset();


        mostrarUsuarios();


    } catch (error) {

        console.error(
            "Error registrando usuario:",
            error
        );

        alert(
            error.message
        );

    }

}


/* =========================================================
   CARGAR USUARIOS EN SELECT
   ========================================================= */

async function cargarUsuariosSelect(
    idSelect
) {

    const select =
        document.getElementById(
            idSelect
        );


    if (!select) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/usuarios"
            );


        const usuarios =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        select.innerHTML =
            `
            <option value="">
                Seleccione usuario
            </option>
            `;


        usuarios.forEach(
            usuario => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    usuario.id_usuario;


                option.textContent =
                    usuario.nombre_usuario;


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );

    }

}


/* =========================================================
   DASHBOARD
   ========================================================= */

// PUNTO 2: fecha local del equipo del usuario en formato YYYY-MM-DD
// (se usa la local y no la UTC de toISOString(), que de noche daría el día siguiente)
function fechaLocalISO(fecha = new Date()) {

    const anio =
        fecha.getFullYear();

    const mes =
        String(fecha.getMonth() + 1).padStart(2, "0");

    const dia =
        String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;

}


// PUNTO 2: fecha en formato DD/MM/YYYY para mostrar en pantalla
function formatearFechaCorta(fecha = new Date()) {

    const dia =
        String(fecha.getDate()).padStart(2, "0");

    const mes =
        String(fecha.getMonth() + 1).padStart(2, "0");

    return `${dia}/${mes}/${fecha.getFullYear()}`;

}


// PUNTO 2: escribe "Hoy: DD/MM/YYYY" en las tarjetas "de hoy"
function mostrarFechaHoyDashboard(fecha) {

    const texto =
        `Hoy: ${formatearFechaCorta(fecha)}`;


    [
        "fechaEntradasHoy",
        "fechaSalidasHoy"
    ].forEach(
        id => {

            const elemento =
                document.getElementById(id);

            if (elemento) {

                elemento.textContent = texto;

            }

        }
    );

}


async function cargarDashboard() {

    // PUNTO 2: la fecha de "hoy" se toma del sistema en CADA carga
    // (nunca fija), así cambia sola cuando pasa la medianoche.
    const ahora =
        new Date();


    mostrarFechaHoyDashboard(
        ahora
    );


    try {

        const response =
            await apiFetch(
                `/dashboard?fecha=${fechaLocalISO(ahora)}`
            );


        const datos =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        const totalProductos =
            document.getElementById(
                "totalProductos"
            );


        const totalAlertas =
            document.getElementById(
                "totalAlertas"
            );


        if (totalProductos) {

            totalProductos.textContent =
                datos.totalProductos;

        }


        if (totalAlertas) {

            totalAlertas.textContent =
                datos.totalAlertas;

        }


        // PUNTO 1: la tarjeta de alertas se pone roja si hay al menos una
        aplicarEstadoAlertas(
            Number(datos.totalAlertas)
        );


        // PUNTO 2: valores de las 4 tarjetas de movimientos
        // (reemplazan a la antigua tarjeta "Movimientos registrados")
        [
            "entradasTotales",
            "entradasHoy",
            "salidasTotales",
            "salidasHoy"
        ].forEach(
            id => {

                const elemento =
                    document.getElementById(id);

                if (elemento) {

                    elemento.textContent =
                        Number(datos[id] || 0)
                            .toLocaleString("es-CO");

                }

            }
        );

    } catch (error) {

        console.error(
            "Error cargando dashboard:",
            error
        );

    }

}


// PUNTO 1: activa o quita el rojo de la tarjeta de alertas de stock
function aplicarEstadoAlertas(totalAlertas) {

    const tarjeta =
        document.getElementById(
            "tarjetaAlertas"
        );


    if (!tarjeta) {

        return;

    }


    const hayAlertas =
        Number.isFinite(totalAlertas) &&
        totalAlertas > 0;


    tarjeta.classList.toggle(
        "alerta-activa",
        hayAlertas
    );

}


// PUNTO 1: mantiene el dashboard al día sin recargar la página.
// Vuelve a consultar cada 60 segundos y cada vez que el usuario regresa
// a la pestaña. Se registra una sola vez aunque se llame varias veces.
let temporizadorDashboard = null;


function iniciarActualizacionDashboard() {

    if (temporizadorDashboard !== null) {

        return;

    }


    temporizadorDashboard =
        setInterval(
            () => {

                if (document.visibilityState === "visible") {

                    cargarDashboard();

                }

            },
            60000
        );


    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.visibilityState === "visible") {

                cargarDashboard();

            }

        }
    );

}


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        /* -----------------------------------------
           LOGIN
        ----------------------------------------- */

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                iniciarSesion
            );

        }


        /* -----------------------------------------
           REGISTRO DE CUENTA
        ----------------------------------------- */

        const registerForm =
            document.getElementById(
                "registerForm"
            );


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                registrarCuenta
            );


            cargarRoles();

        }


        /* -----------------------------------------
           PASSWORD LOGIN
        ----------------------------------------- */

        const toggleLogin =
            document.getElementById(
                "togglePassword"
            );


        if (toggleLogin) {

            toggleLogin.addEventListener(

                "click",

                () => {

                    togglePassword(

                        "password",

                        "togglePassword"

                    );

                }

            );

        }


        /* -----------------------------------------
           PASSWORD CONFIRMACIÓN
        ----------------------------------------- */

        const toggleConfirm =
            document.getElementById(
                "toggleConfirmPassword"
            );


        if (toggleConfirm) {

            toggleConfirm.addEventListener(

                "click",

                () => {

                    togglePassword(

                        "confirmPassword",

                        "toggleConfirmPassword"

                    );

                }

            );

        }


        /* -----------------------------------------
           PRODUCTOS
        ----------------------------------------- */

        const formProducto =
            document.getElementById(
                "formProducto"
            );


        if (formProducto) {

            formProducto.addEventListener(
                "submit",
                registrarProducto
            );

            cargarCategorias();

        }


        if (
            document.querySelector(
                "#tablaProductos tbody"
            )
        ) {

            await mostrarProductos();

            await cargarCategorias();

        }


        /* -----------------------------------------
           CATEGORÍAS
        ----------------------------------------- */

        const formCategoria =
            document.getElementById(
                "formCategoria"
            );


        if (formCategoria) {

            formCategoria.addEventListener(
                "submit",
                registrarCategoria
            );

            mostrarCategorias();

        }


        /* -----------------------------------------
           CLIENTES
        ----------------------------------------- */

        const formCliente =
            document.getElementById(
                "formCliente"
            );


        if (formCliente) {

            formCliente.addEventListener(
                "submit",
                registrarCliente
            );

            mostrarClientes();

        }


        /* -----------------------------------------
           PROVEEDORES
        ----------------------------------------- */

        const formProveedor =
            document.getElementById(
                "formProveedor"
            );


        if (formProveedor) {

            formProveedor.addEventListener(
                "submit",
                registrarProveedor
            );

            mostrarProveedores();

        }


        /* -----------------------------------------
           VENTAS
        ----------------------------------------- */

        if (
            document.querySelector(
                "#tablaVentas tbody"
            )
        ) {

            conectarVentas();

        }


        /* -----------------------------------------
           COMPRAS
        ----------------------------------------- */

        if (
            document.getElementById(
                "formCompra"
            )
        ) {

            inicializarCompras();

        }


        /* -----------------------------------------
           INVENTARIO
        ----------------------------------------- */

        if (
            document.querySelector(
                "#tablaInventario tbody"
            )
        ) {

            cargarInventario();

        }


        /* -----------------------------------------
           MOVIMIENTOS
        ----------------------------------------- */

        if (
            document.querySelector(
                "#tablaMovimientos tbody"
            )
        ) {

            mostrarMovimientos();

        }


        /* -----------------------------------------
           ALERTAS
        ----------------------------------------- */

        if (
            document.querySelector(
                "#tablaAlertas tbody"
            )
        ) {

            mostrarAlertas();

        }


        /* -----------------------------------------
           USUARIOS
        ----------------------------------------- */

        if (
            document.querySelector(
                "#tablaUsuarios tbody"
            )
        ) {

            mostrarUsuarios();

        }


        const formUsuario =
            document.getElementById(
                "formUsuario"
            );


        if (formUsuario) {

            formUsuario.addEventListener(
                "submit",
                registrarUsuarioAdmin
            );


            cargarRoles();

        }


        /* -----------------------------------------
           DASHBOARD
        ----------------------------------------- */

        if (
            document.getElementById(
                "totalProductos"
            )
        ) {

            cargarDashboard();
            // PUNTO 1: actualización automática (cada 60 s y al volver a la pestaña)
            iniciarActualizacionDashboard();

        }


        /* -----------------------------------------
           LOGOUT
        ----------------------------------------- */

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }

    }

);