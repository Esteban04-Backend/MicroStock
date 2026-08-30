import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_014: Validación cruzada de indicadores dinámicos del Dashboard ===")
    
    try:
        print("[PASO 1] Inicializando el navegador Chrome...")
        driver = crear_navegador()
        wait = crear_espera(driver, 10)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 1 (Inicialización del navegador): {e}")
    
    try:
        url_login = f"{FRONTEND_URL}/login.html"
        print(f"[PASO 2] Iniciando sesión obligatoria con la cuenta del administrador...")
        driver.get(url_login)
        time.sleep(2)
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(1.5)
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en el inicio de sesión previo al Dashboard: {e}")

    # --- RECOLECCIÓN DE DATOS REALES DIRECTO EN LOS MÓDULOS ---
    
    # Módulo 1: Conteo real en el historial de movimientos
    try:
        url_movimientos = f"{FRONTEND_URL}/movimientos_inventario.html"
        print(f"[PASO 3] Yendo a movimientos_inventario.html para leer las transacciones reales...")
        driver.get(url_movimientos)
        time.sleep(2.5)
        # Desplazamos hasta las tarjetas de control del módulo
        indicador_mov = wait.until(EC.presence_of_element_located((By.ID, "totalMov")))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", indicador_mov)
        time.sleep(1.5)
        total_mov_reales = indicador_mov.text.strip()
        print(f" -> [MÓDULO MOVIMIENTOS] Valor real certificado en el sistema = '{total_mov_reales}'")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3 (Imposible auditar las transacciones reales en su módulo de origen): {e}")

    # Módulo 2: Conteo real en la lista de productos
    try:
        url_productos = f"{FRONTEND_URL}/productos.html"
        print(f"[PASO 4] Yendo a productos.html para contar físicamente los registros guardados...")
        driver.get(url_productos)
        time.sleep(2.5)
        # Contamos cuántas filas reales existen en el cuerpo de la tabla de productos registrados
        filas_productos = driver.find_elements(By.XPATH, "//table[@id='tablaProductos']/tbody/tr")
        
        # Si la tabla tiene datos pero muestra la fila por defecto de "No hay productos", el total es 0
        if len(filas_productos) == 1 and "sin-resultados" in filas_productos[0].get_attribute("class"):
            total_prod_reales = "0"
        else:
            total_prod_reales = str(len(filas_productos))
            # Hacemos un scroll rápido al final de la tabla para ver que cargó
            if len(filas_productos) > 0:
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", filas_productos[-1])
                time.sleep(1.5)
                
        print(f" -> [MÓDULO PRODUCTOS] Cantidad física de productos contados en el DOM = '{total_prod_reales}'")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 4 (Imposible auditar y contar los artículos en productos.html): {e}")

    # Módulo 3: Conteo real en el módulo de alertas de stock
    try:
        url_alertas = f"{FRONTEND_URL}/alertas_stock.html"
        print(f"[PASO 5] Yendo a alertas_stock.html para verificar los artículos con stock bajo...")
        driver.get(url_alertas)
        time.sleep(2.5)
        
        # Asumiendo una estructura estándar de filas en la tabla del módulo de alertas
        filas_alertas = driver.find_elements(By.XPATH, "//table/tbody/tr")
        if len(filas_alertas) == 1 and ("sin-resultados" in filas_alertas[0].get_attribute("class") or "No hay" in filas_alertas[0].text):
            total_alertas_reales = "0"
        else:
            total_alertas_reales = str(len(filas_alertas))
            if len(filas_alertas) > 0:
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", filas_alertas[-1])
                time.sleep(1.5)
                
        print(f" -> [MÓDULO ALERTAS] Cantidad física de alertas encontradas bajo el mínimo = '{total_alertas_reales}'")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 5 (Imposible auditar las alarmas de inventario en alertas_stock.html): {e}")

    # --- CONFRONTACIÓN ESTRICTA CRUZADA EN EL DASHBOARD ---
    try:
        url_dashboard = f"{FRONTEND_URL}/index.html"
        print(f"[PASO 6] Abriendo el Panel de Control principal (Dashboard): {url_dashboard}")
        driver.get(url_dashboard)
        time.sleep(2.5)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Error al intentar recargar index.html): {e}")
        
    try:
        print("[PASO 7] EVALUACIÓN REAL: Realizando la verificación cruzada de tarjetas...")
        
        # Extraemos los valores inyectados de forma dinámica en las tarjetas del Dashboard
        dash_productos = wait.until(EC.presence_of_element_located((By.ID, "totalProductos"))).text.strip()
        dash_alertas = driver.find_element(By.ID, "totalAlertas").text.strip()
        dash_movimientos = driver.find_element(By.ID, "totalMovimientos").text.strip()
        
        print(f"\n[DATOS VISUALIZADOS EN DASHBOARD]:")
        print(f" 📦 Total Productos CARD: '{dash_productos}'")
        print(f" ⚠️ Alertas de Stock CARD: '{dash_alertas}'")
        print(f" 🔄 Movimientos CARD:     '{dash_movimientos}'\n")
        
        # Bloque de aserciones de triple factor cruzado (Garantía absoluta contra falsos positivos)
        assert dash_productos == total_prod_reales, f"FALSO POSITIVO EN CARD PRODUCTOS: El Dashboard muestra '{dash_productos}' pero contamos físicamente '{total_prod_reales}' en el módulo."
        assert dash_alertas == total_alertas_reales, f"FALSO POSITIVO EN CARD ALERTAS: El Dashboard muestra '{dash_alertas}' pero contamos físicamente '{total_alertas_reales}' en el módulo."
        assert dash_movimientos == total_mov_reales, f"FALSO POSITIVO EN CARD MOVIMIENTOS: El Dashboard muestra '{dash_movimientos}' pero el historial certifica '{total_mov_reales}'."
        
        print(" -> [OK] ÉXITO REAL confirmación absoluta: Todas las tarjetas dinámicas del Dashboard están 100% sincronizadas.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 7 (EVALUACIÓN NEGATIVA - Se detectaron indicadores estáticos o congelados): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (Error al intentar localizar los IDs de las tarjetas del Panel de Control): {e}")
        
    print("=== [FIN CASE] CP_014 ejecutado con validación real exitosa ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
