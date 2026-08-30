import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_010: Bloqueo de venta por superación de Stock ===")
    
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
        print(f"[PASO 3] Autenticando al administrador...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Error en el proceso de login): {e}")

    try:
        url_ventas = f"{FRONTEND_URL}/ventas.html"
        print(f"[PASO 4] Abriendo el módulo de Ventas: {url_ventas}")
        driver.get(url_ventas)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Acceso bloqueado a ventas.html): {e}")
    
    try:
        print("[PASO 5] Seleccionando el Producto: 'Cuaderno Profesional A5'...")
        select_prod_elem = wait.until(EC.presence_of_element_located((By.ID, "productoSeleccion")))
        select_producto = Select(select_prod_elem)
        select_producto.select_by_visible_text("Cuaderno Profesional A5")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (El producto no existe en el selector de ventas.html): {e}")
    
    try:
        print("[PASO 6] Ingresando cantidad que supera el Stock (46 unidades)...")
        campo_cantidad = driver.find_element(By.ID, "cantidad")
        campo_cantidad.clear()
        campo_cantidad.send_keys("46")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (No se pudo rellenar el campo de cantidad): {e}")
    
    try:
        print("[PASO 7] Intentando agregar al carrito haciendo clic en 'Agregar'...")
        boton_agregar = driver.find_element(By.XPATH, "//button[contains(text(), 'Agregar')]")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_agregar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_agregar)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (Botón 'Agregar' inalcanzable): {e}")
    
    try:
        print("[PASO 8] EVALUACIÓN: Validando si el sistema bloqueó la acción mediante un alert...")
        alert = wait.until(EC.alert_is_present())
        texto_alerta = alert.text
        print(f" -> Alerta de restricción capturada: '{texto_alerta}'")
        
        assert "insuficiente" in texto_alerta.lower() or "stock" in texto_alerta.lower(), f"El alert no corresponde a un bloqueo de stock: '{texto_alerta}'"
        alert.accept()
        time.sleep(2)
        print(" -> [OK] El sistema bloqueó exitosamente el exceso de cantidad impidiendo su entrada al carrito.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 8 (EVALUACIÓN NEGATIVA - Se procesó la cantidad sin validar existencias): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (No se desplegó ninguna advertencia de stock insuficiente): {e}")
        
    print("=== [FIN CASE] CP_010 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
