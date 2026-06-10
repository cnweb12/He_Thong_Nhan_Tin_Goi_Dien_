const USER_SETTING_DEFINITIONS = Object.freeze({
  theme: Object.freeze({
    path: "settings.theme",
    validate(value) {
      return ["light", "dark"].includes(value);
    },
    message: "Theme must be either 'light' or 'dark'",
  }),
  language: Object.freeze({
    path: "settings.language",
    validate(value) {
      const normalized = String(value || "").trim();
      return Boolean(normalized) && normalized.length <= 10;
    },
    message: "Language must be a non-empty string up to 10 characters",
  }),
  allowStrangerMessage: Object.freeze({
    path: "settings.allowStrangerMessage",
    validate(value) {
      return typeof value === "boolean";
    },
    message: "allowStrangerMessage must be a boolean",
  }),
  readReceiptEnabled: Object.freeze({
    path: "settings.readReceiptEnabled",
    validate(value) {
      return typeof value === "boolean";
    },
    message: "readReceiptEnabled must be a boolean",
  }),
});

const USER_SETTING_KEYS = Object.freeze(Object.keys(USER_SETTING_DEFINITIONS));

function getUnsupportedUserSettingKeys(settings = {}) {
  return Object.keys(settings).filter((key) => !USER_SETTING_DEFINITIONS[key]);
}

function validateUserSettingValue(key, value) {
  const definition = USER_SETTING_DEFINITIONS[key];
  if (!definition) {
    return { isValid: false, message: "Unsupported settings field" };
  }

  return {
    isValid: definition.validate(value),
    message: definition.message,
  };
}

function buildUserSettingsUpdate(settings = {}) {
  const $set = {};

  for (const key of USER_SETTING_KEYS) {
    if (settings[key] !== undefined) {
      $set[USER_SETTING_DEFINITIONS[key].path] = settings[key];
    }
  }

  return $set;
}

module.exports = {
  USER_SETTING_DEFINITIONS,
  USER_SETTING_KEYS,
  buildUserSettingsUpdate,
  getUnsupportedUserSettingKeys,
  validateUserSettingValue,
};
