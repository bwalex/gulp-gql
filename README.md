# gulp-gql

[![npm version](https://badge.fury.io/js/gulp-gql.svg)](https://badge.fury.io/js/gulp-gql)

Pre-compile graphql documents and generate a plain JS object export with separate entries for queries, mutations and fragments.

## Usage

```javascript
const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const gql = require('gulp-gql');

const prodEnv = (process.env.NODE_ENV === 'production');

gulp.task('gql', () => {
  gulp.src(['resources/graphql/**.graphql'])
    .pipe(concat('all.graphql'))
    .pipe(gql({pretty: !prodEnv}))
    .pipe(rename('gql.js'))
    .pipe(gulp.dest('src/gen'));
});
```

Example output:

```json
export default {
  "query": {
    "DashboardsList": {
      "deps": [],
      "op": {
        "kind": "OperationDefinition",
        "operation": "query",
        "name": {
          "kind": "Name",
          "value": "DashboardsList"
        },
        ...
      }
    },
    ...
  },
  "mutation": {
    "CreateDashboard": {
      "deps": [],
      "op": {
        "kind": "OperationDefinition",
        "operation": "mutation",
        "name": {
          "kind": "Name",
          "value": "CreateDashboard"
        },
        ...
      }
    },
    ...
  },
  "fragment": {
    "NoteFragment": {
      "kind": "FragmentDefinition",
      "name": {
        "kind": "Name",
        "value": "NoteFragment"
      },
      ...
    },
    ...
  }
}
```
