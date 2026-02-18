// Prevent Expo from auto-detecting the pnpm workspace root as Metro's server root.
// Without this, expo-router resolves app/ from the workspace root instead of this app.
process.env.EXPO_NO_METRO_WORKSPACE_ROOT = "1";

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Monorepo root (where pnpm-workspace.yaml lives)
const monorepoRoot = path.resolve(__dirname, "../../..");

const config = getDefaultConfig(__dirname);

// Watch the workspace packages so Metro picks up changes
config.watchFolders = [
  path.resolve(__dirname, "../../packages"),
  // Also watch the monorepo node_modules for hoisted deps
  path.resolve(monorepoRoot, "node_modules"),
];

// Let Metro resolve modules from both the app's node_modules
// and the monorepo root node_modules (where pnpm hoists shared deps)
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
