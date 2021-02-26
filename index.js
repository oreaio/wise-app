require('dotenv').config();
const express = require('express');
const app = express();
const moment = require("moment");
const Request = require('request');
const mysql = require('mysql');
const cheerio = require("cheerio");
const cheerioTableparser = require('cheerio-tableparser');

function returnLimits(str) {
    const total = str.match(/[+-]?([0-9]*[.])?[0-9]+/);
    if (total) return total[0];
    console.error("Bad package name", str);
};

app.use(express.static('public'));

app.get('/account/:tel', (req, res) => {
        const connection = mysql.createConnection({
            host: 'wise-isp.com',
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB,
            charset: 'utf8mb4'
		});
		const tel = req.params.tel || '';
		const sql1 = "SET CHARACTER SET utf8";
        connection.connect();
        connection.query(sql1, function(err, result) {
            const sql = "SET SESSION collation_connection ='utf8_general_ci";
            connection.query(sql, function(err, result) {});
        });
        connection.query("select convert( cast(convert(FirstName using  latin1) as binary) using utf8) as name, `group` as package, UserName, Phone, expdate, Tag, convert( cast(convert(Address using  latin1) as binary) using utf8) as Address from userdata where Phone=" + tel,
            (error, results, fields) => {
                if (!error && results.length ) {
                    const package = results[0].package.split("-");
                    results[0].speed = package[1];
                    results[0].limit = returnLimits(package[2]) + 'G';
                    results[0].type = Number(returnLimits(package[2])) > 5 ? 'Monthly' : 'Daily';
                	return res.json(results);
                }
               return res.status(404).end();
            }
        );
        connection.end();
    });


app.get('/reports/:username/?:days', (req, res) => {
		const request = Request.defaults({jar: true});
		const username = req.params.username;
		const numDays = req.params.days;

		request.post(
			{
				url:'https://wise-isp.com/viewer/',
				followRedirect: true,
				followAllRedirects: true,
				jar: true,
				timeout: 60000,
		form: {
			login: process.env.RAD_USER,
			password: process.env.RAD_PASS,
			Login: 'Login'
		}},  (err, httpRes, body) => {
			const from = moment.utc().subtract(numDays, "days").format("YYYY-MM-DD");
			const to = moment.utc().add(1, "day").format("YYYY-MM-DD");
			request.post({
				jar: true,
				url: "https://wise-isp.com/backend/user_traffic_data.php",
				form: {
					txtFindUser: username,
					stat_type: "by_day",
					date1: from,
					date2: to
				}
			},  (err, httpRes, body) => {
				if(!err){
					request.post({url: "https://wise-isp.com/viewer/", form: {
						Logout: 1
					}});
					const reports = [];
					const $ = cheerio.load(body);
					cheerioTableparser($);
					const data = $(".genericTable").parsetable(true, true, true);
					data[0].shift();
					data[1].shift();
					data[2].shift();
					for(var i = 0; i < data[0].length; i++){
					      reports.push({
					        date: data[0][i],
					        upload: data[1][i],
					        download: data[2][i]
					      });
					   }
					res.json( reports.reverse() );
				} else {
					console.log(err);
					res.notFound();
				}
			});
		})
	});

app.listen(process.env.PORT, () => {
  console.log(`running on port ${process.env.PORT}`);
});
