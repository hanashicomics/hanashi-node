const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userroutes');
const signupRoutes = require('./routes/signuproutes');
const loginRoutes = require('./routes/loginroutes');
const homeRoutes = require('./routes/homeroutes');
const refreshRoutes = require('./routes/refreshroutes');
const blogRoutes = require('./routes/blogroutes');
const wordofdayroutes = require('./routes/wordofdayroutes');

//load env vars
dotenv.config();

const app = express();

// app.use(cors({
//     origin: `${process.env.CORS_ALLOWED_URL}`,
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true
// }));

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})

app.set('view engine','hbs');
app.use(bodyParser.json());
app.use('/api/users/edit',userRoutes);
app.use('/api/users/signup',signupRoutes);
app.use('/api/users/login',loginRoutes);
app.use('/api/blogs',blogRoutes);
app.use('/api/wordofday',wordofdayroutes);
app.use('/api/users/refresh',refreshRoutes);
app.use('/',homeRoutes);