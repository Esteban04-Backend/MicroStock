// Inicializa todos los eventos y cargas automáticas al abrir la página
document.addEventListener("DOMContentLoaded", () => {

    const formProducto = document.getElementById("formProducto");

    if(formProducto){
        formProducto.addEventListener("submit", registrarProducto);
    }

    // Cargar categorías si existe el select
    if(document.getElementById("categoria")){
        cargarCategorias();
    }

    // Mostrar productos si existe la tabla
    if(document.querySelector("#tablaProductos tbody")){
        mostrarProductos();
        cargarCategorias();
    }
    //categorias
    if(document.getElementById("formCategoria")){

    document
    .getElementById("formCategoria")
    .addEventListener(
        "submit",
        registrarCategoria
    );

    mostrarCategorias();
    }
    // CLIENTES
    if(document.getElementById("formCliente")){

        document
        .getElementById("formCliente")
        .addEventListener(
            "submit",
            registrarCliente
        );

        mostrarClientes();

    }

    // PROVEEDORES
    if(document.getElementById("formProveedor")){

        document
        .getElementById("formProveedor")
        .addEventListener(
            "submit",
            registrarProveedor
        );

        mostrarProveedores();

    }
});
// definimos la funcion para ppoder cargar las categorias
async function cargarCategorias(){
// Consulta las categorías disponibles mediante la API REST
    const respuesta =
    await fetch(
    "http://localhost:3000/categorias"
    );

    const categorias =
    await respuesta.json();

    const select =
    document.getElementById(
    "categoria"
    );

    if(!select) return;

    select.innerHTML =
    "<option value=''>Seleccione</option>";

    categorias.forEach(c=>{

        select.innerHTML += `
        <option value="${c.id_categoria}">
            ${c.nombre_categoria}
        </option>
        `;

    });

}
/* PRODUCTOS */
// Envía al servidor los datos de un nuevo producto para almacenarlo en MySQL
function registrarProducto(e){
    e.preventDefault();

    let nombre = document.getElementById("nombre").value;
    let precio = document.getElementById("precio").value;
    let stock = document.getElementById("stock").value;
    let minimo = document.getElementById("minimo").value;
    let categoria = document.getElementById("categoria").value;
// Petición POST para registrar un producto
    fetch("http://localhost:3000/productos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre,
            precio,
            stock,
            minimo,
            categoria
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje || data.error);
        mostrarProductos();
    })
    .catch(err => console.error(err));
}
// Obtiene y muestra todos los productos registrados con el localhost:3000/productos
function mostrarProductos(){

    fetch("http://localhost:3000/productos")
    .then(res => {

        if(!res.ok){
            throw new Error("Error al obtener productos");
        }

        return res.json();

    })
    .then(productos => {

        let tabla = document.querySelector("#tablaProductos tbody");

        if(!tabla) return;

        tabla.innerHTML = "";

        let html = "";
// Construye dinámicamente las filas de la tabla de productos
productos.forEach(p => {

    let estado = p.stock_actual <= p.stock_minimo
    ? "Stock Bajo"
    : "Disponible";

    html += `
    <tr>
        <td>${p.id_producto}</td>
        <td>${p.nombre_producto}</td>
        <td>${p.nombre_categoria}</td>
        <td>${p.precio_unitario}</td>
        <td>${p.stock_actual}</td>
        <td>${p.stock_minimo}</td>
        <td>${estado}</td>
    </tr>
    `;
});

tabla.innerHTML = html;

    })
    .catch(err => {
        console.error("Error:", err);
    });

}

