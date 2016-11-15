'use strict';
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var tsProject = ts.createProject('tsconfig.json');
var spawn = require('child_process').spawn;
var bump = require('gulp-bump');
var child_process = require('child_process');
var prompt = require('gulp-prompt');
var git = require('gulp-git');
var os = require('os')
var exec = child_process.exec

gulp.task('quickpatch', ['pushPatch'], function (done) {
    spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});

gulp.task('bumpPatch', function () {
    return gulp.src('./package.json').pipe(bump({
        type: 'patch'
    })).pipe(gulp.dest('./'));
});


gulp.task('Addbumped', ['bumpPatch'], function () {
    return gulp.src('.').pipe(git.add({ args: '-A' }));
});
gulp.task('pushPatch', ['Addbumped'], function () {
    return gulp.src('.').pipe(prompt.prompt({
        type: 'input',
        name: 'commit',
        message: 'enter a commit msg, eg initial commit'
    }, function (res) {
        return gulp.src('.').pipe(git.commit(res.commit)).on('end', function () {
            git.push()
        });;
    }));
});

gulp.task('test', function (done) {
    return gulp.src('test/**/*.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }).on('error', function (err) {
            throw err;
        }).on('close', function () {
            done()
        }));
});

gulp.task('release', function (done) {

    var utime = 'machio_' + new Date().getTime();

var cmdcompiledist='rsync -av ' + __dirname + '/* /tmp/' + utime + ' --exclude dists --exclude gulpfile.js --exclude typings --exclude ".git*" --exclude node_modules --exclude "tsconfig.json" --exclude "*.ts" && cd /tmp/' + utime + '/front && npm i --production --silent && cd /tmp/' + utime + ' && npm i --production --silent ; rm -rf ' + __dirname + '/dists/' + os.arch() + ' && mv /tmp/' + utime + ' ' + __dirname + '/dists/' + os.arch()+' && cd ' + __dirname + '/dists/' + os.arch()+' && find . -name "*.ts" -delete && rm -rf $(find . -name "typings" -print) && rm -rf .git*'

var cmdcopyfiles='rm -rf ' + __dirname + '/dists/x64/front && mkdir ' + __dirname + '/dists/x64/front && cp -R ' + __dirname + '/front/dist/* ' + __dirname + '/dists/x64/front/ && sync'

    // aumentare il buffer o passare a spawn o eliminare stdout npm
    exec(cmdcompiledist+' && sync && '+cmdcopyfiles, function (err, stdout, stderr) {
        if (err) {
            console.log(err)
        }
        done()
    })
});

gulp.task('build', function (done) {

    var tsResult = tsProject.src() // instead of gulp.src(...)
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated 

        .pipe(ts(tsProject, {
            sortOutput: true,
					   }));

    return tsResult
        .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file 
        .pipe(gulp.dest('.'));
});



