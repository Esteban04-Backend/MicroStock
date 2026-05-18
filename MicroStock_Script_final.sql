CREATE DATABASE MicroStock;
USE MicroStock;

-- TABLA ROL
CREATE TABLE Rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion_rol VARCHAR(100) NOT NULL
);

-- TABLA USUARIO
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- TABLA CLIENTE
CREATE TABLE Cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(15),
    correo VARCHAR(100)
);

-- TABLA PROVEEDOR
CREATE TABLE Proveedor (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proveedor VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(15),
    correo VARCHAR(100)
);

-- TABLA CATEGORIA
CREATE TABLE Categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    descripcion_categoria VARCHAR(500)
);

-- TABLA PRODUCTO
CREATE TABLE Producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    stock_minimo INT NOT NULL CHECK (stock_minimo >= 0),
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    id_categoria INT NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- TABLA VENTA
CREATE TABLE Venta (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha_venta DATE NOT NULL,
    id_cliente INT NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- TABLA DETALLE_VENTA
CREATE TABLE Detalle_Venta (
    id_detalle_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal>= 0),
    FOREIGN KEY (id_venta) REFERENCES Venta(id_venta)
        ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

-- TABLA COMPRA
CREATE TABLE Compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    fecha_compra DATE NOT NULL,
    id_proveedor INT NOT NULL,
    id_usuario INT NOT NULL,
    total_compra DECIMAL(10,2) NOT NULL CHECK (total_compra>= 0),
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- TABLA DETALLE_COMPRA
CREATE TABLE Detalle_Compra (
    id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal_compra DECIMAL(10,2) NOT NULL CHECK (subtotal_compra>= 0),
    total_compra DECIMAL(10,2) NOT NULL CHECK (total_compra>= 0),


    FOREIGN KEY (id_compra) REFERENCES Compra(id_compra)
        ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

-- TABLA MOVIMIENTO INVENTARIO
CREATE TABLE Movimiento_Inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    fecha_movimiento DATETIME NOT NULL,
    tipo_movimiento ENUM('entrada','salida','ajuste') NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    referencia_tipo VARCHAR(100),
    observaciones VARCHAR(200),
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);
-- Actualizacion del stock al vender
DELIMITER //

CREATE TRIGGER trg_reducir_stock
AFTER INSERT ON Detalle_Venta
FOR EACH ROW
BEGIN
    UPDATE Producto
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END //

DELIMITER ;
-- Actualizacion del stock al comprar
DELIMITER //

CREATE TRIGGER trg_aumentar_stock
AFTER INSERT ON Detalle_Compra
FOR EACH ROW
BEGIN
    UPDATE Producto
    SET stock_actual = stock_actual + NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END //

DELIMITER ;