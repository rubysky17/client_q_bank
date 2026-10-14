// react-native-mmkv switches to an in-memory store under Jest, but still imports Nitro's native
// module at load time. Stub it so any file touching MMKV (stores, storage) can be tested.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn() },
}));
