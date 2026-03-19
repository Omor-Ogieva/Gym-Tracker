// Stub the Expo winter runtime globals that are unavailable in a Node test environment.
// jest-expo v55+ injects Expo's "winter" JS runtime (import.meta, etc.) which
// references browser/native APIs not present under Jest's node testEnvironment.
global.__ExpoImportMetaRegistry = {};
