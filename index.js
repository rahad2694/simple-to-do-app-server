const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

//MiddleWares
app.use(express.json());
app.use(cors());

function verifyToken(accessToken) {
    let email;
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
        if (error) {
            email = 'invalid email';
        } else if (decoded) {
            email = decoded.email;
        }
    })
    return email;
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sluqv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toDoCollection = client.db("simple-to-do").collection("to-do-list");
        app.get('/todolist', async (req, res) => {
            const email = req.headers.email;
            const query = {email};
            const cursor = toDoCollection.find(query);
            const todolist = await cursor.toArray();
            res.send(todolist);
        });

        // generating decoded mail-token during login
        app.post('/login', async (req, res) => {
            const email = req.body;
            console.log(email);
            const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            res.send({ accessToken });
        });

        app.post('/addtodo', async (req, res) => {
            const newItem = req.body;
            const accessTokenInfo = req.headers.authorization;
            const [email, accessToken] = accessTokenInfo.split(' ');
            const decodedEmail = verifyToken(accessToken);
            if (email === decodedEmail) {
                const result = await toDoCollection.insertOne(newItem);
                res.send(result);
            } else {
                res.status(403).send({ error: 'Access Forbidden!' });
            }
        });
        app.delete('/ietm/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toDoCollection.deleteOne(query);
            res.send(result);
        })
        app.put('/updateinfo/:id', async (req, res) => {
            const id = req.params.id;
            const newInfo = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedItem = {
                $set: newInfo
            };
            const result = await toDoCollection.updateOne(filter, updatedItem, options);
            res.send(result);
        })
    }
    finally {

    }
}

run().catch(console.dir);

//global get request
app.get('/', (req, res) => {
    res.send('Server is Running');
})


//Listening to port
app.listen(port, () => {
    console.log('Listening to port', port);
})