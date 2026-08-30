# ============================================================
# CP_002
# RECHAZO DE LOGIN CON CREDENCIALES INVÁLIDAS
# ============================================================

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from config import (
    FRONTEND_URL,
    INVALID_CORREO,
    INVALID_PASSWORD
)

from helpers import (
    crear_navegador,
    crear_espera,
    cerrar_navegador
)


def ejecutar_cp_002():

    driver = None

    try:

        print("=" * 60)
        print("CP_002 - LOGIN CON CREDENCIALES INCORRECTAS")
        print("=" * 60)

        # ----------------------------------------------------
        # 1. CREAR NAVEGADOR
        # ----------------------------------------------------

        driver = crear_navegador()

        wait = crear_espera(driver)

        # ----------------------------------------------------
        # 2. ABRIR LOGIN
        # ----------------------------------------------------

        url_login = FRONTEND_URL + "/login.html"

        driver.get(url_login)

        # ----------------------------------------------------
        # 3. INGRESAR CORREO INCORRECTO
        # ----------------------------------------------------

        campo_correo = wait.until(
            EC.visibility_of_element_located(
                (By.ID, "correo")
            )
        )

        campo_correo.clear()

        campo_correo.send_keys(
            INVALID_CORREO
        )

        # ----------------------------------------------------
        # 4. INGRESAR CONTRASEÑA INCORRECTA
        # ----------------------------------------------------

        campo_password = wait.until(
            EC.visibility_of_element_located(
                (By.ID, "password")
            )
        )

        campo_password.clear()

        campo_password.send_keys(
            INVALID_PASSWORD
        )

        # ----------------------------------------------------
        # 5. PRESIONAR LOGIN
        # ----------------------------------------------------

        boton_login = wait.until(
            EC.element_to_be_clickable(
                (By.ID, "loginButton")
            )
        )

        boton_login.click()

        print(
            "Se presionó el botón Iniciar sesión."
        )

        # ----------------------------------------------------
        # 6. ESPERAR MENSAJE DE ERROR
        # ----------------------------------------------------

        mensaje = wait.until(
            EC.visibility_of_element_located(
                (By.ID, "loginMessage")
            )
        )

        # ----------------------------------------------------
        # 7. OBTENER MENSAJE
        # ----------------------------------------------------

        texto_mensaje = (
            mensaje.text.strip()
        )

        print(
            f"Mensaje obtenido: {texto_mensaje}"
        )

        # ----------------------------------------------------
        # 8. VALIDAR MENSAJE
        # ----------------------------------------------------

        mensaje_esperado = (
            "Credenciales inválidas. "
            "Por favor, intente de nuevo."
        )

        if mensaje_esperado in texto_mensaje:

            print()
            print(
                "RESULTADO CP_002: APROBADO"
            )

            print(
                "El sistema rechazó correctamente "
                "las credenciales inválidas."
            )

        else:

            print()
            print(
                "RESULTADO CP_002: RECHAZADO"
            )

            print(
                "El mensaje recibido no coincide "
                "con el esperado."
            )

            driver.save_screenshot(
                "CP_002_fallo.png"
            )

    except Exception as error:

        print()
        print(
            "RESULTADO CP_002: RECHAZADO"
        )

        print(
            f"Error: {error}"
        )

        if driver:

            driver.save_screenshot(
                "CP_002_error.png"
            )

        raise

    finally:

        cerrar_navegador(driver)


if __name__ == "__main__":

    ejecutar_cp_002()