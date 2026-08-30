# ============================================================
# CP_001
# INICIO DE SESIÓN CON CREDENCIALES VÁLIDAS DE ADMINISTRADOR
# ============================================================

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from config import (
    FRONTEND_URL,
    ADMIN_CORREO,
    ADMIN_PASSWORD
)

from helpers import (
    crear_navegador,
    crear_espera,
    cerrar_navegador
)


def ejecutar_cp_001():

    driver = None

    try:

        print("=" * 60)
        print("CP_001 - LOGIN ADMINISTRADOR")
        print("=" * 60)

        # ----------------------------------------------------
        # 1. CREAR NAVEGADOR
        # ----------------------------------------------------

        driver = crear_navegador()

        wait = crear_espera(driver)

        # ----------------------------------------------------
        # 2. ABRIR PÁGINA DE LOGIN
        # ----------------------------------------------------

        url_login = FRONTEND_URL + "/login.html"

        print(f"Abriendo: {url_login}")

        driver.get(url_login)

        # ----------------------------------------------------
        # 3. ESPERAR CAMPO CORREO
        # ----------------------------------------------------

        campo_correo = wait.until(
            EC.visibility_of_element_located(
                (By.ID, "correo")
            )
        )

        # ----------------------------------------------------
        # 4. INGRESAR CORREO
        # ----------------------------------------------------

        campo_correo.clear()

        campo_correo.send_keys(
            ADMIN_CORREO
        )

        print(
            f"Correo ingresado: {ADMIN_CORREO}"
        )

        # ----------------------------------------------------
        # 5. INGRESAR CONTRASEÑA
        # ----------------------------------------------------

        campo_password = wait.until(
            EC.visibility_of_element_located(
                (By.ID, "password")
            )
        )

        campo_password.clear()

        campo_password.send_keys(
            ADMIN_PASSWORD
        )

        print("Contraseña ingresada.")

        # ----------------------------------------------------
        # 6. PRESIONAR INICIAR SESIÓN
        # ----------------------------------------------------

        boton_login = wait.until(
            EC.element_to_be_clickable(
                (By.ID, "loginButton")
            )
        )

        boton_login.click()

        print("Botón 'Iniciar sesión' presionado.")

        # ----------------------------------------------------
        # 7. ESPERAR RESULTADO
        # ----------------------------------------------------

        wait.until(
            lambda d:
            d.current_url != url_login
            or
            "token" in d.execute_script(
                "return window.localStorage"
            )
        )

        # ----------------------------------------------------
        # 8. MOSTRAR RESULTADO
        # ----------------------------------------------------

        print(
            "URL después del login:"
        )

        print(
            driver.current_url
        )

        # ----------------------------------------------------
        # 9. VERIFICAR SESIÓN
        # ----------------------------------------------------

        local_storage = driver.execute_script(
            "return Object.assign({}, window.localStorage);"
        )

        print(
            "Contenido de localStorage:"
        )

        print(local_storage)

        # ----------------------------------------------------
        # 10. VALIDACIÓN
        # ----------------------------------------------------

        if driver.current_url != url_login:

            print()
            print("RESULTADO CP_001: APROBADO")
            print(
                "El administrador pudo iniciar sesión."
            )

        else:

            print()
            print("RESULTADO CP_001: EN SEGUIMIENTO")
            print(
                "La URL no cambió después del login."
            )

    except Exception as error:

        print()
        print("RESULTADO CP_001: RECHAZADO")
        print(
            f"Error durante la prueba: {error}"
        )

        # Captura de evidencia en caso de error
        if driver:

            driver.save_screenshot(
                "CP_001_error.png"
            )

            print(
                "Captura guardada como CP_001_error.png"
            )

        raise

    finally:

        cerrar_navegador(driver)


if __name__ == "__main__":

    ejecutar_cp_001()