/*
/ Salesforce / Zendesk Sync
/ Version: 1.3
/ Author: Joe Pikowski
/ Company: Sailthru
/ Date: November 2015
*/

//node start.js [limit] [offset]

var limit = process.argv[2] ? process.argv[2] : 200;
var offset = process.argv[3] ? process.argv[3] : 0;

var salesforce = require("./lib/salesforce.js");
var zendesk = require("./lib/zendesk.js");
var salesforcesync = require("./lib/salesforcesync.js");
//var cronJob = require("cron").CronJob;

var sfs = new salesforcesync();

//Run It On a Cron [Disabled! Now on 'crontab -e']
//new cronJob("0 0 9,14,22 * * *",sfs.syncRecords.bind(sfs),null,true);

//Run It Once
sfs.syncRecords(limit,offset);
