const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors')
const moment = require('moment-timezone');

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'admin',
	password : '',
	database : 'database'
});

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
//
app.use(cors());
app.use(cors({
	origin: 'http://localhost:3002' // Sólo permitir solicitudes de este origen
}));

// http://localhost:3000/users
app.get('/users', function(request, response) {
	// Execute SQL query that'll select all users from the database
	connection.query('SELECT * FROM accounts', function(error, results, fields) {
		// If there is an issue with the query, output the error
		if (error) throw error;
		// Send the list of users as the response
		response.send(results);
		response.end();
	});
});

app.get('/vehiculos', function(request, response) {
    connection.query('SELECT * FROM vehiculos', function(error, results, fields) {
        if (error) throw error;
        response.send(results);
    });
});

app.get('/getAllNumParqueadero', function(request, response) {
    connection.query('SELECT numParqueadero, disponibilidad FROM parqueaderos', function(error, results, fields) {
        if (error) throw error;
        response.send(results);
    });
});

app.post('/auth', function(request, response) {
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.userId = results[0].id;
                request.session.username = username;
                response.redirect('/home');
            } else {
                // Enviar el mensaje 'Usuario y/o Contraseña Incorrecta' si el nombre de usuario o la contraseña son incorrectos
                response.send('Usuario y/o Contraseña Incorrecta');
            }			
            response.end();
        });
    } else {
        response.send('Por favor ingresa Usuario y Contraseña!');
        response.end();
    }
});

// http://localhost:3000/role
app.get('/role', function(request, response) {
    // Get the username from the query parameters
    let username = request.query.username;
    // Execute SQL query to get the user's role
    connection.query('SELECT role FROM accounts WHERE username = ?', [username], function(error, results, fields) {
        if (error) throw error;
        // If the query returned a result
        if (results.length > 0) {
            // Send the user's role as the response
            console.log(results[0]);
            response.send(results[0].role);
            response.end();
        } else {
            // If the user's role was not found, send an error message
            response.send('User role not found');
            response.end();
        }
    });
});

// http://localhost:3000/register
app.post('/register', function(request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    let email = request.body.email;
    let role = request.body.role;
    // Ensure the input fields exists and are not empty
    if (username && password && email && role) {
        // Execute SQL query that'll insert the new account into the database
        connection.query('INSERT INTO accounts (username, password, email, role) VALUES (?, ?, ?, ?)', [username, password, email, role], function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the account was successfully created
            if (results.affectedRows > 0) {
                response.send('Cuenta creada exitosamente!');
            } else {
                response.send('Hubo un problema al crear la cuenta.');
            }			
            response.end();
        });
    } else {
        response.send('Por favor ingresa Usuario, Contraseña y Email!');
        response.end();
    }
});

// http://localhost:3000/home
app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Te has logueado satisfactoriamente:, ' + request.session.username + '!');
	} else {
		// Not logged in
		response.send('¡Inicia sesión para ver esta página!');
	}
	response.end();
});

// http://localhost:3000/logout
app.get('/logout', function(request, response) {
    if (request.session) {
        // destruir la sesión
        request.session.destroy(function(err) {
            if (err) {
                // no se pudo destruir la sesión
                return response.send('Hubo un error al cerrar la sesión');
            } else {
                // la sesión se destruyó correctamente
                return response.redirect('/home');
            }
        });
    }
});
// http://localhost:3000/check-session
app.get('/check', function(request, response) {
	if (request.session.loggedin) {
		response.send('La sesión está activa');
	} else {
		response.send('La sesión no está activa');
	}
	response.end();
});

