#localModel.js

**localModel.js is still in development (as of October 14, 2011). This documentation is being prepared concurrently - actual code and examples will be available soon.**

##Introduction

localModel.js is a drop in persistence strategy extension for Backbone.js (http://documentcloud.github.com/backbone/) that is meant to simplify the process of syncing a user's data to the server after offline use as well as reducing load time when a user requests a large collection of models. localModel.js does NOT merge model edits - it merely chooses which version of the model to keep and then saves it both on the server and in localStorage. Model saves are optionally queued and batched - localModel attempts to group models of the same type and send them to the server as a collection to reduce HTTP overhead. This is especially efficient in the case where the user is uploading larger files from the application while editing model data or if many small edits need to be made to multiple models - localModel can wait for the file to upload or the user to finish their multiple edits while grouping changed models and sending them to the server together when appropriate.

*Note that localModel is being developed and is best suited for the type of application where each user can only edit their own data, and even in that situation the user might not always agree with the version that localModel decides to keep (think concurrent sessions for the same user, etc) so it's important to understand the limitations of localModel before using it in production.*

##Server Requirements

In order to determine whether or not the locally stored version of a model is current, localModel requires the server to maintain a list of when each model was last modified. It does not need to be complete - localModel will assume that any model without a specified modification time should be loaded from the server when it is first requested. That list should be bootstrapped into the page when it is loaded (eg. by including it in your template file) in the following way:

'''javascript
window.localModel.newModTimes([
	{"/model/url/including/id":Timestamp(integer seconds from UNIX epoch)},
	...
]);
'''

localModel also expects an extra "timeLoaded" attribute to be passed from the server with every model - the value should be the current time (the time the request is served) expressed as seconds since the UNIX epoch. (Only using server timestamps avoids trying to resolve time differences between server and client.) Since this value will be added to the model just like any other, it is obviously important to rename it if it conflicts with any existing model attributes.

Finally, each model must have a globally unique URL. This requirement is probably already satisfied by most (if not all) Backbone applciations.

##On The Client

Besides including the list of times modified, simply include localModel.js and everything should work! It is considered good practice to also bootstrap a list of models on initial load - it is up to the developer to strike the proper balance between initial and subsequent loads (where the models could already be in localstorage) here. A simple cookie arrangement might be a good way to help make that decision.

localModel comes with a basic network task queue that might be worth integrating with for file I/O, etc. Its operation is fairly straightforward; just pass the function to be queued to window.localModel.queue({"function": YOUR FUNCTION HERE}) and it will be executed in turn.

##Under The Hood

localModel.js attaches a localModel object to the window and overwrites Backbone.sync(). That localModel object has the following public methods which are used in the new Backbone.sync():

- **timeLoaded(modelURL:String)** returns the time at which a model (specified by its URL) was last loaded or false if it was never loaded.
- **timeLoaded(modelURL:String,timeStamp:Number)** modifies the timeLoaded for the specified model, and returns the time.
- **timeModified(modelURL:String)** returns the time at which a model was last modified on the server (assuming that it was not modified in another session since initial page load) or false if undefined.
- **timeModified(modelURL:String,timeStamp:Number)** updates timeModified for specified model, returns it.
- **getLocal(modelURL:String)** returns specified model from the parsed localStorage object.
- **setLocal(model:Object)** adds or updates a model in the parsed localStorage object, returning the same model it is given.
- **saveLocal()** stringifies the parsed localStorage object and saves it to localStorage.
- **queue(options:Object)** adds a function to the network queue or a model to a group batch in the queue.

The new Backbone.sync() accepts optional parameters which control whether or not to use the network queue or to force a server request for any given call.
