var app = angular.module('starBankApp', ['ngRoute']);

// Controlador para la gestión del login
app.controller('loginController', function($scope, $http, $window) {
    $scope.error = ''; // Mensaje de error para mostrar en la UI
    $scope.correo = '';
    $scope.password = '';

    $scope.iniciarSesion = function() {
        var usuario = {
            correo: $scope.correo,
            contraseña: $scope.password
        };

        // Envía la solicitud POST a la API
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/IniciarSesion', usuario)
            .then(function(response) {
                console.log(response.data);
                localStorage.setItem('usuarioCorreo', $scope.correo); // Guardar el correo en localStorage
                localStorage.setItem('correoID', response.data.correoID); // Guardar el correoID en localStorage
                $window.location.href = 'micuenta.html'; // Redirigir a la página de cuenta
            })
            .catch(function(error) {
                // Maneja errores de respuesta y muestra un mensaje al usuario
                if (error.status === 401) {
                    $scope.error = "Correo o contraseña incorrectos.";
                } else {
                    $scope.error = "Error en el servidor, por favor intente más tarde.";
                }
                console.error(error.data);
            });
    };
});




// Configuración de rutas
app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'main.html',
            controller: 'MainController'
        })
        .otherwise({
            redirectTo: '/'
        });
});

// Controlador para la gestión de información personal
app.controller('personalInfoController', ['$scope', '$window', function($scope, $window) {
    $scope.email = localStorage.getItem('usuarioCorreo') || 'No disponible';

    $scope.redirectToMovementsPage = function() {
        $window.location.href = 'movimientos.html';
    };
}]);



//debito

app.controller('debitoController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.datosDebito = {
        numeroTarjeta: '',
        nip: ''
    };

    $scope.iniciarSesionDebito = function() {
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/IniciarSesionDebito', $scope.datosDebito)
            .then(function(response) {
                alert('Sesión iniciada con éxito.');
                localStorage.setItem('numeroTarjeta', $scope.datosDebito.numeroTarjeta);
                $window.location.href = 'midebitoopciones.html';
            }).catch(function(error) {
                alert('Error al iniciar sesión: ' + (error.data || 'Número de tarjeta o NIP incorrectos.'));
            });
    };
}]);





angular.module('starBankApp')
.controller('transaccionesController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.transaccionDatos = {
        numeroTarjeta: '',
        cantidad: 0,
        tipo: ''
    };

    $scope.realizarTransaccion = function() {
        let url = '';
        let postData = {};
        if ($scope.transaccionDatos.tipo === 'depositar') {
            url = 'https://webapplication220241116151704.azurewebsites.net/api/Cliente/Depositar';
            postData = {
                NumeroTarjeta: $scope.transaccionDatos.numeroTarjeta,
                Cantidad: $scope.transaccionDatos.cantidad
            };
        } else if ($scope.transaccionDatos.tipo === 'transferir') {
            url = 'https://webapplication220241116151704.azurewebsites.net/api/Cliente/transferir';
            postData = {
                TarjetaOrigen: localStorage.getItem('numeroTarjeta'),
                TarjetaDestino: $scope.transaccionDatos.numeroTarjeta,
                Monto: $scope.transaccionDatos.cantidad
            };
        }

        if (url) {
            $http.post(url, postData).then(function(response) {
                let message = $scope.transaccionDatos.tipo === 'depositar' ? 
                    'Depósito realizado exitosamente. Saldo Actual: ' + response.data.saldoActual :
                    'Transferencia realizada exitosamente. Datos de origen: ' + response.data.NombreOrigen;

                alert(`${message}\nMonto: ${$scope.transaccionDatos.cantidad}\nNúmero de Cuenta: ${$scope.transaccionDatos.numeroTarjeta}\nFecha: ${new Date().toISOString()}\nTipo: ${$scope.transaccionDatos.tipo}`);
                
                // Guardar los datos si es necesario
                if ($scope.transaccionDatos.tipo === 'depositar') {
                    localStorage.setItem('datosCliente', JSON.stringify(response.data));
                } else if ($scope.transaccionDatos.tipo === 'transferir') {
                    localStorage.setItem('datosTransferencia', JSON.stringify(response.data));
                }

                // Registrar transacción y enviar correo
                registrarTransaccion($scope.transaccionDatos.numeroTarjeta, $scope.transaccionDatos.tipo, $scope.transaccionDatos.cantidad);
                enviarCorreo($scope.transaccionDatos.tipo, $scope.transaccionDatos.cantidad);

            }, function(error) {
                alert('Error en la transacción: ' + (error.data || 'Ha ocurrido un problema en el servidor.'));
            });
        }
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'), // Usar correoID del localStorage
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: $scope.usuarioCorreo,
            subject: `Confirmación de ${tipo}`,
            message: `Hola, has realizado un ${tipo} de $${monto} en tu cuenta.`,
            monto: monto, // Asegúrate de que el monto es un número y no una cadena si tu backend lo espera así
            numeroCuenta: $scope.transaccionDatos.numeroTarjeta
        };
    
        console.log("Enviando correo con la siguiente información:", correoInfo);
    
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito', response);
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);



