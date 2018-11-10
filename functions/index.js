// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// All CORS
const cors = require('cors')({
  origin: true
});

var request = require('request');
var syncRequest = require('sync-request');
var requestPromise = require('request-promise');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// global variables needed for Git integration
let command = ""
let repoName = "";
let orgName = "";
let issueDescription = "";
let issueTitle = "";
let username = "";
let email = "";
let orgDisplayName = "";
let endpoint = "";
let httpVerb = "";
let responseMessage = "";
let role = "";
let data = {};

exports.callGitHub = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    let orchestrationRequired = false;
    let body = req.body;
    command = body.command;
    let parameters = body.parameters;
    repoName = parameters.repoName;
    orgName =  parameters.orgName;
    issueDescription = parameters.description;
    issueTitle = parameters.title;
    username = parameters.username;
    email = parameters.email;
    orgDisplayName = parameters.orgDisplayName;
    role = parameters.role;

    if(command === "createOrg"){
      gitHubIntegrator.createOrg();
    }
    else if(command === "createRepo"){
      gitHubIntegrator.createRepo();
    }
    else if(command === "addMember"){
      gitHubIntegrator.addMember();
    }
    else if(command === "createUser"){
      gitHubIntegrator.createUser();
    }
    else if(command === "createIssue"){
      gitHubIntegrator.createIssue();
    }
    else if(command === "fullOnboard"){
      orchestrationRequired = true;
      gitHubIntegrator.fullOnboard();
    }
    else if(command === "existingOnboard"){
      orchestrationRequired = true;
      createUser = false;
      gitHubIntegrator.existingOnboard();
    }

    if(!orchestrationRequired){
      let promise = gitHubIntegrator.callGitHubAsync();
      promise.then(function(result) {
        console.log(result);
        if (result.message === undefined){
          console.log("success");
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
    }
    else{
      let response = "";
      //synchronous in case we need to wait on the previous call to finish
      if(command === "fullOnboard"){
        gitHubIntegrator.createUser();
        response = gitHubIntegrator.callGitHubSynchronous();
      }

      if(response.statusCode.toString().startsWith("2")){
        gitHubIntegrator.createOrg();
        response = gitHubIntegrator.callGitHubSynchronous();
      }

      if(response.statusCode.toString().startsWith("2")){
        gitHubIntegrator.addMember();
        response = gitHubIntegrator.callGitHubSynchronous();
      }

      if(response.statusCode.toString().startsWith("2")){
        gitHubIntegrator.createRepo();
        response = gitHubIntegrator.callGitHubSynchronous();
      }
      if(response.statusCode.toString().startsWith("2")){
        if(command === "fullOnboard"){
          gitHubIntegrator.fullOnboard();
        }
        else{
          gitHubIntegrator.existingOnboard();
        }
        res.status(200).send(responseMessage);
      }
      else{
        res.status(response.statusCode).send(response.headers.status)
      }
    }
  });
});

let gitHubIntegrator = {
  domainAddress: "https://github.freemasonsnh.com/",
  baseURL: "github.freemasonsnh.com/api/v3",
  siteAdminUsername: functions.config().github.username,
  siteAdminPassword: functions.config().github.password,
  callGitHubAsync: function(){
    let url = "https://" + this.siteAdminUsername + ":" + this.siteAdminPassword + "@" + this.baseURL + endpoint;
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
  callGitHubSynchronous: function(){
    let url = "https://" + this.siteAdminUsername + ":" + this.siteAdminPassword + "@" + this.baseURL + endpoint;
    // wait for each call to finish
    console.log("data", data);
      var response = syncRequest(httpVerb, url, {
        json: data
      });
      return response;
  },
  createOrg: function(){
    endpoint = "/admin/organizations";
    data = {
      login: orgName,
      profile_name: orgDisplayName,
      admin: this.siteAdminUsername
    }
    httpVerb = "POST";
    responseMessage = "The " + orgName + " organization was successfully created. <br/><br/>" +
    "Please click on the following link to view the organization: <a href=\"" + 
    this.domainAddress + orgName + "\"" + " target=\"blank\">" + orgName + "</a>"
  },
  createRepo: function(){
    endpoint = "/orgs/" + orgName + "/repos";
    data = {name: repoName, auto_init: true};
    httpVerb = "POST";
    responseMessage = "The " + repoName + " was successfully added to the " + orgName + " organization. <br/><br/>" +
    "Please click on the following link to view the repository: <a href=\"" + 
    this.domainAddress + orgName + "/" + repoName + "\"" + " target=\"blank\">" + repoName + "</a>";
  },
  addMember: function(){
    endpoint = "/orgs/" + orgName + "/memberships/" + username;
    data = {role: role};
    httpVerb = "PUT";
    responseMessage = "Please click on the following link to view the members of the organization: <a href=\"" + 
      this.domainAddress + "orgs/" + orgName + "/people\"" + " target=\"blank\">Organization Membership</a>";
  },
  createUser: function(){
    endpoint = "/admin/users";
    data = {login: username, email: email};
    httpVerb = "POST";
    responseMessage = "The " + username + " account was successfully created. <br/><br/>" +
      "Please click on the following link to view the user profile: <a href=\"" + 
      this.domainAddress + username + "\"" + " target=\"blank\">" + username + "</a>";
  },
  createIssue: function(){
    endpoint = "/repos/" + orgName + "/" + repoName + "/issues";
    data = {title: issueTitle, body: issueDescription};
    httpVerb = "POST";
    responseMessage = "Your issue was successfully created. <br/><br/>" +
      "Please click on the following link to view the issue: <a href=\"" + 
      this.domainAddress + orgName + "/" + repoName + "/issues\"" + " target=\"blank\">" + issueTitle +  "</a>";
  },
  fullOnboard: function(){
    responseMessage = "The " + username + " account was sucessfully created and associated to the newly created " 
    + repoName + " repository and the newly created " + orgName + " organization. <br/><br/>" +
    "Please click on the following link to view the user profile: <a href=\"" + 
    this.domainAddress + "orgs/" + orgName + "/people\"" + " target=\"blank\">" + username + "</a>";
  },
  existingOnboard: function(){
    responseMessage = "The " + username + " account was sucessfully associated to the newly created " 
    + repoName + " repository and the newly created " + orgName + " organization. <br/><br/>" +
    "Please click on the following link to view the user profile: <a href=\"" + 
    this.domainAddress + "orgs/" + orgName + "/people\"" + " target=\"blank\">" + username + "</a>";
  }
}