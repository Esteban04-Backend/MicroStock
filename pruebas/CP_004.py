import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_004: Validación de campos obligatorios ===")
    
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
        print(f"[PASO 3] Ingresando correo del administrador: '{ADMIN_CORREO}'")
        campo_email = wait.until(EC.presence_of_element_located((By.ID, "correo")))
        campo_email.clear()
        campo_email.send_keys(ADMIN_CORREO)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Introducción de correo administrativo): {e}")
        
    try:
        print("[PASO 4] Ingresando contraseña del administrador...")
        campo_pass = driver.find_element(By.ID, "password")
        campo_pass.clear()
        campo_pass.send_keys(ADMIN_PASSWORD)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Introducción de contraseña administrativa): {e}")
    
    try:
        print("[PASO 5] Haciendo clic en el botón 'Iniciar sesión'...")
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Proceso de inicio de sesión fallido): {e}")
    
    try:
        url_productos = f"{FRONTEND_URL}/productos.html"
        print(f"[PASO 6] Redirigiendo al módulo de Gestión de Productos: {url_productos}")
        driver.get(url_productos)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Acceso denegado/problemas con productos.html): {e}")
    
    try:
        print("[PASO 7] Dejando vacíos intencionalmente los campos requeridos 'nombre' y 'stock'.")
        print("[PASO 8] Completando únicamente el campo de Precio unitario: '15000'")
        campo_precio = wait.until(EC.presence_of_element_located((By.ID, "precio")))
        campo_precio.clear()
        campo_precio.send_keys("15000")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (No se pudo escribir en el campo de 'precio'): {e}")
    
    try:
        print("[PASO 9] Asignando una Categoría al selector...")
        select_cat = Select(driver.find_element(By.ID, "categoria"))
        if len(select_cat.options) > 0:
            select_cat.select_by_index(0)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 9 (El selector de categorías falló): {e}")
        
    try:
        print("[PASO 10] Desplazando y presionando de forma segura 'Guardar producto' con campos inválidos...")
        boton_guardar = driver.find_element(By.ID, "btnGuardarProducto")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_guardar)
        time.sleep(1.5)
        driver.execute_script("arguments[0].click();", boton_guardar)
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 10 (Botón '#btnGuardarProducto' no pudo ser procesado o desplazado): {e}")
    
    try:
        print("[PASO 11] Verificando si el navegador retuvo el envío debido a restricciones HTML5...")
        campo_nombre = driver.find_element(By.ID, "nombre")
        es_invalido = driver.execute_script("return arguments[0].validity.valueMissing;", campo_nombre)
        
        if es_invalido:
            print(" -> Resultado: ÉXITO. El navegador bloqueó el envío de manera nativa por campo requerido faltante.")
        else:
            print(" -> Resultado: ALERTA. El formulario ignoró las restricciones HTML5 de campos vacíos.")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 11 (La evaluación JavaScript del atributo 'required' falló): {e}")
        
    print("=== [FIN CASE] CP_004 de validación obligatoria ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
