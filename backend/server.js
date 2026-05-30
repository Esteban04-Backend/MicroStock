const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// CONEXIÓN A LA BASE DE DATOS
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "MicroStock"
});

db.connect(err => {
    if (err) throw err;
    console.log("Conectado a MySQL");
});

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});

//Obtener todos los productos
app.get("/productos", (req, res) => {

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

//Insertar un nuevo producto
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

//Obtener categorias
app.get("/categorias", (req, res) => {
    db.query("SELECT * FROM Categoria", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener categorías" });
        }
        res.json(result);
    });
});
// Crear categoria

app.post("/categorias", (req,res)=>{

    const { nombre, descripcion } = req.body;

    const sql = `
    INSERT INTO Categoria
    (nombre_categoria, descripcion_categoria)
    VALUES (?,?)
    `;

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