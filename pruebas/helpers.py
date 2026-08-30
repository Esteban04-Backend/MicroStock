# ============================================================
# FUNCIONES AUXILIARES PARA LAS PRUEBAS DE MICROSТOCK
# ============================================================

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait


def crear_navegador():
    """
    Crea y configura una instancia de Google Chrome
    controlada mediante Selenium WebDriver.
    """

    options = Options()

    # Maximizar la ventana para facilitar la visualización
    # durante la ejecución de las pruebas.
    options.add_argument("--start-maximized")

    driver = webdriver.Chrome(options=options)

    return driver


def crear_espera(driver, segundos=60):
    """
    Crea una espera explícita reutilizable.
    """

    return WebDriverWait(driver, segundos)


def cerrar_navegador(driver):
    """
    Cierra el navegador de manera segura.
    """

    if driver is not None:
        driver.quit()