"use strict";

/* =========================================================
   MICROSTOCK - BACKEND
   Node.js + Express + MySQL + JWT + bcrypt
   ========================================================= */

require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const {
    body,
    param,
    validationResult
} = require("express-validator");


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "MICROSTOCK_DEV_SECRET_CAMBIAR_EN_PRODUCCION";

if (!process.env.JWT_SECRET) {
    console.warn(
        "ADVERTENCIA: JWT_SECRET no está configurado en .env. " +
        "Se utilizará una clave temporal de desarrollo."
    );
}


/* =========================================================
   MIDDLEWARES
   ========================================================= */

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

app.use(
    cors({
        origin: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(
    express.json({
        limit: "1mb"
    })
);


/* =========================================================
   CONEXIÓN MYSQL
   ========================================================= */

const db = mysql.createPool({
    host:
        process.env.DB_HOST ||
        "localhost",

    user:
        process.env.DB_USER ||
        "root",

    password:
        process.env.DB_PASSWORD ||
        "",

    database:
        process.env.DB_NAME ||
        "MicroStock",

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0
});


/* =========================================================
   VALIDACIÓN GENERAL
   ========================================================= */

function validarRequest(req, res, next) {

    const errors =
        validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({

            success: false,

            message:
                "Los datos enviados no son válidos.",

            errors:
                errors.array().map(error => ({

                    field:
                        error.path,

                    message:
                        error.msg

                }))

        });

    }

    next();
}


/* =========================================================
   JWT
   ========================================================= */

function generarToken(usuario) {

    return jwt.sign(

        {
            id_usuario:
                usuario.id_usuario,

            correo:
                usuario.correo,

            id_rol:
                usuario.id_rol,

            nombre_rol:
                usuario.nombre_rol

        },

        JWT_SECRET,

        {
            expiresIn: "2h"
        }

    );
}


function autenticarToken(req, res, next) {

    const authorization =
        req.headers.authorization;

    if (
        !authorization ||
        !authorization.startsWith("Bearer ")
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Acceso no autorizado. Debe iniciar sesión."

        });

    }

    const token =
        authorization.substring(7);

    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.user =
            decoded;

        next();

    } catch (error) {

        return res.status(401).json({

            success: false,

            message:
                "La sesión ha expirado o el token no es válido."

        });

    }
}

/* =========================================================
   CAMBIO 3: SOLO ADMINISTRADOR
   ========================================================= */

const ROL_ADMINISTRADOR = "administrador";

// Debe usarse DESPUÉS de autenticarToken (necesita req.user).
// Consulta el rol ACTUAL en la base de datos, no el del token: así, si un
// administrador es degradado o eliminado, pierde el acceso de inmediato.
async function soloAdmin(req, res, next) {

    try {

        const [
            filas
        ] =
            await db.execute(
                `
                SELECT
                    r.nombre_rol
                FROM Usuario u
                INNER JOIN Rol r
                    ON u.id_rol = r.id_rol
                WHERE u.id_usuario = ?
                `,
                [req.user.id_usuario]
            );

        if (
            filas.length === 0 ||
            String(filas[0].nombre_rol)
                .trim()
                .toLowerCase() !== ROL_ADMINISTRADOR
        ) {

            return res.status(403).json({

                success: false,

                error:
                    "No tiene permisos para realizar esta acción. Se requiere rol Administrador.",

                message:
                    "No tiene permisos para realizar esta acción. Se requiere rol Administrador."

            });

        }

        next();

    } catch (error) {

        console.error("Error verificando permisos:", error);

        return res.status(500).json({

            success: false,

            error:
                "No fue posible verificar los permisos."

        });

    }

}

/* =========================================================
   LIMITADOR DE LOGIN
   ========================================================= */

const loginLimiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        max:
            10,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {

            success: false,

            message:
                "Demasiados intentos de inicio de sesión. Intente nuevamente más tarde."

        }

    });


/* =========================================================
   RUTA PRINCIPAL
   ========================================================= */

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            message:
                "API de MicroStock funcionando correctamente."

        });

    }
);


/* =========================================================
   AUTENTICACIÓN - ROLES
   ========================================================= */

app.get(
    "/roles",
    async (req, res) => {

        try {

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        id_rol,
                        nombre_rol,
                        descripcion_rol
                    FROM Rol
                    ORDER BY nombre_rol
                    `

                );

            res.json(result);

        } catch (error) {

            console.error(
                "Error obteniendo roles:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Error obteniendo roles."

            });

        }

    }
);


/* =========================================================
   AUTENTICACIÓN - REGISTRO
   ========================================================= */

app.post(

    "/api/auth/register",

    [

        body("nombre")
            .trim()
            .notEmpty()
            .withMessage(
                "El nombre es obligatorio."
            )
            .isLength({
                max: 100
            })
            .withMessage(
                "El nombre no puede superar 100 caracteres."
            ),

        body("correo")
            .trim()
            .isEmail()
            .withMessage(
                "Ingrese un correo electrónico válido."
            )
            .normalizeEmail()
            .isLength({
                max: 100
            }),

        body("password")
            .isLength({
                min: 6,
                max: 100
            })
            .withMessage(
                "La contraseña debe tener entre 6 y 100 caracteres."
            ),

        body("rol")
            .isInt({
                min: 1
            })
            .withMessage(
                "Seleccione un rol válido."
            )

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                nombre,
                correo,
                password,
                rol
            } = req.body;


            /* -----------------------------------------
               VERIFICAR CORREO
            ----------------------------------------- */

            const [
                usuarios
            ] =
                await db.execute(

                    `
                    SELECT
                        id_usuario
                    FROM Usuario
                    WHERE correo = ?
                    LIMIT 1
                    `,

                    [correo]

                );


            if (
                usuarios.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "El correo electrónico ya está registrado. Por favor, use otro."

                });

            }


            /* -----------------------------------------
               VERIFICAR ROL
            ----------------------------------------- */

            const [
                roles
            ] =
                await db.execute(

                    `
                    SELECT
                        id_rol
                    FROM Rol
                    WHERE id_rol = ?
                    LIMIT 1
                    `,

                    [rol]

                );


            if (
                roles.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "El rol seleccionado no existe."

                });

            }


            /* -----------------------------------------
               HASH DE CONTRASEÑA
            ----------------------------------------- */

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            /* -----------------------------------------
               INSERTAR USUARIO
            ----------------------------------------- */

            const [
                result
            ] =
                await db.execute(

                    `
                    INSERT INTO Usuario
                    (
                        nombre_usuario,
                        correo,
                        contrasena_hash,
                        id_rol
                    )
                    VALUES (?, ?, ?, ?)
                    `,

                    [
                        nombre,
                        correo,
                        passwordHash,
                        rol
                    ]

                );


            return res.status(201).json({

                success: true,

                message:
                    "Usuario registrado correctamente.",

                id_usuario:
                    result.insertId

            });

        } catch (error) {

            console.error(
                "Error registrando usuario:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "El correo electrónico ya está registrado. Por favor, use otro."

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "No fue posible registrar el usuario."

            });

        }

    }

);


/* =========================================================
   AUTENTICACIÓN - LOGIN
   ========================================================= */

app.post(

    "/api/auth/login",

    loginLimiter,

    [

        body("correo")
            .trim()
            .isEmail()
            .withMessage(
                "Ingrese un correo electrónico válido."
            )
            .normalizeEmail(),

        body("password")
            .notEmpty()
            .withMessage(
                "La contraseña es obligatoria."
            )

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                correo,
                password
            } = req.body;


            /* -----------------------------------------
               BUSCAR USUARIO
            ----------------------------------------- */

            const [
                usuarios
            ] =
                await db.execute(

                    `
                    SELECT
                        u.id_usuario,
                        u.nombre_usuario,
                        u.correo,
                        u.contrasena_hash,
                        u.id_rol,
                        r.nombre_rol
                    FROM Usuario u
                    INNER JOIN Rol r
                        ON u.id_rol = r.id_rol
                    WHERE u.correo = ?
                    LIMIT 1
                    `,

                    [correo]

                );


            if (
                usuarios.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Credenciales inválidas. Por favor, intente de nuevo."

                });

            }


            const usuario =
                usuarios[0];


            /* -----------------------------------------
               COMPARAR CONTRASEÑA
            ----------------------------------------- */

            const passwordCorrecta =
                await bcrypt.compare(

                    password,

                    usuario.contrasena_hash

                );


            if (!passwordCorrecta) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Credenciales inválidas. Por favor, intente de nuevo."

                });

            }


            /* -----------------------------------------
               GENERAR JWT
            ----------------------------------------- */

            const token =
                generarToken(
                    usuario
                );


            return res.json({

                success: true,

                message:
                    "Inicio de sesión exitoso.",

                token,

                user: {

                    id_usuario:
                        usuario.id_usuario,

                    nombre_usuario:
                        usuario.nombre_usuario,

                    correo:
                        usuario.correo,

                    id_rol:
                        usuario.id_rol,

                    nombre_rol:
                        usuario.nombre_rol

                }

            });

        } catch (error) {

            console.error(
                "Error en login:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "No fue posible procesar el inicio de sesión."

            });

        }

    }

);


/* =========================================================
   CATEGORÍAS
   ========================================================= */

app.get(
    "/categorias",
    autenticarToken,
    async (req, res) => {

        try {

            // PUNTO 2: búsqueda opcional ?search=texto (nombre o descripción).
            // Se ignora si no es texto (ej.: ?search=a&search=b) y se limita
            // a 100 caracteres y 5 palabras (mismo criterio que /productos).
            const textoBusqueda =
                typeof req.query.search === "string"
                    ? req.query.search
                        .trim()
                        .toLowerCase()
                        .slice(0, 100)
                    : "";

            const terminos =
                textoBusqueda
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 5);

            let filtro = "";

            const parametros = [];

            if (terminos.length > 0) {

                // Cada palabra debe aparecer en el nombre O en la descripción.
                // LOWER() + LIKE: no distingue mayúsculas; las tildes las
                // ignora la collation "ai_ci" de la tabla. El texto escrito
                // por el usuario va SIEMPRE como parámetro (?), nunca
                // concatenado al SQL.
                const condiciones =
                    terminos.map(
                        () => `(
                            LOWER(nombre_categoria) LIKE ?
                            OR
                            LOWER(descripcion_categoria) LIKE ?
                        )`
                    );

                filtro =
                    `WHERE ${condiciones.join(" AND ")}`;

                terminos.forEach(
                    termino => {

                        // Se escapan \ % _ para buscarlos como texto literal
                        // y no como comodines de LIKE.
                        const patron =
                            `%${termino.replace(/[\\%_]/g, "\\$&")}%`;

                        parametros.push(
                            patron,
                            patron
                        );

                    }
                );

            }

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        id_categoria,
                        nombre_categoria,
                        descripcion_categoria
                    FROM Categoria
                    ${filtro}
                    ORDER BY nombre_categoria
                    `,

                    parametros

                );

            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Error al obtener categorías."

            });

        }

    }
);


