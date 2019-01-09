if ((typeof swan !== 'undefined') && (typeof swanGlobal !== 'undefined')) {
	require("swan-game-adapter.js");
	require("libs/laya.bdmini.js");
} else if (window&&window.wx) {
	require("weapp-adapter.js");
	require("libs/laya.wxmini.js");
}
window.loadLib = require;
require("res/game.js");
require("index.js");