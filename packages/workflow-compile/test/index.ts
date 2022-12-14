import Contracts from "../src";
import Config from "@truffle/config";
import { assert } from "chai";
import { existsSync, removeSync } from "fs-extra";
import { join } from "path";

let config;

beforeEach(function () {
  config = Config.default().merge({
    contracts_directory: "./test/sources",
    contracts_build_directory: "./test/build",
    logger: {
      log(stringToLog: string) {
        this.loggedStuff = this.loggedStuff + stringToLog;
      },
      loggedStuff: ""
    }
  });
});

afterEach(function () {
  removeSync(config.contracts_build_directory);
});

describe("Contracts.compile", () => {
  it("throws when attempting to compile with an unsupported compiler", async () => {
    config.compiler = "unsupportedCompiler";

    try {
      await Contracts.compile(config);
      assert.fail("Expected an error!");
    } catch (err) {
      assert(err.message.includes("Unsupported compiler"));
    }
  });

  it("recompiles all contracts when config === true", async function () {
    this.timeout(4000);
    // initial compile
    const { contracts } = await Contracts.compileAndSave(config);
    let contractName = contracts[0].contractName;
    assert(
      existsSync(`${config.contracts_build_directory}/${contractName}.json`)
    );

    // compile again
    config.all = true;
    const { compilations } = await Contracts.compileAndSave(config);
    assert(
      compilations[0].sourceIndexes[0] ===
        join(config.contracts_directory, `${contractName}.sol`)
    );
  });
});
