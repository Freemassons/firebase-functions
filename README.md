#firebase-functions

## What are Firebase Cloud Functions?

Cloud Functions for Firebase lets you automatically run backend code in response to events triggered by Firebase features and HTTPS requests. Your code is stored in Google's cloud and runs in a managed environment. There's no need to manage and scale your own servers.

## Call functions via HTTP requests

You can trigger a function through an HTTP request by using functions.https. This allows you to invoke a synchronous function through the following supported HTTP methods: GET, POST, PUT, DELETE, and OPTIONS.

The HTTP methods for this project are either POST or PUT. Visit the index.js file to see the Cloud Functions implemented for this project.

### USAGE:

POST to the following URL to trigger the cloud function:

https://us-central1-tackit-86cc7.cloudfunctions.net/callGitHub


{
    "command":"createIssue",
    "parameters":{"title":"My Issue","description":"A very bad issue","repoName":"my-repo","orgName":"NoTeam"}
}