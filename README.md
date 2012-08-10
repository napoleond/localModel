##Introduction

localModel.js is a drop in persistence strategy extension for Backbone.js (http://documentcloud.github.com/backbone/) that is meant to reduce unnecessary HTTP requests to the server (making it very useful for mobile web applications). It wouldn't be too difficult to modify it for syncing between online/offline use. (I will try to add that functionality when I have time, but feel free to send me a pull request!) localModel.js does NOT merge model edits - it merely chooses which version of the model to keep (based on when it was created/modified) and then updates either the server or localStorage to reflect that decision.

*localModel is best suited for the type of application where each user can only edit their own data, and even in that situation the user might not always agree with the version that localModel decides to keep (think concurrent sessions for the same user, etc) so it's important to understand the limitations of localModel before using it in production. Also, you might run into problems if you have several users using the same device - separating localStorage for each user in that case would be trivial but obviously there may still be a privacy concern depending on the data.*

##Server Requirements

In order to determine whether or not the locally stored version of a model is current, localModel requires the server to maintain a list of when each model was last modified. It does not need to be complete - localModel will assume that any model without a specified modification time should be loaded from the server when it is first requested. That list should be bootstrapped into the page when it is loaded (eg. by including it in your template file) in the following way:

```javascript
window.localModel.setModTimes({
	"/model/url/including/id":Timestamp(integer seconds from UNIX epoch),
	...
});
```

localModel also expects an extra "timeLoaded" attribute to be passed from the server with every model - the value should be the current time (the time the request is served) expressed as seconds since the UNIX epoch. If you would like localModel to automatically update modTimes whenever a model is loaded from the server, you may pass a "timeModified" attribute with your model as well. (Hint: coupling this feature with push notifications could be fun!) Only using server timestamps avoids trying to resolve time differences between server and client. Since these values will be added to the model just like any other, it is obviously important to rename them if they conflict with any existing model attributes.

Finally, each model must have a globally unique URL. This requirement is probably already satisfied by most Backbone applciations.

##On The Client

Besides including the list of times modified, simply include localModel.js (**after** including backbone.js) and everything should work! It is considered good practice to also bootstrap a list of models on initial load - it is up to the developer to strike the proper balance between initial and subsequent loads (where the models could already be in localStorage) here. A simple cookie arrangement might be a good way to help make that decision.

##Under The Hood

localModel.js attaches a localModel object to the window and overwrites Backbone.sync(). That localModel object has the following public methods which are used in the new Backbone.sync():

- **setModTimes(times)** accepts a set of key/value pairs where the key is the model URL and the value is a UNIX timestamp in seconds denoting the time at which the model was last modified on the server, adding them to localModel's internal modTimes object and returning a reference to it.
- **timeModified(model)** returns the time at which a model was last modified on the server (assuming that it was not modified in another session since initial page load) or false if undefined.
- **getLocal(model)** returns specified model as a JSON string from localStorage, or false if localStorage is undefined.
- **setLocal(modelURL,modelObj)** adds or updates a model in localStorage, returns the JSON string on success or false if localStorage is undefined.
- **removeLocal(model)** removes model from localStorage, returning true unless localStorage is undefined.
