var gulp = require('gulp');
var concat = require('gulp-concat');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');

gulp.task('make:development', function() {
    var b = browserify({
        entries: './browser.js',
        debug: true
    });

    return b.bundle()
        .pipe(source('mimeo.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dev/'))
});

gulp.task('watch:development', function() {
    gulp.watch('src/*.js', ['make:development']);
});

gulp.task('make:production', function() {
    var b = browserify({
        entries: './browser.js',
        debug: true
    });

    return b.bundle()
        .pipe(source('mimeo.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/'))
});