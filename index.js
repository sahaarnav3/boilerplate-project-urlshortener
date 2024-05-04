const express = require('express');
const app = express();
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
const Url = require('url-parse');
require('dotenv').config();


//Conneccting to mongodb server 
try {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("DB Connection Success..");
}
catch (error) {
  console.log(error);
}

const urlListSchema = new mongoose.Schema({
  full_url: String,
  short_url: Number
});
let urlList = mongoose.model('urlList', urlListSchema);

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

//middleware for parsing the header and body
app.use(express.urlencoded({ extended: true }));
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
  const parsedUrl = new Url(req.body.url);
  console.log(parsedUrl);
  dns.lookup(parsedUrl.host, async (err) => {
    if (err) {
      console.log(err);
      return res.json({ error: "invalid url" });
    }
    //Below will count the number of urls present in the data base.
    try {
      const counter = await urlList.countDocuments();
      const ifPresent = await urlList.find({ full_url: parsedUrl.href });
      if (ifPresent.length) 
        return res.json({ "original_url": ifPresent[0].full_url, "short_url": ifPresent[0].short_url });
    
      const urlObj = new urlList({ full_url: parsedUrl.href, short_url: counter + 1 });
      const returnedData = await urlObj.save();
      res.json({ "original_url": returnedData.full_url, "short_url": returnedData.short_url });
    }
    catch (error) {
      console.log(error);
      return res.send("something went wrong please try again")
    }
  })
});

//below router will route to the website according to the code given 
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const ifPresent = await urlList.find({ short_url: shortUrl });
  if(ifPresent)
      return res.redirect(ifPresent[0].full_url);
  res.json({ "error": "No short URL found for the given input" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
