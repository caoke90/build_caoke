require("./gulp_Api")
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

//改变html
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
        cc.log("存在压缩")
        html=html.replace(/[\n ]+<script [^\n]+build\.min\.js[^\n]+/gi,function(){
            return '\n<script src="'+path.join(project_json.engineDir,"/CCBoot.js")+'"></script>'+'\n<script src="main.js"></script>'
        })
        fs.writeFileSync(path.join(appdir,"index.html"),html)
    }

}))

//合并压缩js
var buildOne=eval(Wind.compile("async", function (appdir,callback) {

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
    fs.writeFileSync(path.join(appdir,"project.js"),project_js)
    cc.log("创建project.js")
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
        path.join(appdir,"project.js"),
        path.join(engineDir,"/CCBoot.js")
    ]
        .concat(newJsList).concat(jsList)
        .concat([path.join(appdir,"main.js")])
    cc.log(alljs)
    cc.log("压缩中……")
    var watcher = gulp.watch(path.join(appdir,'build.min.js'));
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        watcher.end()
        callback()
    });
    gulp.src(alljs)

        .pipe(uglify())    //压缩
        .pipe(concat("build.min.js"))
        .pipe(gulp.dest(appdir));



}))
var buildOneAsync=Wind.Async.Binding.fromCallback(function(appdir,callback){
    buildOne(appdir,callback).start()
})
var copyOne=eval(Wind.compile("async", function (appdir,callback) {

    cc.log(appdir)
    var newappdir=path.join("../../cocos2d-js-v3.6-build/build_caoke/",appdir)
    gulp.src([path.join(appdir+"/**")])
        .pipe(gulp.dest(newappdir));

}))
var copyOneAsync=Wind.Async.Binding.fromCallback(function(appdir,callback){
    copyOne(appdir,callback).start()
})
//复制文件夹
var task=eval(Wind.compile("async", function (appdir) {

    var exsit=fs.existsSync(path.join(appdir,"build.min.js"))
    if(!exsit){
        $await(buildOneAsync(appdir))
        //删除project.js
        fs.unlinkSync(path.join(appdir,"project.js"))
    }
}))
var task2=eval(Wind.compile("async", function (appdir) {
    $await(buildOneAsync(appdir))
    //删除project.js
    fs.unlinkSync(path.join(appdir,"project.js"))

}))

//改变html
gulp.task("buildHtml",function(){
    var arr=require("./configArr")
    var allTask=eval(Wind.compile("async", function (appdir) {

        for(var i=0;i<arr.length;i++){
            cc.log("当前任务："+(i+1))
            $await(buildHtml(arr[i]))
        }
        cc.log("over………………")
        cc.log("3秒后自动退出")
        setTimeout(function(){},3000)
    }))
    allTask().start()
})
//压缩过的不压缩
gulp.task("yasuo1",function(){
    var arr=require("./configArr")
    var allTask=eval(Wind.compile("async", function (appdir) {

        for(var i=0;i<arr.length;i++){
            cc.log("当前任务："+(i+1))
            $await(task(arr[i]))
        }
        cc.log("over………………")
        cc.log("3秒后自动退出")
        setTimeout(function(){},3000)
    }))
    allTask().start()
})
//强制都压缩
gulp.task("yasuo2",function(){
    var arr=require("./configArr")
    var allTask=eval(Wind.compile("async", function (appdir) {

        for(var i=0;i<arr.length;i++){
            cc.log("当前任务："+(i+1))
            $await(task2(arr[i]))
        }
        cc.log("over………………")
        cc.log("3秒后自动退出")
        setTimeout(function(){},3000)
    }))
    allTask().start()
})
//还原html
gulp.task("default",function(){
    var arr=require("./configArr")
    cc.log(arr)
    var allTask=eval(Wind.compile("async", function (appdir) {
        for(var i=0;i<arr.length;i++){
            cc.log("当前任务："+(i+1))
            $await(backHtml(arr[i]))
        }
        cc.log("over……………………")
        cc.log("3秒后自动退出")
        setTimeout(function(){},3000)
    }))
    allTask().start()
})