import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_008: Agregar un nuevo Cliente ===")
    
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
        print(f"[PASO 3] Ingresando datos de acceso administrativos...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(2)
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Fallo en inicio de sesión administrativo): {e}")

    try:
        url_clientes = f"{FRONTEND_URL}/clientes.html"
        print(f"[PASO 4] Redirigiendo al módulo de Gestión de Clientes: {url_clientes}")
        driver.get(url_clientes)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Ruta clientes.html inaccesible): {e}")
    
    try:
        print("[PASO 5] Completando campos del formulario de registro de clientes...")
        wait.until(EC.presence_of_element_located((By.ID, "nombreCliente"))).send_keys("Juliana Jiménez")
        time.sleep(2)
        driver.find_element(By.ID, "telefonoCliente").send_keys("3125556698")
        time.sleep(2)
        driver.find_element(By.ID, "correoCliente").send_keys("juliana@gmail.com")
        time.sleep(2)
        driver.find_element(By.ID, "direccionCliente").send_keys("calle 3 #15-36")
        time.sleep(2)
        
        print("[PASO 6] Seleccionando estado: 'Activo'...")
        select_estado = Select(driver.find_element(By.ID, "estadoCliente"))
        select_estado.select_by_value("Activo")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 o 6 (Error al ingresar información del cliente): {e}")
        
    try:
        print("[PASO 7] Desplazando y presionando de forma segura 'Guardar cliente'...")
        boton_guardar = driver.find_element(By.XPATH, "//form[@id='formCliente']//button[@type='submit']")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_guardar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_guardar)
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (El botón de guardado no pudo ser procesado): {e}")
        
    # --- EVALUACIÓN REAL POST-REGISTRO ---
    try:
        print("[PASO 8] EVALUACIÓN REAL: Buscando al cliente registrado en el sistema...")
        buscador = driver.find_element(By.ID, "buscarCliente")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", buscador)
        buscador.clear()
        buscador.send_keys("Juliana Jiménez")
        time.sleep(20)
        
        print("[PASO 9] Validando presencia del nuevo registro en '#tablaClientes'...")
        fila_resultado = driver.find_element(By.XPATH, "//table[@id='tablaClientes']/tbody/tr")
        texto_fila = fila_resultado.text.strip()
        print(f" -> Registro detectado en la tabla de clientes: '{texto_fila}'")
        
        assert "juliana jiménez" in texto_fila.lower(), f"El cliente no fue indexado de forma correcta: '{texto_fila}'"
        print(" -> [OK] Cliente registrado y validado en tiempo real sin falsos positivos.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 8/9 (EVALUACIÓN NEGATIVA - El cliente no figura en el cuerpo de la tabla): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8/9 (Error estructural al inspeccionar la tabla de clientes): {e}")

    print("=== [FIN CASE] CP_008 de clientes ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
