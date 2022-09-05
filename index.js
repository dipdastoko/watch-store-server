const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zqquk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const database = client.db('watch-store');
        const usersCollection = database.collection('users');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const reviewCollection = database.collection('reviews');

        // api to check if the user is admin
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            let admin = false;
            if (user?.role === 'admin') {
                admin = true;
            }
            res.json(admin);
        });

        // api to get only 6 products in home page and all products in explore page
        app.get('/homeproducts', async (req, res) => {
            const page = req.query.page;
            const cursor = productsCollection.find({});
            let products;
            if (page === 'home') {
                products = await cursor.limit(6).toArray();
            }
            else if (page === 'all') {
                products = await cursor.toArray();
            }
            res.json(products);
        });

        // api to get user orders
        app.get('/orders/:email', async (req, res) => {
            const query = { email: req.params.email };
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            console.log(orders);
            res.json(orders)
        });

        // api to get all the reviews
        app.get('/review', async (req, res) => {
            const cursor = reviewCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        });

        // register user api
        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // add product to database api
        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.json(result);

        });

        // api to store order in db
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });

        // api to submit review
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.json(result);
        })

        // google login user upsert api
        app.put('/user', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // make admin api
        app.put('/user/makeadmin', async (req, res) => {
            const email = req.body.email;
            const filter = { email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // cancel order
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })

    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('watch store server');
});

app.listen(port, () => {
    console.log('listening from', port);
});