/* cargar categorías */
function cargarCategorias() {

    fetch("http://localhost:3000/categorias")
    .then(res => res.json())
    .then(categorias => {

        let select = document.getElementById("categoria");

        select.innerHTML = "<option value=''>Seleccione categoría</option>";

        categorias.forEach(c => {
            select.innerHTML += `
                <option value="${c.id_categoria}">
                    ${c.nombre_categoria}
                </option>
            `;
        });

    });

}
// CATEGORIAS
// Envía los datos de una nueva categoría al backend
async function registrarCategoria(e){

    e.preventDefault();

    const nombre =
    document.getElementById("nombreCategoria").value;

    const descripcion =
    document.getElementById("descripcionCategoria").value;
// Petición POST para registrar una categoría en MySQL
    const respuesta = await fetch(
        "http://localhost:3000/categorias",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                nombre,
                descripcion
            })
        }
    );

    const data = await respuesta.json();

    alert(data.mensaje);

    mostrarCategorias();

}
// Consulta y muestra todas las categorías almacenadas en la base de datos
async function mostrarCategorias(){

    const respuesta =
    await fetch("http://localhost:3000/categorias");

    const categorias =
    await respuesta.json();

    const tabla =
    document.querySelector("#tablaCategorias tbody");

    if(!tabla) return;

    tabla.innerHTML="";

    categorias.forEach(c=>{

        tabla.innerHTML += `
        <tr>
            <td>${c.id_categoria}</td>
            <td>${c.nombre_categoria}</td>
            <td>${c.descripcion_categoria}</td>
            <td>Activa</td>
        </tr>
        `;

    });

}
// CLIENTES
// ===============================

// Registrar cliente
async function registrarCliente(e){

    e.preventDefault();

    const nombre =
    document.getElementById("nombreCliente").value;

    const telefono =
    document.getElementById("telefonoCliente").value;

    const correo =
    document.getElementById("correoCliente").value;

    const direccion =
    document.getElementById("direccionCliente").value;

    const respuesta =
    await fetch(
        "http://localhost:3000/clientes",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                nombre,
                telefono,
                correo,
                direccion
            })
        }
    );

    const data =
    await respuesta.json();

    alert(data.mensaje);

    document
    .getElementById("formCliente")
    .reset();

    mostrarClientes();

}

// Mostrar clientes

async function mostrarClientes(){

    const respuesta =
    await fetch(
        "http://localhost:3000/clientes"
    );

    const clientes =
    await respuesta.json();

    const tabla =
    document.querySelector(
        "#tablaClientes tbody"
    );

    if(!tabla) return;

    tabla.innerHTML="";

    clientes.forEach(c=>{

        tabla.innerHTML += `

        <tr>

            <td>${c.id_cliente}</td>

            <td>${c.nombre_cliente}</td>

            <td>${c.telefono}</td>

            <td>${c.correo}</td>

            <td>${c.direccion}</td>

            <td>Activo</td>

        </tr>

        `;

    });

}
// Registrar proveedor

async function registrarProveedor(e){

    e.preventDefault();

    const nombre =
    document.getElementById("nombreProveedor").value;

    const telefono =
    document.getElementById("telefonoProveedor").value;

    const correo =
    document.getElementById("correoProveedor").value;

    const direccion =
    document.getElementById("direccionProveedor").value;

    const respuesta =
    await fetch(
        "http://localhost:3000/proveedores",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                nombre,
                telefono,
                correo,
                direccion
            })
        }
    );

    const data =
    await respuesta.json();

    alert(data.mensaje);

    document
    .getElementById("formProveedor")
    .reset();

    mostrarProveedores();

}

// Mostrar proveedores

async function mostrarProveedores(){

    const respuesta =
    await fetch(
        "http://localhost:3000/proveedores"
    );

    const proveedores =
    await respuesta.json();

    const tabla =
    document.querySelector(
        "#tablaProveedores tbody"
    );

    if(!tabla) return;

    tabla.innerHTML="";

    proveedores.forEach(p=>{

        tabla.innerHTML += `

        <tr>

            <td>${p.id_proveedor}</td>

            <td>${p.nombre_proveedor}</td>

            <td>${p.telefono}</td>

            <td>${p.correo}</td>

            <td>${p.direccion}</td>

            <td>Activo</td>

        </tr>

        `;

    });

}