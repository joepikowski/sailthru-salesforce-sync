var config = require("../config/config.js");
var DataModel = require("../model/datamodel.js");
var RequestModel = require("../model/requestmodel.js");
var httpClient = require("./httpclient.js");

var moment = require("moment");

//Class Declaration

function Zendesk(){
    this.user = config.zendesk.user;
    this.pw = config.zendesk.pw;
    this.hostname = config.zendesk.hostname;
    this.path = config.zendesk.path;
};

module.exports = function(data){
    return new Zendesk().set(data);
};

//Class Methods

Zendesk.prototype = DataModel();

// API Methods
// getCase(), moveCase(), getCaseByAgent(), checkInbox(), getCaseByStatus(), getOrg(), getCaseByOrg(), getRequesterByCase()

Zendesk.prototype.getCase = function(caseID,callback){
    var options = {
        path: this.path + "/tickets/"+ caseID +".json",
    };
    this.httpsRequest("GET",options,callback);
};

Zendesk.prototype.moveCase = function(command,caseID,zendeskID,callback){
    var options = {
        path: this.path + "/tickets/"+ caseID + ".json",
        body: '{"ticket":{"status":"open","assignee_id":'+zendeskID+'}'
    };
    this.httpsRequest("PUT",options,callback);
};

Zendesk.prototype.getCaseByAgent = function(zendeskID,status,callback){
    var query = this.setQueryParams({
        query: {
            type: "ticket",
            status: status !== "" ? status : "open",
            assignee_id: zendeskID,
        },
        sort_by: "created_at"
    });

    var options = {
        path: this.path + "/search.json"+ query
    };
    this.httpsRequest("GET",options,callback);
};

Zendesk.prototype.checkInbox = function(callback){
    var query = this.setQueryParams({
        query: {
            type: "ticket",
            status: ["new","open"],
            group: "support",
            assignee: "none",
            created: ">"+moment().subtract("days",1).format("YYYY-MM-DD")
        },
    });
    var options = {
        path: this.path + "/search.json" + query
    };
    this.httpsRequest("GET",options,callback);
};

Zendesk.prototype.getCaseByStatus = function(status,callback){
    var query = this.setQueryParams({
        query: {
            type: "ticket",
            status: status,
            group: "support"
        },
        sort_by: "created_at"
    });
    var options = {
        path: this.path + "/search.json"+ query
    };
    this.httpsRequest("GET",options,callback);
};

Zendesk.prototype.updateOrg = function(org,update,callback){
    var options = {
        path: this.path + "/organizations/"+org+".json",
        body: update
    };
    this.httpsRequest("PUT",options,callback);
};

Zendesk.prototype.deleteOrg = function(org,callback){
    var options = {
        path: this.path + "/organizations/"+org+".json"
    };
    this.httpsRequest("DELETE",options,callback);
};

Zendesk.prototype.getOrg = function(org,callback){
    var query = this.setQueryParams({
        name: org
    });
    var options = {
        path: this.path + "/organizations/autocomplete.json"+ query
    };
    this.httpsRequest("POST",options,callback);
};

Zendesk.prototype.getAllOrgs = function(callback){
    var options = {
        path: this.path + "/organizations.json"
    };
    this.httpsRequest("GET",options,callback);
};

Zendesk.prototype.getCaseByOrg = function(org,status,callback){
    var query = this.setQueryParams({
        query: {
            organization: org,
            group: ["support","none"],
            status: status !== "" ? status : "open",
            type: "ticket"
        },
        sort_by: "updated_at",
        sort_order: "desc"
    });
    var options = {
        path: this.path + "/search.json"+ query
    };
    this.httpsRequest("GET",options,callback);
};

Zendesk.prototype.getRequesterByCase = function(requesterID,callback){
    var options = {
        path: this.path + "/users/"+requesterID+".json",
    };
    this.httpsRequest("GET",options,callback);
};

Zendesk.prototype.httpsRequest = function(method,options,callback){
    var request = RequestModel({
        method: method,
        protocol: "HTTPS",
        hostname: this.hostname,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic "+new Buffer(this.user+":"+this.pw).toString("base64"),
        },
        callback: this.httpsCatchResults.bind(this,callback)
    }).set(options);
    httpClient().request(request);
};

Zendesk.prototype.httpsCatchResults = function(callback,err,body,res){
    if (err){
        console.log(err,"Zendesk Request Error");
        callback(err);
    }else{
        try {
            var results = JSON.parse(body);
            var resultType = this.getResultType(results);
            var resultData = results[resultType];
            callback(null,resultData);
        } catch (err) {
            console.log(err,"Zendesk Response Error");
            callback(err);
        }
    }
};

//API Helper Methods
Zendesk.prototype.setQueryParams = function(params){
    var q = "?";
    var i = 0;

    for (p in params){
        i > 0 ? q += "&" : "";
        switch(p)
            {
            case "query":
                q += p + "=" + this.setQuery(params[p]);
                break;
            default:
                q += p + "=" + params[p];
                break;
            }
        i++;
    }
    return encodeURI(q);
};

Zendesk.prototype.setQuery = function(params){
    var q = "";
    var i = 0;

    for (p in params){
        i > 0 ? q += "+" : "";
        if (params[p] instanceof Array){

            params[p].forEach(multiAdd);

            function multiAdd(elem,ind,arr){
                ind > 0 ? q += "+" : "";
                q += p + ":" + elem;
            };   
        } else {
            switch (p)
                {
                case "created":
                    q += p + params[p];
                    break;
                default:
                    q += p + ":" + params[p];
                    break;
                }
        }
        i++;
    }
    return q;
};

Zendesk.prototype.getResultType = function(results){
    var resTypes = ["results","organizations","ticket","user"];
    for (r in results){
        var t = resTypes.indexOf(r);
        if (t > -1){
            return resTypes[t];
        }
    }
};
