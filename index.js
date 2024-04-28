require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const fs = require('fs');
const path = require('path');
let urlList;
let urlListWithValues;
let counter;

//Custom Functions -- 
const writeDataToJSON = (data, filePath) => {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
      console.err("Error Writing the json data to file:", err);
    } else {
      console.log("Data saved successfully to:", filePath);
    }
  });
}

(function readDataFromJSON() {
  try {
    let jsonData = fs.readFileSync("./urlData.json", "utf-8");
    jsonData = JSON.parse(jsonData);
    console.log( "fetched json data..--", jsonData);
    urlList = jsonData.urlList || {};
    urlListWithValues = jsonData.urlListWithValues || {};
    counter = jsonData.counter || 1;
  } catch (error) {
    if(error.code === "ENOENT") {
      console.warn(" JSON File Not Found:", "./urlData.json");
      return {};
    } else {
      console.log("Error reading JSON File..", error);
      return {};
    }
  } 
})();


// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

//middleware for parsing the header and body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

//Main router functioning 
app.post("/api/shorturl", (req, res) => {
  // const url = String(req.body.url).split("://")[1];
  const url = String(req.body.url).split(":");
  var filteredUrl = "";
  if (url[0] == "http" || url[0] === "https" || url[0] === "ftp") {
    if (url[1].endsWith("/"))
      return res.json({ error: "invalid url" });
    filteredUrl = url[1].replaceAll("/", "");
  } else {
    return res.json({ error: "invalid url" });
  }
  dns.lookup(filteredUrl, (err, addresses, family) => {
    if (err) {
      // console.log(err);
      return res.json({ error: "invalid url" });
    }
    if (!(Object.keys(urlList).includes(filteredUrl))) {
      urlList[filteredUrl] = counter;
      urlListWithValues[counter] = filteredUrl;
      counter++;
      writeDataToJSON({ urlList, urlListWithValues, counter }, './urlData.json');
    }
    res.json({ original_url: req.body.url, short_url: urlList[filteredUrl] });
  })
});

//below router will route to the website according to the code given 
app.get("/api/shorturl/:short_url", (req, res) => {
  if (!Object.keys(urlListWithValues).includes(req.params.short_url))
    return res.json({ error: "No short URL found for the given input" });
  res.redirect(`https://${urlListWithValues[req.params.short_url]}`);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
