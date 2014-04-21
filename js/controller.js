( function ( angular ) {
	angular.module("initialSolution.controller", ["initialSolution"])
		.controller( "parameterConfigCtrl", function( $scope, Parameter, ParameterInterface ) {
			angular.extend( $scope, {
				data : Parameter,
				add : function () {
					ParameterInterface.addClient(0,0,0,0,0);
				},
				delete : function ( index ) { 
					ParameterInterface.deleteClient( index ); 
				}
			} );
		} )
		.controller( "importFileCtrl", function( $scope, ParameterInterface, $rootScope ) {
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

			$scope.ifwCollapsed = true;
		} )
		.controller( "executeCtrl", function( $scope, Parameter ) {
			var getJT = function ( path, speed ) {
				var tl = 0;
				for ( var p = 0, c = 1 ; c < path.length ; p = c, c++ ) {
					tl += Math.pow(
						Math.pow( Math.abs( path[p].x-path[c].x ), 2 )+
						Math.pow( Math.abs( path[p].y-path[c].y ), 2 ), 
						0.5 ) ;
				}
				return tl/speed;
			};

			var getPossiblePoint = function ( pathLog, param ) {
				var now = pathLog[pathLog.length-1];
				var backPathJT = now.pl.map( function () {} );
				now.pcl = param.Client.List.filter( function ( rec ) { 
					return ( now.pl.length+1 <= param.Car.C ) 
							// 車容量限制
						&& ( (now.lt+getJT([now.point, rec.o], param.Car.Speed)) < (rec.Time+param.Client.WS) ) 
							// 時間窗限制
						// && ( now.pl.every( function ( rec, idx ) {
						// 		return backPathJT.splic( 0, idx+1 ).reduce( function (p,c) {
						// 			return p+c+param.Car.S;
						// 		}, rec.jt ) < param.Client.R
						// 	} ) )
						// 	// 乘客搭乘時間限制
						// && ( ( newPathJT[2]+newPathJT[1] ) < param.Client.R ) 
						// 	// 接乘客戶搭乘時間限制
						// && ( ( lt-pathLog[0].lt+newPathJT[3]+newPathJT[2]+newPathJT[1] ) < param.Car.S )
						// 	// 駕駛時間限制
						;
				} );
				
				var possiblePoint = now.pcl.map( function ( rec ) { 
						return rec.o; 
					} ).concat( now.pl.map( function ( rec ) { 
						return rec.d; 
					} ) );
				// 可服務且未服務客戶+乘客需求點；
				// 處理程序自然的造成先考慮未服務的需求點在考慮返程
				if ( pathLog.length > 1 )
					possiblePoint.push( param.Site );
				// 出站後增加回站的選項
				return possiblePoint;
			};

			var toPoint = function ( pathLog, point, param ) {
				var nowp = pathLog[pathLog.length-1];
				var njt = getJT( [ nowp.point, point ], param.Car.Speed );
				var newp = {
					at : nowp.lt+njt,
					lt : nowp.lt+njt,
					pl : undefined,
					point : point
				};
				nowp.pl.forEach( function ( rec ) { rec.jt += njt; } );
				// 乘車時間累加
				newp.pl = nowp.pl.filter( function ( rec ) { return point != rec.d; } );
				// 剃除下車乘客(多人)
				var client = now.pcl.find( function ( rec ) { return rec.o == point; } );
				// 找出上車客人(1人)
				if ( client ) {
					param.Client.List.splice( param.Client.List.indexOf(client), 1 );
					// 從未服務名單去除
					if ( pathLog.length == 1 && njt < ( client.Time-param.Client.WT )) {
						pathLog[0].lt = client.Time-param.Client.WT-njt;
						newp.at = pathLog[0].lt+njt;
					}
					// 站場出發時間調整
					newp.lt = param.Car.S
						+(newp.at<(client.Time-param.Client.WT))?(client.Time-param.Client.WT):newp.at;
					// 得出最後發車時間
					nowp.pl.forEach( function ( rec ) { rec.jt = rec.jt+newp.lt-nowp.lt; } );
					// 乘客乘車時間累加
					nowp.pl.push( client );
					// 搭車
				}
				pathLog.push( newp );
			};

			$scope.execute = function () {
				var param = angular.copy( Parameter );
				// 設定參數
				param.Client.List.sort( function ( a, b ) {
					return a.time-b.time;
				} );
				// 依照時間窗先後順序對客戶名單進行排序
				var CarLog = [];
				for ( var k = 1 ; k < param.Car.K ; k++ ) {
					CarLog[k] = pathLog = [ {
						at : 0,
						lt : 0,
						pl : [],
						point : param.Site
					} ];
					for ( var pl = undefined ; 
							( pl = getPossiblePoint( pathLog, param ) ).length != 0 ; 
							toPoint( pathLog, pl[0], param) 
					);
				}
				console.log( CarLog );
			};

		} )
} ) ( angular );

var carLog = [];
				
				carLog