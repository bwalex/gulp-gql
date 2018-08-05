let parser = require('graphql/language/parser')
let R = require('ramda')
let PluginError = require('plugin-error')
let through = require('through2')

const PLUGIN_NAME = 'gulp-gql'

const recurseObj = fn => d => {
  if (R.is(Array, d)) {
    return R.map(recurseObj(fn), d)
  } else if (R.is(Object, d)) {
    return R.map(recurseObj(fn), fn(d))
  } else {
    return d
  }
}

const conjFragmentSpread = (a, d) => {
  if (R.is(Array, d)) {
    return R.reduce(
      conjFragmentSpread,
      a,
      d
    )
  } else if (R.is(Object, d)) {
    return R.reduce(
      conjFragmentSpread,
      d.kind === 'FragmentSpread'
        ? R.append(d.name.value, a)
        : a,
      R.values(d)
    )
  } else {
    return a
  }
}

const defsToObj = (nameFn, defs) =>
  R.fromPairs(
    R.map(
      op => [nameFn(op), op],
      defs
    )
  )

function buildDefs(src, options) {
  const stripFn = R.propOr(true, 'stripLoc', options)
    ? R.dissoc('loc')
    : R.compose(R.dissoc('startToken'), R.dissoc('endToken'))

  let doc = recurseObj(stripFn)(parser.parse(src))

  let groupedDefs = R.groupBy(R.prop('kind'), doc.definitions)

  let rawOpDefsWithDeps = R.map(
    op => ({
      deps: conjFragmentSpread([], op),
      op,
    }),
    R.propOr([], 'OperationDefinition', groupedDefs)
  )

  let rawFragDefs = R.propOr([], 'FragmentDefinition', groupedDefs)

  const fragDefs = defsToObj(R.path(['name', 'value']), rawFragDefs)
  const opDefsByType = R.groupBy(R.path(['op', 'operation']), rawOpDefsWithDeps)
  const opDefs = R.map(
    ops => defsToObj(R.path(['op', 'name', 'value']), ops),
    opDefsByType
  )

  const defs = R.assoc('fragment', fragDefs, opDefs)

  return defs
}

function buildJS(defs, options) {
  const pretty = R.propOr(false, 'pretty', options)
  return `export default ${JSON.stringify(defs, null, pretty ? '  ' : null)}`
}


function gql(options) {
  // Creating a stream through which each file will pass
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    if (file.isBuffer()) {
      let c = file.contents.toString()
      let defs = buildDefs(c, options)
      let jsStr = buildJS(defs, options)
      file.contents = Buffer.from(jsStr)
    }

    cb(null, file);
  });
}

gql.buildDefs = buildDefs
gql.buildJS = buildJS

module.exports = gql
