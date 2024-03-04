import express from "express";
import axios from "axios";
import * as https from "https";
import fs from "fs-extra";
import cors from "cors";

const keyPath = "/etc/letsencrypt/live/gigatualet.ru/privkey.pem";
const certificatePath = "/etc/letsencrypt/live/gigatualet.ru/fullchain.pem";

const key = !!fs.existsSync(keyPath) && fs.readFileSync(keyPath);
const cert =
  !!fs.existsSync(certificatePath) && fs.readFileSync(certificatePath);

const credentials = !!key && !!cert ? { key, cert } : undefined;

const httpsAgent = new https.Agent(credentials);

const app = express();

//////////////////Visitors/////////////////////////////

app.use(cors());

app.get('/api', function (req, res) {
  if (req.url === '/favicon.ico') {
    res.end();
  }

  const json = fs.readFileSync('count.json', 'utf-8');
  const parsedCount = JSON.parse(json);

  parsedCount.pageviews = parsedCount.pageviews + 1;
  
  if (req.query.type === "visit-pageview") {
    parsedCount.visits = parsedCount.visits + 1;
  }

  const newJSON = JSON.stringify(parsedCount);
  fs.writeFileSync('count.json', newJSON);

  res.send(newJSON);
})
//////////////////////////////////////////////////////


app.all("*", function (req, res) {
  const data = Object.keys(req.query)
    .map((key) => `${key} ${req.query[key]};`)
    .join(" ");

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    req.header("access-control-request-headers")
  );

  if (req.method === "OPTIONS") {
    res.send();
  } else {
    const targetURL = req.header("Target-URL");

    if (!targetURL) {
      res
        .status(500)
        .send({ error: "There is no Target-Endpoint header in the request" });
      return;
    }

    //res.setTimeout(3000, () => {
    //console.log("Request has timed out.");
    //res.sendStatus(408);
    //});

    axios({
      url: targetURL,
      method: req.method,
      data: data,
      headers: {
        "Client-ID": req.header("Client-ID"),
        Authorization: req.header("Authorization"),
      },
      httpsAgent,
    })
      .then((response) => {
        res.status(response.status).send(response.data);
      })
      .catch((error) => {
        !!error.response?.status &&
          res.status(error.response.status).sendStatus(error.response.status);
      });
  }
});

if (!credentials) {
  app.listen(4000, () => {
    console.log("Server is running at port 4000");
  });
} else {
  https.createServer(credentials, app).listen(4000, () => {
    console.log("Server is running at port 4000");
  });
}
