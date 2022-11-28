const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const app = express();
app.use(cors());
dotenv.config();
app.use(express.json());

const stripe = require("stripe")(process.env.STRIPE_SECRET)

const PORT = process.env.PORT || 5000;

// mongodb connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.nxpijbg.mongodb.net/?retryWrites=true&w=majority`;
client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// middleware
function verifyJwtToken(req, res, next) {
  try {
    const token = req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send({
        message: "unauthorize access",
      });
    }

    jwt.verify(token, process.env.JSON_SECRET, (err, decode) => {
      if (err) {
        return res.status(403).send({ message: "forbidden access" });
      }
      req.userEmail = decode.email;
      next();
    });
  } catch (error) {
    console.log(error);
  }
}

// internal import
app.get("/", (req, res) => {
  res.send({ message: "server running" });
});

// get all course rout
async function run() {
  const usersCollection = client.db("ph-assign-12").collection("users");
  const productsCollection = client.db("ph-assign-12").collection("products");
  const bookingCollection = client.db("ph-assign-12").collection("booking");
  const ordersCollection = client.db("ph-assign-12").collection("orders");
  const productCategoryCollection = client
    .db("ph-assign-12")
    .collection("productCategory");

  try {
    
    async function verifyAdmin(req, res, next) {
      const userEmail = req.userEmail;
      const query = { userEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(401).send({ message: "fobidden acces" });
      }
      next();
    }

    async function verifySeller(req, res, next) {
      const userEmail = req.userEmail;
      const query = { userEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "seller") {
        return res.status(401).send({ message: "fobidden acces" });
      }
      next();
    }

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

    app.post("/product",verifyJwtToken,verifySeller, async (req, res) => {
      const product = req.body;
      let timeWhenPost = new Date();
      timeWhenPost = timeWhenPost.toString().slice(0, 15);
      product.timeWhenPost = timeWhenPost;

      const sellerEmail = product.sellerEmail;
      const seller = await usersCollection.findOne({ userEmail: sellerEmail });

      if (seller?.verify) {
        product.sellerVerified = true;
      }

      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // get all products

    // app.get("/products", async (req, res) => {
    //   const query = {};
    //   const products = await productsCollection.find(query).toArray();
    //   res.send(products);
    // });

    //  get especific category product

    app.get("/products/:id", async (req, res) => {
      const categoryId = req.params.id;
      const query = { categoryId: categoryId,status:"unsold" };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // get seller all products

    app.get("/seller/products",verifyJwtToken,verifySeller, async (req, res) => {
      const sellerEmail = req.query.email;

      const query = { sellerEmail: sellerEmail };

      const result = await productsCollection.find(query).toArray();

      res.send(result);
    });

    // get advertise products

    app.get("/advertise/products", async (req, res) => {
      const query = { advertise: true,status:"unsold" };
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

    app.put("/user/seller/update/:email",verifyJwtToken,verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { userEmail: email };
      const update = {
        $set: {
          verify: true,
        },
      };
      const option = { upsert: true };
      const result = await usersCollection.updateOne(filter, update, option);

      // to update product seller verify status

      const query = { sellerEmail: email };
      const updateData = {
        $set: {
          sellerVerified: true,
        },
      };
      const option2 = {
        upsert: true,
      };
      const result2 = await productsCollection.updateMany(
        query,
        updateData,
        option2
      );
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

    app.delete("/delete/product/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);

      res.send(result);
    });

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

    app.get("/reported/products",verifyJwtToken,verifyAdmin, async (req, res) => {
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
        const query = {productId:bookingData.productId}
        
        const findBooking = await bookingCollection.findOne(query)

          if(findBooking) {
            return res.send({message:"you have already booked this product",success:false})
          }

      const result = await bookingCollection.insertOne(bookingData);
     return res.send({message:"booking successfully",success:true});

    });


      // get booking product details for payment

        app.get("/booking/:id",async (req,res) => {
          const id = req.params.id
          const query = {_id:ObjectId(id)}

          const result = await bookingCollection.findOne(query)
          res.send(result)
        })



    // get all bookings

    app.get("/bookings", verifyJwtToken, async (req, res) => {
      const { email } = req.query;
      const query = { buyerEmail: email };
      const result = await bookingCollection.find(query).toArray();

      res.send(result);
    });

    // get all sellers

    app.get("/sellers", verifyJwtToken,verifyAdmin, async (req, res) => {
      const query = { role: "seller" };

      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // get all buyers

    app.get("/buyers", verifyJwtToken,verifyAdmin, async (req, res) => {
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


     // create payment route

     app.post("/create-payment-intent",verifyJwtToken, async (req,res) => {
      const booking = req.body
      const price = booking.price
      const amount = price * 100

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency:"usd",
        "payment_method_types": [
          "card"
        ]
      })
      res.send({clientSecret:paymentIntent.client_secret})
    })
    

    // save payment info to order

    app.post("/orders", async(req,res) => {

        const {productId,bookingId,paymentId} = req.body

        const query = {_id:ObjectId(bookingId)}
        const updateBookingData = {
          $set:{
            status:"paid",
            paymentId:paymentId
          }
        }
        const option = {upsert:true}
        const result = await bookingCollection.updateOne(query,updateBookingData,option)

          const filter = {_id:ObjectId(productId)}
        const update = {
          $set:{
            status:"sold"
          }
        }
          const result2 = await productsCollection.updateOne(filter,update,option)
        res.send(result2)
    })



    
  } finally {
  }
}
run().catch((err) => {
  console.log(err);
});

app.listen(PORT, () => {
  console.log(`server listen on port ${PORT}`);
});
