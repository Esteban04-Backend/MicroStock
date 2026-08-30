import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_007: Agregar un nuevo proveedor ===")
    
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
        print(f"[PASO 3] Ingresando credenciales administrativas...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(2)
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Fallo en autenticación): {e}")

    try:
        url_proveedores = f"{FRONTEND_URL}/proveedores.html"
        print(f"[PASO 4] Redirigiendo al módulo de Gestión de Proveedores: {url_proveedores}")
        driver.get(url_proveedores)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Ruta proveedores.html inaccesible): {e}")
    
    try:
        print("[PASO 5] Completando campos del formulario de proveedores...")
        wait.until(EC.presence_of_element_located((By.ID, "nombreProveedor"))).send_keys("Norma S.A")
        time.sleep(2)
        driver.find_element(By.ID, "telefonoProveedor").send_keys("6012547895")
        time.sleep(2)
        driver.find_element(By.ID, "correoProveedor").send_keys("atencionalcliente@norma.com")
        time.sleep(2)
        driver.find_element(By.ID, "direccionProveedor").send_keys("Calle 46 #35-08")
        time.sleep(2)
        
        print("[PASO 6] Seleccionando estado: 'Activo'...")
        select_estado = Select(driver.find_element(By.ID, "estadoProveedor"))
        select_estado.select_by_value("Activo")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 o 6 (Error al ingresar datos del proveedor): {e}")
        
    try:
        print("[PASO 7] Desplazando y presionando de forma segura 'Guardar proveedor'...")
        boton_guardar = driver.find_element(By.XPATH, "//form[@id='formProveedor']//button[@type='submit']")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_guardar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_guardar)
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (El botón de envío no respondió o fue obstruido): {e}")
        
    # --- EVALUACIÓN REAL POST-REGISTRO ---
    try:
        print("[PASO 8] EVALUACIÓN REAL: Buscando al proveedor en la lista del sistema...")
        buscador = driver.find_element(By.ID, "buscarProveedor")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", buscador)
        buscador.clear()
        buscador.send_keys("Norma S.A")
        time.sleep(2.5)
        
        print("[PASO 9] Verificando inyección física de la fila en '#tablaProveedores'...")
        fila_resultado = driver.find_element(By.XPATH, "//table[@id='tablaProveedores']/tbody/tr")
        texto_fila = fila_resultado.text.strip()
        print(f" -> Registro detectado en la tabla de proveedores: '{texto_fila}'")
        
        assert "norma s.a" in texto_fila.lower(), f"El proveedor no se encuentra listado correctamente: '{texto_fila}'"
        print(" -> [OK] Proveedor creado y verificado de manera transparente sin falsos positivos.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 8/9 (EVALUACIÓN NEGATIVA - El proveedor no aparece en la consulta): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8/9 (Error al procesar la lectura de la tabla de proveedores): {e}")

    print("=== [FIN CASE] CP_007 de proveedores ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
