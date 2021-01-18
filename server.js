const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')


const server = jsonServer.create()

const router = jsonServer.router('./db.json')

//const userdb = JSON.parse(fs.readFileSync('./user.json', 'UTF-8'))

// const userdb = JSON.parse(fs.readFile('./user.json', 'UTF-8' , (err, data) => {
//   if (err) {
//     console.error(err)
//     return
//   }
//   console.log(data)
//   return data;
// }))


server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())

const SECRET_KEY = '123456789'
const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload){
    return jwt.sign(payload, SECRET_KEY, {expiresIn})
  }
  
  // Verify the token 
  function verifyToken(token){
    return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
  }
  
  // Check if the user exists in database
  function isAuthenticated({email, password}){
    const userdb = JSON.parse(fs.readFileSync('./user.json', 'UTF-8'))
    return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
  }

  //Read db.json
  server.post('/api/products', (req, res) => {

    fs.readFile("./db.json", (err, data) => { 
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
     
      // const status = 200
      // const message = "Success";
      // res.status(status).json({status, message})
      var data = JSON.parse(data.toString());
      console.log(data);
      res.status(200).json({data})
    })
  })

  //Registeration
  server.post('/auth/register', (req, res) => {
    console.log("register endpoint called; request body:");
    console.log(req.body);
    const {name, email, password} = req.body;
  
    if(isAuthenticated({email, password}) === true) {
      const status = 401;
      const message = 'Email and Password already exist';
      res.status(status).json({status, message});
      return
    }
  
  fs.readFile("./user.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
  
      // Get current users data
      var data = JSON.parse(data.toString());
  
      // Get the id of last user
      var last_item_id = data.users[data.users.length-1].id;
  
      //Add new user
      data.users.push({id: last_item_id + 1,name:name, email: email, password: password}); //add some data
      var writeData = fs.writeFile("./user.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({status, message})
            return
          }
      });
  });
  
  // Create token for new user
    const access_token = createToken({email, password})
    console.log("Access Token:" + access_token);
    res.status(200).json({access_token})
  })

  server.post('/auth/login', (req, res) => {
      console.log(req.body);
    const {email, password} = req.body
    if (isAuthenticated({email, password}) === false) {
      const status = 401
      const message = 'Incorrect email or password'
      res.status(status).json({status, message})
      return
    }
    const access_token = createToken({email, password})
    res.status(200).json({access_token})
  })

  server.use(/^(?!\/auth).*$/,  (req, res, next) => {
    if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
      const status = 401
      const message = 'Bad authorization header'
      res.status(status).json({status, message})
      return
    }
    try {
       verifyToken(req.headers.authorization.split(' ')[1])
       next()
    } catch (err) {
      const status = 401
      const message = 'Error: access_token is not valid'
      res.status(status).json({status, message})
    }
  })

  server.use(router)


  server.listen(3004, () => {
    console.log('Run Auth API Server')
  })