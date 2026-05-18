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
    }

});
/* PRODUCTOS */

function registrarProducto(e){
    e.preventDefault();

    let nombre = document.getElementById("nombre").value;
    let precio = document.getElementById("precio").value;
    let stock = document.getElementById("stock").value;
    let minimo = document.getElementById("minimo").value;
    let categoria = document.getElementById("categoria").value;

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