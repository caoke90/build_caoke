//作者：微信号caoke90
var _=require("underscore")
var Wind = require("wind")
var Wind.logger.level = Wind.Logging.Level.WARN;
var cc=console
var path=require("path")
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del=require("del")
var fs=require("fs")

var solveModule=function(){
    var hello={
        //cache for js and module that has added into jsList to be loaded.
        _jsAddedCache: {},

        _getJsListOfModule: function (moduleMap, moduleName, dir) {
            var jsAddedCache = this._jsAddedCache;
            if (jsAddedCache[moduleName]) return null;
            dir = dir || "";
            var jsList = [];
            var tempList = moduleMap[moduleName];
            if (!tempList) throw "can not find module [" + moduleName + "]";
            var ccPath = path;
            for (var i = 0, li = tempList.length; i < li; i++) {
                var item = tempList[i];
                if (jsAddedCache[item]) continue;
                var extname = path.extname(item);
                if (!extname) {
                    var arr = this._getJsListOfModule(moduleMap, item, dir);
                    if (arr) jsList = jsList.concat(arr);
                } else if (extname.toLowerCase() === ".js") jsList.push(ccPath.join(dir, item));
                jsAddedCache[item] = 1;
            }
            return jsList;
        }
    }
    return hello
}

//压缩html
var buildHtml=eval(Wind.compile("async", function (appdir) {

    var html=fs.readFileSync(path.join(appdir,"index.html")).toString()
    //存在压缩
    if(/[\n ]+<script [^\n]+build\.min\.js[^\n]+/gi.test(html)){
        cc.log("html存在压缩")
        return true
    }else{
        cc.log("html改变")
        html=html.replace(/[\n ]+<script [^\n]+CCBoot\.js[^\n]+/g,"")
        html=html.replace(/[\n ]+<script [^\n]+main.js[^\n]+/g,function(m){
            return m.replace("main.js","build.min.js")
        })
        fs.writeFileSync(path.join(appdir,"index.html"),html)
        return false
    }

}))
//还原HTML
var backHtml=eval(Wind.compile("async", function (appdir) {

    var project_json=JSON.parse(fs.readFileSync(path.join(appdir,"project.json")))
    var html=fs.readFileSync(path.join(appdir,"index.html")).toString()
    //存在压缩
    if(/[\n ]+<script [^\n]+build\.min\.js[^\n]+/gi.test(html)){
        cc.log("html还原中……")
        html=html.replace(/[\n ]+<script [^\n]+build\.min\.js[^\n]+/gi,function(){
            return '\n<script src="'+path.join(project_json.engineDir,"/CCBoot.js")+'"></script>'+'\n<script src="main.js"></script>'
        })
        fs.writeFileSync(path.join(appdir,"index.html"),html)
    }

}))

//合并压缩js
var buildJs=eval(Wind.compile("async", function (appdir,callback) {

    cc.log(appdir)
    var res={}
    res.project_json=JSON.parse(fs.readFileSync(path.join(appdir,"project.json")))

    var project_jsmin={
        debugMode:0,
        showFPS:false,
        frameRate:res.project_json.frameRate,
        id:res.project_json.id,
        renderMode:0
    }
    var project_js='document["ccConfig"]='+JSON.stringify(project_jsmin)+";"
    fs.writeFileSync(path.join(appdir,"$project.js"),project_js)
    cc.log("创建$project.js")
    //cocos-js地址
    var engineDir=path.join(appdir,res.project_json.engineDir)

    //需要加载的模块
    var modules=res.project_json.modules

    //所有模块
    var modulesJson=JSON.parse(fs.readFileSync(path.join(engineDir,"moduleConfig.json")))
    var moduleMap = modulesJson["module"];

    //解析需要加载的模块
    var newJsList = [];
    var hello=solveModule()
    if (modules.indexOf("core") < 0) modules.splice(0, 0, "core");
    for (var i = 0, li = modules.length; i < li; i++) {
        var arr = hello._getJsListOfModule(moduleMap, modules[i], engineDir);
        if (arr) newJsList = newJsList.concat(arr);
    }
//    cc.log(hello._jsAddedCache)
//    cc.log(newJsList)

    var jsList=[]
    for(var i=0;i<res.project_json.jsList.length;i++){
        jsList.push(path.join(appdir,res.project_json.jsList[i]))
    }

    //附加私有js
    var alljs=[
        path.join(appdir,"$project.js"),
        path.join(engineDir,"/CCBoot.js")
    ]
        .concat(newJsList).concat(jsList)
        .concat([path.join(appdir,"main.js")])
    cc.log(alljs)
    cc.log("压缩中……")
    var intev=setInterval(function(){
        cc.log("intev")
        if(fs.existsSync(path.join(appdir,"build.min.js"))){
            //删除$project.js
            fs.unlinkSync(path.join(appdir,"$project.js"))
            callback()
            clearInterval(this)
        }
    },5000)
    gulp.src(alljs)

        .pipe(uglify())    //压缩
        .pipe(concat("build.min.js"))
        .pipe(gulp.dest(appdir));



}))
var buildJsAsync=Wind.Async.Binding.fromCallback(function(appdir,callback){
    buildJs(appdir,callback).start()
})
var backJsAsync=eval(Wind.compile("async", function (appdir) {
    fs.unlinkSync(path.join(appdir,"build.min.js"))
}))



//单独执行的时候
var singleRun=eval(Wind.compile("async", function (appdir) {
    var appdir=__dirname
    var exsit=fs.existsSync(path.join(appdir,"build.min.js"))
    if(!exsit){
        cc.log("压缩中……")
        $await(buildHtml(appdir))
        $await(buildJsAsync(appdir))

    }else{
        cc.log("解压中……")
        fs.unlinkSync(path.join(appdir,"build.min.js"))
        $await(backHtml(appdir))
    }
}))
module.exports.buildHtml=buildHtml
module.exports.backHtml=backHtml
module.exports.buildJsAsync=buildJsAsync
module.exports.backJsAsync=backJsAsync

module.exports.singleRun=singleRun

var exsit1=fs.existsSync(path.join(__dirname,"index.html"))
var exsit2=fs.existsSync(path.join(__dirname,"project.json"))

if(exsit1&&exsit2){
    singleRun().start()
}else{
    var dirArr=[]
    function walk(path2){
        var dirList = fs.readdirSync(path2);
        dirList.forEach(function(item){
            if(fs.statSync(path2 + '/' + item).isDirectory()){
                var exsit1=fs.existsSync(path.join(path2 + '/' + item,"index.html"))
                if(exsit1){
                    dirArr.push(path2 + '/' + item)
                }else{
                    walk(path2 + '/' + item);
                }
            }
        });
    }
    walk(__dirname)
    cc.log(dirArr)
    var allTask=eval(Wind.compile("async", function (appdir) {

        for(var i=0;i<dirArr.length;i++){
            cc.log("当前任务："+(i+1))
            var exsit=fs.existsSync(path.join(dirArr[i],"build.min.js"))
            if(exsit){
                cc.log("已存在")
            }else{
                $await(buildHtml(dirArr[i]))
                $await(buildJsAsync(dirArr[i]))
            }

        }
        cc.log("over………………")
        cc.log("3秒后自动退出")
        setTimeout(function(){},3000)
    }))
    allTask().start()
}


