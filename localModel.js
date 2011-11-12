window.localModel = {
	_modTimes: {},
	setModTimes: function(times) {
		return _.extend(this._modTimes,{times});
	},
	timeModified: function(model) {
		return this._modTimes[model.url()]||2000000000; // if modTime isn't set, return a timestamp for ~2050 to make sure that the model is loaded
	},
	getLocal: function(model) {
		if (window.localStorage) return window.localStorage[model.url()];
		else return false;
	},
	setLocal: function(modelURL,modelObj) {
		if (window.localStorage) {
			if (modelObj.timeModified) {
				var timeObj = {};
				timeObj[modelURL] = modelObj.timeModified;
				this.setModTimes(timeObj);
			}
			return window.localStorage[modelURL] = JSON.stringify(modelObj);
		} else return false;
	},
	removeLocal: function(model) {
		if (window.localStorage) {
			window.localStorage.removeItem(model.url());
			return true;
		} else return false;
	}
};

Backbone.sync = function(method, model, options) {	
	var type = methodMap[method];

	// Default JSON-request options.
	var params = {type : type, dataType : 'json'};

	//===============localModel stuff=======================
	var data = localModel.getLocal(model);
	var current = data?(model.get('timeLoaded') > localModel.timeModified(model)):false;

	//if reading
	if (method=="read") {
		//if local version exists and is current, use that
		if (current) return options.success(data,"success",{"readyState":4,"status":200,"statusText":"success"});
		else {//otherwise make sure that the model gets added to localstorage
			params.success = function(d,s,x) {
				localModel.setLocal(model.url(),d);
				options.success(d,s,x);
			}
		}
	}

	//if writing, make sure that localstorage gets written too
	if (method=="create"||method=="update") {
		params.success = function(d,s,x) {
			localModel.setLocal(model.url(),model.toJSON());
			options.success(d,s,x);
		}
	}
	//if deleting, make sure that local version gets deleted too (and delete timeModified)
	if (method=="delete") {
		params.success = function(d,s,x) {
			localModel.removeLocal(model);
			options.success(d,s,x);
		}
	}

	//================end localModel stuff======================

	// Ensure that we have a URL.
	if (!options.url) {
		params.url = getUrl(model) || urlError();
	}

	// Ensure that we have the appropriate request data.
	if (!options.data && model && (method == 'create' || method == 'update')) {
		params.contentType = 'application/json';
		params.data = JSON.stringify(model.toJSON());
	}

	// For older servers, emulate JSON by encoding the request into an HTML-form.
	if (Backbone.emulateJSON) {
		params.contentType = 'application/x-www-form-urlencoded';
		params.data = params.data ? {model : params.data} : {};
	}

	// For older servers, emulate HTTP by mimicking the HTTP method with `_method`
	// And an `X-HTTP-Method-Override` header.
	if (Backbone.emulateHTTP) {
		if (type === 'PUT' || type === 'DELETE') {
			if (Backbone.emulateJSON) params.data._method = type;
			params.type = 'POST';
			params.beforeSend = function(xhr) {
				xhr.setRequestHeader('X-HTTP-Method-Override', type);
			};
		}
	}

	// Don't process data on a non-GET request.
	if (params.type !== 'GET' && !Backbone.emulateJSON) {
		params.processData = false;
	}

	// Make the request, allowing the user to override any Ajax options.
	return $.ajax(_.extend(params, options));
};
