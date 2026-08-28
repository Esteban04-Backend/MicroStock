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


async function mostrarCategorias() {

    const tabla =
        document.querySelector(
            "#tablaCategorias tbody"
        );


    if (!tabla) {

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


        tabla.innerHTML =
            "";


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


async function mostrarProductos() {

    const tabla =
        document.querySelector(
            "#tablaProductos tbody"
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
            "Error obteniendo productos:",
            error
        );

    }

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


async function mostrarClientes() {

    const tabla =
        document.querySelector(
            "#tablaClientes tbody"
        );


    if (!tabla) {

        return;

    }


    try {

        const response =
            await apiFetch(
                "/clientes"
            );


        const clientes =
            await getJSON(
                response
            );


        if (!response.ok) {

            return;

        }


        tabla.innerHTML =
            "";


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


async function mostrarProveedores() {

    const tabla =
        document.querySelector(
            "#tablaProveedores tbody"
        );


    if (!tabla) {

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


        tabla.innerHTML =
            "";


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

async function cargarDashboard() {

    try {

        const response =
            await apiFetch(
                "/dashboard"
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


        const totalMovimientos =
            document.getElementById(
                "totalMovimientos"
            );


        if (totalProductos) {

            totalProductos.textContent =
                datos.totalProductos;

        }


        if (totalAlertas) {

            totalAlertas.textContent =
                datos.totalAlertas;

        }


        if (totalMovimientos) {

            totalMovimientos.textContent =
                datos.totalMovimientos;

        }

    } catch (error) {

        console.error(
            "Error cargando dashboard:",
            error
        );

    }

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