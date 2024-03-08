const router=require("express").Router();
const express = require('express');
const app=express();
const passport = require("passport");

const mysql=require('mysql2');
const db=mysql.createPool({
    host: 'localhost',
    user:'root',
    password: 'bmxgoofs',
    database:'quickImpactDB',
});




router.get("/google", passport.authenticate("google", {scope:["profile","email"]}));
router.get("/google/callback", passport.authenticate("google",{successRedirect:"http://localhost:3000/lcapage/project" , failureRedirect:"login/failed"}))


router.get("/github", passport.authenticate("github", {scope:["profile","email"]}));
router.get("/github/callback", passport.authenticate("github",{successRedirect:"http://localhost:3000/lcapage/project" , failureRedirect:"login/failed"}))

router.get("/login/success", (req,res)=>{
    console.log("LOGIN SUCCESS TRIGGERED")
    console.log(req.user);
    if(req.user){


        idToCheck=req.user.id;
        origin=req.user.provider;
        console.log("ORIGIN:", origin);
        const sqlSelect = "SELECT id FROM Users WHERE OauthID = ? AND Origin = ? ";
        db.query(sqlSelect, [idToCheck, origin], (err, result) => {
            if (err) {
              console.error("Error checking ID existence:", err);
              callback(err, null);
            } else {
              if (result.length > 0) { //IF USER EXISTS IN THE BACKEND; THEN WE SIMPLY RETRIEVE HIS ID AND SEND IT TO FRONTED
                  // User exists in the database
                  console.log("User exists:", result);
                  idFromDb=result[0].id;
              
  
                  // Perform actions for existing user
                  // For example, you can fetch user data or redirect somewhere


                  //WE RETURN THE USER  GIVEN BY GOOGLE/GITHUB AND THE USER ID TAKEN FROM BACKEND

                  res.status(200).json({
                    success: true,
                    message: "succesfull",
                    user: req.user,
                    userId: idFromDb,
                    cookies: req.cookies,
                });
              } else {// IF User does not exist in the database, WE NEED TO CREATE HIM, RETRIEVE HIS ID AND SEND IT TO FRONTED
                  
                  console.log("User does not exist, we created user in DB");
  
                  //const email=profile.emails[0].value

                  const OauthID=idToCheck;
                    const Origin=origin;
                    const Name=origin==="google"?req.user.displayName:(req.user.username); // Different structure depending if it is google or github
                    const Email=origin==="google"?req.user.emails[0].value:(req.user.profileUrl);//req.user.email;""
                    //console.log("test email", req.user.emails[0].value);
                 

                    const sqlInsert="INSERT INTO Users (OauthID, Origin, Name, Email) VALUES(?,?,?,?);"
                    db.query(sqlInsert, [OauthID, Origin, Name, Email], (err, result)=>{

        
                            if (err) {
                                console.log(err);
                            } else {
                                // Get the ID of the last inserted row
                                const insertedId = result.insertId;
                                console.log("Inserted ID:", insertedId);
                                            
                                idFromDb=insertedId;

                                res.status(200).json({
                                    success: true,
                                    message: "succesfull",
                                    user: req.user,
                                    userId: idFromDb,
                                    cookies: req.cookies,
                });
                            }}

                    
                    
                    )
                 



              }
      
      }})






      
  
    }
})

router.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("http://localhost:3000");



});
router.get("/login/failed", (req,res)=>{
    res.status(401).json({
        success: false,
        message: "failure",
    })
})



module.exports=router