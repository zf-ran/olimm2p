const express = require('express');
const app = express();

const path = require('path');

//* Database 
const { neon } = require('@neondatabase/serverless');

const { PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const sql = neon(`postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
	res.render('index');
});

//* APIs 
// const xxxRoutes = require('/routes/xxx');
// 
// app.use(
// 	'/api',
// 	(req, _res, next) => {
// 		// Inject database.
// 		req.sql = sql;
// 		next();
// 	},
// 	xxxRoutes,
// );

//* Listen 
const PORT = process.env.PORT;
app.listen(PORT, async () => {
	console.log('Server is ready! With port', PORT);
});