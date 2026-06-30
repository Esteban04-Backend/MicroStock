// Importación de librerías necesarias para el servidor backend
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Configuración de la conexión con la base de datos MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "MicroStock"
});
// Verifica y establece la conexión con la base de datos
db.connect(err => {
    if (err) throw err;
    console.log("Conectado a MySQL");
});
// Inicio del servidor backend en el puerto 3000
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});

// Endpoint que obtiene todos los productos junto con su categoría
app.get("/productos", (req, res) => {
// Consulta SQL que relaciona productos y categorías
    const sql = `
    SELECT 
        p.id_producto,
        p.nombre_producto,
        p.precio_unitario,
        p.stock_actual,
        p.stock_minimo,
        c.nombre_categoria
    FROM Producto p
    JOIN Categoria c 
    ON p.id_categoria = c.id_categoria
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Error al obtener productos"
            });
        }

        res.json(result);

    });

});

// Endpoint encargado de registrar nuevos productos
app.post("/productos", (req, res) => {

    const { nombre, precio, stock, minimo, categoria } = req.body;

    // Validación básica
    if (!nombre || !precio || !stock || !minimo || !categoria) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const sql = `
    INSERT INTO Producto 
    (nombre_producto, precio_unitario, stock_actual, stock_minimo, id_categoria)
    VALUES (?, ?, ?, ?, ?)
    `;
// Inserta el producto en la tabla Producto
    db.query(sql, [nombre, precio, stock, minimo, categoria], (err, result) => {

        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({
                error: "Error al guardar producto",
                detalle: err.sqlMessage
            });
        }

        res.json({ mensaje: "Producto guardado correctamente" });
    });

});

//Conectar ventas
app.post("/ventas", (req, res) => {

    const { cliente, usuario } = req.body;

    const sql = "INSERT INTO Venta (fecha_venta, id_cliente, id_usuario) VALUES (CURDATE(), ?, ?)";

    db.query(sql, [cliente, usuario], (err, result) => {
        if (err) {
    console.error(err);
    return res.status(500).json({
        error: "Error al registrar venta"
    });
}        res.json({ idVenta: result.insertId });
    });

});

// Endpoint que devuelve todas las categorías registradas
app.get("/categorias", (req, res) => {
    db.query("SELECT * FROM Categoria", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener categorías" });
        }
        res.json(result);
    });
});
// OBTENER ROLES
// ==========================================

app.get("/roles",(req,res)=>{

    const sql=`

    SELECT *

    FROM Rol

    ORDER BY nombre_rol

    `;

    db.query(sql,(err,result)=>{

        if(err){

            console.error(err);

            return res.status(500).json({

                error:"Error obteniendo roles"

            });

        }

        res.json(result);

    });

});
// Endpoint encargado de registrar nuevas categorías

app.post("/categorias", (req,res)=>{

    const { nombre, descripcion } = req.body;

    const sql = `
    INSERT INTO Categoria
    (nombre_categoria, descripcion_categoria)
    VALUES (?,?)
    `;
// Inserta una nueva categoría en la tabla Categoria
    db.query(sql,[nombre,descripcion],(err,result)=>{

        if(err){
            console.error(err);
            return res.status(500).json({
                error:"Error al guardar categoría"
            });
        }

        res.json({
            mensaje:"Categoría guardada correctamente"
        });

    });

});
// Obtener todos los clientes
app.get("/clientes", (req, res) => {

    const sql = `
        SELECT *
        FROM Cliente
    `;

    db.query(sql, (err, result) => {

        if(err){

            console.error(err);

            return res.status(500).json({
                error:"Error al obtener clientes"
            });

        }

        res.json(result);

    });

});
// Registrar cliente
app.post("/clientes", (req, res) => {

    const {
        nombre,
        telefono,
        correo,
        direccion
    } = req.body;

    const sql = `
        INSERT INTO Cliente
        (
            nombre_cliente,
            telefono,
            correo,
            direccion
        )
        VALUES
        (?,?,?,?)
    `;

    db.query(

        sql,

        [
            nombre,
            telefono,
            correo,
            direccion
        ],

        (err,result)=>{

            if(err){

                console.error(err);

                return res.status(500).json({
                    error:"Error al guardar cliente"
                });

            }

            res.json({
                mensaje:"Cliente registrado correctamente"
            });

        }

    );

});

// Obtener proveedores
app.get("/proveedores", (req,res)=>{

    const sql="SELECT * FROM Proveedor";

    db.query(sql,(err,result)=>{

        if(err){

            console.error(err);

            return res.status(500).json({
                error:"Error al obtener proveedores"
            });

        }

        res.json(result);

    });

});
// Registrar proveedor
app.post("/proveedores",(req,res)=>{

    const {

        nombre,
        telefono,
        correo,
        direccion

    } = req.body;

    const sql=`

    INSERT INTO Proveedor

    (

        nombre_proveedor,
        telefono,
        correo,
        direccion

    )

    VALUES

    (?,?,?,?)

    `;

    db.query(

        sql,

        [

            nombre,
            telefono,
            correo,
            direccion

        ],

        (err,result)=>{

            if(err){

                console.error(err);

                return res.status(500).json({

                    error:"Error al guardar proveedor"

                });

            }

            res.json({

                mensaje:"Proveedor registrado correctamente"

            });

        }

    );

});
// REGISTRAR VENTA COMPLETA
// =====================================================

app.post("/ventas/completa", (req, res) => {

    const { cliente, usuario, productos } = req.body;

    if (!cliente || !usuario || !productos || productos.length === 0) {

        return res.status(400).json({
            error: "Información incompleta"
        });

    }

    db.beginTransaction(err => {

        if (err) {

            return res.status(500).json({
                error: "Error iniciando la transacción"
            });

        }

        const sqlVenta = `
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
        `;

        db.query(

            sqlVenta,

            [

                cliente,
                usuario

            ],

            (err, ventaResult) => {

                if (err) {

                    return db.rollback(() => {

                        console.error(err);

                        res.status(500).json({

                            error: "Error registrando la venta",

                            detalle: err.sqlMessage

                        });

                    });

                }

                const idVenta = ventaResult.insertId;

                const sqlDetalle = `
                INSERT INTO Detalle_Venta
                (
                    id_venta,
                    id_producto,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES
                (
                    ?,?,?,?,?
                )
                `;

                const sqlActualizarStock = `
                UPDATE Producto
                SET stock_actual = stock_actual - ?
                WHERE id_producto = ?
                `;

                const sqlMovimiento = `
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
                    ?,
                    ?
                )
                `;

                let pendientes = productos.length;

                productos.forEach(producto => {

                    const subtotal =
                        Number(producto.cantidad) *
                        Number(producto.precio);

                    // ==========================================
                    // REGISTRAR DETALLE DE VENTA
                    // ==========================================

                    db.query(

                        sqlDetalle,

                        [

                            idVenta,

                            producto.id_producto,

                            producto.cantidad,

                            producto.precio,

                            subtotal

                        ],

                        err => {

                            if (err) {

                                return db.rollback(() => {

                                    console.error(err);

                                    res.status(500).json({

                                        error: "Error registrando detalle de venta",

                                        detalle: err.sqlMessage

                                    });

                                });

                            }

                            // ==========================================
                            // DESCONTAR STOCK
                            // ==========================================

                            db.query(

                                sqlActualizarStock,

                                [

                                    producto.cantidad,

                                    producto.id_producto

                                ],

                                err => {

                                    if (err) {

                                        return db.rollback(() => {

                                            console.error(err);

                                            res.status(500).json({

                                                error: "Error actualizando el stock",

                                                detalle: err.sqlMessage

                                            });

                                        });

                                    }

                                    // ==========================================
                                    // REGISTRAR MOVIMIENTO
                                    // ==========================================

                                    db.query(

                                        sqlMovimiento,

                                        [

                                            producto.id_producto,

                                            producto.cantidad,

                                            "Venta",

                                            "Venta registrada automáticamente"

                                        ],

                                        err => {

                                            if (err) {

                                                return db.rollback(() => {

                                                    console.error(err);

                                                    res.status(500).json({

                                                        error: "Error registrando movimiento",

                                                        detalle: err.sqlMessage

                                                    });

                                                });

                                            }

                                            pendientes--;

                                            if (pendientes === 0) {

                                                db.commit(err => {

                                                    if (err) {

                                                        return db.rollback(() => {

                                                            console.error(err);

                                                            res.status(500).json({

                                                                error: "Error confirmando la venta"

                                                            });

                                                        });

                                                    }

                                                    res.json({

                                                        mensaje: "Venta registrada correctamente"

                                                    });

                                                });

                                            }

                                        }

                                    );

                                }

                            );

                        }

                    );

                });

            }

        );

    });

});
// REGISTRAR COMPRA COMPLETA
// =====================================================

app.post("/compras/completa", (req, res) => {

    const { proveedor, usuario, productos } = req.body;

    if (!proveedor || !usuario || !productos || productos.length === 0) {

        return res.status(400).json({
            error: "Datos incompletos"
        });

    }

    let totalCompra = 0;

    productos.forEach(p => {
        totalCompra += Number(p.precio) * Number(p.cantidad);
    });

    db.beginTransaction(err => {

        if (err) {

            return res.status(500).json({
                error: "Error iniciando transacción"
            });

        }

        const sqlCompra = `
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
        `;

        db.query(

            sqlCompra,

            [

                proveedor,
                usuario,
                totalCompra

            ],

            (err, resultadoCompra) => {

                if (err) {

                    return db.rollback(() => {

                        console.error(err);

                        res.status(500).json({

                            error: "Error registrando compra",

                            detalle: err.sqlMessage

                        });

                    });

                }

                const idCompra = resultadoCompra.insertId;

                const sqlDetalle = `
                INSERT INTO Detalle_Compra
                (
                    id_compra,
                    id_producto,
                    cantidad,
                    precio_unitario,
                    subtotal_compra,
                    total_compra
                )
                VALUES
                (
                    ?,?,?,?,?,?
                )
                `;

                const sqlActualizarStock = `
                UPDATE Producto
                SET stock_actual = stock_actual + ?
                WHERE id_producto = ?
                `;

                const sqlMovimiento = `
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
                    ?,
                    ?
                )
                `;

                let pendientes = productos.length;

                productos.forEach(p => {

                    const subtotal =
                        Number(p.precio) *
                        Number(p.cantidad);

                    // ==========================
                    // DETALLE DE COMPRA
                    // ==========================

                    db.query(

                        sqlDetalle,

                        [

                            idCompra,

                            p.id_producto,

                            p.cantidad,

                            p.precio,

                            subtotal,

                            subtotal

                        ],

                        err => {

                            if (err) {

                                return db.rollback(() => {

                                    console.error(err);

                                    res.status(500).json({

                                        error: "Error registrando detalle",

                                        detalle: err.sqlMessage

                                    });

                                });

                            }

                            // ==========================
                            // ACTUALIZAR STOCK
                            // ==========================

                            db.query(

                                sqlActualizarStock,

                                [

                                    p.cantidad,

                                    p.id_producto

                                ],

                                err => {

                                    if (err) {

                                        return db.rollback(() => {

                                            console.error(err);

                                            res.status(500).json({

                                                error: "Error actualizando stock",

                                                detalle: err.sqlMessage

                                            });

                                        });

                                    }

                                    // ==========================
                                    // REGISTRAR MOVIMIENTO
                                    // ==========================

                                    db.query(

                                        sqlMovimiento,

                                        [

                                            p.id_producto,

                                            p.cantidad,

                                            "Compra",

                                            "Compra registrada automáticamente"

                                        ],

                                        err => {

                                            if (err) {

                                                return db.rollback(() => {

                                                    console.error(err);

                                                    res.status(500).json({

                                                        error: "Error registrando movimiento",

                                                        detalle: err.sqlMessage

                                                    });

                                                });

                                            }

                                            pendientes--;

                                            if (pendientes === 0) {

                                                db.commit(err => {

                                                    if (err) {

                                                        return db.rollback(() => {

                                                            console.error(err);

                                                            res.status(500).json({

                                                                error: "Error confirmando compra"

                                                            });

                                                        });

                                                    }

                                                    res.json({

                                                        mensaje: "Compra registrada correctamente"

                                                    });

                                                });

                                            }

                                        }

                                    );

                                }

                            );

                        }

                    );

                });

            }

        );

    });

});

// OBTENER USUARIOS
// ==========================================

app.get("/usuarios",(req,res)=>{

    const sql=`

    SELECT

        u.id_usuario,
        u.nombre_usuario,
        u.correo,
        r.nombre_rol

    FROM Usuario u

    INNER JOIN Rol r

    ON u.id_rol=r.id_rol

    ORDER BY u.id_usuario

    `;

    db.query(sql,(err,result)=>{

        if(err){

            console.error(err);

            return res.status(500).json({
                error:"Error obteniendo usuarios"
            });

        }

        res.json(result);

    });

});
// REGISTRAR USUARIO
// ==========================================

app.post("/usuarios",(req,res)=>{

    const{

        nombre,
        correo,
        rol

    }=req.body;

    if(!nombre || !correo || !rol){

        return res.status(400).json({
            error:"Datos incompletos"
        });

    }

    const sql=`

    INSERT INTO Usuario

    (

        nombre_usuario,
        correo,
        contrasena_hash,
        id_rol

    )

    VALUES

    (?,?,?,?)

    `;

    db.query(

        sql,

        [

            nombre,

            correo,

            '123456',

            rol

        ],

        (err,result)=>{

            if(err){

                console.error(err);

                return res.status(500).json({

                    error:"Error registrando usuario",

                    detalle:err.sqlMessage

                });

            }

            res.json({

                mensaje:"Usuario registrado correctamente"

            });

        }

    );

});
// OBTENER MOVIMIENTOS DE INVENTARIO
// ==========================================

app.get("/movimientos", (req, res) => {

    const sql = `

    SELECT

        m.id_movimiento,
        m.fecha_movimiento,
        p.nombre_producto,
        m.tipo_movimiento,
        m.cantidad,
        m.referencia_tipo,
        m.observaciones

    FROM Movimiento_Inventario m

    INNER JOIN Producto p

        ON m.id_producto = p.id_producto

    ORDER BY m.fecha_movimiento DESC

    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Error obteniendo movimientos"
            });

        }

        res.json(result);

    });

});
// OBTENER ALERTAS DE STOCK
// ==========================================

