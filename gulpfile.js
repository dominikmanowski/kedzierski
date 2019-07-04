const { watch, src, dest, series, parallel } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const del = require('del');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const ghPages = require('gulp-gh-pages');

const paths = {
  app: {
    scss: './src/scss/**/*.scss',
    fonts: './src/fonts/*',
    images: './src/images/*.*',
    html: './src/*.html',
  },
  dist: {
    base: './dist/',
    fonts: './dist/fonts',
    images: './dist/images',
  },
  extraBundles: './dist/main.css',
};

function jsTask(done) {
  src(paths.app.js)
    .pipe(
      babel({
        presets: ['@babel/preset-env'],
      })
    )
    .pipe(concat('main.bundle.js'))
    .pipe(uglify())
    .pipe(dest(paths.dist.base));
  done();
}

function cssTask(done) {
  src(paths.app.scss)
    .pipe(
      plumber({
        handleError: function(err) {
          console.log(err);
          this.emit('end');
        },
      })
    )
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(rename({ suffix: '.bundle' }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(dest(paths.dist.base));
  done();
}

function fontTask(done) {
  src(paths.app.fonts).pipe(dest(paths.dist.fonts));
  done();
}

function imagesTask(done) {
  src(paths.app.images).pipe(dest(paths.dist.images));
  done();
}

function templateTask(done) {
  src(paths.app.html).pipe(dest(paths.dist.base));
  done();
}

function watchFiles() {
  watch(paths.app.scss, series(cssTask, reload));
  watch(paths.app.fonts, series(fontTask, reload));
  watch(paths.app.images, series(imagesTask, reload));
  watch(paths.app.html, series(templateTask, reload));
}

function liveReload(done) {
  browserSync.init({
    server: {
      baseDir: paths.dist.base,
    },
  });
  done();
}

function reload(done) {
  browserSync.reload();
  done();
}

function cleanUp() {
  return del([paths.dist.base]);
}

function deploy() {
  src(paths.dist.base).pipe(ghPages());
}

exports.dev = parallel(
  cssTask,
  fontTask,
  imagesTask,
  templateTask,
  watchFiles,
  liveReload
);
exports.build = series(
  cleanUp,
  parallel(jsTask, cssTask, fontTask, imagesTask, templateTask)
);

exports.deploy = series(deploy);