angular.module('starBankApp')
.controller('retiroController', ['$scope', '$http', function($scope, $http) {
    // Recuperar el correo y el ID de correo almacenados en localStorage
    var usuarioCorreo = localStorage.getItem('usuarioCorreo');
    var correoID = localStorage.getItem('correoID');

    $scope.retiroDatos = {
        numeroTarjeta: localStorage.getItem('numeroTarjeta'), // Recuperando el número de tarjeta almacenado
        cantidad: 0
    };

    $scope.establecerCantidad = function(monto) {
        $scope.retiroDatos.cantidad = monto;
    };

    $scope.realizarRetiro = function() {
        if ($scope.retiroDatos.cantidad < 50 || $scope.retiroDatos.cantidad > 9000 || $scope.retiroDatos.cantidad % 50 !== 0) {
            alert("La cantidad de retiro debe ser un múltiplo de 50 y estar en el rango de 50 a 9000.");
            return;
        }
        
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Retirar', $scope.retiroDatos)
            .then(function(response) {
                var fechaRetiro = new Date().toLocaleString();
                alert("Retiro exitoso:\n\nMonto: " + $scope.retiroDatos.cantidad + "\nNúmero de cuenta: " + $scope.retiroDatos.numeroTarjeta + "\nFecha: " + fechaRetiro);
                // Llamar a la función para registrar la transacción
                registrarTransaccion($scope.retiroDatos.numeroTarjeta, "Retiro", $scope.retiroDatos.cantidad);
                // Llamar a la función para enviar correo
                enviarCorreo(localStorage.getItem('correoID'), "Retiro Realizado", "Se ha realizado un retiro por un monto de " + $scope.retiroDatos.cantidad, $scope.retiroDatos.cantidad, $scope.retiroDatos.numeroTarjeta);
            }, function(error) {
                alert("Error en el retiro: " + error.data.mensaje);
            });
    };
    // Función para registrar la transacción
    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: correoID, // Usar el ID de correo almacenado
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    // Función para enviar correo
    function enviarCorreo(usuarioCorreo , subject, message, monto, numeroCuenta) {
        var correoDto = {
            ToEmail: usuarioCorreo ,
            Subject: subject,
            Message: message,
            Monto: monto,
            NumeroCuenta: numeroCuenta
        };

        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoDto)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);














//HIPOTECA 
angular.module('starBankApp').controller('hipotecaController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.datosHipoteca = {
        numeroCuenta: ''
    };

    $scope.obtenerDatosHipoteca = function() {
        $http.get('https://webapplication220241116151704.azurewebsites.net/api/Cliente/ObtenerDeudaHipoteca?NumeroCuenta=' + $scope.datosHipoteca.numeroCuenta)
        .then(function(response) {
            sessionStorage.setItem('datosHipoteca', JSON.stringify(response.data));
            sessionStorage.setItem('numeroCuentaHipoteca', $scope.datosHipoteca.numeroCuenta);
            $window.location.href = 'hipotecadatos.html';
        }, function(error) {
            alert('Error: ' + error.data.mensaje);
        });
    };
}]);


