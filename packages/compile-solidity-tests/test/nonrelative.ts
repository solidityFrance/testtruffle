import debugModule from "debug";
const debug = debugModule("compile:test:test_nonrelative");
import { describe, it, beforeEach, after, before } from "mocha";
const path = require("path");
import { Compile } from "@truffle/compile-solidity";
import { assert } from "chai";
import { Resolver } from "@truffle/resolver";
import process = require("process");
import tmp = require("tmp");
tmp.setGracefulCleanup();
import fs = require("fs");
let originalWorkingDirectory, options;

describe("Non-relative non-absolute file paths", function () {
  this.timeout(5000);

  beforeEach(function () {
    options = {
      working_directory: __dirname,
      contracts_directory: path.join(__dirname, "./sources/badSources"),
      contracts_build_directory: path.join(__dirname, "./does/not/matter"), //nothing is actually written, but resolver demands it
      compilers: {
        solc: {
          version: "0.8.6",
          settings: {
            optimizer: {
              enabled: false,
              runs: 200
            }
          }
        }
      },
      resolver: undefined,
      quiet: true
    };
    options.resolver = new Resolver(options);
    originalWorkingDirectory = process.cwd();
    process.chdir(options.contracts_directory);
  });

  it("Refuses to compile non-relative non-absolute paths", async function () {
    this.timeout(150000);
    const paths = ["Nonrelative.sol"].map(filePath =>
      path.join(options.contracts_directory, filePath)
    );

    debug("current dir: %s", process.cwd());

    try {
      await Compile.sourcesWithDependencies({
        paths,
        options
      });
      assert.fail("Compilation should have failed");
    } catch (error) {
      debug("error: %O", error);
      if (!error.message.includes('Source "Imported.sol" not found')) {
        throw error; //rethrow errors that aren't the one we expect
      }
      //otherwise, we're good
    }
  });

  after("Reset working directory", function () {
    process.chdir(originalWorkingDirectory);
  });
});

describe("Non-canonical absolute file paths", function () {
  this.timeout(5000); // solc
  let tmpdir;

  before("Set up temporary directory and project", async function () {
    tmpdir = tmp.dirSync({ unsafeCleanup: true }).name; //tmp uses callbacks, not promises, so using sync
    await fs.promises.mkdir(path.join(tmpdir, "./contracts"));
    const contracts_directory = path.join(tmpdir, "./contracts");
    options = {
      working_directory: tmpdir,
      contracts_directory,
      contracts_build_directory: path.join(tmpdir, "./build/contracts"), //nothing is actually written, but resolver demands it
      compilers: {
        solc: {
          version: "0.8.6",
          settings: {
            optimizer: {
              enabled: false,
              runs: 200
            }
          }
        }
      },
      quiet: true
    };
    options.resolver = new Resolver(options);
    const importedPath = path.join(options.contracts_directory, "Imported.sol");
    const importerPath = path.join(
      options.contracts_directory,
      "DoubleSlash.sol"
    );
    await fs.promises.copyFile(
      path.join(__dirname, "./sources/badSources/Imported.sol"),
      importedPath
    );
    await fs.promises.writeFile(
      importerPath,
      `import "/${importedPath}";` //note the extra slash
    );
  });

  it("Refuses to compile non-canonical absolute paths", async function () {
    this.timeout(150000);

    try {
      await Compile.all(options);
      assert.fail("Compilation should have failed");
    } catch (error) {
      debug("error: %O", error);
      if (!error.message.match(/Source "\/\/[^"]*" not found/)) {
        throw error; //rethrow errors that aren't the one we expect
      }
      //otherwise, we're good
    }
  });
});