app.post(

    "/categorias",

    autenticarToken,

    [

        body("nombre")
            .trim()
            .notEmpty()
            .withMessage(
                "El nombre de la categoría es obligatorio."
            )
            .isLength({
                max: 100
            }),

        body("descripcion")
            .optional({
                nullable: true
            })
            .trim()
            .isLength({
                max: 500
            })

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                nombre,
                descripcion
            } = req.body;


            await db.execute(

                `
                INSERT INTO Categoria
                (
                    nombre_categoria,
                    descripcion_categoria
                )
                VALUES (?, ?)
                `,

                [
                    nombre,
                    descripcion || null
                ]

            );


            res.status(201).json({

                success: true,

                mensaje:
                    "Categoría guardada correctamente."

            });

        } catch (error) {

            console.error(error);

            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({

                    success: false,

                    error:
                        "La categoría ya existe."

                });

            }

            res.status(500).json({

                success: false,

                error:
                    "Error al guardar categoría."

            });

        }

    }

);


/* =========================================================
   PRODUCTOS
   ========================================================= */

app.get(
    "/productos",
    autenticarToken,
    async (req, res) => {

        try {

            // CAMBIO 4: búsqueda opcional ?search=texto
            // Se ignora si no es texto (ej.: ?search=a&search=b) y se limita
            // a 100 caracteres y 5 palabras.
            const textoBusqueda =
                typeof req.query.search === "string"
                    ? req.query.search
                        .trim()
                        .toLowerCase()
                        .slice(0, 100)
                    : "";

            const terminos =
                textoBusqueda
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 5);

            let filtro = "";

            const parametros = [];

            if (terminos.length > 0) {

                // Cada palabra debe aparecer en el nombre O en la categoría.
                // LOWER() + LIKE: no distingue mayúsculas. Las tildes las
                // ignora la collation de la tabla (en MySQL 8 y MariaDB la
                // predeterminada ya es "ai_ci"). No se fuerza ninguna
                // collation por nombre porque MySQL 8 y MariaDB no usan los
                // mismos nombres y la consulta fallaría en uno de los dos.
                // El texto del SQL solo repite esta estructura fija; el
                // contenido escrito por el usuario va SIEMPRE como parámetro (?).
                const condiciones =
                    terminos.map(
                        () => `(
                            LOWER(p.nombre_producto) LIKE ?
                            OR
                            LOWER(c.nombre_categoria) LIKE ?
                        )`
                    );

                filtro =
                    `WHERE ${condiciones.join(" AND ")}`;

                terminos.forEach(
                    termino => {

                        // Se escapan \ % _ para que se busquen como texto
                        // literal y no como comodines de LIKE.
                        const patron =
                            `%${termino.replace(/[\\%_]/g, "\\$&")}%`;

                        parametros.push(
                            patron,
                            patron
                        );

                    }
                );

            }

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        p.id_producto,
                        p.nombre_producto,
                        p.precio_unitario,
                        p.stock_actual,
                        p.stock_minimo,
                        p.id_categoria,
                        c.nombre_categoria
                    FROM Producto p
                    INNER JOIN Categoria c
                        ON p.id_categoria =
                           c.id_categoria
                    ${filtro}
                    ORDER BY p.id_producto
                    `,

                    parametros

                );

            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error al obtener productos."

            });

        }

    }
);

app.post(

    "/productos",

    autenticarToken,

    [

        body("nombre")
            .trim()
            .notEmpty()
            .isLength({
                max: 100
            }),

        body("precio")
            .isFloat({
                min: 0
            }),

        body("stock")
            .isInt({
                min: 0
            }),

        body("minimo")
            .isInt({
                min: 0
            }),

        body("categoria")
            .isInt({
                min: 1
            })

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                nombre,
                precio,
                stock,
                minimo,
                categoria
            } = req.body;


            const [
                categoriaExiste
            ] =
                await db.execute(

                    `
                    SELECT
                        id_categoria
                    FROM Categoria
                    WHERE id_categoria = ?
                    `,

                    [categoria]

                );


            if (
                categoriaExiste.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "La categoría no existe."

                });

            }


            await db.execute(

                `
                INSERT INTO Producto
                (
                    nombre_producto,
                    precio_unitario,
                    stock_actual,
                    stock_minimo,
                    id_categoria
                )
                VALUES (?, ?, ?, ?, ?)
                `,

                [
                    nombre,
                    precio,
                    stock,
                    minimo,
                    categoria
                ]

            );


            res.status(201).json({

                success: true,

                mensaje:
                    "Producto guardado correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error al guardar producto."

            });

        }

    }

);


/* =========================================================
   CLIENTES
   ========================================================= */

app.get(
    "/clientes",
    autenticarToken,
    async (req, res) => {

        try {

            // PUNTO 4: búsqueda opcional ?search=texto (nombre, correo o teléfono).
            // Se ignora si no es texto (ej.: ?search=a&search=b) y se limita
            // a 100 caracteres y 5 palabras (mismo criterio que /productos).
            const textoBusqueda =
                typeof req.query.search === "string"
                    ? req.query.search
                        .trim()
                        .toLowerCase()
                        .slice(0, 100)
                    : "";

            const terminos =
                textoBusqueda
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 5);

            let filtro = "";

            const parametros = [];

            if (terminos.length > 0) {

                // Cada palabra debe aparecer en nombre O correo O teléfono.
                // LOWER() + LIKE: no distingue mayúsculas; las tildes las
                // ignora la collation "ai_ci" de la tabla. El texto escrito
                // por el usuario va SIEMPRE como parámetro (?), nunca
                // concatenado al SQL.
                const condiciones =
                    terminos.map(
                        () => `(
                            LOWER(nombre_cliente) LIKE ?
                            OR
                            LOWER(correo) LIKE ?
                            OR
                            LOWER(telefono) LIKE ?
                        )`
                    );

                filtro =
                    `WHERE ${condiciones.join(" AND ")}`;

                terminos.forEach(
                    termino => {

                        // Se escapan \ % _ para buscarlos como texto literal
                        // y no como comodines de LIKE.
                        const patron =
                            `%${termino.replace(/[\\%_]/g, "\\$&")}%`;

                        parametros.push(
                            patron,
                            patron,
                            patron
                        );

                    }
                );

            }

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        id_cliente,
                        nombre_cliente,
                        telefono,
                        correo,
                        direccion
                    FROM Cliente
                    ${filtro}
                    ORDER BY id_cliente
                    `,

                    parametros

                );

            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error al obtener clientes."

            });

        }

    }
);


