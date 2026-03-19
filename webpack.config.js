import { GitRevisionPlugin } from 'git-revision-webpack-plugin';
import webpack from 'webpack';
import path from 'path';

// Workaround now this is a module...
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// const StripAssertionCode = require('ts-transformer-unassert').default;

const ADD_TS_EXTENSIONS_TO_WEPACK = [".ts", ".tsx", ".js"];
const SUPPORT_FULLY_QUALIFIED_TS_ESM_IMPORTS = {
  ".js": [".js", ".ts"],
  ".cjs": [".cjs", ".cts"],
  ".mjs": [".mjs", ".mts"],
};
const HANDLE_TYPESCRIPT_WITH_TS_LOADER = { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" };

// Output bundle directly to the project root so it is served alongside index.html
// without requiring a separate build/dist directory.
const OUTPUT_DIRECTORY = '.';

function addDevelopmentConfigTo(options) {
  options.devtool = 'source-maps';
  options.mode = 'development';
}

function addProductionConfigTo(options) {
  /*
  const assertionStrippingConfig = {
    options: {
      getCustomTransformers: () => {
        return ({before: [StripAssertionCode]});
      }
    }
  };
  stripTSAssertionsRule = Object.assign(assertionStrippingConfig, HANDLE_TYPESCRIPT_WITH_ATL);
  options.module.rules.push(stripTSAssertionsRule);
  */
}

function getBuildId() {
  // Technically don't need to use the webpack plugin, as not passing it to Webpack...
  const gitPlugin = new GitRevisionPlugin({
    commitHashCommand: 'log -1 --pretty=format:%h'
  });

  return gitPlugin.commithash().slice(0, 12);
}

function commonOptions() {
  const options = {
    entry: './src/micropolis.js',
    resolve: {
      extensions: ADD_TS_EXTENSIONS_TO_WEPACK,
      extensionAlias: SUPPORT_FULLY_QUALIFIED_TS_ESM_IMPORTS,
    },
    module: {
      rules: [
        HANDLE_TYPESCRIPT_WITH_TS_LOADER,
      ],
    },
    output: {
      path: path.resolve(__dirname, OUTPUT_DIRECTORY),
      filename: 'micropolis.bundle.js'
    },
    plugins: [
      new webpack.DefinePlugin({
        BUILD_HASH: JSON.stringify(getBuildId()),
        BUILD_DATE: JSON.stringify(new Date().toLocaleString('it-IT', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })),
      }),
    ],
  };

  return options;
}

export default function(env, argv) {
  let options = commonOptions();

  if (env.development) {
    addDevelopmentConfigTo(options);
  } else {
    addProductionConfigTo(options);
  }

  return options;
};