angular.module('starBankApp').controller('pagoHipotecaController', ['$scope', function($scope) {
    // Recuperamos los datos almacenados cuando cargamos la vista de pago
    let datosRecuperados = JSON.parse(sessionStorage.getItem('datosHipoteca'));
    $scope.datosHipoteca = {
        nombreCliente: datosRecuperados ? datosRecuperados.nombreCliente : '',
        deuda: datosRecuperados ? datosRecuperados.deuda : '',
        mensualidad: datosRecuperados ? datosRecuperados.mensualidad : ''
    };

    
}]);





angular.module('starBankApp').controller('pagoHipotecaController', ['$scope', '$http', function($scope, $http) {
    let datosRecuperados = JSON.parse(sessionStorage.getItem('datosHipoteca'));
    $scope.datosHipoteca = datosRecuperados || {};
    $scope.numeroCuentaHipoteca = sessionStorage.getItem('numeroCuentaHipoteca');
    $scope.usuarioCorreo = localStorage.getItem('usuarioCorreo'); // Recuperar el correo guardado

    $scope.realizarPago = function(tipo) {
        let url = tipo === 'capital' ?
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarParaDeudaHipoteca' :
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarMensualidadDeudaHipoteca';

        let montoPago = tipo === 'mensualidad' ? $scope.datosHipoteca.mensualidad : $scope.datosPago.cantidad;
        let pago = {
            NumeroCuenta: $scope.numeroCuentaHipoteca,
            CantidadDeposito: montoPago
        };

        $http.post(url, pago)
            .then(function(response) {
                alert(response.data.mensaje);
                if(tipo === 'capital') {
                    $scope.datosHipoteca.deuda -= $scope.datosPago.cantidad; // Actualizar la deuda
                }
                registrarTransaccion($scope.numeroCuentaHipoteca, 'Pago Hipoteca', montoPago);
                enviarCorreo(tipo, montoPago); // Envía el correo después del registro de la transacción
            }, function(error) {
                alert('Error: ' + error.data.mensaje);
            });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'), // Usar correoID del localStorage
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: $scope.usuarioCorreo, // El correo del usuario, debe coincidir con la definición del DTO
            subject: "Confirmación de Pago de Hipoteca (ticket)",
            message: `Hola, has realizado un pago de ${tipo === 'capital' ? 'capital' : 'mensualidad'} de ${monto} en tu cuenta de hipoteca.`,
            monto: monto, // Asegúrate de que el monto sea un número y no una cadena si tu backend lo espera así
            numeroCuenta: $scope.numeroCuentaHipoteca // El número de cuenta de hipoteca
        };
    
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);




//automovil

angular.module('starBankApp').controller('obtenerDatosAutoController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.datosAuto = {
        numeroCuenta: ''
    };

    $scope.obtenerDatosDeudaAuto = function() {
        if ($scope.datosAuto.numeroCuenta) {
            $http.get('https://webapplication220241116151704.azurewebsites.net/api/Cliente/ObtenerMensualidadDeudaAutomovil?NumeroCuenta=' + $scope.datosAuto.numeroCuenta)
            .then(function(response) {
                sessionStorage.setItem('datosDeudaAuto', JSON.stringify(response.data));
                sessionStorage.setItem('numeroCuentaAuto', $scope.datosAuto.numeroCuenta);
                $window.location.href = 'automovildatos.html'; // Confirma que la ruta es correcta
            }, function(error) {
                alert('Error: ' + error.data.mensaje);
            });
        } else {
            alert('Por favor ingresa un número de cuenta.');
        }
    };
}]);


