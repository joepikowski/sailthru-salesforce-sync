var salesforce = require("./salesforce.js");
var zendesk = require("./zendesk.js");
var url = require("url");

//Class Declaration

function SalesforceSync(){
    this.updates = {};
}

module.exports = function(){
	return new SalesforceSync();
};

//Class Methods

SalesforceSync.prototype.syncRecords = function(limit,offset,callback){
    console.log("Starting Sync for Limit: "+limit+" and Offset: "+offset);
    this.getSFOrgs(limit,offset,this.getZDMatches.bind(this,callback));
};

SalesforceSync.prototype.getSFOrgs = function(limit,offset,callback){
    salesforce().getAllAccounts(limit,offset,callback);
};

SalesforceSync.prototype.getZDMatches = function(callback,err,res){
    if (err){
        console.log("Bad Response from Salesforce API: ",err);
    }else{
        try{
            var sfOrgs = res.records;
            sfOrgs.forEach(getZDOrg.bind(this));

            function getZDOrg(elem,ind,arr){
                zendesk().getOrg(elem.Name,this.compareRecords.bind(this,elem,callback));
            }
        }catch(err){
            console.log("Bad Return from Salesforce API: ",err);
        }
    }
};

SalesforceSync.prototype.compareRecords = function(sf,callback,err,res){
    if (err){
        console.log("[Error] Could not find Zendesk Match for "+sf.Name+" "+sf.Client_ID__c);
    }else{
        try{
            var zd = res[0];

            var fields = ["ClientID","Domain","CSM","PM","ExecSponsor","RelationshipStatus"];

            this.updates[zd.name] =  { 
                "organization": {
                    "id": zd.id,
                    "organization_fields": {}
                },
                "check_total": fields.length,
                "updates_made": 0
            };

            fields.forEach(syncAll.bind(this));

            function syncAll(elem,ind,arr){
                this["sync"+elem](sf,zd);
            }

        }catch(err){
            this.updates[zd.name].check_total--;
            console.log("[Error] Could Not Process SF Record "+sf.Name,err);
        }
    }
};

// Sync Functions

SalesforceSync.prototype.checkSubmit = function(zd){
    if (this.updates[zd.name].check_total === this.updates[zd.name].updates_made && this.updates[zd.name].updates_made !== 0){
       try{
            var data = JSON.stringify(this.updates[zd.name]);
            zendesk().updateOrg(zd.id,data,this.verifyZDUpdate.bind(this,zd));
        }catch(err){
            console.log("[Error] Could Not Update Zendesk Org "+zd.name,err);
        }
    }
};

SalesforceSync.prototype.verifyZDUpdate = function(zd,err,res){
    if (err){
        console.log("[Error] Could Not Update Zendesk Org "+zd.name,err);
    }else{
        console.log("[Submitted!] ",zd.name);
    }
};

SalesforceSync.prototype.syncClientID = function(sf,zd){
    if (zd.organization_fields.client_id === null || sf.Client_ID__c !== zd.organization_fields.client_id.toString()){
        this.updates[zd.name].updates_made++;
        this.updates[zd.name].organization.organization_fields.client_id = sf.Client_ID__c;
        console.log("[Update] CLIENT ID: "+sf.Name+" as "+sf.Client_ID__c);
    }else{
        this.updates[zd.name].check_total--;
    }
    this.checkSubmit(zd);
};

SalesforceSync.prototype.syncDomain = function(sf,zd){
    if (sf.Website !== null){
        var d = url.parse(sf.Website).hostname;
        d = (d !== null ? d : sf.Website);
        d = d.replace("www.","").toLowerCase();
        
        var old = [].concat(zd.domain_names);

        if (zd.domain_names.indexOf(d) < 0){
            this.updates[zd.name].updates_made++;
            zd.domain_names.push(d);
            this.updates[zd.name].organization.domain_names = zd.domain_names;
            console.log("[Update] Old Domains: ",old,"  New Domains: ",zd.domain_names);
        }else{
            this.updates[zd.name].check_total--;
        }
    }else{
        this.updates[zd.name].check_total--;
    }
    this.checkSubmit(zd);
};

SalesforceSync.prototype.syncCSM = function(sf,zd){
    salesforce().getUserById(sf.OwnerId,checkCSM.bind(this));

    function checkCSM(err,res){
        if (err){
            this.updates[zd.name].check_total--;
        }else{
            var csm = res.records[0];
            if (csm.Name !== zd.organization_fields.csm){
                this.updates[zd.name].updates_made++;
                this.updates[zd.name].organization.organization_fields.csm = csm.Name;
                console.log("[Update] Account Manager for "+sf.Name+": "+csm.Name)
            }else{
                this.updates[zd.name].check_total--;
            }
        }
        this.checkSubmit(zd);
    }
};

SalesforceSync.prototype.syncPM = function(sf,zd){
    salesforce().getUserById(sf.Project_Manager__c,checkPM.bind(this));

    function checkPM(err,res){
        if (err){
            this.updates[zd.name].check_total--;
        }else{
            var pm = res.records[0];
            if (pm.Name !== zd.organization_fields.project_manager){
                this.updates[zd.name].updates_made++;
                this.updates[zd.name].organization.organization_fields.project_manager = pm.Name;
                console.log("[Update] Project Manager for "+sf.Name+": "+pm.Name)
            }else{
                this.updates[zd.name].check_total--;
            }
        }
        this.checkSubmit(zd);
    }
};

SalesforceSync.prototype.syncExecSponsor = function(sf,zd){
    var exec = sf.Executive_Sponsor__c;
    if (exec !== null){
        if (exec !== zd.organization_fields.executive_sponsor){
            this.updates[zd.name].updates_made++;
            this.updates[zd.name].organization.organization_fields.executive_sponsor = exec;
            console.log("[Update] Executive Sponsor for "+sf.Name+": "+exec);
        }else{
            this.updates[zd.name].check_total--; 
        }
    }else{
        this.updates[zd.name].check_total--;
    }
    this.checkSubmit(zd);
};

SalesforceSync.prototype.syncRelationshipStatus = function(sf,zd){
    if (sf.Client_Relationship_Status__c !== null){
        var sfStatus = sf.Client_Relationship_Status__c.toLowerCase();
        if (sfStatus !== zd.organization_fields.client_health){
            this.updates[zd.name].updates_made++;
            this.updates[zd.name].organization.organization_fields.client_health = sfStatus;
            console.log("[Update] Relationship Status for "+sf.Name+" from "+zd.organization_fields.client_health+" to "+sfStatus);
        }else{
            this.updates[zd.name].check_total--; 
        }
    }else{
        this.updates[zd.name].check_total--;
    }
    this.checkSubmit(zd);
};
