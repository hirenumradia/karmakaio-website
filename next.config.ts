import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compiler options (replaces Babel config)
  compiler: {
    // Enables the styled-components plugin
    styledComponents: true,
  },
  // Webpack configuration for GLSL files
  webpack(config, options) {
    // Add loader for GLSL files
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader"],
    });

    // Add babel-loader with your specific configuration
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          presets: [
            "next/babel",
            "@babel/preset-env",
            ["@babel/preset-react", { runtime: "automatic" }]
          ],
          plugins: [
            "macros",
            "@babel/plugin-proposal-private-property-in-object"
          ]
        }
      }
    });
  
      return config;
    },
    // Experimental features
    experimental: {
      // Force using SWC transforms
      forceSwcTransforms: true,
    },
};

export default nextConfig;
