const { conexion } = require("./basedatos/conexion");
const express = require("express");
const cors = require("cors");

//Inicializar app
console.log("App de node arrancada");

//Conectar a la base de datos
conexion();

//Crear servidor de node
const app = express();
const puerto = 3900;

//Configurar cors
app.use(cors());

//Convertir body a objeto JS
app.use(express.json()); //recibir datos con content-type app/json
app.use(express.urlencoded({extended:true})); //form-url-encoded

//Rutas
const rutas_articulos = require("./rutas/articulo");
//Cargo las rutas
app.use("/api", rutas_articulos);


//Crear servidor y escuchar peticiones http
app.listen(puerto, () =>{
    console.log("Servidor corriendo en el puerto "+puerto);
})