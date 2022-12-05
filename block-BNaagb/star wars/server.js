const express = require("express");
const redis = require("redis");
const axios = require("axios");

const client = redis.createClient(6379);
(async () => {
  await client.connect();
})();
client.on("connect", () => console.log("connected"));
client.on("error", (err) => console.log(err));

let baseURL = "https://swapi.dev/api/people";
const app = express();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/people/:id", checkCache, async (req, res) => {
  let id = req.params.id;
  let people = await axios.get(baseURL + "/" + id);
  client.setEx(id, 600, JSON.stringify(people.data));
  res.json({ data: people.data, source: "Retrieved from API Server" });
});

async function checkCache(req, res, next) {
  let id = req.params.id;
  let data = await client.get(id);
  if (!data) return next();
  res.json({ data: JSON.parse(data), source: "Retrieved from Cache Server" });
}

app.listen(3000, () => console.log("Server listening on port 3k"));
