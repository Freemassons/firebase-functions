// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const cors = require('cors')({
  origin: true
});

var request = require('request');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

exports.callGitHub = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    let body = req.body;
    let command = body.command;
    let endpoint = "";
    let httpVerb = "";
    let parameters = body.parameters;
    let responseMessage = "";
    let data = {};
    let domainAddress = "http://35.175.177.59/"
    if(command === "createOrg"){
      endpoint = "/admin/organizations";
      let orgName = parameters["orgName"];
      data = gitHubIntegrator.getDataForCreateOrg(parameters);
      httpVerb = "POST";
      responseMessage = "The " + orgName + " organization was successfully created. <br/><br/>" +
      "Please click on the following link to view the organization: <a href=\"" + 
      domainAddress + orgName + "\"" + " target=\"blank\">" + orgName + "</a>";
    }
    else if(command === "createRepo"){
      let repoName = parameters["repoName"];
      let orgName = parameters["orgName"];
      endpoint = "/orgs/" + orgName + "/repos";
      data = {name: repoName, auto_init: true};
      httpVerb = "POST";
      responseMessage = "The " + repoName + " was successfully added to the " + orgName + " organzation. <br/><br/>" +
      "Please click on the following link to view the repository: <a href=\"" + 
      domainAddress + orgName + "/" + repoName + "\"" + " target=\"blank\">" + repoName + "</a>";
    }
    else if(command === "addMember"){
      let userName = parameters["username"];
      let orgName = parameters["orgName"];
      endpoint = "/orgs/" + orgName + "/memberships/" + userName;
      data = {role: parameters["role"]};
      httpVerb = "PUT";
      responseMessage = userName + " was successfully added to the " + orgName + "organization. <br/><br/>" +
        "Please click on the following link to view the members of the organization: <a href=\"" + 
        domainAddress + "orgs/" + orgName + "/people\"" + " target=\"blank\">Organization Membership</a>";
    }
    else if(command === "createUser"){
        endpoint = "/admin/users";
        let username= parameters["username"];
        let email= parameters["email"];
        data = {
            login: username,
            email: email
          };
        httpVerb = "POST";
        responseMessage = "The " + username + " account was successfully created. <br/><br/>" +
        "Please click on the following link to view the user profile: <a href=\"" + 
        domainAddress + username + "\"" + " target=\"blank\">" + username + "</a>";
    }
    let promise = gitHubIntegrator.callGitHub(endpoint, httpVerb, data);
    promise.then(function(result) {
      console.log("success", result);
      console.log("message", result.message);
      if (result.message === undefined){
        result.htmlDisplayMessage = responseMessage;
        res.status(200).send(result);
      }
      else{
        console.log("validation failed", result);
        res.status(409).send(result);
      }
    }, function(error) {
      console.log("error", error);
      res.status(520).send(error);
    }).catch(message => {
      console.log("catch", message);
      res.status(520).send("Sorry for the inconvenience, but we are having trouble processing your request");
    })
  });
});

let gitHubIntegrator = {
  username: functions.config().github.username,
  password: functions.config().github.password,
  baseURL: "35.175.177.59/api/v3",
  callGitHub: function(endpoint, httpVerb, data){
    let url = "https://" + this.username + ":" + gitHubIntegrator.password + "@" + this.baseURL + endpoint;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    let options = {
      method: httpVerb,
      body: data,
      url: url,
      json: true,
    };
    console.log("options", options)
    // Return new promise 
    return new Promise(((resolve, reject) => {
      // Do async job
      request(options, (error, response, body) => {
          if (error) {
              reject(err);
          } 
          else {
              resolve(body);
          }
      })
    }))
  },
  getDataForCreateOrg: function(parameters){
    return data = {
      login: parameters["orgName"],
      profile_name: parameters["orgDisplayName"],
      admin: functions.config().github.username
    }
  },
  isValidResponse: function(message){
    let invalidResponseTypes = ["Validation Failed", "Not Found"];
    isValid = "true";
    for(index in invalidResponseTypes){
      let currentInvalidResponse = invalidResponseTypes[index];
      if(message === currentInvalidResponse){
        isValid = false;
      }
    }
    return isValid;
  }
}