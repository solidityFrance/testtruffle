import fs from "fs";
import path from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import {
  DefinePlugin,
  BannerPlugin,
  ProgressPlugin,
  IgnorePlugin,
  Configuration
} from "webpack";

interface Paths {
  packageDir: string;
  outputDir: string;
}

function getPaths(packageName: string): Paths {
  if (!packageName) {
    throw new Error(
      "'packageName' argument must be passed when fetching base config"
    );
  }

  const packageDirName =
    packageName.indexOf("/") == -1
      ? packageName
      : packageName.split("/").slice(-1)[0];

  const packageDir = path.resolve(__dirname, "..", "packages", packageDirName);

  if (!fs.existsSync(packageDir)) {
    throw new Error(
      `Cannot find package directory for package named '${packageName}' at '${packageDir}'`
    );
  }

  const outputDir = path.resolve(packageDir, "bundled");

  return {
    packageDir,
    outputDir
  };
}

function isProd(env: Record<string, boolean | number | string>) {
  if (env.production === false || env.prod === false) {
    return false;
  }

  if (env.development === true || env.dev === true) {
    return false;
  }

  // default to production unless otherwise specified
  return true;
}

export function getBaseConfig(packageName: string) {
  const paths = getPaths(packageName);
  const pkg = require(path.resolve(paths.packageDir, "package.json"));

  return function (env: Record<string, boolean | number | string>, _: any) {
    const config: Configuration = {
      mode: isProd(env) ? "production" : "development",
      target: "node",
      node: {
        // For this option, see here:
        // https://github.com/webpack/webpack/issues/1599#issuecomment-186841345
        __dirname: false,
        __filename: false
      },

      context: paths.packageDir,

      output: {
        path: paths.outputDir,
        filename: "[name].bundled.js",
        libraryTarget: "commonjs",
        chunkLoading: "require"
      },

      // There are many source map options we can choose. Choosing an option with
      // "nosources" allows us to reduce the size of the bundle while still allowing
      // high quality source maps.
      devtool: "nosources-source-map",

      optimization: {
        minimize: false,
        splitChunks: {
          // The following two items splits the bundle into pieces ("chunks"),
          // where each chunk is less than 5 million bytes (shorthand for roughly
          // 5 megabytes). The first option, `chunks: all`, is the main powerhouse:
          // it'll look at common chunks (pieces of code) between each entry point
          // and separates them its own bundle. When an entry point is run,
          // the necessary chunks will be automatically required as needed.
          // This significantly speeds up bundle runtime because a) chunks can be
          // cached by node (e.g., within the `require` infrastructure) and b) we
          // won't `require` any chunks not needed by the command run by the user.
          // It also reduces the total bundle size since chunks can be shared
          // between entry points.
          chunks: "all",
          // I chose 5000000 based on anecdotal results on my machine. Limiting
          // the size to 5000000 bytes shaved off a few hundreths of a milisecond.
          // The negative here is creates more chunks. We can likely remove it and
          // let webpack decide with `chunks: all` if we prefer.
          maxSize: 5000000
        }
      },

      externals: [
        // truffle-config uses the original-require module.
        // Here, we leave it as an external, and use the original-require
        // module that's a dependency of Truffle instead.
        /^original-require$/,
        /^mocha$/,
        /^@truffle\/[a-zA-Z0-9-_]+$/,
        /^ganache$/,
        // this is the commands portion shared by cli.js and console-child.js
        /^\.\/commands.bundled.js$/,
        /^ts-node$/,
        /^typescript$/
      ],

      resolve: {
        alias: {
          "bn.js": path.join(
            __dirname,
            "..",
            "node_modules",
            "bn.js",
            "lib",
            "bn.js"
          ),
          "original-fs": path.join(
            __dirname,
            "..",
            "packages",
            "truffle",
            "./nil.js"
          ),
          "scrypt": "js-scrypt"
        }
      },

      stats: {
        warnings: false
      },

      plugins: [
        new DefinePlugin({
          BUNDLE_VERSION: JSON.stringify(pkg.version)
        }),

        // Put the shebang back on.
        new BannerPlugin({ banner: "#!/usr/bin/env node\n", raw: true }),

        new ProgressPlugin(),

        new CleanWebpackPlugin(),

        // Make web3 1.0 packable
        new IgnorePlugin({ resourceRegExp: /^electron$/ })
      ]
    };

    return config;
  };
}

export default getBaseConfig;
