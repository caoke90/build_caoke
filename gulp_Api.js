_=require("underscore")
Wind = require("wind")
Wind.logger.level = Wind.Logging.Level.WARN;
cc=console
path=require("path")
gulp = require('gulp');
concat = require('gulp-concat');
uglify = require('gulp-uglify');
del=require("del")
fs=require("fs")


//读取文件
fs.readFileAsync=Wind.Async.Binding.fromCallback(function(){
    var arr= _.initial(arguments)
    var callback=_.last(arguments)
    arr.push(function(err,data){
        if(err){
            return callback()
        }
        callback(data)
    })
    fs.readFile.apply(fs,arr)
})
//读取文件夹
fs.readdirAsync=Wind.Async.Binding.fromCallback(function(){
    var arr= _.initial(arguments)
    var callback=_.last(arguments)
    arr.push(function(err,data){
        if(err){
            return callback()
        }
        callback(data)
    })
    fs.readdir.apply(fs,arr)
})
//写入文件
fs.writeFileAsync=Wind.Async.Binding.fromCallback(function(){
    var arr= _.initial(arguments)
    var callback=_.last(arguments)
    arr.push(function(err,data){
        if(err){
            return callback()
        }
        callback(data)
    })
    fs.writeFile.apply(fs,arr)
})
//追加写入
fs.appendFileAsync=Wind.Async.Binding.fromCallback(function(){
    var arr= _.initial(arguments)
    var callback=_.last(arguments)
    arr.push(function(err,data){
        if(err){
            return callback()
        }
        callback(data)
    })
    fs.appendFile.apply(fs,arr)
})
//文件时间
fs.statAsync=Wind.Async.Binding.fromCallback(function(){
    var arr= _.initial(arguments)
    var callback=_.last(arguments)
    arr.push(function(err,data){
        if(err){
            return callback()
        }
        callback(data)
    })
    fs.stat.apply(fs,arr)
})
//是否存在
fs.existsAsync=Wind.Async.Binding.fromCallback(fs.exists)
//重命名
fs.renameAsync=Wind.Async.Binding.fromCallback(fs.rename)