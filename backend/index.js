// 首先加载环境变量
require('dotenv').config();

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
// const bodyParser = require("body-parser")

// 导入路由
const feedbackRoutes = require('./routes/feedback');
const aiRoutes = require('./routes/aiRoutes');
const Routes = require("./routes/route.js")
const chatbotRoutes = require('./routes/chatbot');

const app = express()
const PORT = process.env.PORT || 5000

// 路由配置
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/ai', aiRoutes); // 新增AI功能路由

// app.use(bodyParser.json({ limit: '10mb', extended: true }))
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

app.use(express.json({ limit: '10mb' }))
app.use(cors())

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
