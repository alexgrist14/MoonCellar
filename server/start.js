import express from "express";
import axios from "axios";
import * as https from "https";
import fs from "fs-extra";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const app = express();

fs.removeSync("hui.json");

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

    res.setTimeout(3000, () => {
      console.log("Request has timed out.");
      res.sendStatus(408);
    });

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
        const games = fs.existsSync("hui.json")
          ? fs.readJSONSync("hui.json")
          : [];

        fs.writeJSONSync("hui.json", games.concat(response.data));
        res.status(response.status).send(response.data);
      })
      .catch((error) => {
        !!error.response?.status &&
          res.status(error.response.status).sendStatus(error.response.status);
      });
  }
});

app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), function () {
  console.log("Proxy server listening on port " + app.get("port"));
});
