angular.module('creditApp', [])
.controller('CreditController', ['$http', '$window', function($http, $window) {
    var self = this;
    self.usuario = {
        numeroTarjeta: '',
        nip: ''
    };
    self.deuda = '';

    self.consultarDeuda = function() {
        $http.post('http://localhost:5120/api/Cliente/consultar-deuda', self.usuario)
        .then(function(response) {
            self.deuda = response.data; // Asume que el servidor devuelve solo el monto de la deuda como un número.
            // Guarda la deuda en localStorage para su uso en otra página
            localStorage.setItem('deuda', self.deuda);
            // Redirige al usuario a la página de opciones de crédito
            $window.location.href = 'creditoopciones.html';
        }, function(errorResponse) {
            alert('Error: ' + errorResponse.data);
        });
    };
}]);