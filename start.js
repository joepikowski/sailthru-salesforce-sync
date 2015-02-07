/*
/ Salesforce / Zendesk Sync
/ Version: 1.0
/ Author: Joe Pikowski
/ Company: Sailthru
/ Date: February 2015
*/

var salesforce = require("./lib/salesforce.js");
var zendesk = require("./lib/zendesk.js");
var salesforcesync = require("./lib/salesforcesync.js");
var cronJob = require("cron").CronJob;

var sfs = new salesforcesync();

//Run It On a Cron
//new cronJob("0 */1 * * * *",sfs.syncRecords.bind(sfs),null,true);

//Run It Once
sfs.syncRecords();
