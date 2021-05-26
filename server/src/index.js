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
//npm install --save bcrypt --2021-05-27
/////////////////////////////////////////////////////
// html request 받기위해 start @@@@@@
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// html request 받기위해 end @@@@@@
var db_config = require(__dirname + '/database.js');// 2020-09-13
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
    try{
      console.log('######### index.js 119 get_user_info_json ######### '+req.cookies.user_idx+' #########');
      res.render('pages/login', get_user_info_json(req.cookies.user_idx));
    }catch(e){
        // alert(e);
    }
  }
});

function get_user_info_json(user_idx) {
  let sync_connection = new sync_mysql(db_config.constr());
  let result = sync_connection.query("SELECT a.id,a.name,email,role,status,avatar ,CAST((SELECT balance FROM accounts WHERE user_id=a.id) as DECIMAL(20)) as POT FROM users a WHERE a.id='" + user_idx + "'");
  let user_id = result[0].id;
  let user_name = result[0].name;
  let user_avata = result[0].avata;
  let user_POT = result[0].POT; // 2020-01-04 DB change

  var render_json = new Object();
  render_json.title = "title";
  render_json.user_id = user_id;
  render_json.user_name = user_name;
  render_json.user_avata = user_avata;
  render_json.user_POT = user_POT;
  // console.log('166 #########'+render_json);
  return render_json;
}
// #############################################

app.post('/', function (req, res) {
  var param_user_idx = req.body.user_idx;
  try{
    console.log('index.js 178 get_user_info_json '+param_user_idx);  
    res.render('pages/login', get_user_info_json(param_user_idx));
  }catch(e){
      // alert(e);
  }
});


// // post 로 넘어 오면 !!! 게임
app.use('/ulogin', cookieParser(process.env.COOKIE_SECRET));
app.post('/ulogin', function (req, res) {
  // var md5 = require('md5'); 2021-05-27 delete
  var param_username = req.body.username;
  var param_password = req.body.password;
  console.log('요청 파라미터 >> username : ' + param_username);

  var conn = db_config.init();//2020-09-13
  db_config.connect(conn);

  var sql = "SELECT a.id,a.name,email,role,status,avatar,password ,CAST((SELECT balance FROM accounts WHERE user_id=a.id) as DECIMAL(20)) as POT FROM users a WHERE email='" + param_username + "' "; // and password ='" + md5(param_password) + "'
  // console.log(sql);
  conn.query(sql, function (err, rows, fields) {
    if (err) {
      console.log('query is not excuted. select fail...\n' + err);
      res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
      res.end("<h1>error. query is not excuted </h1>");
      res.sendFile(STATIC_PATH + '/ulogin.html')
    }
    else {

      if (rows.length > 0) {
        var user_dbpwd = rows[0].password;
        console.log('index 168 #user_dbpwd : '+user_dbpwd+' // param_password : '+param_password); //
        var bcrypt = require('bcrypt');
        user_dbpwd = user_dbpwd.replace(/^\$2y(.+)$/i, '$2a$1');
        if(bcrypt.compareSync(param_password, user_dbpwd)){
          console.log('login ok');
        }else{
          console.log('login fail...\n' + err);
          res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
          res.end("<h1>error. login fail password maybe wrong </h1>");
          res.sendFile(STATIC_PATH + '/ulogin.html')
          // res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
          // res.end("<script>alert('password maybe wrong');document.location.href='/';</script>");
        }
        let user_idx  = rows[0].id;
        let user_ip   = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        res.cookie('user_idx', user_idx); // 2020-01-27

        // login 성공
        if (req.cookies.pre_sid == "" || req.cookies.pre_sid === undefined) {
          console.log('################ index.js 253 빈폼 날리기  ################');
          res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
          res.end("<html lang='en'><head><title>temp</title></head><body onload='document.frm.submit();'><form id='frm' name='frm' method='post' action='/'><input type='hidden' name='user_idx' id='user_idx' value='"+user_idx+"'><input type='hidden' name='loginok' id='loginok' value='loginok'></form></body></html>");
        } else {
          let sid = req.cookies.pre_sid;
          console.log('################ index.js 260  /sessionn 뒤 존재 cookies sid : '+sid+' ################');
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

