const express = require('express')
const app = express()
const { Pool } = require('pg')
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
const session = require('express-session')
const port = process.env.PORT || 8080

let db ;

if (process.env.NODE_ENV === 'production') {

  db = new Pool({
  connectionString : process.env.DATABASE_URL,
  ssl : {
    rejectUnauthorized : false
  }
  })
} else {

  db = new Pool({
    database: 'babyapp'
  })
}

app.set('view engine','ejs')



app.use(express.static('public'))
app.use(express.urlencoded({ extended:true }))

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method
    delete req.body._method
    return method
  }
}))
app.use(expressLayouts)

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized : true}))

app.use((req,res,next) => {
  if (req.session.userId) {
    res.locals.isLoggedIn = true

    let sql = `select * from users where id = $1`

    db.query(sql, [req.session.userId], (err,dbRes) => {
      res.locals.currentUser = dbRes.rows[0]
      //console.log(dbRes.rows[0]);
      next()
    })
  } else {
    res.locals.isLoggedIn = false
    res.locals.currentUser = {}
    next()
  }
})



app.get('/', (req,res) => {
  res.render('home')
})

app.get('/signup', (req,res) => {
  res.render('signup')
})

app.post('/signupform', (req,res) => {
  let email = req.body.email
  let password = req.body.password
  let babyName = req.body.baby_name

  bcrypt.genSalt(10, (err, salt) => {

    //step 2
    bcrypt.hash(password, salt, (err, passwordDigest) => {
      
      let sql = `insert into users (email,password_digest,baby_name) values ('${email}','${passwordDigest}','${babyName}');`
  
      //step 3
      db.query(sql, (err,dbRes) => {
        console.log(err); //null is good, means no error
        res.render('home')
      })
    });
  });
})

app.post('/login', (req,res) => {
  let email = req.body.email
  let password = req.body.password
  //check whether user exist in the database
  let sql = `select * from users where email = $1;`
  //lets check by finding the user
  db.query(sql, [email], (err,dbRes) => {
    console.log(err);

    if (dbRes.rows.length === 0) {
      //no user record found
      res.render('home')
      return
    }

    let user = dbRes.rows[0]
    

    bcrypt.compare(password, user.password_digest, (err,result) => {
      // console.log((err));

      if (result) {
        
        req.session.userId = user.id
        res.redirect('/home')
        
        
      } else {
        res.render('home')
      }
    })  
    
    
  }) 
})

app.get('/details/add', (req,res) => {
  
  res.render('add-details')
})

app.post('/details/add', (req,res) => {
  let image = req.body.image_url 
  let comment = req.body.comment
  let date = req.body.date
  let user_id = req.session.userId
  
  let sql = `insert into babytracker (image_url,comment,date,user_id) values ($1,$2,$3,$4);`

  db.query(sql, [image,comment,date,user_id], (err,dbRes) => {
    res.redirect('/home')
     
    })
    
  })

app.get('/home', (req,res) => {
  db.query(`select * from babytracker where user_id=$1;`, [req.session.userId],(err,dbRes) => {
    let details = dbRes.rows
    console.log(err);
    res.render('main', {details:details})

  })
})



app.get('/details/:id', (req,res) => {
  let sql = `select * from babytracker where id = $1;`

  db.query(sql, [req.params.id], (err,dbRes) => {
    let details = dbRes.rows[0]
    res.render('details', {details: details})
  })
})

app.get('/details/edit/:id', (req,res) => {
  let sql = `select * from babytracker where id = $1;`

  db.query(sql, [req.params.id], (err,dbRes) => {
    let details = dbRes.rows[0]
    res.render('edit-form', {details: details})
  })
  
})

app.put('/details/edit/:id', (req,res) => {
  let image = req.body.image_url 
  let comment = req.body.comment
  let date = req.body.date 
  let id = req.params.id
  
  let sql = `update babytracker set image_url=$1, comment = $2, date = $3 where id = $4;`

  db.query(sql, [image,comment,date,id], (err,dbRes) => {
    
      console.log(err);
      res.redirect(`/details/${req.params.id}`)
    })
    
  })

  app.delete('/delete/:id', (req,res) => {
    let sql = `delete from babytracker where id = $1;`

    db.query(sql, [req.params.id], (err,dbRes) => {
      
      res.redirect('/home')
      
    })
  })

app.delete('/logout', (req,res) => {
  req.session.userId = undefined
  res.redirect('/')
})




app.listen(port)