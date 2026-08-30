import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_006: Agregar una nueva categoría ===")
    
    try:
        print("[PASO 1] Inicializando el navegador Chrome...")
        driver = crear_navegador()
        wait = crear_espera(driver, 10)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 1 (Inicialización del navegador): {e}")
    
    try:
        url_login = f"{FRONTEND_URL}/login.html"
        print(f"[PASO 2] Cargando pantalla de inicio de sesión obligatoria: {url_login}")
        driver.get(url_login)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 2 (Carga de login.html): {e}")
    
    try:
        print(f"[PASO 3] Ingresando credenciales del administrador...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(2)
        print("[PASO 4] Iniciando sesión...")
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 o 4 (Autenticación rechazada): {e}")

    try:
        url_categorias = f"{FRONTEND_URL}/categorias.html"
        print(f"[PASO 5] Redirigiendo al módulo de Gestión de Categorías: {url_categorias}")
        driver.get(url_categorias)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Ruta categorias.html inaccesible): {e}")
    
    try:
        print("[PASO 6] Ingresando nombre de la categoría: 'Papelería'...")
        campo_nombre = wait.until(EC.presence_of_element_located((By.ID, "nombreCategoria")))
        campo_nombre.clear()
        campo_nombre.send_keys("Papelería")
        time.sleep(2)
        
        print("[PASO 7] Ingresando descripción detallada...")
        campo_desc = driver.find_element(By.ID, "descripcionCategoria")
        campo_desc.clear()
        campo_desc.send_keys("Elementos usados en oficinas como cuadernos, resmas de papel, esferos, etc.")
        time.sleep(2)
        
        print("[PASO 8] Seleccionando estado de la categoría: 'Activa'...")
        select_estado = Select(driver.find_element(By.ID, "estadoCategoria"))
        select_estado.select_by_value("Activa")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6, 7 o 8 (Error al interactuar con el formulario de categorías): {e}")
        
    try:
        print("[PASO 9] Desplazando y presionando de forma segura 'Guardar categoría'...")
        # El formulario tiene id="formCategoria" y un botón submit genérico
        boton_guardar = driver.find_element(By.XPATH, "//form[@id='formCategoria']//button[@type='submit']")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_guardar)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_guardar)
        time.sleep(3)  # Tiempo para persistencia en base de datos y recarga de tabla
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 9 (El botón de guardado fue interceptado o no se localizó): {e}")
        
    # --- EVALUACIÓN EN TIEMPO REAL SIN FALSOS POSITIVOS ---
    try:
        print("[PASO 10] EVALUACIÓN REAL: Buscando la categoría registrada en la tabla...")
        buscador = driver.find_element(By.ID, "buscarCategoria")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", buscador)
        buscador.clear()
        buscador.send_keys("Papelería")
        time.sleep(2.5)
        
        print("[PASO 11] Leyendo el registro insertado directamente desde el DOM...")
        fila_resultado = driver.find_element(By.XPATH, "//table[@id='tablaCategorias']/tbody/tr")
        texto_fila = fila_resultado.text.strip()
        print(f" -> Registro detectado en la tabla de categorías: '{texto_fila}'")
        
        assert "papelería" in texto_fila.lower(), f"El registro guardado no coincide con el buscado: '{texto_fila}'"
        print(" -> [OK] Categoría creada, indexada y verificada de forma transparente en la interfaz.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 10/11 (EVALUACIÓN NEGATIVA - La categoría no se guardó en la tabla): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 10/11 (Error al procesar la lectura de '#tablaCategorias'): {e}")

    print("=== [FIN CASE] CP_006 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
