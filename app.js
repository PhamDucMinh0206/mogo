const express = require('express')
const hbs = require('hbs')
const session = require('express-session');


var app = express();

app.use(session({
    resave: true, 
    saveUninitialized: true, 
    secret: 'abcc##$$0911233$%%%32222', 
    cookie: { maxAge: 60000 }}));

app.set('view engine','hbs')

var MongoClient = require('mongodb').MongoClient;
var url =  "mongodb+srv://phanminh:phanminh01234@cluster0.iu7dz.mongodb.net/test";

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'))

var dsNotToDelete = ['ao','quan','bep','my goi'];

const dbHandler = require('./databaseHandler')


//search chinh xac=> tim gan dung
app.post('/search', async (req,res)=>{
    const searchText = req.body.txtName;
    const results =  await dbHandler.searchSanPham(searchText,"SanPham");
    res.render('allProduct',{model:results})
})

app.post('/update',async (req,res)=>{
    const id = req.body.id;
    const nameInput = req.body.txtName;
    const priceInput = req.body.txtPrice;
    const newValues ={$set : {name: nameInput,price:priceInput}};
    const ObjectID = require('mongodb').ObjectID;
    const condition = {"_id" : ObjectID(id)};
    
    const client= await MongoClient.connect(url);
    const dbo = client.db("phanminhDB");
    await dbo.collection("SanPham").updateOne(condition,newValues);
    if(priceInput.trim().length ==0 || (isNaN(priceInput)==true || priceInput <=10)){
        res.render('edit',{priceError: 'Price k phai la so hoac lon hon 10'})
     }else{
        res.redirect('/view');
    }
    
})
app.get('/delete',async (req,res)=>{
    const id = req.query.id;
    var ObjectID = require('mongodb').ObjectID;
    const condition = {"_id" : ObjectID(id)};

    const client= await MongoClient.connect(url);
    const dbo = client.db("phanminhDB");
    const productToDelete = await dbo.collection("SanPham").findOne(condition);
    const index = dsNotToDelete.findIndex((e)=>e==productToDelete.name);
    if (index !=-1) {
        res.end('khong the xoa vi sp dac biet: ' + dsNotToDelete[index])
    }else{
        await dbo.collection("SanPham").deleteOne(condition);
        res.redirect('/view');
    }   
})

app.get('/edit',async (req,res)=>{
    const id = req.query.id;
    var ObjectID = require('mongodb').ObjectID;
    const condition = {"_id" : ObjectID(id)};

    const client= await MongoClient.connect(url);
    const dbo = client.db("phanminhDB");
    const productToEdit = await dbo.collection("SanPham").findOne(condition);
    res.render('edit',{product:productToEdit})
})

app.get('/view',async (req,res)=>{
    const results =  await dbHandler.searchSanPham('',"SanPham");
    var userName ='Not logged In';
    if(req.session.username){
        userName = req.session.username;
    }
    res.render('allProduct',{model:results,username:userName})
})

app.post('/doInsert', async (req,res)=>{
    const nameInput = req.body.txtName;
    const priceInput = req.body.txtPrice;
    const newProduct = {name:nameInput, price:priceInput, size : {dai:20, rong:40}}
    await dbHandler.insertOneIntoCollection(newProduct,"SanPham");
     if(priceInput.trim().length ==0 || (isNaN(priceInput)==true || priceInput <=10)){
        res.render('insert',{priceError: 'Price k phai la so hoac lon hon 10'})
     }else{
        res.render('index')
    }
    
})
app.get('/register',(req,res)=>{
    res.render('register')
})
app.get('/login',(req,res)=>{
    res.render('login')
})
app.post('/login',async (req,res)=>{
    const nameInput = req.body.txtName;
    const passInput = req.body.txtPassword;
    const found = await dbHandler.checkUser(nameInput,passInput);
    if(found){
        req.session.username = nameInput;
        res.render('index',{loginName:nameInput})       
    }else{
        res.render('index',{errorMsg:"Login failed!"})
    }
})
app.post('/doRegister',async (req,res)=>{
    const nameInput = req.body.txtName;
    const passInput = req.body.txtPassword;
    const newUser = {username:nameInput,password:passInput};
    await dbHandler.insertOneIntoCollection(newUser,"users");
    if (nameInput.indexOf("@")== -1){
          res.render('register', {nameError: "Missing @, Please refill your account"})
    }
    else{
        res.redirect('/login');
    }
    
})
app.get('/insert',(req,res)=>{
    res.render('insert')
})
app.get('/#',(req,res)=>{
    res.redirect('login');
})

app.get('/',(req,res)=>{
    var userName ='Not logged In';
    if(req.session.username){
        userName = req.session.username;
    }
    res.render('index',{loginName:userName})
})

var PORT = process.env.PORT || 3000;
app.listen(PORT);
console.log('Server is running at: '+ PORT);