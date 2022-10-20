import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";
import { DefinePlugin, Configuration } from "webpack";

const commands = require("../core/lib/commands/commands");
const truffleLibraryDirectory = path.join(
  __dirname,
  "../..",
  "node_modules",
  "@truffle",
  "resolver",
  "solidity"
);

const truffleRequireDistDirectory = path.join(
  __dirname,
  "..",
  "..",
  "node_modules",
  "@truffle",
  "require",
  "dist"
);

const commandsEntries = commands.reduce(
  (a: Record<string, string>, command: string) => {
    a[command] = path.join(
      __dirname,
      "../..",
      "node_modules",
      "@truffle/core",
      "lib",
      "commands",
      command,
      "index.js"
    );
    return a;
  },
  {}
);

const config: Configuration = {
  entry: {
    ...commandsEntries,
    cli: path.join(
      __dirname,
      "../..",
      "node_modules",
      "@truffle/core",
      "cli.js"
    ),
    chain: path.join(
      __dirname,
      "../..",
      "node_modules",
      "@truffle/environment",
      "chain.js"
    ),
    analytics: path.join(
      __dirname,
      "../..",
      "node_modules",
      "@truffle/core",
      "lib",
      "services",
      "analytics",
      "main.js"
    ),
    library: path.join(
      __dirname,
      "../..",
      "node_modules",
      "@truffle/core",
      "index.js"
    ),
    consoleChild: path.join(
      __dirname,
      "../..",
      "node_modules",
      "@truffle/core",
      "lib",
      "console-child.js"
    )
  },

  module: {
    rules: [
      // ignores "#!/bin..." lines inside files
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, "../core"),
          path.resolve(__dirname, "../environment")
        ],
        use: "shebang-loader"
      },
      {
        //needed to get things working with lerna 4.0
        test: /rx\.lite\.aggregates\.js$/,
        parser: { amd: false }
      }
    ]
  },

  plugins: [
    new DefinePlugin({
      BUNDLE_CHAIN_FILENAME: JSON.stringify("chain.bundled.js"),
      BUNDLE_ANALYTICS_FILENAME: JSON.stringify("analytics.bundled.js"),
      BUNDLE_LIBRARY_FILENAME: JSON.stringify("library.bundled.js"),
      BUNDLE_CONSOLE_CHILD_FILENAME: JSON.stringify("consoleChild.bundled.js")
    }),

    // `truffle test`
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(
            __dirname,
            "../..",
            "node_modules",
            "@truffle/core",
            "lib",
            "commands",
            "init",
            "initSource"
          ),
          to: "initSource"
        },
        {
          from: path.join(truffleLibraryDirectory, "Assert.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertAddress.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertAddressArray.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertBalance.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertBool.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertBytes32.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertBytes32Array.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertGeneral.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertInt.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertIntArray.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertString.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertUint.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "AssertUintArray.sol")
        },
        {
          from: path.join(truffleLibraryDirectory, "SafeSend.sol")
        },
        {
          from: path.join(
            __dirname,
            "../..",
            "node_modules",
            "@truffle/core",
            "lib",
            "commands",
            "create",
            "templates/"
          ),
          to: "templates"
        },
        {
          from: path.join(
            __dirname,
            "../..",
            "node_modules",
            "@truffle/dashboard",
            "dist",
            "lib",
            "dashboard-frontend"
          ),
          to: "dashboard-frontend"
        },
        {
          from: path.join(
            truffleRequireDistDirectory,
            "sandboxGlobalContextTypes.ts"
          )
        }
      ]
    })
  ]
};

export default config;
