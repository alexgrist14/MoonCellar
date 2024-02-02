import express from "express";
import axios from "axios";
import * as https from "https";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const app = express();

app.all("*", function (req, res) {
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

    console.log(req.query)
    console.log(req.body)
    console.log(req.data)

    axios({
      url: targetURL,
      method: req.method,
      data: req.body,
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
        console.log(error);
      });
  }
});

app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), function () {
  console.log("Proxy server listening on port " + app.get("port"));
});
