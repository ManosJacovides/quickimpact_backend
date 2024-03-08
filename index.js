const express = require('express');
const cookieSession=require('cookie-session');
const bodyParser = require("body-parser");
const cors=require("cors");
const passport=require('passport');
const authRoute=require("./routes/auth");// redirects to the auth.js code
const app=express();
const mysql=require('mysql2');
const db=mysql.createPool({
    host: 'localhost',
    user:'root',
    password: 'bmxgoofs',
    database:'quickImpactDB',
});



const userIdFromDb=require("./passport"); // redirects to the passport.js code and assigns
//https://www.youtube.com/watch?v=7K9kDrtc4S8
app.use(cookieSession(
    {name:"session",
    keys:["quickimpact"],
    maxAge: 24*60*60*100 //1 day
    }
));
//app.use(passport.authenticate('session')) // ADDED THIS from here to make sure we get a req.user!! https://stackoverflow.com/questions/74401195 passportjs-req-user-is-undefined-not-deserializing, but it turns out it is equivalent to app.use(passport.session()); i just needed to have it earlier in the code...

app.use(passport.session());
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true, // Allow cookies to be sent with requests
  }));
app.use("/auth", authRoute);
app.use(passport.initialize());
//app.use(passport.session());


app.use(bodyParser.urlencoded({extended:true}));





