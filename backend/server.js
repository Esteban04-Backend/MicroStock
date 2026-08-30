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
                    ORDER BY nombre_categoria
                    `

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
                        c.nombre_categoria
                    FROM Producto p
                    INNER JOIN Categoria c
                        ON p.id_categoria =
                           c.id_categoria
                    ORDER BY p.id_producto
                    `

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
                    ORDER BY id_cliente
                    `

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
                    ORDER BY id_proveedor
                    `

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

app.get(

    "/movimientos",

    autenticarToken,

    async (req, res) => {

        try {

            const [
                result
            ] =
                await db.execute(

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
                    ORDER BY
                        m.fecha_movimiento DESC,
                        m.id_movimiento DESC
                    `

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


            const [
                movimientos
            ] =
                await db.execute(

                    `
                    SELECT
                        COUNT(*) AS total
                    FROM Movimiento_Inventario
                    `

                );


            res.json({

                success: true,

                totalProductos:
                    productos[0].total,

                totalAlertas:
                    alertas[0].total,

                totalMovimientos:
                    movimientos[0].total

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