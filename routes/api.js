/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect        =   require('chai').expect;
var MongoClient   =   require('mongodb').MongoClient;
var ObjectId      =   require('mongodb').ObjectId;
var unirest       =   require('unirest');



module.exports = function (app,db) {
  
  
  app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });
  
  app.route('/api/stock-prices')
    .get((req,res)=>{
      db.collection('stockprices').find({}).toArray((err,result)=>{
        if(err){
          res.send('Error at route:/api/stock-prices .get .toArray');
        }
        else if(result){
          res.send({"stockData":result});
        }
        else{
          res.send('Couldn\'t get stockprices database');
        }
      }) 
    })
    
    .post(function (req, res,next){
      if(req.body.stock){
        let xFor = req.header('x-forwarded-for').split(',');
        let ipAddress = xFor[0];
        let sym = req.body.stock;
        let symbol = sym.toUpperCase();
        
        let incNum = 0;
        
        db.collection('stockapp-ips').findOne({ipAddress:symbol},(err,result)=>{
          if(err){
            res.send('Error at route:/api/stock-prices stockapp-ips .post .findOne');
          }
          else if(result){
            console.log('ip found')
            incNum = 0;
          }
          else{
            if(req.body.like){
              incNum = 1;
              db.collection('stockapp-ips').insertOne({ipAddress:symbol})
            }
            else{
              incNum = 0;
            }
          }
        })
        
        
        
        unirest.get("https://investors-exchange-iex-trading.p.rapidapi.com/stock/"+sym+"/delayed-quote")
        .header("X-RapidAPI-Host", "investors-exchange-iex-trading.p.rapidapi.com")
        .header("X-RapidAPI-Key", "d084c7547fmsh2836d38b6ddaf16p17e0a5jsnf1cd1f2801be")
        .end(function (resjson) {
          let price = resjson.body.delayedPrice;
          if(price){
            db.collection('stockprices').findOne({"stock":symbol},(err,result)=>{
              if(err){
                res.send('Error at route:/api/stock-prices .post1 .findOne');
              }
              else if(result){
                let resLikes = 0;
                if(typeof result.likes==='number'){
                  console.log('result.likes is number');
                  resLikes = result.likes + incNum;
                  db.collection('stockprices').findOneAndUpdate({"stock":symbol},{$set:{"price":price},$inc:{"likes":incNum}});
                  res.send({"stockData":{"stock":symbol, "price":price, "likes":resLikes}})
                }
                else{
                  console.log('result.likes isn\'t number');
                  resLikes = incNum;
                  db.collection('stockprices').findOneAndUpdate({"stock":symbol},{$set:{"price":price,"likes":incNum}});
                  res.send({"stockData":{"stock":symbol, "price":price, "likes":resLikes}})
                }
              }
              else{
                db.collection('stockprices').insertOne({"stock":symbol,"price":price,"likes":incNum})
                let resLikes = incNum;
                res.send({"stockData":{"stock":symbol, "price":price, "likes":resLikes}})
              }
            })
          }
          else{
            res.send('Invalid stock symbol input');
          }
          
        });                                                                                          
      }
      else{
        let sym1    = req.body.stockcompare1;
        let symbol1 = sym1.toUpperCase();
        let sym2    = req.body.stockcompare2;
        let symbol2 = sym2.toUpperCase();
        
        let xFor = req.header('x-forwarded-for').split(',');
        let ipAddress = xFor[0];
        
        let incNum1 = 0;
        let incNum2 = 0;
        
        db.collection('stockapp-ips').findOne({ipAddress:symbol1},(err,result)=>{
          if(err){
            res.send('Error at route:/api/stock-prices stockapp-ips .post .findOne');
          }
          else if(result){
            console.log('ip found')
            incNum1 = 0;
          }
          else{
            if(req.body.like){
              incNum1 = 1;
              db.collection('stockapp-ips').insertOne({ipAddress:symbol1})
            }
            else{
              incNum1 = 0;
            }
          }
        })
        
        db.collection('stockapp-ips').findOne({ipAddress:symbol2},(err,result)=>{
          if(err){
            res.send('Error at route:/api/stock-prices stockapp-ips .post .findOne');
          }
          else if(result){
            console.log('ip found')
            incNum2 = 0;
          }
          else{
            if(req.body.like){
              incNum2 = 1;
              db.collection('stockapp-ips').insertOne({ipAddress:symbol2})
            }
            else{
              incNum2 = 0;
            }
          }
        })
        
        
        let stockArray = [];
        
        var like1=0;
        var like2=0;
        
        unirest.get("https://investors-exchange-iex-trading.p.rapidapi.com/stock/"+sym1+"/delayed-quote")
        .header("X-RapidAPI-Host", "investors-exchange-iex-trading.p.rapidapi.com")
        .header("X-RapidAPI-Key", "d084c7547fmsh2836d38b6ddaf16p17e0a5jsnf1cd1f2801be")
        .end(function (resjson) {
          let price1 = resjson.body.delayedPrice;
          
            db.collection('stockprices').findOne({"stock":symbol1},(err,result)=>{
              if(err){
                console.log('Error at route:/api/stock-prices .post2 .findOne1')
                res.send('Error at route:/api/stock-prices .post2 .findOne1');
              }
              else if(result){
                like1 = result.likes + incNum1;
                db.collection('stockprices').findOneAndUpdate({"stock":symbol1},{$set:{"price":price1},$inc:{"likes":incNum1}});
                stockArray.push({"stock":symbol1, "price":price1})
              }
              else{
                like1 = incNum1;
                db.collection('stockprices').insertOne({"stock":sym1,"price":price1,"likes":incNum1})
                stockArray.push({"stock":symbol1, "price":price1})
              }
            })
          
          console.log('stock1 end')
          
          unirest.get("https://investors-exchange-iex-trading.p.rapidapi.com/stock/"+sym2+"/delayed-quote")
          .header("X-RapidAPI-Host", "investors-exchange-iex-trading.p.rapidapi.com")
          .header("X-RapidAPI-Key", "d084c7547fmsh2836d38b6ddaf16p17e0a5jsnf1cd1f2801be")
          .end(function (resjson) {
            let price2 = resjson.body.delayedPrice;
            
            
              db.collection('stockprices').findOne({"stock":symbol2},(err,result)=>{
                if(err){
                  console.log('Error at route:/api/stock-prices .post2 .findOne2')
                  res.send('Error at route:/api/stock-prices .post2 .findOne2');
                }
                else if(result){
                  like2 = result.likes + incNum2;
                  db.collection('stockprices').findOneAndUpdate({"stock":symbol2},{$set:{"price":price2},$inc:{"likes":incNum2}});
                  stockArray.push({"stock":symbol2, "price":price2})
                }
                else{
                  like2 = incNum2;
                  db.collection('stockprices').insertOne({"stock":symbol2,"price":price2,"likes":incNum2});
                  stockArray.push({"stock":symbol2, "price":price2});
                }
               
                console.log('stock2 end')
                stockArray[0].rel_likes=like1-like2;
                stockArray[1].rel_likes=like2-like1;
                res.send({"stockData":stockArray}); 
            
                
            })
            
          
          })
            
            
          
        })
        
     
            
        }
        
      
    })
    
};
