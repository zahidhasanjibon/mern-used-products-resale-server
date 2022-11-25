const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")


const app = express()


app.use(cors())
dotenv.config()
app.use(express.json())

const PORT  = process.env.PORT || 5000

        // mongodb connection
        const { MongoClient, ServerApiVersion } = require('mongodb');
        const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.nxpijbg.mongodb.net/?retryWrites=true&w=majority`;
         client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
   
    // internal import
    app.get("/",(req,res) => {
        res.send({message:"server running"})
      })

      // get all course rout
async function run() {
    const usersCollection = client.db("ph-assign-12").collection("users");
    const productsCollection = client.db("ph-assign-12").collection("products");

  
    try {
        // create jwt token route
        app.post("/jwtgenerate", (req, res) => {
          const userData = req.body;

          const token = jwt.sign(userData, process.env.JSON_SECRET, {
            expiresIn: "5d",
          });
          res.send({
            token,
          });
        });

      // save user info in database

      app.post("/register",async (req,res) => {

        const user = req.body
        // check wether user already exist
        const query = {userEmail:user.userEmail}
        const alreadySave = await usersCollection.find(query).toArray()

        if(alreadySave.length){
          return res.send({message:"user already exist"})
        }

        const result = await usersCollection.insertOne(user)
          res.send(result)
      })
  
      // get all users
      
      // update user to admin or vice versa
  
      // create payment route



      // create seller product add route


        app.post("/product",async(req,res) => {

            const product = req.body
            product.timeWhenPost = Date.now()
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })


        // get all products

        app.get("/products",async (req,res) => {

            const query = {}

            const products = await productsCollection.find(query).toArray()

            res.send(products)

        })






  
    } finally {
    }
  }
  run().catch((err) => {
    console.log(err);
  });



    app.listen(PORT,() => {
        console.log(`server listen on port ${PORT}`);
    })


