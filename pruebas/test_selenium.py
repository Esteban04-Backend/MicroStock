from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

# ==========================================
# CONFIGURACIÓN DEL NAVEGADOR
# ==========================================

options = Options()

# Crear navegador
driver = webdriver.Chrome(options=options)

try:

    # ==========================================
    # ABRIR MICROSTOCK
    # ==========================================

    driver.get("http://127.0.0.1:5500/login.html")

    # Maximizar ventana
    driver.maximize_window()

    # Esperar para visualizar
    time.sleep(5)

    # ==========================================
    # MOSTRAR INFORMACIÓN
    # ==========================================

    print("Título de la página:")
    print(driver.title)

    print("URL actual:")
    print(driver.current_url)

finally:

    # ==========================================
    # CERRAR NAVEGADOR
    # ==========================================

    driver.quit()