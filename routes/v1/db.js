'use strict';
/* globals module, require */

var db = require.main.require('./src/database'),
	apiMiddleware = require('./middleware'),
	errorHandler = require('../../lib/errorHandler'),
	utils = require('./utils'),
	async = require('async');


module.exports = function(/*middleware*/) {
	var app = require('express').Router();

	app.route('/object-field/:field')
		.get(apiMiddleware.requireUser, apiMiddleware.requireAdmin, function(req, res) {
			db.getObjectKeys(req.params.field, function(err, values) {
				return errorHandler.handle(err, res, values);
			});
		})

	app.route('/object-field/:field/:key')
		.get(apiMiddleware.requireUser, apiMiddleware.requireAdmin, function(req, res) {
      console.log("GET object-field params=", req.params);
			db.getObjectField(req.params.field, req.params.key, function(err, value) {
				return errorHandler.handle(err, res, value);
			});
		})
		.put(apiMiddleware.requireUser, apiMiddleware.requireAdmin, function(req, res) {
			db.setObjectField(req.params.field, req.params.key, req.body.value);
			return errorHandler.handle(null, res);
		})
		.delete(apiMiddleware.requireUser, apiMiddleware.requireAdmin, function(req, res) {
			db.deleteObjectField(req.params.field, req.params.key);
			return errorHandler.handle(null, res);
		});

	return app;
};
