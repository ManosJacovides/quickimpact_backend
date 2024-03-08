
const passport=require('passport');
const express = require('express');
const app=express();

const mysql=require('mysql2');
const db=mysql.createPool({
    host: 'localhost',
    user:'root',
    password: 'bmxgoofs',
    database:'quickImpactDB',
});

const GOOGLE_CLIENT_ID="366415380412-latg5l0lq2mjbftlr0er7ni7c89csl2d.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET="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"; //ATTENTION; UDE ENV FILE IF DEPLOYING APP, FOR SECURITY

const GITHUB_CLIENT_ID="a89065b08638b87bfa12";
const GITHUB_CLIENT_SECRET="77edeeb7efc08b25c72aa296a21b1487f9e7d480"; //ATTENTION; UDE ENV FILE IF DEPLOYING APP, FOR SECURITY




//https://www.passportjs.org/packages/passport-google-oauth20/
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;


var idFromDb=585;



passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback",
    passReqToCallback:true,
  },


//   async (req,accessToken,refreshToken,profile, cb)=>{

//     await newUser=profile.name.givenName;
//     console.log(profile.name)
//   }


  function(req, accessToken, refreshToken, profile, done){//cb) {
    //User.findOrCreate({ googleId: profile.id }, function (err, user) {     CODE TO UPDSTE DB WITH USER?
      //return cb(err, user);
      done(null,profile);

      //console.log(profile.name.givenName);



      //If we wanted to save user in DB:
    //   const user ={
    //     username: profile.displayName,
    //     avatar:profile.photos[0]
    //   }
      //user.save...etc
    


}

    
  
));



passport.use(new GithubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/github/callback",
    passReqToCallback:true,
  },


//   async (req,accessToken,refreshToken,profile, cb)=>{

//     await newUser=profile.name.givenName;
//     console.log(profile.name)
//   }

  function(req, accessToken, refreshToken, profile, done){//cb) {
    //User.findOrCreate({ googleId: profile.id }, function (err, user) {     CODE TO UPDSTE DB WITH USER?
      //return cb(err, user);
      done(null,profile);

      console.log(profile.name.givenName);



      //If we wanted to save user in DB:
    //   const user ={
    //     username: profile.displayName,
    //     avatar:profile.photos[0]
    //   }
      //user.save...etc
    }

    
  
));

passport.serializeUser((user,done)=>{done(null,user)});

passport.deserializeUser((user,done)=>{done(null,user)});




