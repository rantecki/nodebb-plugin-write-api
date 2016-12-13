'use strict';
/* globals module, require */

var Categories = require.main.require('./src/categories'),
	privileges = require.main.require('./src/privileges'),
	groups = require.main.require('./src/groups'),
	apiMiddleware = require('./middleware'),
	errorHandler = require('../../lib/errorHandler'),
	utils = require('./utils'),
	async = require('async');


module.exports = function(/*middleware*/) {
	var app = require('express').Router();

	app.post('/', apiMiddleware.requireUser, apiMiddleware.requireAdmin, function(req, res) {
		if (!utils.checkRequired(['name'], req, res)) {
			return false;
		}

		Categories.create(req.body, function(err, categoryObj) {
			return errorHandler.handle(err, res, categoryObj);
		});
	});

	app.route('/:cid')
		.put(apiMiddleware.requireUser, apiMiddleware.requireAdmin, apiMiddleware.validateCid, function(req, res) {
			var payload = {};
			payload[req.params.cid] = req.body;

			Categories.update(payload, function(err) {
				return errorHandler.handle(err, res);
			});
		})
		.delete(apiMiddleware.requireUser, apiMiddleware.requireAdmin, apiMiddleware.validateCid, function(req, res) {
			Categories.purge(req.params.cid, req.user.uid, function(err) {
				return errorHandler.handle(err, res);
			});
		});

	app.route('/:cid/state')
		.put(apiMiddleware.requireUser, apiMiddleware.requireAdmin, apiMiddleware.validateCid, function(req, res) {
			var payload = {};
			payload[req.params.cid] = {
				disabled: 0
			};

			Categories.update(payload, function(err) {
				return errorHandler.handle(err, res);
			});
		})
		.delete(apiMiddleware.requireUser, apiMiddleware.requireAdmin, apiMiddleware.validateCid, function(req, res) {
			var payload = {};
			payload[req.params.cid] = {
				disabled: 1
			};

			Categories.update(payload, function(err) {
				return errorHandler.handle(err, res);
			});
		});

		app.route('/:cid/privileges')
			.get(apiMiddleware.requireUser, function(req, res) {
				privileges.categories.list(req.params.cid, function(err, priv) {
					res.json(priv);
				});
			})
			.put(apiMiddleware.requireUser, function(req, res) {
				var data = req.body;
				if (Array.isArray(data.privilege)) {
					async.each(data.privilege, function (privilege, next) {
						groups['join']('cid:' + req.params.cid + ':privileges:' + privilege, data.id, next);
					}, function(err) {
						return errorHandler.handle(err, res);
					});
				} else {
					groups['join']('cid:' + req.params.cid + ':privileges:' + data.privilege, data.id, function(err) {
						return errorHandler.handle(err, res);
					});
				}
			})
			.delete(apiMiddleware.requireUser, apiMiddleware.requireAdmin, apiMiddleware.validateCid, function(req, res) {
				var data = req.body;
				if (data.privilege === undefined) {
					// If privilege parameter is not passed, leave all groups
					groups.leaveAllGroups(data.id, function (err) {
						return errorHandler.handle(err, res);
					});
				} else if (Array.isArray(data.privilege)) {
					async.each(data.privilege, function (privilege, next) {
						groups['leave']('cid:' + req.params.cid + ':privileges:' + privilege, data.id, next);
					}, function(err) {
						return errorHandler.handle(err, res);
					});
				} else {
					groups['leave']('cid:' + req.params.cid + ':privileges:' + data.privilege, data.id, function(err) {
						return errorHandler.handle(err, res);
					});
				}
			});

	return app;
};