angular.module('starBankApp').controller('pagoDeudaAutoController', ['$scope', '$http', function($scope, $http) {
    let datosRecuperados = JSON.parse(sessionStorage.getItem('datosDeudaAuto'));
    $scope.datosAuto = datosRecuperados ? {
        nombreCliente: datosRecuperados.nombreCliente + " " + datosRecuperados.apellidoCliente,
        deudaActual: datosRecuperados.deudaActual,
        mensualidadDeuda: datosRecuperados.mensualidadDeuda
    } : {};
    $scope.numeroCuentaAuto = sessionStorage.getItem('numeroCuentaAuto');
    $scope.usuarioCorreo = localStorage.getItem('usuarioCorreo'); // Suponiendo que el correo del usuario está guardado
    $scope.cantidadPago = '';

    $scope.realizarPago = function(tipo) {
        let url = tipo === 'capital' ?
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarParaDeudaAutomovil' :
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarMensualidadDeudaAutomovil';
        
        let pago = {
            NumeroCuentaM: $scope.numeroCuentaAuto,
            CantidadDepositoM: tipo === 'mensualidad' ? parseFloat($scope.datosAuto.mensualidadDeuda) : parseFloat($scope.cantidadPago)
        };

        $http.post(url, pago)
            .then(function(response) {
                alert(response.data.mensaje);
                if (tipo === 'capital') {
                    $scope.datosAuto.deudaActual -= pago.CantidadDepositoM; // Actualizar la deuda
                }
                registrarTransaccion($scope.numeroCuentaAuto, 'Pago de Deuda Automovil', pago.CantidadDepositoM);
                enviarCorreo(tipo, pago.CantidadDepositoM);
            }, function(error) {
                alert('Error: ' + error.data.mensaje);
            });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'),
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: $scope.usuarioCorreo,
            subject: `Confirmación de Pago de Deuda de Automóvil (ticket)`,
            message: `Hola, has realizado un pago de ${tipo === 'capital' ? 'capital' : 'mensualidad'} de $${monto} en tu cuenta de automóvil.`,
            monto: monto,
            numeroCuenta: $scope.numeroCuentaAuto
        };
    
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);



// estudiante 
 
angular.module('starBankApp').controller('estudianteController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.datosEstudiante = {
        numeroCuenta: ''
    };

    $scope.obtenerDatosEstudiante = function() {
        $http.get('https://webapplication220241116151704.azurewebsites.net/api/Cliente/DatosCE?numeroCuenta=' + $scope.datosEstudiante.numeroCuenta)
        .then(function(response) {
            sessionStorage.setItem('datosEstudiante', JSON.stringify(response.data));
            sessionStorage.setItem('numeroCuentaEstudiante', $scope.datosEstudiante.numeroCuenta);
            $window.location.href = 'estudiantedatos.html';
        }, function(error) {
            alert('Error: ' + error.data.mensaje);
        });
    };
}]);


