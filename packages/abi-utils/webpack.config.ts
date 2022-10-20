import { Configuration } from "webpack";

const pkg = require("./package.json");

const config: Configuration = {
  entry: {
    index: pkg.main.startsWith(".") ? pkg.main : `./${pkg.main}`
  }
};

export default config;
