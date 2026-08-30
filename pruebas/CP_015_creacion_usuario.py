import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

# Importar desde tus archivos de configuración y helpers
from config import FRONTEND_URL, USUARIO_PRUEBA_NOMBRE, USUARIO_PRUEBA_CORREO, USUARIO_PRUEBA_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_015: Creación de usuario ===")
    
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
        time.sleep(2)  # Pausa visual para ver la carga inicial
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 2 (Carga de la URL de registro): {e}")
    
    try:
        print(f"[PASO 3] Escribiendo el nombre completo: '{USUARIO_PRUEBA_NOMBRE}'")
        campo_nombre = wait.until(EC.presence_of_element_located((By.ID, "nombre")))
        campo_nombre.clear()
        campo_nombre.send_keys(USUARIO_PRUEBA_NOMBRE)
        time.sleep(2)  # Pausa visual
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Localización o ingreso en campo 'nombre'): {e}")
    
    try:
        print(f"[PASO 4] Escribiendo el correo electrónico: '{USUARIO_PRUEBA_CORREO}'")
        campo_correo = driver.find_element(By.ID, "correo")
        campo_correo.clear()
        campo_correo.send_keys(USUARIO_PRUEBA_CORREO)
        time.sleep(2)  # Pausa visual
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Localización o ingreso en campo 'correo'): {e}")
    
    try:
        print("[PASO 5] Interactuando con el selector de Roles...")
        select_elemento = driver.find_element(By.ID, "rol")
        select_rol = Select(select_elemento)
        time.sleep(1) 
        if len(select_rol.options) > 1:
            select_rol.select_by_index(1)
            print(f" -> Rol seleccionado visualmente: '{select_rol.first_selected_option.text}'")
        else:
            print(" -> Aviso: El selector de roles no contiene opciones cargadas.")
        time.sleep(2)  # Pausa visual
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Selección de rol en el menú desplegable): {e}")

    try:
        print(f"[PASO 6] Escribiendo contraseña en campo password y campo confirmación...")
        campo_pass = driver.find_element(By.ID, "password")
        campo_pass.clear()
        campo_pass.send_keys(USUARIO_PRUEBA_PASSWORD)
        time.sleep(2)  # Pausa visual
        
        campo_conf = driver.find_element(By.ID, "confirmPassword")
        campo_conf.clear()
        campo_conf.send_keys(USUARIO_PRUEBA_PASSWORD)
        time.sleep(2)  # Pausa visual
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Ingreso de contraseñas de validación): {e}")
    
    try:
        print("[PASO 7] Haciendo clic en el botón 'Crear cuenta'...")
        boton_registro = driver.find_element(By.ID, "registerButton")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_registro)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", boton_registro)
        time.sleep(3)  # Pausa extendida para ver la respuesta en pantalla
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (Clic en el botón 'registerButton'): {e}")
    
    # --- EVALUACIÓN REAL DE REGISTRO ---
    try:
        print("[PASO 8] EVALUACIÓN: Verificando la alerta de confirmación del sistema...")
        mensaje = wait.until(EC.presence_of_element_located((By.ID, "registerMessage")))
        texto_alerta = mensaje.text.strip().lower()
        print(f" -> Texto obtenido en la interfaz: '{mensaje.text}'")
        
        # Validamos que no se muestren palabras clave de error o que contenga mensajes afirmativos
        assert "error" not in texto_alerta and "existe" not in texto_alerta, f"El sistema arrojó una advertencia de fallo: '{mensaje.text}'"
        print(" -> [OK] El usuario ha sido procesado de manera correcta por la interfaz.")
    except AssertionError as error_validacion:
        raise RuntimeError(f"Fallo en PASO 8 (EVALUACIÓN NEGATIVA): {error_validacion}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (El contenedor de mensaje final '#registerMessage' no pudo ser leído): {e}")
    
    print("=== [FIN CASE] CP_015 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