app.post(

    "/clientes",

    autenticarToken,

    [

        body("nombre")
            .trim()
            .notEmpty()
            .isLength({
                max: 100
            }),

        body("telefono")
            .optional({
                nullable: true
            })
            .trim()
            .isLength({
                max: 15
            }),

        body("correo")
            .optional({
                nullable: true
            })
            .trim()
            .custom(value => {

                if (
                    value &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ) {

                    throw new Error(
                        "El correo no es válido."
                    );

                }

                return true;

            }),

        body("direccion")
            .optional({
                nullable: true
            })
            .trim()
            .isLength({
                max: 255
            })

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                nombre,
                telefono,
                correo,
                direccion
            } = req.body;


            await db.execute(

                `
                INSERT INTO Cliente
                (
                    nombre_cliente,
                    telefono,
                    correo,
                    direccion
                )
                VALUES (?, ?, ?, ?)
                `,

                [
                    nombre,
                    telefono || null,
                    correo || null,
                    direccion || null
                ]

            );


            res.status(201).json({

                success: true,

                mensaje:
                    "Cliente registrado correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error al guardar cliente."

            });

        }

    }

);


/* =========================================================
   PROVEEDORES
   ========================================================= */

app.get(
    "/proveedores",
    autenticarToken,
    async (req, res) => {

        try {

            // PUNTO 3: búsqueda opcional ?search=texto (nombre, correo o teléfono).
            // Se ignora si no es texto (ej.: ?search=a&search=b) y se limita
            // a 100 caracteres y 5 palabras (mismo criterio que /productos).
            const textoBusqueda =
                typeof req.query.search === "string"
                    ? req.query.search
                        .trim()
                        .toLowerCase()
                        .slice(0, 100)
                    : "";

            const terminos =
                textoBusqueda
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 5);

            let filtro = "";

            const parametros = [];

            if (terminos.length > 0) {

                // Cada palabra debe aparecer en nombre O correo O teléfono.
                // LOWER() + LIKE: no distingue mayúsculas; las tildes las
                // ignora la collation "ai_ci" de la tabla. El texto escrito
                // por el usuario va SIEMPRE como parámetro (?), nunca
                // concatenado al SQL.
                const condiciones =
                    terminos.map(
                        () => `(
                            LOWER(nombre_proveedor) LIKE ?
                            OR
                            LOWER(correo) LIKE ?
                            OR
                            LOWER(telefono) LIKE ?
                        )`
                    );

                filtro =
                    `WHERE ${condiciones.join(" AND ")}`;

                terminos.forEach(
                    termino => {

                        // Se escapan \ % _ para buscarlos como texto literal
                        // y no como comodines de LIKE.
                        const patron =
                            `%${termino.replace(/[\\%_]/g, "\\$&")}%`;

                        parametros.push(
                            patron,
                            patron,
                            patron
                        );

                    }
                );

            }

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        id_proveedor,
                        nombre_proveedor,
                        telefono,
                        correo,
                        direccion
                    FROM Proveedor
                    ${filtro}
                    ORDER BY id_proveedor
                    `,

                    parametros

                );

            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error al obtener proveedores."

            });

        }

    }
);


app.post(

    "/proveedores",

    autenticarToken,

    [

        body("nombre")
            .trim()
            .notEmpty()
            .isLength({
                max: 100
            }),

        body("telefono")
            .optional({
                nullable: true
            })
            .trim()
            .isLength({
                max: 15
            }),

        body("correo")
            .optional({
                nullable: true
            })
            .trim()
            .custom(value => {

                if (
                    value &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ) {

                    throw new Error(
                        "El correo no es válido."
                    );

                }

                return true;

            }),

        body("direccion")
            .optional({
                nullable: true
            })
            .trim()
            .isLength({
                max: 255
            })

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                nombre,
                telefono,
                correo,
                direccion
            } = req.body;


            await db.execute(

                `
                INSERT INTO Proveedor
                (
                    nombre_proveedor,
                    telefono,
                    correo,
                    direccion
                )
                VALUES (?, ?, ?, ?)
                `,

                [
                    nombre,
                    telefono || null,
                    correo || null,
                    direccion || null
                ]

            );


            res.status(201).json({

                success: true,

                mensaje:
                    "Proveedor registrado correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error al guardar proveedor."

            });

        }

    }

);


/* =========================================================
   VENTAS - REGISTRO SIMPLE
   ========================================================= */

app.post(

    "/ventas",

    autenticarToken,

    [

        body("cliente")
            .isInt({
                min: 1
            }),

        body("usuario")
            .isInt({
                min: 1
            })

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                cliente,
                usuario
            } = req.body;


            const [
                result
            ] =
                await db.execute(

                    `
                    INSERT INTO Venta
                    (
                        fecha_venta,
                        id_cliente,
                        id_usuario
                    )
                    VALUES
                    (
                        CURDATE(),
                        ?,
                        ?
                    )
                    `,

                    [
                        cliente,
                        usuario
                    ]

                );


            res.status(201).json({

                success: true,

                idVenta:
                    result.insertId

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error al registrar venta."

            });

        }

    }

);


/* =========================================================
   VENTAS - COMPLETA
   ========================================================= */

app.post(

    "/ventas/completa",

    autenticarToken,

    [

        body("cliente")
            .isInt({
                min: 1
            }),

        body("usuario")
            .isInt({
                min: 1
            }),

        body("productos")
            .isArray({
                min: 1
            })

    ],

    validarRequest,

    async (req, res) => {

        let connection;

        try {

            connection =
                await db.getConnection();

            const {
                cliente,
                usuario,
                productos
            } = req.body;


            await connection.beginTransaction();


            /* -----------------------------------------
               VERIFICAR CLIENTE
            ----------------------------------------- */

            const [
                clientes
            ] =
                await connection.execute(

                    `
                    SELECT id_cliente
                    FROM Cliente
                    WHERE id_cliente = ?
                    `,

                    [cliente]

                );


            if (
                clientes.length === 0
            ) {

                throw new Error(
                    "El cliente no existe."
                );

            }


            /* -----------------------------------------
               VERIFICAR USUARIO
            ----------------------------------------- */

            const [
                usuarios
            ] =
                await connection.execute(

                    `
                    SELECT id_usuario
                    FROM Usuario
                    WHERE id_usuario = ?
                    `,

                    [usuario]

                );


            if (
                usuarios.length === 0
            ) {

                throw new Error(
                    "El usuario no existe."
                );

            }


            /* -----------------------------------------
               CREAR VENTA
            ----------------------------------------- */

            const [
                ventaResult
            ] =
                await connection.execute(

                    `
                    INSERT INTO Venta
                    (
                        fecha_venta,
                        id_cliente,
                        id_usuario
                    )
                    VALUES
                    (
                        CURDATE(),
                        ?,
                        ?
                    )
                    `,

                    [
                        cliente,
                        usuario
                    ]

                );


            const idVenta =
                ventaResult.insertId;


            /* -----------------------------------------
               DETALLES DE VENTA
            ----------------------------------------- */

            for (
                const producto
                of productos
            ) {

                const idProducto =
                    Number(
                        producto.id_producto
                    );

                const cantidad =
                    Number(
                        producto.cantidad
                    );

                const precio =
                    Number(
                        producto.precio
                    );


                if (
                    !Number.isInteger(idProducto) ||
                    !Number.isInteger(cantidad) ||
                    cantidad <= 0 ||
                    !Number.isFinite(precio) ||
                    precio < 0
                ) {

                    throw new Error(
                        "Los datos de uno de los productos son inválidos."
                    );

                }


                /* -----------------------------------------
                   BLOQUEAR PRODUCTO Y VERIFICAR STOCK
                ----------------------------------------- */

                const [
                    productosDB
                ] =
                    await connection.execute(

                        `
                        SELECT
                            id_producto,
                            stock_actual
                        FROM Producto
                        WHERE id_producto = ?
                        FOR UPDATE
                        `,

                        [idProducto]

                    );


                if (
                    productosDB.length === 0
                ) {

                    throw new Error(
                        `El producto ${idProducto} no existe.`
                    );

                }


                if (
                    Number(
                        productosDB[0].stock_actual
                    ) < cantidad
                ) {

                    throw new Error(
                        `Stock insuficiente para el producto ID ${idProducto}.`
                    );

                }


                const subtotal =
                    cantidad * precio;


                /* -----------------------------------------
                   INSERTAR DETALLE

                   IMPORTANTE: el stock ya NO se descuenta por
                   un trigger de base de datos (trg_reducir_stock).
                   Ese trigger no existe en el esquema actual, así
                   que el descuento se hace aquí mismo, de forma
                   explícita, dentro de la misma transacción.
                ----------------------------------------- */

                await connection.execute(

                    `
                    INSERT INTO Detalle_Venta
                    (
                        id_venta,
                        id_producto,
                        cantidad,
                        precio_unitario,
                        subtotal
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,

                    [
                        idVenta,
                        idProducto,
                        cantidad,
                        precio,
                        subtotal
                    ]

                );


                /* -----------------------------------------
                   DESCONTAR STOCK

                   La fila del producto ya quedó bloqueada con
                   "FOR UPDATE" al consultarla más arriba, así
                   que este UPDATE es seguro ante ventas
                   concurrentes del mismo producto.
                ----------------------------------------- */

                await connection.execute(

                    `
                    UPDATE Producto
                    SET stock_actual = stock_actual - ?
                    WHERE id_producto = ?
                    `,

                    [
                        cantidad,
                        idProducto
                    ]

                );


                /* -----------------------------------------
                   MOVIMIENTO
                ----------------------------------------- */

                await connection.execute(

                    `
                    INSERT INTO Movimiento_Inventario
                    (
                        id_producto,
                        fecha_movimiento,
                        tipo_movimiento,
                        cantidad,
                        referencia_tipo,
                        observaciones
                    )
                    VALUES
                    (
                        ?,
                        NOW(),
                        'salida',
                        ?,
                        'Venta',
                        'Venta registrada automáticamente'
                    )
                    `,

                    [
                        idProducto,
                        cantidad
                    ]

                );

            }


            await connection.commit();


            res.status(201).json({

                success: true,

                mensaje:
                    "Venta registrada correctamente.",

                idVenta

            });

        } catch (error) {

            if (connection) {

                await connection.rollback();

            }

            console.error(
                "Error registrando venta:",
                error
            );

            const esErrorDeConexion = !connection;

            res.status(
                esErrorDeConexion ? 500 : 400
            ).json({

                success: false,

                error:
                    esErrorDeConexion
                        ? "No fue posible conectar con la base de datos. Intente de nuevo."
                        : (
                            error.message ||
                            "Error registrando la venta."
                        )

            });

        } finally {

            if (connection) {

                connection.release();

            }

        }

    }

);


