( function ( angular ) {
	angular.module("initialSolution", ["ngRoute","ui.bootstrap"])
		.config(function ( $routeProvider ) {
	    	$routeProvider.when("/parameterConfig", {templateUrl: "partials/parameterConfig.html",controller: "parameterConfigCtrl"});
			$routeProvider.when("/importFile", {templateUrl: "partials/importFile.html",controller: "importFileCtrl"});
			$routeProvider.otherwise({redirectTo: "/parameterConfig"});
		})
		.value('dataObj', {
			'StartCoordinate' : {
				'x': undefined, 
				'y': undefined
			},
			'CarNumber' : undefined,
			'DriverWorkingHourLimit' : undefined,
			'CarSpeed' : undefined,
			'MistakeScope' : undefined,
			'TravelTimeLimit' : undefined,
			'TargetList' : []
		} )
		.controller( "parameterConfigCtrl", function( $scope, dataObj ) {
			$scope.data = dataObj;

			$scope.add = function () {
				$scope.data.TargetList.push( {
					'sx': 0,
					'sy': 0,
					'ex': 0,
					'ey': 0,
					'time':0 
				} );
			};

			$scope.delete = function ( index ) { $scope.data.TargetList.splice( index, 1 ); };

			$scope.checkInteger = function ( value ){ return /^\d+$/.test(value); };
		} )
		.controller( "importFileCtrl", function( $scope, dataObj, $rootScope ) {
			var paserData = function ( result ) {
				var dataAry = result.trim().split(/\n/)
					.map( function (rec) { return rec.replace(/\s/g,''); } );
				if ( !/^\d+(\,\d+){6}$/.test( dataAry[0] ) )
					throw 'first line error';
				else {
					var tmp = dataAry[0].split(",");
					$scope.data.StartCoordinate.x = Number(tmp[0])
					$scope.data.StartCoordinate.y = Number(tmp[1])
					$scope.data.CarNumber = Number(tmp[2])
					$scope.data.DriverWorkingHourLimit = Number(tmp[3])
					$scope.data.CarSpeed = Number(tmp[4])
					$scope.data.MistakeScope = Number(tmp[5])
					$scope.data.TravelTimeLimit = Number(tmp[6])
					$scope.data.TargetList.splice(0);
				}

				dataAry.splice(1).forEach( function ( rec, index ) {
					if ( !/^\d+(\,\d+){4}$/.test( rec ) )
						throw (index+2)+' line error';
					else {
						var tmp = rec.split(",");
						$scope.data.TargetList.push({
							'sx': Number(tmp[0]),
							'sy': Number(tmp[1]),
							'ex': Number(tmp[2]),
							'ey': Number(tmp[3]),
							'time':Number(tmp[4]) 
						});
					}
				} );
			};

			window.readFile = function() {
			    file = arguments[0].files[0];
			    var fReader = new FileReader();           
			    fReader.onload = function (event) {
			        paserData ( event.target.result );
			        $rootScope.$digest();
			    };

			    fReader.readAsText(file);
			};

			$scope.data = dataObj;
		} )

} ) ( angular );