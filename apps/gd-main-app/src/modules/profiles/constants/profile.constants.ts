/**
 * Username	6	30	Цифры, латинские буквы, _ и -
 * First Name	1	50	Латинские и русские буквы
 * Last Name	1	50	Латинские и русские буквы
 * Date of birth	-	-	Формат dd.mm.yyyy через календарь
 * About me	0	200	Буквы, цифры и спецсимволы
 */

export const firstAndLastNameConstraints = {
  minLength: 1,
  maxLength: 50,
};

export const dateOfBirthConstraints = {
  pattern: /^\d{2}\.\d{2}\.\d{4}$/,
  patternString: '^\\d{2}\\.\\d{2}\\.\\d{4}$',
};
