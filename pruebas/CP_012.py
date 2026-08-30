import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

# Importar la configuración del proyecto y las funciones de helpers.py
from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_012: Reporte de ventas filtrado por producto ===")
    
    try:
        print("[PASO 1] Inicializando el navegador Chrome de forma segura...")
        driver = crear_navegador()
        wait = crear_espera(driver, 10)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 1 (Inicialización del navegador): {e}")
    
    try:
        url_login = f"{FRONTEND_URL}/login.html"
        print(f"[PASO 2] Navegando a la pantalla de inicio de sesión obligatoria: {url_login}")
        driver.get(url_login)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 2 (Carga de la página login.html): {e}")
    
    try:
        print(f"[PASO 3] Autenticando credenciales administrativas para acceder a los reportes...")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        print("[PASO 4] Ingresando contraseña del administrador...")
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(2)
        print("[PASO 5] Enviando formulario presionando 'Iniciar sesión'...")
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3, 4 o 5 (Autenticación rechazada por el backend): {e}")

    try:
        url_movimientos = f"{FRONTEND_URL}/movimientos_inventario.html"
        print(f"[PASO 6] Redirigiendo al módulo de Historial de Movimientos: {url_movimientos}")
        driver.get(url_movimientos)
        time.sleep(2.5)  # Tiempo para asegurar la carga del DOM y la ejecución de apiFetch()
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Ruta movimientos_inventario.html inaccesible o sesión expirada): {e}")
    
    try:
        print("[PASO 7] Seleccionando Tipo de movimiento de forma explícita: 'Salida' (Ventas)...")
        select_tipo_elem = wait.until(EC.presence_of_element_located((By.ID, "filtroTipo")))
        select_tipo = Select(select_tipo_elem)
        select_tipo.select_by_value("salida")
        time.sleep(2)  # Pausa visual para verificar el cambio de estado del desplegable
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (No se pudo localizar o seleccionar el valor en '#filtroTipo'): {e}")
    
    try:
        print("[PASO 8] Ingresando filtro de Producto en el buscador: 'Cuaderno Profesional A5'...")
        buscador = driver.find_element(By.ID, "buscarMov")
        buscador.clear()
        buscador.send_keys("Cuaderno Profesional A5")
        time.sleep(2.5)  # Pausa obligatoria para permitir el renderizado reactivo de la función renderMovimientos()
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (El elemento input '#buscarMov' está bloqueado o ausente): {e}")
    
    # --- EVALUACIÓN DETALLADA CON SCROLL Y VALIDACIÓN DE CANTIDADES ---
    try:
        print("[PASO 9] EVALUACIÓN REAL: Extrayendo registros de la tabla e iniciando auditoría visual...")
        filas = driver.find_elements(By.XPATH, "//tbody[@id='tablaMov']/tr")
        
        # Detectar el contenedor de control si la búsqueda está en cero registros reales
        if len(filas) == 1 and "sin-resultados" in filas[0].get_attribute("class"):
            raise AssertionError("La tabla reporta cero registros. No se encontraron ventas de 'Cuaderno Profesional A5'.")
            
        print(f" -> Se detectaron {len(filas)} filas resultantes en el reporte. Iniciando escaneo dinámico...")
        
        for i, fila in enumerate(filas, start=1):
            # Hacer scroll explícito elemento por elemento para simular visualización del tester y cargar componentes en pantalla
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", fila)
            time.sleep(0.5)  # Pausa milimétrica para observar el desplazamiento en la tabla
            
            # De acuerdo a tu estructura HTML exacta: 
            # celdas[0]=Fecha, celdas[1]=Producto, celdas[2]=Tipo (con badge), celdas[3]=Cantidad, celdas[4]=Referencia
            celdas = fila.find_elements(By.XPATH, "./td")
            
            texto_producto = celdas[1].text.strip()
            texto_tipo = celdas[2].text.strip().lower()
            texto_cantidad = celdas[3].text.strip()
            
            print(f"   - [Fila #{i}] Auditando -> Producto: '{texto_producto}' | Tipo: '{texto_tipo}' | Cantidad: '{texto_cantidad}'")
            
            # Aserción de triple factor libre de falsos positivos
            assert "cuaderno profesional a5" in texto_producto.lower(), f"Fila #{i} contiene un artículo que no corresponde: '{texto_producto}'"
            assert "salida" in texto_tipo, f"Fila #{i} no corresponde a una venta (Filtro roto), tipo encontrado: '{texto_tipo}'"
            
            # Validación de cantidad: verificar que sea un dígito numérico entero o flotante válido mayor a cero
            try:
                cantidad_numerica = float(texto_cantidad)
                assert cantidad_numerica > 0, f"La cantidad registrada es inválida o igual a cero: '{texto_cantidad}'"
            except ValueError:
                raise AssertionError(f"Fila #{i} presenta un formato de cantidad no numérico en el DOM: '{texto_cantidad}'")
                
        print(" -> [OK] Evaluación exitosa. Todos los registros corresponden a salidas de 'Cuaderno Profesional A5' con cantidades válidas.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 9 (EVALUACIÓN NEGATIVA - Inconsistencia de datos o filtros corruptos): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 9 (Error crítico estructural al intentar parsear la tabla '#tablaMov'): {e}")
        
    print("=== [FIN CASE] CP_012 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
