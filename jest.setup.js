jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    displayNotification: jest.fn(() => Promise.resolve('1')),
    createTriggerNotification: jest.fn(() => Promise.resolve('1')),
    cancelNotification: jest.fn(() => Promise.resolve()),
    getTriggerNotifications: jest.fn(() => Promise.resolve([])),
    createChannel: jest.fn(() => Promise.resolve()),
    onBackgroundEvent: jest.fn(),
  },
  EventType: { PRESS: 0, DISMISSED: 1, DELIVERED: 2, APP_FOCUSED: 3 },
  TriggerType: { TIMESTAMP: 0, INTERVAL: 1 },
  RepeatFrequency: { NONE: 0, DAILY: 1, WEEKLY: 2, HOURLY: 3 },
  AndroidImportance: { LOW: 0, DEFAULT: 1, HIGH: 2 },
  AndroidStyle: { DEFAULT: 0, BIGTEXT: 1, BIGPICTURE: 2, INBOX: 3 },
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: { initializeApp: jest.fn() },
}));

jest.mock('@react-native-firebase/auth', () => {
  const mockAuth = {
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: '123' } })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: '123' } })),
    signOut: jest.fn(() => Promise.resolve()),
    currentUser: null,
  };
  return { __esModule: true, default: jest.fn(() => mockAuth) };
});

jest.mock('@react-native-firebase/firestore', () => {
  const mockQuerySnapshot = {
    docs: [],
    forEach: jest.fn(),
  };
  const mockCollection = {
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}), id: '1' })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      collection: jest.fn(() => mockCollection),
    })),
    add: jest.fn(() => Promise.resolve({ id: '1' })),
    where: jest.fn(() => mockCollection),
    orderBy: jest.fn(() => mockCollection),
    onSnapshot: jest.fn((cb) => { cb(mockQuerySnapshot); return jest.fn(); }),
    get: jest.fn(() => Promise.resolve(mockQuerySnapshot)),
  };
  const mockFirestore = {
    collection: jest.fn(() => mockCollection),
    settings: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockFirestore) };
});

const mockAuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0 };
jest.mock('@react-native-firebase/messaging', () => {
  const mockMessaging = {
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(() => jest.fn()),
    hasPermission: jest.fn(() => Promise.resolve(1)),
    AuthorizationStatus: mockAuthorizationStatus,
  };
  const fn = jest.fn(() => mockMessaging);
  fn.AuthorizationStatus = mockAuthorizationStatus;
  return { __esModule: true, default: fn };
});

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('react-native-gesture-handler', () => ({}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

jest.mock('react-native-screens', () => ({}));

jest.mock('react-native-localization', () => {
  return class LocalizedStrings {
    constructor(props) { Object.assign(this, props.en); }
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: { setString: jest.fn(), getString: jest.fn(() => Promise.resolve('')) },
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
