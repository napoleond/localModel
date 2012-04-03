localModel = 
  _modTimes: {}
  setModTimes: (times) ->
    _.extend(@_modTimes,times)
  timeModified: (model) ->
    @_modTimes[model.url()] or 2000000000
  getLocal: (model) ->
    localStorage?[model.url()]
  setLocal: (modelURL,modelObj) ->
    if modelObj.timeModified
      timeObj[modelURL] = modelObj.timeModified
      @setModTimes timeObj
    localStorage?[modelURL] = JSON.stringify modelObj
  removeLocal: (model) ->
    if localStorage?.removeItem model.url() then yes else no

class localModel.Model extends Backbone.Model
  fetch: (options) ->
    if not options.force and localModel.getLocal(this) and @get 'timeLoaded' > localModel.timeModified(this)
      return #return fake XHR
        readyState: 4
        status: 200
        statusText: 'success'
    else
      success = options.success # "extend" success function
      modelURL = @url()
      options.success = (data, success, xhr) ->
        localModel.setLocal modelURL, data
        success?()
    super options
  save: (key, value, options) ->
    localModel.setLocal @url(),@toJSON()
    super key, value, options
  destroy: (options) ->
    localModel.removeLocal this
    super options

class localModel.Collection extends Backbone.Collection
  add: (models, options) ->
    #TODO: add models to collection using localModel to choose which version to persist, and update localCollection info
  reset: (models, options) ->
    #TODO: update local collection info
    super models, options
  restore: (id) ->
    #TODO: restore previously loaded collection from localStorage