angular.module('starBankApp').controller('pagoEstudianteController', ['$scope', function($scope) {
    // Recuperamos los datos almacenados cuando cargamos la vista de pago
    let datosRecuperados = JSON.parse(sessionStorage.getItem('datosEstudiante'));
    $scope.datosEstudiante = datosRecuperados ? {
        nombreCliente: datosRecuperados.NombreCliente || "Desconocido",
        totalDeuda: datosRecuperados.TotalDeuda || 0,
        tipo: datosRecuperados.Tipo || "No especificado",
        mensualidad: datosRecuperados.Mensualidad || 0
    } : {};
}]);

 
angular.module('starBankApp').controller('pagoEstudianteController', ['$scope', '$http', function($scope, $http) {
    let datosRecuperados = JSON.parse(sessionStorage.getItem('datosEstudiante'));
    $scope.datosEstudiante = datosRecuperados || {};
    $scope.numeroCuentaEstudiante = sessionStorage.getItem('numeroCuentaEstudiante');
    $scope.usuarioCorreo = localStorage.getItem('usuarioCorreo'); // Asegúrate de tener el correo del usuario almacenado en localStorage

    $scope.realizarPago = function(tipo) {
        let url = tipo === 'capital' ?
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarParaDeudaHipoteca' : // Asegúrate de que este es el endpoint correcto para capital
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarMensualidadDeudaCreditoEducativo';
        
        let montoPago = tipo === 'mensualidad' ? $scope.datosEstudiante.mensualidad : $scope.datosPago.cantidad;
        let pago = {
            NumeroCuenta: $scope.numeroCuentaEstudiante,
            CantidadDeposito: montoPago
        };

        $http.post(url, pago)
            .then(function(response) {
                alert(`Pago realizado exitosamente. Se envió un ticket a tu correo con los detalles de la transacción.\nNúmero de Cuenta: ${$scope.numeroCuentaEstudiante}\nMonto del Pago: ${montoPago}\nFecha: ${new Date().toISOString()}`);
                if(tipo === 'capital') {
                    $scope.datosEstudiante.deuda -= montoPago; // Actualizar la deuda
                }
                registrarTransaccion($scope.numeroCuentaEstudiante, 'Pago de Crédito Educativo', montoPago);
                enviarCorreo(tipo, montoPago);
            }, function(error) {
                alert('Error: ' + error.data.mensaje);
            });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'), // Usar correoID del localStorage
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: $scope.usuarioCorreo, // El correo del usuario
            subject: "Confirmación de Pago de Crédito Estudiantil",
            message: `Hola, has realizado un pago de ${tipo === 'capital' ? 'capital' : 'mensualidad'} de $${monto} en tu cuenta estudiantil.`,
            monto: monto,
            numeroCuenta: $scope.numeroCuentaEstudiante
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);



 // Credito 


 app.controller('CreditController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.cardData = {
        numeroTarjeta: '',
        nip: ''
    };

    $scope.submitCardData = function() {
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/IniciarSesionCredito', $scope.cardData)
            .then(function(response) {
                alert('Sesión iniciada con éxito.');
                // Almacenar el número de tarjeta y la deuda en localStorage
                localStorage.setItem('numeroTarjeta', $scope.cardData.numeroTarjeta);
                localStorage.setItem('infoDeuda', JSON.stringify({ deuda: response.data.deuda, nombreCliente: response.data.nombreCliente }));
                $window.location.href = 'creditoopciones.html';  // Redirigir a la página de opciones de crédito
            }, function(error) {
                alert('Error: ' + (error.data || 'Ocurrió un problema al intentar iniciar sesión.'));
            });
    };
}]);


app.controller('DebtController', ['$scope', function($scope) {
    // Al cargar la página, recuperamos la información detallada de la deuda guardada
    var infoDeuda = JSON.parse(localStorage.getItem('infoDeuda')) || {};
    $scope.nombreCliente = infoDeuda.nombreCliente || 'Nombre no disponible';
    $scope.deudaTotal = infoDeuda.deuda || 'Deuda no disponible';  // Asegúrate de que esta línea está correcta
}]);






//depositar la deuda 
app.controller('DepositController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.amount = '';

    $scope.deposit = function() {
        var depositData = {
            TarjetaCredito: localStorage.getItem('numeroTarjeta'),
            CantidadCredito: parseFloat($scope.amount)  // Asegúrate de que estás enviando un número
        };

        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarParaDeuda', depositData)
            .then(function(response) {
                // Alerta con los detalles del depósito
                alert('Depósito realizado exitosamente.\nDeuda Actual: ' + response.data.deudaActual + '\nNúmero de cuenta: ' + depositData.TarjetaCredito + '\nFecha: ' + new Date().toLocaleString());

                // Registrar la transacción
                registrarTransaccion(depositData.TarjetaCredito, 'Depósito', depositData.CantidadCredito);

                // Enviar correo de confirmación
                enviarCorreo('depósito', depositData.CantidadCredito);
            }, function(error) {
                alert('Error en el depósito: ' + (error.data.mensaje || 'Ocurrió un problema al intentar hacer el depósito, Validar que la cantidad sea un múltiplo de 50 y esté en el rango de 50 a 9000 y sea multiplo de 50'));
            });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'), // Usar correoID del localStorage
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: localStorage.getItem('usuarioCorreo'), // El correo del usuario
            subject: "Confirmación de Depósito",
            message: `Hola, has realizado un depósito de $${monto} en tu cuenta.`,
            monto: monto,
            numeroCuenta: localStorage.getItem('numeroTarjeta')
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
    
    // Asegúrate de que registrarTransaccion y enviarCorreo estén disponibles en el alcance del controlador
    $scope.registrarTransaccion = registrarTransaccion;
    $scope.enviarCorreo = enviarCorreo;
}]);




