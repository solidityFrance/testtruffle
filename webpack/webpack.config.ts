import { merge } from "webpack-merge";
import fs from "fs";
import path from "path";

import { getBaseConfig } from "./webpack.config.base";

function config(
  env: Record<string, string | number | boolean>,
  argv: Record<string, any>
) {
  const packages = fs
    .readdirSync(path.resolve(__dirname, "..", "packages"))
    .filter(
      pkg =>
        fs.existsSync(
          path.join(__dirname, "..", "packages", pkg, "webpack.config.ts")
        ) ||
        fs.existsSync(
          path.join(__dirname, "..", "packages", pkg, "webpack.config.js")
        )
    );

  return packages.map(packageName => {
    console.log(packageName);

    let packageConfig = require(`../packages/${packageName}/webpack.config`);
    packageConfig = packageConfig.default
      ? packageConfig.default
      : packageConfig;
    packageConfig =
      typeof packageConfig === "function"
        ? packageConfig(env, argv)
        : packageConfig;

    const base =
      packageName !== "contract" ? getBaseConfig(packageName)(env, argv) : {};
    const merged = merge(
      {},
      base,
      packageConfig.default ? packageConfig.default : packageConfig
    );
    return merged;
  });
}

export default config;
