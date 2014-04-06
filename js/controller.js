( function ( angular ) {
	angular.module("initialSolution.controller", ["initialSolution"])
		.controller( "parameterConfigCtrl", function( $scope, Parameter, ParameterInterface ) {
			$scope.data = Parameter;
			$scope.add = function () {
				ParameterInterface.addClient(0,0,0,0,0);
			};

			$scope.delete = function ( index ) { 
				ParameterInterface.deleteClient( index ); 
			};
		} )
		.controller( "importFileCtrl", function( $scope, ParameterInterface, $rootScope ) {
			$scope.ifwCollapsed = true;
			var paserData = function ( result ) {
				var dataAry = result.trim().split(/\n/)
					.map( function (rec) { return rec.replace(/\s/g,''); } );
				if ( !/^\d+\,\d+$/.test( dataAry[0] ) )
					throw 'first line error :'+dataAry[0];
				else {
					var tmp = dataAry[0].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setSite( tmp[0], tmp[1] );
				}
				if ( !/^\d+\,\d+\,\d+\,\d+\,\d+$/.test( dataAry[1] ) )
					throw 'second line error :'+dataAry[1];
				else {
					var tmp = dataAry[1].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setCar( tmp[0], tmp[1], tmp[2], tmp[3], tmp[4] );
				}
				if ( !/^\d+\,\d+$/.test( dataAry[2] ) )
					throw 'third line error :'+dataAry[2];
				else {
					var tmp = dataAry[2].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setClient( tmp[0], tmp[1] );
				}

				ParameterInterface.deleteAllClient();
				dataAry.splice(3).forEach( function ( rec, index ) {
					if ( !/^\d+(\,\d+){4}$/.test( rec ) )
						throw (index+4)+' line error :'+rec;
					else {
						var tmp = rec.split(",").map( function ( rec ) { return Number(rec); } );
						ParameterInterface.addClient( tmp[0], tmp[1], tmp[2], tmp[3], tmp[4] );
					}
				} );

				$scope.ifwCollapsed = true;
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
		} )
		.controller( "executeCtrl", function( $scope, Util ) {
			// $scope.data = dataObj;
			// var carMan = 
			// $scope.execute = function () {
			// 	var errorCase = [];
			// 	// 無法處理的客戶名單
			// 	var clientList = dataObj.TargetList
			// 		.map( function ( rec ) { return angular.extend( { type }, rec ); } )
			// 		.sort( function ( a, b ) { return a.time-b.time; } );
			// 	// 客戶名單，依照時間排序方便後續作業
			// 	var carLog = [];
			// 	for ( var i = 0 ; i < dataObj.CarNumber ; i++ ) {
			// 		carLog.push( { 
			// 			carNum : i,
			// 			path : [] 
			// 		} );
			// 	}
			// 	// 車輛名單，將車輛數資訊擴增成各個車輛的行駛紀錄
			// 	do {
			// 		var departureTime = -1;
			// 		do {
			// 			Util.getJourneyTime( dataObj.Site, clientList[0].StartPoint, dataObj.CarSpeed );
			// 			clientList[0]
			// 		} while ( departureTime != -1 ) ;
			// 			errorCase.push( clientList.splice( 0, 1 )[0] );
			// 		// 檢查客戶要求是否合理
			// 		var car = carLog.filter( function (rec) { return !rec.work; } )[0];
			// 		// 2.指派新車
			// 		car.path.push( { 
			// 			passengerList : [],
			// 			StartPoint : dataObj.Site, 
			// 			StartTime : ,
			// 			EndPoint : passengerList[0].StartPoint,
			// 			EndTime : ,
			// 		} );
			// 		car.path.push( { 
			// 			passengerList : clientList.splice( 0, 1 ),
			// 			StartPoint : clientList[0].StartPoint, 
			// 			StartTime : ,
			// 			EndPoint : clientList[0].EndPoint 
			// 			EndTime : ,
			// 		} );
			// 		// 3.尋找時窗開啟最早之需求點(車輛K第一個子路徑)
			// 		var passenger = 
			// 		var carpoolList = clientList.sort( function ( rec ) {

			// 		} );
			// 		while ( clientList. ) {

			// 		}
			// 		// 4.尋找符合共乘、時窗限制、等待時間最少之需求點
			// 	} while ( clientList.length != 0 );
			// };
		} )
} ) ( angular );

var carLog = [];
				
				carLog