app.controller('TotalPaymentController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.amount = '';

    $scope.deposit = function() {
        var depositData = {
            TarjetaCredito: localStorage.getItem('numeroTarjeta'),  // Recuperar el número de tarjeta actualizado
            MontoPago: parseFloat($scope.amount)  // Asegúrate de convertir a float
        };

        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/PagarDeuda', depositData)
            .then(function(response) {
                // Obtener la fecha y hora actual
                var currentDate = new Date();
                var formattedDate = currentDate.toLocaleString();

                // Alerta de depósito exitoso con detalles
                alert('Depósito realizado exitosamente.\n' +
                      'Monto: ' + response.data.deudaActual + '\n' +
                      'Número de cuenta: ' + depositData.TarjetaCredito + '\n' +
                      'Fecha: ' + formattedDate);

                // Llamar a la función para registrar la transacción
                registrarTransaccion(depositData.TarjetaCredito, 'Pago Total', depositData.MontoPago);

                // Llamar a la función para enviar el correo de confirmación
                enviarCorreo('pago total', depositData.MontoPago);
            }, function(error) {
                // Manejo de errores
                alert('Error en el depósito: ' + (error.data.mensaje || 'Ocurrió un problema al intentar hacer el depósito.'));
            });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'), // Usar correoID del localStorage
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: localStorage.getItem('usuarioCorreo'), // El correo del usuario
            subject: "Confirmación de Pago Total",
            message: `Hola, has realizado un pago total de $${monto} en tu cuenta.`,
            monto: monto,
            numeroCuenta: localStorage.getItem('numeroTarjeta')
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);



// Servicios con cuenta 

app.controller('seriviciosController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.datosServicios = {
        numeroCuenta: ''
    };

    $scope.obtenerDatosServicios = function() {
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Login', $scope.datosServicios)
            .then(function(response) {
                alert('Sesión iniciada con éxito.');
                // Guardar el número de cuenta y la mensualidad obtenida
                localStorage.setItem('numeroCuenta', $scope.datosServicios.numeroCuenta);
                localStorage.setItem('datosServicios', JSON.stringify(response.data)); // Suponiendo que la mensualidad está en la respuesta
                $window.location.href = 'serviciospaga2.html';
            }).catch(function(error) {
                var mensaje = error.data && error.data.mensaje ? error.data.mensaje : 'Número de cuenta no válido';
                alert('Error: ' + mensaje);
            });
    };
}]);




angular.module('starBankApp').controller('pagoServiciosController', ['$scope', function($scope) {
    // Recuperamos los datos almacenados cuando cargamos la vista de pago
    let datosRecuperados = JSON.parse(localStorage.getItem('datosServicios')); // Asegúrate de que este ítem se guarda correctamente en el login
    $scope.datosServicios = {
        mensualidad: datosRecuperados ? datosRecuperados.mensualidad : ''
    };
}]);

angular.module('starBankApp').controller('pagoServiciosController', ['$scope', function($scope) {
    // Recuperamos los datos almacenados cuando cargamos la vista de pago
    let datosRecuperados = JSON.parse(localStorage.getItem('datosServicios'));
    $scope.datosServicios = datosRecuperados ? datosRecuperados.mensualidad : '';
}]);


