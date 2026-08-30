import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_005: Actualización de información de un producto ===")
    
    try:
        print("[PASO 1] Inicializando el navegador Chrome...")
        driver = crear_navegador()
        wait = crear_espera(driver, 10)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 1 (Inicialización del navegador): {e}")
    
    try:
        url_login = f"{FRONTEND_URL}/login.html"
        print(f"[PASO 2] Navegando a la página de inicio de sesión: {url_login}")
        driver.get(url_login)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 2 (Carga de la página login.html): {e}")
    
    try:
        print(f"[PASO 3] Ingresando correo del administrador: '{ADMIN_CORREO}'")
        campo_email = wait.until(EC.presence_of_element_located((By.ID, "correo")))
        campo_email.clear()
        campo_email.send_keys(ADMIN_CORREO)
        time.sleep(2)
        print("[PASO 4] Ingresando contraseña del administrador...")
        campo_pass = driver.find_element(By.ID, "password")
        campo_pass.clear()
        campo_pass.send_keys(ADMIN_PASSWORD)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASOS 3 o 4 (Error al escribir credenciales administrativas): {e}")
    
    try:
        print("[PASO 5] Haciendo clic en el botón 'Iniciar sesión'...")
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Validación incorrecta en el formulario de inicio de sesión): {e}")
    
    try:
        url_productos = f"{FRONTEND_URL}/productos.html"
        print(f"[PASO 6] Redirigiendo al módulo de Gestión de Productos: {url_productos}")
        driver.get(url_productos)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Redirección inválida hacia productos.html): {e}")
    
    try:
        print("[PASO 7] Escribiendo en el buscador para cargar el producto: 'Cuaderno Profesional A5'...")
        buscador = wait.until(EC.presence_of_element_located((By.ID, "buscarProducto")))
        buscador.clear()
        buscador.send_keys("Cuaderno Profesional A5")
        time.sleep(2.5)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (El elemento buscador con ID 'buscarProducto' no responde): {e}")
    
    try:
        print("[PASO 8] Limpiando y actualizando el campo Nombre en el formulario...")
        campo_nombre = driver.find_element(By.ID, "nombre")
        campo_nombre.clear()
        campo_nombre.send_keys("Cuaderno Profesional A5")
        time.sleep(2)
        
        print("[PASO 9] Modificando el Precio de venta a '13500'...")
        campo_precio = driver.find_element(By.ID, "precio")
        campo_precio.clear()
        campo_precio.send_keys("13500")
        time.sleep(2)
        
        print("[PASO 10] Modificando el Stock mínimo a '15'...")
        campo_minimo = driver.find_element(By.ID, "minimo")
        campo_minimo.clear()
        campo_minimo.send_keys("15")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASOS 8, 9 o 10 (Imposible interactuar con los campos del formulario): {e}")
    
    try:
        print("[PASO 11] Guardando los cambios del producto...")
        boton_guardar = driver.find_element(By.ID, "btnGuardarProducto")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_guardar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_guardar)
        time.sleep(3)  # Dar tiempo al backend para guardar en la BD y recargar la tabla
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 11 (El botón '#btnGuardarProducto' falló al procesar): {e}")
    
    # --- EVALUACIÓN REAL CON ASERCIÓN SOBRE LA TABLA ---
    try:
        print("[PASO 12] VALIDACIÓN DE EVALUACIÓN: Buscando el producto nuevamente para verificar cambios...")
        buscador = driver.find_element(By.ID, "buscarProducto")
        buscador.clear()
        buscador.send_keys("Cuaderno Profesional A5")
        time.sleep(2.5)
        
        print("[PASO 13] Leyendo los valores reales reflejados en la tabla...")
        # Capturamos la primera fila resultante de la tabla
        fila = driver.find_element(By.XPATH, "//table[@id='tablaProductos']/tbody/tr[1]")
        
        # Según tu estructura HTML: <th>ID</th>, <td>Producto</td>, <td>Categoría</td>, <td>Precio</td>, <td>Stock</td>, <td>Stock mínimo</td>
        # Buscamos las celdas usando sus posiciones relativas (td[3] para Precio, td[5] para Stock Mínimo debido al th inicial)
        texto_precio = fila.find_element(By.XPATH, "./td[3]").text.strip()
        texto_minimo = fila.find_element(By.XPATH, "./td[5]").text.strip()
        
        print(f" -> Valores en tabla: Precio = '{texto_precio}', Stock Mínimo = '{texto_minimo}'")
        
        # Realizamos la verificación estricta de los datos requeridos por la prueba
        assert "13500" in texto_precio, f"El precio esperado era 13500 pero se encontró '{texto_precio}'"
        assert "15" in texto_minimo, f"El stock mínimo esperado era 15 pero se encontró '{texto_minimo}'"
        
        print(" -> [OK] Los datos en la pantalla coinciden perfectamente con la actualización.")
    except AssertionError as error_validacion:
        raise RuntimeError(f"Fallo en PASO 12/13 (EVALUACIÓN NEGATIVA - Los datos no cambiaron): {error_validacion}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 12/13 (Error crítico al intentar leer la tabla de productos): {e}")
        
    print("=== [FIN CASE] CP_005 verificado con éxito real ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
