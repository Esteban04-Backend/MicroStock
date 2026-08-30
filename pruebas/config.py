# ============================================================
# CONFIGURACIÓN GENERAL DE LAS PRUEBAS DE MICROSТOCK
# ============================================================

# URL donde está ejecutándose el FRONTEND.
#
# Si utilizas Live Server en Visual Studio Code,
# normalmente será:
#
# http://127.0.0.1:5500
#
# Si tu frontend utiliza otro puerto, cambia únicamente
# esta variable.

FRONTEND_URL = "http://127.0.0.1:5500"


# URL del backend Node.js + Express

BACKEND_URL = "http://localhost:3000"


# Credenciales del administrador utilizadas para
# autenticar las pruebas que requieren permisos.

ADMIN_CORREO = "raul@gmail.com"

ADMIN_PASSWORD = "1096AA3EV01"


# Credenciales incorrectas para CP_002

INVALID_CORREO = "admin@microstock.com"

INVALID_PASSWORD = "ClaveIncorrecta999"


# Datos para CP_015 y CP_016

USUARIO_PRUEBA_NOMBRE = "Laura Martínez"

USUARIO_PRUEBA_CORREO = "laura.admin@microstock.com"

USUARIO_PRUEBA_PASSWORD = "LauraTest123"


# ID del rol administrador.
#
# IMPORTANTE:
# El backend recibe un número en el campo "rol".
# Si en tu tabla Rol el administrador NO es 1,
# cambia este valor por el ID correspondiente.

ROL_ADMIN = 1