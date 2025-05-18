require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
//const uri = "mongodb+srv://blood:0olzhDcCOH823CU7@cluster0.pwqz3ti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_PASS}@cluster0.pwqz3ti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });

    const db = client.db('bloodD');
    const userCollectionall = db.collection('usersall');
    const bloodData = db.collection("bloodgroup");
    const divisions = db.collection('alldevision');
    const createdonation = db.collection('createdonation');


    //createdonation
    app.post('/createdonation', async (req, res) => {
      const user = req.body;
      const result = await createdonation.insertOne(user);
      res.send(result);
    })
    //Get createdonation User
    app.get('/createdonation', async (req, res) => {
      const result = await createdonation.find().toArray();
      res.send(result);


    })

    // app.get('/createdonation/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email: email };
    //   const result = await createdonation.find(query).toArray();
    //   res.send(result);

    // })
 app.get('/createdonation/:email', async (req, res) => {
  const email = req.params.email;
  console.log('Getting donation requests for:', email);
  
  // Fix: Use the correct variable (email)
  const query = { email: email };
  
  const result = await createdonation.find(query).toArray();
  console.log('Results:', result);
  res.send(result);
});






    app.post('/userall', async (req, res) => {
      const user = req.body;
      const existingUser = await userCollectionall.findOne({ email: user.email });

      if (existingUser) {
        return res.status(409).json({ message: "User already exists" }); // Conflict
      }

      const result = await userCollectionall.insertOne(user); // Changed from usersCollection to userCollectionall
      res.status(201).json(result);
    });

    //  all userres.get
    app.get('/userall', async (req, res) => {
      const result = await userCollectionall.find().toArray();
      res.send(result);
    })

 //All search blood group
    app.get('/bloodgroup', async (req, res) => {
      const result = await bloodData.find().toArray();
      res.send(result);


    })



    //email find user data get 
    app.get('/userall/:email', async (req, res) => {
      const email = req.params.email.toLowerCase();
      const query = { email: email };

      const result = await userCollectionall.findOne(query);

      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(result);
    });
    //Update user data
    app.put('/userall/:email', async (req, res) => {
      const email = req.params.email.toLowerCase();
      const updatedData = req.body;

      const result = await userCollectionall.updateOne(
        { email: email },
        { $set: updatedData }
      );

      res.send(result);
    });


    // divition
    app.get('/division', async (req, res) => {
      const result = await divisions.find().toArray();
      res.send(result);
    });



    // Get districts by division
    app.get('/district', async (req, res) => {
      const { division } = req.query;
      if (!division) {
        return res.status(400).json({ message: 'Division is required' });
      }

      // Find the division data from divisions collection
      const divisionData = await divisions.findOne({ name: division });

      if (divisionData) {
        res.send(divisionData.districts);  // Assuming districts are stored in divisionData
      } else {
        res.status(404).json({ message: 'Division not found' });
      }
    });


    app.get('/upazila', async (req, res) => {
      const { district } = req.query;
      if (!district) {
        return res.status(400).json({ message: 'District name is required' });
      }

      // Search for the division document containing the district
      const divisionData = await divisions.findOne({
        "districts.name": district
      });

      if (!divisionData) {
        return res.status(404).json({ message: 'District not found in any division' });
      }

      // Extract the district from the division's districts array
      const districtData = divisionData.districts.find(d => d.name === district);

      if (!districtData) {
        return res.status(404).json({ message: 'District data not found' });
      }

      res.json(districtData.upazilas);
    });



    app.get("/bloodgroup", async (req, res) => {
      const result = await bloodData.find().toArray();

      res.send(result);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


// default route
app.get('/', (req, res) => {
  res.send('Blood Donation Server is Running');
});

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
