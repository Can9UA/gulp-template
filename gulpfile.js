'use strict';

// common
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const gutil = require('gulp-util');
const browserSync = require('browser-sync').create();
const rimraf = require('gulp-rimraf');

//pug
const pug = require('gulp-pug');

//scss
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const debug = require('gulp-debug');

// common livereload
gulp.task('watch', function () {
  gulp.watch(['app/pug/**/*.pug'], gulp.series('pug-compile'));
  gulp.watch(['app/sass/**/*.scss'], gulp.series('scss-compile'));
});

gulp.task('clean', function () {
  return gulp.src(['./app/css/*.css', './app/*.html'])
             .pipe(rimraf());
});

gulp.task('start-browserSync', function () {
  browserSync.init({
    server: './',
    port: '9000',
    notify: false,
    startPath: 'app/'
  });

  browserSync.notify('Compiling, please wait!');
  //https://github.com/BrowserSync/browser-sync/issues/1065
  browserSync.watch(['app/js/*.js', 'app/*.html', 'app/css/*.css']).on('change', browserSync.reload);
});

// pug
gulp.task('pug-compile', function () {
  return gulp.src(['app/pug/**/*.pug', '!app/pug/_*/*'])
    .pipe(plumber({
      errorHandler: function (err) {
        gutil.beep();
        gutil.log(gutil.colors.red(err.message));
        this.emit('end'); // If you don't emit an end event, your error will not cause a crash, but your task will just hang forever and you'll have to re-start the watch process anyway. (http://blog.ibangspacebar.com/handling-errors-with-gulp-watch-and-gulp-plumber/)
      }})
    )
    .pipe(
      pug({pretty: true})
    )
    .pipe(gulp.dest('app/'));
    // .pipe(browserSync.stream());
});

// scss
gulp.task('scss-compile', function () {
  return gulp.src(['./app/sass/**/*.scss']) //gulp.src(['./app/sass/{,**/}*.{scss,sass}'])
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

gulp.task('default',
  gulp.series(
    'clean', 'pug-compile', 'scss-compile',
    gulp.parallel('start-browserSync', 'watch')
  )
);