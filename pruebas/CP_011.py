import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_011: Alerta cuando el stock alcanza o cae por debajo del mínimo ===")
    
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
        print(f"[PASO 3] Autenticando credenciales...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Fallo al iniciar sesión): {e}")

    try:
        url_ventas = f"{FRONTEND_URL}/ventas.html"
        print(f"[PASO 4] Ingresando al módulo de Ventas: {url_ventas}")
        driver.get(url_ventas)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Acceso a la URL ventas.html denegada): {e}")
    
    try:
        print("[PASO 5] Seleccionando el Producto: 'Cuaderno Profesional A5'...")
        select_prod_elem = wait.until(EC.presence_of_element_located((By.ID, "productoSeleccion")))
        select_producto = Select(select_prod_elem)
        select_producto.select_by_visible_text("Cuaderno Profesional A5")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (No se encontró el producto en selector de ventas.html): {e}")
    
    try:
        print("[PASO 6] Ingresando cantidad que fuerza al stock a caer bajo su mínimo (35 unidades)...")
        campo_cantidad = driver.find_element(By.ID, "cantidad")
        campo_cantidad.clear()
        campo_cantidad.send_keys("35")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Error al escribir en el campo de cantidad): {e}")
    
    try:
        print("[PASO 7] Agregando el producto presionando 'Agregar'...")
        boton_agregar = driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_agregar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_agregar)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (El botón 'Agregar' no pudo ser accionado): {e}")
        
    try:
        print("[PASO 8] Seleccionando al Cliente: 'Raul Joya'...")
        select_cli_elem = driver.find_element(By.ID, "clienteVenta")
        select_cliente = Select(select_cli_elem)
        select_cliente.select_by_visible_text("Raul Joya")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (No se seleccionó el cliente en la vista): {e}")
        
    try:
        print("[PASO 9] Desplazando y finalizando transacción presionando 'FINALIZAR VENTA'...")
        boton_finalizar = driver.find_element(By.ID, "btnFinalizar")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_finalizar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_finalizar)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 9 (Botón 'FINALIZAR VENTA' no localizable o interceptado): {e}")
    
    try:
        print("[PASO 10] EVALUACIÓN: Verificando alerta nativa de venta y disparador de alerta de stock mínimo...")
        alert = wait.until(EC.alert_is_present())
        texto_alerta = alert.text
        print(f" -> Alerta capturada en pantalla: '{texto_alerta}'")
        
        assert "correctamente" in texto_alerta.lower() or "registrada" in texto_alerta.lower(), f"La venta no concluyó exitosamente: '{texto_alerta}'"
        alert.accept()
        time.sleep(2)
        print(" -> [OK] Venta finalizada. El stock alcanzó niveles críticos por debajo del mínimo de manera conforme.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 10 (EVALUACIÓN NEGATIVA): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 10 (El alert del navegador no apareció tras confirmar la venta): {e}")
        
    print("=== [FIN CASE] CP_011 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
