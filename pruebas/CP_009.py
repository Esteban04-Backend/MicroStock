import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

# Importar desde tus archivos de configuración y helpers
from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_009: Registro de venta con existencia suficiente ===")
    
    try:
        print("[PASO 1] Inicializando el navegador Chrome...")
        driver = crear_navegador()
        wait = crear_espera(driver, 10)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 1 (Inicialización del navegador): {e}")
    
    try:
        url_login = f"{FRONTEND_URL}/login.html"
        print(f"[PASO 2] Navegando a la página de inicio de sesión obligatoria: {url_login}")
        driver.get(url_login)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 2 (Carga de la vista login.html): {e}")
    
    try:
        print(f"[PASO 3] Ingresando credenciales del administrador...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(2)
        print("[PASO 4] Haciendo clic en 'Iniciar sesión'...")
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 o 4 (Autenticación del administrador fallida): {e}")

    try:
        url_ventas = f"{FRONTEND_URL}/ventas.html"
        print(f"[PASO 5] Redirigiendo al módulo de Ventas: {url_ventas}")
        driver.get(url_ventas)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Redirección hacia ventas.html bloqueada): {e}")
    
    try:
        print("[PASO 6] Seleccionando el Producto: 'Cuaderno Profesional A5'...")
        select_prod_elem = wait.until(EC.presence_of_element_located((By.ID, "productoSeleccion")))
        select_producto = Select(select_prod_elem)
        select_producto.select_by_visible_text("Cuaderno Profesional A5")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (No se encontró el producto 'Cuaderno Profesional A5' en ventas.html): {e}")
    
    try:
        print("[PASO 7] Ingresando la Cantidad requerida: '5'...")
        campo_cantidad = driver.find_element(By.ID, "cantidad")
        campo_cantidad.clear()
        campo_cantidad.send_keys("5")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (No se pudo interactuar con el campo de cantidad): {e}")
    
    try:
        print("[PASO 8] Haciendo clic en el botón 'Agregar' al carrito...")
        boton_agregar = driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_agregar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_agregar)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (El botón 'Agregar' fue interceptado o no se localizó): {e}")
    
    try:
        print("[PASO 9] Seleccionando al Cliente: 'Raul Joya'...")
        select_cli_elem = driver.find_element(By.ID, "clienteVenta")
        select_cliente = Select(select_cli_elem)
        select_cliente.select_by_visible_text("Raul Joya")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 9 (No se encontró el cliente 'Raul Joya' en ventas.html): {e}")
        
    try:
        print("[PASO 10] Presionando el botón 'FINALIZAR VENTA'...")
        boton_finalizar = driver.find_element(By.ID, "btnFinalizar")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_finalizar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_finalizar)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 10 (El botón de finalización de venta falló o fue bloqueado): {e}")
    
    try:
        print("[PASO 11] EVALUACIÓN: Validando alerta del sistema de venta procesada...")
        alert = wait.until(EC.alert_is_present())
        texto_alerta = alert.text
        print(f" -> Respuesta del módulo de ventas: '{texto_alerta}'")
        
        assert "correctamente" in texto_alerta.lower() or "registrada" in texto_alerta.lower(), f"La venta falló con el mensaje: '{texto_alerta}'"
        alert.accept()
        time.sleep(2)
        print(" -> [OK] Venta procesada y guardada correctamente con stock suficiente.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 11 (EVALUACIÓN NEGATIVA): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 11 (La alerta de confirmación del navegador nunca apareció): {e}")
        
    print("=== [FIN CASE] CP_009 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
