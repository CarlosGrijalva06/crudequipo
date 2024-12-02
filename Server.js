const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const {jsPDF} = require('jspdf');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

app.get('/equipos', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM equipos');
  res.json(rows);
});

app.get('/equipos/:id', async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.query('SELECT * FROM equipos WHERE id_equipo = ?', [id]);
  res.json(rows[0] || {});
});

app.post('/equipos', async (req, res) => {
  const { nombre_equipo, ciudad, fundacion, colores, estadio, titulos } = req.body;
  await db.query('INSERT INTO equipos (nombre_equipo, ciudad, fundacion, colores, estadio, titulos) VALUES (?, ?, ?, ?, ?, ?)', [nombre_equipo, ciudad, fundacion, colores, estadio, titulos]);
  
  const doc = new jsPDF();
  doc.text(`Equipo: ${nombre_equipo}`, 10, 10);
  doc.text(`Ciudad: ${ciudad}`, 10, 20);
  doc.text(`Fundación: ${fundacion}`, 10, 30);
  doc.text(`Colores: ${colores}`, 10, 40);
  doc.text(`Estadio: ${estadio}`, 10, 50);
  doc.text(`Títulos: ${titulos}`, 10, 60);

  // Obtiene el buffer del PDF
  const pdfBuffer = doc.output('arraybuffer');

  // Define la carpeta donde se guardará el PDF
  const pdfFolder = path.join(__dirname, 'pdfs');
  const pdfFileName = `equipo_${Date.now()}.pdf`;  // Usa un nombre único para cada archivo
  const pdfFilePath = path.join(pdfFolder, pdfFileName);

  // Verifica si la carpeta pdfs existe y créala si no
  if (!fs.existsSync(pdfFolder)) {
    fs.mkdirSync(pdfFolder);
  }

  // Guarda el archivo PDF en el sistema de archivos
  fs.writeFileSync(pdfFilePath, Buffer.from(pdfBuffer));

  // Configura los encabezados para hacer la descarga automática
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${pdfFileName}`);

  res.sendFile(pdfFilePath);
  
  // res.send({ message: 'Equipo creado' });
});

app.put('/equipos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_equipo, ciudad, fundacion, colores, estadio, titulos } = req.body;
  await db.query('UPDATE equipos SET nombre_equipo = ?, ciudad = ?, fundacion = ?, colores = ?, estadio = ?, titulos = ? WHERE id_equipo = ?', [nombre_equipo, ciudad, fundacion, colores, estadio, titulos, id]);
  res.send({  });
});

app.delete('/equipos/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM equipos WHERE id_equipo = ?', [id]);
  res.send({ message: 'Equipo eliminado' });
});
 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`)); 