/* =========================================================
   OBTENER VENTAS
   ========================================================= */

app.get(

    "/ventas",

    autenticarToken,

    async (req, res) => {

        try {

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        v.id_venta,
                        v.fecha_venta,
                        c.nombre_cliente,
                        u.nombre_usuario,

                        COALESCE(
                            SUM(
                                dv.cantidad *
                                dv.precio_unitario
                            ),
                            0
                        ) AS total_venta

                    FROM Venta v

                    LEFT JOIN Cliente c
                        ON v.id_cliente =
                           c.id_cliente

                    LEFT JOIN Usuario u
                        ON v.id_usuario =
                           u.id_usuario

                    LEFT JOIN Detalle_Venta dv
                        ON v.id_venta =
                           dv.id_venta

                    GROUP BY
                        v.id_venta,
                        v.fecha_venta,
                        c.nombre_cliente,
                        u.nombre_usuario

                    ORDER BY
                        v.id_venta DESC
                    `

                );


            res.json(result);

        } catch (error) {

            console.error(
                "Error obteniendo ventas:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    "Error obteniendo ventas."

            });

        }

    }

);


/* =========================================================
   COMPRAS COMPLETAS
   ========================================================= */

app.post(

    "/compras/completa",

    autenticarToken,

    [

        body("proveedor")
            .isInt({
                min: 1
            }),

        body("usuario")
            .isInt({
                min: 1
            }),

        body("productos")
            .isArray({
                min: 1
            })

    ],

    validarRequest,

    async (req, res) => {

        let connection;

        try {

            connection =
                await db.getConnection();

            const {
                proveedor,
                usuario,
                productos
            } = req.body;


            await connection.beginTransaction();


            /* -----------------------------------------
               VERIFICAR PROVEEDOR
            ----------------------------------------- */

            const [
                proveedores
            ] =
                await connection.execute(

                    `
                    SELECT id_proveedor
                    FROM Proveedor
                    WHERE id_proveedor = ?
                    `,

                    [proveedor]

                );


            if (
                proveedores.length === 0
            ) {

                throw new Error(
                    "El proveedor no existe."
                );

            }


            /* -----------------------------------------
               VERIFICAR USUARIO
            ----------------------------------------- */

            const [
                usuarios
            ] =
                await connection.execute(

                    `
                    SELECT id_usuario
                    FROM Usuario
                    WHERE id_usuario = ?
                    `,

                    [usuario]

                );


            if (
                usuarios.length === 0
            ) {

                throw new Error(
                    "El usuario no existe."
                );

            }


            /* -----------------------------------------
               CALCULAR TOTAL
            ----------------------------------------- */

            let totalCompra = 0;


            for (
                const producto
                of productos
            ) {

                const cantidad =
                    Number(
                        producto.cantidad
                    );

                const precio =
                    Number(
                        producto.precio
                    );


                if (
                    !Number.isInteger(cantidad) ||
                    cantidad <= 0 ||
                    !Number.isFinite(precio) ||
                    precio < 0
                ) {

                    throw new Error(
                        "Los datos de la compra son inválidos."
                    );

                }


                totalCompra +=
                    cantidad * precio;

            }


            /* -----------------------------------------
               CREAR COMPRA
            ----------------------------------------- */

            const [
                compraResult
            ] =
                await connection.execute(

                    `
                    INSERT INTO Compra
                    (
                        fecha_compra,
                        id_proveedor,
                        id_usuario,
                        total_compra
                    )
                    VALUES
                    (
                        CURDATE(),
                        ?,
                        ?,
                        ?
                    )
                    `,

                    [
                        proveedor,
                        usuario,
                        totalCompra
                    ]

                );


            const idCompra =
                compraResult.insertId;


            /* -----------------------------------------
               DETALLES DE COMPRA
            ----------------------------------------- */

            for (
                const producto
                of productos
            ) {

                const idProducto =
                    Number(
                        producto.id_producto
                    );

                const cantidad =
                    Number(
                        producto.cantidad
                    );

                const precio =
                    Number(
                        producto.precio
                    );

                const subtotal =
                    cantidad * precio;


                const [
                    productoExiste
                ] =
                    await connection.execute(

                        `
                        SELECT
                            id_producto
                        FROM Producto
                        WHERE id_producto = ?
                        FOR UPDATE
                        `,

                        [idProducto]

                    );


                if (
                    productoExiste.length === 0
                ) {

                    throw new Error(
                        `El producto ID ${idProducto} no existe.`
                    );

                }


                /* -----------------------------------------
                   INSERTAR DETALLE

                   IMPORTANTE: el stock ya NO se aumenta por
                   un trigger de base de datos (trg_aumentar_stock).
                   Ese trigger no existe en el esquema actual, así
                   que el aumento se hace aquí mismo, de forma
                   explícita, dentro de la misma transacción.
                ----------------------------------------- */

                await connection.execute(

                    `
                    INSERT INTO Detalle_Compra
                    (
                        id_compra,
                        id_producto,
                        cantidad,
                        precio_unitario,
                        subtotal_compra,
                        total_compra
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,

                    [
                        idCompra,
                        idProducto,
                        cantidad,
                        precio,
                        subtotal,
                        subtotal
                    ]

                );


                /* -----------------------------------------
                   AUMENTAR STOCK

                   La fila del producto ya quedó bloqueada con
                   "FOR UPDATE" al consultarla más arriba, así
                   que este UPDATE es seguro ante compras
                   concurrentes del mismo producto.
                ----------------------------------------- */

                await connection.execute(

                    `
                    UPDATE Producto
                    SET stock_actual = stock_actual + ?
                    WHERE id_producto = ?
                    `,

                    [
                        cantidad,
                        idProducto
                    ]

                );


                /* -----------------------------------------
                   MOVIMIENTO DE INVENTARIO
                ----------------------------------------- */

                await connection.execute(

                    `
                    INSERT INTO Movimiento_Inventario
                    (
                        id_producto,
                        fecha_movimiento,
                        tipo_movimiento,
                        cantidad,
                        referencia_tipo,
                        observaciones
                    )
                    VALUES
                    (
                        ?,
                        NOW(),
                        'entrada',
                        ?,
                        'Compra',
                        'Compra registrada automáticamente'
                    )
                    `,

                    [
                        idProducto,
                        cantidad
                    ]

                );

            }


            await connection.commit();


            res.status(201).json({

                success: true,

                mensaje:
                    "Compra registrada correctamente.",

                idCompra,

                totalCompra

            });

        } catch (error) {

            if (connection) {

                await connection.rollback();

            }

            console.error(
                "Error registrando compra:",
                error
            );

            const esErrorDeConexion = !connection;

            res.status(
                esErrorDeConexion ? 500 : 400
            ).json({

                success: false,

                error:
                    esErrorDeConexion
                        ? "No fue posible conectar con la base de datos. Intente de nuevo."
                        : (
                            error.message ||
                            "Error registrando compra."
                        )

            });

        } finally {

            if (connection) {

                connection.release();

            }

        }

    }

);


