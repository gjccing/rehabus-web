( function ( angular ) {
	angular.module("initialSolution.controller", ["initialSolution"])
		.controller( "parameterConfigCtrl", function( $scope, Parameter, ParameterInterface ) {
			angular.extend( $scope, {
				data : Parameter,
				add : function () {
					ParameterInterface.addClient(0,0,0,0,0,0);
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
				if ( !/^(\d+(\.\d+)*)\,(\d+(\.\d+)*)$/.test( dataAry[0] ) )
					throw 'first line error :'+dataAry[0];
				else {
					var tmp = dataAry[0].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setSite( tmp[0], tmp[1] );
				}
				if ( !/^(\d+(\.\d+)*)(\,(\d+(\.\d+)*)){4}$/.test( dataAry[1] ) )
					throw 'second line error :'+dataAry[1];
				else {
					var tmp = dataAry[1].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setCar( tmp[0], tmp[1], tmp[2], tmp[3], tmp[4] );
				}
				if ( !/^(\d+(\.\d+)*)\,(\d+(\.\d+)*)$/.test( dataAry[2] ) )
					throw 'third line error :'+dataAry[2];
				else {
					var tmp = dataAry[2].split(",").map( function ( rec ) { return Number(rec); } );
					ParameterInterface.setClient( tmp[0], tmp[1] );
				}

				ParameterInterface.deleteAllClient();
				dataAry.splice(3).forEach( function ( rec, index ) {
					if ( !/^(\d+(\.\d+)*)(\,(\d+(\.\d+)*)){5}$/.test( rec ) )
						throw (index+4)+' line error :'+rec;
					else {
						var tmp = rec.split(",").map( function ( rec ) { return Number(rec); } );
						ParameterInterface.addClient( tmp[0], tmp[1], tmp[2], tmp[3], tmp[4], tmp[5] );
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
			var getJT = function ( p1, p2, speed ) {
				return Math.pow(
						Math.pow( Math.abs( p1.x-p2.x ), 2 )+
						Math.pow( Math.abs( p1.y-p2.y ), 2 ), 
						0.5 ) /speed;
			};

			var insertPoint = function ( path, pp ) {
				for ( var i = 0 ; i < path.length ;  i++ ) {
					if ( pp.rp.t < path[i].rp.t ) {
						path.splice( i, 0, pp );
						return path
					}
				}

				path.push( pp );
				return path;
			};

			var getPossiblePath = function( oPath, param ) {
				var outPath = oPath.slice( 1, oPath.length-1 ); 
				// 排除場站點
				var pathList = param.Client.List.map( function ( rec ) {
					var tmp = angular.copy( outPath );
					insertPoint( tmp, {rp:rec.o} );
					insertPoint( tmp, {rp:rec.d} );
					tmp.client = rec;
					return tmp;
				} );
				
				// 依照時間先後編排路徑
				pathList.forEach( function ( rec ) {
					rec.splice( 0, 0, { rp: angular.copy( param.Site ) } );
					rec.push( { rp: angular.copy( param.Site ) } );
				} );
				// 前後插入場站
				pathList.forEach( function ( path ) {
					path.forEach( function ( rec ) { rec.lt = rec.at = 0; } );
					path.reduce( function ( pre, cur, index ) {
						var jt = getJT( pre.rp.p, cur.rp.p, param.Car.Speed );
						if ( index == 1 )
							pre.lt = ( jt >= ( cur.rp.t-param.Client.WS ) )? jt : ( ( cur.rp.t-param.Client.WS )-jt );
						// 剛出場站，調整場站離開時間。提早：離開時間設定為剛好於時間窗開啟到達；晚到：假設落於時間窗內。

						cur.at = pre.lt+jt;
						cur.lt = param.Car.S+( ( cur.at < ( cur.rp.t-param.Client.WS ) ) ? ( cur.rp.t-param.Client.WS ) : cur.at );
						return cur;
					} );
				} );
				pathList.forEach( function ( path ) { 
					path[0].at = undefined; 
					path[0].rp.t = undefined;
					path[path.length-1].lt = undefined; 
					path[path.length-1].rp.t = undefined;
				} );
				// 計算各點抵達即離開時間
				var condition = [
					function ( path, param ) { // 車容量限制
						var stackLog = path.reduce( function ( log, c, idx ) {
							if ( /^.*\+$/.test(c.rp.name) )
								log.push(log[idx-1]+1);
							else if ( /^.*\-$/.test(c.rp.name) )
								log.push(log[idx-1]-1);
							else
								log.push(0);

							return log;
						}, [] );
						var result = 0;
						for ( var i = 0 ; i < stackLog.length ; i++ )
							if ( stackLog[i] > result )
								result = stackLog[i];

						return param.Car.C >= result;
					},
					function ( path, param ) { // 時間窗限制
						return path.slice( 1, path.length-1 ).every( function ( rec ) { return rec.at < rec.rp.t+param.Client.WS; } );
					},
					function ( path, param ) { // 乘客搭乘時間限制
						var cl = path.slice( 1, path.length-1 ).sort( function ( a, b ) {
							return Number( a.rp.name.match(/\d+/)[0] )-Number( b.rp.name.match(/\d+/)[0] );
						} );
						for ( var i = 0 ; i < cl.length ; i+=2 )
							if ( param.Client.R < ( cl[i+1].at-cl[i].lt ) )
								return false;
						
						return true;
					},
					function ( path, param ) { // 駕駛時間限制
						return param.Car.WT >= ( path[path.length-1].at - path[0].lt );
					}
				];
				var result = pathList.filter( function ( path, idx ) {
					return condition.every( function ( confunct, cidx ) {
						var checkValue = confunct( path, param ); 
						// console.log( checkValue, idx, cidx );
						return checkValue;
					} );
				} );
				// 篩選符合所有限制式的路徑
				return result;
			};

			$scope.execute = function () {
				var param = angular.copy( Parameter );
				// 設定參數
				param.Client.List
					.sort( function ( a, b ) { return a.o.t-b.o.t; } )
					.forEach( function ( rec, idx ) { 
						rec.o.name='c'+(idx+1)+'+';
						rec.d.name='c'+(idx+1)+'-';
					} );
				// 依照開始時間窗先後順序對客戶名單進行排序
				// 標記客戶需求點
				// console.log( param.Client.List );
				var CarPathLog = [];
				for ( var k = 0 ; k < param.Car.K ; k++ ) {
					CarPathLog[k] = [ { rp : angular.copy( param.Site ) } ];
					/* { at lt rp } */
					
					for ( var ppList = undefined ; ( ppList = getPossiblePath( CarPathLog[k], param ) ).length != 0 ; ) { 
						// 判斷有無可行路徑
						var chosePath = ppList.sort( function ( aPath, bPath ) {
							var aInaccuracy = aPath.slice( 1, aPath.length-1 ).reduce( function ( value, rec ) {
								value+=Math.abs(rec.at-rec.rp.t);
							}, 0 );
							var bInaccuracy = bPath.slice( 1, bPath.length-1 ).reduce( function ( value, rec ) {
								value+=Math.abs(rec.at-rec.rp.t);
							}, 0 );
							return aInaccuracy-bInaccuracy;
						} )[0];
						// 決定路徑
						param.Client.List.splice( param.Client.List.indexOf(chosePath.client), 1 );
						CarPathLog[k] = chosePath;
						// 改變路徑
					}
				}
				console.log( 'all car path', CarPathLog );
				console.log( 'error client list', param.Client.List );
				$scope.exeLog = CarPathLog.filter( function ( path ) { 
					return path.length > 1 ; 
				} );
			}
		} )
} ) ( angular );