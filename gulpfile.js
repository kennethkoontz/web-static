var gulp = require('gulp');
var env = require('node-env-file');
var iife = require('gulp-iife');
var less = require('gulp-less');
var ngConstant = require('gulp-ng-constant');
var ngAnnotate = require('gulp-ng-annotate');
var autoprefixer = require('gulp-autoprefixer');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var templateCache = require('gulp-angular-templatecache');
var connect = require('gulp-connect');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gulpif = require('gulp-if');

gulp.task('env', function () {
  env(__dirname + '/.env', {overwrite: true});
});

gulp.task('server', function () {
  connect.server({
    root: 'build',
    port: process.env.PORT || '9000',
    livereload: true
  });
});

gulp.task('scripts', function () {
  gulp.src([
    './app/app.module.js',
    './app/**/*.module.js',
    './app/*.js',
    './app/**/*.js'
  ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(iife())
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(ngAnnotate())
    .pipe(gulpif(process.env.DEPLOY, uglify()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./build/js'));
});

gulp.task('less', function () {
  gulp.src(['./app/less/app.less'])
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gulp.dest('./build/css'));
});

gulp.task('copy-index', function () {
  gulp.src('./app/index.html')
    .pipe(gulp.dest('./build'));
});

gulp.task('templates', function () {
  gulp.src([
    '!./app/index.html',
    './app/**/*.html'
  ])
    .pipe(templateCache('tmpl.js', {
      root: '',
      module: 'templates',
      standalone: true,
      base: function (file) {
        var filename = /[^/|^\\]*$/.exec( file.relative )[0];
        return 'templates/' + filename;
      }
    }))
    .pipe(gulp.dest('./build/js'));
});

gulp.task('favicon', function () {
  gulp.src('./app/*')
    .pipe(gulp.dest('./build'));
});

gulp.task('dev-config', function () {
  process.env.DEPLOY = false;
  gulp.src('./config.json')
    .pipe(ngConstant({
      name: 'benchmark.env',
      constants: {
        URLS: {
          // example:
          // API_URL: process.env.API_URL
        },
        ENV: {
          // example:
          // API_TOKEN: process.env.API_TOKEN
        }
      }
    }))
    .pipe(concat('env.js'))
    .pipe(gulp.dest('./build/js'));
});

gulp.task('config', function () {
  process.env.DEPLOY = true;
  gulp.src('./config.json')
    .pipe(ngConstant({
      name: 'benchmark.env',
      constants: {
        URLS: {
          // example:
          // API_URL: process.env.API_URL
        },
        ENV: {
          // example:
          // API_TOKEN: process.env.API_TOKEN
        }
      }
    }))
    .pipe(concat('env.js'))
    .pipe(gulp.dest('./build/js'));
});

gulp.task('dep-js', function () {
  gulp.src([
    './bower_components/angular/angular.min.js'
  ])
    .pipe(concat('deps.js'))
    .pipe(gulp.dest('./build/js'));
});

gulp.task('dep-css', function() {
  gulp.src([
    // example:
    // './bower_components/module/file.css'
  ])
    .pipe(concat('deps.css'))
    .pipe(gulp.dest('./build/css/'));
});

gulp.task('watch', function () {
  gulp.watch([
    'build/**/*.html',
    'build/**/*.js',
    'build/**/*.css'
  ], function (event) {
    return gulp
      .src(event.path)
      .pipe(connect.reload());
  });
  gulp.watch(['.env'], ['env', 'config']);
  gulp.watch(['./app/**/*.js'], ['scripts']);
  gulp.watch(['./app/**/*.html', '!./app/index.html'], ['templates']);
  gulp.watch('./app/less/*.less', ['less']);
  gulp.watch('./app/less/*/*.less', ['less']);
  gulp.watch('./app/index.html', ['copy-index']);
});

gulp.task('default', ['env', 'dev-config', 'scripts', 'templates', 'less', 'copy-index', 'favicon', 'dep-js', 'dep-css']);
gulp.task('dev', ['env', 'dev-config', 'scripts', 'templates', 'less', 'copy-index', 'favicon', 'dep-js', 'dep-css', 'server', 'watch']);
gulp.task('build', ['env', 'config', 'scripts', 'templates', 'less', 'copy-index', 'favicon', 'dep-js', 'dep-css', 'fonts']);
gulp.task('deploy', ['build']);