// http://localhost:3000/username
app.get('/username', function(request, response) {
	// If the user is logged in
	if (request.session.loggedin) {
		// Return the username
		response.send(request.session.username);
	} else {
		// Not logged in
		response.send('No session found');
	}
	response.end();
});
app.post('/regVehiculo', function(request, response) {
    // Get the vehicle details from the request body
    let cedulaPropietario = request.body.cedulaPropietario;
    let placa = request.body.placa;
    let tipoVehiculo = request.body.tipoVehiculo;
    // Get the user's id from the request body
    let vigilante_id = request.body.vigilante_id;
    // Check that all required details are present
    if (cedulaPropietario && placa && tipoVehiculo && vigilante_id) {
        // Insert the new vehicle into the database
        connection.query('INSERT INTO vehiculos (cedulaPropietario, placa, tipoVehiculo, vigilante_id) VALUES (?, ?, ?, ?)', [cedulaPropietario, placa, tipoVehiculo, vigilante_id], function(error, results, fields) {
            if (error) throw error;
            // Check if the vehicle was registered successfully
            if (results.affectedRows > 0) {
                response.send('Vehiculo registrado exitosamente!');
            } else {
                response.send('Hubo un problema al registrar el vehiculo.');
            }			
            response.end();
        });
    } else {
        // If any details are missing, send an error message
        response.send('Por favor ingresa la placa, el tipo de vehiculo, la cedula y el id del vigilante!');
        response.end();
    }
});


app.post('/Salida', function(request, response) {
    // Get the vehicle's id from the request body
    let id = request.body.id;

    if (id) {
        // Get the current date and time in the 'America/Bogota' timezone
        let  = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');

        // Update the '' column for the specified vehicle
        connection.query('UPDATE vehiculos SET  = ? WHERE id = ?', [, id], function(error, results, fields) {
            if (error) throw error;
            // Check if the update was successful
            if (results.affectedRows > 0) {
                response.send(' actualizada exitosamente!');
            } else {
                response.send('Hubo un problema al actualizar la .');
            }			
            response.end();
        });
    } else {
        // If the vehicle's id is missing, send an error message
        response.send('Por favor ingresa el id del vehiculo!');
        response.end();
    }
});
app.post('/updateSalida', function(request, response) {
    // Get the vehicle's plate from the request body
    let placa = request.body.placa;

    if (placa) {
        // Get the current date and time in the 'America/Bogota' timezone
        let salida = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');

        // Update the 'salida' column for the specified vehicle
        connection.query('UPDATE vehiculos SET salida = ? WHERE placa = ?', [salida, placa], function(error, results, fields) {
            if (error) throw error;
            // Check if the update was successful
            if (results.affectedRows > 0) {
                response.send('Salida actualizada exitosamente!');
            } else {
                response.send('Hubo un problema al actualizar la salida.');
            }			
            response.end();
        });
    } else {
        // If the vehicle's plate is missing, send an error message
        response.send('Por favor ingresa la placa del vehiculo!');
        response.end();
    }
});

app.post('/updateEntrada', function(request, response) {
    // Get the vehicle's plate from the request body
    let placa = request.body.placa;

    if (placa) {
        // Get the current date and time in the 'America/Bogota' timezone
        let entrada = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');

        // Update the 'entrada' column for the specified vehicle
        connection.query('UPDATE vehiculos SET entrada = ? WHERE placa = ?', [entrada, placa], function(error, results, fields) {
            if (error) throw error;
            // Check if the update was successful
            if (results.affectedRows > 0) {
                response.send('Entrada actualizada exitosamente!');
            } else {
                response.send('Hubo un problema al actualizar la entrada.');
            }			
            response.end();
        });
    } else {
        // If the vehicle's plate is missing, send an error message
        response.send('Por favor ingresa la placa del vehiculo!');
        response.end();
    }
});
// Endpoint para marcar un parqueadero como ocupado
app.post('/markAsOccupied', function(request, response) {
    const numParqueadero = request.body.numParqueadero;
    connection.query('UPDATE parqueaderos SET disponibilidad = true WHERE numParqueadero = ?', [numParqueadero], function(error, results, fields) {
        if (error) throw error;
        response.send({status: 'Parqueadero marcado como ocupado'});
    });
});

// Endpoint para marcar un parqueadero como disponible
app.post('/markAsAvailable', function(request, response) {
    const numParqueadero = request.body.numParqueadero;
    connection.query('UPDATE parqueaderos SET disponibilidad = false WHERE numParqueadero = ?', [numParqueadero], function(error, results, fields) {
        if (error) throw error;
        response.send({status: 'Parqueadero marcado como disponible'});
    });
});

app.listen(3000);