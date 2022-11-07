const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { query } = require('express');

// env variables
require('dotenv').config()
const port = process.env.PORT || 5000
const secret = process.env.SECRET_TOKEN

// middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
const auth = (req, res, next) => {
    const token = req.headers.authToken;
    if(!token)
        res.send({status: 401, message: "Unauthorised Access"});
    else{
        let data = jwt.verify(token, process.env.SECRET_TOKEN)
        req.authResult = data
        next();
    }
}

// mongoDB client instance create
const uri = process.env.URL;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// CRUD operations 
async function run(){
    try{
        const database = await client.db('service-review')
        const serviceCollection = await database.collection('services')

        // get services from database
        app.get('/services' , async (req, res) => {
            let services;
            if(req.query.limit)
                services = await serviceCollection.find({}).limit(3).toArray();
            else
                services = await serviceCollection.find({}).toArray();
            res.send({
                status: "success",
                data: services
            })
        })
    }
    finally{}
}

run().catch(err => {
    console.log("RUN CATCH ERROR : ", err)
})

app.get('/', (req, res) => {
    res.status(200).send({
        message: "API working"
    })
})


// app listen
app.listen(port, ()=>{
    client.connect(err => {
      if(err)
          console.log("APP LISTEN ERROR : ",err)
      else
          console.log("database Connected")
    });
    console.log(`server running at ${port}`);
})