app.get("/alertas", (req, res) => {

    const sql = `

    SELECT

        id_producto,
        nombre_producto,
        stock_actual,
        stock_minimo,

        CASE

            WHEN stock_actual <= stock_minimo * 0.5
                THEN 'Crítico'

            ELSE 'Bajo'

        END AS prioridad

    FROM Producto

    WHERE stock_actual <= stock_minimo

    ORDER BY stock_actual ASC

    `;

    db.query(sql,(err,result)=>{

        if(err){

            console.error(err);

            return res.status(500).json({

                error:"Error obteniendo alertas"

            });

        }

        res.json(result);

    });

});
// ACTUALIZAR STOCK MÍNIMO
// ==========================================

app.put("/productos/minimo/:id",(req,res)=>{

    const id=req.params.id;

    const { minimo }=req.body;

    const sql=`

    UPDATE Producto

    SET stock_minimo=?

    WHERE id_producto=?

    `;

    db.query(

        sql,

        [

            minimo,

            id

        ],

        (err,result)=>{

            if(err){

                console.error(err);

                return res.status(500).json({

                    error:"Error actualizando stock mínimo"

                });

            }

            res.json({

                mensaje:"Stock mínimo actualizado"

            });

        }

    );

});
// REPONER STOCK
// ==========================================

