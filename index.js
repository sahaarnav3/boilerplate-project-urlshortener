require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const urlList = { 'forum.freecodecamp.org': 1 };
const urlListWithValues = { 1 : 'forum.freecodecamp.org' };
var counter = 2;
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
  if(url[0] == "http" || url[0] === "https" || url[0] === "ftp") {
    filteredUrl = url[1].replaceAll("/", "");
    // console.log(filteredUrl);
  } else {
    res.json({ url: "Invalid URL" });
  }
  dns.lookup(filteredUrl, (err, addresses, family) => {
    if (err) {
      // console.log(err);
      res.json({ url: "Invalid URL" });
    } else {
      if (!Object.keys(urlList).includes(url)){ 
        urlList[filteredUrl] = counter;
        urlListWithValues[counter] = filteredUrl;
        counter++;
      }
      res.json({ original_url: req.body.url, short_url: urlList[filteredUrl] });
    }
  })
});

//below router will route to the website according to the code given 
app.get("/api/shorturl/:value", (req, res) => {
  if(!Object.keys(urlListWithValues).includes(req.params.value))
    res.json({ error: "No short URL found for the given input" });
  res.redirect(`https://${urlListWithValues[req.params.value]}`);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
