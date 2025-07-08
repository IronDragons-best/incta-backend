export const userNameConstraints = {
  minLength: 6,
  maxLength: 30,
  pattern: /^[a-zA-Z0-9_-]*$/,
};

export const userPasswordConstraints = {
  minLength: 6,
  maxLength: 20,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,20}$/,
};

export const userEmailConstraints = {
  pattern: /^[\w-]+(?:\.[\w-]+)*@([\w-]+\.)+[\w-]{2,}$/,
};
