const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const app = express();
app.use(cors());
dotenv.config();
app.use(express.json());

const PORT = process.env.PORT || 5000;

// mongodb connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.nxpijbg.mongodb.net/?retryWrites=true&w=majority`;
client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// internal import
app.get("/", (req, res) => {
  res.send({ message: "server running" });
});

// get all course rout
async function run() {
  const usersCollection = client.db("ph-assign-12").collection("users");
  const productsCollection = client.db("ph-assign-12").collection("products");
  const bookingCollection = client.db("ph-assign-12").collection("booking");
  const productCategoryCollection = client
    .db("ph-assign-12")
    .collection("productCategory");

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

    app.post("/register", async (req, res) => {
      const user = req.body;
      // check wether user already exist
      const query = { userEmail: user.userEmail };
      const alreadySave = await usersCollection.find(query).toArray();

      if (alreadySave.length) {
        return res.send({ message: "user already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get all users

    // update user to admin or vice versa

    // create payment route

    // create seller product add route

    app.post("/product", async (req, res) => {
      const product = req.body;
      let timeWhenPost = new Date();
      timeWhenPost = timeWhenPost.toString().slice(0, 15);
      product.timeWhenPost = timeWhenPost;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // get all products

    app.get("/products", async (req, res) => {
      const query = {};
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    //  get especific category product

    app.get("/products/:name", async (req, res) => {
      const categoryName = req.params.name;
      const query = { category: categoryName };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // get seller all products

    app.get("/sellerproducts", async (req, res) => {
      const sellerEmail = req.query.email;

      const query = { sellerEmail: sellerEmail };

      const result = await productsCollection.find(query).toArray();

      res.send(result);
    });

    // get advertise products

    app.get("/advertise/products", async (req, res) => {
      const query = { advertise: true };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // update product advertise status

    app.put("/advertise/product/update/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };
      const update = {
        $set: {
          advertise: true,
        },
      };
      const option = { upsert: true };

      const result = await productsCollection.updateOne(filter, update, option);
      res.send(result);
    });
    // update seller verify status

    app.put("/user/seller/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const update = {
        $set: {
          verify: true,
        },
      };
      const option = { upsert: true };

      const result = await usersCollection.updateOne(filter, update, option);
      res.send(result);
    });

    // delete user -- admin

    app.delete("/user/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await usersCollection.deleteOne(query);

      res.send(result);
    });

    // delete product -- admin

    app.delete("/delete/product/:id",async (req,res) => {

      const id = req.params.id

      const query = {_id:ObjectId(id)}
      const result = await productsCollection.deleteOne(query)

      res.send(result)


    })



    // report product to admin

    app.put("/product/report/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };
      const update = { $set: { report: true } };
      const option = { upsert: true };
      const result = await productsCollection.updateOne(filter, update, option);

      res.send(result);
    });

    // get all reported items

    app.get("/reported/products", async (req, res) => {
      const query = { report: true };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // check user role

    app.get("/user/checkrole/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const user = await usersCollection.findOne(query);
      res.send({ role: user?.role });
    });

    // booking producct route

    app.post("/booking", async (req, res) => {
      const bookingData = req.body;

      const result = await bookingCollection.insertOne(bookingData);

      res.send(result);
    });

    // get all orders

    app.get("/orders", async (req, res) => {
      const { email } = req.query;
      const query = { buyerEmail: email };
      const result = await bookingCollection.find(query).toArray();

      res.send(result);
    });

    // get all sellers

    app.get("/sellers", async (req, res) => {
      const query = { role: "seller" };

      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // get all sellers

    app.get("/buyers", async (req, res) => {
      const query = { role: "buyer" };

      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // get product category

    app.get("/productcategory", async (req, res) => {
      const query = {};

      const result = await productCategoryCollection.find(query).toArray();

      res.send(result);
    });

    // create product route
  } finally {
  }
}
run().catch((err) => {
  console.log(err);
});

app.listen(PORT, () => {
  console.log(`server listen on port ${PORT}`);
});
