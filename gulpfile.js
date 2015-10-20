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
var RevAll = require('gulp-rev-all');
var awspublish = require('gulp-awspublish');
var cloudfront = require('gulp-cloudfront');
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
    '!./app/js/printPDFjs/xepOnline.jqPlugin.js',
    './app/module.js',
    './app/**/module.js',
    './app/*.js',
    './app/**/*.js'
  ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(iife())
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(ngAnnotate())
    .pipe(gulpif(process.env.BUILD === 'true', uglify()))
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

gulp.task('copy-img', function () {
  gulp.src('./app/img/*.*')
    .pipe(gulp.dest('./build/img'));
});

gulp.task('favicon', function () {
  gulp.src('./app/*')
    .pipe(gulp.dest('./build'));
});

gulp.task('dev-config', function () {
  process.env.BUILD = 'false';
  gulp.src('./config.json')
    .pipe(ngConstant({
      name: 'benchmark.env',
      constants: {
        URLS: {
          BENCHMARK_API_URL: process.env.DEV_BENCHMARK_API_URL,
          BENCHMARK_PUBLIC_URL: process.env.BENCHMARK_PUBLIC_URL,
          BENCHMARK_SURVEY_URL: process.env.DEV_BENCHMARK_SURVEY_URL
        },
        ENV: {
          BENCHMARK_CLIENT_ID: process.env.BENCHMARK_CLIENT_ID,
          BENCHMARK_CLIENT_SECRET: process.env.BENCHMARK_CLIENT_SECRET
        }
      }
    }))
    .pipe(concat('env.js'))
    .pipe(gulp.dest('./build/js'));
});

gulp.task('config', function () {
  process.env.BUILD = 'true';
  gulp.src('./config.json')
    .pipe(ngConstant({
      name: 'benchmark.env',
      constants: {
        URLS: {
          BENCHMARK_API_URL: process.env.BENCHMARK_API_URL,
          BENCHMARK_PUBLIC_URL: process.env.BENCHMARK_PUBLIC_URL,
          BENCHMARK_SURVEY_URL: process.env.BENCHMARK_SURVEY_URL
        },
        ENV: {
          BENCHMARK_CLIENT_ID: process.env.BENCHMARK_CLIENT_ID,
          BENCHMARK_CLIENT_SECRET: process.env.BENCHMARK_CLIENT_SECRET
        }
      }
    }))
    .pipe(concat('env.js'))
    .pipe(gulp.dest('./build/js'));
});

gulp.task('dep-js', function () {
  gulp.src([
    './bower_components/angular/angular.min.js',
    './bower_components/angular-ui-router/release/angular-ui-router.min.js',
    './bower_components/angular-cookie/angular-cookie.min.js',
    './bower_components/angular-animate/angular-animate.min.js',
    './bower_components/ngstorage/ngStorage.min.js',
    './bower_components/angulartics/dist/angulartics.min.js',
    './bower_components/angulartics/dist/angulartics-segmentio.min.js',
    './bower_components/angular-sanitize/angular-sanitize.min.js',
    './bower_components/angular-strap/dist/angular-strap.min.js',
    './bower_components/angular-strap/dist/angular-strap.tpl.min.js',
    './bower_components/d3/d3.min.js',
    './bower_components/c3/c3.min.js',
    './bower_components/lodash/lodash.min.js',
    './bower_components/angular-google-maps/dist/angular-google-maps.min.js',
    './bower_components/angular-ui-select/dist/select.min.js',
    './bower_components/angular-moment/angular-moment.min.js',
    './bower_components/moment/min/moment.min.js',
    './bower_components/lrInfiniteScroll/lrInfiniteScroll.js',
    './bower_components/twitter-text/twitter-text.js',
    './bower_components/angular-bootstrap/ui-bootstrap.min.js',
    './bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
    './bower_components/angular-ui-tree/dist/angular-ui-tree.min.js',
    './bower_components/lodash-deep/lodash-deep.min.js'
  ])
    .pipe(concat('deps.js'))
    .pipe(gulp.dest('./build/js'));
});

gulp.task('dep-css', function() {
  gulp.src([
    './bower_components/angular-ui-select/dist/select.css',
    './bower_components/c3/c3.css'
  ])
    .pipe(concat('deps.css'))
    .pipe(gulp.dest('./build/css/'));
});

gulp.task('fonts', function () {
  gulp.src(['./app/fonts/*/*'])
    .pipe(gulp.dest('./build/fonts'));
});

gulp.task('watch', function () {
  gulp.watch([
    'build/**/*.html',
    'build/**/*.js',
    'build/**/*.css',
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

gulp.task('revision', function() {
  var revAll = new RevAll({ dontSearchFile: [ 'deps.js' ]});
  var aws = {
    "key": process.env.AWS_ACCESS_KEY_ID,
    "secret": process.env.AWS_SECRET_KEY,
    "bucket": process.env.AWS_BUCKET,
    "region": "us-west-1",
    "distributionId": process.env.AWS_CLOUDFRONT_ID,
    "patternIndex": /^\/index\.[a-f0-9]{8}\.html(\.gz)*$/gi
  };
  var publisher = awspublish.create(aws);
  var headers = {'Cache-Control': 'max-age=315360000, no-transform, public'};

  gulp.src('build/**')
    .pipe(revAll.revision())
    .pipe(awspublish.gzip())
    .pipe(publisher.publish(headers))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter())
    .pipe(cloudfront(aws));
});

gulp.task('default', ['env', 'dev-config', 'scripts', 'templates', 'less', 'copy-index', 'copy-img', 'favicon', 'dep-js', 'dep-css', 'fonts']);
gulp.task('dev', ['env', 'dev-config', 'scripts', 'templates', 'less', 'copy-index', 'copy-img', 'favicon', 'dep-js', 'dep-css', 'fonts', 'server', 'watch']);
gulp.task('build', ['env', 'config', 'scripts', 'templates', 'less', 'copy-index', 'copy-img', 'favicon', 'dep-js', 'dep-css', 'fonts']);
gulp.task('deploy', ['build', 'revision']);
