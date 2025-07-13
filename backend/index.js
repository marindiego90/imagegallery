const port = 5000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

require('dotenv').config();
app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB conectado."))

// API creation
app.get('/', (req, res)=>{
    res.send('Express App is running.')
})

// Image storage engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

// Creating upload endpoint for images
app.use('/images', express.static('upload/images'))

app.post('/upload', upload.single('photo'), (req, res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for creating photos

const Photo = mongoose.model('photos', { // El segundo 'Photo' es el nombre de de colección en MongoDB
    id: {
        type: Number,
        required: true,
    },
    nombre: {
        type: String,
        required: true,
    },
    descripcion: {
        type: String,
        required: true,
    },
    imagen: {
        type: String,
        required: true,
    },
    categoria: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

app.post('/addphoto', async (req, res) => {
    try {
        const photos = await Photo.find({});
        let id = photos.length > 0 ? photos[photos.length - 1].id + 1 : 1;

        const photo = new Photo({
            id: id,
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            imagen: req.body.imagen,
            categoria: req.body.categoria,
        });

        await photo.save();

        console.log("Foto guardada.");
        res.json({
            success: true,
            nombre: req.body.nombre,
        });
    } catch (err) {
        console.error("Error al guardar la foto:", err);
        res.status(500).json({ success: false, error: "Error al guardar la foto" });
    }
});


// Creating API for getting all photos

// app.get('/allphotos', async (req, res) => {
//     let photos = await Photo.find({}); //Los {} indican que no hay filtros, es decir, queremos todos los Photoos.
//     console.log('All photos fetched');
//     res.send(photos);
// })

// Creating API for deleting photos

// app.post('/removePhoto', async (req, res) => {
//     await Photo.findOneAndDelete({id:req.body.id});
//     console.log("Removed.");
//     res.json({
//         success: true,
//         name: req.body.name
//     })
// })

// Schema creating for user model

const Users = mongoose.model('Users', {
    usuario:{
        type: String,
    },
    email:{
        type: String,
    },
    contrasena:{
        type: String,
    },
    date:{
        type: Date,
        default: Date.now,
    },
});

// Creating endpoint for registering the user

app.post('/signup', async (req, res) =>{

    let check = await Users.findOne({email:req.body.email});
    if (check){
        return res.status(400).json({success:false, errors:"Este email ya se encuentra registrado."})
    }

    const user = new Users({
        usuario: req.body.usuario,
        email: req.body.email,
        contrasena: req.body.contrasena,
    })

    await user.save();

    const data = {
        user: {
            id: user.id
        }
    }

    const token = jwt.sign(data, 'secret_ecom');
    res.json({success: true, token})
});


// Creating endpoint for user login

app.post('/login', async (req, res)=>{
    let user = await Users.findOne({email: req.body.email});
    if (user){
        const passCompare = req.body.contrasena === user.contrasena;
        if (passCompare){
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({success: true, token});
        }
        else{
            res.json({success: false, errors: "Contraseña incorrecta."})
        }
    }
    else{
        res.json({success: false, errors: "Id de email incorrecto."})
    }
})



app.listen(port, (error)=>{
    if (!error){
        console.log('Server running on port ' + port)
    } else {
        console.log('Error: ' + error)
    }
});
