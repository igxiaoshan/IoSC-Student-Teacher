require('dotenv').config();

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const app = express()
const Routes = require("./routes/route.js")
const chatbotRoutes = require('./routes/chatbot');
const feedbackRoutes = require('./routes/feedback');

const PORT = process.env.PORT || 5000

app.use(express.json({ limit: '10mb' }))
app.use(cors())

app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatbotRoutes);

// mongoose
//     .connect(process.env.MONGO_URL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     })
//     .then(console.log("Connected to MongoDB"))
//     .catch((err) => console.log("NOT CONNECTED TO NETWORK", err))

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.log("❌ NOT CONNECTED TO NETWORK", err));


app.use('/', Routes);

app.listen(PORT, () => {
    console.log(`Server started at port no. ${PORT}`)
})
