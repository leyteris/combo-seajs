/**
 * @author leyteris.lee
 * @version 20110922
 * node combo test.js
 */

(function(){
	var fs = require('fs'),
		jsp = require('./lib/uglify-js').parser,
		pro = require('./lib/uglify-js').uglify,
		cssmin = require('./lib/node-css-compressor').cssmin,
		_ = require('./lib/underscore.js');
		
	var	compressCode = '',
		compressCss = '',
		dependCssList = [],
		jsPath = '', //模块下css依赖绝对path补齐  
		
		pubilcJsFile = [ //公共文件列表  
			'../sea.js',
			'../jquery.js',
			'../underscore.js',
			'../underscore.string.js'
		],
		jsFileArray = [];  //待压缩文件列表 

	var log = function(arg){
		console.log(arg);
	};
	
	var replaceForDepend = function(filename, code){
		var dependenceArray = [];
		var modulename = filename.replace(/^.*\/js\//i,'');
		code.replace(/require\('(.+)'\)/ig, function(){
			var match = arguments[1];
			if(/\.css$/i.test(match)){
				dependCssList.push(jsPath + match);
				return;
			}
			if(!(/\.js$/i.test(match))){
				match += '.js';
			}
			dependenceArray.push('"' + match + '"');
		});
		code = code.replace(/define\(function\(/, 'define(\'' + modulename + '\', [' + dependenceArray.join(',') + '], function(');
		code = code.replace("/require\('(.+\.css)'\)/i", '', code);
		return code;
	};
	
	var compress = function(str ,type){
		if (type === 'javascript') {
			var orig_code = str;
			var ast = jsp.parse(orig_code);
			ast = pro.ast_lift_variables(ast);
			ast = pro.ast_mangle(ast);
			ast = pro.ast_squeeze(ast);
			var finalCode = pro.gen_code(ast);
			return finalCode;
		}else if(type === 'css'){
			return cssmin(str);
		}else{
			return str;
		}
	};
	

	var writeFinalCode = function(file, str){
		fs.writeFile(file, str, 'utf8', function (err) {
		  if (err) throw err;
		  console.log('It\'s saved to ' + file + '!');
		});
	};

	var _init = function(argv0,argv1){
		var minJsFile = argv0 || 'babylon.js';
		var minCssFile = argv1 || 'babylon.css';
		var i, pdata, data, rdata;
		
		log('Javascript analyze start!');
		for(i = 0; i < pubilcJsFile.length ; ++i){
			pdata = fs.readFileSync(pubilcJsFile[i], 'utf8');
			compressCode += pdata;
			log(pubilcJsFile[i] + ' complete!');
		}
		for(i = 0; i < jsFileArray.length; ++i){
			data = fs.readFileSync(jsFileArray[i], 'utf8');
			rdata = replaceForDepend(jsFileArray[i], data);
			compressCode += rdata;
			log(jsFileArray[i]  + ' complete!')
		}
		
		log('Javascript compress start!');
		compressCode = compress(compressCode, 'javascript');

		log('CSS analyze start!');
		dependCssList = _.uniq(dependCssList)
		for (i = 0; i < dependCssList.length; ++i) {
			cdata = fs.readFileSync(dependCssList[i], 'utf8');
			compressCss += cdata;
			log(dependCssList[i] + ' complete!');
		}
		log('Css compress start!');
		compressCss = compress(compressCss, 'css');
		
		writeFinalCode(minJsFile, compressCode);
		
		writeFinalCode(minCssFile, compressCss);
	}

	return _init;
})()(process.argv[2],process.argv[3]);