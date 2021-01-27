const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
var sync_mysql = require('sync-mysql'); //2020-01-28
// // if you ever want to do the https stuff through express (rather than nginx, or whatever) uncomment this
// var https = require('https');
// var fs = require('fs');

// var options = {
//     cert: fs.readFileSync(__dirname + '/cert/cloudpoker_io.crt'),
//     ca: fs.readFileSync(__dirname + '/cert/cloudpoker_io.ca-bundle'),
//     key: fs.readFileSync(__dirname + '/cert/example_com.key')
// };

//instantiate server
const app = express();
const port = process.env.PORT || 8080;
app.set('port', port);

const server = http.createServer(app);
// const server = https.createServer(options, app);

//socket setup
const { setSio } = require("./sio");
setSio(require('socket.io')(server));

// initializeSocket(server);
//ejs
app.set('views', path.join(__dirname, '../views'));

app.set('view engine', 'ejs');
//middleware
app.use(cors());
app.use(express.json());
app.use('/client', express.static(__dirname + '/../../client'));
app.use('/sharedjs', express.static(__dirname + '/sharedjs'));
//handling login
// #############################################
// const loginRouter = require('./routes/login');
// app.use(loginRouter);
// #############################################

//#region ######### 2021-01-01 mod user login start #########
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//node ./server/src/index.js
///home/dev/cloudpoker/server/src/database.js
/////////// 2020-12-30 추가 ///////////
// cd ~/cloudpoker/server
//npm install mysql 
//npm install --save md5
// cd D:\pokerSrc\cloudpoker\server\src
// d:
// node index.js

//D:\pokerSrc\cloudpoker\common
//database.js

// redis mysql start
//sudo docker start dingrr
//sudo docker start ems_mysql
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//npm install mysql
//npm install ejs
//cd ~/cloudpoker/server
//npm install --save express-session
// 2020-01-02 session  cd ~/cloudpoker/server
//npm install --save express-mysql-session
//npm install --save cookie-parser
//npm install --save express-error-handler
//npm install --save md5
//npm i body-parser 2021-01-02 html request 받기위해 

/////////////////////////////////////////////////////
// html request 받기위해 start @@@@@@
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// html request 받기위해 end @@@@@@
var db_config = require(__dirname + '/database.js');// 2020-09-13

// var session = require('express-session');  // 2020-01-02 session 
// var MySQLStore = require('express-mysql-session')(session);  // 2020-01-02 session 
// var sessionStore = new MySQLStore(db_config.constr());   // 2020-01-02 session 
// app.use(session({
//   secret: "ctpSessionk@y",
//   resave: false,
//   saveUninitialized: true,
//   store: sessionStore
// }));   // 2020-01-02 session 

// var user_id = ""; // user idx
// var user_name = ""; // user email
// var user_nick = ""; // user 닉네임
// var user_avata = ""; // user 아바타 Default N
// var user_level = 0; // 접속한 후 _levelUpTime 분당 + 1
// var user_ip = "";
// var user_CTP = "0"; // CTP valance
// var user_CTP_address = ""; // CTP 입금 주소
// var user_POT = "0"; // CTP * 100
var md5 = require('md5');

// #############################################
app.use(express.static('public'));
const STATIC_PATH = path.join(__dirname, '../public')
app.use('/', cookieParser(process.env.COOKIE_SECRET));
app.get('/', function (req, res) {
  // if (req.session.user_id == "" || req.session.user_id === undefined) {
  if (req.cookies.user_idx == "" || req.cookies.user_idx === undefined) {
    res.sendFile(STATIC_PATH + '/ulogin.html')
    return;
  }
  else {
    // res.render('pages/login', get_user_info_json(user_id));
    console.log('index.js 119 get_user_info_json '+req.cookies.user_idx);
    res.render('pages/login', get_user_info_json(req.cookies.user_idx));
  }
});

function get_user_info_json(user_idx) {
  let sync_connection = new sync_mysql(db_config.constr());
  let result = sync_connection.query("SELECT * FROM users WHERE id='" + user_idx + "'");
  let user_id = result[0].id;
  let user_name = result[0].username;
  let user_nick = result[0].nick;
  let user_avata = result[0].avata;
  let user_level = result[0].user_level;
  let user_CTP = parseFloat(result[0].CTP).toFixed(2);
  let user_POT = result[0].POT; // 2020-01-04 DB change
  let user_CTP_address = result[0].CTP_address;
  // sync_connection = null;
  // var conn = db_config.init();//2020-09-13
  // db_config.connect(conn);
  // var sql = "SELECT * FROM users WHERE id='" + user_idx + "'";
  // conn.query(sql, function (err, rows, fields) {
  //   if (err) { console.log('get_user_info_json fail...\n' + err); }
  //   else {
  //     if (rows.length > 0) {
  //       user_id = rows[0].id;
  //       user_name = rows[0].username;
  //       user_nick = rows[0].nick;
  //       user_avata = rows[0].avata;
  //       user_level = rows[0].user_level;
  //       user_CTP = rows[0].CTP;
  //       user_CTP = parseFloat(user_CTP).toFixed(2);
  //       user_POT = rows[0].POT; // 2020-01-04 DB change
  //       user_CTP_address = rows[0].CTP_address;
  //     }
  //   }
  // });

  var render_json = new Object();
  render_json.title = "title";
  render_json.user_id = user_id;
  render_json.user_name = user_name;
  render_json.user_nick = user_nick;
  render_json.user_avata = user_avata;
  render_json.user_level = user_level;
  render_json.user_CTP = user_CTP;
  render_json.user_CTP_address = user_CTP_address;
  render_json.user_POT = user_POT;
  console.log('177 #########'+render_json);
  return render_json;
}
// #############################################

