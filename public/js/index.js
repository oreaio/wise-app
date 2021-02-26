function parseReports(data) {
  data.shift();
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    item.total =
      Number(item.upload.split("+")[0].trim().replace(",", "")) +
      Number(item.download.split("+")[0].trim().replace(",", ""));
  }

  return data;
}

var app = {
  // Application Constructor
  initialize: function () {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    document.addEventListener("deviceready", this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function () {},
};

("use strict");

//
// Here is how to define your module
// has dependent on mobile-angular-ui
//
var WiseApp = angular.module("WiseApp", [
  "ngRoute",
  "mobile-angular-ui",
  "isteven-omni-bar",
  "countTo",

  // touch/drag feature: this is from 'mobile-angular-ui.gestures.js'.
  // This is intended to provide a flexible, integrated and and
  // easy to use alternative to other 3rd party libs like hammer.js, with the
  // final pourpose to integrate gestures into default ui interactions like
  // opening sidebars, turning switches on/off ..
  "mobile-angular-ui.gestures",
]);

WiseApp.config(function ($routeProvider) {
  $routeProvider.when("/", {
    templateUrl: "views/stats.html",
    controller: "StatsController",
    reloadOnSearch: false,
  });
  $routeProvider.when("/account", {
    templateUrl: "views/account.html",
    controller: "AccountController",
  });
  $routeProvider.when("/reports", {
    templateUrl: "views/reports.html",
    controller: "ReportsController",
  });
});

WiseApp.controller("MainController", function ($rootScope, $scope) {
  document.addEventListener(
    "resume",
    function () {
      $rootScope.$emit("resume");
    },
    false
  );
});

WiseApp.controller(
  "StatsController",
  function ($scope, $http, bytes, $rootScope, $interval) {
    var mobile = undefined;
    var root = $rootScope;
    window.root = root;
    $scope.bytes = bytes;
    window.bytes = bytes;
    $scope.fields = {};

    $scope.percent = function () {
      var user = $rootScope.user;
      var left = user.reports[0].total + "MB";
      var right = user.limit + "B";

      return ((bytes(left) / bytes(right)) * 100).toFixed(0);
    };

    $scope.pullDown = function () {
      getAllStats($rootScope.user.Phone);
    };

    function getReports(cb) {
      root.working = true;
      $http.get("/reports/" + root.user.UserName + "/10").then(
        function (res) {
          root.user.reports = parseReports(res.data);
          root.working = false;
          cb();
        },
        function (err) {}
      );
    }

    function getAllStats(mobile) {
      if (typeof spinn !== undefined) $rootScope.working = true;
      $http.get("/account/" + mobile).then(
        function (res) {
          $rootScope.user = res.data[0];
          $rootScope.title = $scope.user.name;

          var exp = moment($rootScope.user.expdate);
          var today = moment.utc();
          $rootScope.user.expiresIn = exp.diff(today, "days");

          window.user = $rootScope.user;

          getReports(function () {
            $rootScope.working = false;
          });
        },
        function (err) {
          $scope.error = "حساب غير موجود، يرجى الاتصال بنا";
          if (typeof spinn !== undefined) $rootScope.working = false;
        }
      );
    }

    $scope.loggedIn = mobile || undefined;

    if (!$rootScope.user && mobile) getAllStats(mobile);

    $scope.getStats = function () {
      if (!$scope.fields.mobile) return;
      getAllStats($scope.fields.mobile);
    };

    $scope.usage = function () {
      if (
        !$rootScope.user ||
        !$rootScope.user.reports ||
        !$rootScope.user.reports[0]
      )
        return 0 + "MB";

      return Number($rootScope.user.reports[0].total).toFixed(0) + "MB";
    };

    $scope.remain = function () {
      var user = $rootScope.user;
      var total = bytes(user.limit + "B") - bytes(user.reports[0].total + "MB");
      var res = user.reports[0].total > 0 ? bytes(total) : user.limit + "B";
      return res;
    };

    $rootScope.$on("resume", function () {
      if ($rootScope.user) getAllStats(mobile);
    });

    $scope.expiresIn = function () {
      var expIn;

      if (user.expiresIn < 0) return "منتهي الصلاحية";
      if (user.expiresIn == 0) return "ينتهي اليوم";

      switch (user.expiresIn) {
        case 1:
          expIn = "يوم ١";
          break;
        case 2:
          expIn = "يومين";
        case 3:
          expIn = "٣ ايام";
          break;
        case 4:
          expIn = "٤ ايام";
          break;
        default:
          return (expIn = "فعال");
          break;
      }

      return " ينتهي بعد " + expIn;
    };
  }
);

WiseApp.controller("AccountController", [
  "$rootScope",
  "$location",
  function (root, $location) {
    if (!root.user) return $location.path("/");
  },
]);

WiseApp.controller("ReportsController", [
  "$rootScope",
  "$location",
  "$http",
  "bytes",
  "$scope",
  function (root, $location, $http, bytes, $scope) {
    if (!root.user) return $location.path("/");
  },
]);
