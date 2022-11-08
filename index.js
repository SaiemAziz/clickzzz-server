const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const token = req.headers.authtoken;
    if(!token)
    {
        return res.status(401).send({status: 401, message: "Unauthorised Access"});
    }
    else{
        let queryEmail = req.query.email;
        let data = jwt.verify(token, process.env.SECRET_TOKEN)
        if(queryEmail !== data.email)
        return res.status(403).send({status: 403, message: "Forbidden Access"});
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
        const reviewCollection = await database.collection('reviews')

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

        // add a service 
        app.post('/add-service', async (req, res) => {
            let service = req.body;
            let result = await serviceCollection.insertOne(service)
            let services = await serviceCollection.find({}).toArray();
            res.send({
                status: "success",
                data: services
            })
        })

        // get service details from database
        app.get('/service-details/:id' , async (req, res) => {
            
            let id = req.params.id;
            let query = {_id : ObjectId(id)}
            let serviceDetails = await serviceCollection.findOne(query)
            res.send({
                status: "success",
                data: serviceDetails
            })
        })


        // get reviews for a service
        app.get('/my-reviews',auth, async (req, res) => {
            let queryEmail = req.query.email;
            let query = {email: queryEmail}
            let reviews = await reviewCollection.find(query).toArray()
            res.send({
                status: "success",
                data: reviews
            })
        })

        // get reviews for a service
        app.get('/service-reviews', async (req, res) => {
            let queryServiceId = req.query.id;
            let query = {service_id: queryServiceId}
            let reviews = await reviewCollection.find(query).toArray()
            res.send({
                status: "success",
                data: reviews
            })
        })

        // post new review for a service
        app.post('/service-reviews', async (req, res) => {
            let newReview = req.body;
            let result = await reviewCollection.insertOne(newReview)
            let reviews = await reviewCollection.find({}).toArray()
            res.send({
                status: "success",
                data: reviews
            })
        })

        // create jwt token and send 
        app.get('/jwt', (req, res)=> {
            let userEmail = req.headers.email
            let token = jwt.sign({email: userEmail}, secret,{expiresIn: '20d'})
            res.send(
                {token}
            )
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