app.post('/', function (req, res) {
  var param_user_idx = req.body.user_idx;
  console.log('index.js 170 get_user_info_json '+param_user_idx);  
  res.render('pages/login', get_user_info_json(param_user_idx));
  // res.render('pages/login', get_user_info_json(param_user_idx));
});


// // post 로 넘어 오면 !!! 게임
app.use('/ulogin', cookieParser(process.env.COOKIE_SECRET));
app.post('/ulogin', function (req, res) {
  var md5 = require('md5');
  var param_username = req.body.username;
  var param_password = req.body.password;
  console.log('요청 파라미터 >> username : ' + param_username);

  var conn = db_config.init();//2020-09-13
  db_config.connect(conn);
  var sql = "SELECT a.* , (SELECT IFNULL(sum(minuteCnt),0) FROM tbl_game WHERE game_idx='3' and user_idx=a.id) as user_level FROM users a WHERE username ='" + param_username + "' and password ='" + md5(param_password) + "'";
  // console.log(sql);
  conn.query(sql, function (err, rows, fields) {
    if (err) {
      console.log('query is not excuted. select fail...\n' + err);
      res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
      res.end("<h1>error. query is not excuted </h1>");
      res.sendFile(STATIC_PATH + '/ulogin.html')
    }
    else {
      //res.render('list.ejs', {list : rows});
      //console.log( 'select ok - ' + sql);
      //for(var i=0; i<rows.length; i++){ console.log(i+':i / '+rows[i].username +'-'+ rows[i].CTP_address +'-'+ rows[i].id +'-'+ rows[i].nick); }
      if (rows.length > 0) {
        // user_id = rows[0].id;
        // user_name = rows[0].username;
        // user_nick = rows[0].nick;
        // user_avata = rows[0].avata;
        // user_level = rows[0].user_level;
        // user_CTP = rows[0].CTP;
        // user_CTP = parseFloat(user_CTP).toFixed(2);
        // user_POT = rows[0].POT; // 2020-01-04 DB change
        // user_CTP_address = rows[0].CTP_address;
        // console.log('유저CTP:' + user_CTP);
        // console.log('유저레벨:'+user_level);
        let user_idx  = rows[0].id;
        let user_ip   = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

        res.cookie('user_idx', user_idx); // 2020-01-27
        // req.session.user_id = user_id; // 2020-01-02 session 
        // req.session.user_name = user_name; // 2020-01-02 session 
        // req.session.user_nick = user_nick; // 2020-01-02 session 
        // req.session.user_avata = user_avata; // 2020-01-02 session 
        // req.session.user_level = user_level; // 2020-01-02 session 
        // req.session.user_CTP = user_CTP; // 2020-01-02 session 
        // req.session.user_CTP_address = user_CTP_address; // 2020-01-02 session 
        // req.session.user_POT = user_POT; // 2020-01-02 session 

        //   intervalLvUpFunc();
        var sql2 = " ";
        sql2 = sql2 + " INSERT INTO `tbl_game`(`game_idx`, `user_idx`, `user_coin`, `coin_address`, `yyyymmdd`, `ip`) ";
        sql2 = sql2 + " VALUES (3,?,'CTP',?,CURDATE()+0,?) ";
        sql2 = sql2 + " ON DUPLICATE KEY UPDATE minuteCnt = minuteCnt + 1, last_time=now() "; //무조건 +1 되는 버그로 Merge 문 X 
        var params = [rows[0].id, rows[0].CTP_address, user_ip];
        conn.query(sql2, params, function (err, rows2, fields2) {
          if (err) {
            console.log(err);
            //conn.release();
          } else {
            console.log('merge success !!!!');
            // console.log(rows2);
            //conn.release();
          }
        });
        // login 성공
        // res.writeHead("200", {"Content-Type":"text/html;charset=utf-8"});
        // res.end(indexPage(user_id,user_nick,user_avata,user_level)); 
        //세션 스토어가 이루어진 후 redirect를 해야함.  // 2020-01-02 session 
        // req.session.save(function () {
        //   // session saved
        //   // console.log('session.save err :' + err);
        // });

        if (req.cookies.pre_sid == "" || req.cookies.pre_sid === undefined) {
          res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
          res.end("<html lang='en'><head><title>temp</title></head><body onload='document.frm.submit();'><form id='frm' name='frm' method='post' action='/'><input type='hidden' name='user_idx' id='user_idx' value='"+user_idx+"'><input type='hidden' name='loginok' id='loginok' value='loginok'></form></body></html>");
          // res.end("<script>document.location.href='/';</script>");
          // res.render('pages/login', get_user_info_json(user_id,user_name,user_nick,user_avata,user_level,user_CTP,user_CTP_address,user_POT));
        } else {
          let sid = req.cookies.pre_sid;
          console.log('################ index.js cookies sid : '+sid+' ################');
          res.cookie('pre_sid', ""); // diff url 
          res.redirect('/session/' + sid); //최초 링크대로 전달 bug fix
        }

      } else {
        res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
        res.end("<script>alert('password maybe wrong');document.location.href='/';</script>");
        //   res.sendFile(STATIC_PATH + '/ulogin.html')
      }
    }
  });
})


////#endregion  ######### 2021-01-01 mod user login end #########

//handling sessions
const sessionRouter = require('./routes/session');
app.use('/session', sessionRouter);

//handling board
const boardRouter = require('./routes/list');
app.use('/list', boardRouter);

// Starts the server.
server.listen(port, function () {
  console.log(`Starting server on port ${port}`);
});

// 404 pages
app.use(function (req, res) {
  res.status(404).render('pages/404');
});