/* =========================================================
   USUARIOS
   ========================================================= */

app.get(

    "/usuarios",

    autenticarToken,

    async (req, res) => {

        try {

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        u.id_usuario,
                        u.nombre_usuario,
                        u.correo,
                        u.id_rol,
                        r.nombre_rol
                    FROM Usuario u
                    INNER JOIN Rol r
                        ON u.id_rol =
                           r.id_rol
                    ORDER BY
                        u.id_usuario
                    `

                );


            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error obteniendo usuarios."

            });

        }

    }

);


/* =========================================================
   REGISTRAR USUARIO ADMINISTRATIVO
   ========================================================= */

app.post(

    "/usuarios",

    autenticarToken,

    [

        body("nombre")
            .trim()
            .notEmpty()
            .isLength({
                max: 100
            }),

        body("correo")
            .trim()
            .isEmail()
            .normalizeEmail(),

        body("rol")
            .isInt({
                min: 1
            }),

        body("password")
            .optional({
                nullable: true
            })
            .isLength({
                min: 6,
                max: 100
            })

    ],

    validarRequest,

    async (req, res) => {

        try {

            const {
                nombre,
                correo,
                rol
            } = req.body;


            const password =
                req.body.password ||
                "MicroStock123";


            const [
                existe
            ] =
                await db.execute(

                    `
                    SELECT
                        id_usuario
                    FROM Usuario
                    WHERE correo = ?
                    `,

                    [correo]

                );


            if (
                existe.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    error:
                        "El correo ya está registrado."

                });

            }


            const [
                rolExiste
            ] =
                await db.execute(

                    `
                    SELECT
                        id_rol
                    FROM Rol
                    WHERE id_rol = ?
                    `,

                    [rol]

                );


            if (
                rolExiste.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "El rol seleccionado no existe."

                });

            }


            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            await db.execute(

                `
                INSERT INTO Usuario
                (
                    nombre_usuario,
                    correo,
                    contrasena_hash,
                    id_rol
                )
                VALUES (?, ?, ?, ?)
                `,

                [
                    nombre,
                    correo,
                    passwordHash,
                    rol
                ]

            );


            res.status(201).json({

                success: true,

                mensaje:
                    "Usuario registrado correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error registrando usuario."

            });

        }

    }

);


/* =========================================================
   MOVIMIENTOS DE INVENTARIO
   ========================================================= */

// CAMBIO 1: valida que el texto sea una fecha real con formato YYYY-MM-DD
// (rechaza, por ejemplo, 2026-02-30 o "hola").
function esFechaISOValida(valor) {

    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {

        return false;

    }

    const [
        anio,
        mes,
        dia
    ] =
        valor.split("-").map(Number);

    const fecha =
        new Date(
            Date.UTC(
                anio,
                mes - 1,
                dia
            )
        );

    return (
        fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia
    );

}


app.get(

    "/movimientos",

    autenticarToken,

    async (req, res) => {

        try {

            // CAMBIO 1: parámetros opcionales ?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
            // Vacío o ausente = se usa el valor por defecto en el SQL.
            const fechaInicio =
                (
                    req.query.fechaInicio === undefined ||
                    req.query.fechaInicio === ""
                )
                    ? null
                    : req.query.fechaInicio;

            const fechaFin =
                (
                    req.query.fechaFin === undefined ||
                    req.query.fechaFin === ""
                )
                    ? null
                    : req.query.fechaFin;

            if (
                fechaInicio !== null &&
                !esFechaISOValida(fechaInicio)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "La fecha de inicio no es válida. Use el formato AAAA-MM-DD.",

                    message:
                        "La fecha de inicio no es válida. Use el formato AAAA-MM-DD."

                });

            }

            if (
                fechaFin !== null &&
                !esFechaISOValida(fechaFin)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "La fecha fin no es válida. Use el formato AAAA-MM-DD.",

                    message:
                        "La fecha fin no es válida. Use el formato AAAA-MM-DD."

                });

            }

            // Las fechas ISO (YYYY-MM-DD) se pueden comparar como texto.
            if (
                fechaInicio !== null &&
                fechaFin !== null &&
                fechaInicio > fechaFin
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "La fecha de inicio no puede ser posterior a la fecha fin.",

                    message:
                        "La fecha de inicio no puede ser posterior a la fecha fin."

                });

            }

            // La fecha fin incluye TODO el día (hasta 23:59:59).
            const desde =
                fechaInicio !== null
                    ? `${fechaInicio} 00:00:00`
                    : null;

            const hasta =
                fechaFin !== null
                    ? `${fechaFin} 23:59:59`
                    : null;

            const [
                result
            ] =
                await db.execute(

                    // CAMBIO 1: BETWEEN con valores por defecto.
                    //  - sin fechaInicio -> fecha MÁS ANTIGUA registrada (MIN)
                    //  - sin fechaFin    -> momento actual (NOW())
                    // CAST(? AS DATETIME) evita comparar texto contra DATETIME.
                    `
                    SELECT
                        m.id_movimiento,
                        m.fecha_movimiento,
                        m.id_producto,
                        p.nombre_producto,
                        m.tipo_movimiento,
                        m.cantidad,
                        m.referencia_tipo,
                        m.observaciones
                    FROM Movimiento_Inventario m
                    INNER JOIN Producto p
                        ON m.id_producto =
                           p.id_producto
                    WHERE m.fecha_movimiento BETWEEN
                        COALESCE(
                            CAST(? AS DATETIME),
                            (
                                SELECT MIN(fecha_movimiento)
                                FROM Movimiento_Inventario
                            )
                        )
                        AND
                        COALESCE(
                            CAST(? AS DATETIME),
                            NOW()
                        )
                    ORDER BY
                        m.fecha_movimiento DESC,
                        m.id_movimiento DESC
                    `,

                    [
                        desde,
                        hasta
                    ]

                );


            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error obteniendo movimientos."

            });

        }

    }

);


/* =========================================================
   ALERTAS DE INVENTARIO
   ========================================================= */

app.get(

    "/alertas",

    autenticarToken,

    async (req, res) => {

        try {

            const [
                result
            ] =
                await db.execute(

                    `
                    SELECT
                        id_producto,
                        nombre_producto,
                        stock_actual,
                        stock_minimo,

                        CASE
                            WHEN stock_actual <=
                                 stock_minimo * 0.5
                            THEN 'Crítico'
                            ELSE 'Bajo'
                        END AS prioridad

                    FROM Producto

                    WHERE stock_actual <=
                          stock_minimo

                    ORDER BY
                        stock_actual ASC
                    `

                );


            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error obteniendo alertas."

            });

        }

    }

);


/* =========================================================
   ACTUALIZAR STOCK MÍNIMO
   ========================================================= */

app.put(

    "/productos/minimo/:id",

    autenticarToken,

    [

        param("id")
            .isInt({
                min: 1
            }),

        body("minimo")
            .isInt({
                min: 0
            })

    ],

    validarRequest,

    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

            const minimo =
                Number(
                    req.body.minimo
                );


            const [
                result
            ] =
                await db.execute(

                    `
                    UPDATE Producto
                    SET stock_minimo = ?
                    WHERE id_producto = ?
                    `,

                    [
                        minimo,
                        id
                    ]

                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Producto no encontrado."

                });

            }


            res.json({

                success: true,

                mensaje:
                    "Stock mínimo actualizado."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error actualizando stock mínimo."

            });

        }

    }

);


/* =========================================================
   REPONER STOCK
   ========================================================= */

app.put(

    "/productos/:id/reponer",

    autenticarToken,

    [

        param("id")
            .isInt({
                min: 1
            }),

        body("cantidad")
            .isInt({
                min: 1
            })

    ],

    validarRequest,

    async (req, res) => {

        let connection;

        try {

            connection =
                await db.getConnection();

            const id =
                Number(
                    req.params.id
                );

            const cantidad =
                Number(
                    req.body.cantidad
                );


            await connection.beginTransaction();


            const [
                producto
            ] =
                await connection.execute(

                    `
                    SELECT
                        id_producto
                    FROM Producto
                    WHERE id_producto = ?
                    FOR UPDATE
                    `,

                    [id]

                );


            if (
                producto.length === 0
            ) {

                throw new Error(
                    "Producto no encontrado."
                );

            }


            /*
             * Aquí NO existe trigger.
             * Por eso actualizamos directamente.
             */

            await connection.execute(

                `
                UPDATE Producto
                SET stock_actual =
                    stock_actual + ?
                WHERE id_producto = ?
                `,

                [
                    cantidad,
                    id
                ]

            );


            await connection.execute(

                `
                INSERT INTO Movimiento_Inventario
                (
                    id_producto,
                    fecha_movimiento,
                    tipo_movimiento,
                    cantidad,
                    referencia_tipo,
                    observaciones
                )
                VALUES
                (
                    ?,
                    NOW(),
                    'entrada',
                    ?,
                    'Reposición Manual',
                    'Reposición realizada desde Alertas'
                )
                `,

                [
                    id,
                    cantidad
                ]

            );


            await connection.commit();


            res.json({

                success: true,

                mensaje:
                    "Stock actualizado correctamente."

            });

        } catch (error) {

            if (connection) {

                await connection.rollback();

            }

            console.error(
                "Error reponiendo stock:",
                error
            );

            const esErrorDeConexion = !connection;

            res.status(
                esErrorDeConexion ? 500 : 400
            ).json({

                success: false,

                error:
                    esErrorDeConexion
                        ? "No fue posible conectar con la base de datos. Intente de nuevo."
                        : (
                            error.message ||
                            "Error actualizando stock."
                        )

            });

        } finally {

            if (connection) {

                connection.release();

            }

        }

    }

);


/* =========================================================
   DASHBOARD
   ========================================================= */

app.get(

    "/dashboard",

    autenticarToken,

    async (req, res) => {

        try {

            // PUNTO 2: el navegador envía su fecha local (?fecha=YYYY-MM-DD)
            // para que "hoy" coincida con la que ve el usuario. Si no la
            // envía, se usa la fecha actual del servidor de base de datos.
            const fechaParametro =
                (
                    req.query.fecha === undefined ||
                    req.query.fecha === ""
                )
                    ? null
                    : req.query.fecha;

            if (
                fechaParametro !== null &&
                !esFechaISOValida(fechaParametro)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "La fecha no es válida. Use el formato AAAA-MM-DD."

                });

            }

            let hoy = fechaParametro;

            if (hoy === null) {

                const [
                    filaFecha
                ] =
                    await db.execute(

                        `
                        SELECT
                            DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy
                        `

                    );

                hoy = filaFecha[0].hoy;

            }

            // Rango completo del día (de 00:00:00 a 23:59:59)
            const inicioHoy = `${hoy} 00:00:00`;
            const finHoy = `${hoy} 23:59:59`;


            const [
                productos
            ] =
                await db.execute(

                    `
                    SELECT
                        COUNT(*) AS total
                    FROM Producto
                    `

                );


            const [
                alertas
            ] =
                await db.execute(

                    `
                    SELECT
                        COUNT(*) AS total
                    FROM Producto
                    WHERE stock_actual <=
                          stock_minimo
                    `

                );


            // PUNTO 2: una sola consulta con los 5 conteos.
            // COUNT(CASE ...) solo cuenta las filas que cumplen la condición.
            // Los "ajustes" no se cuentan como entradas ni como salidas.
            const [
                movimientos
            ] =
                await db.execute(

                    `
                    SELECT
                        COUNT(*) AS total,

                        COUNT(
                            CASE
                                WHEN tipo_movimiento = 'entrada'
                                THEN 1
                            END
                        ) AS entradasTotales,

                        COUNT(
                            CASE
                                WHEN tipo_movimiento = 'entrada'
                                 AND fecha_movimiento BETWEEN ? AND ?
                                THEN 1
                            END
                        ) AS entradasHoy,

                        COUNT(
                            CASE
                                WHEN tipo_movimiento = 'salida'
                                THEN 1
                            END
                        ) AS salidasTotales,

                        COUNT(
                            CASE
                                WHEN tipo_movimiento = 'salida'
                                 AND fecha_movimiento BETWEEN ? AND ?
                                THEN 1
                            END
                        ) AS salidasHoy

                    FROM Movimiento_Inventario
                    `,

                    [
                        inicioHoy,
                        finHoy,
                        inicioHoy,
                        finHoy
                    ]

                );


            res.json({

                success: true,

                totalProductos:
                    productos[0].total,

                totalAlertas:
                    alertas[0].total,

                totalMovimientos:
                    movimientos[0].total,

                // PUNTO 2: valores de las 4 tarjetas nuevas
                fechaHoy:
                    hoy,

                entradasTotales:
                    movimientos[0].entradasTotales,

                entradasHoy:
                    movimientos[0].entradasHoy,

                salidasTotales:
                    movimientos[0].salidasTotales,

                salidasHoy:
                    movimientos[0].salidasHoy

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                error:
                    "Error obteniendo información del dashboard."

            });

        }

    }

);

/* =========================================================
   CAMBIO 3: EDITAR Y ELIMINAR (SOLO ADMINISTRADOR)
   ========================================================= */

// Valida que :id sea un entero positivo
const validarIdParam = () =>
    param("id")
        .isInt({ min: 1 })
        .withMessage("El identificador no es válido.");


// Cuenta registros que dependen de un id. La consulta que recibe es siempre
// un texto fijo escrito en este archivo; el id va parametrizado.
async function contarRegistros(consulta, id) {

    const [
        filas
    ] =
        await db.execute(
            consulta,
            [id]
        );

    return Number(filas[0].total);

}


// Validaciones comunes de Cliente y Proveedor (mismas reglas que el POST)
function validacionesContacto(etiqueta) {

    return [

        validarIdParam(),

        body("nombre")
            .trim()
            .notEmpty()
            .withMessage(`El nombre del ${etiqueta} es obligatorio.`)
            .isLength({ max: 100 })
            .withMessage("El nombre no puede superar 100 caracteres."),

        body("telefono")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 15 })
            .withMessage("El teléfono no puede superar 15 caracteres."),

        body("correo")
            .optional({ nullable: true })
            .trim()
            .custom(value => {

                if (
                    value &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ) {

                    throw new Error("El correo no es válido.");

                }

                if (value && value.length > 100) {

                    throw new Error("El correo no puede superar 100 caracteres.");

                }

                return true;

            }),

        body("direccion")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 255 })
            .withMessage("La dirección no puede superar 255 caracteres.")

    ];

}


/* -----------------------------------------
   CATEGORÍAS: PUT /categorias/:id
----------------------------------------- */

app.put(
    "/categorias/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam(),

        body("nombre")
            .trim()
            .notEmpty()
            .withMessage("El nombre de la categoría es obligatorio.")
            .isLength({ max: 100 })
            .withMessage("El nombre no puede superar 100 caracteres."),

        body("descripcion")
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 500 })
            .withMessage("La descripción no puede superar 500 caracteres.")
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const {
                nombre,
                descripcion
            } = req.body;

            const [
                existe
            ] =
                await db.execute(
                    `
                    SELECT id_categoria
                    FROM Categoria
                    WHERE id_categoria = ?
                    `,
                    [id]
                );

            if (existe.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "La categoría no existe."
                });

            }

            await db.execute(
                `
                UPDATE Categoria
                SET
                    nombre_categoria = ?,
                    descripcion_categoria = ?
                WHERE id_categoria = ?
                `,
                [
                    nombre,
                    descripcion || null,
                    id
                ]
            );

            res.json({
                success: true,
                mensaje: "Categoría actualizada correctamente."
            });

        } catch (error) {

            console.error(error);

            if (error.code === "ER_DUP_ENTRY") {

                return res.status(409).json({
                    success: false,
                    error: "Ya existe otra categoría con ese nombre."
                });

            }

            res.status(500).json({
                success: false,
                error: "Error al actualizar la categoría."
            });

        }

    }
);


/* -----------------------------------------
   CATEGORÍAS: DELETE /categorias/:id
----------------------------------------- */

app.delete(
    "/categorias/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam()
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const [
                filas
            ] =
                await db.execute(
                    `
                    SELECT nombre_categoria
                    FROM Categoria
                    WHERE id_categoria = ?
                    `,
                    [id]
                );

            if (filas.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "La categoría no existe."
                });

            }

            const productos =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Producto WHERE id_categoria = ?",
                    id
                );

            if (productos > 0) {

                return res.status(409).json({
                    success: false,
                    error:
                        `No se puede eliminar la categoría "${filas[0].nombre_categoria}" ` +
                        `porque tiene ${productos} producto(s) asociado(s). ` +
                        "Reasigne o elimine primero esos productos."
                });

            }

            await db.execute(
                `
                DELETE FROM Categoria
                WHERE id_categoria = ?
                `,
                [id]
            );

            res.json({
                success: true,
                mensaje: "Categoría eliminada correctamente."
            });

        } catch (error) {

            console.error(error);

            // Red de seguridad si otro proceso creó una dependencia justo ahora
            if (error.code === "ER_ROW_IS_REFERENCED_2") {

                return res.status(409).json({
                    success: false,
                    error: "No se puede eliminar la categoría porque tiene registros asociados."
                });

            }

            res.status(500).json({
                success: false,
                error: "Error al eliminar la categoría."
            });

        }

    }
);


/* -----------------------------------------
   PRODUCTOS: PUT /productos/:id
   (el stock NO se edita aquí: lo controlan las
   ventas, compras y /productos/:id/reponer)
----------------------------------------- */

app.put(
    "/productos/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam(),

        body("nombre")
            .trim()
            .notEmpty()
            .withMessage("El nombre del producto es obligatorio.")
            .isLength({ max: 100 })
            .withMessage("El nombre no puede superar 100 caracteres."),

        body("precio")
            .isFloat({ min: 0 })
            .withMessage("El precio debe ser un número mayor o igual a 0."),

        body("minimo")
            .isInt({ min: 0 })
            .withMessage("El stock mínimo debe ser un entero mayor o igual a 0."),

        body("categoria")
            .isInt({ min: 1 })
            .withMessage("Seleccione una categoría válida.")
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const {
                nombre,
                precio,
                minimo,
                categoria
            } = req.body;

            const [
                existe
            ] =
                await db.execute(
                    `
                    SELECT id_producto
                    FROM Producto
                    WHERE id_producto = ?
                    `,
                    [id]
                );

            if (existe.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El producto no existe."
                });

            }

            const [
                categoriaExiste
            ] =
                await db.execute(
                    `
                    SELECT id_categoria
                    FROM Categoria
                    WHERE id_categoria = ?
                    `,
                    [categoria]
                );

            if (categoriaExiste.length === 0) {

                return res.status(400).json({
                    success: false,
                    error: "La categoría no existe."
                });

            }

            await db.execute(
                `
                UPDATE Producto
                SET
                    nombre_producto = ?,
                    precio_unitario = ?,
                    stock_minimo = ?,
                    id_categoria = ?
                WHERE id_producto = ?
                `,
                [
                    nombre,
                    precio,
                    minimo,
                    categoria,
                    id
                ]
            );

            res.json({
                success: true,
                mensaje: "Producto actualizado correctamente."
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error: "Error al actualizar el producto."
            });

        }

    }
);


/* -----------------------------------------
   PRODUCTOS: DELETE /productos/:id
----------------------------------------- */

app.delete(
    "/productos/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam()
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const [
                filas
            ] =
                await db.execute(
                    `
                    SELECT nombre_producto
                    FROM Producto
                    WHERE id_producto = ?
                    `,
                    [id]
                );

            if (filas.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El producto no existe."
                });

            }

            const ventas =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Detalle_Venta WHERE id_producto = ?",
                    id
                );

            const compras =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Detalle_Compra WHERE id_producto = ?",
                    id
                );

            const movimientos =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Movimiento_Inventario WHERE id_producto = ?",
                    id
                );

            if (ventas + compras + movimientos > 0) {

                const partes = [];

                if (ventas > 0) partes.push(`${ventas} venta(s)`);
                if (compras > 0) partes.push(`${compras} compra(s)`);
                if (movimientos > 0) partes.push(`${movimientos} movimiento(s) de inventario`);

                return res.status(409).json({
                    success: false,
                    error:
                        `No se puede eliminar el producto "${filas[0].nombre_producto}" ` +
                        `porque tiene historial registrado: ${partes.join(", ")}.`
                });

            }

            await db.execute(
                `
                DELETE FROM Producto
                WHERE id_producto = ?
                `,
                [id]
            );

            res.json({
                success: true,
                mensaje: "Producto eliminado correctamente."
            });

        } catch (error) {

            console.error(error);

            if (error.code === "ER_ROW_IS_REFERENCED_2") {

                return res.status(409).json({
                    success: false,
                    error: "No se puede eliminar el producto porque tiene registros asociados."
                });

            }

            res.status(500).json({
                success: false,
                error: "Error al eliminar el producto."
            });

        }

    }
);


/* -----------------------------------------
   CLIENTES: PUT /clientes/:id
----------------------------------------- */

app.put(
    "/clientes/:id",
    autenticarToken,
    soloAdmin,
    validacionesContacto("cliente"),
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const {
                nombre,
                telefono,
                correo,
                direccion
            } = req.body;

            const [
                existe
            ] =
                await db.execute(
                    `
                    SELECT id_cliente
                    FROM Cliente
                    WHERE id_cliente = ?
                    `,
                    [id]
                );

            if (existe.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El cliente no existe."
                });

            }

            await db.execute(
                `
                UPDATE Cliente
                SET
                    nombre_cliente = ?,
                    telefono = ?,
                    correo = ?,
                    direccion = ?
                WHERE id_cliente = ?
                `,
                [
                    nombre,
                    telefono || null,
                    correo || null,
                    direccion || null,
                    id
                ]
            );

            res.json({
                success: true,
                mensaje: "Cliente actualizado correctamente."
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error: "Error al actualizar el cliente."
            });

        }

    }
);


/* -----------------------------------------
   CLIENTES: DELETE /clientes/:id
----------------------------------------- */

app.delete(
    "/clientes/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam()
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const [
                filas
            ] =
                await db.execute(
                    `
                    SELECT nombre_cliente
                    FROM Cliente
                    WHERE id_cliente = ?
                    `,
                    [id]
                );

            if (filas.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El cliente no existe."
                });

            }

            const ventas =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Venta WHERE id_cliente = ?",
                    id
                );

            if (ventas > 0) {

                return res.status(409).json({
                    success: false,
                    error:
                        `No se puede eliminar al cliente "${filas[0].nombre_cliente}" ` +
                        `porque tiene ${ventas} venta(s) registrada(s).`
                });

            }

            await db.execute(
                `
                DELETE FROM Cliente
                WHERE id_cliente = ?
                `,
                [id]
            );

            res.json({
                success: true,
                mensaje: "Cliente eliminado correctamente."
            });

        } catch (error) {

            console.error(error);

            if (error.code === "ER_ROW_IS_REFERENCED_2") {

                return res.status(409).json({
                    success: false,
                    error: "No se puede eliminar el cliente porque tiene registros asociados."
                });

            }

            res.status(500).json({
                success: false,
                error: "Error al eliminar el cliente."
            });

        }

    }
);


/* -----------------------------------------
   PROVEEDORES: PUT /proveedores/:id
----------------------------------------- */

app.put(
    "/proveedores/:id",
    autenticarToken,
    soloAdmin,
    validacionesContacto("proveedor"),
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const {
                nombre,
                telefono,
                correo,
                direccion
            } = req.body;

            const [
                existe
            ] =
                await db.execute(
                    `
                    SELECT id_proveedor
                    FROM Proveedor
                    WHERE id_proveedor = ?
                    `,
                    [id]
                );

            if (existe.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El proveedor no existe."
                });

            }

            await db.execute(
                `
                UPDATE Proveedor
                SET
                    nombre_proveedor = ?,
                    telefono = ?,
                    correo = ?,
                    direccion = ?
                WHERE id_proveedor = ?
                `,
                [
                    nombre,
                    telefono || null,
                    correo || null,
                    direccion || null,
                    id
                ]
            );

            res.json({
                success: true,
                mensaje: "Proveedor actualizado correctamente."
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error: "Error al actualizar el proveedor."
            });

        }

    }
);


/* -----------------------------------------
   PROVEEDORES: DELETE /proveedores/:id
----------------------------------------- */

app.delete(
    "/proveedores/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam()
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const [
                filas
            ] =
                await db.execute(
                    `
                    SELECT nombre_proveedor
                    FROM Proveedor
                    WHERE id_proveedor = ?
                    `,
                    [id]
                );

            if (filas.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El proveedor no existe."
                });

            }

            const compras =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Compra WHERE id_proveedor = ?",
                    id
                );

            if (compras > 0) {

                return res.status(409).json({
                    success: false,
                    error:
                        `No se puede eliminar al proveedor "${filas[0].nombre_proveedor}" ` +
                        `porque tiene ${compras} compra(s) registrada(s).`
                });

            }

            await db.execute(
                `
                DELETE FROM Proveedor
                WHERE id_proveedor = ?
                `,
                [id]
            );

            res.json({
                success: true,
                mensaje: "Proveedor eliminado correctamente."
            });

        } catch (error) {

            console.error(error);

            if (error.code === "ER_ROW_IS_REFERENCED_2") {

                return res.status(409).json({
                    success: false,
                    error: "No se puede eliminar el proveedor porque tiene registros asociados."
                });

            }

            res.status(500).json({
                success: false,
                error: "Error al eliminar el proveedor."
            });

        }

    }
);


/* -----------------------------------------
   USUARIOS: PUT /usuarios/:id
   (password es opcional: vacío = no se cambia)
----------------------------------------- */

app.put(
    "/usuarios/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam(),

        body("nombre")
            .trim()
            .notEmpty()
            .withMessage("El nombre es obligatorio.")
            .isLength({ max: 100 })
            .withMessage("El nombre no puede superar 100 caracteres."),

        body("correo")
            .trim()
            .isEmail()
            .withMessage("Ingrese un correo electrónico válido.")
            .normalizeEmail(),

        body("rol")
            .isInt({ min: 1 })
            .withMessage("Seleccione un rol válido."),

        body("password")
            .optional({
                nullable: true,
                checkFalsy: true
            })
            .isLength({
                min: 6,
                max: 100
            })
            .withMessage("La contraseña debe tener entre 6 y 100 caracteres.")
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const {
                nombre,
                correo,
                rol,
                password
            } = req.body;

            const [
                usuarioActual
            ] =
                await db.execute(
                    `
                    SELECT
                        id_usuario,
                        id_rol
                    FROM Usuario
                    WHERE id_usuario = ?
                    `,
                    [id]
                );

            if (usuarioActual.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El usuario no existe."
                });

            }

            // Evita que un administrador se quite a sí mismo el acceso
            if (
                id === req.user.id_usuario &&
                Number(rol) !== usuarioActual[0].id_rol
            ) {

                return res.status(400).json({
                    success: false,
                    error: "No puede cambiar su propio rol."
                });

            }

            const [
                correoUsado
            ] =
                await db.execute(
                    `
                    SELECT id_usuario
                    FROM Usuario
                    WHERE correo = ?
                      AND id_usuario <> ?
                    `,
                    [
                        correo,
                        id
                    ]
                );

            if (correoUsado.length > 0) {

                return res.status(409).json({
                    success: false,
                    error: "El correo ya está registrado por otro usuario."
                });

            }

            const [
                rolExiste
            ] =
                await db.execute(
                    `
                    SELECT id_rol
                    FROM Rol
                    WHERE id_rol = ?
                    `,
                    [rol]
                );

            if (rolExiste.length === 0) {

                return res.status(400).json({
                    success: false,
                    error: "El rol seleccionado no existe."
                });

            }

            if (password) {

                const passwordHash =
                    await bcrypt.hash(
                        password,
                        10
                    );

                await db.execute(
                    `
                    UPDATE Usuario
                    SET
                        nombre_usuario = ?,
                        correo = ?,
                        id_rol = ?,
                        contrasena_hash = ?
                    WHERE id_usuario = ?
                    `,
                    [
                        nombre,
                        correo,
                        rol,
                        passwordHash,
                        id
                    ]
                );

            } else {

                await db.execute(
                    `
                    UPDATE Usuario
                    SET
                        nombre_usuario = ?,
                        correo = ?,
                        id_rol = ?
                    WHERE id_usuario = ?
                    `,
                    [
                        nombre,
                        correo,
                        rol,
                        id
                    ]
                );

            }

            res.json({
                success: true,
                mensaje: "Usuario actualizado correctamente."
            });

        } catch (error) {

            console.error(error);

            if (error.code === "ER_DUP_ENTRY") {

                return res.status(409).json({
                    success: false,
                    error: "El correo ya está registrado por otro usuario."
                });

            }

            res.status(500).json({
                success: false,
                error: "Error al actualizar el usuario."
            });

        }

    }
);


/* -----------------------------------------
   USUARIOS: DELETE /usuarios/:id
----------------------------------------- */

app.delete(
    "/usuarios/:id",
    autenticarToken,
    soloAdmin,
    [
        validarIdParam()
    ],
    validarRequest,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            // Un administrador no puede eliminar su propia cuenta
            if (id === req.user.id_usuario) {

                return res.status(400).json({
                    success: false,
                    error: "No puede eliminar su propia cuenta."
                });

            }

            const [
                filas
            ] =
                await db.execute(
                    `
                    SELECT nombre_usuario
                    FROM Usuario
                    WHERE id_usuario = ?
                    `,
                    [id]
                );

            if (filas.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "El usuario no existe."
                });

            }

            const ventas =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Venta WHERE id_usuario = ?",
                    id
                );

            const compras =
                await contarRegistros(
                    "SELECT COUNT(*) AS total FROM Compra WHERE id_usuario = ?",
                    id
                );

            if (ventas + compras > 0) {

                const partes = [];

                if (ventas > 0) partes.push(`${ventas} venta(s)`);
                if (compras > 0) partes.push(`${compras} compra(s)`);

                return res.status(409).json({
                    success: false,
                    error:
                        `No se puede eliminar al usuario "${filas[0].nombre_usuario}" ` +
                        `porque tiene registros asociados: ${partes.join(", ")}.`
                });

            }

            await db.execute(
                `
                DELETE FROM Usuario
                WHERE id_usuario = ?
                `,
                [id]
            );

            res.json({
                success: true,
                mensaje: "Usuario eliminado correctamente."
            });

        } catch (error) {

            console.error(error);

            if (error.code === "ER_ROW_IS_REFERENCED_2") {

                return res.status(409).json({
                    success: false,
                    error: "No se puede eliminar el usuario porque tiene registros asociados."
                });

            }

            res.status(500).json({
                success: false,
                error: "Error al eliminar el usuario."
            });

        }

    }
);


/* =========================================================
   RUTA NO ENCONTRADA
   ========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Endpoint no encontrado."

        });

    }
);


/* =========================================================
   MANEJO GLOBAL DE ERRORES
   ========================================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Error no controlado:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Ocurrió un error interno en el servidor."

        });

    }
);


/* =========================================================
   INICIAR SERVIDOR
   ========================================================= */

async function iniciarServidor() {

    try {

        const connection =
            await db.getConnection();


        await connection.ping();


        connection.release();


        console.log(
            "=========================================="
        );

        console.log(
            "Conectado correctamente a MySQL."
        );

        console.log(
            `Base de datos: ${
                process.env.DB_NAME ||
                "MicroStock"
            }`
        );

        console.log(
            "=========================================="
        );


        app.listen(
            PORT,
            () => {

                console.log(
                    `Servidor corriendo en http://localhost:${PORT}`
                );

                console.log(
                    "API de MicroStock lista."
                );

            }
        );

    } catch (error) {

        console.error(
            "=========================================="
        );

        console.error(
            "ERROR: No fue posible conectar con MySQL."
        );

        console.error(
            error.message
        );

        console.error(
            "=========================================="
        );

        process.exit(1);

    }

}


iniciarServidor();