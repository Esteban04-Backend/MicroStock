import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, USUARIO_PRUEBA_NOMBRE, USUARIO_PRUEBA_CORREO, USUARIO_PRUEBA_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_016: Rechazo de registro por datos repetidos ===")
    
    try:
        print("[PASO 1] Inicializando el navegador Chrome...")
        driver = crear_navegador()
        wait = crear_espera(driver, 10)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 1 (Inicialización del navegador): {e}")
    
    try:
        url_destino = f"{FRONTEND_URL}/register.html"
        print(f"[PASO 2] Navegando a la página de registro: {url_destino}")
        driver.get(url_destino)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 2 (Carga de la URL de registro): {e}")
    
    try:
        print(f"[PASO 3] Ingresando el nombre repetido: '{USUARIO_PRUEBA_NOMBRE}'")
        campo_nombre = wait.until(EC.presence_of_element_located((By.ID, "nombre")))
        campo_nombre.clear()
        campo_nombre.send_keys(USUARIO_PRUEBA_NOMBRE)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Error al escribir el nombre repetido): {e}")
    
    try:
        print(f"[PASO 4] Ingresando el correo repetido: '{USUARIO_PRUEBA_CORREO}'")
        campo_correo = driver.find_element(By.ID, "correo")
        campo_correo.clear()
        campo_correo.send_keys(USUARIO_PRUEBA_CORREO)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Error al escribir el correo repetido): {e}")
    
    try:
        print("[PASO 5] Seleccionando Rol en el formulario...")
        select_rol = Select(driver.find_element(By.ID, "rol"))
        time.sleep(1)
        if len(select_rol.options) > 1:
            select_rol.select_by_index(1)
            print(f" -> Rol asignado: '{select_rol.first_selected_option.text}'")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Interacción con el selector de roles): {e}")
        
    try:
        print("[PASO 6] Completando campos de contraseña...")
        campo_pass = driver.find_element(By.ID, "password")
        campo_pass.clear()
        campo_pass.send_keys(USUARIO_PRUEBA_PASSWORD)
        time.sleep(2)
        
        campo_conf = driver.find_element(By.ID, "confirmPassword")
        campo_conf.clear()
        campo_conf.send_keys(USUARIO_PRUEBA_PASSWORD)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Escritura de claves de prueba): {e}")
    
    try:
        print("[PASO 7] Enviando el formulario presionando 'Crear cuenta'...")
        boton_registro = driver.find_element(By.ID, "registerButton")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_registro)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_registro)
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (Clic en el botón 'registerButton'): {e}")
    
    # --- EVALUACIÓN REAL DE RECHAZO ---
    try:
        print("[PASO 8] EVALUACIÓN: Validando la aparición de la alerta de error esperada...")
        mensaje_error = wait.until(EC.presence_of_element_located((By.ID, "registerMessage")))
        texto_error = mensaje_error.text.strip()
        print(f" -> Alerta capturada en la interfaz: '{texto_error}'")
        
        # Una aserción rigurosa debe validar que el texto de error no esté en blanco, 
        # demostrando que la interfaz bloqueó la acción y avisó al usuario.
        assert len(texto_error) > 0, "EVALUACIÓN NEGATIVA: El contenedor de error está vacío, el sistema no notificó el rechazo por duplicidad."
        print(" -> [OK] El sistema bloqueó correctamente la creación por datos repetidos.")
    except AssertionError as error_validacion:
        raise RuntimeError(f"Fallo en PASO 8 (El sistema permitió el registro o no mostró mensaje de advertencia): {error_validacion}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (No apareció la alerta en '#registerMessage'): {e}")
    
    print("=== [FIN CASE] CP_016 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