//We Define the function that allows to calculate the inputs impacts when we import a new input from frontend. This will be used in the api/edit and api/insert routes for inputs
const calculateInputImpact = (idemat2024,eF,value)=>{
 //Before insterting, we need to calculate the impact of the main emission factors for the input, using the idemat2024 table
    //This is to find the values for eFUnit, efGHG, inputGHGImpact (AND THEN ADD OTHER IMPACTS)
    var eFUnit="NO MATCH";
    
   var efGHG=0.0;
   var inputGHGImpact=578;

   var efPEF=0.0;
   var inputPEFImpact=0;

   var ef=0.0;
   var inputImpact=0;



   var efNamesImpact={CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0};

    // Find the entry in idemat2024 where the Process column matches the value of eF
    const matchingEntry = idemat2024.find(entry => entry.Process === eF);
    console.log(matchingEntry);
    // If a matching entry is found, weretrieve the value of the Unit column
    // and assign it to the eFUnit variable
    if (matchingEntry) {
    
        eFUnit = matchingEntry.Unit;
        

        for (let key in efNamesImpact) { // WE MAKE A LOOP ON ALL EF names (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)

        const valueNumber =matchingEntry[key].replace(",", "."); //we convert , to . 
        ef=parseFloat(valueNumber.replace(/\s/g, "").replace(/"/g, "")); // We remove the spaces (\s) and then the quaotations from the initial string taken in indemat, and convert to float.
        inputImpact=ef*value; 
        inputImpact=Math.round(inputImpact * 1e10) / 1e10;

        efNamesImpact[key]=inputImpact
        //console.log(efNamesImpact)


        }

        
       

       //CALCULATION OF GHG IMPACT for edit menus
        var valueNumberGHG =matchingEntry.CarbonFootprint_kgGHGeq.replace(",", "."),
        efGHG=parseFloat(valueNumberGHG.replace(/\s/g, "").replace(/"/g, "")); // We remove the spaces (\s) and then the quaotations from the initial string
        inputGHGImpact=efGHG*value;
        //To make sure we don't have more than 10 numbers after the decimal to match SQL database type
        efGHG=Math.round(efGHG * 1e10) / 1e10; 
        inputGHGImpact=Math.round(inputGHGImpact * 1e10) / 1e10;

        //CALCULATION OF PEF IMPACT (SIMILAR)
        const valueNumberPEF =matchingEntry.pefTotal_pt.replace(",", "."); //we convert , to . 
        efPEF=parseFloat(valueNumberPEF.replace(/\s/g, "").replace(/"/g, "")); // We remove the spaces (\s) and then the quaotations from the initial string taken in indemat, and convert to float.
        inputPEFImpact=efPEF*value; 
        inputPEFImpact=Math.round(inputPEFImpact * 1e10) / 1e10;





        console.log("INPUT PEF EF RETRIEVED)",efPEF)
        console.log("INPUT PEF IMPACT CALCULATED)",inputPEFImpact)
        console.log("EFNAMES FINAL",efNamesImpact)


             
    } else {
        console.log(`No entry found in idemat2024 where Process equals ${eF}`);
    }

 return {inputGHGImpact,eFUnit, efGHG,inputPEFImpact, efNamesImpact };

}


    






// WE Populate idematEFs with all the data form the idemat table so we can access it faster inside the backend
const idemat2024 = [];
const sqlSelectIdemat2024 = "SELECT * FROM idemat2024";
db.query(sqlSelectIdemat2024, (err, results) => {
    if (err) {
        console.error("Error retrieving data from idemat2024 table:", err);
    } else {
        // Assign the result to the idematEFs variable
        idemat2024.push(...results);
        console.log("idemat2024 data retrieved successfully");
    }
});



app.get("/",(req,res)=>{
    res.send("<h1>Success</h1>");});



//To send the DB INPUT information to frontend : MAYBE WE SHOULD ADAPT SO WE GET THE ID PROJECT FROM FRONTEND AND WE FILTER IN BACKEND AN `D SEND ONLY RELEVANT DATA....
app.get('/api/get', (req,res)=>{
    const sqlSelect="SELECT * FROM Inputs";
    db.query(sqlSelect, (err, result)=>{
        
        res.send(result);
        })

});





app.get('/api/getTotalResults', (req,res)=>{
    var results=  {
        SOL: {
            BOL: {
                CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
            },
            MOL: {
                CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
            },
            EOL: {
                CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
          },
          TOTAL: {
            CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
        }
          
        },
        REF: {
          BOL: {
            CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
          },
          MOL: {
            CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
          },
          EOL: {
            CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
        },
        TOTAL: {
            CarbonFootprint_kgGHGeq:0,pefTotal_pt:0, Acidification_pt:0,Climate_change_pt:0,Ecotoxicity_freshwater_pt:0,Particulate_matter_pt:0,Eutrophication_marine_pt:0,Eutrophication_freshwater_pt:0,Eutrophication_terrestrial_pt:0,Human_toxicity_cancer_pt:0,Human_toxicity_non_cancer_pt:0,Ionising_radiation_pt:0,Land_use_pt:0,Ozone_depletion_pt:0,Photochemical_ozone_formation_pt:0,Resource_use_fossils_pt:0,Resource_use_minerals_metals_pt:0,Water_use_pt:0
      },
      
      
      },
      INDIVIDUAL: [{
        name:" ",
        solutionReference:" ",
        category:"",
        GHGImpact:0,
        PEFImpact:0,
    },{
        name:" ",
        solutionReference:" ",
        category:"",
        GHGImpact:0,
        PEFImpact:0,
    }]
        
      }

    const projectID = parseInt(req.query.variable); // We retrieve the project ID sent by the front end.
    console.log("BACKEND RECEIVED ORDER TO MAKE CALCULATION FOR PROJECT ID", projectID)
    
    const sqlSelect='SELECT * FROM Inputs WHERE inputProjectID=?';
    db.query(sqlSelect,[projectID], (err, result)=>{

        //console.log("DB QUERY RESULTT",result)
       
        

       // First we check that result is not null (and iterable) otherwise, we get an error
       if (result != null && typeof result[Symbol.iterator] === 'function'){
       
        for (input of result){
            console.log("INPUT X=",input)


            var {inputGHGImpact, eFUnit, efGHG,inputPEFImpact,efNamesImpact}=calculateInputImpact(idemat2024,input.eF,input.value); // WE CALCULATE THE IMPACT FOR THE EMISSIONS FACTORs

            calculated_results=efNamesImpact;
            console.log("CALCULATED_RESULTS IS:",efNamesImpact) //calculated_results
            console.log("INPUT GHG IMPACT IS:",inputGHGImpact)
            // //THIS SHOULD HAVE ALL THE RESULTS CALCUATED FOR ALL EFs
            //const calculated_results={CarbonFootprint_kgGHGeq:30,pefTotal_pt:30, Acidification_pt:22,Climate_change_pt:1,Ecotoxicity_freshwater_pt:1,Particulate_matter_pt:1,Eutrophication_marine_pt:1,Eutrophication_freshwater_pt:1,Eutrophication_terrestrial_pt:1,Human_toxicity_cancer_pt:1,Human_toxicity_non_cancer_pt:1,Ionising_radiation_pt:1,Land_use_pt:1,Ozone_depletion_pt:1,Photochemical_ozone_formation_pt:1,Resource_use_fossils_pt:1,Resource_use_minerals_metals_pt:1,Water_use_pt:1}

            

            switch (true) {

                //MY PRODUCT CALC
                case (input.category==='BOL' && input.solutionReference==='My Product' ):
                    // Calculate all impacts (GHG, PEF, etc) and increment the reesults object


                    for (let key in calculated_results) { // WE MAKE A LOOP ON ALL EF (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)
                        // Check if final_results has the same key as calculated results, if it does, we make the operations required
                        if (results.SOL.BOL.hasOwnProperty(key)) {
                            // Assign the value from calculated_results to final_results
                            results.SOL.BOL[key] =results.SOL.BOL[key]+calculated_results[key];

                        }
                    }
                    console.log(results);
                    //OLD CODE WHEN A LOOP WAS NOG NEEDED AND WE ONLY DID GHG AND PEF
                    // results.SOL.BOL.GHG=results.SOL.BOL.GHG+inputGHGImpact; //WE ADD TO THE TOTAL RESULTS THE GHG CONTRIBUTION OF THE INPUT IN BOL
                    // results.SOL.BOL.PEF=results.SOL.BOL.PEF+inputPEFImpact;//WE ADD TO THE TOTAL RESULTS THE PEF CONTRIBUTION OF THE INPUT IN BOL





                    //We add the input in the individual section of results, for granularity results
                    results.INDIVIDUAL.push({
                        name:input.name,
                        solutionReference:input.solutionReference,
                        category:input.category,
                        GHGImpact:inputGHGImpact,
                        PEFImpact:inputPEFImpact,
                    });
                    
                    break;

                case (input.category==='MOL' && input.solutionReference==='My Product' ):

                
                for (let key in calculated_results) { // WE MAKE A LOOP ON ALL EF (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)
                    // Check if final_results has the same key as calculated results, if it does, we make the operations required
                    if (results.SOL.MOL.hasOwnProperty(key)) {
                        // Assign the value from calculated_results to final_results
                        results.SOL.MOL[key] =results.SOL.MOL[key]+calculated_results[key];
                    }}
                    // results.SOL.MOL.GHG=results.SOL.MOL.GHG+inputGHGImpact; //WE ADD TO THE TOTAL RESULTS THE GHG CONTRIBUTION OF THE INPUT IN MOL
                    // results.SOL.MOL.PEF=results.SOL.MOL.PEF+inputPEFImpact;//WE ADD TO THE TOTAL RESULTS THE PEF CONTRIBUTION OF THE INPUT IN MOL

                    //We add the input in the individual section of results, for granularity results
                    results.INDIVIDUAL.push({
                        name:input.name,
                        solutionReference:input.solutionReference,
                        category:input.category,
                        GHGImpact:inputGHGImpact,
                        PEFImpact:inputPEFImpact,
                    });
                    
                    break;

                case (input.category==='EOL' && input.solutionReference==='My Product' ):

                for (let key in calculated_results) { // WE MAKE A LOOP ON ALL EF (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)
                    // Check if final_results has the same key as calculated results, if it does, we make the operations required
                    if (results.SOL.EOL.hasOwnProperty(key)) {
                        // Assign the value from calculated_results to final_results
                        results.SOL.EOL[key] =results.SOL.EOL[key]+calculated_results[key];
                    }}
                    // results.SOL.EOL.GHG=results.SOL.EOL.GHG+inputGHGImpact; //WE ADD TO THE TOTAL RESULTS THE GHG CONTRIBUTION OF THE INPUT IN EOL
                    // results.SOL.EOL.PEF=results.SOL.EOL.PEF+inputPEFImpact;//WE ADD TO THE TOTAL RESULTS THE PEF CONTRIBUTION OF THE INPUT IN EOL

                    //We add the input in the individual section of results, for granularity results
                    results.INDIVIDUAL.push({
                        name:input.name,
                        solutionReference:input.solutionReference,
                        category:input.category,
                        GHGImpact:inputGHGImpact,
                        PEFImpact:inputPEFImpact,
                    });
                   
                    break;


                //REFERENCE CALC
                    case (input.category==='BOL' && input.solutionReference==='Reference' ):

                    for (let key in calculated_results) { // WE MAKE A LOOP ON ALL EF (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)
                        // Check if final_results has the same key as calculated results, if it does, we make the operations required
                        if (results.REF.BOL.hasOwnProperty(key)) {
                            // Assign the value from calculated_results to final_results
                            results.REF.BOL[key] =results.REF.BOL[key]+calculated_results[key];
                        }}
                        // results.REF.BOL.GHG=results.REF.BOL.GHG+inputGHGImpact; //WE ADD TO THE TOTAL RESULTS THE GHG CONTRIBUTION OF THE INPUT IN BOL, for REF
                        // results.REF.BOL.PEF=results.REF.BOL.PEF+inputPEFImpact;//WE ADD TO THE TOTAL RESULTS THE PEF CONTRIBUTION OF THE INPUT IN BOL

                        //We add the input in the individual section of results, for granularity results
                    results.INDIVIDUAL.push({
                        name:input.name,
                        solutionReference:input.solutionReference,
                        category:input.category,
                        GHGImpact:inputGHGImpact,
                        PEFImpact:inputPEFImpact,
                    });
                    ;
                    break;

                case (input.category==='MOL' && input.solutionReference==='Reference'):

                for (let key in calculated_results) { // WE MAKE A LOOP ON ALL EF (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)
                    // Check if final_results has the same key as calculated results, if it does, we make the operations required
                    if (results.REF.MOL.hasOwnProperty(key)) {
                        // Assign the value from calculated_results to final_results
                        results.REF.MOL[key] =results.REF.MOL[key]+calculated_results[key];
                    }}
                    // results.REF.MOL.GHG=results.REF.MOL.GHG+inputGHGImpact; //WE ADD TO THE TOTAL RESULTS THE GHG CONTRIBUTION OF THE INPUT IN MOL, for REF
                    //     results.REF.MOL.PEF=results.REF.MOL.PEF+inputPEFImpact;//WE ADD TO THE TOTAL RESULTS THE PEF CONTRIBUTION OF THE INPUT IN MOL

                        //We add the input in the individual section of results, for granularity results
                        results.INDIVIDUAL.push({
                            name:input.name,
                            solutionReference:input.solutionReference,
                            category:input.category,
                            GHGImpact:inputGHGImpact,
                            PEFImpact:inputPEFImpact,
                        });
                   
                    break;
                case (input.category==='EOL' && input.solutionReference==='Reference' ):
                    for (let key in calculated_results) { // WE MAKE A LOOP ON ALL EF (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)
                        // Check if final_results has the same key as calculated results, if it does, we make the operations required
                        if (results.REF.EOL.hasOwnProperty(key)) {
                            // Assign the value from calculated_results to final_results
                            results.REF.EOL[key] =results.REF.EOL[key]+calculated_results[key];
                        }}
                    // results.REF.EOL.GHG=results.REF.EOL.GHG+inputGHGImpact; //WE ADD TO THE TOTAL RESULTS THE GHG CONTRIBUTION OF THE INPUT IN EOL, for REF
                    //     results.REF.EOL.PEF=results.REF.EOL.PEF+inputPEFImpact;//WE ADD TO THE TOTAL RESULTS THE PEF CONTRIBUTION OF THE INPUT IN EOL

                        //We add the input in the individual section of results, for granularity results
                        results.INDIVIDUAL.push({
                            name:input.name,
                            solutionReference:input.solutionReference,
                            category:input.category,
                            GHGImpact:inputGHGImpact,
                            PEFImpact:inputPEFImpact,
                        });
                    
                    break;

              
                default:
                    // Default case if 'type' doesn't match any of the defined cases
                    console.log('ERROR IN ESTIMATING IMACT OF INPUT:', input);
            }
            
            //Now in order for the pie graphs to be aligned, it's important that the individual datas are in order: BOL, then MOL, then EOL

            results.INDIVIDUAL = [...results.INDIVIDUAL].sort((a, b) => { //FUNCTION THAT REORDERS AN ARRAY BASED ON A PRIORITY RULE
                const order = { BOL: 1, MOL: 2, EOL: 3 };
                return order[a.category] - order[b.category];
              });
            
            
           


            
            
           





        }

        //After the For Loop, we can now calculate the TOTAL impacts

        for (let key in results.REF.TOTAL) { // WE MAKE A LOOP ON ALL EF (SO WE WANT TO DO THE SAME FOR GHG; PEF; ACIDIFICATION; ETC::)
            // Check if final_results has the same key as calculated results, if it does, we make the operations required
          
                results.REF.TOTAL[key] =results.REF.BOL[key] +results.REF.MOL[key] +results.REF.EOL[key] 
                
                results.SOL.TOTAL[key] =results.SOL.BOL[key] +results.SOL.MOL[key] +results.SOL.EOL[key]//ITS THE SAME KEYs AS REF SO WE CAN INCLUDE SOL IN THE SAME LOOP

            }

//OLD CODE FOR GHG AND PEF ONLY (NO LOOP)
        // results.REF.TOTAL.GHG=results.REF.EOL.GHG+results.REF.MOL.GHG+results.REF.BOL.GHG
        // results.REF.TOTAL.PEF=results.REF.EOL.PEF+results.REF.MOL.PEF+results.REF.BOL.PEF

        // results.SOL.TOTAL.GHG=results.SOL.EOL.GHG+results.SOL.MOL.GHG+results.SOL.BOL.GHG
        // results.SOL.TOTAL.PEF=results.SOL.EOL.PEF+results.SOL.MOL.PEF+results.SOL.BOL.PEF

    

        //WE send the total result to backend
        res.send(results);
        console.log(results);

    }
        
        
        
    })

});



//To send the IDEMAT information to frontend, 
app.get('/api/getidemat', (req,res)=>{
        
   res.send(idemat2024);
});


//To send the Porjects table to frontend, 
app.get('/api/getprojects', (req,res)=>{
    const sqlSelectProject="SELECT * FROM Projects";
    db.query(sqlSelectProject, (err, result)=>{
        
        res.send(result);
        })
 });








//TO get INSERT INFORMATION from frontend everytime we submit a new EF
app.post("/api/insert",(req,res)=>{
    const name=req.body.name;

    const solutionReference=req.body.solutionReference;
    const unit=req.body.unit;
    const inputProjectID=req.body.inputProjectID;

    const eF=req.body.eF;
    const value=req.body.value;
    const category=req.body.category;
    const comments=req.body.comments;


//     // Before insterting, we need to calculate the impact of the main emission factors for the input, using the idemat2024 table
//     //This is to find the values for eFUnit, efGHG, inputGHGImpact (AND THEN ADD OTHER IMPACTS)
//     var eFUnit="NO MATCH";
//     var efGHG=0.0;
//    var inputGHGImpact=0;



//     // Find the entry in idemat2024 where the Process column matches the value of eF
//     const matchingEntry = idemat2024.find(entry => entry.Process === eF);
//     console.log(matchingEntry);
//     // If a matching entry is found, weretrieve the value of the Unit column
//     // and assign it to the eFUnit variable
//     if (matchingEntry) {

        
//         eFUnit = matchingEntry.Unit;
//         //Do same for efGHG and inputGHGImpact
//         //efGHG=parseFloat(matchingEntry.CarbonFootprint_kgGHGeq.replace(",", "."));
        
//         const valueNumber =matchingEntry.CarbonFootprint_kgGHGeq.replace(",", ".");
       
      
//         efGHG=parseFloat(valueNumber.replace(/\s/g, "").replace(/"/g, "")); // We remove the spaces (\s) and then the quaotations from the initial string taken in indemat, and convert to float
        
       
//         inputGHGImpact=efGHG*value;
//         //To make sure we don't have more than 10 numbers after the decimal to match SQL database type
//         efGHG=Math.round(efGHG * 1e10) / 1e10; 
//         inputGHGImpact=Math.round(inputGHGImpact * 1e10) / 1e10;

//         console.log(inputGHGImpact);
        


        
        
//     } else {
//         console.log(`No entry found in idemat2024 where Process equals ${eF}`);
//     }

var {inputGHGImpact, eFUnit, efGHG, x}=calculateInputImpact(idemat2024,eF,value);

    




    const sqlInsert="INSERT INTO Inputs (name, eF, value, category, unit, solutionReference, inputProjectID,eFUnit,efGHG,inputGHGImpact, comments) VALUES(?,?,?,?,?,?,?,?,?,?,?);"
    db.query(sqlInsert, [name,eF,value,category, unit, solutionReference, inputProjectID,eFUnit,efGHG,inputGHGImpact, comments], (err, result)=>{console.log(err)}
    
    )

});


//To insert a new project to DB

app.post("/api/insertproject",(req,res)=>{

    

    //const id=req.body.id;
    const projectName=req.body.projectName;
    const projectUserID=req.body.projectUserID;
    const description=req.body.description;
    const numberofalternatives=req.body.numberofalternatives;
    const midpoints=req.body.midpoints;

    const sqlInsert="INSERT INTO Projects (projectName, projectUserID, description, numberofalternatives, midpoints) VALUES(?,?,?,?,?);"
    db.query(sqlInsert, [projectName, projectUserID, description, numberofalternatives, midpoints], (err, result)=>{console.log(err)}
    
    )

});















//TO edit INFORMATION from frontend everytime we edit an input line
app.post("/api/edit",(req,res)=>{
    const name=req.body.name;

    const solutionReference=req.body.solutionReference;
    const unit=req.body.unit;
    const inputProjectID=req.body.inputProjectID;

    const eF=req.body.eF;
    const value=req.body.value;
    const category=req.body.category;
    const idInputs=req.body.idInputs;
    const comments=req.body.comments;

//We calculate the input impact, the ef unit and ef ghg impact using our custom function
    var {inputGHGImpact, eFUnit, efGHG,x}=calculateInputImpact(idemat2024,eF,value);
    console.log("EDITED INPUT GHG IMPACT",inputGHGImpact);


    


    const sqlUpdate = "UPDATE Inputs SET name=?, inputProjectID=?, eF=?, value=?, category=?, unit=?, solutionReference=?, inputGHGImpact=?, eFUnit=?, efGHG=?, comments=? WHERE idInputs=?";

    db.query(sqlUpdate, [name,inputProjectID, eF, value, category, unit, solutionReference, inputGHGImpact, eFUnit, efGHG, comments, idInputs], (err, result) => {
        if (err) {
            console.error("Error updating dataA:", err);
        } else {
            console.log("Data updated successfullyY");
            console.log(idInputs);
        }
    });

});

//Same but to edit a project from the project menu

app.post("/api/editproject",(req,res)=>{
   

    const id=req.body.id;
    const projectName=req.body.projectName;
    const projectUserID=req.body.projectUserID;
    const description=req.body.description;
    const numberofalternatives=req.body.numberofalternatives;
    const midpoints=req.body.midpoints;
    const projectNotes=req.body.projectNotes; //ADDED IN ORDER TO MANAGE PROJECT NOTES

    console.log("APP POST EDIT PROJECT TRIGGERED");

    const sqlUpdate = "UPDATE Projects SET projectName=?, projectUserID=?, description=?, numberofalternatives=?, midpoints=?, projectNotes=? WHERE id=?";

    db.query(sqlUpdate, [projectName, projectUserID, description, numberofalternatives, midpoints, projectNotes, id], (err, result) => {
        if (err) {
            console.error("Error updating data:", err);
        } else {
            console.log("PROJECT updated successfullyY");
            
           
        }
    });

});


//TO DELETE an insert
app.delete("/api/delete", (req, res) => {
    const idInputs = req.body.idInputs;

    const sqlDelete = "DELETE FROM Inputs WHERE idInputs = ?";

    db.query(sqlDelete, [idInputs], (err, result) => {
        if (err) {
            console.error("Error deleting data:", err);
            res.status(500).json({ error: "An error occurred while deleting data" });
        } else {
            console.log("Data deleted successfully");
            
        }
    });
});

//TO DELETE a project
app.delete("/api/deleteproject", (req, res) => {
    const id = req.body.id;

    const sqlDelete = "DELETE FROM Projects WHERE id= ?";

    db.query(sqlDelete, [id], (err, result) => {
        if (err) {
            console.error("Error deleting data:", err);
            res.status(500).json({ error: "An error occurred while deleting data" });
        } else {
            console.log("Data deleted successfully");
            
        }
    });
});



 



app.listen(3001, ()=>{
    console.log("running on port 3001")


});