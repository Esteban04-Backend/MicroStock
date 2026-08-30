import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_017: Registrar una nueva compra ===")
    
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
        raise RuntimeError(f"Fallo en PASO 2 (Carga de login.html): {e}")
    
    try:
        print(f"[PASO 3] Autenticando credenciales administrativas...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(2)
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Fallo en proceso de autenticación): {e}")

    try:
        url_compras = f"{FRONTEND_URL}/compras.html"
        print(f"[PASO 4] Redirigiendo al módulo de Registro de Compras: {url_compras}")
        driver.get(url_compras)
        time.sleep(2.5)  # Espera para asegurar el apiFetch de productos y proveedores
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Acceso bloqueado a compras.html): {e}")
    
    try:
        print("[PASO 5] Seleccionando Proveedor: 'Aceites S.A'...")
        select_prov = Select(wait.until(EC.presence_of_element_located((By.ID, "proveedorCompra"))))
        select_prov.select_by_visible_text("Aceites S.A")
        time.sleep(2)
        
        print("[PASO 6] Seleccionando Producto: 'Aceite de Coco 2L'...")
        select_prod = Select(driver.find_element(By.ID, "productoCompra"))
        select_prod.select_by_visible_text("Aceite de Coco 2L")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 o 6 (No se encontraron 'Aceites S.A' o 'Aceite de Coco 2L' en los selectores dinámicos): {e}")
        
    try:
        print("[PASO 7] Ingresando cantidad de compra: '20'...")
        campo_cant = driver.find_element(By.ID, "cantidadCompra")
        campo_cant.clear()
        campo_cant.send_keys("20")
        time.sleep(2)
        
        print("[PASO 8] Ingresando Costo unitario de compra: '13500'...")
        campo_precio = driver.find_element(By.ID, "precioCompra")
        campo_precio.clear()
        campo_precio.send_keys("13500")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 u 8 (Campos numéricos del formulario bloqueados): {e}")
        
    try:
        print("[PASO 9] Haciendo clic en el botón 'Agregar a compra'...")
        boton_agregar = driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar a compra')]")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_agregar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_agregar)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 9 (El botón 'Agregar a compra' no reaccionó): {e}")
        
    # --- EVALUACIÓN INTERMEDIA DEL CARRITO ---
    try:
        print("[PASO 10] EVALUACIÓN CARRITO: Verificando la inserción del producto en la tabla de detalles...")
        fila_carrito = driver.find_element(By.XPATH, "//tbody[@id='carritoCompra']/tr")
        texto_carrito = fila_carrito.text.strip()
        print(f" -> Línea agregada al detalle: '{texto_carrito}'")
        
        assert "aceite de coco 2l" in texto_carrito.lower(), f"El artículo en el carrito no coincide: '{texto_carrito}'"
        assert "270000" in texto_carrito, f"El cálculo del subtotal es incorrecto en el carrito (Esperado: 270000): '{texto_carrito}'"
        print(" -> [OK] Producto y subtotal calculados correctamente en el carrito de compras.")
    except AssertionError as error_carrito:
        raise RuntimeError(f"Fallo en PASO 10 (EVALUACIÓN NEGATIVA - El carrito no computó los datos de entrada): {error_carrito}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 10 (Error al intentar parsear el cuerpo del carrito '#carritoCompra'): {e}")

    try:
        print("[PASO 11] Enviando la transacción presionando 'REGISTRAR COMPRA'...")
        boton_registrar = driver.find_element(By.ID, "btnRegistrar")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_registrar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_registrar)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 11 (El botón principal '#btnRegistrar' fue obstruido): {e}")
        
    # --- EVALUACIÓN FINAL DE RESPUESTA ---
    try:
        print("[PASO 12] EVALUACIÓN TRANSACCIÓN: Capturando la respuesta del cuadro de diálogo alert()...")
        alert = wait.until(EC.alert_is_present())
        texto_alerta = alert.text
        print(f" -> Mensaje emergente devuelto por MicroStock: '{texto_alerta}'")
        
        # Validamos que la respuesta nativa confirme el registro de forma inequívoca
        assert "correctamente" in texto_alerta.lower() or "exitosa" in texto_alerta.lower() or "registrada" in texto_alerta.lower(), f"La compra fue rechazada por el backend: '{texto_alerta}'"
        alert.accept()
        time.sleep(2)
        print(" -> [OK] Compra de inventario registrada con éxito absoluto y verificado.")
    except AssertionError as error_alerta:
        raise RuntimeError(f"Fallo en PASO 12 (EVALUACIÓN NEGATIVA - El backend rechazó la estructura de la compra): {error_alerta}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 12 (El cuadro de diálogo alert() de confirmación final nunca apareció en el navegador): {e}")

    print("=== [FIN CASE] CP_017 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