angular.module('starBankApp').controller('pagoServicioController', ['$scope', '$http', function($scope, $http) {
    let datosRecuperados = JSON.parse(localStorage.getItem('datosServicios'));
    $scope.datosServicios = datosRecuperados || {};
    $scope.numeroCuenta = localStorage.getItem('numeroCuenta');
    $scope.usuarioCorreo = localStorage.getItem('usuarioCorreo'); // Asegúrate de que el correo del usuario está almacenado
    $scope.datosPago = { cantidad: '' };

    $scope.realizarPago = function(tipo) {
        let url = tipo === 'mensualidad' ?
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/PagarMensualidad' :
            'https://webapplication220241116151704.azurewebsites.net/api/Cliente/DepositarParaDeudaHipoteca';

        let pago = {
            NumeroCuenta: $scope.numeroCuenta,
            CantidadDeposito: tipo === 'mensualidad' ? $scope.datosServicios.mensualidad : parseFloat($scope.datosPago.cantidad)
        };

        $http.post(url, pago).then(function(response) {
            alert(`Pago realizado exitosamente. Ticket enviado a tu correo con los detalles de la transacción.\nNúmero de Cuenta: ${$scope.numeroCuenta}\nMonto del Pago: ${pago.CantidadDeposito}\nFecha: ${new Date().toISOString()}`);
            registrarTransaccion($scope.numeroCuenta, 'Pago de Servicios', pago.CantidadDeposito);
            enviarCorreo('pago de servicios', pago.CantidadDeposito);
        }, function(error) {
            let errorMessage = (error.data && error.data.message) ? error.data.message : 'Error desconocido al realizar el pago.';
            alert('Error: ' + errorMessage);
        });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'),
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: $scope.usuarioCorreo,
            subject: "Confirmación de Pago de Servicios",
            message: `Hola, has realizado un pago de ${tipo} de $${monto} en tu cuenta de servicios.`,
            monto: monto,
            numeroCuenta: $scope.numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);










//Servicios sin cuenta 

angular.module('starBankApp').controller('numCuentaController', ['$scope', '$window', function($scope, $window) {
    $scope.numeroCuenta = '';

    $scope.validarYGuardar = function() {
        if ($scope.numeroCuenta.length >= 8 && $scope.numeroCuenta.length <= 27) {
            // Generar cantidad aleatoria entre 200 y 1000
            var cantidadAleatoria = Math.floor(Math.random() * (1001 - 200) + 200);

            // Almacenar en localStorage
            localStorage.setItem('numeroCuenta', $scope.numeroCuenta);
            localStorage.setItem('cantidadAleatoria', cantidadAleatoria);

            // Redirigir a la página nueva con la cantidad aleatoria
            $window.location.href = 'serviciospaga2nocuenta.html';
        } else {
            alert('El número de cuenta debe tener entre 8 y 27 dígitos.');
        }
    };
}]);


angular.module('starBankApp').controller('paymentController', ['$scope', function($scope) {
    // Recuperar la cantidad aleatoria almacenada para comparación
    $scope.cantidadAleatoria = parseInt(localStorage.getItem('cantidadAleatoria'), 10);
    $scope.cantidadIngresada = 0;

    $scope.realizarPago = function() {
        if ($scope.cantidadIngresada === $scope.cantidadAleatoria) {
            alert('Pago exitoso');
            // Opcional: Limpiar el valor o redirigir a otra página
        } else {
            alert('El monto ingresado no coincide con la cantidad requerida. Por favor, intente de nuevo.');
        }
    };
}]);




//EDITAR NIP

angular.module('starBankApp').controller('cambiarNIPController', ['$scope', '$http', function($scope, $http) {
    $scope.datosNIP = {
        numeroTarjeta: '',
        NIPAnterior: '',
        NIPNuevo: ''
    };

    $scope.cambiarNIP = function() {
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/EditarNIP', $scope.datosNIP)
            .then(function(response) {
                alert(`NIP cambiado exitosamente. Se ha enviado un ticket a su correo con los detalles de la operación.\nNúmero de Tarjeta: ${$scope.datosNIP.numeroTarjeta}`);
                $scope.datosNIP = {
                    numeroTarjeta: '',
                    NIPAnterior: '',
                    NIPNuevo: ''
                };
                // Registrar transacción y enviar correo después de un cambio exitoso
                registrarTransaccion($scope.datosNIP.numeroTarjeta, 'Cambio de NIP Débito', 0);
                enviarCorreo('Cambio de NIP Débito', 0);
            }).catch(function(error) {
                alert('Error al cambiar NIP: ' + (error.data || 'Hubo un problema en el servidor.'));
            });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'),
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: $scope.usuarioCorreo,
            subject: "Confirmación de Cambio de NIP",
            message: `Hola, has realizado un cambio de NIP en tu tarjeta de débito. Si no reconoces esta operación, por favor contacta a nuestro servicio al cliente de inmediato.`,
            monto: monto, // Asegúrate de que el monto es 0 como solicitado
            numeroCuenta: $scope.datosNIP.numeroTarjeta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);


//Editar NIP Credito 
angular.module('starBankApp').controller('cambiarNIPControllerC', ['$scope', '$http', function($scope, $http) {
    $scope.datosNIP = {
        numeroTarjeta: '',
        NIPAnterior: '',
        NIPNuevo: ''
    };

    $scope.cambiarNIP = function() {
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/EditarNIPCredito', $scope.datosNIP)
            .then(function(response) {
                alert(`NIP cambiado exitosamente. Se ha enviado un ticket a su correo con los detalles de la operación.\nNúmero de Tarjeta: ${$scope.datosNIP.numeroTarjeta}`);
                $scope.datosNIP = {  // Limpia los campos después del cambio exitoso
                    numeroTarjeta: '',
                    NIPAnterior: '',
                    NIPNuevo: ''
                };
                // Registrar la transacción y enviar correo después de un cambio exitoso
                registrarTransaccion($scope.datosNIP.numeroTarjeta, 'Cambio de NIP de Crédito', 0);
                enviarCorreo('Cambio de NIP de Crédito', 1);
            }).catch(function(error) {
                alert('Error al cambiar NIP: ' + (error.data || 'Hubo un problema en el servidor.'));
            });
    };

    function registrarTransaccion(numeroCuenta, tipoTransaccion, monto) {
        var transaccion = {
            correoID: localStorage.getItem('correoID'),
            tipoTransaccion: tipoTransaccion,
            monto: monto,
            fecha: new Date().toISOString(),
            numeroCuenta: numeroCuenta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Cliente/Transacciones', transaccion)
            .then(function(response) {
                console.log('Transacción registrada con éxito');
            }).catch(function(error) {
                console.error('Error al registrar la transacción', error);
            });
    }

    function enviarCorreo(tipo, monto) {
        var correoInfo = {
            toEmail: $scope.usuarioCorreo,
            subject: "Confirmación de Cambio de NIP",
            message: `Hola, has realizado un cambio de NIP en tu tarjeta de crédito. Si no reconoces esta operación, por favor contacta a nuestro servicio al cliente de inmediato.`,
            monto: monto,
            numeroCuenta: $scope.datosNIP.numeroTarjeta
        };
        $http.post('https://webapplication220241116151704.azurewebsites.net/api/Notification/Notis', correoInfo)
            .then(function(response) {
                console.log('Correo enviado con éxito');
            }).catch(function(error) {
                console.error('Error al enviar el correo', error);
            });
    }
}]);



// movimientossssss ya quiero dormir hora:2 am 
app.controller('MovementsController', function($scope, $http, $window) {
    $scope.movements = []; // Lista de movimientos
    $scope.sortType = ''; // Tipo de orden (date o amount)
    $scope.sortReverse = false; // Orden ascendente o descendente

    // Función para cargar los movimientos de cuenta
    $scope.loadMovements = function() {
        var correoID = localStorage.getItem('correoID');

        // Realiza una solicitud GET a la API para obtener los movimientos
        $http.get('https://webapplication220241116151704.azurewebsites.net/api/Cliente/PorCorreo/' + correoID)
            .then(function(response) {
                // Asigna los movimientos obtenidos a la variable movements
                $scope.movements = response.data;
            })
            .catch(function(error) {
                // Manejo de errores
                console.error('Error al cargar movimientos:', error);
            });
    };

    // Función para ordenar los movimientos por el tipo especificado
    $scope.sortBy = function(type) {
        if ($scope.sortType === type) {
            // Si ya está ordenado por este tipo, cambia el orden
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            // Si es un nuevo tipo, ordénalo ascendente por defecto
            $scope.sortType = type;
            $scope.sortReverse = false;
        }
    };

    // Cargar los movimientos al cargar la página
    $scope.loadMovements();
});





