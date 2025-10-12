var gulp = require('gulp');
var gulpNgConfig = require('gulp-ng-config');

gulp.task('config', function () {
  gulp.src('config.json')
  .pipe(gulpNgConfig('app.config', {environment: 'local'}))
  .pipe(gulp.dest('src/app/'))
});

gulp.task('config:build', function () {
  gulp.src('config.json')
  .pipe(gulpNgConfig('app.config', {environment: 'production'}))
  .pipe(gulp.dest('src/app/'))
});

gulp.task('config:buildqa', function () {
  gulp.src('config.json')
  .pipe(gulpNgConfig('app.config', {environment: 'qa'}))
  .pipe(gulp.dest('src/app/'))
});
