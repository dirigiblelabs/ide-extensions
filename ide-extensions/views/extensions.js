/*
 * Copyright (c) 2010-2022 SAP and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *   SAP - initial API and implementation
 */

const extensionsView = angular.module('extensions', ['ideUI', 'ideView']);

extensionsView.config(["messageHubProvider", function (messageHubProvider) {
    messageHubProvider.eventIdPrefix = 'extensions-view';
}]);

extensionsView.controller('ExtensionsController', ['$scope', '$http', function ($scope, $http) {

    $http.get('/services/v4/core/extensions').then(function (response) {
        $scope.list = response.data;
    });

}]);