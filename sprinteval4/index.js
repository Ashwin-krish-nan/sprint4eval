const express = require("express")
const axios = require("axios");
const winston = require("winston")
const {connection} = require("./config/db")
const {user_route} = require("./route/user.route")
const {authenticate} = require("./middleware/auth.middleware")
const redis = require('redis');
const client= require('./middleware/auth.middleware')




const app = express()
app.use(express.json())



const logger = winston.createLogger({
    level:"info",
    transports:[
        new winston.transports.File({
            level:"info",
            filename:"error.log"
        })
    ]
})



app.get("/",(req,res)=>{
    res.send("WELCOME")
})





app.use("/",user_route)

app.get("/weather", (req, res) => {
  const options = {
    method: 'GET',
    url: 'https://history3.p.rapidapi.com/v0/daily-zip/DE/81245/20210101',
    params: {parameters: 'weather'},
    headers: {
      'X-RapidAPI-Key': '07bc82aff5mshe542557303f555bp17a6a2jsn5e03ce003156',
      'X-RapidAPI-Host': 'history3.p.rapidapi.com'
    }
  };

  axios.request(options)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).send("Error fetching weather data");
    });
});


app.use(authenticate)

app.get("/logout",(req,res)=>{
    try {
    const token = req.headers.authorization.split(' ')[1];
    client.set(token, 'blacklisted');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error blacklisting token' });
  }
})


app.get('/weather2',async (req, res) => {
  const { cityName } = req.query;
  const cacheKey = `weather:${cityName}`;
  try {
    // Check if the weather data is already present in Redis
    client.get(cacheKey, async (err, weatherData) => {
      if (err) throw err;
      if (weatherData !== null) {
        console.log('Using cached weather data');
        return res.json(JSON.parse(weatherData));
      } else {
        // Fetch the weather data from OpenWeather API
        const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${process.env.OPENWEATHER_API_KEY}`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Save the weather data in Redis with 30 minute expiration
        client.setex(cacheKey, 1800, JSON.stringify(weatherData));

        // Return the weather data to the client
        return res.json(weatherData);
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching weather data' });
  }
});


app.listen(3000,async ()=>{
    try {
        await connection
        console.log("DB connected");
    } catch (error) {
        console.log(error);
        console.log("DB dose not connected");
    }
    console.log("Port @ localhost:3000");
})