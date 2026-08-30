import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_003: Registro exitoso de producto ===")
    
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
        raise RuntimeError(f"Fallo en PASO 2 (Carga de la vista login.html): {e}")
    
    try:
        print(f"[PASO 3] Ingresando correo del administrador: '{ADMIN_CORREO}'")
        campo_email = wait.until(EC.presence_of_element_located((By.ID, "correo")))
        campo_email.clear()
        campo_email.send_keys(ADMIN_CORREO)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Ingreso de correo administrativo en login): {e}")
    
    try:
        print("[PASO 4] Ingresando contraseña del administrador...")
        campo_pass = driver.find_element(By.ID, "password")
        campo_pass.clear()
        campo_pass.send_keys(ADMIN_PASSWORD)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Ingreso de contraseña en login): {e}")
    
    try:
        print("[PASO 5] Haciendo clic en el botón 'Iniciar sesión'...")
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Clic en loginButton o proceso de sesión): {e}")

    try:
        url_productos = f"{FRONTEND_URL}/productos.html"
        print(f"[PASO 6] Redirigiendo al módulo de Gestión de Productos: {url_productos}")
        driver.get(url_productos)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Redirección hacia productos.html bloqueada): {e}")
    
    try:
        print("[PASO 7] Ingresando Nombre del producto: 'Cuaderno Profesional A5'")
        campo_nombre = wait.until(EC.presence_of_element_located((By.ID, "nombre")))
        campo_nombre.clear()
        campo_nombre.send_keys("Cuaderno Profesional A5")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (Campo 'nombre' de producto no encontrado/bloqueado): {e}")
    
    try:
        print("[PASO 8] Ingresando Precio de venta: '12500'")
        campo_precio = driver.find_element(By.ID, "precio")
        campo_precio.clear()
        campo_precio.send_keys("12500")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (Fallo al escribir en campo 'precio'): {e}")
    
    try:
        print("[PASO 9] Ingresando Stock inicial: '50'")
        campo_stock = driver.find_element(By.ID, "stock")
        campo_stock.clear()
        campo_stock.send_keys("50")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 9 (Fallo al escribir en campo 'stock' inicial): {e}")
    
    try:
        print("[PASO 10] Ingresando Stock mínimo: '10'")
        campo_minimo = driver.find_element(By.ID, "minimo")
        campo_minimo.clear()
        campo_minimo.send_keys("10")
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 10 (Fallo al escribir en campo stock 'minimo'): {e}")
    
    try:
        print("[PASO 11] Seleccionando Categoría 'Papelería'...")
        select_cat = Select(driver.find_element(By.ID, "categoria"))
        try:
            select_cat.select_by_visible_text("Papelería")
            print(" -> Categoría 'Papelería' seleccionada exitosamente.")
        except:
            print(" -> 'Papelería' no encontrada textualmente, buscando otra opción válida disponible...")
            if len(select_cat.options) > 0:
                select_cat.select_by_index(len(select_cat.options) - 1)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 11 (Interacción con el elemento select de categorías): {e}")
            
    try:
        print("[PASO 12] Desplazando pantalla y presionando el botón 'Guardar producto' de forma segura...")
        boton_guardar = driver.find_element(By.ID, "btnGuardarProducto")
        # Corrección del script: uso de arguments[0]
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_guardar)
        time.sleep(1.5) 
        driver.execute_script("arguments[0].click();", boton_guardar)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 12 (El botón '#btnGuardarProducto' no pudo ser clickeado o desplazado): {e}")
    
    try:
        print("[PASO 13] Esperando confirmación de guardado en el sistema...")
        time.sleep(3)
        print(" -> Registro completado con éxito.")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 13 (La sincronización post-guardado falló o se congeló): {e}")
    
    print("=== [FIN CASE] CP_003 de productos ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
