
require('dotenv').config();  // <-- Load environment variables from .env

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI from environment variables
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_PASS}@cluster0.pwqz3ti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const db = client.db('bloodD');
    const userCollectionall = db.collection('usersall');
    const bloodData = db.collection("bloodgroup");
    const divisions = db.collection('alldevision');
    const createdonation = db.collection('createdonation');
    const blog = db.collection('blogsall');


    //blog Post
    app.post('/blogsall', async (req, res) => {
      const user = req.body;
      const result = await blog.insertOne(user);
      res.send(result);
    });
    //blog Get
    app.get('/blogsall', async (req, res) => {
      const result = await blog.find().toArray();
      res.send(result);
    })
    //
 // PATCH /blogs/:id/status
app.patch('/blogs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'published'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const result = await blog.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const updatedBlog = await blog.findOne({ _id: new ObjectId(id) });
    res.status(200).json(updatedBlog);
  } catch (err) {
    console.error('Error updating blog status:', err);
    res.status(500).json({ error: 'Failed to update blog status' });
  }
});

// DELETE /blogs/:id
app.delete('/blogs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await blog.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.status(200).json({ message: 'Blog successfully deleted' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});


    // PATCH admin role
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = { $set: { role: 'admin' } };
      const result = await userCollectionall.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // PATCH update user by ID (for status, role updates)
    app.patch('/userall/:id', async (req, res) => {
      const id = req.params.id;
      const updates = req.body;
      try {
        const result = await userCollectionall.updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        const updatedUser = await userCollectionall.findOne({ _id: new ObjectId(id) });
        res.json(updatedUser);
      } catch (error) {
        res.status(500).json({ message: "Failed to update user", error });
      }
    });

    // CREATE donation request
    app.post('/createdonation', async (req, res) => {
      const user = req.body;
      const result = await createdonation.insertOne(user);
      res.send(result);
    });

    // GET all donation requests
    app.get('/createdonation', async (req, res) => {
      const result = await createdonation.find().toArray();
      res.send(result);
    });

    // GET donation requests by email
    app.get('/createdonation/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await createdonation.find(query).toArray();
      res.send(result);
    });

    // GET single donation request by ID
    app.get('/createdonation/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await createdonation.findOne(query);
      res.send(result);
    });

  //get blogsAll
  app.get('/blogsall/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await blog.findOne(query);
    res.send(result);
    
  })

  //Update Blog All
  app.patch('/blogsall/:id', async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const result = await blog.updateOne({ _id: new ObjectId(id) }, { $set: updates });
  if (result.matchedCount === 0) return res.status(404).json({ message: 'Not found' });
  const updated = await blog.findOne({ _id: new ObjectId(id) });
  res.json(updated);
});

    // UPDATE donation request by ID
    app.patch('/createdonation/users/:id', async (req, res) => {
      try {
        const id = new ObjectId(req.params.id);
        const result = await createdonation.updateOne({ _id: id }, { $set: req.body });
        if (!result.matchedCount) return res.status(404).json({ message: 'Not found' });
        const updated = await createdonation.findOne({ _id: id });
        res.json(updated);
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
      }
    });



    // DELETE donation request by ID
    app.delete('/createdonation/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await createdonation.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Donation request not found' });
        }
        res.status(200).json({ message: 'Donation request successfully deleted' });
      } catch (error) {
        console.error('Error deleting donation request:', error);
        res.status(500).json({ error: 'Failed to delete donation request' });
      }
    });

    // CREATE new user (check duplicate by email)
    app.post('/userall', async (req, res) => {
      const user = req.body;
      const existingUser = await userCollectionall.findOne({ email: user.email });
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      const result = await userCollectionall.insertOne(user);
      res.status(201).json(result);
    });

    // GET all users
    app.get('/userall', async (req, res) => {
      const result = await userCollectionall.find().toArray();
      res.send(result);
    });

    // GET user by email
    app.get('/userall/:email', async (req, res) => {
      const email = req.params.email.toLowerCase();
      const query = { email };
      const result = await userCollectionall.findOne(query);
      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(result);
    });

    // UPDATE user by email
    app.put('/userall/:email', async (req, res) => {
      const email = req.params.email.toLowerCase();
      const updatedData = req.body;
      const result = await userCollectionall.updateOne(
        { email },
        { $set: updatedData }
      );
      res.send(result);
    });

    // GET all divisions
    app.get('/division', async (req, res) => {
      const result = await divisions.find().toArray();
      res.send(result);
    });

    // GET districts by division name query
    app.get('/district', async (req, res) => {
      const { division } = req.query;
      if (!division) {
        return res.status(400).json({ message: 'Division is required' });
      }
      const divisionData = await divisions.findOne({ name: division });
      if (divisionData) {
        res.send(divisionData.districts);
      } else {
        res.status(404).json({ message: 'Division not found' });
      }
    });

    // GET upazilas by district name query
    app.get('/upazila', async (req, res) => {
      const { district } = req.query;
      if (!district) {
        return res.status(400).json({ message: 'District name is required' });
      }
      const divisionData = await divisions.findOne({
        "districts.name": district
      });
      if (!divisionData) {
        return res.status(404).json({ message: 'District not found in any division' });
      }
      const districtData = divisionData.districts.find(d => d.name === district);
      if (!districtData) {
        return res.status(404).json({ message: 'District data not found' });
      }
      res.json(districtData.upazilas);
    });

    // GET blood groups
    app.get("/bloodgroup", async (req, res) => {
      const result = await bloodData.find().toArray();
      res.send(result);
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Uncomment this if you want to close connection when server stops
    // await client.close();
  }
}
run().catch(console.dir);

// Default route
app.get('/', (req, res) => {
  res.send('Blood Donation Server is Running');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
