'use strict';

// common
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const gutil = require('gulp-util');
const browserSync = require('browser-sync').create();
const rimraf = require('gulp-rimraf');
const zip = require('gulp-zip');

// pug
const pug = require('gulp-pug');

// scss
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const debug = require('gulp-debug');

// sprites
const spritesmith = require('gulp.spritesmith');
const merge = require('merge-stream');

// for build
const useref = require('gulp-useref');
const uglify = require('gulp-uglify');
const gulpIf = require('gulp-if');
const csso = require('gulp-csso');
const imagemin = require('gulp-imagemin');
let isBuild = false;

// for angular components
const inject = require('gulp-inject');
const angularFilesort = require('gulp-angular-filesort');

gulp.task('sprite-compile', function () {
  const spriteData = gulp.src('app/images/sprites/*.png')
      .pipe(spritesmith({
        imgName: 'sprite.png',
        imgPath: '../images/sprite.png',
        retinaSrcFilter: ['app/images/sprites/*@2x.png'],
        retinaImgName: 'sprite@2x.png',
        retinaImgPath: '../images/sprite@2x.png',
        cssName: '_sprites-mixins.scss',
        padding: 4,
        cssVarMap: function(sprite) {
          sprite.name = 'ico-' + sprite.name;
        }
      }));

  const imgStream = spriteData.img.pipe(gulp.dest('app/images/'));

  const cssStream = spriteData.css.pipe(gulp.dest('app/sass/atoms/'));

  return merge(imgStream, cssStream);
});

// common livereload
gulp.task('watch', function () {
  browserSync.init({
    server: './',
    port: '9000',
    notify: false,
    startPath: 'app/'
  });

  gulp.watch(['app/pug/**/*.pug'], gulp.series('pug-compile', 'inject-angular-components', 'reload')); // TODO: remove html if pug file removed
  gulp.watch(['app/sass/**/*.scss'], gulp.series('scss-compile', 'reload'));
  gulp.watch(['app/images/sprites/*.png'], gulp.series('sprite-compile', 'scss-compile', 'reload'));
  gulp.watch(['app/images/**/*.*', '!app/images/sprites/*.png'], gulp.series('reload'));
  gulp.watch(['app/js/**/*.js'], gulp.series('inject-angular-components', 'reload'));
});

gulp.task('clean', function () {
  return gulp.src(['./app/css/*.css', './app/*.html'])
             .pipe(rimraf());
});

gulp.task('clean-build', function () {
  return gulp.src(['./build/**/*.*'])
             .pipe(rimraf());
});

gulp.task('reload', function (callback) {
  browserSync.reload();
  callback();
});

// pug
gulp.task('pug-compile', function () {
  return gulp.src(['app/pug/**/*.pug', '!app/pug/_*/*'])
    .pipe(plumber({
      errorHandler: function (err) {
        gutil.beep();
        gutil.log(gutil.colors.red(err.message));
        this.emit('end');
      }})
    )
    .pipe(
      pug({pretty: true})
    )
    .pipe(gulp.dest('app/'));
});

// scss
gulp.task('scss-compile', function () {
  return gulp.src(['./app/sass/**/*.scss'])
      .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
      .pipe(autoprefixer({
        browsers: ['last 3 versions'], // ['last 3 versions', 'IE 8']
        cascade: true
      }))
      .pipe(debug({title: 'compile:'}))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./app/css/'));
});

// angular
gulp.task('inject-angular-components', function () {
  const sources = gulp.src(['./app/js/**/*.js'])
                      .pipe(plumber({
                        errorHandler: function (err) {
                          gutil.beep();
                          gutil.log(gutil.colors.red(err.message));
                          this.emit('end');
                        }})
                      )
                      .pipe(angularFilesort());
  const options = {
    removeTags: isBuild,
    relative: true
  };

  return gulp.src('./app/index.html')
             .pipe(inject(sources, options))
             .pipe(gulp.dest('./app/'));
});

// build
gulp.task('minimize', function () {
  return gulp.src('./app/*.html')
             .pipe(useref())
             .pipe(gulpIf('*.js', uglify()))
             .pipe(gulpIf('*.css', csso()))
             .pipe(gulp.dest('build'));
});

gulp.task('imagemin', function () {
  return gulp.src([
                './app/images/**/*',
                '!./app/images/sprites{,/**}' // TODO: ignore sprites folder
              ])
             .pipe(imagemin({
               progressive: true
             }))
             .pipe(gulp.dest('./build/images'));
});

gulp.task('checkBuild', function (callback) {
  isBuild = true;
  callback();
});

gulp.task('build-zip', function () {
  return gulp.src('build/*')
             .pipe(zip('archive.zip'))
             .pipe(gulp.dest('./'));
});

// tasks for work ----------------------
gulp.task('default',
  gulp.series(
    'clean', 'pug-compile', 'inject-angular-components', 'sprite-compile', 'scss-compile',
    gulp.parallel('watch')
  )
);

gulp.task('build',
  gulp.series(
      'checkBuild', 'clean', 'pug-compile', 'inject-angular-components', 'sprite-compile', 'scss-compile', 'clean-build',
      gulp.parallel('minimize', 'imagemin')
    )
);

gulp.task('zip', gulp.series('build', 'build-zip'));