app.put("/productos/:id/reponer",(req,res)=>{

    const id = req.params.id;
    const { cantidad } = req.body;

    const sqlActualizar = `
        UPDATE Producto
        SET stock_actual = stock_actual + ?
        WHERE id_producto = ?
    `;

    db.query(

        sqlActualizar,

        [cantidad,id],

        (err)=>{

            if(err){

                console.error(err);

                return res.status(500).json({
                    error:"Error actualizando stock"
                });

            }

            const sqlMovimiento = `
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
            `;

            db.query(

                sqlMovimiento,

                [

                    id,

                    cantidad

                ],

                (err)=>{

                    if(err){

                        console.error(err);

                        return res.status(500).json({
                            error:"Error registrando movimiento"
                        });

                    }

                    res.json({

                        mensaje:"Stock actualizado correctamente"

                    });

                }

            );

        }

    );

});
// DASHBOARD
// ==========================================

app.get("/dashboard",(req,res)=>{

    const dashboard={};

    const sqlProductos=`

        SELECT COUNT(*) AS total

        FROM Producto

    `;

    const sqlAlertas=`

        SELECT COUNT(*) AS total

        FROM Producto

        WHERE stock_actual<=stock_minimo

    `;

    const sqlMovimientos=`

        SELECT COUNT(*) AS total

        FROM Movimiento_Inventario

    `;

    db.query(sqlProductos,(err,productos)=>{

        if(err){

            console.error(err);

            return res.status(500).json({

                error:"Error obteniendo productos"

            });

        }

        dashboard.totalProductos=productos[0].total;

        db.query(sqlAlertas,(err,alertas)=>{

            if(err){

                console.error(err);

                return res.status(500).json({

                    error:"Error obteniendo alertas"

                });

            }

            dashboard.totalAlertas=alertas[0].total;

            db.query(sqlMovimientos,(err,movimientos)=>{

                if(err){

                    console.error(err);

                    return res.status(500).json({

                        error:"Error obteniendo movimientos"

                    });

                }

                dashboard.totalMovimientos=movimientos[0].total;

                res.json(dashboard);

            });

        });

    });

});

// DASHBOARD
// ==========================================

async function cargarDashboard(){

    const respuesta=
    await fetch("http://localhost:3000/dashboard");

    const datos=
    await respuesta.json();

    const productos=
    document.getElementById("totalProductos");

    if(productos){

        productos.innerText=
        datos.totalProductos;

    }

    const alertas=
    document.getElementById("totalAlertas");

    if(alertas){

        alertas.innerText=
        datos.totalAlertas;

    }

    const movimientos=
    document.getElementById("totalMovimientos");

    if(movimientos){

        movimientos.innerText=
        datos.totalMovimientos;

    }

}