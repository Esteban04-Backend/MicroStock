import time
from datetime import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from config import FRONTEND_URL, ADMIN_CORREO, ADMIN_PASSWORD
from helpers import crear_navegador, crear_espera, cerrar_navegador

driver = None
try:
    print("\n=== [INICIO CASE] CP_013: Reporte de ventas por rango de fechas ===")
    
    try:
        print("[PASO 1] Inicializando el navegador Chrome de manera visible...")
        driver = crear_navegador()
        wait = crear_espera(driver, 10)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 1 (Inicialización del navegador): {e}")
    
    try:
        url_login = f"{FRONTEND_URL}/login.html"
        print(f"[PASO 2] Cargando la pantalla de inicio de sesión obligatoria: {url_login}")
        driver.get(url_login)
        time.sleep(2)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 2 (Carga de login.html): {e}")
    
    try:
        print(f"[PASO 3] Escribiendo el correo del administrador: '{ADMIN_CORREO}'")
        wait.until(EC.presence_of_element_located((By.ID, "correo"))).send_keys(ADMIN_CORREO)
        time.sleep(2)
        print("[PASO 4] Escribiendo la contraseña de la cuenta...")
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(2)
        print("[PASO 5] Haciendo clic en el botón 'Iniciar sesión'...")
        driver.find_element(By.ID, "loginButton").click()
        time.sleep(3)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 3, 4 o 5 (Fallo en la autenticación): {e}")

    try:
        url_movimientos = f"{FRONTEND_URL}/movimientos_inventario.html"
        print(f"[PASO 6] Redirigiendo a la pantalla del Historial de Movimientos: {url_movimientos}")
        driver.get(url_movimientos)
        time.sleep(2.5)
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 6 (Ruta movimientos_inventario.html bloqueada): {e}")
    
    try:
        print("[PASO 7] Seleccionando Tipo de movimiento en la barra: 'Salida' (Ventas de todos los productos)...")
        select_tipo_elem = wait.until(EC.presence_of_element_located((By.ID, "filtroTipo")))
        select_tipo = Select(select_tipo_elem)
        select_tipo.select_by_value("salida")
        time.sleep(2.5)  # Tiempo para ver el filtro reactivo renderizado
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 7 (No se pudo manipular el selector '#filtroTipo'): {e}")
        
    # --- EVALUACIÓN REAL: RANGO EXIGIDO (2026-08-01 a 2026-08-15) ---
    try:
        print("[PASO 8] EVALUACIÓN REAL: Auditando cronología y cantidades fila por fila...")
        filas = driver.find_elements(By.XPATH, "//tbody[@id='tablaMov']/tr")
        
        if len(filas) == 1 and "sin-resultados" in filas[0].get_attribute("class"):
            print(" -> Aviso: No se detectaron ventas en el sistema para evaluar este periodo.")
        else:
            fecha_inicial = datetime.strptime("2026-08-01", "%Y-%m-%d")
            fecha_final = datetime.strptime("2026-08-15", "%Y-%m-%d")
            
            print(f" -> Se detectaron {len(filas)} filas en el reporte. Iniciando escaneo con desplazamiento...")
            
            for i, fila in enumerate(filas, start=1):
                # Desplazar la pantalla para traer la fila al foco visual del usuario
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", fila)
                time.sleep(0.8)  # Pausa real para presenciar la auditoría paso a paso
                
                # Celdas: td=Fecha, td=Producto, td=Tipo, td=Cantidad, td=Referencia
                celdas = fila.find_elements(By.XPATH, "./td")
                texto_fecha_completa = celdas[0].text.strip()
                texto_producto = celdas[1].text.strip()
                texto_tipo = celdas[2].text.strip().lower()
                texto_cantidad = celdas[3].text.strip()
                
                print(f"   - [Fila #{i}] Analizando -> Fecha: '{texto_fecha_completa}' | Producto: '{texto_producto}' | Cantidad: {texto_cantidad}")
                
                # 1. Validar que el filtro de tipo "Salida" no sufra desvíos (Cero falsos positivos)
                assert "salida" in texto_tipo, f"Fila #{i} contiene un tipo de movimiento no deseado: '{texto_tipo}'"
                
                # 2. Validar que la cantidad de la venta sea íntegra y real
                try:
                    num_cantidad = float(texto_cantidad)
                    assert num_cantidad > 0, f"Fila #{i} presenta una cantidad inválida o vacía: {texto_cantidad}"
                except ValueError:
                    raise AssertionError(f"Fila #{i} presenta un formato de cantidad corrupto no numérico: '{texto_cantidad}'")
                
                # 3. Extraer solo el componente de la fecha (aislando la hora de .toLocaleString())
                # Ejemplo: "12/8/2026, 14:30:00" -> extrae "12/8/2026"
                componente_fecha = texto_fecha_completa.split(",")[0].strip()
                
                try:
                    fecha_objeto = datetime.strptime(componente_fecha, "%d/%m/%Y")
                except ValueError:
                    try:
                        fecha_objeto = datetime.strptime(componente_fecha, "%m/%d/%Y")
                    except ValueError:
                        fecha_objeto = datetime.strptime(componente_fecha, "%Y-%m-%d")
                
                # 4. Validar el rango matemático del periodo estipulado
                assert fecha_inicial <= fecha_objeto <= fecha_final, f"Fila #{i} está fuera del rango permitido de fechas: '{texto_fecha_completa}'"
                
            print(" -> [OK] El reporte por rango de fechas pasó la auditoría con absoluta fidelidad.")
    except AssertionError as error_val:
        raise RuntimeError(f"Fallo en PASO 8 (EVALUACIÓN NEGATIVA - Datos inconsistentes en el rango temporal): {error_val}")
    except Exception as e:
        raise RuntimeError(f"Fallo en PASO 8 (Error crítico al leer o parsear las filas de la tabla '#tablaMov'): {e}")
        
    print("=== [FIN CASE] CP_013 ejecutado exitosamente ===")

except RuntimeError as error_flujo:
    print(f"\n❌ EL TESTER NO PASÓ. Se detuvo en: {error_flujo}")
except Exception as e_inesperado:
    print(f"\n❌ ERROR INESPERADO GLOBAL: {e_inesperado}")
finally:
    print("[LIMPIEZA] Cerrando el navegador de manera segura...")
    cerrar_navegador(driver)
