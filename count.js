/*
/ Salesforce Client ID Record Count 
/ Author: Joe Pikowski
/ Company: Sailthru
/ Date: November 2015
*/

var salesforce = require("./lib/salesforce.js");

//Run It Once
salesforce().getCountClientID(function(err,res){
    console.log("Requesting Records with a Client ID from Salesforce.");
    if (err){
        console.log("Bad Response from Salesforce API: ",err);
    }else{
        try{
            console.log(res.records[0].expr0+" Records Found with a Client ID!");
        }catch(err){
            console.log("Bad Return from Salesforce API: ",err);
        }
    }
});

/*
 * Return Looks like This:
 *
 * { totalSize: 1,
 *   done: true,
 *     records: [ { attributes: [Object], expr0: 736 } ] }
 *     
 */
