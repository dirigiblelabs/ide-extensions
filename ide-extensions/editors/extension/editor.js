/*
 * Copyright (c) 2010-2020 SAP and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *   SAP - initial API and implementation
 */
angular.module('page', ["ideUI", "ideView"])
	.controller('PageController', function ($scope, $http) {

		$http.get("/services/v4/js/ide-extensions/services/extensionPoints.mjs")
			.then(function (response) {
				$scope.optionsExtensionPoints = response.data.map(e => {
					return {
						text: e,
						value: e
					}
				});
				load();
			});

		let messageHub = new FramesMessageHub();
		let contents;
		let csrfToken;

		function getResource(resourcePath) {
			let xhr = new XMLHttpRequest();
			xhr.open('GET', resourcePath, false);
			xhr.setRequestHeader('X-CSRF-Token', 'Fetch');
			xhr.send();
			if (xhr.status === 200) {
				csrfToken = xhr.getResponseHeader("x-csrf-token");
				return xhr.responseText;
			}
		}

		function loadContents(file) {
			if (file) {
				return getResource('/services/v4/ide/workspaces' + file);
			}
			console.error('file parameter is not present in the URL');
		}

		function getViewParameters() {
			if (window.frameElement.hasAttribute("data-parameters")) {
				let params = JSON.parse(window.frameElement.getAttribute("data-parameters"));
				$scope.file = params["file"];
			} else {
				let searchParams = new URLSearchParams(window.location.search);
				$scope.file = searchParams.get('file');
			}
		}

		function load() {
			getViewParameters();
			contents = loadContents($scope.file);
			$scope.extension = JSON.parse(contents);
		}

		function saveContents(text) {
			console.log('Save called...');
			if ($scope.file) {
				let xhr = new XMLHttpRequest();
				xhr.open('PUT', '/services/v4/ide/workspaces' + $scope.file);
				xhr.setRequestHeader('X-Requested-With', 'Fetch');
				xhr.setRequestHeader('X-CSRF-Token', csrfToken);
				xhr.onreadystatechange = function () {
					if (xhr.readyState === 4) {
						console.log('file saved: ' + $scope.file);
					}
				};
				xhr.send(text);
				messageHub.post({
					name: $scope.file.substring($scope.file.lastIndexOf('/') + 1),
					path: $scope.file.substring($scope.file.indexOf('/', 1)),
					contentType: 'application/json+extension', // TODO: Take this from data-parameters
					workspace: $scope.file.substring(1, $scope.file.indexOf('/', 1)),
				}, 'ide.file.saved');
				messageHub.post({ message: `File '${$scope.file}' saved` }, 'ide.status.message');
			} else {
				console.error('file parameter is not present in the request');
			}
		}

		$scope.save = function () {
			contents = JSON.stringify($scope.extension, null, 4);
			saveContents(contents);
		};

		messageHub.subscribe(
			function () {
				if (isFileChanged) {
					$scope.save();
				}
			},
			"editor.file.save.all",
		);

		messageHub.subscribe(
			function (msg) {
				let file = msg.data && typeof msg.data === 'object' && msg.data.file;
				let extension = JSON.stringify($scope.extension, null, 4);
				if (file && file === $scope.file && contents !== extension)
					$scope.save();
			},
			"editor.file.save",
		);

		$scope.$watch(function () {
			let extension = JSON.stringify($scope.extension, null, 4);
			if (contents !== extension) {
				messageHub.post({ resourcePath: $scope.file, isDirty: true }, 'ide-core.setEditorDirty');
			} else {
				messageHub.post({ resourcePath: $scope.file, isDirty: false }, 'ide-core.setEditorDirty');
			}
		});

		$scope.formErrors = {};

		$scope.isValid = function (isValid, property) {
			$scope.formErrors[property] = !isValid ? true : undefined;
			for (let next in $scope.formErrors) {
				if ($scope.formErrors[next] === true) {
					$scope.isFormValid = false;
					return;
				}
			}
			$scope.isFormValid = $scope.extension.extensionPoint != null
				&& $scope.extension.extensionPoint != ""
				&& $scope.extension.module != null
				&& $scope.extension.module != "";
		};
	});
