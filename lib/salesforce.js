var config = require("../config/config.js");
var salesforce = require("jsforce");

//Class Declaration

function Salesforce(){
	this.c = config.salesforce;
	this.sf = new salesforce.Connection();
    this.accountParams = ["Id","Name","Client_ID__c","Website","OwnerId","Executive_Sponsor__c","Client_Relationship_Status__c","Project_Manager__c","Account_Tier__c"];
}

module.exports = function(){ 
    return new Salesforce(); 
};

//API Methods

Salesforce.prototype.getAllAccounts = function(callback){
	this.sf.login(this.c.user,this.c.pw,queryAccounts.bind(this));

	function queryAccounts(err,res){
	    this.sf.query("SELECT " + this.accountParams.toString() + " FROM Account WHERE Client_Id__c != null",callback);

Salesforce.prototype.getCountClientID = function(callback){
	this.sf.login(this.c.user,this.c.pw,queryAccounts.bind(this));

	function queryAccounts(err,res){
	    this.sf.query("SELECT COUNT(Id) FROM Account WHERE Client_Id__c != null",callback);
	}
};

Salesforce.prototype.getUserById = function(id,callback){
	this.sf.login(this.c.user,this.c.pw,queryUser.bind(this));

	function queryUser(err,res){
    	this.sf.query("SELECT Id,Name FROM User WHERE Id = '"+id+"'",callback);
	}
};
