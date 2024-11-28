// const cluster = require("node:cluster");
// const os = require("os");
const express = require('express');
// const totalCpus = os.cpus().length;
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const route = require('./routes/api.routes');
const bodyParser = require('body-parser');
const helmet = require('helmet');

dotenv.config({
  path: path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
});

// if (cluster.isPrimary) {
//   for (let i = 0; i < totalCpus; i++) {
//     cluster.fork();
//   }
// } else {
const app = express();
const mongooseConnection = require('./database/mongoconnection');
app.use(helmet());
app.use(helmet.referrerPolicy({ policy: 'no-referrer-when-downgrade' }));
// Increase the limit for JSON payloads
app.use(bodyParser.json({ limit: '50mb' }));

// Increase the limit for URL-encoded payloads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ message: 'Invalid JSON' }); // Bad request
  } else {
    next();
  }
});

app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE`);
  res.header(`Access-Control-Allow-Headers`, `Content-Type`);
  next();
});
app.use(cors());
app.use(express.json());
app.use(route);

app.use('/', (req, res) => {
  return res.send({ message: `run api` })
})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
// }