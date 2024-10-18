const path = require("path");

module.exports = function override(config, env) {
  config.module.rules.push({
    test: /\.(glsl|vs|fs|vert|frag)$/,
    use: ["raw-loader"],
  });

  return config;
};
