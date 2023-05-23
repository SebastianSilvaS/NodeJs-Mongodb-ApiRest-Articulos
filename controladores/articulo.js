const Articulo = require("../modelos/Articulo");
const { param } = require("../rutas/articulo");
const { validarArticulo } = require("../helpers/validar");
const fs = require("fs");
const path = require("path");

const crear = (req, res) => {
  //Recoger parametros por post a guardar
  let parametros = req.body;
  //Validar datos
  try {
    validarArticulo(parametros);
  } catch (error) {
    return res.status(400).json({
      status: "error",
      mensaje: "Faltan datos por enviar",
    });
  }
  //Crear el objeto a guardar
  const articulo = new Articulo(parametros);
  //Asignar valores a objeto basado en el modelo (manual o automatico)
  //articulo.titulo = parametros.titulo; (Manual)

  //Guardar el articulo en la base de datos
  articulo
    .save()
    .then((articuloGuardado) => {
      return res.status(200).json({
        status: "success",
        articulo: articuloGuardado,
        mensaje: "Articulo creado con exito",
      });
    })
    .catch((error) => {
      return res.status(400).json({
        status: "error",
        mensaje: "No se ha guardado el articulo: " + error.message,
      });
    });
};

const listar = (req, res) => {
  let consulta = Articulo.find({});
  if (req.params.ultimos) {
    consulta.limit(3);
  }
  consulta
    .sort({ fecha: -1 })
    .exec()
    .then((articulos) => {
      if (!articulos || articulos.length === 0) {
        return res.status(404).json({
          status: "error",
          mensaje: "No se han encontrado articulos.",
        });
      }
      return res.status(200).send({
        status: "success",
        contador: articulos.length,
        articulos,
      });
    })
    .catch((error) => {
      return res.status(500).json({
        status: "error",
        mensaje: "Ha ocurrido un error en el servidor.",
      });
    });
};

const uno = async (req, res) => {
  const mongoose = require("mongoose");
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      status: "error",
      mensaje: "No se ha encontrado el artículo.",
    });
  }
  try {
    const articulo = await Articulo.findById(id).exec();
    if (!articulo) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se ha encontrado el artículo.",
      });
    }

    return res.status(200).json({
      status: "success",
      articulo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      mensaje: "Ocurrió un error al buscar el artículo.",
    });
  }
};

const borrar = async (req, resp) => {
  try {
    const id = req.params.id;
    const articuloBorrado = await Articulo.findOneAndDelete({ _id: id });
    if (!articuloBorrado) {
      return resp.status(404).json({
        status: "error",
        mensaje: "Articulo no encontrado"
      });
    }
    return resp.status(200).json({
      status: "success",
      articulo: articuloBorrado,
      mensaje: "Metodo de borrar"
    });
  } catch (error) {
    return resp.status(500).json({
      status: "error",
      mensaje: "Error al borrar el articulo"
    });
  }
};

const editar = async (req, res) => {
  //Recoger ID articulo a editar
  let articuloId = req.params.id;

  //Recoger datos del body
  let parametros = req.body;
  //Validar datos
  try {
    validarArticulo(parametros);
  } catch (error) {
    return res.status(400).json({
      status: "error",
      mensaje: "Faltan datos por enviar",
    });
  }
  //Buscar y actualizar articulos
  try {
    const articuloActualizado = await Articulo.findOneAndUpdate(
      { _id: articuloId },
      parametros,
      { new: true },
    );

    if (!articuloActualizado) {
      return res.status(404).json({
        status: "error",
        mensaje: "No existe el articulo a actualizar",
      });
    }

    return res.status(200).json({
      status: "success",
      articulo: articuloActualizado
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      mensaje: "Error al actualizar",
    });
  }
};

const subir = async (req, res) => {
  // Configurar multer

  // Recoger el fichero de imagen subido

  // Nombre del archivo
  let archivo = req.file.originalname;
  // Extensión del archivo
  let archivo_split = archivo.split(".");
  let archivo_extension = archivo_split[1];
  // Comprobar extensión correcta
  if (archivo_extension != "png" && archivo_extension != "jpg" && archivo_extension != "jpeg" && archivo_extension != "gif") {
    // Borrar archivo y dar respuesta
    try {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: "error",
        mensaje: "Archivo inválido",
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    // Si todo va bien, actualizar el artículo

    // Recoger ID del artículo a editar
    let articuloId = req.params.id;

    // Crear objeto con los parámetros a actualizar
    let parametros = {};

    if (req.body.titulo) {
      parametros.titulo = req.body.titulo;
    }

    if (req.body.descripcion) {
      parametros.descripcion = req.body.descripcion;
    }

    // Actualizar el artículo
    try {
      const articuloActualizado = await Articulo.findOneAndUpdate(
        { _id: articuloId },
        {
          ...parametros,
          imagen: req.file.filename,
        },
        { new: true }
      );

      if (!articuloActualizado) {
        return res.status(404).json({
          status: "error",
          mensaje: "No existe el artículo a actualizar",
        });
      }

      return res.status(200).json({
        status: "success",
        articulo: articuloActualizado,
        fichero: req.file,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        mensaje: "Error al actualizar el artículo",
      });
    }
  }
};

const imagen = (req, res) => {
  let fichero = req.params.fichero;
  let ruta_fisica = "./imagenes/articulos/" + fichero;
  fs.stat(ruta_fisica, (error, existe) => {
    if (existe) {
      return res.sendFile(path.resolve(ruta_fisica));
    } else {
      return res.status(404).json({
        status: "error",
        mensaje: "La imagen no existe",
        existe,
        fichero,
        ruta_fisica
      });
    }
  });
};

const buscador = async (req, res) => {
  try {
    //Sacar el string de busqueda
    let busqueda = req.params.busqueda;

    //Find OR 
    const articulosEncontrados = await Articulo.find({"$or": [
      {"titulo": {"$regex": busqueda, "$options": "i"}},
      {"contenido": {"$regex": busqueda, "$options": "i"}}
    ]})
    .sort({fecha: -1})
    .exec();

    if(!articulosEncontrados || articulosEncontrados.length === 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se han encontrado articulos"
      });
    }

    return res.status(200).json({
      status: "success",
      articulos: articulosEncontrados
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      mensaje: "Ha ocurrido un error en la búsqueda"
    });
  }
};

module.exports = {
  crear,
  listar,
  uno,
  borrar,
  editar,
  subir,
  imagen,
  buscador
};
